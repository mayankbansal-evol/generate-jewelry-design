import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { buildImagePrompts } from '@/lib/prompts'
import { JewelryParams } from '@/types'

export const maxDuration = 60

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { params }: { params: JewelryParams } = await req.json()

    if (!params || !params.type) {
      return NextResponse.json(
        { error: 'Missing or invalid jewelry params' },
        { status: 400 }
      )
    }

    const prompts = buildImagePrompts(params)

    // Fire all 3 image requests in parallel
    // gpt-image-1 only accepts n:1 per request, so we use Promise.all
    const requests = prompts.map((prompt) =>
      client.images.generate({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
      })
    )

    const results = await Promise.all(requests)

    const images = results.map((r) => {
      const imgData = r.data?.[0]
      if (!imgData) return { url: '', revisedPrompt: undefined }
      // gpt-image-1 returns base64 by default; convert to data URL
      if (imgData.b64_json) {
        return {
          url: `data:image/png;base64,${imgData.b64_json}`,
          revisedPrompt: undefined,
        }
      }
      return {
        url: imgData.url ?? '',
        revisedPrompt: (imgData as { revised_prompt?: string }).revised_prompt,
      }
    })

    return NextResponse.json({ images })
  } catch (err: unknown) {
    console.error('[/api/generate] Error:', err)
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
