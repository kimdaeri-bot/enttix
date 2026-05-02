'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const LEAGUE_MAP: Record<string, { id: number; name: string }> = {
  'premier-league': { id: 39, name: 'Premier League' },
  'la-liga': { id: 140, name: 'La Liga' },
  'bundesliga': { id: 78, name: 'Bundesliga' },
  'serie-a': { id: 135, name: 'Serie A' },
  'ligue-1': { id: 61, name: 'Ligue 1' },
}

function FormDots({ form }: { form: string }) {
  if (!form) return null
  return (
    <div className="flex gap-0.5">
      {form
        .slice(-5)
        .split('')
        .map((ch, i) => {
          let bg = 'bg-gray-300'
          if (ch === 'W') bg = 'bg-green-500'
          else if (ch === 'D') bg = 'bg-yellow-400'
          else if (ch === 'L') bg = 'bg-red-500'
          return <span key={i} className={`w-2.5 h-2.5 rounded-full ${bg}`} />
        })}
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-3 px-2"><div className="h-4 bg-gray-200 rounded w-5" /></td>
      <td className="py-3 px-2"><div className="h-4 bg-gray-200 rounded w-32" /></td>
      <td className="py-3 px-2 text-center"><div className="h-4 bg-gray-200 rounded w-6 mx-auto" /></td>
      <td className="py-3 px-2 text-center"><div className="h-4 bg-gray-200 rounded w-6 mx-auto" /></td>
      <td className="py-3 px-2 text-center"><div className="h-4 bg-gray-200 rounded w-6 mx-auto" /></td>
      <td className="py-3 px-2 text-center"><div className="h-4 bg-gray-200 rounded w-6 mx-auto" /></td>
      <td className="py-3 px-2 text-center"><div className="h-4 bg-gray-200 rounded w-8 mx-auto" /></td>
      <td className="py-3 px-2 text-center"><div className="h-4 bg-gray-200 rounded w-8 mx-auto" /></td>
      <td className="py-3 px-2"><div className="h-4 bg-gray-200 rounded w-16" /></td>
    </tr>
  )
}

