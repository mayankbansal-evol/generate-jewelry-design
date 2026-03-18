'use client'

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react'
import { Mic, MicOff, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICK_PICKS = ['Ring', 'Bracelet', 'Necklace', 'Earrings', 'Anklet', 'Brooch']

// Web Speech API type augmentation
interface ISpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: Event) => void) | null
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition: ISpeechRecognitionConstructor
    webkitSpeechRecognition: ISpeechRecognitionConstructor
  }
}

interface PromptInputProps {
  onSubmit: (description: string) => void
  isLoading?: boolean
}

export default function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [value, setValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [browserSupportsVoice, setBrowserSupportsVoice] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  // Check for Web Speech API support on mount
  useEffect(() => {
    const hasAPI = !!(typeof window !== 'undefined' && 
      (window.SpeechRecognition || window.webkitSpeechRecognition))
    setBrowserSupportsVoice(hasAPI)
  }, [])

  // Focus textarea on mount
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

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let finalTranscript = ''

    recognition.onstart = () => {
      setIsListening(true)
      finalTranscript = ''
    }

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interim = transcript
        }
      }
      // Show interim results in textarea while speaking
      setValue(finalTranscript + interim)
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
      // Ensure final value is set and textarea is focused
      if (finalTranscript) {
        setValue(finalTranscript)
      }
      textareaRef.current?.focus()
    }

    recognition.onerror = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const toggleVoice = () => {
    if (!browserSupportsVoice) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const canSubmit = value.trim().length > 0 && !isLoading

  return (
    <div className="animate-fade-up w-full max-w-2xl flex flex-col gap-5">

      {/* Heading above card */}
      <div className="text-center">
        <p className="text-foreground text-2xl font-bold tracking-wide">
          What kind of jewelry do you want?
        </p>
      </div>

      {/* Input card */}
      <div
        className={cn(
          'w-full rounded-2xl border-2 bg-card shadow-sm transition-all duration-200',
          isListening
            ? 'border-foreground/40 shadow-[0_0_0_4px_color-mix(in_srgb,var(--foreground)_8%,transparent)]'
            : value.length > 0
              ? 'border-foreground/25 shadow-[0_0_0_4px_color-mix(in_srgb,var(--foreground)_5%,transparent)]'
              : 'border-border',
        )}
      >
        {/* Textarea + action buttons row */}
        <div className="px-5 pt-5 pb-3 flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your jewelry design..."
            rows={2}
            className="flex-1 resize-none bg-transparent outline-none text-foreground text-base placeholder:text-muted-foreground/50 leading-relaxed min-h-[56px] max-h-48 overflow-y-auto"
          />

          {/* Voice + Submit buttons */}
          <div className="flex items-center gap-2 shrink-0 pb-0.5">

            {/* Mic button - always visible, shows alert if browser doesn't support */}
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              title={isListening ? 'Stop listening' : browserSupportsVoice ? 'Speak your design' : 'Voice not supported in this browser'}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer',
                !browserSupportsVoice && 'opacity-40',
                isListening
                  ? 'bg-foreground text-background border-foreground shadow-sm animate-pulse'
                  : 'bg-transparent border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
              )}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-label="Generate designs"
              title="Generate designs"
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-150 cursor-pointer',
                canSubmit
                  ? 'bg-foreground text-background border-foreground hover:opacity-80 shadow-sm active:scale-95'
                  : 'bg-muted text-muted-foreground border-border cursor-not-allowed',
              )}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Divider + chips row */}
        <div className="border-t border-border px-4 py-3 flex items-center gap-2 flex-wrap">
          {QUICK_PICKS.map((label) => {
            const active = value.toLowerCase().includes(label.toLowerCase())
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleChipClick(label)}
                className={cn(
                  'h-7 px-3 rounded-full text-xs font-medium border transition-all duration-150 cursor-pointer',
                  active
                    ? 'bg-foreground/10 border-foreground/40 text-foreground'
                    : 'bg-transparent border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Voice status hint */}
      {isListening && (
        <p className="animate-fade-in text-center text-xs text-muted-foreground">
          Listening... speak your design idea
        </p>
      )}
    </div>
  )
}
