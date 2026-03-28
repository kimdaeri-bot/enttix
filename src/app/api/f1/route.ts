import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const F1_KEY = process.env.API_FOOTBALL_KEY! // 같은 API-Sports 키
const F1_BASE = 'https://v1.formula-1.api-sports.io'
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!

const cache = new Map<string, { data: unknown; ts: number }>()
const TTL = 60 * 60 * 1000 // 1시간

async function f1(endpoint: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  const key = `f1:${endpoint}?${qs}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < TTL) return hit.data
  const res = await fetch(`${F1_BASE}${endpoint}?${qs}`, {
    headers: { 'x-apisports-key': F1_KEY },
  })
  const json = await res.json()
  const data = json.response
  cache.set(key, { data, ts: Date.now() })
  return data
}

// 그랑프리 이름 → competition_id 매핑
const GP_MAP: Record<string, number> = {
  'bahrain': 2, 'saudi arabia': 32, 'australia': 1, 'japan': 19,
  'china': 4, 'miami': 34, 'emilia romagna': 29, 'imola': 29,
  'monaco': 7, 'canada': 9, 'spain': 6, 'barcelona': 6,
  'austria': 10, 'britain': 5, 'silverstone': 5, 'british': 5,
  'hungary': 11, 'belgium': 12, 'netherlands': 13, 'dutch': 13, 'zandvoort': 13,
  'italy': 14, 'monza': 14, 'italian': 14,
  'azerbaijan': 15, 'baku': 15,
  'singapore': 16, 'united states': 17, 'austin': 17, 'cota': 17,
  'mexico': 18, 'brazil': 20, 'sao paulo': 20,
  'las vegas': 35, 'qatar': 21, 'abu dhabi': 22,
  'saudi': 32,
}

function findGpId(name: string): number | null {
  const lower = name.toLowerCase()
  for (const [key, id] of Object.entries(GP_MAP)) {
    if (lower.includes(key)) return id
  }
  return null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const season = searchParams.get('season') || '2024'

  try {
    // ── 단순 데이터 엔드포인트 ──
    if (type === 'drivers') {
      const data = await f1('/rankings/drivers', { season })
      return NextResponse.json(data)
    }
    if (type === 'teams') {
      const data = await f1('/rankings/teams', { season })
      return NextResponse.json(data)
    }
    if (type === 'races') {
      const data = await f1('/races', { season, type: 'Race' })
      return NextResponse.json(data)
    }
    if (type === 'status') {
      const res = await fetch(`${F1_BASE}/status`, { headers: { 'x-apisports-key': F1_KEY } })
      return NextResponse.json((await res.json()).response)
    }

    // ── F1 그랑프리 풀 분석 ──
    if (type === 'gp-analysis') {
      const gpName = searchParams.get('gp') || ''

      // 병렬 데이터 수집
      const [driversRaw, teamsRaw, racesRaw] = await Promise.all([
        f1('/rankings/drivers', { season }) as Promise<any[]>,
        f1('/rankings/teams', { season }) as Promise<any[]>,
        f1('/races', { season, type: 'Race' }) as Promise<any[]>,
      ])

      const drivers = driversRaw as any[]
      const teams = teamsRaw as any[]
      const races = racesRaw as any[]

      // 해당 GP 경기 결과 찾기
      const gpId = findGpId(gpName)
      const gpRaces = gpId
        ? races.filter((r: any) => r.competition?.id === gpId)
        : []
      const raceResult = gpRaces.find((r: any) => r.type === 'Race')

      // 드라이버 결과 조회
      let raceResults: any[] = []
      if (raceResult?.id) {
        const res = await f1('/rankings/races', { race: String(raceResult.id) }) as any[]
        raceResults = res || []
      }

      // 드라이버별 최근 성적 (시즌 전체 기준)
      const top10Drivers = drivers.slice(0, 10)

      // 컨스트럭터 상위 5팀
      const top5Teams = teams.slice(0, 5)

      // Claude AI 분석
      const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

      const prompt = `You are an expert Formula 1 analyst. Analyze the upcoming ${gpName || 'Formula 1 Grand Prix'} and create a professional race preview in Korean.

2024 SEASON CONTEXT:
Driver Championship Top 5:
${top10Drivers.slice(0, 5).map((d: any) => `${d.position}. ${d.driver.name} (${d.team.name}) — ${d.points}pts, ${d.wins}wins`).join('\n')}

Constructor Championship Top 5:
${top5Teams.map((t: any) => `${t.position}. ${t.team.name} — ${t.points}pts`).join('\n')}

${raceResult ? `Circuit: ${raceResult.circuit?.name}, ${raceResult.circuit?.location?.city}, ${raceResult.circuit?.location?.country}` : `GP: ${gpName}`}

${raceResults.length > 0 ? `Race Results at this circuit (2024):\n${raceResults.slice(0, 5).map((r: any) => `P${r.position}: ${r.driver?.name} (${r.team?.name})`).join('\n')}` : ''}

Respond with this EXACT JSON structure (Korean text):
{
  "raceOverview": "2-3 sentences about this race and circuit characteristics in Korean",
  "circuitAnalysis": "2 sentences about what makes this circuit unique — corners, DRS zones, overtaking spots — in Korean",
  "titleFight": "1-2 sentences about championship battle context in Korean",
  "teamBattles": [
    {"teams": "Red Bull vs McLaren", "description": "한 문장 분석"},
    {"teams": "Ferrari vs Mercedes", "description": "한 문장 분석"},
    {"teams": "미드필드 배틀", "description": "한 문장 분석"}
  ],
  "driverSpotlight": [
    {"name": "Max Verstappen", "reason": "이 서킷에서 주목해야 하는 이유 한 문장"},
    {"name": "Lando Norris", "reason": "이 서킷에서 주목해야 하는 이유 한 문장"},
    {"name": "Charles Leclerc", "reason": "이 서킷에서 주목해야 하는 이유 한 문장"}
  ],
  "racePrediction": {
    "winner": "예상 우승자 이름",
    "podium": ["1st name", "2nd name", "3rd name"],
    "darkHorse": "다크호스 드라이버 이름",
    "darkHorseReason": "한 문장 이유"
  },
  "strategyInsight": "2 sentences about expected race strategy — tire choices, pit windows, safety car impact — in Korean",
  "watchReason": "Why a fan should buy a ticket to watch this GP live — 2 exciting sentences in Korean"
}`

      const aiRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      })

      let analysis: any = {}
      try {
        const text = (aiRes.content[0] as any).text
        const match = text.match(/\{[\s\S]+\}/)
        if (match) analysis = JSON.parse(match[0])
      } catch { analysis = {} }

      return NextResponse.json({
        season,
        gp: {
          name: gpName,
          circuit: raceResult?.circuit || null,
          date: raceResult?.date || null,
          laps: raceResult?.laps?.total || null,
          distance: raceResult?.distance || null,
        },
        drivers: top10Drivers.map((d: any) => ({
          position: d.position,
          name: d.driver.name,
          abbr: d.driver.abbr,
          number: d.driver.number,
          image: d.driver.image,
          team: d.team.name,
          teamLogo: d.team.logo,
          points: d.points,
          wins: d.wins,
          behind: d.behind,
        })),
        teams: top5Teams.map((t: any) => ({
          position: t.position,
          name: t.team.name,
          logo: t.team.logo,
          points: t.points,
        })),
        raceResults: raceResults.slice(0, 10).map((r: any) => ({
          position: r.position,
          driver: r.driver?.name,
          team: r.team?.name,
          time: r.time?.time,
          points: r.points,
        })),
        analysis,
      })
    }

    return NextResponse.json({ error: 'type: drivers | teams | races | gp-analysis | status' }, { status: 400 })
  } catch (err) {
    console.error('[F1 API]', err)
    return NextResponse.json({ error: 'F1 API failed' }, { status: 500 })
  }
}
