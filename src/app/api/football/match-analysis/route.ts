import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const FOOTBALL_KEY = process.env.API_FOOTBALL_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!
const FB_BASE = 'https://v3.football.api-sports.io'

// ── 인메모리 캐시 (1시간) ──
const cache = new Map<string, { data: unknown; ts: number }>()
const TTL = 60 * 60 * 1000

async function fb(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const key = `${endpoint}?${qs}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < TTL) return hit.data
  const res = await fetch(`${FB_BASE}${endpoint}?${qs}`, {
    headers: { 'x-apisports-key': FOOTBALL_KEY },
  })
  const json = await res.json()
  cache.set(key, { data: json.response, ts: Date.now() })
  return json.response
}

// 팀명 → API-Football team_id 퍼지 매핑
const TEAM_ALIASES: Record<string, number> = {
  'manchester city': 50,   'man city': 50,
  'manchester united': 33, 'man united': 33, 'man utd': 33,
  'liverpool': 40,
  'arsenal': 42,
  'chelsea': 49,
  'tottenham': 47,          'spurs': 47, 'tottenham hotspur': 47,
  'newcastle': 34,          'newcastle united': 34,
  'west ham': 48,           'west ham united': 48,
  'aston villa': 66,
  'brighton': 51,
  'brentford': 55,
  'everton': 45,
  'fulham': 36,
  'wolverhampton': 39,      'wolves': 39,
  'nottingham forest': 65,
  'bournemouth': 35,
  'crystal palace': 52,
  'leicester': 46,          'leicester city': 46,
  'southampton': 41,
  'ipswich': 57,            'ipswich town': 57,
  // La Liga
  'barcelona': 529,          'fc barcelona': 529,
  'real madrid': 541,
  'atletico madrid': 530,   'atletico': 530,
  'sevilla': 536,
  'real sociedad': 548,
  'athletic bilbao': 531,   'athletic club': 531,
  'villarreal': 533,
  'valencia': 532,
  // Bundesliga
  'bayern munich': 157,     'fc bayern': 157, 'bayern': 157,
  'borussia dortmund': 165, 'dortmund': 165, 'bvb': 165,
  'bayer leverkusen': 168,  'leverkusen': 168,
  'rb leipzig': 173,         'leipzig': 173,
  // Serie A
  'juventus': 496,
  'inter milan': 505,        'inter': 505,
  'ac milan': 489,           'milan': 489,
  'napoli': 492,
  'roma': 497,               'as roma': 497,
  // Ligue 1
  'paris saint-germain': 85, 'psg': 85,
  'marseille': 81,
  'lyon': 80,
  'monaco': 91,
}

function findTeamId(name: string): number | null {
  const lower = name.toLowerCase().trim()
  if (TEAM_ALIASES[lower]) return TEAM_ALIASES[lower]
  // 부분 매칭
  for (const [alias, id] of Object.entries(TEAM_ALIASES)) {
    if (lower.includes(alias) || alias.includes(lower)) return id
  }
  return null
}

function parseTeams(eventName: string): [string, string] | null {
  // "Team A vs Team B" or "Team A v Team B"
  const sep = eventName.match(/\s+vs\.?\s+|\s+v\.?\s+/i)
  if (!sep) return null
  const [home, away] = eventName.split(sep[0])
  return [home.trim(), away.trim()]
}

function getLeagueFromTeams(id1: number, id2: number): { league: string; leagueId: number } {
  const EPL = [33,34,35,36,39,40,41,42,45,46,47,48,49,50,51,52,55,57,65,66]
  const LALIGA = [529,530,531,532,533,536,541,548]
  const BUND = [157,165,168,173]
  const SERIE = [489,492,496,497,505]
  const LIGUE = [80,81,85,91]
  if (EPL.includes(id1) || EPL.includes(id2)) return { league: 'Premier League', leagueId: 39 }
  if (LALIGA.includes(id1) || LALIGA.includes(id2)) return { league: 'La Liga', leagueId: 140 }
  if (BUND.includes(id1) || BUND.includes(id2)) return { league: 'Bundesliga', leagueId: 78 }
  if (SERIE.includes(id1) || SERIE.includes(id2)) return { league: 'Serie A', leagueId: 135 }
  if (LIGUE.includes(id1) || LIGUE.includes(id2)) return { league: 'Ligue 1', leagueId: 61 }
  return { league: 'Football', leagueId: 39 }
}

// ── 통계 계산 헬퍼 ──
function calcForm(fixtures: any[], teamId: number) {
  return fixtures.slice(0, 5).map((f: any) => {
    const isHome = f.teams.home.id === teamId
    const hg = f.goals.home ?? 0
    const ag = f.goals.away ?? 0
    if (isHome) return hg > ag ? 'W' : hg === ag ? 'D' : 'L'
    return ag > hg ? 'W' : ag === hg ? 'D' : 'L'
  })
}

function avgGoals(fixtures: any[], teamId: number, side: 'scored' | 'conceded') {
  const vals = fixtures.slice(0, 5).map((f: any) => {
    const isHome = f.teams.home.id === teamId
    if (side === 'scored') return isHome ? (f.goals.home ?? 0) : (f.goals.away ?? 0)
    return isHome ? (f.goals.away ?? 0) : (f.goals.home ?? 0)
  })
  return vals.reduce((a: number, b: number) => a + b, 0) / (vals.length || 1)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventName = searchParams.get('event')
  if (!eventName) return NextResponse.json({ error: 'event param required' }, { status: 400 })

  const season = '2024'

  try {
    // ── 1. 팀 파싱 ──
    const teams = parseTeams(eventName)
    if (!teams) return NextResponse.json({ error: 'Cannot parse team names' }, { status: 400 })
    const [homeName, awayName] = teams

    const homeId = findTeamId(homeName)
    const awayId = findTeamId(awayName)
    if (!homeId || !awayId) {
      return NextResponse.json({ error: `Team not found: ${!homeId ? homeName : awayName}` }, { status: 404 })
    }

    const { league, leagueId } = getLeagueFromTeams(homeId, awayId)

    // ── 2. 병렬 데이터 수집 ──
    const [
      homeFixtures, awayFixtures,
      h2hData,
      homePlayersRaw, awayPlayersRaw,
      homeInjuriesRaw, awayInjuriesRaw,
      standingsRaw,
      homeTeamRaw, awayTeamRaw,
    ] = await Promise.all([
      fb('/fixtures', { team: String(homeId), season, league: String(leagueId), last: '10' }),
      fb('/fixtures', { team: String(awayId), season, league: String(leagueId), last: '10' }),
      fb('/fixtures/headtohead', { h2h: `${homeId}-${awayId}`, last: '10' }),
      fb('/players', { team: String(homeId), season }),
      fb('/players', { team: String(awayId), season }),
      fb('/injuries', { team: String(homeId), season, league: String(leagueId) }),
      fb('/injuries', { team: String(awayId), season, league: String(leagueId) }),
      fb('/standings', { league: String(leagueId), season }),
      fb('/teams', { id: String(homeId) }),
      fb('/teams', { id: String(awayId) }),
    ]) as any[]

    // ── 3. 폼 & 스탯 계산 ──
    const homeForm = calcForm(homeFixtures, homeId)
    const awayForm = calcForm(awayFixtures, awayId)
    const homeAvgScored = avgGoals(homeFixtures, homeId, 'scored')
    const homeAvgConceded = avgGoals(homeFixtures, homeId, 'conceded')
    const awayAvgScored = avgGoals(awayFixtures, awayId, 'scored')
    const awayAvgConceded = avgGoals(awayFixtures, awayId, 'conceded')

    // h2h 통계
    const h2hLast5 = (h2hData || []).slice(0, 5)
    const h2hHomeWins = h2hLast5.filter((f: any) =>
      f.teams.home.id === homeId ? f.goals.home > f.goals.away : f.goals.away > f.goals.home
    ).length
    const h2hAwayWins = h2hLast5.filter((f: any) =>
      f.teams.away.id === awayId ? f.goals.away > f.goals.home : f.goals.home > f.goals.away
    ).length
    const h2hDraws = h2hLast5.length - h2hHomeWins - h2hAwayWins
    const h2hAvgGoals = h2hLast5.reduce((s: number, f: any) =>
      s + (f.goals.home ?? 0) + (f.goals.away ?? 0), 0
    ) / (h2hLast5.length || 1)

    // 순위
    const standings = standingsRaw?.[0]?.league?.standings?.[0] || []
    const homeStanding = standings.find((s: any) => s.team.id === homeId)
    const awayStanding = standings.find((s: any) => s.team.id === awayId)

    // 선수 TOP (득점 기준)
    const topPlayers = (raw: any[]) =>
      (raw || [])
        .filter((p: any) => p.statistics?.[0]?.goals?.total > 0)
        .sort((a: any, b: any) =>
          (b.statistics[0].goals.total ?? 0) - (a.statistics[0].goals.total ?? 0)
        )
        .slice(0, 5)
        .map((p: any) => ({
          name: p.player.name,
          photo: p.player.photo,
          nationality: p.player.nationality,
          age: p.player.age,
          position: p.statistics[0].games.position,
          goals: p.statistics[0].goals.total ?? 0,
          assists: p.statistics[0].goals.assists ?? 0,
          rating: p.statistics[0].games.rating
            ? parseFloat(p.statistics[0].games.rating).toFixed(1)
            : null,
          appearances: p.statistics[0].games.appearences ?? 0,
          shotAccuracy: p.statistics[0].shots?.on ?? 0,
          keyPasses: p.statistics[0].passes?.key ?? 0,
          dribbles: p.statistics[0].dribbles?.success ?? 0,
        }))

    const homeTopScorers = topPlayers(homePlayersRaw as any[])
    const awayTopScorers = topPlayers(awayPlayersRaw as any[])

    // 부상 선수
    const injuries = (raw: any[]) =>
      (raw || []).slice(0, 5).map((i: any) => ({
        name: i.player.name,
        photo: i.player.photo,
        type: i.player.type,
        reason: i.player.reason,
      }))

    const homeInjuries = injuries(homeInjuriesRaw as any[])
    const awayInjuries = injuries(awayInjuriesRaw as any[])

    // 팀 로고
    const homeLogo = (homeTeamRaw as any[])?.[0]?.team?.logo
    const awayLogo = (awayTeamRaw as any[])?.[0]?.team?.logo
    const homeVenue = (homeTeamRaw as any[])?.[0]?.venue

    // ── 4. Claude AI 분석 생성 ──
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

    const prompt = `You are an expert football analyst. Analyze this upcoming match and provide a professional preview in Korean.

MATCH: ${homeName} vs ${awayName} (${league})

HOME TEAM - ${homeName}:
- League position: ${homeStanding ? `${homeStanding.rank}위 (${homeStanding.points}pts)` : 'N/A'}
- Recent form (last 5): ${homeForm.join('-') || 'N/A'}
- Avg goals scored: ${homeAvgScored.toFixed(1)} | Avg conceded: ${homeAvgConceded.toFixed(1)}
- Top scorers: ${homeTopScorers.slice(0, 3).map((p: any) => `${p.name}(${p.goals}골)`).join(', ')}
- Injured: ${homeInjuries.map((i: any) => i.name).join(', ') || '없음'}

AWAY TEAM - ${awayName}:
- League position: ${awayStanding ? `${awayStanding.rank}위 (${awayStanding.points}pts)` : 'N/A'}
- Recent form (last 5): ${awayForm.join('-') || 'N/A'}
- Avg goals scored: ${awayAvgScored.toFixed(1)} | Avg conceded: ${awayAvgConceded.toFixed(1)}
- Top scorers: ${awayTopScorers.slice(0, 3).map((p: any) => `${p.name}(${p.goals}골)`).join(', ')}
- Injured: ${awayInjuries.map((i: any) => i.name).join(', ') || '없음'}

H2H (last ${h2hLast5.length} matches):
- ${homeName} wins: ${h2hHomeWins} | Draws: ${h2hDraws} | ${awayName} wins: ${h2hAwayWins}
- Avg goals per game: ${h2hAvgGoals.toFixed(1)}

Return a JSON object with this EXACT structure (Korean text, no markdown):
{
  "matchOverview": "2-3 sentences professional match preview in Korean",
  "tacticalAnalysis": {
    "home": "2 sentences about home team's likely tactical setup and strengths in Korean",
    "away": "2 sentences about away team's likely tactical setup and strengths in Korean"
  },
  "keyBattles": [
    {"area": "전방 압박", "description": "한 문장 설명"},
    {"area": "측면 공격", "description": "한 문장 설명"},
    {"area": "세트피스", "description": "한 문장 설명"}
  ],
  "goalProbability": {
    "homeWin": <number 0-100>,
    "draw": <number 0-100>,
    "awayWin": <number 0-100>,
    "btts": <Both Teams to Score probability 0-100>,
    "over25": <Over 2.5 goals probability 0-100>,
    "predictedScore": "X-X"
  },
  "keyPlayerToWatch": {
    "home": {"name": "${homeTopScorers[0]?.name || homeName + ' star'}", "reason": "why to watch in Korean, 1 sentence"},
    "away": {"name": "${awayTopScorers[0]?.name || awayName + ' star'}", "reason": "why to watch in Korean, 1 sentence"}
  },
  "matchVerdict": "1 sentence bold prediction in Korean",
  "watchReason": "Why a fan should buy a ticket and watch this match live — 2 exciting sentences in Korean"
}`

    const aiRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    let analysis: any = {}
    try {
      const text = (aiRes.content[0] as any).text
      const jsonMatch = text.match(/\{[\s\S]+\}/)
      if (jsonMatch) analysis = JSON.parse(jsonMatch[0])
    } catch {
      analysis = { matchOverview: '분석을 불러오는 중입니다.' }
    }

    // ── 5. 최종 응답 ──
    return NextResponse.json({
      match: {
        home: { id: homeId, name: homeName, logo: homeLogo },
        away: { id: awayId, name: awayName, logo: awayLogo },
        league,
        venue: homeVenue,
      },
      standings: {
        home: homeStanding
          ? { rank: homeStanding.rank, points: homeStanding.points, form: homeStanding.form }
          : null,
        away: awayStanding
          ? { rank: awayStanding.rank, points: awayStanding.points, form: awayStanding.form }
          : null,
      },
      form: { home: homeForm, away: awayForm },
      stats: {
        home: { avgScored: +homeAvgScored.toFixed(1), avgConceded: +homeAvgConceded.toFixed(1) },
        away: { avgScored: +awayAvgScored.toFixed(1), avgConceded: +awayAvgConceded.toFixed(1) },
      },
      h2h: {
        homeWins: h2hHomeWins,
        draws: h2hDraws,
        awayWins: h2hAwayWins,
        avgGoals: +h2hAvgGoals.toFixed(1),
        recent: h2hLast5.slice(0, 5).map((f: any) => ({
          date: f.fixture.date?.slice(0, 10),
          homeTeam: f.teams.home.name,
          awayTeam: f.teams.away.name,
          homeGoals: f.goals.home,
          awayGoals: f.goals.away,
        })),
      },
      players: {
        home: homeTopScorers,
        away: awayTopScorers,
      },
      injuries: {
        home: homeInjuries,
        away: awayInjuries,
      },
      analysis,
    })
  } catch (err) {
    console.error('[match-analysis]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
