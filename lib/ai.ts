import { getAiConfig } from './config'

export interface EditorialResult {
  druryQuote: string
  body: string
}

function extractJson(text: string): EditorialResult {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('AI response did not contain JSON')
  const value = JSON.parse(text.slice(start, end + 1))
  if (typeof value.druryQuote !== 'string' || typeof value.body !== 'string') {
    throw new Error('AI response did not match the editorial schema')
  }
  return value
}

async function gemini(prompt: string, apiKey: string, model: string): Promise<EditorialResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 1000,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              druryQuote: { type: 'STRING' },
              body: { type: 'STRING' },
            },
            required: ['druryQuote', 'body'],
          },
        },
      }),
      signal: AbortSignal.timeout(25_000),
    },
  )

  if (!response.ok) throw new Error(`Gemini request failed (${response.status})`)
  const payload = await response.json()
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no text')
  return extractJson(text)
}

async function huggingFace(prompt: string, apiKey: string, model: string): Promise<EditorialResult> {
  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.25,
      max_tokens: 1000,
    }),
    signal: AbortSignal.timeout(25_000),
  })

  if (!response.ok) throw new Error(`Hugging Face request failed (${response.status})`)
  const payload = await response.json()
  const text = payload.choices?.[0]?.message?.content
  if (!text) throw new Error('Hugging Face returned no text')
  return extractJson(text)
}

export async function generateEditorial(prompt: string): Promise<EditorialResult | null> {
  const config = getAiConfig()
  if (config.provider === 'fallback') return null
  if (config.provider === 'gemini') return gemini(prompt, config.apiKey, config.model)
  return huggingFace(prompt, config.apiKey, config.model)
}
