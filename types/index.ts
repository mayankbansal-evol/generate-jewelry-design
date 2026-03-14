// App-level state machine
export type AppState = 'idle' | 'gathering' | 'ready' | 'generating' | 'done'

// Chat message
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// Jewelry types supported
export type JewelryType = 'ring' | 'necklace' | 'earrings' | 'bracelet'

// Base params shared across all jewelry types
export interface BaseJewelryParams {
  type: JewelryType
  metal: string        // 'yellow gold', 'platinum', 'sterling silver', etc.
  finish?: string      // 'polished', 'brushed', 'hammered'
  style: string        // 'solitaire', 'halo', 'minimalist', 'vintage', etc.
  gemstone?: string    // 'emerald cut diamond', 'no stones', etc.
  occasion?: string    // 'engagement', 'everyday', 'gift', etc.
}

export type JewelryParams = BaseJewelryParams & { type: JewelryType }

// The structured context GPT-4o-mini produces when it has enough info
export interface DesignContext {
  params: JewelryParams
  summary: string  // 2-sentence human-readable summary
}

// A single generated image
export interface GeneratedImage {
  url: string
  revisedPrompt?: string
}

// A question-with-choices the AI sends (new structured format)
export interface AIQuestion {
  type: 'question'
  question: string
  choices: string[]
}

// A completed Q&A exchange in the conversation history
export interface QAExchange {
  question: string
  answer: string
}
