"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/chat-input";
import { SettingsBar } from "@/components/model-selector";
import { useSettings } from "@/context/settings-context";
import { createSession, sendTask } from "@/lib/api";

const SUGGESTIONS = [
  "Find the top 3 articles on Hacker News right now",
  "Search for flights from SF to NYC next weekend",
  "Go to GitHub trending and summarize the top repos",
  "Find a recipe for chocolate chip cookies",
];

export default function HomePage() {
  const router = useRouter();
  const { model, profileId, workspaceId, proxyCountryCode } = useSettings();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(message: string) {
    if (isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      const session = await createSession({
        model,
        enableRecording: true,
        ...(profileId && { profileId }),
        ...(workspaceId && { workspaceId }),
        ...(proxyCountryCode && { proxyCountryCode }),
      });
      router.push(`/session/${session.id}`);
      sendTask(session.id, message).catch((err) =>
        console.error("Failed to dispatch task:", err)
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to create session:", msg);
      setError(msg);
      setIsCreating(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-100">
            What should the agent do?
          </h1>
          <p className="text-sm text-zinc-500">
            It can browse the web, interact with pages, and report back.
          </p>
        </div>

        <div className="w-full">
          <ChatInput
            onSend={handleSend}
            disabled={isCreating}
            placeholder="Describe a task…"
            footer={<SettingsBar />}
          />
          {isCreating && (
            <p className="text-sm text-zinc-500 text-center mt-2">
              Starting session…
            </p>
          )}
          {error && (
            <p className="text-sm text-red-400 text-center mt-2 max-w-lg mx-auto break-all">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={isCreating}
              className="px-3 py-1.5 text-[13px] text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 hover:text-zinc-300 transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
