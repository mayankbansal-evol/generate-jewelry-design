// ── View state ────────────────────────────────────────────────────
export type AppView = 'home' | 'chat'

// ── Jewelry params (unchanged from before) ───────────────────────
export type KnownJewelryType = 'ring' | 'necklace' | 'earrings' | 'bracelet'
export type JewelryType = KnownJewelryType | string

export interface BaseJewelryParams {
  type: JewelryType
  metal: string
  finish?: string
  style: string
  gemstone?: string
  occasion?: string
  details?: string
}

export type JewelryParams = BaseJewelryParams

// ── Generated image ──────────────────────────────────────────────
export interface GeneratedImage {
  url: string
  revisedPrompt?: string
  variantLabel?: string
  params?: JewelryParams
}

// ── Chat message ─────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string              // text content
  images?: GeneratedImage[]    // assistant messages may carry images
  chips?: string[]             // assistant messages may carry suggestion chips
  isLoading?: boolean          // optimistic placeholder while generating
  timestamp: number
}

// ── Conversation ─────────────────────────────────────────────────
export interface Conversation {
  id: string
  title: string                // first ~60 chars of user's first prompt
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  currentParams?: JewelryParams // latest resolved params for next refinement
}
