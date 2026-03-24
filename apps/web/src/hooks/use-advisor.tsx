"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useAction } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { api } from "@zalem/backend/convex/_generated/api";

type AdvisorState = {
  isOpen: boolean;
  threadId: string | null;
  isLoading: boolean;
  open: (question?: string) => void;
  close: () => void;
  sendMessage: (question: string) => void;
  pendingQuestion: string | null;
};

const AdvisorContext = createContext<AdvisorState | null>(null);

export function useAdvisor() {
  const ctx = useContext(AdvisorContext);
  if (!ctx) throw new Error("useAdvisor must be used within AdvisorProvider");
  return ctx;
}

export function AdvisorProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("zalem_advisor_thread") ?? null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  const requestAdvice = useAction(api.ai.advisor.requestAdvice);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!isSignedIn) {
        toast.error("Sign in to use the advisor");
        return;
      }

      setIsLoading(true);
      setPendingQuestion(null);

      try {
        const result = await requestAdvice({
          threadId: threadId ?? undefined,
          question,
        });

        if (result.threadId && result.threadId !== threadId) {
          setThreadId(result.threadId);
          sessionStorage.setItem("zalem_advisor_thread", result.threadId);
        }
      } catch (e) {
        toast.error("Failed to get advice. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [isSignedIn, threadId, requestAdvice],
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

  return (
    <AdvisorContext
      value={{
        isOpen,
        threadId,
        isLoading,
        open,
        close,
        sendMessage,
        pendingQuestion,
      }}
    >
      {children}
    </AdvisorContext>
  );
}
