export interface NewsItem {
  title: string
  url: string
  source: string
  publishedAt: string
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function tag(item: string, name: string): string {
  const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))
  return match ? decodeXml(match[1].trim()) : ''
}

export async function fetchTeamNews(teamName: string, limit = 6, women = false): Promise<NewsItem[]> {
  const query = encodeURIComponent(`"${teamName.replace(/\b(women|femenino|femeni)\b/ig, "").trim()}" ${women ? "women football" : "football"} when:7d`)
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-GB&gl=GB&ceid=GB:en`
  const response = await fetch(url, {
    headers: { 'User-Agent': 'lmkEuroSoka/1.0 (+https://lmkeurosoka.vercel.app)' },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`News feed failed (${response.status})`)

  const xml = await response.text()
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map(match => {
      const rawTitle = tag(match[1], 'title')
      const source = tag(match[1], 'source') || 'Google News'
      const suffix = ` - ${source}`
      return {
        title: rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length) : rawTitle,
        url: tag(match[1], 'link'),
        source,
        publishedAt: tag(match[1], 'pubDate'),
      }
    })
    .filter(item => {
      const age = Date.now() - Date.parse(item.publishedAt)
      return item.title && /^https:\/\//.test(item.url) && age >= 0 && age <= 7 * 86_400_000
    }).slice(0, limit)
}
