export function clubNameKey(name: string) {
  const key = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').replace(/\b(fc|cf|afc|ac|as|sc|ssc|bc|wfc|w|women|femenino|feminine|femeni|ladies)\b/g, '')
    .trim().replace(/\s+/g, ' ')
  const aliases: Record<string, string> = {
    'man utd': 'manchester united', 'man united': 'manchester united', 'man city': 'manchester city',
    'tottenham hotspur': 'tottenham', 'spurs': 'tottenham', 'brighton and hove albion': 'brighton',
    'brighton hove albion': 'brighton', 'bayern munchen': 'bayern munich', 'bayer 04 leverkusen': 'bayer leverkusen',
    'inter milan': 'inter', 'internazionale': 'inter', 'paris saint germain': 'psg',
    'paris sg': 'psg', 'olympique de marseille': 'marseille', 'losc lille': 'lille', 'lille osc': 'lille',
    'atletico de madrid': 'atletico madrid', 'lyon': 'lyonnes', 'ol lyonnes': 'lyonnes',
    'olympique lyonnais': 'lyonnes', 'london city lionesses': 'london city',
  }
  return aliases[key] || key
}
