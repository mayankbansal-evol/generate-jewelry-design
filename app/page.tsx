"use client";

import { useChat } from "ai/react";
import { useJewelryStore } from "@/stores/jewelryStore";
import ChatInterface from "@/components/ChatInterface";
import ImageGallery from "@/components/ImageGallery";
import PromptInput from "@/components/PromptInput";
import { Message, AIQuestion, QAExchange } from "@/types";
import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

function parseAIMessage(
  content: string,
):
  | AIQuestion
  | { status: string; summary: string; params: Record<string, unknown> }
  | null {
  const match = content.match(/```json\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export default function JewelryBuilder() {
  const {
    appState,
    images,
    setImages,
    setAppState,
    setError,
    error,
    reset,
  } = useJewelryStore();

  const [qaHistory, setQaHistory] = useState<QAExchange[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  // Prevent sending the initial prompt twice
  const promptSentRef = useRef(false);

  // Auto-generate when LLM sends status:ready
  const triggerGeneration = useCallback(async (params: Record<string, unknown>) => {
    setAppState("generating");
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Generation failed");
      }
      const { images } = await res.json();
      setImages(images);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Image generation failed";
      setError(message);
      setAppState("done");
    }
  }, [setAppState, setError, setImages]);

  const { messages, append, isLoading, setMessages } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      const parsed = parseAIMessage(message.content);
      if (!parsed) return;

      if ("type" in parsed && parsed.type === "question") {
        setCurrentQuestion(parsed as AIQuestion);
        setShowCustomInput(false);
      } else if (
        "status" in parsed &&
        parsed.status === "ready" &&
        parsed.params
      ) {
        setCurrentQuestion(null);
        triggerGeneration(parsed.params);
      }
    },
    onError: (err) => {
      setError(err.message ?? "Chat error. Please try again.");
    },
  });

  // Called when the user submits their initial free-form description from PromptInput
  const handleInitialPrompt = useCallback(async (description: string) => {
    if (promptSentRef.current) return;
    promptSentRef.current = true;

    setAppState("gathering");

    // Record the initial description as the first Q&A exchange
    setQaHistory([{ question: "What kind of jewelry do you want?", answer: description }]);

    // Send directly to LLM — it drives all follow-up questions
    await append({ role: "user", content: description });
  }, [append, setAppState]);

  // Called when the user selects an answer to a follow-up question
  const handleAnswer = useCallback(
    async (answer: string) => {
      if (!answer.trim()) return;

      if (currentQuestion) {
        setQaHistory((prev) => [
          ...prev,
          { question: currentQuestion.question, answer },
        ]);
      }
      setCurrentQuestion(null);
      setShowCustomInput(false);

      await append({ role: "user", content: answer });
    },
    [currentQuestion, append],
  );

  const handleReset = () => {
    reset();
    setMessages([]);
    setQaHistory([]);
    setCurrentQuestion(null);
    setShowCustomInput(false);
    promptSentRef.current = false;
  };

  const typedMessages = messages as unknown as Message[];
  const isIdle = appState === "idle";

  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-4 sm:px-6 py-12 pb-20">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="w-full max-w-3xl mb-10 flex items-center justify-between">
        <Image
          src="/evol-logo.webp"
          alt="EVOL Jewels"
          width={110}
          height={44}
          className="object-contain object-left"
          priority
        />
        {appState !== "idle" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer"
          >
            Start Over
          </Button>
        )}
      </header>

      {/* ── Content column ──────────────────────────────────────── */}
      <div className="w-full max-w-3xl flex flex-col items-center gap-8">

        {/* IDLE — freeform prompt input (wireframe style), centered in viewport */}
        {isIdle && (
          <div className="flex-1 flex items-center justify-center w-full min-h-[calc(100vh-12rem)]">
            <PromptInput onSubmit={handleInitialPrompt} isLoading={isLoading} />
          </div>
        )}

        {/* GATHERING — Q&A flow (after initial prompt is submitted) */}
        {appState === "gathering" && (
          <ChatInterface
            qaHistory={qaHistory}
            currentQuestion={currentQuestion}
            isLoading={isLoading}
            showCustomInput={showCustomInput}
            onChoiceSelected={handleAnswer}
            onShowCustomInput={() => setShowCustomInput(true)}
            onHideCustomInput={() => setShowCustomInput(false)}
            typedMessages={typedMessages}
          />
        )}

        {/* Keep Q&A history visible during generation and done states */}
        {(appState === "generating" || appState === "done") && qaHistory.length > 0 && (
          <ChatInterface
            qaHistory={qaHistory}
            currentQuestion={null}
            isLoading={false}
            showCustomInput={false}
            onChoiceSelected={() => {}}
            onShowCustomInput={() => {}}
            onHideCustomInput={() => {}}
            typedMessages={typedMessages}
          />
        )}

        {/* Error banner */}
        {error && (
          <div className="animate-fade-up w-full flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-xl p-4">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-destructive font-semibold text-sm">Something went wrong</p>
              <p className="text-destructive/80 text-sm mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="text-destructive/50 hover:text-destructive transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* GENERATING / DONE — image gallery */}
        {(appState === "generating" || appState === "done") && (
          <ImageGallery images={images} isLoading={appState === "generating"} />
        )}

        {/* DONE — start over */}
        {appState === "done" && images.length > 0 && (
          <div className="animate-fade-up flex flex-col items-center gap-3 text-center">
            <button
              onClick={handleReset}
              className="text-[--gold-dark] font-bold text-xs uppercase tracking-widest underline underline-offset-4 hover:opacity-70 transition-opacity cursor-pointer"
            >
              Design Something Else →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
