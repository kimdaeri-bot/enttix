'use client'
import { useEffect, useState } from 'react'

interface AnalysisData {
  match: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
    league: string
    venue?: { name: string; city: string; capacity: number; image: string }
  }
  standings: {
    home: { rank: number; points: number; form: string } | null
    away: { rank: number; points: number; form: string } | null
  }
  form: { home: string[]; away: string[] }
  stats: {
    home: { avgScored: number; avgConceded: number }
    away: { avgScored: number; avgConceded: number }
  }
  h2h: {
    homeWins: number; draws: number; awayWins: number; avgGoals: number
    recent: { date: string; homeTeam: string; awayTeam: string; homeGoals: number; awayGoals: number }[]
  }
  players: {
    home: PlayerData[]
    away: PlayerData[]
  }
  injuries: {
    home: InjuryData[]
    away: InjuryData[]
  }
  analysis: {
    matchOverview?: string
    tacticalAnalysis?: { home: string; away: string }
    keyBattles?: { area: string; description: string }[]
    goalProbability?: {
      homeWin: number; draw: number; awayWin: number
      btts: number; over25: number; predictedScore: string
    }
    keyPlayerToWatch?: {
      home: { name: string; reason: string }
      away: { name: string; reason: string }
    }
    matchVerdict?: string
    watchReason?: string
  }
}

interface PlayerData {
  name: string; photo: string; nationality: string; age: number
  position: string; goals: number; assists: number; rating: string | null
  appearances: number; shotAccuracy: number; keyPasses: number; dribbles: number
}

interface InjuryData {
  name: string; photo: string; type: string; reason: string
}

function FormBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    W: 'bg-green-500 text-white',
    D: 'bg-yellow-400 text-gray-800',
    L: 'bg-red-500 text-white',
  }
  return (
    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${colors[result] || 'bg-gray-300'}`}>
      {result}
    </span>
  )
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-gray-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[13px] font-bold text-gray-700 w-10 text-right">{value}%</span>
    </div>
  )
}

function PlayerCard({ player, accent }: { player: PlayerData; accent: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <img
        src={player.photo}
        alt={player.name}
        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
        onError={e => { (e.target as HTMLImageElement).src = '/placeholder-player.png' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-[13px] text-gray-800 truncate">{player.name}</span>
          {player.rating && (
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${accent} text-white`}>
              {player.rating}
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-400 mb-2">
          {player.position} · {player.nationality} · {player.age}세
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <div className="text-[14px] font-bold text-gray-800">{player.goals}</div>
            <div className="text-[10px] text-gray-400">골</div>
          </div>
          <div className="text-center">
            <div className="text-[14px] font-bold text-gray-800">{player.assists}</div>
            <div className="text-[10px] text-gray-400">어시스트</div>
          </div>
          <div className="text-center">
            <div className="text-[14px] font-bold text-gray-800">{player.appearances}</div>
            <div className="text-[10px] text-gray-400">출전</div>
          </div>
          <div className="text-center">
            <div className="text-[14px] font-bold text-gray-800">{player.keyPasses}</div>
            <div className="text-[10px] text-gray-400">키패스</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MatchAnalysis({ eventName }: { eventName: string }) {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'preview' | 'players' | 'h2h' | 'predict'>('preview')

  useEffect(() => {
    if (!eventName) return
    setLoading(true)
    fetch(`/api/football/match-analysis?event=${encodeURIComponent(eventName)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [eventName])

  if (loading) return (
    <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-6 bg-blue-600 rounded-full" />
        <span className="font-bold text-lg text-gray-800">Match Analysis</span>
        <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">AI Powered</span>
      </div>
      <div className="flex flex-col gap-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded-full" style={{ width: `${85 - i * 10}%` }} />
        ))}
      </div>
      <p className="text-[12px] text-gray-400 mt-4">AI가 경기 데이터를 분석 중입니다...</p>
    </div>
  )

  if (error || !data) return null

  const { match, standings, form, stats, h2h, players, injuries, analysis } = data
  const gp = analysis.goalProbability

  const tabs = [
    { key: 'preview', label: '경기 프리뷰' },
    { key: 'players', label: '선수 분석' },
    { key: 'h2h', label: '맞대결 전적' },
    { key: 'predict', label: '예측' },
  ] as const

  return (
    <div className="mt-8 rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E3A5F] px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-6 bg-blue-400 rounded-full" />
          <span className="font-bold text-white text-lg">Match Analysis</span>
          <span className="text-[11px] bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full font-semibold border border-blue-400/30">
            AI Powered
          </span>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <img src={match.home.logo} alt={match.home.name} className="w-14 h-14 object-contain" />
            <span className="text-white font-bold text-[14px] text-center">{match.home.name}</span>
            {standings.home && (
              <span className="text-blue-200 text-[12px]">{standings.home.rank}위 · {standings.home.points}pts</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-1">
            {gp && (
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl px-4 py-2 text-center">
                <div className="text-white font-black text-2xl tracking-widest">{gp.predictedScore}</div>
                <div className="text-blue-200 text-[10px] mt-0.5">예상 스코어</div>
              </div>
            )}
            <span className="text-blue-300 text-[11px] font-medium">{match.league}</span>
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <img src={match.away.logo} alt={match.away.name} className="w-14 h-14 object-contain" />
            <span className="text-white font-bold text-[14px] text-center">{match.away.name}</span>
            {standings.away && (
              <span className="text-blue-200 text-[12px]">{standings.away.rank}위 · {standings.away.points}pts</span>
            )}
          </div>
        </div>

        {/* Form strips */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1">{form.home.map((r, i) => <FormBadge key={i} result={r} />)}</div>
          <span className="text-blue-300 text-[11px]">최근 폼</span>
          <div className="flex gap-1">{form.away.map((r, i) => <FormBadge key={i} result={r} />)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-3 text-[12px] font-semibold transition-colors ${
              activeTab === t.key
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* TAB: 경기 프리뷰 */}
        {activeTab === 'preview' && (
          <div className="flex flex-col gap-5">
            {analysis.matchOverview && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-2">📋 경기 개요</div>
                <p className="text-[13.5px] text-gray-700 leading-relaxed">{analysis.matchOverview}</p>
              </div>
            )}

            {/* Stats comparison */}
            <div>
              <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">📊 시즌 통계 비교</div>
              <div className="flex flex-col gap-3">
                {/* Avg scored */}
                <div>
                  <div className="flex justify-between text-[12px] text-gray-500 mb-1">
                    <span className="font-semibold text-gray-700">{stats.home.avgScored}</span>
                    <span>경기당 평균 득점</span>
                    <span className="font-semibold text-gray-700">{stats.away.avgScored}</span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="flex-1 bg-blue-500 rounded-l-full" style={{ flexGrow: stats.home.avgScored }} />
                    <div className="flex-1 bg-red-400 rounded-r-full" style={{ flexGrow: stats.away.avgScored }} />
                  </div>
                </div>
                {/* Avg conceded */}
                <div>
                  <div className="flex justify-between text-[12px] text-gray-500 mb-1">
                    <span className="font-semibold text-gray-700">{stats.home.avgConceded}</span>
                    <span>경기당 평균 실점</span>
                    <span className="font-semibold text-gray-700">{stats.away.avgConceded}</span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="flex-1 bg-blue-300 rounded-l-full" style={{ flexGrow: stats.home.avgConceded }} />
                    <div className="flex-1 bg-red-200 rounded-r-full" style={{ flexGrow: stats.away.avgConceded }} />
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="flex items-center gap-1 text-[11px] text-blue-500 font-medium">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> {match.home.name}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
                  {match.away.name} <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                </span>
              </div>
            </div>

            {/* Tactical Analysis */}
            {analysis.tacticalAnalysis && (
              <div>
                <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">⚽ 전술 분석</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={match.home.logo} className="w-5 h-5 object-contain" alt="" />
                      <span className="text-[12px] font-bold text-blue-700">{match.home.name}</span>
                    </div>
                    <p className="text-[12.5px] text-gray-600 leading-relaxed">{analysis.tacticalAnalysis.home}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={match.away.logo} className="w-5 h-5 object-contain" alt="" />
                      <span className="text-[12px] font-bold text-red-600">{match.away.name}</span>
                    </div>
                    <p className="text-[12.5px] text-gray-600 leading-relaxed">{analysis.tacticalAnalysis.away}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Battles */}
            {analysis.keyBattles && (
              <div>
                <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">🔑 핵심 승부처</div>
                <div className="flex flex-col gap-2">
                  {analysis.keyBattles.map((b, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-gray-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-[13px] text-gray-800">{b.area}</span>
                        <p className="text-[12px] text-gray-500 mt-0.5">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Injuries */}
            {(injuries.home.length > 0 || injuries.away.length > 0) && (
              <div>
                <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">🚑 부상 현황</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-blue-600 mb-2">{match.home.name}</div>
                    {injuries.home.length === 0
                      ? <p className="text-[12px] text-green-600">부상자 없음 ✓</p>
                      : injuries.home.map((inj, i) => (
                        <div key={i} className="text-[12px] text-gray-600 flex items-center gap-1.5 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                          {inj.name}
                        </div>
                      ))
                    }
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-red-500 mb-2">{match.away.name}</div>
                    {injuries.away.length === 0
                      ? <p className="text-[12px] text-green-600">부상자 없음 ✓</p>
                      : injuries.away.map((inj, i) => (
                        <div key={i} className="text-[12px] text-gray-600 flex items-center gap-1.5 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                          {inj.name}
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: 선수 분석 */}
        {activeTab === 'players' && (
          <div className="flex flex-col gap-6">
            {/* Key Players to Watch */}
            {analysis.keyPlayerToWatch && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-2">⭐ 주목 선수</div>
                  <div className="font-bold text-[15px] text-blue-800 mb-1">{analysis.keyPlayerToWatch.home.name}</div>
                  <p className="text-[12.5px] text-blue-700">{analysis.keyPlayerToWatch.home.reason}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                  <div className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-2">⭐ 주목 선수</div>
                  <div className="font-bold text-[15px] text-red-700 mb-1">{analysis.keyPlayerToWatch.away.name}</div>
                  <p className="text-[12.5px] text-red-600">{analysis.keyPlayerToWatch.away.reason}</p>
                </div>
              </div>
            )}

            {/* Home Top Scorers */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={match.home.logo} className="w-5 h-5 object-contain" alt="" />
                <span className="font-bold text-[13px] text-gray-700">{match.home.name} — 시즌 주요 선수</span>
              </div>
              <div className="flex flex-col gap-2">
                {players.home.slice(0, 5).map((p, i) => (
                  <PlayerCard key={i} player={p} accent="bg-blue-500" />
                ))}
              </div>
            </div>

            {/* Away Top Scorers */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={match.away.logo} className="w-5 h-5 object-contain" alt="" />
                <span className="font-bold text-[13px] text-gray-700">{match.away.name} — 시즌 주요 선수</span>
              </div>
              <div className="flex flex-col gap-2">
                {players.away.slice(0, 5).map((p, i) => (
                  <PlayerCard key={i} player={p} accent="bg-red-500" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: H2H */}
        {activeTab === 'h2h' && (
          <div className="flex flex-col gap-5">
            {/* H2H Summary */}
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
              <div className="text-center flex-1">
                <div className="text-2xl font-black text-blue-600">{h2h.homeWins}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{match.home.name} 승</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-2xl font-black text-gray-500">{h2h.draws}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">무승부</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-2xl font-black text-red-500">{h2h.awayWins}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{match.away.name} 승</div>
              </div>
            </div>

            {/* H2H bar */}
            <div>
              <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                {h2h.homeWins > 0 && <div className="bg-blue-500" style={{ flexGrow: h2h.homeWins }} />}
                {h2h.draws > 0 && <div className="bg-gray-300" style={{ flexGrow: h2h.draws }} />}
                {h2h.awayWins > 0 && <div className="bg-red-400" style={{ flexGrow: h2h.awayWins }} />}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>홈팀 우세</span>
                <span>경기당 평균 {h2h.avgGoals}골</span>
                <span>원정팀 우세</span>
              </div>
            </div>

            {/* Recent H2H matches */}
            <div>
              <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">최근 맞대결</div>
              <div className="flex flex-col gap-2">
                {h2h.recent.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-[13px]">
                    <span className="text-gray-400 text-[11px] w-20 shrink-0">{m.date}</span>
                    <span className="flex-1 text-right font-medium text-gray-700 truncate">{m.homeTeam}</span>
                    <span className="font-black text-gray-800 px-2 shrink-0">
                      {m.homeGoals} - {m.awayGoals}
                    </span>
                    <span className="flex-1 font-medium text-gray-700 truncate">{m.awayTeam}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: 예측 */}
        {activeTab === 'predict' && (
          <div className="flex flex-col gap-5">
            {gp && (
              <>
                {/* Win probability */}
                <div>
                  <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-4">승부 예측</div>
                  <div className="flex gap-2 mb-4">
                    {[
                      { label: match.home.name, val: gp.homeWin, color: 'bg-blue-500' },
                      { label: '무승부', val: gp.draw, color: 'bg-gray-400' },
                      { label: match.away.name, val: gp.awayWin, color: 'bg-red-400' },
                    ].map((item, i) => (
                      <div key={i} className="flex-1 text-center">
                        <div className={`h-24 ${item.color} rounded-xl flex items-end justify-center pb-2`}
                          style={{ opacity: 0.5 + item.val / 200 }}>
                          <span className="text-white font-black text-xl">{item.val}%</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 truncate">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">베팅 마켓 예측</div>
                  <ProbBar label="양팀득점 (BTTS)" value={gp.btts} color="bg-purple-500" />
                  <ProbBar label="2.5골 오버" value={gp.over25} color="bg-orange-400" />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#0F172A] to-[#1E3A5F] rounded-xl">
                  <div className="text-4xl font-black text-white">{gp.predictedScore}</div>
                  <div>
                    <div className="text-blue-200 text-[11px] font-semibold uppercase tracking-wider">예상 스코어</div>
                    {analysis.matchVerdict && (
                      <p className="text-white text-[13px] mt-1">{analysis.matchVerdict}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {analysis.watchReason && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-2">🎟️ 직관해야 하는 이유</div>
                <p className="text-[13.5px] text-gray-700 leading-relaxed">{analysis.watchReason}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">Data: API-Football · AI: Claude</span>
        <span className="text-[11px] text-gray-400">분석은 참고용이며 결과를 보장하지 않습니다</span>
      </div>
    </div>
  )
}
