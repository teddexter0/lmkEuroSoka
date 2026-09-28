import { timingSafeEqual } from 'crypto'

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function isAuthorizedJobRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 16) return false

  const authorization = request.headers.get('authorization') || ''
  return safeEqual(authorization, `Bearer ${secret}`)
}
