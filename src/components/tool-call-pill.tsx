"use client";

import { useState, type ReactNode } from "react";
import {
  Compass, MousePointer2, ArrowDown, Search, Clock,
  FilePlus, FileSearch, FileEdit, Terminal, Globe,
  Keyboard, Loader2, Camera, Wrench,
} from "lucide-react";
import type { UIToolCall } from "@/lib/types";

function getIcon(type: string): ReactNode {
  const cls = "w-2.5 h-2.5 text-zinc-500";
  switch (type) {
    case "browse":     return <Compass className={cls} />;
    case "click":
    case "move":       return <MousePointer2 className={cls} />;
    case "scroll":     return <ArrowDown className={cls} />;
    case "search":
    case "glob":
    case "grep":       return <Search className={cls} />;
    case "wait":       return <Clock className={cls} />;
    case "screenshot": return <Camera className={cls} />;
    case "create_file": return <FilePlus className={cls} />;
    case "edit_file":  return <FileEdit className={cls} />;
    case "read_file":  return <FileSearch className={cls} />;
    case "bash":       return <Terminal className={cls} />;
    case "send_keys":
    case "type":       return <Keyboard className={cls} />;
    case "integration":
    case "integration_search": return <Wrench className={cls} />;
    default:           return <Globe className={cls} />;
  }
}

export function ToolCallPill({ toolCall }: { toolCall: UIToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = toolCall.status === "running" || toolCall.status === "pending";

  return (
    <div className="flex items-start my-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-2 bg-zinc-800 pl-2 pr-3 py-1.5 rounded-md text-[13px] hover:bg-zinc-700/80 transition-colors"
      >
        <div className="w-[18px] h-[18px] rounded-full border border-zinc-700 flex items-center justify-center shrink-0">
          {isRunning ? (
            <Loader2 className="w-2.5 h-2.5 text-zinc-500 animate-spin" />
          ) : (
            getIcon(toolCall.type)
          )}
        </div>
        <span className="text-zinc-200 font-medium">{toolCall.displayName}</span>
        {toolCall.displayValue && (
          <span className="text-zinc-500 font-mono text-[12px] truncate max-w-[350px]">
            {toolCall.displayValue}
          </span>
        )}
      </button>

      {expanded && toolCall.result && (
        <pre className="mt-1 ml-7 p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-[12px] text-zinc-400 overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap">
          {toolCall.result.slice(0, 2000)}
        </pre>
      )}
    </div>
  );
}
