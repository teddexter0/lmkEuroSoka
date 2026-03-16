import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CBS_CHANNEL = 'UCcJ6L_EM3H3NLZE7DJDe1g'
const CHANNEL_URL = 'https://www.youtube.com/@CBSSports'
const VIEWS_THRESHOLD = 90_000

export async function GET() {
  const fallback = { video: null, channelUrl: CHANNEL_URL }

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json(fallback)
  }

  const KEY = process.env.YOUTUBE_API_KEY!

  try {
    // Step 1: search for recent videos from CBS channel (last 24 hours)
    const publishedAfter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('channelId', CBS_CHANNEL)
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('order', 'date')
    searchUrl.searchParams.set('publishedAfter', publishedAfter)
    searchUrl.searchParams.set('maxResults', '10')
    searchUrl.searchParams.set('part', 'id,snippet')
    searchUrl.searchParams.set('key', KEY)

    const searchRes = await fetch(searchUrl.toString())
    if (!searchRes.ok) throw new Error(`YouTube search error: ${searchRes.status}`)
    const searchData = await searchRes.json()

    const items: Array<{ videoId: string; title: string; thumbnail: string; publishedAt: string }> =
      (searchData.items || [])
        .filter((item: any) => item.id?.videoId)
        .map((item: any) => ({
          videoId: item.id.videoId,
          title: item.snippet?.title ?? '',
          thumbnail: item.snippet?.thumbnails?.medium?.url ?? '',
          publishedAt: item.snippet?.publishedAt ?? '',
        }))

    if (!items.length) {
      return NextResponse.json(fallback)
    }

    // Step 2: fetch view counts for those videos (search API doesn't include stats)
    const ids = items.map(v => v.videoId).join(',')
    const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    statsUrl.searchParams.set('id', ids)
    statsUrl.searchParams.set('part', 'statistics')
    statsUrl.searchParams.set('key', KEY)

    const statsRes = await fetch(statsUrl.toString())
    if (!statsRes.ok) throw new Error(`YouTube stats error: ${statsRes.status}`)
    const statsData = await statsRes.json()

    const viewMap: Record<string, number> = {}
    for (const item of (statsData.items || [])) {
      viewMap[item.id] = parseInt(item.statistics?.viewCount ?? '0', 10)
    }

    // Step 3: find the most-viewed video published in last 24h that clears 90k views
    const qualified = items
      .map(v => ({ ...v, views: viewMap[v.videoId] ?? 0 }))
      .filter(v => v.views >= VIEWS_THRESHOLD)
      .sort((a, b) => b.views - a.views)

    const best = qualified[0] ?? null
    return NextResponse.json({ video: best, channelUrl: CHANNEL_URL })
  } catch (e: any) {
    console.error('[/api/youtube]', e?.message)
    return NextResponse.json(fallback)
  }
}
