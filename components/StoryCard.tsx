'use client'
import { useState } from 'react'
import type { Story, Team } from '@/types'

interface Props { story: Story; teams: Team[] }

export default function StoryCard({ story, teams }: Props) {
  const [open, setOpen] = useState(false)
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
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '14px 16px', cursor: 'pointer',
          borderLeft: `3px solid ${color}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {team?.badgeUrl && (
              <img src={team.badgeUrl} alt={team.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
            )}
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color, letterSpacing: '0.12em' }}>
              {story.tag}
            </span>
          </div>
          <p style={{ fontSize: 17, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e0e0ee', lineHeight: 1.3 }}>
            {story.title}
          </p>
          {!open && (
            <p style={{ fontSize: 12, color: '#778899', marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
              "{story.druryQuote.slice(0, 100)}..."
            </p>
          )}
        </div>
        <span style={{ fontSize: 18, color: '#444466', marginLeft: 12, flexShrink: 0, marginTop: 2 }}>
          {open ? '▲' : '▼'}
        </span>
      </div>

      {/* Body — expanded */}
      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {/* Drury quote */}
          <blockquote style={{
            fontStyle: 'italic', color: '#aaaacc', fontSize: 14, lineHeight: 1.7,
            borderLeft: `3px solid ${color}`, paddingLeft: 12, margin: '0 0 16px',
          }}>
            "{story.druryQuote}"
          </blockquote>

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
        </div>
      )}
    </div>
  )
}
