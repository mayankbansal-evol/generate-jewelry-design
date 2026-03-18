"use client"

import { useEffect } from "react"
import { useJewelryStore } from "@/stores/jewelryStore"
import PromptInput from "@/components/PromptInput"
import ChatScreen from "@/components/ChatScreen"
import HistoryDrawer from "@/components/HistoryDrawer"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { History, Plus } from "lucide-react"

export default function JewelryBuilder() {
  const {
    view,
    isHydrated,
    drawerOpen,
    activeConversationId,
    setDrawerOpen,
    startNewConversation,
    reset,
    hydrate,
  } = useJewelryStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const isHome = view === "home"
  const isChat = view === "chat" && activeConversationId

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image src="/evol-logo.webp" alt="EVOL Jewels" width={80} height={32} className="object-contain opacity-30" priority />
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/20"
                style={{ animation: "bounce-dot 1.2s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen bg-background flex flex-col overflow-hidden">
      <HistoryDrawer />

      {/* ── Header — borderless, part of the page ───────────────── */}
      <header className="w-full shrink-0 z-30 px-5 sm:px-8 pt-5 pb-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between">

          {/* Left: single menu button */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer",
              drawerOpen
                ? "bg-foreground text-background"
                : "text-foreground/40 hover:text-foreground hover:bg-foreground/5",
            )}
            title="History"
          >
            <History className="w-[18px] h-[18px]" />
          </button>

          {/* Center: logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Image
              src="/evol-logo.webp"
              alt="EVOL Jewels"
              width={76}
              height={30}
              className="object-contain"
              priority
            />
          </div>

          {/* Right: New button (chat only) or invisible spacer */}
          <div className="w-9 flex justify-end">
            {isChat ? (
              <button
                onClick={() => reset()}
                className="h-9 px-3 rounded-lg flex items-center gap-1.5 text-[13px] font-medium text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-150 cursor-pointer"
                title="Start new"
              >
                <Plus className="w-[15px] h-[15px]" />
                New
              </button>
            ) : (
              <span className="w-9" />
            )}
          </div>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative">
        {isHome && (
          <div className="h-full flex items-center justify-center px-4 sm:px-6">
            <PromptInput onSubmit={(d) => startNewConversation(d)} isLoading={false} />
          </div>
        )}
        {isChat && <ChatScreen />}
      </div>
    </main>
  )
}
