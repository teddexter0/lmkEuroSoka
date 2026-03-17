'use client'
import { useState } from 'react'

type Results = {
  fixtures: string
  standings: string
  playerStats: string
  stories: string
  digest: string
}

export default function AdminPage() {
  const [secret, setSecret]   = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult]   = useState<{ ok: boolean; weekLabel?: string; results?: Results; error?: string } | null>(null)

  async function trigger() {
    if (!secret.trim()) return
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      })
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setResult({ ok: false, error: e?.message ?? 'Network error' })
    } finally {
      setRunning(false)
    }
  }

  const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }
  const row = (label: string, val: string) => (
    <div key={label} style={{ display: 'flex', gap: 16, padding: '6px 0', borderBottom: '1px solid #1c1c2e' }}>
      <span style={{ ...mono, fontSize: 12, color: '#778899', width: 80 }}>{label}</span>
      <span style={{ ...mono, fontSize: 12, color: val === 'ok' ? '#44ff88' : '#ff6666' }}>{val}</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#0a0a14', border: '1px solid #1c1c2e', borderRadius: 12, padding: 32 }}>
        <p style={{ ...mono, fontSize: 10, color: '#444466', marginBottom: 6 }}>lmkEuroSoka</p>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: '#e0e0ee', marginBottom: 4 }}>
          Admin Trigger
        </h1>
        <div style={{ ...mono, fontSize: 11, color: '#44ff88', background: '#44ff8810', border: '1px solid #44ff8830', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
          ✓ Cron auto-runs daily at 06:00 EAT — you don't need to be here.
        </div>
        <p style={{ ...mono, fontSize: 11, color: '#778899', marginBottom: 28 }}>
          Manual trigger only needed if something broke. Fixtures + standings always refresh.
          AI stories + digest only generate once per week (skipped if already done).
        </p>

        <label style={{ ...mono, fontSize: 11, color: '#778899', display: 'block', marginBottom: 8 }}>
          CRON_SECRET
        </label>
        <input
          type="password"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !running && trigger()}
          placeholder="paste your CRON_SECRET here"
          style={{
            ...mono, fontSize: 13, width: '100%', boxSizing: 'border-box',
            background: '#07070f', border: '1px solid #2a2a3e', borderRadius: 8,
            color: '#e0e0ee', padding: '10px 14px', marginBottom: 16, outline: 'none',
          }}
        />

        <button
          onClick={trigger}
          disabled={running || !secret.trim()}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 8, border: 'none',
            background: running ? '#1c1c2e' : '#4444ff', color: '#ffffff',
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15,
            cursor: running ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
          }}
        >
          {running ? '⏳ Running… (fixtures → standings → stories → digest)' : '▶ Force Run Cron'}
        </button>

        {running && (
          <p style={{ ...mono, fontSize: 11, color: '#444466', textAlign: 'center', marginTop: 14 }}>
            Fetching fixtures · player stats · generating 9 stories · writing digest…
          </p>
        )}

        {result && (
          <div style={{ marginTop: 24, padding: 16, background: '#07070f', borderRadius: 8, border: `1px solid ${result.ok ? '#44ff8833' : '#ff666633'}` }}>
            {result.ok ? (
              <>
                <p style={{ ...mono, fontSize: 11, color: '#44ff88', marginBottom: 12 }}>
                  ✓ Done — week: {result.weekLabel}
                </p>
                {result.results && Object.entries(result.results).map(([k, v]) => row(k, v as string))}
                <p style={{ ...mono, fontSize: 10, color: '#444466', marginTop: 14 }}>
                  Reload the dashboard — data should now appear.
                </p>
              </>
            ) : (
              <p style={{ ...mono, fontSize: 12, color: '#ff6666' }}>
                ✗ {result.error ?? 'Unknown error'}
              </p>
            )}
          </div>
        )}

        <p style={{ ...mono, fontSize: 10, color: '#2a2a3e', textAlign: 'center', marginTop: 28 }}>
          ← <a href="/" style={{ color: '#2a2a3e', textDecoration: 'none' }}>back to dashboard</a>
        </p>
      </div>
    </div>
  )
}
