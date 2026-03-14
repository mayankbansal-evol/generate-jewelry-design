'use client'

import { GeneratedImage } from '@/types'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, X, Maximize2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: GeneratedImage[]
  isLoading: boolean
}



export default function ImageGallery({ images, isLoading }: ImageGalleryProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (expandedIndex === null) return
    if (e.key === 'Escape') setExpandedIndex(null)
    if (e.key === 'ArrowLeft')
      setExpandedIndex((prev) => prev !== null ? (prev - 1 + images.length) % images.length : 0)
    if (e.key === 'ArrowRight')
      setExpandedIndex((prev) => prev !== null ? (prev + 1) % images.length : 0)
  }, [expandedIndex, images.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = expandedIndex !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [expandedIndex])

  /* ── Loading skeletons ──────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="animate-fade-up w-full flex flex-col items-center gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-[--gold] block"
                style={{ animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <p className="font-display text-xl sm:text-2xl text-muted-foreground italic">
            Rendering your designs…
          </p>
          <p className="text-sm text-muted-foreground/70">
            This usually takes 20–40 seconds
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5 w-full">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (images.length === 0) return null

  /* ── Image cards ────────────────────────────────────────────── */
  return (
    <>
      <div className="animate-fade-up w-full flex flex-col items-center gap-5">

        {/* Section heading */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[--gold] block" />
            <Sparkles className="w-4 h-4 text-[--gold]" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[--gold] block" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Three visions of your design
          </h2>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
          {images.map((image, index) => (
            <div
              key={index}
              className="animate-fade-up flex flex-col gap-3"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <button
                onClick={() => setExpandedIndex(index)}
                aria-label={`View design ${index + 1} full size`}
                className={cn(
                  'group relative aspect-[4/5] rounded-xl overflow-hidden border border-border',
                  'bg-muted cursor-pointer transition-all duration-200 block w-full p-0',
                  'hover:border-[--gold] hover:-translate-y-1 hover:shadow-lg',
                )}
              >
                <Image
                  src={image.url}
                  alt={`Jewelry design ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 33vw, 340px"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                {/* Expand icon */}
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Maximize2 className="w-3.5 h-3.5 text-foreground/70" />
                </div>
              </button>


            </div>
          ))}
        </div>
      </div>

      {/* ── Lightbox ────────────────────────────────────────────── */}
      {expandedIndex !== null && images[expandedIndex] && (
        <div
          className="animate-fade-in fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={() => setExpandedIndex(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[expandedIndex].url}
              alt={`Jewelry design ${expandedIndex + 1} — Full size`}
              width={1024}
              height={1024}
              className="w-full h-auto block"
            />

            {/* Close */}
            <button
              onClick={() => setExpandedIndex(null)}
              aria-label="Close lightbox"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm hover:bg-[--gold]/70 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Bottom info */}
            {images[expandedIndex].revisedPrompt && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-6 pb-5 pt-12 pointer-events-none">
                <p className="text-white/60 text-xs leading-relaxed mt-1 line-clamp-2">
                  {images[expandedIndex].revisedPrompt}
                </p>
              </div>
            )}

            {/* Prev / Next */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setExpandedIndex((prev) =>
                      prev !== null ? (prev - 1 + images.length) % images.length : 0
                    )
                  }
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm hover:bg-[--gold]/70 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setExpandedIndex((prev) =>
                      prev !== null ? (prev + 1) % images.length : 0
                    )
                  }
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm hover:bg-[--gold]/70 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
