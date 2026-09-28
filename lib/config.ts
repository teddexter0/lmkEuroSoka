const REQUIRED_FIREBASE_KEYS = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
] as const

export function missingFirebaseConfig(): string[] {
  return REQUIRED_FIREBASE_KEYS.filter(key => !process.env[key])
}

export function assertFirebaseConfig(): void {
  const missing = missingFirebaseConfig()
  if (missing.length) {
    throw new Error(`Missing server configuration: ${missing.join(', ')}`)
  }
}

export function getAiConfig() {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return {
      provider: 'gemini' as const,
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
      model: process.env.AI_MODEL || 'gemini-2.5-flash-lite',
    }
  }

  if (process.env.HF_TOKEN) {
    return {
      provider: 'huggingface' as const,
      apiKey: process.env.HF_TOKEN,
      model: process.env.AI_MODEL || 'Qwen/Qwen2.5-7B-Instruct:cheapest',
    }
  }

  return { provider: 'fallback' as const, apiKey: '', model: 'source-digest' }
}

export function footballProviderName(): 'football-data' | 'api-football' | 'thesportsdb' {
  if (process.env.FOOTBALL_DATA_API_KEY) return 'football-data'
  if (process.env.FOOTBALL_API_KEY) return 'api-football'
  return 'thesportsdb'
}
