# Jewelry Builder — Project Plan

## Overview

An AI-powered jewelry design tool built with Next.js. Users describe what they want, an AI advisor asks clarifying questions, and once it has enough context it generates 3 photorealistic jewelry designs using DALL-E 3.

**Stack:** Next.js 14 (App Router) · AI SDK (Vercel) · OpenAI · Zustand · Tailwind CSS

---

## Request Flow

```
User prompt
  → Chat interface (Next.js)
    → /api/chat (AI SDK + GPT-4o)
      → Clarifying Q&A loop (streamed back to UI)
        → GPT-4o signals "ready" with a structured prompt
          → /api/generate (DALL-E 3 × 3 parallel)
            → Image gallery rendered to user
```

---

## Project Structure

```
jewelry-builder/
├── app/
│   ├── page.tsx                  # Main UI — chat + gallery
│   ├── layout.tsx
│   └── api/
│       ├── chat/
│       │   └── route.ts          # AI SDK streaming chat handler
│       └── generate/
│           └── route.ts          # DALL-E 3 image generation (×3)
├── components/
│   ├── ChatInterface.tsx         # Message bubbles + input
│   ├── MessageBubble.tsx         # Individual message rendering
│   ├── GenerateButton.tsx        # Shown when AI signals "ready"
│   └── ImageGallery.tsx          # 3-up image grid with loading state
├── lib/
│   ├── openai.ts                 # OpenAI client (singleton)
│   └── prompts/
│       ├── index.ts              # Re-exports everything — single import point
│       ├── advisor.ts            # GPT-4o clarifying Q&A system prompt
│       ├── imageGeneration.ts    # buildImagePrompts() — composes per-type + style variant
│       └── templates/
│           ├── ring.ts           # ringPrompt(RingParams) → string
│           ├── necklace.ts       # necklacePrompt(NecklaceParams) → string
│           ├── earrings.ts       # earringsPrompt(EarringsParams) → string
│           └── bracelet.ts       # braceletPrompt(BraceletParams) → string
├── stores/
│   └── jewelryStore.ts           # Zustand store — full app state
└── types/
    └── index.ts                  # Message, AppState, DesignContext types
```

---

## Types

```ts
// types/index.ts

export type AppState = 'idle' | 'gathering' | 'ready' | 'generating' | 'done'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface DesignContext {
  params: JewelryParams // Structured params handed off to buildImagePrompts()
  summary: string       // 2-sentence human-readable summary from GPT-4o
}

// Mirrors the template param shapes — extended as new jewelry types are added
export type JewelryType = 'ring' | 'necklace' | 'earrings' | 'bracelet'

export interface BaseJewelryParams {
  type: JewelryType
  metal: string         // 'yellow gold', 'platinum', 'sterling silver', etc.
  finish?: string       // 'polished', 'brushed', 'hammered'
  style: string         // 'solitaire', 'halo', 'minimalist', 'vintage', etc.
  gemstone?: string     // 'emerald cut diamond', 'no stones', etc.
  occasion?: string     // 'engagement', 'everyday', 'gift', etc.
}

export type JewelryParams = BaseJewelryParams & { type: JewelryType }

export interface GeneratedImage {
  url: string
  revisedPrompt?: string
}
```

---

## Zustand Store

```ts
// stores/jewelryStore.ts

import { create } from 'zustand'
import { Message, AppState, DesignContext, GeneratedImage, JewelryParams } from '@/types'

interface JewelryStore {
  // State
  appState: AppState
  messages: Message[]
  designContext: DesignContext | null
  images: GeneratedImage[]
  error: string | null

  // Actions
  setAppState: (state: AppState) => void
  addMessage: (message: Message) => void
  setDesignContext: (context: DesignContext) => void
  setImages: (images: GeneratedImage[]) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useJewelryStore = create<JewelryStore>((set) => ({
  appState: 'idle',
  messages: [],
  designContext: null,
  images: [],
  error: null,

  setAppState: (appState) => set({ appState }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setDesignContext: (designContext) => set({ designContext, appState: 'ready' }),
  setImages: (images) => set({ images, appState: 'done' }),
  setError: (error) => set({ error }),
  reset: () =>
    set({ appState: 'idle', messages: [], designContext: null, images: [], error: null }),
}))
```

---

## API Routes

### `/api/chat` — Streaming clarification loop

Uses the AI SDK `streamText` helper. On each response, GPT-4o either asks a follow-up question or returns a special JSON block signalling it has enough context. The frontend parses this to decide whether to continue chatting or unlock the Generate button.

