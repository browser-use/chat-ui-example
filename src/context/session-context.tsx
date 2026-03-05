"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { convertMessages, groupIntoTurns } from "@/lib/message-converter";
import type { UIMessage, ConversationTurn, SessionResponse } from "@/lib/types";

interface SessionContextType {
  sessionId: string;
  session: SessionResponse | null;
  messages: UIMessage[];
  turns: ConversationTurn[];
  isLoading: boolean;
  isBusy: boolean;
  isTerminal: boolean;
  isSending: boolean;
  sendMessage: (task: string) => Promise<void>;
  stopTask: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

const TERMINAL = new Set(["stopped", "completed", "error", "timed_out"]);

export function SessionProvider({
  sessionId,
  children,
}: {
  sessionId: string;
  children: ReactNode;
}) {
  const [optimistic, setOptimistic] = useState<UIMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  // Poll session
  const { data: session } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.getSession(sessionId),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s && TERMINAL.has(s) ? false : 1000;
    },
  });

  const isTerminal = !!session && TERMINAL.has(session.status);
  const isActive = !!session && !isTerminal;
  const isBusy = session?.status === "running";

  // Poll messages
  const { data: rawResponse, isLoading } = useQuery({
    queryKey: ["messages", sessionId],
    queryFn: () => api.getMessages(sessionId),
    refetchInterval: isActive ? 1000 : false,
  });

  // Convert messages (memoized to avoid re-running on every render)
  const serverMessages = useMemo(
    () => (rawResponse ? convertMessages(rawResponse.messages) : []),
    [rawResponse],
  );

  // Filter optimistic: remove if server has a matching user message
  const allMessages = useMemo(() => {
    const serverUserContents = new Set(
      serverMessages.filter((m) => m.role === "user").map((m) => m.content)
    );
    const pendingOptimistic = optimistic.filter(
      (m) => !serverUserContents.has(m.content)
    );
    return [...serverMessages, ...pendingOptimistic];
  }, [serverMessages, optimistic]);

  const turns = useMemo(() => groupIntoTurns(allMessages), [allMessages]);

  const sendMessage = useCallback(
    async (task: string) => {
      if (sendingRef.current) return;
      sendingRef.current = true;
      setIsSending(true);

      const tempMsg: UIMessage = {
        id: `opt-${Date.now()}`,
        role: "user",
        content: task,
        createdAt: new Date().toISOString(),
      };
      setOptimistic((prev) => [...prev, tempMsg]);

      try {
        await api.sendTask(sessionId, task);
      } catch (err) {
        console.error("Failed to send task:", err);
        setOptimistic((prev) => prev.filter((m) => m.id !== tempMsg.id));
      } finally {
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [sessionId]
  );

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
        session: session ?? null,
        messages: allMessages,
        turns,
        isLoading,
        isBusy,
        isTerminal,
        isSending,
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
