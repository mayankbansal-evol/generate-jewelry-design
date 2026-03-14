'use client'

import { GeneratedImage } from '@/types'
import Image from 'next/image'
import { useState } from 'react'

interface ImageGalleryProps {
  images: GeneratedImage[]
  isLoading: boolean
}

const styleLabels = ['Studio White', 'Luxury Editorial', 'Lifestyle Flat Lay']
const styleDescriptions = [
  'Clean product shot on pure white',
  'Dramatic dark velvet editorial',
  'Natural light marble flat lay',
]

export default function ImageGallery({ images, isLoading }: ImageGalleryProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  /* ── Loading skeletons ─────────────────────────────────── */
  if (isLoading) {
    return (
      <div
        className="animate-fade-up"
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  display: 'block',
                  animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <p
            className="font-display"
            style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
            }}
          >
            Rendering your designs…
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            This usually takes 20–40 seconds
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.25rem',
            width: '100%',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div
                className="skeleton"
                style={{
                  aspectRatio: '1/1',
                  borderRadius: '20px',
                  border: '1.5px solid var(--cream-border)',
                }}
              />
              <div className="skeleton" style={{ height: '16px', width: '70%', margin: '0 auto' }} />
              <div className="skeleton" style={{ height: '12px', width: '55%', margin: '0 auto' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (images.length === 0) return null

  /* ── Image cards ───────────────────────────────────────── */
  return (
    <div
      className="animate-fade-up"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
      }}
    >
      {/* Section heading */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: '0.6rem',
          }}
        >
          <span style={{ height: '1px', width: '40px', background: 'linear-gradient(to right, transparent, var(--gold))', display: 'block' }} />
          <span style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>✦</span>
          <span style={{ height: '1px', width: '40px', background: 'linear-gradient(to left, transparent, var(--gold))', display: 'block' }} />
        </div>
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Your 3 Designs
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
          Tap any image to view it full size
        </p>
      </div>

      {/* 3-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.25rem',
          width: '100%',
        }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="animate-fade-up"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              animationDelay: `${index * 120}ms`,
              animationFillMode: 'both',
            }}
          >
            <button
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              style={{
                position: 'relative',
                aspectRatio: '1/1',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '2px solid var(--cream-border)',
                cursor: 'pointer',
                background: 'var(--cream-deep)',
                transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                display: 'block',
                width: '100%',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)'
                e.currentTarget.style.boxShadow = 'var(--shadow-gold), 0 0 0 3px rgba(201,168,76,0.15)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--cream-border)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Image
                src={image.url}
                alt={`Jewelry design ${index + 1} — ${styleLabels[index]}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 260px"
                style={{ transition: 'transform 0.35s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              />
              {/* Subtle gradient overlay at bottom */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
                  pointerEvents: 'none',
                }}
              />
              {/* Expand icon */}
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  backdropFilter: 'blur(4px)',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: 'none',
                }}
                className="expand-icon"
              >
                ⤢
              </div>
            </button>

            {/* Label */}
            <div style={{ textAlign: 'center' }}>
              <p
                className="font-display"
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.2rem',
                }}
              >
                {styleLabels[index]}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {styleDescriptions[index]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Lightbox ───────────────────────────────────────── */}
      {expandedIndex !== null && images[expandedIndex] && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(10, 8, 6, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setExpandedIndex(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '720px',
              width: '100%',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[expandedIndex].url}
              alt={`${styleLabels[expandedIndex]} — Full size`}
              width={1024}
              height={1024}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />

            {/* Close button */}
            <button
              onClick={() => setExpandedIndex(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(10,8,6,0.6)',
                border: '1.5px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                backdropFilter: 'blur(4px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(201,168,76,0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10,8,6,0.6)'
              }}
            >
              ✕
            </button>

            {/* Bottom info bar */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(10,8,6,0.85), transparent)',
                padding: '2.5rem 1.75rem 1.5rem',
              }}
            >
              <p
                className="font-display"
                style={{
                  color: 'var(--gold-light)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                }}
              >
                {styleLabels[expandedIndex]}
              </p>
              {images[expandedIndex].revisedPrompt && (
                <p
                  style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {images[expandedIndex].revisedPrompt}
                </p>
              )}
            </div>

            {/* Prev / Next navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedIndex((prev) =>
                      prev !== null ? (prev - 1 + images.length) % images.length : 0
                    )
                  }}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'rgba(10,8,6,0.6)',
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedIndex((prev) =>
                      prev !== null ? (prev + 1) % images.length : 0
                    )
                  }}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'rgba(10,8,6,0.6)',
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