```ts
// app/api/chat/route.ts

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { ADVISOR_PROMPT } from '@/lib/prompts'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4o'),
    system: ADVISOR_PROMPT,
    messages,
  })

  return result.toDataStreamResponse()
}
```

### `/api/generate` — Parallel DALL-E 3 image generation

Receives structured `params` from GPT-4o, passes them through `buildImagePrompts()` to get 3 prompts — each identical in design but with a different photography style suffix. All 3 fire concurrently against DALL-E 3.

```ts
// app/api/generate/route.ts

import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { buildImagePrompts } from '@/lib/prompts'

const client = new OpenAI()

export async function POST(req: NextRequest) {
  const { params } = await req.json()  // structured JewelryParams from GPT-4o

  const prompts = buildImagePrompts(params)  // returns 3 prompts, one per style variant

  const requests = prompts.map((prompt) =>
    client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
    })
  )

  const results = await Promise.all(requests)
  const images = results.map((r) => ({
    url: r.data[0].url!,
    revisedPrompt: r.data[0].revised_prompt,
  }))

  return NextResponse.json({ images })
}
```

---

## Prompts Directory

All prompt logic lives in `lib/prompts/`. Each file has a single responsibility. `index.ts` is the only import consumers ever need.

### `lib/prompts/advisor.ts` — GPT-4o system prompt

Instructs GPT-4o to ask focused questions one at a time and signal readiness with a structured `params` JSON block (not a raw string) that maps directly to the `JewelryParams` type.

```ts
// lib/prompts/advisor.ts

export const ADVISOR_PROMPT = `
You are a professional jewelry design consultant. Your job is to understand exactly
what the user wants before handing off to an image generator.

Ask ONE clarifying question at a time. Focus on these areas (in roughly this order):
1. Jewelry type (ring, necklace, bracelet, earrings)
2. Metal type and finish (yellow gold, white gold, rose gold, silver, platinum)
3. Gemstones — type, cut, colour, or "no stones"
4. Style / aesthetic (minimalist, vintage, art deco, boho, modern, religious, etc.)
5. Occasion or who it's for (engagement, everyday wear, gift, etc.)

Rules:
- One question at a time — never ask multiple questions in one message.
- Be warm and conversational, not clinical.
- After 3–5 exchanges, once you have enough detail, respond ONLY with this JSON and nothing else:

\`\`\`json
{
  "status": "ready",
  "summary": "<2 sentence human-readable summary>",
  "params": {
    "type": "ring | necklace | earrings | bracelet",
    "metal": "<metal type>",
    "finish": "<polished | brushed | hammered — omit if unspecified>",
    "style": "<design style>",
    "gemstone": "<gemstone description or 'no stones'>",
    "occasion": "<occasion — omit if unspecified>"
  }
}
\`\`\`
`
```

### `lib/prompts/templates/ring.ts` — Per-type template

Each template is a typed function that takes the user's structured params and returns a descriptive sentence optimised for an image model.

```ts
// lib/prompts/templates/ring.ts

export interface RingParams {
  metal: string
  finish?: string
  style: string
  gemstone?: string
  occasion?: string
}

export const ringPrompt = (p: RingParams): string =>
  `A ${p.metal} ${p.style} ring${p.gemstone ? ` featuring ${p.gemstone}` : ''}.
  ${p.finish ? `${p.finish} metal finish.` : ''}
  ${p.occasion ? `Designed for ${p.occasion}.` : ''}
  Intricate detail, fine jewelry craftsmanship.`.trim()
```

Necklace, earrings, and bracelet templates follow the same shape with type-specific field names.

### `lib/prompts/imageGeneration.ts` — Prompt builder

Selects the right template by jewelry type, then stamps 3 style-variant suffixes onto the base description. This is what produces the 3 visually distinct images for the same design.

```ts
// lib/prompts/imageGeneration.ts

import { ringPrompt } from './templates/ring'
import { necklacePrompt } from './templates/necklace'
import { earringsPrompt } from './templates/earrings'
import { braceletPrompt } from './templates/bracelet'
import { JewelryParams } from '@/types'

const styleVariants = [
  'clean studio photography, isolated on white background, product shot, 4K',
  'dramatic luxury editorial, dark velvet background, soft rim lighting, 4K',
  'lifestyle flat lay, marble surface, natural daylight, minimal props, 4K',
]

