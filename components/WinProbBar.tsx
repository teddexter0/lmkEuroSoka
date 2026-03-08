'use client'

interface WinProbBarProps {
  home: number; draw: number; away: number
  homeColor?: string; awayColor?: string
  homeName: string; awayName: string
}

export default function WinProbBar({ home, draw, away, homeColor = '#DA291C', awayColor = '#034694', homeName, awayName }: WinProbBarProps) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1 }}>
        <div style={{ width: `${home}%`, background: homeColor, opacity: 0.85 }} />
        <div style={{ width: `${draw}%`, background: '#555577' }} />
        <div style={{ width: `${away}%`, background: awayColor, opacity: 0.85 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#778899' }}>
        <span style={{ color: homeColor }}>{home.toFixed(0)}% {homeName.split(' ')[0]}</span>
        <span>{draw.toFixed(0)}% draw</span>
        <span style={{ color: awayColor }}>{away.toFixed(0)}% {awayName.split(' ')[0]}</span>
      </div>
    </div>
  )
}
