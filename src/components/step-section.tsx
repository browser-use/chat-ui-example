"use client";

import { useState } from "react";
import { Check, X, ChevronUp } from "lucide-react";
import type { TaskStep } from "@/lib/types";
import { ToolCallPill } from "./tool-call-pill";
import { ThinkingIndicator } from "./thinking-indicator";

export function StepSection({ step }: { step: TaskStep }) {
  const [expanded, setExpanded] = useState(true);

  const isCompleted = step.status === "completed";
  const isError = step.status === "error";

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left py-1.5 group"
      >
        {step.status === "in_progress" ? (
          <ThinkingIndicator label={step.title} />
        ) : (
          <>
            <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0">
              {isCompleted ? (
                <div className="w-[18px] h-[18px] rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-500" strokeWidth={2.5} />
                </div>
              ) : isError ? (
                <div className="w-[18px] h-[18px] rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-3 h-3 text-red-500" strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-[18px] h-[18px] rounded-full border border-zinc-300 dark:border-zinc-700" />
              )}
            </div>
            <span className="text-[14px] text-zinc-800 dark:text-zinc-200 font-medium">
              {isError ? "Stopped" : step.title}
            </span>
          </>
        )}
        <ChevronUp
          className={`w-4 h-4 ml-auto text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-transform ${
            expanded ? "rotate-0" : "rotate-180"
          }`}
        />
      </button>

      {expanded && (
        <div className="pl-[26px] mt-2 space-y-1">
          {step.toolCalls.map((tc) => (
            <ToolCallPill key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}
    </div>
  );
}
