import { NextResponse } from 'next/server'

const API_KEY = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://v3.football.api-sports.io'

const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 60 * 60 * 1000

async function fetchFootball(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const cacheKey = `hot:${endpoint}?${qs}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  const res = await fetch(`${BASE_URL}${endpoint}?${qs}`, {
    headers: { 'x-apisports-key': API_KEY },
  })
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)
  const json = await res.json()
  cache.set(cacheKey, { data: json.response, ts: Date.now() })
  return json.response
}

const TOP_LEAGUES = [
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 61, name: 'Ligue 1', country: 'France' },
]

const SAME_CITY_DERBIES: Record<string, number[][]> = {
  '39': [[33, 50], [42, 47], [49, 36], [45, 40]], // Man Utd-City, Arsenal-Spurs, Chelsea-Fulham, Everton-Liverpool
  '140': [[541, 530], [529, 536]], // Real-Atletico, Barca-Sevilla (loosely)
  '78': [[157, 165]], // Bayern-Dortmund (Der Klassiker)
  '135': [[505, 489], [497, 492]], // Inter-Milan, Roma-Napoli (loosely)
  '61': [[85, 81]], // PSG-Marseille (Le Classique)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

let hotMatchesCacheRef: { data: AnyData; ts: number } | null = null

export async function GET() {
  if (hotMatchesCacheRef && Date.now() - hotMatchesCacheRef.ts < CACHE_TTL) {
    return NextResponse.json(hotMatchesCacheRef.data)
  }

  try {
    const season = '2024'
    const today = new Date()
    const from = today.toISOString().slice(0, 10)
    const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const to = futureDate.toISOString().slice(0, 10)

    // Fetch fixtures and standings for all leagues in parallel
    const [fixturesResults, standingsResults] = await Promise.all([
      Promise.all(
        TOP_LEAGUES.map((league) =>
          fetchFootball('/fixtures', {
            league: String(league.id),
            season,
            from,
            to,
          }).then((data) => ({ leagueId: league.id, leagueName: league.name, fixtures: data as AnyData[] }))
        )
      ),
      Promise.all(
        TOP_LEAGUES.map((league) =>
          fetchFootball('/standings', {
            league: String(league.id),
            season,
          }).then((data) => ({ leagueId: league.id, standings: data as AnyData[] }))
        )
      ),
    ])

    // Build standings lookup
    const standingsMap = new Map<number, Map<number, AnyData>>()
    for (const { leagueId, standings } of standingsResults) {
      const teamMap = new Map<number, AnyData>()
      const table = standings?.[0]?.league?.standings?.[0] || []
      for (const entry of table) {
        teamMap.set(entry.team.id, entry)
      }
      standingsMap.set(leagueId, teamMap)
    }

    // Score and collect all fixtures
    const scoredMatches: AnyData[] = []

    for (const { leagueId, leagueName, fixtures } of fixturesResults) {
      const teamStandings = standingsMap.get(leagueId) || new Map()
      const derbies = SAME_CITY_DERBIES[String(leagueId)] || []

      for (const fixture of fixtures || []) {
        const homeId = fixture.teams?.home?.id
        const awayId = fixture.teams?.away?.id
        if (!homeId || !awayId) continue

        const homeStanding = teamStandings.get(homeId)
        const awayStanding = teamStandings.get(awayId)
        const homeRank = homeStanding?.rank ?? 99
        const awayRank = awayStanding?.rank ?? 99

        let score = 0

        // Rank difference < 3
        if (Math.abs(homeRank - awayRank) < 3) score += 30

        // Top 5 teams
        if (homeRank <= 5) score += 20
        if (awayRank <= 5) score += 20

        // Same city derby
        const isDerby = derbies.some(
          (pair) =>
            (pair.includes(homeId) && pair.includes(awayId))
        )
        if (isDerby) score += 25

        // H2H avg goals > 2.5 bonus (approximate using form)
        const homeForm = homeStanding?.form || ''
        const awayForm = awayStanding?.form || ''
        const totalWins = (homeForm.match(/W/g)?.length || 0) + (awayForm.match(/W/g)?.length || 0)
        if (totalWins >= 5) score += 10

        scoredMatches.push({
          id: fixture.fixture?.id,
          date: fixture.fixture?.date,
          venue: fixture.fixture?.venue?.name,
          city: fixture.fixture?.venue?.city,
          league: {
            id: leagueId,
            name: leagueName,
            logo: fixture.league?.logo,
          },
          home: {
            id: homeId,
            name: fixture.teams.home.name,
            logo: fixture.teams.home.logo,
            rank: homeRank,
            form: homeForm,
          },
          away: {
            id: awayId,
            name: fixture.teams.away.name,
            logo: fixture.teams.away.logo,
            rank: awayRank,
            form: awayForm,
          },
          score,
          isDerby,
        })
      }
    }

    // Sort by score and take top 6
    scoredMatches.sort((a, b) => b.score - a.score)
    const topMatches = scoredMatches.slice(0, 6)

    hotMatchesCacheRef = { data: topMatches, ts: Date.now() }
    return NextResponse.json(topMatches)
  } catch (err) {
    console.error('[hot-matches]', err)
    return NextResponse.json({ error: 'Failed to fetch hot matches' }, { status: 500 })
  }
}
