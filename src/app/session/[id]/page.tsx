"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useRef, useEffect } from "react";
import { Download } from "lucide-react";
import { SessionProvider, useSession } from "@/context/session-context";
import { ChatInput } from "@/components/chat-input";
import { ChatMessages } from "@/components/chat-messages";
import { BrowserPanel } from "@/components/browser-panel";

function SessionPage() {
  const { session, turns, isBusy, isTerminal, isSending, recordingUrls, sendMessage, stopTask } =
    useSession();
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [turns]);

  const liveUrl = session?.liveUrl;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Chat column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          <div className="max-w-2xl mx-auto">
            <ChatMessages turns={turns} isBusy={isBusy} />

            {/* Recording links */}
            {recordingUrls.length > 0 && (
              <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Recording available
                </p>
                <div className="flex flex-col gap-2">
                  {recordingUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      {recordingUrls.length === 1
                        ? "Download recording (MP4)"
                        : `Download recording ${i + 1} (MP4)`}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          isProcessing={isBusy || isSending}
          onStop={stopTask}
          disabled={isTerminal}
          placeholder={
            isTerminal
              ? "Session has ended"
              : "Send a follow-up…"
          }
        />
      </div>

      {/* Browser panel — always visible on desktop */}
      <div className="hidden lg:block w-[55%] shrink-0">
        <BrowserPanel
          liveUrl={liveUrl}
          turns={turns}
          isSessionEnded={isTerminal}
        />
      </div>
    </div>
  );
}

export default function SessionPageWrapper() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const liveUrl = searchParams.get("liveUrl") ?? undefined;
  const initialTask = searchParams.get("task") ?? undefined;
  return (
    <SessionProvider sessionId={params.id} initialLiveUrl={liveUrl} initialTask={initialTask}>
      <SessionPage />
    </SessionProvider>
  );
}
