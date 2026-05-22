"use client";

import type { ConversationTurn } from "@/lib/types";
import { Markdown } from "./markdown";
import { StepSection } from "./step-section";
import { ThinkingIndicator } from "./thinking-indicator";

interface ChatMessagesProps {
  turns: ConversationTurn[];
  isBusy: boolean;
}

export function ChatMessages({ turns, isBusy }: ChatMessagesProps) {
  return (
    <div className="space-y-8">
      {turns.map((turn) => (
        <div key={turn.id} className="space-y-4">
          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-zinc-200 dark:bg-zinc-800 rounded-2xl px-4 py-2.5 max-w-[480px] text-[15px] text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
              {turn.userMessage.content}
            </div>
          </div>

          {/* Steps */}
          {turn.steps.map((step) => (
            <StepSection key={step.id} step={step} />
          ))}

          {/* Final answer */}
          {turn.finalContent && (
            <div className="text-[15px] text-zinc-800 dark:text-zinc-200 leading-relaxed">
              <Markdown>{turn.finalContent}</Markdown>
            </div>
          )}

          {/* Thinking indicator for incomplete turn */}
          {!turn.isComplete && isBusy && turn.steps.length === 0 && (
            <ThinkingIndicator label="Starting\u2026" />
          )}
        </div>
      ))}

      {/* Global thinking: busy but no turns yet, or last turn is complete and still busy */}
      {isBusy &&
        (turns.length === 0 ||
          turns[turns.length - 1]?.isComplete) && (
          <ThinkingIndicator label="Thinking\u2026" />
        )}
    </div>
  );
}
