'use client'
import { useEffect, useState } from 'react'

interface F1Data {
  season: string
  gp: {
    name: string
    circuit: { name: string; location: { city: string; country: string }; image: string } | null
    date: string | null
    laps: number | null
    distance: string | null
  }
  drivers: DriverStanding[]
  teams: TeamStanding[]
  raceResults: RaceResult[]
  analysis: {
    raceOverview?: string
    circuitAnalysis?: string
    titleFight?: string
    teamBattles?: { teams: string; description: string }[]
    driverSpotlight?: { name: string; reason: string }[]
    racePrediction?: {
      winner: string
      podium: string[]
      darkHorse: string
      darkHorseReason: string
    }
    strategyInsight?: string
    watchReason?: string
  }
}

interface DriverStanding {
  position: number; name: string; abbr: string; number: number
  image: string; team: string; teamLogo: string; points: number; wins: number; behind: number | null
}
interface TeamStanding {
  position: number; name: string; logo: string; points: number
}
interface RaceResult {
  position: number; driver: string; team: string; time: string; points: number
}

const TEAM_COLORS: Record<string, string> = {
  'Red Bull': '#3671C6', 'Red Bull Racing': '#3671C6',
  'McLaren': '#FF8000', 'McLaren Racing': '#FF8000',
  'Ferrari': '#E8002D', 'Scuderia Ferrari': '#E8002D',
  'Mercedes': '#27F4D2', 'Mercedes-AMG Petronas': '#27F4D2',
  'Aston Martin': '#229971', 'Aston Martin F1 Team': '#229971',
  'Alpine': '#0093CC', 'Alpine F1 Team': '#0093CC',
  'Williams': '#64C4FF', 'Williams Racing': '#64C4FF',
  'AlphaTauri': '#5E8FAA', 'RB': '#6692FF',
  'Haas': '#B6BABD', 'Haas F1 Team': '#B6BABD',
  'Kick Sauber': '#52E252', 'Alfa Romeo': '#C92D4B',
}

function getTeamColor(team: string) {
  for (const [k, v] of Object.entries(TEAM_COLORS)) {
    if (team.includes(k) || k.includes(team)) return v
  }
  return '#6B7280'
}