export const buildImagePrompts = (params: JewelryParams): string[] => {
  const base =
    params.type === 'ring'      ? ringPrompt(params)     :
    params.type === 'necklace'  ? necklacePrompt(params) :
    params.type === 'earrings'  ? earringsPrompt(params) :
                                  braceletPrompt(params)

  return styleVariants.map(
    (style) => `Professional jewelry photography. ${base} ${style}.`
  )
}
```

### `lib/prompts/index.ts` — Single export point

```ts
// lib/prompts/index.ts

export { ADVISOR_PROMPT } from './advisor'
export { buildImagePrompts } from './imageGeneration'
```

---

## Frontend — Main Page

The page reads from the Zustand store and coordinates the three phases: chatting, confirming, and showing results.

```tsx
// app/page.tsx

'use client'

import { useChat } from 'ai/react'
import { useJewelryStore } from '@/stores/jewelryStore'
import ChatInterface from '@/components/ChatInterface'
import GenerateButton from '@/components/GenerateButton'
import ImageGallery from '@/components/ImageGallery'
import { useEffect } from 'react'

export default function JewelryBuilder() {
  const { appState, setDesignContext, setImages, setAppState, images } =
    useJewelryStore()

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
      onFinish: (message) => {
        // Check if the AI has signalled it's ready
        const match = message.content.match(/```json\n([\s\S]*?)\n```/)
        if (match) {
          try {
            const parsed = JSON.parse(match[1])
            if (parsed.status === 'ready') {
              setDesignContext({ params: parsed.params, summary: parsed.summary })
            }
          } catch {
            // Not a JSON block — continue chatting
          }
        }
      },
    })

  const handleGenerate = async () => {
    const { designContext } = useJewelryStore.getState()
    if (!designContext) return

    setAppState('generating')
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: designContext.params }),
    })
    const { images } = await res.json()
    setImages(images)
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold mb-8">Jewelry Builder</h1>

      <ChatInterface
        messages={messages}
        input={input}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />

      {appState === 'ready' && (
        <GenerateButton onClick={handleGenerate} />
      )}

      {(appState === 'generating' || appState === 'done') && (
        <ImageGallery images={images} isLoading={appState === 'generating'} />
      )}
    </main>
  )
}
```

---

## Build Phases

### Phase 1 — Shell UI
- Next.js project scaffolding with Tailwind
- Static `ChatInterface` with hardcoded messages
- Zustand store wired to UI
- No AI yet — just get layout and state transitions working

### Phase 2 — Clarification loop
- `/api/chat` route with AI SDK `streamText`
- Wire `useChat` in the frontend
- Tune the system prompt until the Q&A flow feels natural
- Test the "ready" JSON detection logic

### Phase 3 — Prompt engineering
- Iterate on what GPT-4o passes to DALL-E
- Add the photography prefix wrapper in `/api/generate`
- Evaluate output quality across different jewelry types

### Phase 4 — Image generation
- `/api/generate` parallel DALL-E 3 requests
- `ImageGallery` component with skeleton loaders
- Handle API errors and rate limits gracefully

### Phase 5 — Polish
- Streaming text renders character-by-character (already handled by AI SDK)
- Skeleton placeholders during image generation
- "Start over" button that calls `reset()` in the store
- Mobile-responsive layout check
- Error boundary for failed generations

---

## Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

---

## Key Dependencies

```bash
npx create-next-app@latest jewelry-builder --typescript --tailwind --app
cd jewelry-builder
npm install ai @ai-sdk/openai openai zustand
```

| Package | Purpose |
|---|---|
| `ai` | AI SDK — `useChat`, `streamText`, streaming helpers |
| `@ai-sdk/openai` | OpenAI provider for AI SDK |
| `openai` | Direct OpenAI client for DALL-E 3 image calls |
| `zustand` | Lightweight state management for app state + images |

---

## Notes

- DALL-E 3 only accepts `n: 1` per request — use `Promise.all` for 3 parallel calls
- All 3 images use the same design params but different style suffixes — this gives coherent variation rather than random inconsistency
- AI SDK's `useChat` maintains full message history automatically — pass it directly to `/api/chat`
- The "ready" JSON signal should be parsed on `onFinish`, not `onMessage`, to avoid partial parse attempts on streamed chunks
- GPT-4o returns structured `params`, not a raw prompt string — `buildImagePrompts()` owns the composition logic, keeping the AI output clean and typed
- Adding a new jewelry type = add a template file + extend the `JewelryType` union + add a branch in `buildImagePrompts()`
- Store the full message history in Zustand if you need it outside the `useChat` scope (e.g. for a "save design" feature later)
