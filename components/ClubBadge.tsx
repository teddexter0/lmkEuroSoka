'use client'
import { useState } from 'react'

export default function ClubBadge({ name, url, fallback, size = 24 }: {
  name: string
  url?: string
  fallback?: string
  size?: number
}) {
  const [failed, setFailed] = useState<string[]>([])
  const src = [url, fallback].find((candidate): candidate is string => !!candidate && !failed.includes(candidate))
  if (src) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} loading="lazy"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={() => setFailed(previous => [...previous, src])} />
  )
  return <span aria-hidden="true" style={{
    width: size, height: size, flexShrink: 0, display: 'inline-grid', placeItems: 'center',
    border: '1px solid #62628c', borderRadius: 5, color: '#cbd2ff', fontSize: size * 0.33,
  }}>{name.trim().split(/\s+/).slice(0, 3).map(word => word[0]).join('').toUpperCase()}</span>
}
