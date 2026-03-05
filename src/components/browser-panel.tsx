"use client";

import { useMemo } from "react";
import type { ConversationTurn } from "@/lib/types";

interface BrowserPanelProps {
  liveUrl: string | null | undefined;
  turns: ConversationTurn[];
  isSessionEnded: boolean;
}

/** Extract the last browsed URL from turns. */
function extractCurrentUrl(turns: ConversationTurn[]): string {
  for (let i = turns.length - 1; i >= 0; i--) {
    const turn = turns[i];
    for (let j = turn.steps.length - 1; j >= 0; j--) {
      const tcs = turn.steps[j].toolCalls;
      for (let k = tcs.length - 1; k >= 0; k--) {
        if (tcs[k].type === "browse" && tcs[k].displayValue) {
          return tcs[k].displayValue;
        }
      }
    }
  }
  return "";
}

export function BrowserPanel({ liveUrl, turns, isSessionEnded }: BrowserPanelProps) {
  const currentUrl = useMemo(() => extractCurrentUrl(turns), [turns]);

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-300 dark:border-zinc-800">
      {/* Header */}
      <div className="h-11 border-b border-zinc-300 dark:border-zinc-800 flex items-center px-4">
        <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
          Agent&apos;s Browser
        </span>
      </div>

      {/* URL bar */}
      <div className="h-8 border-b border-zinc-300 dark:border-zinc-800 flex items-center px-4 gap-2">
        <span className="text-[11px] text-zinc-500 dark:text-zinc-500">
          {isSessionEnded ? "Session ended" : currentUrl || "Waiting\u2026"}
        </span>
      </div>

      {/* Browser view */}
      <div className="flex-1 bg-white dark:bg-zinc-900 relative overflow-hidden">
        {liveUrl ? (
          <iframe
            src={liveUrl}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-600 text-sm">
            {isSessionEnded
              ? "Session has ended"
              : "Browser will appear here when the agent starts browsing"}
          </div>
        )}
      </div>
    </div>
  );
}
