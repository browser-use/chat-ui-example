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
import { client } from "@/lib/api";
import * as api from "@/lib/api";
import { convertMessages, groupIntoTurns } from "@/lib/message-converter";
import type { UIMessage, ConversationTurn, SessionResponse, MessageResponse } from "@/lib/types";

interface SessionContextType {
  sessionId: string;
  session: SessionResponse | null;
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

// Session is done forever — no more tasks possible
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
  const [session, setSession] = useState<SessionResponse | null>(
    initialLiveUrl ? { id: sessionId, liveUrl: initialLiveUrl, status: "created" } as SessionResponse : null,
  );
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recordingUrls, setRecordingUrls] = useState<string[]>([]);
  const sendingRef = useRef(false);
  const recordingFetchedRef = useRef(false);

  const isTerminal = !!session && TERMINAL.has(session.status);
  const isBusy = session?.status === "running";

  // Stream messages using for-await on client.run()
  const streamTask = useCallback(
    async (task: string) => {
      setIsLoading(false);
      const run = client.run(task, { sessionId });

      // Update status to running immediately
      setSession((prev) => prev ? { ...prev, status: "running" } : prev);

      for await (const msg of run) {
        setRawMessages((prev) => {
          // Deduplicate by id
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      // Iterator done — session reached terminal state
      if (run.result) {
        setSession(run.result as unknown as SessionResponse);
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

      // Optimistic user message
      const tempMsg: MessageResponse = {
        id: `opt-${Date.now()}`,
        sessionId,
        role: "user",
        data: JSON.stringify({ content: task }),
        summary: task,
        createdAt: new Date().toISOString(),
      } as MessageResponse;
      setRawMessages((prev) => [...prev, tempMsg]);

      try {
        await streamTask(task);
      } catch (err) {
        console.error("Failed to send task:", err);
        // Remove optimistic message on failure
        setRawMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
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

    api.waitForRecording(sessionId).then((urls) => {
      if (urls.length) setRecordingUrls(urls);
    }).catch((err) => {
      console.error("Failed to fetch recording:", err);
    });
  }, [isTerminal, sessionId]);

  const stopTask = useCallback(async () => {
    try {
      await api.stopTask(sessionId);
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
