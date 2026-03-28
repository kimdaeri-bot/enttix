'use client'
import { useEffect, useState } from 'react'

interface SidePanelProps {
  eventName: string
  homeTeam?: string
  awayTeam?: string
  leagueName?: string
}

interface QuickData {
  type: 'football' | 'f1' | 'other'
  form?: { home: string[]; away: string[] }
  homeStanding?: { rank: number; points: number } | null
  awayStanding?: { rank: number; points: number } | null
  homeLogo?: string
  awayLogo?: string
  homeName?: string
  awayName?: string
  homeTopScorer?: { name: string; goals: number; photo: string } | null
  awayTopScorer?: { name: string; goals: number; photo: string } | null
  prediction?: { homeWin: number; draw: number; awayWin: number; predictedScore: string; btts: number }
  // F1
  drivers?: any[]
  teams?: any[]
  gpCircuit?: string
  gpPrediction?: { winner: string; podium: string[] }
}

function FormDot({ r }: { r: string }) {
  const c = r === 'W' ? 'bg-green-500' : r === 'D' ? 'bg-yellow-400' : 'bg-red-400'
  return <span className={`w-2.5 h-2.5 rounded-full ${c} inline-block`} title={r} />
}

const TEAM_COLORS: Record<string, string> = {
  'Red Bull': '#3671C6', 'McLaren': '#FF8000', 'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2', 'Aston Martin': '#229971', 'Alpine': '#0093CC',
  'Williams': '#64C4FF', 'Haas': '#B6BABD',
}
function getTeamColor(name: string) {
  for (const [k, v] of Object.entries(TEAM_COLORS)) {
    if (name?.includes(k)) return v
  }
  return '#6B7280'
}

