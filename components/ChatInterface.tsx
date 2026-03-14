'use client'

import { useRef, useEffect, useState, FormEvent } from 'react'
import { AIQuestion, QAExchange, Message } from '@/types'

export interface ChatInterfaceProps {
  qaHistory: QAExchange[]
  currentQuestion: AIQuestion | null
  isLoading: boolean
  showCustomInput: boolean
  onChoiceSelected: (answer: string) => void
  onShowCustomInput: () => void
  typedMessages: Message[]
}

export default function ChatInterface({
  qaHistory,
  currentQuestion,
  isLoading,
  showCustomInput,
  onChoiceSelected,
  onShowCustomInput,
}: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [customText, setCustomText] = useState('')

  // Auto-scroll to the latest content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [qaHistory, currentQuestion, isLoading])

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!customText.trim()) return
    onChoiceSelected(customText.trim())
    setCustomText('')
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      {/* ── Q&A History ─────────────────────────────────────── */}
      {qaHistory.length > 0 && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {qaHistory.map((exchange, i) => (
            <div
              key={i}
              className="animate-fade-up"
              style={{
                background: 'var(--white)',
                border: '1.5px solid var(--cream-border)',
                borderRadius: '18px',
                padding: '1.2rem 1.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <span
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  flex: 1,
                }}
              >
                {exchange.question}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'linear-gradient(135deg, #FFF8E7, #FFF0CC)',
                  border: '1.5px solid var(--gold-muted)',
                  borderRadius: '99px',
                  padding: '0.4rem 1.1rem',
                  color: 'var(--gold-dark)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '0.8rem' }}>✓</span>
                {exchange.answer}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Current Question ─────────────────────────────────── */}
      {currentQuestion && !isLoading && (
        <div
          className="animate-fade-up"
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2rem',
          }}
        >
          {/* Question text */}
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                marginBottom: '0.75rem',
              }}
            >
              Question {qaHistory.length + 1}
            </p>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                maxWidth: '640px',
              }}
            >
              {currentQuestion.question}
            </h2>
          </div>

          {/* Choice cards — 2-column grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              width: '100%',
              maxWidth: '720px',
            }}
          >
            {currentQuestion.choices.map((choice, i) => {
              const isOther =
                choice.toLowerCase().includes('other') ||
                choice.toLowerCase().includes('something else') ||
                choice.toLowerCase().includes('tell me more') ||
                choice.toLowerCase().includes('type your own')

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (isOther) {
                      onShowCustomInput()
                    } else {
                      onChoiceSelected(choice)
                    }
                  }}
                  className="tap-card"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    animationFillMode: 'both',
                    animation: 'fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
                  }}
                >
                  {isOther ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>✏️</span>
                      {choice}
                    </span>
                  ) : (
                    choice
                  )}
                </button>
              )
            })}
          </div>

          {/* Custom text input — shown when "Other" is tapped */}
          {showCustomInput && (
            <form
              onSubmit={handleCustomSubmit}
              className="animate-fade-up"
              style={{
                width: '100%',
                maxWidth: '720px',
                display: 'flex',
                gap: '0.75rem',
              }}
            >
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                autoFocus
                placeholder="Type your answer here..."
                style={{
                  flex: 1,
                  padding: '1rem 1.4rem',
                  fontSize: '1.05rem',
                  border: '2px solid var(--gold)',
                  borderRadius: '14px',
                  background: 'var(--white)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxShadow: '0 0 0 4px rgba(201,168,76,0.12)',
                }}
              />
              <button
                type="submit"
                disabled={!customText.trim()}
                className="btn-gold"
                style={{ padding: '1rem 1.8rem', fontSize: '1rem' }}
              >
                Confirm
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Loading / Thinking ───────────────────────────────── */}
      {isLoading && (
        <div
          className="animate-fade-in"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.2rem',
            padding: '2.5rem',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFF8E7, #FFF0CC)',
              border: '2px solid var(--gold-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}
          >
            ✦
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  display: 'block',
                  animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '1rem',
              letterSpacing: '0.05em',
              fontWeight: 300,
            }}
          >
            Thinking...
          </p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
