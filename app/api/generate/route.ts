import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { buildSemanticVariants } from '@/lib/prompts/imageGeneration'
import { JewelryParams } from '@/types'

export const maxDuration = 60

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ── Interpret prompt → structured params (folded from /api/interpret) ─
const INTERPRET_PROMPT = `
You are a jewelry design interpreter for Evol Jewels — a lab-grown diamond brand.

Given a free-form user description of a jewelry piece, extract structured design params AND write a short creative response.

BRAND RULES:
- Always include lab-grown diamonds as the primary gemstone
- Metal must be one of: White Gold, Yellow Gold, Rose Gold, Silver
- If metal is unspecified, default to White Gold
- If style is unspecified, infer from context or default to "modern minimalist"

OUTPUT — respond ONLY with this JSON in a code fence, no other text:

\`\`\`json
{
  "text": "<1-2 sentence warm, enthusiastic response about the design you're creating — mention what makes it special>",
  "params": {
    "type": "<jewelry type>",
    "metal": "<White Gold | Yellow Gold | Rose Gold | Silver>",
    "finish": "<polished | brushed | hammered | matte — omit if unclear>",
    "style": "<design style inferred from description>",
    "gemstone": "<always include lab-grown diamonds>",
    "occasion": "<inferred occasion — omit if unclear>",
    "details": "<any distinctive details worth capturing>"
  },
  "chips": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}
\`\`\`

CHIP SUGGESTIONS:
- 3 short (3-5 words) next-step refinement ideas specific to the design
- Examples: "Try rose gold", "Add pavé band", "Make it bolder", "More vintage feel"
`

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 },
      )
    }

    // Step 1: Interpret the raw description into structured params + text
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: INTERPRET_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 400,
    })

    const rawContent = completion.choices[0]?.message?.content ?? ''
    const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/)

    let text = "Creating your design with lab-grown diamonds..."
    let params: JewelryParams = {
      type: 'jewelry',
      metal: 'White Gold',
      style: 'modern minimalist',
      gemstone: 'lab-grown diamonds',
      details: prompt,
    }
    let chips = ['Try rose gold', 'Make it bolder', 'Add more diamonds']

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        text = parsed.text || text
        params = parsed.params || params
        chips = parsed.chips || chips
      } catch {
        // Use defaults
      }
    }

    // Step 2: Build 3 semantic variants and generate images in parallel
    const variants = buildSemanticVariants(params)

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

    return NextResponse.json({ text, images, params, chips })
  } catch (err: unknown) {
    console.error('[/api/generate] Error:', err)
    const message = err instanceof Error ? err.message : 'Image generation failed'
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
