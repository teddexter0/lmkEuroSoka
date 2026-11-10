'use client'
import { useState } from 'react'
import ClubBadge from './ClubBadge'
import type { Story, Team } from '@/types'

interface Props { story: Story; teams: Team[]; defaultOpen?: boolean }

export default function StoryCard({ story, teams, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const team = teams.find(t => t.id === story.teamId)
  const color = team?.colorPrimary || '#8899FF'

  return (
    <div
      style={{
        background: '#0a0a14', border: `1px solid ${color}33`,
        borderRadius: 10, overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header — always visible */}
      <button type="button" aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '14px 16px', cursor: 'pointer', width: '100%', textAlign: 'left',
          borderLeft: `3px solid ${color}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {team && <ClubBadge name={team.name} url={team.badgeUrl} fallback={team.fallbackBadgeUrl} size={22} />}
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color, letterSpacing: '0.12em' }}>
              {story.tag}
            </span>
          </div>
          <p style={{ fontSize: 17, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e0e0ee', lineHeight: 1.3 }}>
            {story.title}
          </p>
          {!open && story.druryQuote && (
            <p style={{ fontSize: 12, color: '#778899', marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
              &ldquo;{story.druryQuote.slice(0, 100)}...&rdquo;
            </p>
          )}
        </div>
        <span style={{ fontSize: 18, color: '#444466', marginLeft: 12, flexShrink: 0, marginTop: 2 }}>
          {open ? '−' : '+'}
        </span>
      </button>

      {/* Body — expanded */}
      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {/* Drury quote */}
          {story.druryQuote && <blockquote style={{
            fontStyle: 'italic', color: '#aaaacc', fontSize: 14, lineHeight: 1.7,
            borderLeft: `3px solid ${color}`, paddingLeft: 12, margin: '0 0 16px',
          }}>
            &ldquo;{story.druryQuote}&rdquo;
          </blockquote>}

          {/* Stats bar */}
          {story.statsJson.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14,
            }}>
              {story.statsJson.map((s, i) => (
                <span key={i} style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  background: `${color}18`, color, padding: '3px 8px',
                  borderRadius: 4, border: `1px solid ${color}33`,
                }}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Story body */}
          <div className="story-body">
            {story.body.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {!!story.signals?.length && <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {story.signals.map(signal => <div key={signal.url} style={{ background: '#111128', borderRadius: 6, padding: 10 }}>
              <p style={{ fontSize: 11, color: '#aab6ff' }}>{signal.label} · {signal.source}{signal.publishedAt && ` · ${new Date(signal.publishedAt).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', day: 'numeric', month: 'short' })}`}</p>
              <a href={signal.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#e0e0ee' }}>{signal.title}</a>
            </div>)}
          </div>}
          {!story.body && !story.signals?.length && !story.sources?.length && <p style={{ color: '#a5aec9', fontSize: 13 }}>No match or club developments surfaced in the current feeds.</p>}
          {!!story.sources?.length && (
            <div style={{ borderTop: '1px solid #1c1c2e', marginTop: 16, paddingTop: 12 }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#555577', marginBottom: 8 }}>SOURCES</p>
              {story.sources.slice(0, 6).map(source => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer" style={{ display: 'block', color: '#8899ff', fontSize: 12, lineHeight: 1.5, marginBottom: 6 }}>
                  {source.source}: {source.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
