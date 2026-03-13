import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CBS_CHANNEL = 'UCcJ6L_EM3H3NLZE7DJDe1g'
const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLEbJmiPaOw7PfMkNcJKLPJm08rLUFhpPM'

export async function GET() {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json({ video: null, playlistUrl: PLAYLIST_URL })
    }

    const publishedAfter = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('channelId', CBS_CHANNEL)
    url.searchParams.set('q', 'Champions League')
    url.searchParams.set('type', 'video')
    url.searchParams.set('order', 'viewCount')
    url.searchParams.set('publishedAfter', publishedAfter)
    url.searchParams.set('maxResults', '5')
    url.searchParams.set('key', process.env.YOUTUBE_API_KEY!)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error('YouTube API error')
    const data = await res.json()

    const items = (data.items || []).map((item: any) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      thumbnail: item.snippet?.thumbnails?.medium?.url,
      publishedAt: item.snippet?.publishedAt,
    })).filter((v: any) => v.videoId)

    // Prefer the Golazo show over raw highlight clips
    const golazo = items.find((v: any) =>
      /UCL|champions league/i.test(v.title) && !/highlights only|goals only/i.test(v.title)
    ) || items[0] || null

    return NextResponse.json({ video: golazo, playlistUrl: PLAYLIST_URL })
  } catch {
    return NextResponse.json({ video: null, playlistUrl: PLAYLIST_URL })
  }
}
