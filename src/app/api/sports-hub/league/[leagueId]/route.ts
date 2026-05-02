import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://v3.football.api-sports.io'

const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 60 * 60 * 1000

async function fetchFootball(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const cacheKey = `league:${endpoint}?${qs}`
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params

  if (!leagueId) {
    return NextResponse.json({ error: 'leagueId required' }, { status: 400 })
  }

  const season = '2024'

  try {
    const [standingsRaw, fixturesRaw, scorersRaw] = await Promise.all([
      fetchFootball('/standings', { league: leagueId, season }) as Promise<AnyData[]>,
      fetchFootball('/fixtures', { league: leagueId, season, next: '10' }) as Promise<AnyData[]>,
      fetchFootball('/players/topscorers', { league: leagueId, season }) as Promise<AnyData[]>,
    ])

    // Parse standings
    const standingsTable = standingsRaw?.[0]?.league?.standings?.[0] || []
    const standings = standingsTable.map((entry: AnyData) => ({
      rank: entry.rank,
      team: {
        id: entry.team.id,
        name: entry.team.name,
        logo: entry.team.logo,
      },
      played: entry.all?.played ?? 0,
      won: entry.all?.win ?? 0,
      drawn: entry.all?.draw ?? 0,
      lost: entry.all?.lose ?? 0,
      goalsFor: entry.all?.goals?.for ?? 0,
      goalsAgainst: entry.all?.goals?.against ?? 0,
      goalDiff: entry.goalsDiff ?? 0,
      points: entry.points ?? 0,
      form: entry.form || '',
    }))

    // Parse fixtures
    const fixtures = (fixturesRaw || []).map((f: AnyData) => ({
      id: f.fixture?.id,
      date: f.fixture?.date,
      venue: f.fixture?.venue?.name,
      status: f.fixture?.status?.short,
      home: {
        id: f.teams?.home?.id,
        name: f.teams?.home?.name,
        logo: f.teams?.home?.logo,
      },
      away: {
        id: f.teams?.away?.id,
        name: f.teams?.away?.name,
        logo: f.teams?.away?.logo,
      },
      goals: {
        home: f.goals?.home,
        away: f.goals?.away,
      },
    }))

    // Parse top scorers
    const topScorers = (scorersRaw || []).slice(0, 5).map((entry: AnyData) => ({
      player: {
        id: entry.player?.id,
        name: entry.player?.name,
        photo: entry.player?.photo,
        nationality: entry.player?.nationality,
      },
      team: {
        id: entry.statistics?.[0]?.team?.id,
        name: entry.statistics?.[0]?.team?.name,
        logo: entry.statistics?.[0]?.team?.logo,
      },
      goals: entry.statistics?.[0]?.goals?.total ?? 0,
      assists: entry.statistics?.[0]?.goals?.assists ?? 0,
      appearances: entry.statistics?.[0]?.games?.appearences ?? 0,
      rating: entry.statistics?.[0]?.games?.rating
        ? parseFloat(entry.statistics[0].games.rating).toFixed(1)
        : null,
    }))

    const leagueInfo = standingsRaw?.[0]?.league
      ? {
          id: standingsRaw[0].league.id,
          name: standingsRaw[0].league.name,
          country: standingsRaw[0].league.country,
          logo: standingsRaw[0].league.logo,
          flag: standingsRaw[0].league.flag,
          season: standingsRaw[0].league.season,
        }
      : null

    return NextResponse.json({
      league: leagueInfo,
      standings,
      fixtures,
      topScorers,
    })
  } catch (err) {
    console.error('[league API]', err)
    return NextResponse.json({ error: 'Failed to fetch league data' }, { status: 500 })
  }
}
