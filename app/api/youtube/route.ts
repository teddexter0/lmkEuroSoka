import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
const CBS_CHANNEL = 'UCET00YnetHT7tOpu12v8jxg'
const CHANNEL_URL = 'https://www.youtube.com/@CBSSportsGolazo'
const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLEbJmiPaOw7PfMkNcJKLPJm08rLUFhpPM'

function xmlValue(entry: string, tag: string): string {
  const match = entry.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
  return match?.[1]?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() || ''
}

export async function GET() {
  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CBS_CHANNEL}`, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error(`YouTube feed returned ${response.status}`)
    const xml = await response.text()
    const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map(match => {
      const videoId = xmlValue(match[1], 'yt:videoId')
      return { videoId, title: xmlValue(match[1], 'title'), thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, publishedAt: xmlValue(match[1], 'published') }
    }).filter(video => video.videoId)
    const video = videos.find(item => /golazo|champions league|ucl/i.test(item.title)) || videos[0] || null
    return NextResponse.json({ video, channelUrl: CHANNEL_URL, playlistUrl: PLAYLIST_URL }, { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' } })
  } catch (error) {
    console.warn('[/api/youtube] feed unavailable:', error)
    return NextResponse.json({ video: null, channelUrl: CHANNEL_URL, playlistUrl: PLAYLIST_URL }, { headers: { 'Cache-Control': 'public, s-maxage=300' } })
  }
}
