import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { buildRefinementMessages } from '@/lib/prompts/refine'
import { buildSemanticVariants } from '@/lib/prompts/imageGeneration'
import { JewelryParams } from '@/types'

export const maxDuration = 60

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatHistoryEntry {
  role: string
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const {
      currentParams,
      chatHistory,
      userMessage,
    }: {
      currentParams: JewelryParams
      chatHistory: ChatHistoryEntry[]
      userMessage: string
    } = await req.json()

    if (!currentParams || !userMessage) {
      return NextResponse.json(
        { error: 'Missing currentParams or userMessage' },
        { status: 400 },
      )
    }

    // Step 1: Ask GPT-4o-mini to interpret the delta and produce updated params
    const messages = buildRefinementMessages(
      currentParams as unknown as Record<string, unknown>,
      chatHistory ?? [],
      userMessage,
    )

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 600,
    })

    const rawContent = completion.choices[0]?.message?.content ?? ''

    const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from refinement model')
    }

    const parsed = JSON.parse(jsonMatch[1]) as {
      text: string
      params: JewelryParams
      chips: string[]
    }

    // Step 2: Generate 3 semantic variants with the updated params
    const variants = buildSemanticVariants(parsed.params)

    const requests = variants.map(({ params: variantParams, photographyStyle }) => {
      const basePrompt = buildVariantPrompt(variantParams, photographyStyle)
      return client.images.generate({
        model: 'gpt-image-1',
        prompt: basePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
      })
    })

    const results = await Promise.all(requests)

    const images = results.map((r, i) => {
      const imgData = r.data?.[0]
      if (!imgData) {
        return { url: '', variantLabel: variants[i].label, params: variants[i].params }
      }
      const url = imgData.b64_json
        ? `data:image/png;base64,${imgData.b64_json}`
        : (imgData.url ?? '')
      return {
        url,
        revisedPrompt: (imgData as { revised_prompt?: string }).revised_prompt,
        variantLabel: variants[i].label,
        params: variants[i].params,
      }
    })

    return NextResponse.json({
      text: parsed.text,
      params: parsed.params,
      chips: parsed.chips ?? [],
      images,
    })
  } catch (err: unknown) {
    console.error('[/api/refine] Error:', err)
    const message = err instanceof Error ? err.message : 'Refinement failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── Build prompt for a single variant ────────────────────────────
function buildVariantPrompt(params: JewelryParams, photographyStyle: string): string {
  const normalizedType = params.type?.toLowerCase().trim() ?? ''

  const { ringPrompt } = require('@/lib/prompts/templates/ring')
  const { necklacePrompt } = require('@/lib/prompts/templates/necklace')
  const { earringsPrompt } = require('@/lib/prompts/templates/earrings')
  const { braceletPrompt } = require('@/lib/prompts/templates/bracelet')
  const { genericPrompt } = require('@/lib/prompts/templates/generic')

  let base: string
  if (normalizedType === 'ring') base = ringPrompt(params)
  else if (normalizedType === 'necklace') base = necklacePrompt(params)
  else if (normalizedType === 'earrings') base = earringsPrompt(params)
  else if (normalizedType === 'bracelet') base = braceletPrompt(params)
  else base = genericPrompt(params)

  return `Professional jewelry photography. ${base} ${photographyStyle}.`
}
