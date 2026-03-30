"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { stopTask as stopTaskAction, waitForRecording } from "@/lib/actions";
import { convertMessages, groupIntoTurns } from "@/lib/message-converter";
import type { UIMessage, ConversationTurn, MessageResponse } from "@/lib/types";

interface SessionState {
  id: string;
  liveUrl?: string | null;
  status: string;
  output?: unknown;
}

interface SessionContextType {
  sessionId: string;
  session: SessionState | null;
  messages: UIMessage[];
  turns: ConversationTurn[];
  isLoading: boolean;
  isBusy: boolean;
  isTerminal: boolean;
  isSending: boolean;
  recordingUrls: string[];
  sendMessage: (task: string) => Promise<void>;
  stopTask: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

const TERMINAL = new Set(["stopped", "error", "timed_out"]);

export function SessionProvider({
  sessionId,
  initialLiveUrl,
  initialTask,
  children,
}: {
  sessionId: string;
  initialLiveUrl?: string;
  initialTask?: string;
  children: ReactNode;
}) {
  const [rawMessages, setRawMessages] = useState<MessageResponse[]>([]);
  const [session, setSession] = useState<SessionState | null>(
    initialLiveUrl ? { id: sessionId, liveUrl: initialLiveUrl, status: "created" } : null,
  );
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(!!initialTask);
  const [recordingUrls, setRecordingUrls] = useState<string[]>([]);
  const sendingRef = useRef(false);
  const recordingFetchedRef = useRef(false);

  const isTerminal = !!session && TERMINAL.has(session.status);
  const isBusy = session?.status === "running";

  // Stream messages from the SSE route handler
  const streamTask = useCallback(
    async (task: string) => {
      setIsLoading(false);
      setSession((prev) => prev ? { ...prev, status: "running" } : prev);

      const res = await fetch(`/api/stream/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = JSON.parse(line.slice(6));

          if (json.__done) {
            const { __done, ...result } = json;
            setSession(result as SessionState);
          } else if (json.__error) {
            console.error("Stream error:", json.message);
          } else {
            const msg = json as MessageResponse;
            setRawMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      }
    },
    [sessionId],
  );

  // Convert raw API messages → UI messages
  const serverMessages = useMemo(
    () => convertMessages(rawMessages),
    [rawMessages],
  );

  const turns = useMemo(() => groupIntoTurns(serverMessages), [serverMessages]);

  const sendMessage = useCallback(
    async (task: string) => {
      if (sendingRef.current) return;
      sendingRef.current = true;
      setIsSending(true);

      try {
        // The stream already includes the user message — no optimistic insert needed
        await streamTask(task);
      } catch (err) {
        console.error("Failed to send task:", err);
        // Reset to idle so the user can retry — don't mark as terminal error
        // since this could be a transient network issue, not a session failure
        setSession((prev) => prev ? { ...prev, status: "idle" } : prev);
      } finally {
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [sessionId, streamTask],
  );

  // Auto-run initial task from URL params
  const initialTaskRef = useRef(initialTask);
  useEffect(() => {
    if (!initialTaskRef.current) return;
    const task = initialTaskRef.current;
    initialTaskRef.current = undefined;
    sendMessage(task);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch recording URLs when session reaches terminal state
  useEffect(() => {
    if (!isTerminal || recordingFetchedRef.current) return;
    recordingFetchedRef.current = true;

    waitForRecording(sessionId).then((urls) => {
      if (urls.length) setRecordingUrls(urls);
    }).catch((err) => {
      console.error("Failed to fetch recording:", err);
    });
  }, [isTerminal, sessionId]);

  const stopTask = useCallback(async () => {
    try {
      await stopTaskAction(sessionId);
    } catch (err) {
      console.error("Failed to stop:", err);
    }
  }, [sessionId]);

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        session,
        messages: serverMessages,
        turns,
        isLoading,
        isBusy,
        isTerminal,
        isSending,
        recordingUrls,
        sendMessage,
        stopTask,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be inside SessionProvider");
  return ctx;
}
