"use client";

import { useChat } from "ai/react";
import { useJewelryStore } from "@/stores/jewelryStore";
import ChatInterface from "@/components/ChatInterface";
import GenerateButton from "@/components/GenerateButton";
import ImageGallery from "@/components/ImageGallery";
import { Message, AIQuestion, QAExchange } from "@/types";
import { useState, useCallback } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowRight } from "lucide-react";

// Parse a JSON block from an AI message
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
    designContext,
    images,
    setDesignContext,
    setImages,
    setAppState,
    setError,
    error,
    reset,
  } = useJewelryStore();

  // Q&A history for display (completed exchanges)
  const [qaHistory, setQaHistory] = useState<QAExchange[]>([]);
  // The current pending question (if the last AI message was a question)
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(
    null,
  );
  // Whether to show the free-text input (for "Other" choice)
  const [showCustomInput, setShowCustomInput] = useState(false);

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
        parsed.params &&
        parsed.summary
      ) {
        setCurrentQuestion(null);
        setDesignContext({
          params: parsed.params as unknown as Parameters<
            typeof setDesignContext
          >[0]["params"],
          summary: parsed.summary as string,
        });
      }
    },
    onError: (err) => {
      setError(err.message ?? "Chat error. Please try again.");
    },
  });

  // Called when user taps a choice card OR submits custom text
  const handleAnswer = useCallback(
    async (answer: string) => {
      if (!answer.trim()) return;

      // Record the exchange in history
      if (currentQuestion) {
        setQaHistory((prev) => [
          ...prev,
          { question: currentQuestion.question, answer },
        ]);
      }
      setCurrentQuestion(null);
      setShowCustomInput(false);

      // Send the answer as a user message
      await append({ role: "user", content: answer });
    },
    [currentQuestion, append],
  );

  const handleGenerate = async () => {
    const { designContext } = useJewelryStore.getState();
    if (!designContext) return;

    setAppState("generating");
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params: designContext.params }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Generation failed");
      }

      const { images } = await res.json();
      setImages(images);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Image generation failed";
      setError(message);
      setAppState("ready");
    }
  };

  const handleReset = () => {
    reset();
    setMessages([]);
    setQaHistory([]);
    setCurrentQuestion(null);
    setShowCustomInput(false);
  };

  // Kick off the conversation if idle
  const handleStart = async () => {
    setAppState("gathering");
    await append({ role: "user", content: "I want to design some jewelry." });
  };

  const typedMessages = messages as unknown as Message[];
  const isIdle = appState === "idle";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "3rem 1.5rem 5rem",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <header
        style={{
          width: "100%",
          maxWidth: "860px",
          marginBottom: "2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Evol logo — always visible */}
        <Image
          src="/evol-logo.webp"
          alt="EVOL Jewels"
          width={120}
          height={48}
          style={{ objectFit: "contain", objectPosition: "left" }}
          priority
        />

        {/* Start over — only shown once started */}
        {appState !== "idle" && (
          <button
            onClick={handleReset}
            style={{
              padding: "0.5rem 1.1rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              background: "none",
              border: "1px solid var(--cream-border)",
              borderRadius: "8px",
              cursor: "pointer",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--text-primary)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--cream-border)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-muted)";
            }}
          >
            Start Over
          </button>
        )}
      </header>

      {/* ── Main content column ─────────────────────────────── */}
      <div
        style={{
          width: "100%",
          maxWidth: "860px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2.5rem",
        }}
      >
        {/* IDLE — welcome state */}
        {isIdle && (
          <div
            className="animate-fade-up"
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2.5rem",
              padding: "4rem 2.5rem",
              background: "var(--white)",
              border: "1px solid var(--cream-border)",
              borderRadius: "24px",
              width: "100%",
            }}
          >
            {/* Heading + subheading */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.9rem",
              }}
            >
              <h2
                className="font-display"
                style={{
                  fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                Create your own Evol Jewelry Design
              </h2>
              <p
                style={{
                  fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
                  color: "var(--text-secondary)",
                  maxWidth: "460px",
                  lineHeight: 1.65,
                  fontWeight: 300,
                  margin: "0 auto",
                }}
              >
                Answer a few questions and get jewelry designs crafted just for
                you.
              </p>
            </div>

            {/* Clean minimal button */}
            <button
              onClick={handleStart}
              style={{
                padding: "0.95rem 3rem",
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--white)",
                background: "var(--text-primary)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "0.8";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "1";
              }}
            >
              <span>Begin Designing</span>
              <ArrowRight />
            </button>
          </div>
        )}

        {/* GATHERING / ACTIVE — Q&A interface */}
        {appState !== "idle" && (
          <ChatInterface
            qaHistory={qaHistory}
            currentQuestion={currentQuestion}
            isLoading={isLoading}
            showCustomInput={showCustomInput}
            onChoiceSelected={handleAnswer}
            onShowCustomInput={() => setShowCustomInput(true)}
            typedMessages={typedMessages}
          />
        )}

        {/* Error banner */}
        {error && (
          <div
            className="animate-fade-up"
            style={{
              width: "100%",
              padding: "1rem 1.5rem",
              background: "#FFF5F5",
              border: "1.5px solid #FECACA",
              borderRadius: "16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
            }}
          >
            <span
              style={{ color: "#EF4444", fontSize: "1.2rem", flexShrink: 0 }}
            >
              <AlertTriangle />
            </span>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  color: "#B91C1C",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: "0.2rem",
                }}
              >
                Something went wrong
              </p>
              <p style={{ color: "#DC2626", fontSize: "0.9rem" }}>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                color: "#EF4444",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2rem",
                lineHeight: 1,
                padding: "0.1rem",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* READY / GENERATING — design summary + CTA */}
        {(appState === "ready" || appState === "generating") &&
          designContext && (
            <GenerateButton
              onClick={handleGenerate}
              designContext={designContext}
              isGenerating={appState === "generating"}
            />
          )}

        {/* GENERATING / DONE — image gallery */}
        {(appState === "generating" || appState === "done") && (
          <ImageGallery images={images} isLoading={appState === "generating"} />
        )}

        {/* DONE — start over prompt */}
        {appState === "done" && images.length > 0 && (
          <div
            className="animate-fade-up"
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.2rem",
            }}
          >
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
              Tap any image to view it full size
            </p>
            <button
              onClick={handleReset}
              style={{
                color: "var(--gold-dark)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
                textTransform: "uppercase",
              }}
            >
              Design Something Else →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
