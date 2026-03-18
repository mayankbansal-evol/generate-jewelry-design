'use client'

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { useJewelryStore, getActiveConversation } from '@/stores/jewelryStore'
import type { ChatMessage, JewelryParams, GeneratedImage } from '@/types'
import MessageBubble from '@/components/MessageBubble'
import { cn } from '@/lib/utils'
import { ArrowUp, Loader2 } from 'lucide-react'

// ── Helper ───────────────────────────────────────────────────────
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function ChatScreen() {
  const {
    isGenerating,
    setIsGenerating,
    error,
    setError,
    addMessage,
    updateLastAssistantMessage,
    setCurrentParams,
    persistActiveConversation,
  } = useJewelryStore()

  const activeConversation = useJewelryStore(getActiveConversation)

  const [inputValue, setInputValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasTriggeredInitial = useRef(false)

  // Get the latest chips from the last assistant message
  const messages = activeConversation?.messages ?? []
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant' && !m.isLoading)
  const latestChips = lastAssistantMsg?.chips ?? []

  // ── Auto-scroll to bottom on new messages ─────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, messages[messages.length - 1]?.isLoading])

  // ── Auto-grow textarea ────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [inputValue])

  // ── Trigger initial generation when conversation starts ───────
  // The first user message is added by startNewConversation,
  // we need to trigger the API call for it
  useEffect(() => {
    if (!activeConversation || hasTriggeredInitial.current) return
    if (activeConversation.messages.length === 1 && activeConversation.messages[0].role === 'user') {
      // First time seeing this conversation — trigger generation
      hasTriggeredInitial.current = true
      handleGenerate(activeConversation.messages[0].content)
    } else {
      hasTriggeredInitial.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id])

  // ── Generate images from prompt ───────────────────────────────
  const handleGenerate = useCallback(async (prompt: string) => {
    setIsGenerating(true)
    setError(null)

    // Add loading placeholder for AI response
    const aiMsgId = generateId()
    addMessage({
      id: aiMsgId,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: Date.now(),
    })

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Generation failed')
      }

      const { text, images, params, chips } = await res.json() as {
        text: string
        images: GeneratedImage[]
        params: JewelryParams
        chips: string[]
      }

      updateLastAssistantMessage({
        isLoading: false,
        content: text,
        images,
        chips,
      })

      setCurrentParams(params)
      await persistActiveConversation()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Image generation failed'
      setError(message)
      updateLastAssistantMessage({
        isLoading: false,
        content: 'Sorry, something went wrong. Please try again.',
      })
      await persistActiveConversation()
    } finally {
      setIsGenerating(false)
    }
  }, [setIsGenerating, setError, addMessage, updateLastAssistantMessage, setCurrentParams, persistActiveConversation])

  // ── Refine existing design ────────────────────────────────────
  const handleRefine = useCallback(async (text: string) => {
    if (!text.trim() || isGenerating) return
    if (!activeConversation?.currentParams) {
      // Fallback: treat as a new generation if no params yet
      handleGenerate(text)
      return
    }

    setIsGenerating(true)
    setError(null)

    // Add user message
    addMessage({
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    })

    // Add loading placeholder
    addMessage({
      id: generateId(),
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: Date.now(),
    })

    // Build chat history for API (text-only pairs)
    const chatHistory = messages
      .filter((m) => !m.isLoading)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }))

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentParams: activeConversation.currentParams,
          chatHistory,
          userMessage: text.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Refinement failed')
      }

      const { text: aiText, params, chips, images } = await res.json() as {
        text: string
        params: JewelryParams
        chips: string[]
        images: GeneratedImage[]
      }

      updateLastAssistantMessage({
        isLoading: false,
        content: aiText,
        images,
        chips,
      })

      setCurrentParams(params)
      await persistActiveConversation()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Refinement failed'
      setError(message)
      updateLastAssistantMessage({
        isLoading: false,
        content: 'Sorry, something went wrong. Please try again.',
      })
      await persistActiveConversation()
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating, activeConversation, messages, setIsGenerating, setError, addMessage, updateLastAssistantMessage, setCurrentParams, persistActiveConversation, handleGenerate])

  // ── Submit handler ────────────────────────────────────────────
  const handleSubmit = () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isGenerating) return
    setInputValue('')
    handleRefine(trimmed)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChipClick = (chip: string) => {
    if (isGenerating) return
    handleRefine(chip)
  }

  const canSubmit = inputValue.trim().length > 0 && !isGenerating

  if (!activeConversation) return null

  return (
    <div className="flex flex-col h-full w-full">
      {/* ── Messages area ────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-4"
      >
        <div className="w-full max-w-3xl mx-auto flex flex-col">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onChipClick={handleChipClick}
            />
          ))}

          {/* Error banner */}
          {error && (
            <div className="animate-fade-up mb-4 flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-xl p-4">
              <div className="flex-1 min-w-0">
                <p className="text-destructive font-semibold text-sm">Something went wrong</p>
                <p className="text-destructive/80 text-sm mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-destructive/50 hover:text-destructive transition-colors cursor-pointer shrink-0 text-sm"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom input area ────────────────────────────────────── */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3">
          {/* Suggestion chips */}
          {latestChips.length > 0 && !isGenerating && (
            <div className="flex flex-wrap gap-2">
              {latestChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleChipClick(chip)}
                  className={cn(
                    'h-8 px-4 rounded-full text-[13px] font-medium',
                    'border border-border bg-card text-foreground/70',
                    'hover:border-foreground/30 hover:text-foreground hover:bg-muted/50',
                    'transition-all duration-150 cursor-pointer',
                    'active:scale-[0.97]',
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div
            className={cn(
              'flex items-end gap-3 rounded-2xl border-2 bg-card px-4 py-3 transition-all duration-200',
              inputValue.length > 0
                ? 'border-foreground/25 shadow-[0_0_0_4px_color-mix(in_srgb,var(--foreground)_5%,transparent)]'
                : 'border-border',
            )}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What more changes do you want..."
              rows={1}
              disabled={isGenerating}
              className="flex-1 resize-none bg-transparent outline-none text-foreground text-[15px] placeholder:text-muted-foreground/50 leading-relaxed min-h-[28px] max-h-32 overflow-y-auto disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-150 shrink-0 cursor-pointer',
                canSubmit
                  ? 'bg-foreground text-background border-foreground hover:opacity-80 shadow-sm active:scale-95'
                  : 'bg-muted text-muted-foreground border-border cursor-not-allowed',
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
