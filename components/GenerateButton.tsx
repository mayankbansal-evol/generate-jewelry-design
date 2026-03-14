'use client'

import { DesignContext } from '@/types'

interface GenerateButtonProps {
  onClick: () => void
  designContext: DesignContext
  isGenerating?: boolean
}

export default function GenerateButton({
  onClick,
  designContext,
  isGenerating = false,
}: GenerateButtonProps) {
  return (
    <div
      className="animate-fade-up"
      style={{
        width: '100%',
        background: 'var(--white)',
        border: '1.5px solid var(--cream-border)',
        borderRadius: '24px',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        boxShadow: 'var(--shadow-soft)',
        textAlign: 'center',
      }}
    >
      {/* Gold ornament */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <span style={{ height: '1px', width: '48px', background: 'linear-gradient(to right, transparent, var(--gold-muted))', display: 'block' }} />
        <span style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>✦</span>
        <span style={{ height: '1px', width: '48px', background: 'linear-gradient(to left, transparent, var(--gold-muted))', display: 'block' }} />
      </div>

      {/* Label */}
      <div>
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '1rem',
          }}
        >
          Your Design Summary
        </p>

        <p
          className="font-display"
          style={{
            fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
            color: 'var(--text-primary)',
            lineHeight: 1.55,
            maxWidth: '600px',
            fontStyle: 'italic',
          }}
        >
          &ldquo;{designContext.summary}&rdquo;
        </p>
      </div>

      {/* Design params chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        {Object.entries(designContext.params)
          .filter(([, v]) => v)
          .map(([key, value]) => (
            <span
              key={key}
              style={{
                padding: '0.3rem 0.9rem',
                background: 'linear-gradient(135deg, #FFF8E7, #FFF0CC)',
                border: '1.5px solid var(--gold-muted)',
                borderRadius: '99px',
                fontSize: '0.85rem',
                color: 'var(--gold-dark)',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {String(value)}
            </span>
          ))}
      </div>

      {/* CTA button */}
      <button
        onClick={onClick}
        disabled={isGenerating}
        className="btn-gold"
        style={{
          width: '100%',
          maxWidth: '480px',
          fontSize: '1.15rem',
          padding: '1.25rem 2rem',
          borderRadius: '16px',
          letterSpacing: '0.06em',
        }}
      >
        {isGenerating ? (
          <>
            <svg
              style={{
                width: '20px',
                height: '20px',
                animation: 'spin 1s linear infinite',
              }}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeOpacity="0.3"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Generating Your Designs…
          </>
        ) : (
          <>
            ✦ &nbsp; Generate 3 Designs
          </>
        )}
      </button>

      {!isGenerating && (
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.02em',
          }}
        >
          Three photorealistic variations will be created — Studio White, Editorial, and Lifestyle
        </p>
      )}
    </div>
  )
}
