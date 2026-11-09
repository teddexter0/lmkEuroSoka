'use client'
import type { HistoryFact } from '@/types'

export default function HistoryTicker({ facts, dateKey }: { facts: HistoryFact[]; dateKey: string }) {
  if (!facts.length) return null

  const stableIndex = [...dateKey].reduce((total, char) => total + char.charCodeAt(0), 0)
  const fact = facts[stableIndex % facts.length]

  return (
    <div style={{
      background: '#0d0d1f', borderBottom: '1px solid #1c1c2e',
      padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#F5C842', letterSpacing: '0.1em', flexShrink: 0 }}>
        📅 {fact.date.toUpperCase()}
      </span>
      <span style={{ fontSize: 12, color: '#aaaacc', lineHeight: 1.4 }}>
        {fact.fact}
      </span>
    </div>
  )
}
