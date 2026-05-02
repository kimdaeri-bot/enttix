import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://v3.football.api-sports.io'

const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 60 * 60 * 1000

async function fetchFootball(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const cacheKey = `team:${endpoint}?${qs}`
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
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params

  if (!teamId) {
    return NextResponse.json({ error: 'teamId required' }, { status: 400 })
  }

  const season = '2024'

  try {
    const [teamRaw, playersRaw, fixturesRaw, injuriesRaw] = await Promise.all([
      fetchFootball('/teams', { id: teamId }) as Promise<AnyData[]>,
      fetchFootball('/players', { team: teamId, season }) as Promise<AnyData[]>,
      fetchFootball('/fixtures', { team: teamId, season, last: '10' }) as Promise<AnyData[]>,
      fetchFootball('/injuries', { team: teamId, season }) as Promise<AnyData[]>,
    ])

    // Team info
    const teamData = teamRaw?.[0]
    const teamInfo = teamData
      ? {
          id: teamData.team?.id,
          name: teamData.team?.name,
          code: teamData.team?.code,
          country: teamData.team?.country,
          founded: teamData.team?.founded,
          logo: teamData.team?.logo,
          venue: {
            name: teamData.venue?.name,
            city: teamData.venue?.city,
            capacity: teamData.venue?.capacity,
            image: teamData.venue?.image,
          },
        }
      : null

    // Squad grouped by position
    const positionOrder: Record<string, number> = {
      Goalkeeper: 0,
      Defender: 1,
      Midfielder: 2,
      Attacker: 3,
    }

    const players = (playersRaw || []).map((entry: AnyData) => {
      const stats = entry.statistics?.[0]
      return {
        id: entry.player?.id,
        name: entry.player?.name,
        photo: entry.player?.photo,
        age: entry.player?.age,
        nationality: entry.player?.nationality,
        position: stats?.games?.position || 'Unknown',
        appearances: stats?.games?.appearences ?? 0,
        goals: stats?.goals?.total ?? 0,
        assists: stats?.goals?.assists ?? 0,
        rating: stats?.games?.rating
          ? parseFloat(stats.games.rating).toFixed(1)
          : null,
        yellowCards: stats?.cards?.yellow ?? 0,
        redCards: stats?.cards?.red ?? 0,
      }
    })

    players.sort((a: AnyData, b: AnyData) => {
      const posA = positionOrder[a.position] ?? 4
      const posB = positionOrder[b.position] ?? 4
      if (posA !== posB) return posA - posB
      return (b.appearances ?? 0) - (a.appearances ?? 0)
    })

    const squad: Record<string, AnyData[]> = {}
    for (const player of players) {
      const pos = player.position
      if (!squad[pos]) squad[pos] = []
      squad[pos].push(player)
    }

    // Recent fixtures
    const fixtures = (fixturesRaw || []).map((f: AnyData) => ({
      id: f.fixture?.id,
      date: f.fixture?.date,
      venue: f.fixture?.venue?.name,
      status: f.fixture?.status?.short,
      league: {
        name: f.league?.name,
        logo: f.league?.logo,
      },
      home: {
        id: f.teams?.home?.id,
        name: f.teams?.home?.name,
        logo: f.teams?.home?.logo,
        winner: f.teams?.home?.winner,
      },
      away: {
        id: f.teams?.away?.id,
        name: f.teams?.away?.name,
        logo: f.teams?.away?.logo,
        winner: f.teams?.away?.winner,
      },
      goals: {
        home: f.goals?.home,
        away: f.goals?.away,
      },
    }))

    // Injuries
    const injuries = (injuriesRaw || []).slice(0, 10).map((i: AnyData) => ({
      player: {
        id: i.player?.id,
        name: i.player?.name,
        photo: i.player?.photo,
        type: i.player?.type,
        reason: i.player?.reason,
      },
    }))

    return NextResponse.json({
      team: teamInfo,
      squad,
      fixtures,
      injuries,
    })
  } catch (err) {
    console.error('[team API]', err)
    return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 })
  }
}
