'use client'
import { useState, useEffect } from 'react'
import type { YoutubeVideo } from '@/types'

const CHANNEL_URL = 'https://www.youtube.com/@CBSSportsGolazo'

export default function GolazoPanel() {
  const [video, setVideo] = useState<YoutubeVideo | null>(null)
  const [channelUrl, setChannelUrl] = useState(CHANNEL_URL)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/youtube')
      .then(r => r.json())
      .then(data => {
        setVideo(data.video ?? null)
        if (data.channelUrl) setChannelUrl(data.channelUrl)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: '#0a0a14', border: '1px solid #1c1c2e', borderRadius: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', background: '#0d0d1f', borderBottom: '1px solid #1c1c2e' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: '#e0e0ee' }}>
              CBS Golazo UCL Show
            </p>
            <p style={{ fontSize: 12, color: '#778899', marginTop: 2 }}>Kate Scott · Micah Richards · Jamie Carragher · Thierry Henry</p>
          </div>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#FF0000',
              background: '#FF000018', border: '1px solid #FF000033',
              padding: '6px 12px', borderRadius: 6, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            CBS Golazo ↗
          </a>
        </div>
      </div>

      {/* Video */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ aspectRatio: '16/9', background: '#0d0d1f', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#444466' }}>Checking for latest show...</span>
          </div>
        ) : video ? (
          <div>
            <iframe
              src={`https://www.youtube.com/embed/${video.videoId}?rel=0`}
              style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8, border: 'none' }}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10 }}>
              <p style={{ fontSize: 13, color: '#aaaacc', lineHeight: 1.4, flex: 1 }}>{video.title}</p>
              {video.views != null && (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#778899', marginLeft: 12, whiteSpace: 'nowrap' }}>
                  {video.views >= 1_000_000
                    ? `${(video.views / 1_000_000).toFixed(1)}M views`
                    : `${Math.round(video.views / 1000)}K views`}
                </span>
              )}
            </div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#444466', marginTop: 4 }}>
              {new Date(video.publishedAt).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} EAT
            </p>
          </div>
        ) : (
          /* No video hit 90k views in last 24h — go straight to channel */
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#444466', marginBottom: 6 }}>
              No show above 100K views in the last 6 days.
            </p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#333355', marginBottom: 20 }}>
              Check back after UCL matchdays — or browse the channel.
            </p>
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#FF0000',
                background: '#FF000015', border: '1px solid #FF000044',
                padding: '12px 28px', borderRadius: 8, textDecoration: 'none', display: 'inline-block',
              }}
            >
              ▶ Go to CBS Sports Channel
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