export default function F1Analysis({ gpName }: { gpName: string }) {
  const [data, setData] = useState<F1Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'preview' | 'standings' | 'predict'>('preview')

  useEffect(() => {
    if (!gpName) return
    setLoading(true)
    fetch(`/api/f1?type=gp-analysis&gp=${encodeURIComponent(gpName)}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [gpName])

  if (loading) return (
    <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-6 bg-red-500 rounded-full" />
        <span className="font-bold text-lg text-gray-800">F1 Race Analysis</span>
        <span className="text-[11px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">AI Powered</span>
      </div>
      <div className="flex flex-col gap-3 animate-pulse">
        {[90, 80, 70, 60].map((w, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded-full" style={{ width: `${w}%` }} />
        ))}
      </div>
      <p className="text-[12px] text-gray-400 mt-4">🏎️ AI가 레이스 데이터를 분석 중입니다...</p>
    </div>
  )

  if (!data) return null

  const { gp, drivers, teams, raceResults, analysis } = data
  const pred = analysis.racePrediction

  const tabs = [
    { key: 'preview', label: '레이스 프리뷰' },
    { key: 'standings', label: '드라이버 / 컨스트럭터' },
    { key: 'predict', label: '레이스 예측' },
  ] as const

  return (
    <div className="mt-8 rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#1a0a0a] to-[#2d1010] px-6 py-5 overflow-hidden">
        {/* F1 racing stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-white to-red-600" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-6 bg-red-500 rounded-full" />
          <span className="font-bold text-white text-lg">F1 Race Analysis</span>
          <span className="text-[11px] bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full font-semibold border border-red-500/30">
            AI Powered
          </span>
        </div>

        {/* GP Info */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-white font-black text-xl leading-tight">{gp.name}</h2>
            {gp.circuit && (
              <p className="text-red-200 text-[13px] mt-1">
                🏟️ {gp.circuit.name} · {gp.circuit.location?.city}, {gp.circuit.location?.country}
              </p>
            )}
            <div className="flex gap-4 mt-2">
              {gp.laps && (
                <span className="text-red-300 text-[12px]">🔄 {gp.laps} laps</span>
              )}
              {gp.distance && (
                <span className="text-red-300 text-[12px]">📏 {gp.distance}</span>
              )}
            </div>
          </div>

          {/* Predicted winner */}
          {pred && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 text-center shrink-0">
              <div className="text-red-200 text-[10px] font-bold uppercase tracking-wider mb-1">예상 우승</div>
              <div className="text-white font-black text-[15px]">{pred.winner}</div>
              <div className="text-red-300 text-[11px] mt-0.5">🏎️ AI Prediction</div>
            </div>
          )}
        </div>

        {/* 2024 Championship leaders strip */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {drivers.slice(0, 5).map(d => (
            <div key={d.name} className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 shrink-0">
              <span className="text-white/60 text-[10px] font-bold">P{d.position}</span>
              <span className="text-white text-[11px] font-bold">{d.abbr}</span>
              <span className="text-red-200 text-[10px]">{d.points}pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-[12px] font-semibold transition-colors ${
              tab === t.key ? 'text-red-600 border-b-2 border-red-500 bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* TAB: 레이스 프리뷰 */}
        {tab === 'preview' && (
          <div className="flex flex-col gap-5">
            {analysis.raceOverview && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <div className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-2">🏎️ 레이스 개요</div>
                <p className="text-[13.5px] text-gray-700 leading-relaxed">{analysis.raceOverview}</p>
              </div>
            )}

            {analysis.circuitAnalysis && (
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">🏟️ 서킷 특성</div>
                <p className="text-[13px] text-gray-600 leading-relaxed">{analysis.circuitAnalysis}</p>
              </div>
            )}

            {analysis.titleFight && (
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                <div className="text-[11px] font-bold text-yellow-600 uppercase tracking-wider mb-2">🏆 챔피언십 배틀</div>
                <p className="text-[13px] text-gray-700 leading-relaxed">{analysis.titleFight}</p>
              </div>
            )}

            {analysis.teamBattles && (
              <div>
                <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">⚔️ 팀 대결</div>
                <div className="flex flex-col gap-2">
                  {analysis.teamBattles.map((b, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="font-bold text-[13px] text-gray-800 mb-1">{b.teams}</div>
                      <p className="text-[12px] text-gray-500">{b.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.strategyInsight && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-2">🔧 전략 분석</div>
                <p className="text-[13px] text-gray-600 leading-relaxed">{analysis.strategyInsight}</p>
              </div>
            )}

            {analysis.driverSpotlight && (
              <div>
                <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">⭐ 주목 드라이버</div>
                <div className="flex flex-col gap-3">
                  {analysis.driverSpotlight.map((d, i) => {
                    const driverData = drivers.find(dr => dr.name.includes(d.name.split(' ')[1] || d.name))
                    const color = driverData ? getTeamColor(driverData.team) : '#6B7280'
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                        {driverData?.image && (
                          <img src={driverData.image} alt={d.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-[13px] text-gray-800">{d.name}</span>
                            {driverData && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-bold"
                                style={{ background: color }}>
                                {driverData.team.split(' ')[0]}
                              </span>
                            )}
                            {driverData && (
                              <span className="text-[11px] text-gray-400">P{driverData.position} · {driverData.points}pts</span>
                            )}
                          </div>
                          <p className="text-[12.5px] text-gray-500 leading-relaxed">{d.reason}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: 드라이버 / 컨스트럭터 */}
        {tab === 'standings' && (
          <div className="flex flex-col gap-6">
            {/* Driver standings */}
            <div>
              <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                🏆 2024 드라이버 챔피언십
              </div>
              <div className="flex flex-col gap-2">
                {drivers.map(d => {
                  const color = getTeamColor(d.team)
                  const maxPts = drivers[0].points
                  return (
                    <div key={d.name} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <span className={`text-[14px] font-black w-6 text-center ${d.position <= 3 ? 'text-yellow-500' : 'text-gray-400'}`}>
                        {d.position}
                      </span>
                      <img src={d.image} alt={d.name} className="w-9 h-9 rounded-full object-cover border border-white shadow-sm"
                        onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[13px] text-gray-800 truncate">{d.name}</span>
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                            style={{ background: color, fontSize: '10px' }}>
                            {d.abbr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(d.points/maxPts)*100}%`, background: color }} />
                          </div>
                          <span className="text-[12px] font-bold text-gray-700 w-16 text-right shrink-0">{d.points} pts</span>
                        </div>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="text-[14px] font-black" style={{ color }}>{d.wins}</div>
                        <div className="text-[10px] text-gray-400">wins</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Constructor standings */}
            <div>
              <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                🔧 2024 컨스트럭터 챔피언십
              </div>
              <div className="flex flex-col gap-2">
                {teams.map(t => {
                  const color = getTeamColor(t.name)
                  const maxPts = teams[0].points
                  return (
                    <div key={t.name} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <span className={`text-[14px] font-black w-6 text-center ${t.position <= 3 ? 'text-yellow-500' : 'text-gray-400'}`}>
                        {t.position}
                      </span>
                      <img src={t.logo} alt={t.name} className="w-8 h-8 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px] text-gray-800 truncate">{t.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${(t.points/maxPts)*100}%`, background: color }} />
                          </div>
                          <span className="text-[12px] font-bold text-gray-700 w-16 text-right shrink-0">{t.points} pts</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2024 Race results at this circuit (if available) */}
            {raceResults.length > 0 && (
              <div>
                <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                  🏁 2024년 이 서킷 레이스 결과
                </div>
                <div className="flex flex-col gap-1.5">
                  {raceResults.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                      <span className={`font-black text-[14px] w-5 ${i < 3 ? 'text-yellow-500' : 'text-gray-400'}`}>
                        {r.position}
                      </span>
                      <div className="flex-1">
                        <span className="font-semibold text-[13px] text-gray-800">{r.driver}</span>
                        <span className="text-[11px] text-gray-400 ml-2">{r.team}</span>
                      </div>
                      {r.time && <span className="text-[11px] text-gray-400 font-mono">{r.time}</span>}
                      {r.points > 0 && <span className="text-[11px] font-bold text-gray-500">+{r.points}pts</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: 레이스 예측 */}
        {tab === 'predict' && pred && (
          <div className="flex flex-col gap-5">
            {/* Podium */}
            <div>
              <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-4">🏆 예상 포디엄</div>
              <div className="flex items-end justify-center gap-3">
                {/* 2nd */}
                <div className="flex flex-col items-center">
                  <div className="text-[12px] font-bold text-gray-600 mb-2 text-center">{pred.podium[1]}</div>
                  <div className="w-20 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg flex items-center justify-center text-white font-black text-2xl"
                    style={{ height: '80px' }}>2</div>
                </div>
                {/* 1st */}
                <div className="flex flex-col items-center">
                  <div className="text-[13px] font-black text-gray-800 mb-2 text-center">{pred.podium[0]}</div>
                  <div className="w-20 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-lg flex items-center justify-center text-white font-black text-2xl"
                    style={{ height: '110px' }}>1</div>
                </div>
                {/* 3rd */}
                <div className="flex flex-col items-center">
                  <div className="text-[12px] font-bold text-gray-600 mb-2 text-center">{pred.podium[2]}</div>
                  <div className="w-20 bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-lg flex items-center justify-center text-white font-black text-2xl"
                    style={{ height: '60px' }}>3</div>
                </div>
              </div>
            </div>

            {/* Dark horse */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="text-[11px] font-bold text-purple-500 uppercase tracking-wider mb-2">🎲 다크호스</div>
              <div className="font-black text-[16px] text-purple-800 mb-1">{pred.darkHorse}</div>
              <p className="text-[13px] text-gray-600">{pred.darkHorseReason}</p>
            </div>

            {/* Watch reason */}
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
        <span className="text-[11px] text-gray-400">Data: API-Sports F1 · AI: Claude Haiku</span>
        <span className="text-[11px] text-gray-400">분석은 참고용입니다</span>
      </div>
    </div>
  )
}
