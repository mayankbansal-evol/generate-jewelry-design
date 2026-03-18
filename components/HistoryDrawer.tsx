'use client'

import { useEffect, useState } from 'react'
import { useJewelryStore } from '@/stores/jewelryStore'
import { getAllImages, type ImageEntry } from '@/lib/db'
import { cn } from '@/lib/utils'
import { X, MessageSquare, Image as ImageIcon, Trash2, Clock } from 'lucide-react'

export default function HistoryDrawer() {
  const {
    drawerOpen,
    drawerTab,
    setDrawerOpen,
    setDrawerTab,
    conversations,
    loadConversation,
    deleteConversation,
    activeConversationId,
  } = useJewelryStore()

  const [allImages, setAllImages] = useState<ImageEntry[]>([])
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Load images when switching to images tab
  useEffect(() => {
    if (drawerOpen && drawerTab === 'images') {
      getAllImages().then(setAllImages)
    }
  }, [drawerOpen, drawerTab])

  // Format relative time
  const timeAgo = (ts: number): string => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[340px] max-w-[85vw] bg-background border-r border-border shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground/70">
            History
          </h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex px-5 pt-3 pb-2 gap-1">
          <button
            onClick={() => setDrawerTab('chats')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer',
              drawerTab === 'chats'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chats
          </button>
          <button
            onClick={() => setDrawerTab('images')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer',
              drawerTab === 'images'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Images
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {drawerTab === 'chats' ? (
            // ── Chats list ──────────────────────────────────────
            conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Start designing to create your first conversation
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {conversations.map((convo) => {
                  const isActive = convo.id === activeConversationId
                  const msgCount = convo.messages.length
                  const imgCount = convo.messages.reduce(
                    (acc, m) => acc + (m.images?.length ?? 0), 0,
                  )

                  return (
                    <div
                      key={convo.id}
                      className={cn(
                        'group relative flex flex-col gap-1 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150',
                        isActive
                          ? 'bg-foreground/5 border border-foreground/10'
                          : 'hover:bg-muted/50 border border-transparent',
                      )}
                      onClick={() => loadConversation(convo.id)}
                    >
                      {/* Title */}
                      <p className="text-[13px] font-medium text-foreground leading-snug pr-6 line-clamp-2">
                        {convo.title}
                      </p>
                      {/* Meta */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(convo.updatedAt)}
                        </span>
                        <span>{msgCount} messages</span>
                        {imgCount > 0 && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {imgCount}
                          </span>
                        )}
                      </div>
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversation(convo.id)
                        }}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            // ── Images grid ─────────────────────────────────────
            allImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <ImageIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No images yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Generated designs will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {allImages.map((img, i) => (
                  <div
                    key={`${img.conversationId}-${img.messageId}-${i}`}
                    className="group/img relative aspect-square overflow-hidden rounded-xl border border-border bg-muted cursor-pointer transition-all hover:border-foreground/20 hover:shadow-md"
                    onClick={() => setLightboxImage(img.url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.variantLabel || 'Design'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white/90 line-clamp-1 font-medium">
                        {img.conversationTitle}
                      </p>
                      {img.variantLabel && (
                        <p className="text-[9px] text-white/60">{img.variantLabel}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Expanded design"
              className="w-full rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
