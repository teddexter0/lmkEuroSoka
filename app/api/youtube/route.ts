import { NextResponse } from 'next/server'
import type { YoutubeVideo } from '@/types'

export const dynamic = 'force-dynamic'
const CHANNEL_ID = 'UCET00YnetHT7tOpu12v8jxg'
const CHANNEL_URL = 'https://www.youtube.com/@CBSSportsGolazo'
const HOUR = 3_600_000

type Candidate = YoutubeVideo & { description: string }

function xmlValue(entry: string, tag: string): string {
  const match = entry.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim() || ''
}

function isPanelClip(video: Candidate) {
  const title = video.title
  const editorialDescription = video.description.split(/\n\s*(?:Stream UCL|Watch UCL|Subscribe to|Home of UEFA)/i)[0]
  const names = [/\b(?:thierry|henry|titi)\b/i, /\b(?:kate|abdo)\b/i, /\b(?:jamie|carragher|carra)\b/i, /\b(?:micah|richards)\b/i]
  const text = `${title}\n${editorialDescription}`
  if (/\b(?:extended|match) highlights\b|\bfull match\b/i.test(title) && !/\b(?:ucl today|show highlights)\b/i.test(title)) return false
  return /\bUCL Today\b/i.test(text) || names.filter(name => name.test(text)).length >= 2
}

function pickVideo(candidates: Candidate[], now = Date.now()): YoutubeVideo | null {
  const ranked = candidates.flatMap(({ description, ...video }) => {
    const age = (now - Date.parse(video.publishedAt)) / HOUR
    if (!(age > 0 && age <= 16) || video.views == null || !Number.isFinite(video.views) ||
        !isPanelClip({ ...video, description })) return []
    return [{ ...video, viewsPerHour: video.views / age }]
  }).sort((a,b) => b.viewsPerHour - a.viewsPerHour || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  return ranked[0] ?? null
}

async function youtubeApi(path: string, params: Record<string, string>, key: string) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`)
  url.search = new URLSearchParams({ ...params, key }).toString()
  const response = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(4500) })
  if (!response.ok) throw new Error(`YouTube API returned ${response.status}`)
  return response.json()
}

async function apiCandidates(key: string): Promise<Candidate[]> {
  const ids: string[] = []
  const cutoff = Date.now() - 16 * HOUR
  let pageToken: string | undefined
  do {
    const page: any = await youtubeApi('playlistItems', {
      part: 'contentDetails', playlistId: `UU${CHANNEL_ID.slice(2)}`, maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    }, key)
    for (const item of page.items ?? []) {
      if (Date.parse(item.contentDetails?.videoPublishedAt) >= cutoff) ids.push(item.contentDetails.videoId)
    }
    const last = page.items?.at(-1)?.contentDetails?.videoPublishedAt
    pageToken = last && Date.parse(last) >= cutoff ? page.nextPageToken : undefined
  } while (pageToken && ids.length < 150)
  const chunks = Array.from({ length: Math.ceil(ids.length / 50) }, (_, i) => ids.slice(i * 50, (i + 1) * 50))
  const pages = await Promise.all(chunks.map(chunk => youtubeApi('videos', {
    part: 'snippet,statistics,status', id: chunk.join(','),
  }, key)))
  return pages.flatMap(page => (page.items ?? []).flatMap((item: any) => {
    const { id, snippet, statistics, status } = item
    if (snippet?.channelId !== CHANNEL_ID || snippet.liveBroadcastContent !== 'none' || !status?.embeddable) return []
    return [{
      videoId: id, title: snippet.title, description: snippet.description || '', publishedAt: snippet.publishedAt,
      thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      views: statistics?.viewCount == null ? undefined : Number(statistics.viewCount),
    }]
  }))
}

async function feedCandidates(): Promise<Candidate[]> {
  const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
    { next: { revalidate: 300 }, signal: AbortSignal.timeout(6000) })
  if (!response.ok) throw new Error(`YouTube feed returned ${response.status}`)
  return [...(await response.text()).matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].flatMap(([, entry]) => {
    const videoId = xmlValue(entry, 'yt:videoId')
    if (!/^[\w-]{11}$/.test(videoId)) return []
    const views = entry.match(/<media:statistics\b[^>]*\bviews="(\d+)"/)?.[1]
    return [{
      videoId, title: xmlValue(entry, 'title'), description: xmlValue(entry, 'media:description'),
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, publishedAt: xmlValue(entry, 'published'),
      views: views == null ? undefined : Number(views),
    }]
  })
}

export async function GET() {
  const key = process.env.YOUTUBE_API_KEY
  try {
    const candidates = key ? await apiCandidates(key).catch(() => feedCandidates()) : await feedCandidates()
    const video = pickVideo(candidates)
    const missingViews = candidates.some(item => {
      const age = Date.now() - Date.parse(item.publishedAt)
      return age > 0 && age <= 16 * HOUR && isPanelClip(item) && item.views == null
    })
    return NextResponse.json({ video, channelUrl: CHANNEL_URL, status: video ? 'ranked' : missingViews ? 'views-unavailable' : 'no-match' },
      { headers: { 'Cache-Control': 'public, s-maxage=120' } })
  } catch {
    return NextResponse.json({ video: null, channelUrl: CHANNEL_URL, status: 'feed-unavailable' },
      { headers: { 'Cache-Control': 'public, s-maxage=60' } })
  }
}
