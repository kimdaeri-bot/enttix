'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

function FormDots({ form, label }: { form: string[]; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[11px] text-gray-400 font-semibold">{label}</span>
      <div className="flex gap-1">
        {form.map((ch, i) => {
          let bg = 'bg-gray-300'
          if (ch === 'W') bg = 'bg-green-500'
          else if (ch === 'D') bg = 'bg-yellow-400'
          else if (ch === 'L') bg = 'bg-red-500'
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className={`w-3 h-3 rounded-full ${bg}`} />
              <span className="text-[9px] text-gray-400">{ch}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatBar({
  label,
  homeVal,
  awayVal,
}: {
  label: string
  homeVal: number
  awayVal: number
}) {
  const total = homeVal + awayVal || 1
  const homePct = (homeVal / total) * 100
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[11px] text-gray-600 mb-1">
        <span className="font-semibold">{homeVal.toFixed(1)}</span>
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold">{awayVal.toFixed(1)}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
        <div
          className="bg-[#2B7FFF] rounded-l-full transition-all"
          style={{ width: `${homePct}%` }}
        />
        <div
          className="bg-[#EF4444] rounded-r-full transition-all"
          style={{ width: `${100 - homePct}%` }}
        />
      </div>
    </div>
  )
}

function WinProbPie({
  homeWin,
  draw,
  awayWin,
}: {
  homeWin: number
  draw: number
  awayWin: number
}) {
  const total = homeWin + draw + awayWin || 100
  const homeAngle = (homeWin / total) * 360
  const drawAngle = (draw / total) * 360

  const gradient = `conic-gradient(
    #2B7FFF 0deg ${homeAngle}deg,
    #9CA3AF ${homeAngle}deg ${homeAngle + drawAngle}deg,
    #EF4444 ${homeAngle + drawAngle}deg 360deg
  )`

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-20 h-20 rounded-full flex-shrink-0"
        style={{ background: gradient }}
      />
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2B7FFF]" />
          <span className="text-gray-600">Home {homeWin}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <span className="text-gray-600">Draw {draw}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          <span className="text-gray-600">Away {awayWin}%</span>
        </div>
      </div>
    </div>
  )
}

function PlayerCard({ player, side }: { player: AnyData; side: 'home' | 'away' }) {
  const borderColor = side === 'home' ? 'border-[#2B7FFF]' : 'border-[#EF4444]'
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-gray-50 border-l-2 ${borderColor}`}>
      {player.photo && (
        <div className="w-10 h-10 relative rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={player.photo}
            alt={player.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-gray-900 truncate">{player.name}</p>
        <p className="text-[10px] text-gray-500">{player.position}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[12px] font-bold text-gray-900">{player.goals}G {player.assists}A</p>
        {player.rating && (
          <p className="text-[10px] text-[#2B7FFF] font-semibold">{player.rating}</p>
        )}
      </div>
    </div>
  )
}

function InjuryBadge({ injury }: { injury: AnyData }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50">
      {injury.photo && (
        <div className="w-6 h-6 relative rounded-full overflow-hidden flex-shrink-0">
          <Image src={injury.photo} alt={injury.name} fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-gray-900 truncate">{injury.name}</p>
        <p className="text-[9px] text-red-500">{injury.reason || injury.type}</p>
      </div>
    </div>
  )
}

export default function MatchPreviewClient() {
  const searchParams = useSearchParams()
  const eventName = searchParams.get('event') || ''

  const [data, setData] = useState<AnyData>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!eventName) {
      setError('No event specified')
      setLoading(false)
      return
    }
    fetch(`/api/football/match-analysis?event=${encodeURIComponent(eventName)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error)
        } else {
          setData(d)
        }
      })
      .catch(() => setError('Failed to load match data'))
      .finally(() => setLoading(false))
  }, [eventName])

  if (loading) {
    return (
      <div className="py-20">
        <div className="max-w-[900px] mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="bg-[#0F172A] rounded-2xl p-10">
              <div className="flex items-center justify-center gap-8">
                <div className="w-20 h-20 bg-gray-700 rounded-full" />
                <div className="h-8 bg-gray-700 rounded w-16" />
                <div className="w-20 h-20 bg-gray-700 rounded-full" />
              </div>
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-[24px] font-bold text-gray-900 mb-2">
          {error || 'Match data not available'}
        </h1>
        <Link href="/sports-hub" className="text-[#2B7FFF] font-semibold hover:underline">
          &larr; Back to Sports Hub
        </Link>
      </div>
    )
  }

  const { match, standings, form, stats, h2h, players, injuries, analysis } = data

  return (
    <div className="py-8 px-4">
      <div className="max-w-[900px] mx-auto">
        <Link
          href="/sports-hub"
          className="text-[13px] text-gray-500 hover:text-[#2B7FFF] transition-colors mb-6 inline-block"
        >
          &larr; Sports Hub
        </Link>

        {/* Match Header */}
        <div className="bg-[#0F172A] rounded-2xl p-8 md:p-10 mb-8">
          <p className="text-center text-[12px] text-[#93C5FD] font-semibold mb-6">
            {match.league}
          </p>
          <div className="flex items-center justify-center gap-6 md:gap-10">
            <div className="flex flex-col items-center gap-2">
              {match.home.logo && (
                <div className="w-16 h-16 md:w-20 md:h-20 relative">
                  <Image
                    src={match.home.logo}
                    alt={match.home.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <Link
                href={`/sports-hub/team/${match.home.id}`}
                className="text-[14px] md:text-[16px] font-bold text-white text-center hover:text-[#93C5FD] transition-colors"
              >
                {match.home.name}
              </Link>
              {standings.home && (
                <span className="text-[11px] text-[#93C5FD]">
                  #{standings.home.rank} &middot; {standings.home.points}pts
                </span>
              )}
            </div>

            <div className="text-center">
              <p className="text-[28px] md:text-[36px] font-extrabold text-white">VS</p>
              {match.venue && (
                <p className="text-[10px] text-gray-400 mt-2">
                  {match.venue.name}, {match.venue.city}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              {match.away.logo && (
                <div className="w-16 h-16 md:w-20 md:h-20 relative">
                  <Image
                    src={match.away.logo}
                    alt={match.away.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <Link
                href={`/sports-hub/team/${match.away.id}`}
                className="text-[14px] md:text-[16px] font-bold text-white text-center hover:text-[#93C5FD] transition-colors"
              >
                {match.away.name}
              </Link>
              {standings.away && (
                <span className="text-[11px] text-[#93C5FD]">
                  #{standings.away.rank} &middot; {standings.away.points}pts
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-[14px] font-bold text-gray-900 mb-4">최근 폼</h3>
            <div className="flex justify-around">
              <FormDots form={form.home} label={match.home.name} />
              <FormDots form={form.away} label={match.away.name} />
            </div>
          </div>

          {/* H2H */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-[14px] font-bold text-gray-900 mb-4">
              상대 전적 (최근 {h2h.recent?.length || 0}경기)
            </h3>
            <div className="flex justify-center gap-6 mb-4">
              <div className="text-center">
                <p className="text-[24px] font-bold text-[#2B7FFF]">{h2h.homeWins}</p>
                <p className="text-[10px] text-gray-400">Home Win</p>
              </div>
              <div className="text-center">
                <p className="text-[24px] font-bold text-gray-400">{h2h.draws}</p>
                <p className="text-[10px] text-gray-400">Draw</p>
              </div>
              <div className="text-center">
                <p className="text-[24px] font-bold text-[#EF4444]">{h2h.awayWins}</p>
                <p className="text-[10px] text-gray-400">Away Win</p>
              </div>
            </div>
            <div className="space-y-1">
              {(h2h.recent || []).map((r: AnyData, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-gray-50"
                >
                  <span className="text-gray-400 w-16">{r.date}</span>
                  <span className="text-gray-700 font-medium truncate flex-1 text-right">
                    {r.homeTeam}
                  </span>
                  <span className="font-bold text-gray-900 px-2">
                    {r.homeGoals}-{r.awayGoals}
                  </span>
                  <span className="text-gray-700 font-medium truncate flex-1">
                    {r.awayTeam}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Attack / Defense Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-[14px] font-bold text-gray-900 mb-4">공격 / 수비 비교</h3>
            <StatBar
              label="평균 득점"
              homeVal={stats.home.avgScored}
              awayVal={stats.away.avgScored}
            />
            <StatBar
              label="평균 실점"
              homeVal={stats.home.avgConceded}
              awayVal={stats.away.avgConceded}
            />
            <p className="text-[10px] text-gray-400 text-center mt-2">
              H2H 평균 {h2h.avgGoals}골/경기
            </p>
          </div>

          {/* Win Probability */}
          {analysis?.goalProbability && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-gray-900 mb-4">승률 예측</h3>
              <WinProbPie
                homeWin={analysis.goalProbability.homeWin}
                draw={analysis.goalProbability.draw}
                awayWin={analysis.goalProbability.awayWin}
              />
              <div className="mt-4 flex gap-3">
                <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-400">BTTS</p>
                  <p className="text-[14px] font-bold text-gray-900">
                    {analysis.goalProbability.btts}%
                  </p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-400">O2.5</p>
                  <p className="text-[14px] font-bold text-gray-900">
                    {analysis.goalProbability.over25}%
                  </p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-400">Score</p>
                  <p className="text-[14px] font-bold text-gray-900">
                    {analysis.goalProbability.predictedScore}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-[14px] font-bold text-gray-900 mb-3">
              {match.home.name} 주요 선수
            </h3>
            <div className="space-y-2">
              {(players.home || []).map((p: AnyData, i: number) => (
                <PlayerCard key={i} player={p} side="home" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-[14px] font-bold text-gray-900 mb-3">
              {match.away.name} 주요 선수
            </h3>
            <div className="space-y-2">
              {(players.away || []).map((p: AnyData, i: number) => (
                <PlayerCard key={i} player={p} side="away" />
              ))}
            </div>
          </div>
        </div>

        {/* Injuries */}
        {((injuries.home?.length || 0) > 0 || (injuries.away?.length || 0) > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {injuries.home?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-[14px] font-bold text-gray-900 mb-3">
                  {match.home.name} 부상자
                </h3>
                <div className="space-y-2">
                  {injuries.home.map((inj: AnyData, i: number) => (
                    <InjuryBadge key={i} injury={inj} />
                  ))}
                </div>
              </div>
            )}
            {injuries.away?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-[14px] font-bold text-gray-900 mb-3">
                  {match.away.name} 부상자
                </h3>
                <div className="space-y-2">
                  {injuries.away.map((inj: AnyData, i: number) => (
                    <InjuryBadge key={i} injury={inj} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis */}
        {analysis && (
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-8 mt-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[12px] font-bold text-[#2B7FFF] bg-[#2B7FFF]/10 px-3 py-1 rounded-full">
                AI Analysis
              </span>
            </div>

            {analysis.matchOverview && (
              <p className="text-[14px] text-gray-300 leading-relaxed mb-6">
                {analysis.matchOverview}
              </p>
            )}

            {analysis.tacticalAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-[11px] text-[#93C5FD] font-semibold mb-2">
                    {match.home.name} 전술
                  </p>
                  <p className="text-[12px] text-gray-300 leading-relaxed">
                    {analysis.tacticalAnalysis.home}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-[11px] text-[#93C5FD] font-semibold mb-2">
                    {match.away.name} 전술
                  </p>
                  <p className="text-[12px] text-gray-300 leading-relaxed">
                    {analysis.tacticalAnalysis.away}
                  </p>
                </div>
              </div>
            )}

            {analysis.keyBattles && (
              <div className="mb-6">
                <p className="text-[12px] font-semibold text-white mb-3">Key Battles</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {analysis.keyBattles.map((b: AnyData, i: number) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <p className="text-[11px] font-bold text-[#2B7FFF] mb-1">{b.area}</p>
                      <p className="text-[11px] text-gray-400">{b.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.keyPlayerToWatch && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-400 mb-1">Key Player - Home</p>
                  <p className="text-[13px] font-bold text-white">
                    {analysis.keyPlayerToWatch.home.name}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {analysis.keyPlayerToWatch.home.reason}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-400 mb-1">Key Player - Away</p>
                  <p className="text-[13px] font-bold text-white">
                    {analysis.keyPlayerToWatch.away.name}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {analysis.keyPlayerToWatch.away.reason}
                  </p>
                </div>
              </div>
            )}

            {analysis.matchVerdict && (
              <div className="bg-[#2B7FFF]/10 rounded-xl p-4 mb-4">
                <p className="text-[11px] text-[#93C5FD] font-semibold mb-1">Verdict</p>
                <p className="text-[14px] font-bold text-white">{analysis.matchVerdict}</p>
              </div>
            )}

            {analysis.watchReason && (
              <p className="text-[12px] text-gray-400 italic">{analysis.watchReason}</p>
            )}
          </div>
        )}

        {/* Buy Tickets CTA */}
        <div className="mt-8 text-center">
          <Link
            href={`/sport/football?q=${encodeURIComponent(eventName)}`}
            className="inline-block px-8 py-3.5 rounded-xl bg-[#2B7FFF] text-white font-bold text-[15px] hover:bg-[#1E6FEF] transition-colors shadow-lg shadow-[#2B7FFF]/25"
          >
            Buy Tickets for {match.home.name} vs {match.away.name}
          </Link>
        </div>
      </div>
    </div>
  )
}
