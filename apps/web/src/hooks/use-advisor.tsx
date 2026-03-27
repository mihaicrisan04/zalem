"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { api } from "@zalem/backend/convex/_generated/api";
import { useRecentlyViewed } from "./use-recently-viewed";

type AdvisorState = {
  isOpen: boolean;
  threadId: string | null;
  isLoading: boolean;
  open: (question?: string) => void;
  close: () => void;
  newChat: () => void;
  sendMessage: (question: string) => void;
  setProductId: (id: string | null) => void;
  pendingQuestion: string | null;
};

const AdvisorContext = createContext<AdvisorState | null>(null);

export function useAdvisor() {
  const ctx = useContext(AdvisorContext);
  if (!ctx) throw new Error("useAdvisor must be used within AdvisorProvider");
  return ctx;
}

export function AdvisorProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("zalem_advisor_thread") ?? null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const productIdRef = useRef<string | null>(null);

  const createThread = useMutation(api.ai.agent.createThread);
  const requestAdvice = useAction(api.ai.advisor.requestAdvice);
  const { recentlyViewedIds } = useRecentlyViewed();

  const setProductId = useCallback((id: string | null) => {
    productIdRef.current = id;
  }, []);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!isSignedIn) {
        toast.error("Sign in to use the advisor");
        return;
      }

      setIsLoading(true);
      setPendingQuestion(null);

      try {
        let currentThreadId = threadId;
        let isFirstMessage = false;

        // create thread first (instant mutation) so useUIMessages can subscribe
        if (!currentThreadId) {
          const result = await createThread({ userId: userId ?? undefined });
          currentThreadId = result.threadId;
          isFirstMessage = true;
          setThreadId(currentThreadId);
          sessionStorage.setItem("zalem_advisor_thread", currentThreadId);
        }

        // now stream into the thread (useUIMessages is already subscribed)
        await requestAdvice({
          threadId: currentThreadId,
          question,
          productId: productIdRef.current ?? undefined,
          recentlyViewedIds: recentlyViewedIds.length > 0 ? recentlyViewedIds : undefined,
          isFirstMessage,
        });
      } catch {
        toast.error("Failed to get advice. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [isSignedIn, userId, threadId, createThread, requestAdvice, recentlyViewedIds],
  );

  const open = useCallback(
    (question?: string) => {
      if (!isSignedIn) {
        toast.error("Sign in to use the advisor");
        return;
      }
      setIsOpen(true);
      if (question) {
        setPendingQuestion(question);
      }
    },
    [isSignedIn],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setPendingQuestion(null);
  }, []);

  const newChat = useCallback(() => {
    setThreadId(null);
    setPendingQuestion(null);
    sessionStorage.removeItem("zalem_advisor_thread");
  }, []);

  return (
    <AdvisorContext
      value={{
        isOpen,
        threadId,
        isLoading,
        open,
        close,
        newChat,
        sendMessage,
        setProductId,
        pendingQuestion,
      }}
    >
      {children}
    </AdvisorContext>
  );
}
