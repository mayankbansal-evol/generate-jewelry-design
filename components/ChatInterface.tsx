'use client'

import { useRef, useEffect, useState, FormEvent, useCallback } from 'react'
import { AIQuestion, QAExchange, Message } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Check, Pencil, ArrowRight, X } from 'lucide-react'

export interface ChatInterfaceProps {
  qaHistory: QAExchange[]
  currentQuestion: AIQuestion | null
  isLoading: boolean
  showCustomInput: boolean
  onChoiceSelected: (answer: string) => void
  onShowCustomInput: () => void
  onHideCustomInput: () => void
  typedMessages: Message[]
}

const INPUT_YOUR_OWN = "Input your own"

export default function ChatInterface({
  qaHistory,
  currentQuestion,
  isLoading,
  showCustomInput,
  onChoiceSelected,
  onShowCustomInput,
  onHideCustomInput,
}: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [customText, setCustomText] = useState('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [qaHistory, currentQuestion, isLoading])

  // Focus the input when it appears
  useEffect(() => {
    if (showCustomInput) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setCustomText('')
    }
  }, [showCustomInput])

  const handleCustomSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault()
    if (!customText.trim()) return
    onChoiceSelected(customText.trim())
    setCustomText('')
  }, [customText, onChoiceSelected])

  const allChoices = currentQuestion
    ? [...currentQuestion.choices, INPUT_YOUR_OWN]
    : []

  return (
    <div className="w-full flex flex-col items-center gap-6">

      {/* ── Q&A History ─────────────────────────────────────────── */}
      {qaHistory.length > 0 && (
        <div className="w-full flex flex-col gap-2">
          {qaHistory.map((exchange, i) => (
            <Card
              key={i}
              className="animate-fade-up flex items-center justify-between gap-4 flex-wrap px-5 py-4 border-border shadow-none"
            >
              <span className="text-muted-foreground text-sm flex-1 min-w-0">
                {exchange.question}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[--gold]/10 border border-[--gold-muted] rounded-full px-3 py-1 text-[--gold-dark] text-sm font-semibold shrink-0">
                <Check className="w-3 h-3" />
                {exchange.answer}
              </span>
            </Card>
          ))}
        </div>
      )}

      {/* ── Current Question ─────────────────────────────────────── */}
      {currentQuestion && !isLoading && (
        <div className="animate-fade-up w-full flex flex-col items-center gap-6">

          {/* Question text */}
          <div className="text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground leading-snug max-w-xl">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Choice grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
            {allChoices.map((choice, i) => {
              const isCustom = choice === INPUT_YOUR_OWN

              // "Input your own" slot — transforms into inline input when clicked
              if (isCustom) {
                return showCustomInput ? (
                  // ── Expanded: inline input in-place ──────────────
                  <form
                    key="custom-input"
                    onSubmit={handleCustomSubmit}
                    className="col-span-2 animate-fade-in"
                  >
                    <div className="flex items-center gap-0 rounded-xl border-2 border-[--gold-light] bg-card overflow-hidden shadow-sm focus-within:border-[--gold] transition-all">
                      {/* Cancel — go back to choices (left side) */}
                      <button
                        type="button"
                        onClick={() => { onHideCustomInput(); setCustomText('') }}
                        aria-label="Cancel and go back to choices"
                        className="h-14 w-12 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-r border-border"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <input
                        ref={inputRef}
                        type="text"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                        placeholder="Describe what you have in mind..."
                        className="flex-1 h-14 px-4 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60"
                      />
                      {/* Submit (right side) */}
                      <button
                        type="submit"
                        disabled={!customText.trim()}
                        aria-label="Submit answer"
                        className={cn(
                          'h-14 w-12 shrink-0 flex items-center justify-center transition-all border-l border-border',
                          customText.trim()
                            ? 'bg-foreground text-background hover:opacity-80 cursor-pointer'
                            : 'bg-muted text-muted-foreground cursor-not-allowed',
                        )}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  // ── Collapsed: dashed button ───────────────────
                  <button
                    key="custom-btn"
                    onClick={onShowCustomInput}
                    className={cn(
                      'col-span-2 flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-xl',
                      'border-2 border-dashed border-border text-muted-foreground text-sm font-medium',
                      'cursor-pointer transition-all duration-150',
                      'hover:border-[--gold] hover:text-[--gold-dark]',
                      'active:scale-[0.98]',
                    )}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {choice}
                  </button>
                )
              }

              // ── Regular choice button ────────────────────────────
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (showCustomInput) onHideCustomInput()
                    onChoiceSelected(choice)
                  }}
                  className={cn(
                    'flex items-center justify-center text-center min-h-[68px] px-5 py-4 rounded-xl',
                    'text-sm font-semibold leading-snug',
                    'border border-border bg-card text-foreground shadow-sm',
                    'cursor-pointer transition-all duration-150 active:scale-[0.97]',
                    showCustomInput
                      ? 'opacity-40 hover:opacity-100 hover:border-[--gold] hover:text-[--gold-dark]'
                      : 'hover:border-[--gold] hover:text-[--gold-dark] hover:-translate-y-0.5 hover:shadow-md',
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {choice}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Loading Skeleton ───────────────────────────────────── */}
      {isLoading && (
        <div className="animate-fade-in w-full max-w-2xl flex flex-col items-center gap-6 py-6">
          {/* Question text skeleton */}
          <div className="flex flex-col gap-2 w-full max-w-lg text-center">
            <Skeleton className="h-7 w-3/4 mx-auto rounded-md" />
            <Skeleton className="h-7 w-1/2 mx-auto rounded-md" />
          </div>

          {/* Choice buttons skeleton — 2x2 grid */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="min-h-[68px] rounded-xl"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
