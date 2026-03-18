'use client'

import { useState } from 'react'
import type { ChatMessage } from '@/types'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Expand, X } from 'lucide-react'

interface MessageBubbleProps {
  message: ChatMessage
  onChipClick?: (chip: string) => void
}

export default function MessageBubble({ message, onChipClick }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // ── Loading skeleton for assistant ────────────────────────────
  if (!isUser && message.isLoading) {
    return (
      <div className="flex justify-start mb-6 animate-fade-up">
        <div className="max-w-[85%] flex flex-col gap-3">
          {/* Text skeleton */}
          <div className="bg-card border border-border rounded-[20px_20px_20px_6px] px-5 py-4 shadow-sm">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          {/* Image skeleton grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                <Skeleton className="absolute inset-0" />
                {/* Bouncing dots overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-2 h-2 rounded-full bg-foreground/20"
                      style={{
                        animation: 'bounce-dot 1.2s ease-in-out infinite',
                        animationDelay: `${d * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── User message ──────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="flex justify-end mb-5 animate-fade-up">
        <div
          className={cn(
            'max-w-[78%] px-5 py-3 text-[15px] leading-relaxed',
            'bg-foreground text-background',
            'rounded-[20px_20px_6px_20px]',
            'shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
          )}
        >
          {message.content}
        </div>
      </div>
    )
  }

  // ── Assistant message ─────────────────────────────────────────
  return (
    <>
      <div className="flex justify-start mb-6 animate-fade-up">
        <div className="max-w-[88%] flex flex-col gap-3">
          {/* Text bubble */}
          {message.content && (
            <div
              className={cn(
                'px-5 py-3.5 text-[15px] leading-relaxed',
                'bg-card border border-border text-foreground',
                'rounded-[20px_20px_20px_6px]',
                'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
              )}
            >
              {message.content}
            </div>
          )}

          {/* Image grid — 3 images in a row */}
          {message.images && message.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5">
              {message.images.map((img, i) => (
                <div
                  key={i}
                  className="group/img relative aspect-square overflow-hidden rounded-xl border border-border bg-muted cursor-pointer transition-all duration-200 hover:border-foreground/30 hover:shadow-md"
                  onClick={() => setLightboxImage(img.url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.variantLabel || `Design ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors duration-200" />
                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => { e.stopPropagation(); setLightboxImage(img.url) }}
                      className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
                    >
                      <Expand className="w-3.5 h-3.5 text-foreground" />
                    </button>
                    <a
                      href={img.url}
                      download={`evol-design-${i + 1}.png`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-foreground" />
                    </a>
                  </div>
                  {/* Variant label */}
                  {img.variantLabel && (
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/85 backdrop-blur-sm text-foreground/80 shadow-sm opacity-0 group-hover/img:opacity-100 transition-opacity duration-200">
                      {img.variantLabel}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Suggestion chips */}
          {message.chips && message.chips.length > 0 && onChipClick && (
            <div className="flex flex-wrap gap-2 pt-1">
              {message.chips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => onChipClick(chip)}
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
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Expanded design"
              className="w-full rounded-2xl shadow-2xl"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <a
                href={lightboxImage}
                download="evol-design.png"
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-foreground" />
              </a>
              <button
                onClick={() => setLightboxImage(null)}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