export default function EventSidePanel({ eventName, homeTeam, awayTeam, leagueName }: SidePanelProps) {
  const [data, setData] = useState<QuickData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'match' | 'players' | 'predict'>('match')

  const isF1 = eventName?.toLowerCase().includes('grand prix') || eventName?.toLowerCase().includes('formula')
  const isFootball = !isF1 && homeTeam && awayTeam

  useEffect(() => {
    if (isF1) {
      fetch(`/api/f1?type=gp-analysis&gp=${encodeURIComponent(eventName)}`)
        .then(r => r.json())
        .then(d => {
          if (!d.error) {
            setData({
              type: 'f1',
              drivers: d.drivers?.slice(0, 8) || [],
              teams: d.teams || [],
              gpCircuit: d.gp?.circuit?.name,
              gpPrediction: d.analysis?.racePrediction
                ? { winner: d.analysis.racePrediction.winner, podium: d.analysis.racePrediction.podium }
                : undefined,
            })
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else if (isFootball) {
      const name = `${homeTeam} vs ${awayTeam}`
      fetch(`/api/football/match-analysis?event=${encodeURIComponent(name)}`)
        .then(r => r.json())
        .then(d => {
          if (!d.error) {
            setData({
              type: 'football',
              form: d.form,
              homeStanding: d.standings?.home,
              awayStanding: d.standings?.away,
              homeLogo: d.match?.home?.logo,
              awayLogo: d.match?.away?.logo,
              homeName: homeTeam,
              awayName: awayTeam,
              homeTopScorer: d.players?.home?.[0] || null,
              awayTopScorer: d.players?.away?.[0] || null,
              prediction: d.analysis?.goalProbability,
            })
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [eventName, homeTeam, awayTeam, isF1, isFootball])

  if (!isF1 && !isFootball) return null

  const tabs = isF1
    ? [{ key: 'match', label: '서킷 정보' }, { key: 'players', label: '드라이버' }, { key: 'predict', label: '예측' }]
    : [{ key: 'match', label: '경기 정보' }, { key: 'players', label: '선수' }, { key: 'predict', label: '예측' }]

  return (
    <div className="border-t border-[#E5E7EB] bg-white flex flex-col" style={{ maxHeight: '42%' }}>
      {/* Tab bar */}
      <div className="flex border-b border-[#F1F5F9] shrink-0">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 py-2 text-[11px] font-semibold transition-colors ${
              tab === t.key
                ? (isF1 ? 'text-red-600 border-b-2 border-red-500' : 'text-blue-600 border-b-2 border-blue-500')
                : 'text-gray-400 hover:text-gray-600'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2.5">
        {loading ? (
          <div className="flex flex-col gap-2 animate-pulse py-2">
            {[80, 60, 70].map((w, i) => (
              <div key={i} className="h-3 bg-gray-100 rounded-full" style={{ width: `${w}%` }} />
            ))}
            <p className="text-[10px] text-gray-300 mt-1">{isF1 ? '🏎️' : '⚽'} 분석 중...</p>
          </div>
        ) : !data ? null : (

          // ── FOOTBALL ──
          data.type === 'football' ? (
            <>
              {tab === 'match' && (
                <div className="flex flex-col gap-3">
                  {/* Teams + standings */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex flex-col items-center gap-1">
                      {data.homeLogo && <img src={data.homeLogo} className="w-8 h-8 object-contain" alt="" />}
                      <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{data.homeName}</span>
                      {data.homeStanding && (
                        <span className="text-[10px] text-gray-400">{data.homeStanding.rank}위 · {data.homeStanding.points}pts</span>
                      )}
                    </div>
                    <div className="text-[11px] font-black text-gray-300 shrink-0">VS</div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      {data.awayLogo && <img src={data.awayLogo} className="w-8 h-8 object-contain" alt="" />}
                      <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{data.awayName}</span>
                      {data.awayStanding && (
                        <span className="text-[10px] text-gray-400">{data.awayStanding.rank}위 · {data.awayStanding.points}pts</span>
                      )}
                    </div>
                  </div>
                  {/* Form */}
                  {data.form && (
                    <div>
                      <div className="text-[10px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">최근 폼</div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">{data.form.home.map((r, i) => <FormDot key={i} r={r} />)}</div>
                        <span className="text-[10px] text-gray-300">홈</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex gap-1">{data.form.away.map((r, i) => <FormDot key={i} r={r} />)}</div>
                        <span className="text-[10px] text-gray-300">원정</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'players' && (
                <div className="flex flex-col gap-2">
                  {[
                    { player: data.homeTopScorer, team: data.homeName, logo: data.homeLogo, accent: 'bg-blue-500' },
                    { player: data.awayTopScorer, team: data.awayName, logo: data.awayLogo, accent: 'bg-red-500' },
                  ].map(({ player, team, logo, accent }, i) => player ? (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <img src={player.photo} alt={player.name}
                        className="w-9 h-9 rounded-full object-cover border border-white shadow-sm"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {logo && <img src={logo} className="w-4 h-4 object-contain" alt="" />}
                          <span className="font-bold text-[11px] text-gray-700 truncate">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full text-white font-bold ${accent}`}>
                            ⚽ {player.goals}골
                          </span>
                          <span className="text-[10px] text-gray-400">{team}</span>
                        </div>
                      </div>
                    </div>
                  ) : null)}
                  <p className="text-[10px] text-gray-300 mt-1">↓ 전체 분석은 스크롤 다운</p>
                </div>
              )}

              {tab === 'predict' && data.prediction && (
                <div className="flex flex-col gap-2.5">
                  {/* Score */}
                  <div className="flex items-center justify-center">
                    <div className="bg-[#0F172A] rounded-xl px-5 py-2 text-center">
                      <div className="text-white font-black text-xl tracking-widest">{data.prediction.predictedScore}</div>
                      <div className="text-gray-400 text-[9px] mt-0.5">예상 스코어</div>
                    </div>
                  </div>
                  {/* Win bars */}
                  {[
                    { label: data.homeName?.split(' ')[0] || 'Home', val: data.prediction.homeWin, color: '#3B82F6' },
                    { label: '무승부', val: data.prediction.draw, color: '#9CA3AF' },
                    { label: data.awayName?.split(' ')[0] || 'Away', val: data.prediction.awayWin, color: '#EF4444' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-14 shrink-0 truncate">{item.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${item.val}%`, background: item.color }} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 w-7 text-right">{item.val}%</span>
                    </div>
                  ))}
                  <div className="flex gap-1.5 mt-1">
                    <div className="flex-1 text-center p-1.5 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="text-[11px] font-black text-purple-700">{data.prediction.btts}%</div>
                      <div className="text-[9px] text-purple-400">양팀득점</div>
                    </div>
                  </div>
                </div>
              )}
            </>

          // ── F1 ──
          ) : data.type === 'f1' ? (
            <>
              {tab === 'match' && (
                <div className="flex flex-col gap-2">
                  {data.gpCircuit && (
                    <div className="p-2 bg-red-50 rounded-lg border border-red-100">
                      <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-0.5">서킷</div>
                      <div className="text-[11px] font-bold text-gray-700">{data.gpCircuit}</div>
                    </div>
                  )}
                  {/* Constructor top 5 */}
                  <div>
                    <div className="text-[10px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">컨스트럭터 순위</div>
                    {data.teams?.slice(0, 5).map((t: any) => (
                      <div key={t.name} className="flex items-center gap-1.5 py-1 border-b border-gray-50">
                        <span className="text-[10px] text-gray-400 w-3">{t.position}</span>
                        <img src={t.logo} alt={t.name} className="w-4 h-4 object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                        <span className="text-[10px] font-semibold text-gray-700 flex-1 truncate">{t.name}</span>
                        <span className="text-[10px] font-bold" style={{ color: getTeamColor(t.name) }}>{t.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'players' && (
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">드라이버 순위</div>
                  {data.drivers?.slice(0, 8).map((d: any) => (
                    <div key={d.name} className="flex items-center gap-2 py-1 border-b border-gray-50">
                      <span className={`text-[10px] font-black w-3 ${d.position <= 3 ? 'text-yellow-500' : 'text-gray-300'}`}>
                        {d.position}
                      </span>
                      <img src={d.image} alt={d.name} className="w-5 h-5 rounded-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                      <span className="text-[10px] font-bold text-gray-700 flex-1 truncate">{d.name}</span>
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded text-white"
                        style={{ background: getTeamColor(d.team), fontSize: '9px' }}>{d.abbr}</span>
                      <span className="text-[10px] font-bold text-gray-500 w-8 text-right">{d.points}</span>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'predict' && data.gpPrediction && (
                <div className="flex flex-col gap-2.5">
                  <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">예상 포디엄</div>
                  {data.gpPrediction.podium.slice(0, 3).map((name, i) => {
                    const driver = data.drivers?.find((d: any) => d.name.includes(name.split(' ')[1] || name))
                    const medals = ['🥇', '🥈', '🥉']
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-base">{medals[i]}</span>
                        {driver?.image && (
                          <img src={driver.image} className="w-7 h-7 rounded-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display='none' }} alt="" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-gray-700 truncate">{name}</div>
                          {driver && (
                            <div className="text-[9px] font-semibold mt-0.5" style={{ color: getTeamColor(driver.team) }}>
                              {driver.team.split(' ')[0]}
                            </div>
                          )}
                        </div>
                        {driver && (
                          <span className="text-[9px] text-gray-400">{driver.points}pts</span>
                        )}
                      </div>
                    )
                  })}
                  <p className="text-[10px] text-gray-300 mt-1">↓ 상세 분석은 스크롤 다운</p>
                </div>
              )}
            </>
          ) : null
        )}
      </div>
    </div>
  )
}
