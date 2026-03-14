import OpenAI from 'openai'

// Singleton OpenAI client — reused across API routes
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default openaiClient