export default function LeagueClient() {
  const params = useParams()
  const leagueSlug = params.league as string
  const leagueConfig = LEAGUE_MAP[leagueSlug]

  const [data, setData] = useState<AnyData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!leagueConfig) {
      setLoading(false)
      return
    }
    fetch(`/api/sports-hub/league/${leagueConfig.id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [leagueConfig])

  if (!leagueConfig) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-[24px] font-bold text-gray-900 mb-2">League not found</h1>
        <Link href="/sports-hub" className="text-[#2B7FFF] font-semibold hover:underline">
          &larr; Back to Sports Hub
        </Link>
      </div>
    )
  }

  const standings: AnyData[] = data?.standings || []
  const fixtures: AnyData[] = data?.fixtures || []
  const topScorers: AnyData[] = data?.topScorers || []

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0F172A] pt-10 pb-12 px-4">
        <div className="max-w-[1280px] mx-auto">
          <Link
            href="/sports-hub"
            className="text-[13px] text-[#93C5FD] hover:text-white transition-colors mb-4 inline-block"
          >
            &larr; Sports Hub
          </Link>
          <div className="flex items-center gap-4">
            {data?.league?.logo && (
              <div className="w-14 h-14 relative flex-shrink-0">
                <Image
                  src={data.league.logo}
                  alt={data.league.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div>
              <h1 className="text-[28px] md:text-[36px] font-extrabold text-white">
                {data?.league?.name || leagueConfig.name}
              </h1>
              {data?.league?.country && (
                <p className="text-[14px] text-[#93C5FD]">{data.league.country} &middot; {data.league.season}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Standings Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-[16px] font-bold text-gray-900">순위표</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-gray-400 bg-gray-50 border-b border-gray-100">
                      <th className="text-left py-3 px-3 w-8">#</th>
                      <th className="text-left py-3 px-3">팀</th>
                      <th className="text-center py-3 px-2">경기</th>
                      <th className="text-center py-3 px-2">승</th>
                      <th className="text-center py-3 px-2">무</th>
                      <th className="text-center py-3 px-2">패</th>
                      <th className="text-center py-3 px-2">득실</th>
                      <th className="text-center py-3 px-2">승점</th>
                      <th className="text-center py-3 px-2">폼</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
                      : standings.map((s: AnyData, idx: number) => (
                          <tr
                            key={s.team.id}
                            className={`border-b border-gray-50 hover:bg-[#EFF6FF] transition-colors ${
                              idx < 4
                                ? 'border-l-2 border-l-[#2B7FFF]'
                                : idx >= standings.length - 3
                                  ? 'border-l-2 border-l-red-400'
                                  : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-bold text-gray-900">{s.rank}</td>
                            <td className="py-3 px-3">
                              <Link
                                href={`/sports-hub/team/${s.team.id}`}
                                className="flex items-center gap-2 hover:text-[#2B7FFF] transition-colors"
                              >
                                <div className="w-5 h-5 relative flex-shrink-0">
                                  <Image
                                    src={s.team.logo}
                                    alt={s.team.name}
                                    fill
                                    className="object-contain"
                                    unoptimized
                                  />
                                </div>
                                <span className="font-medium text-gray-900 whitespace-nowrap">
                                  {s.team.name}
                                </span>
                              </Link>
                            </td>
                            <td className="py-3 px-2 text-center text-gray-600">{s.played}</td>
                            <td className="py-3 px-2 text-center text-gray-600">{s.won}</td>
                            <td className="py-3 px-2 text-center text-gray-600">{s.drawn}</td>
                            <td className="py-3 px-2 text-center text-gray-600">{s.lost}</td>
                            <td className="py-3 px-2 text-center font-semibold text-gray-700">
                              {s.goalDiff > 0 ? '+' : ''}
                              {s.goalDiff}
                            </td>
                            <td className="py-3 px-2 text-center font-bold text-gray-900">
                              {s.points}
                            </td>
                            <td className="py-3 px-2">
                              <FormDots form={s.form} />
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upcoming Fixtures */}
            <div className="bg-white rounded-xl shadow-sm mt-6 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-[16px] font-bold text-gray-900">다음 경기</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <div key={i} className="px-5 py-4 animate-pulse flex items-center gap-4">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                      </div>
                    ))
                  : fixtures.map((f: AnyData) => {
                      const fDate = new Date(f.date)
                      const eventName = `${f.home.name} vs ${f.away.name}`
                      return (
                        <Link
                          key={f.id}
                          href={`/sports-hub/match/${f.id}?event=${encodeURIComponent(eventName)}`}
                          className="flex items-center px-5 py-4 hover:bg-[#EFF6FF] transition-colors"
                        >
                          <span className="text-[11px] text-gray-400 w-20 flex-shrink-0">
                            {fDate.toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            <br />
                            {fDate.toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-5 h-5 relative flex-shrink-0">
                              <Image
                                src={f.home.logo}
                                alt={f.home.name}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                            <span className="text-[13px] font-medium text-gray-900 truncate">
                              {f.home.name}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-gray-400 px-3">vs</span>
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className="text-[13px] font-medium text-gray-900 truncate">
                              {f.away.name}
                            </span>
                            <div className="w-5 h-5 relative flex-shrink-0">
                              <Image
                                src={f.away.logo}
                                alt={f.away.name}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                {!loading && fixtures.length === 0 && (
                  <p className="px-5 py-8 text-center text-gray-400 text-[13px]">
                    예정된 경기가 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Top Scorers Sidebar */}
          <div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-[16px] font-bold text-gray-900">득점 순위</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <div key={i} className="px-5 py-3 animate-pulse flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-24 mb-1" />
                          <div className="h-3 bg-gray-200 rounded w-16" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-8" />
                      </div>
                    ))
                  : topScorers.map((scorer: AnyData, idx: number) => (
                      <div
                        key={scorer.player?.id || idx}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50"
                      >
                        <span className="text-[13px] font-bold text-gray-400 w-5 text-center">
                          {idx + 1}
                        </span>
                        {scorer.player?.photo && (
                          <div className="w-9 h-9 relative rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={scorer.player.photo}
                              alt={scorer.player.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-900 truncate">
                            {scorer.player?.name}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {scorer.team?.logo && (
                              <div className="w-3.5 h-3.5 relative flex-shrink-0">
                                <Image
                                  src={scorer.team.logo}
                                  alt={scorer.team.name}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                            )}
                            <span className="text-[10px] text-gray-500 truncate">
                              {scorer.team?.name}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[14px] font-bold text-gray-900">{scorer.goals}</p>
                          <p className="text-[10px] text-gray-400">
                            {scorer.assists} ast
                          </p>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
