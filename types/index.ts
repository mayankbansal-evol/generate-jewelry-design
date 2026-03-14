// App-level state machine
export type AppState = 'idle' | 'gathering' | 'generating' | 'done'

// Chat message
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// Known jewelry types used for template selection (loose string allows custom types)
export type KnownJewelryType = 'ring' | 'necklace' | 'earrings' | 'bracelet'

// JewelryType is now open — any string is valid (e.g. 'glasses frames', 'anklet', 'tiara')
export type JewelryType = KnownJewelryType | string

// Base params shared across all jewelry types
export interface BaseJewelryParams {
  type: JewelryType          // 'ring', 'glasses frames', 'anklet', etc.
  metal: string              // 'yellow gold', 'platinum', 'sterling silver', etc.
  finish?: string            // 'polished', 'brushed', 'hammered'
  style: string              // 'solitaire', 'halo', 'minimalist', 'vintage', etc.
  gemstone?: string          // 'emerald cut diamond', 'no stones', etc.
  occasion?: string          // 'engagement', 'everyday', 'gift', etc.
  details?: string           // any extra freeform detail the LLM captured
}

export type JewelryParams = BaseJewelryParams

// A single generated image
export interface GeneratedImage {
  url: string
  revisedPrompt?: string
}

// A question-with-choices the AI sends (structured format)
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
