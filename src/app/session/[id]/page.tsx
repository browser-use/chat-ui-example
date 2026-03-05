"use client";

import { useParams } from "next/navigation";
import { useRef, useEffect } from "react";
import { SessionProvider, useSession } from "@/context/session-context";
import { ChatInput } from "@/components/chat-input";
import { ChatMessages } from "@/components/chat-messages";
import { BrowserPanel } from "@/components/browser-panel";

function SessionPage() {
  const { session, turns, isBusy, isTerminal, isSending, sendMessage, stopTask } =
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
  return (
    <SessionProvider sessionId={params.id}>
      <SessionPage />
    </SessionProvider>
  );
}
