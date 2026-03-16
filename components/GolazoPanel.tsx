'use client'
import { useState, useEffect } from 'react'
import type { YoutubeVideo } from '@/types'

export default function GolazoPanel() {
  const [video, setVideo] = useState<YoutubeVideo | null>(null)
  const [playlistUrl, setPlaylistUrl] = useState('https://www.youtube.com/playlist?list=PLEbJmiPaOw7PfMkNcJKLPJm08rLUFhpPM')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/youtube')
      .then(r => r.json())
      .then(data => {
        setVideo(data.video)
        if (data.playlistUrl) setPlaylistUrl(data.playlistUrl)
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
            href={playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#FF0000',
              background: '#FF000018', border: '1px solid #FF000033',
              padding: '6px 12px', borderRadius: 6, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            ▶ Full Playlist
          </a>
        </div>
      </div>

      {/* Video */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ aspectRatio: '16/9', background: '#0d0d1f', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#444466' }}>Loading latest UCL show...</span>
          </div>
        ) : video ? (
          <div>
            <iframe
              src={`https://www.youtube.com/embed/${video.videoId}?rel=0`}
              style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8, border: 'none' }}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <p style={{ fontSize: 13, color: '#aaaacc', marginTop: 10, lineHeight: 1.4 }}>{video.title}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#444466', marginTop: 4 }}>
              {new Date(video.publishedAt).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} EAT
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#444466', marginBottom: 12 }}>
              No UCL show in the last 72hrs.
            </p>
            <a
              href={playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, color: '#FF0000',
                background: '#FF000015', border: '1px solid #FF000033',
                padding: '10px 20px', borderRadius: 8, textDecoration: 'none', display: 'inline-block',
              }}
            >
              Watch all Golazo UCL episodes ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
