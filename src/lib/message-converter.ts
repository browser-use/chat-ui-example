import type {
  MessageResponse,
  ParsedMessageData,
  ContentPart,
  UIMessage,
  UIToolCall,
  ConversationTurn,
  TaskStep,
} from "./types";
import { getToolType, getToolLabel, getToolDisplayValue, isHiddenTool } from "./tool-labels";

/**
 * Convert raw API messages → UIMessage[].
 * Two-pass: first collect tool results by tool_call_id, then build UI messages.
 */
export function convertMessages(raw: MessageResponse[]): UIMessage[] {
  // Filter hidden messages
  const visible = raw.filter((m) => !m.hidden);

  // Parse data fields
  const parsed = visible.map((m) => ({
    ...m,
    parsed: safeParseData(m.data),
  }));

  // Pass 1: collect tool results keyed by tool_call_id
  const toolResults = new Map<string, string>();
  for (const msg of parsed) {
    if (msg.role === "tool" && msg.parsed.tool_call_id) {
      toolResults.set(msg.parsed.tool_call_id, extractTextContent(msg.parsed.content));
    }
  }

  // Pass 2: convert user + assistant messages
  const result: UIMessage[] = [];

  for (const msg of parsed) {
    if (msg.role === "tool") continue;

    if (msg.role === "user") {
      const content = stripWrappers(extractTextContent(msg.parsed.content));
      if (!content) continue;
      result.push({
        id: msg.id,
        role: "user",
        content,
        createdAt: msg.createdAt,
      });
      continue;
    }

    if (msg.role === "assistant") {
      const content = extractTextContent(msg.parsed.content);
      const toolCalls: UIToolCall[] = [];

      if (msg.parsed.tool_calls) {
        for (const tc of msg.parsed.tool_calls) {
          if (!tc?.function) continue;
          const name = tc.function.name;
          if (isHiddenTool(name)) continue;

          let args: Record<string, unknown> = {};
          try {
            if (tc.function.arguments) args = JSON.parse(tc.function.arguments);
          } catch { /* ignore */ }

          const hasResult = toolResults.has(tc.id);
          toolCalls.push({
            id: tc.id,
            name,
            displayName: getToolLabel(name, hasResult ? "completed" : "running"),
            displayValue: getToolDisplayValue(name, args),
            args,
            status: hasResult ? "completed" : "running",
            result: toolResults.get(tc.id),
            type: getToolType(name),
          });
        }
      }

      // Skip empty assistant messages with no tool calls
      if (!content && toolCalls.length === 0) continue;

      result.push({
        id: msg.id,
        role: "assistant",
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        createdAt: msg.createdAt,
      });
    }
  }

  return result;
}

/**
 * Group UIMessages into conversation turns (user → assistant response).
 */
export function groupIntoTurns(messages: UIMessage[]): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];
    if (msg.role === "user") {
      const userMsg = msg;
      const assistantMsgs: UIMessage[] = [];

      i++;
      while (i < messages.length && messages[i].role === "assistant") {
        assistantMsgs.push(messages[i]);
        i++;
      }

      const steps: TaskStep[] = [];
      let finalContent = "";
      let stepCounter = 0;

      for (const aMsg of assistantMsgs) {
        if (aMsg.toolCalls && aMsg.toolCalls.length > 0) {
          stepCounter++;
          const allDone = aMsg.toolCalls.every(
            (tc) => tc.status === "completed" || tc.status === "error"
          );
          steps.push({
            id: `step-${userMsg.id}-${stepCounter}`,
            title: extractStepTitle(aMsg.content) || `Step ${stepCounter}`,
            status: allDone ? "completed" : "in_progress",
            toolCalls: aMsg.toolCalls,
          });
        }
        if (aMsg.content) {
          finalContent = aMsg.content;
        }
      }

      const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
      const isComplete =
        assistantMsgs.length > 0 &&
        !!lastAssistant.content &&
        (!lastAssistant.toolCalls ||
          lastAssistant.toolCalls.every(
            (tc) => tc.status === "completed" || tc.status === "error"
          ));

      turns.push({
        id: `turn-${userMsg.id}`,
        userMessage: userMsg,
        steps,
        finalContent,
        isComplete,
      });
    } else {
      i++;
    }
  }

  return turns;
}

// ── Helpers ──

function safeParseData(data: string): ParsedMessageData {
  try {
    return JSON.parse(data);
  } catch {
    return { content: data };
  }
}

function extractTextContent(content: string | ContentPart[] | null | undefined): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content
    .filter((part): part is ContentPart & { text: string } => part.type === "text" && !!part.text)
    .map((part) => part.text)
    .join("\n");
}

// Strip backend wrappers from user messages
const FILE_CONTEXT_PATTERN = /\n\n\[Attached files uploaded to workspace:\]\n[\s\S]*$/;
const USER_REQUEST_PATTERN = /<user_request>\n?([\s\S]*?)\n?<\/user_request>/;

function stripWrappers(text: string): string {
  let result = text.replace(FILE_CONTEXT_PATTERN, "").trimEnd();
  if (result.includes("<structured_output>")) {
    const match = result.match(USER_REQUEST_PATTERN);
    if (match) result = match[1]!.trim();
  }
  return result;
}

function extractStepTitle(content: string): string | null {
  if (!content) return null;
  const firstLine = content.split("\n")[0]?.trim() ?? "";
  if (firstLine.length > 10 && firstLine.length < 120) {
    return firstLine
      .replace(
        /^(I will |I'll |I am |I'm |Let me |Now I will |Now I'll |Next,? I will |Next,? I'll |First,? I will |First,? I'll )/i,
        ""
      )
      .replace(/^\w/, (c) => c.toUpperCase());
  }
  return null;
}
