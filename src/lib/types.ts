// ── API response types (re-exported from SDK) ──

export type {
  SessionResponse,
  MessageResponse,
  MessageListResponse,
  WorkspaceView,
} from "browser-use-sdk/v3";

// Parsed from data field (OpenAI format)
export interface ParsedMessageData {
  content?: string | ContentPart[] | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

export interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface OpenAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

// ── Profiles ──

export interface Profile {
  id: string;
  name?: string | null;
  createdAt: string;
}

// ── UI types ──

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: UIToolCall[];
  createdAt: string;
}

export interface UIToolCall {
  id: string;
  name: string;
  displayName: string;
  displayValue: string;
  args: Record<string, unknown>;
  status: ToolStatus;
  result?: string;
  isError?: boolean;
  type: ToolCallType;
}

export type ToolStatus = "pending" | "running" | "completed" | "error";

export type ToolCallType =
  | "browse"
  | "click"
  | "type"
  | "scroll"
  | "search"
  | "wait"
  | "screenshot"
  | "read_file"
  | "create_file"
  | "edit_file"
  | "bash"
  | "glob"
  | "grep"
  | "integration"
  | "unknown";

// ── Turn grouping ──

export interface TaskStep {
  id: string;
  title: string;
  status: "in_progress" | "completed" | "error";
  toolCalls: UIToolCall[];
}

export interface ConversationTurn {
  id: string;
  userMessage: UIMessage;
  steps: TaskStep[];
  finalContent: string;
  isComplete: boolean;
}
