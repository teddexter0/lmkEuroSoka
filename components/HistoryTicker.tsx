'use client'
import { useState, useEffect } from 'react'
import type { HistoryFact } from '@/types'

export default function HistoryTicker({ facts }: { facts: HistoryFact[] }) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!facts.length) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % facts.length)
        setVisible(true)
      }, 400)
    }, 8000)
    return () => clearInterval(interval)
  }, [facts])

  if (!facts.length) return null
  const fact = facts[idx]

  return (
    <div style={{
      background: '#0d0d1f', borderBottom: '1px solid #1c1c2e',
      padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#F5C842', letterSpacing: '0.1em', flexShrink: 0 }}>
        📅 {fact.date.toUpperCase()}
      </span>
      <span style={{
        fontSize: 12, color: '#aaaacc', lineHeight: 1.4,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        {fact.fact}
      </span>
    </div>
  )
}
