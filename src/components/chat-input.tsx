"use client";

import { useState, useRef, useCallback, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isProcessing?: boolean;
  onStop?: () => void;
  footer?: ReactNode;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = "What should the agent do?",
  isProcessing,
  onStop,
  footer,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="w-full px-4 pb-4 pt-2">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors shadow-sm dark:shadow-none">
          <div className="flex items-end gap-2 p-3">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 resize-none outline-none text-[15px] leading-relaxed min-h-[24px] max-h-[200px]"
            />
            <div className="flex items-center gap-2 shrink-0">
              {isProcessing ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors"
                  title="Stop"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                    <rect width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!value.trim() || disabled}
                  className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-zinc-900 dark:disabled:hover:bg-white flex items-center justify-center transition-colors"
                  title="Send"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" className="dark:stroke-black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {footer && <div className="flex items-center justify-end gap-1 px-3 pb-2">{footer}</div>}
        </div>
      </form>
    </div>
  );
}
