import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { ADVISOR_PROMPT } from '@/lib/prompts'
import { NextRequest } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    system: ADVISOR_PROMPT,
    messages,
  })

  return result.toDataStreamResponse()
}
