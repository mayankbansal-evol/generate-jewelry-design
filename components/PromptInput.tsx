'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICK_PICKS = ['Ring', 'Bracelet', 'Necklace', 'Earrings', 'Anklet', 'Brooch']

interface PromptInputProps {
  onSubmit: (description: string) => void
  isLoading?: boolean
}

export default function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const handleChipClick = (label: string) => {
    // Always replace with a clean starter phrase for this chip
    setValue(`I want to design a ${label.toLowerCase()}`)
    textareaRef.current?.focus()
  }

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSubmit(trimmed)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSubmit = value.trim().length > 0 && !isLoading

  return (
    <div className="animate-fade-up w-full max-w-2xl flex flex-col gap-6">

      {/* Heading */}
      <div className="text-center flex flex-col gap-2">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
          What kind of jewelry<br className="sm:hidden" /> do you want?
        </h2>
        <p className="text-muted-foreground text-sm font-light">
          Describe your idea — as specific or as vague as you like
        </p>
      </div>

      {/* Input card */}
      <div
        className={cn(
          'w-full rounded-2xl border-2 bg-card shadow-sm transition-all duration-200',
          value.length > 0
            ? 'border-[--gold-light] shadow-[0_0_0_4px_color-mix(in_srgb,var(--gold-light)_25%,transparent)]'
            : 'border-border',
        )}
      >
        {/* Textarea */}
        <div className="px-5 pt-5 pb-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your jewelry design..."
            rows={2}
            className="w-full resize-none bg-transparent outline-none text-foreground text-base placeholder:text-muted-foreground/50 leading-relaxed min-h-[56px] max-h-48 overflow-y-auto"
          />
        </div>

        {/* Divider + chips + submit row */}
        <div className="border-t border-border px-4 py-3 flex items-center gap-3 flex-wrap">

          {/* Quick-pick chips */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {QUICK_PICKS.map((label) => {
              const active = value.toLowerCase().includes(label.toLowerCase())
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleChipClick(label)}
                  className={cn(
                    'h-7 px-3 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer',
                    active
                      ? 'bg-[--gold-light]/25 border-[--gold-light] text-[--gold]'
                      : 'bg-transparent border-border text-muted-foreground hover:border-[--gold-light] hover:text-[--gold]',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="Continue"
            className={cn(
              'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150',
              canSubmit
                ? 'bg-foreground text-background hover:opacity-80 cursor-pointer shadow-sm active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground/60">
        Press <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">Enter</kbd> to continue
      </p>
    </div>
  )
}
