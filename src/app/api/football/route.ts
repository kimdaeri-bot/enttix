import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://v3.football.api-sports.io'

// 간단 인메모리 캐시 (서버 재시작 시 초기화)
const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1시간

async function fetchFootball(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const cacheKey = `${endpoint}?${qs}`

  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data
  }

  const res = await fetch(`${BASE_URL}${endpoint}?${qs}`, {
    headers: {
      'x-apisports-key': API_KEY,
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)
  const json = await res.json()
  cache.set(cacheKey, { data: json.response, ts: Date.now() })
  return json.response
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  try {
    switch (type) {
      // 팀 검색: ?type=team&name=Manchester+City
      case 'team': {
        const name = searchParams.get('name')
        if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
        const data = await fetchFootball('/teams', { search: name })
        return NextResponse.json(data)
      }

      // 리그 순위: ?type=standings&league=39&season=2024
      case 'standings': {
        const league = searchParams.get('league') ?? '39' // 39 = EPL
        const season = searchParams.get('season') ?? '2024'
        const data = await fetchFootball('/standings', { league, season })
        return NextResponse.json(data)
      }

      // 경기 조회: ?type=fixtures&team=33&season=2024 or &league=39&next=10
      case 'fixtures': {
        const params: Record<string, string> = {}
        if (searchParams.get('team')) params.team = searchParams.get('team')!
        if (searchParams.get('league')) params.league = searchParams.get('league')!
        if (searchParams.get('season')) params.season = searchParams.get('season')!
        if (searchParams.get('next')) params.next = searchParams.get('next')!
        if (searchParams.get('from')) params.from = searchParams.get('from')!
        if (searchParams.get('to')) params.to = searchParams.get('to')!
        if (searchParams.get('id')) params.id = searchParams.get('id')!
        const data = await fetchFootball('/fixtures', params)
        return NextResponse.json(data)
      }

      // H2H 전적: ?type=h2h&h2h=33-40
      case 'h2h': {
        const h2h = searchParams.get('h2h')
        if (!h2h) return NextResponse.json({ error: 'h2h required (e.g. 33-40)' }, { status: 400 })
        const data = await fetchFootball('/fixtures/headtohead', { h2h, last: '5' })
        return NextResponse.json(data)
      }

      // 선수 통계: ?type=players&team=33&season=2024
      case 'players': {
        const team = searchParams.get('team')
        const season = searchParams.get('season') ?? '2024'
        if (!team) return NextResponse.json({ error: 'team required' }, { status: 400 })
        const data = await fetchFootball('/players', { team, season })
        return NextResponse.json(data)
      }

      // 부상 선수: ?type=injuries&team=33&season=2024
      case 'injuries': {
        const team = searchParams.get('team')
        const league = searchParams.get('league') ?? '39'
        const season = searchParams.get('season') ?? '2024'
        const params: Record<string, string> = { league, season }
        if (team) params.team = team
        const data = await fetchFootball('/injuries', params)
        return NextResponse.json(data)
      }

      // API 상태 확인: ?type=status
      case 'status': {
        const res = await fetch(`${BASE_URL}/status`, {
          headers: { 'x-apisports-key': API_KEY },
        })
        const json = await res.json()
        return NextResponse.json(json.response)
      }

      default:
        return NextResponse.json(
          { error: 'type required: team | standings | fixtures | h2h | players | injuries | status' },
          { status: 400 }
        )
    }
  } catch (err) {
    console.error('[API-Football]', err)
    return NextResponse.json({ error: 'API-Football request failed' }, { status: 500 })
  }
}
