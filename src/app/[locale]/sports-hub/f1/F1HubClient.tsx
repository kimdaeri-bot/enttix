'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-3 py-3">
      <div className="w-6 h-4 bg-gray-200 rounded" />
      <div className="w-10 h-10 bg-gray-200 rounded-full" />
      <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-32" /></div>
      <div className="h-4 bg-gray-200 rounded w-12" />
    </div>
  )
}

export default function F1HubClient() {
  const [drivers, setDrivers] = useState<AnyData[]>([])
  const [teams, setTeams] = useState<AnyData[]>([])
  const [races, setRaces] = useState<AnyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/f1?type=drivers').then((r) => r.json()),
      fetch('/api/f1?type=teams').then((r) => r.json()),
      fetch('/api/f1?type=races').then((r) => r.json()),
    ])
      .then(([d, t, r]) => {
        setDrivers(Array.isArray(d) ? d : [])
        setTeams(Array.isArray(t) ? t : [])
        setRaces(Array.isArray(r) ? r : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const topDrivers = drivers.slice(0, 10)
  const topTeams = teams.slice(0, 5)

  const now = new Date()
  const completedRaces = races.filter(
    (r: AnyData) => r.status === 'Completed' || new Date(r.date) < now
  )
  const upcomingRaces = races.filter(
    (r: AnyData) => r.status !== 'Completed' && new Date(r.date) >= now
  )
  const nextRace = upcomingRaces[0]

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0F172A] pt-10 pb-14 px-4">
        <div className="max-w-[1280px] mx-auto">
          <Link
            href="/sports-hub"
            className="text-[13px] text-[#93C5FD] hover:text-white transition-colors mb-4 inline-block"
          >
            &larr; Sports Hub
          </Link>
          <h1 className="text-[36px] md:text-[48px] font-extrabold text-white tracking-tight">
            Formula 1 Hub
          </h1>
          <p className="text-[16px] text-[#93C5FD] mt-2">
            2024 Season standings, race calendar, and analysis
          </p>
        </div>
      </section>

      {/* Next GP Spotlight */}
      {nextRace && (
        <section className="py-10 px-4">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-[20px] font-bold text-gray-900 mb-4">
              Next Grand Prix
            </h2>
            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-8 md:p-10 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-[12px] text-[#93C5FD] font-semibold mb-1">
                    Round {nextRace.id || ''}
                  </p>
                  <h3 className="text-[24px] md:text-[32px] font-extrabold mb-2">
                    {nextRace.competition?.name || 'Grand Prix'}
                  </h3>
                  <p className="text-[14px] text-gray-300">
                    {nextRace.circuit?.name || 'TBD'}
                  </p>
                  <p className="text-[13px] text-gray-400">
                    {nextRace.circuit?.location?.city}, {nextRace.circuit?.location?.country}
                  </p>
                  <p className="text-[13px] text-[#93C5FD] mt-3 font-semibold">
                    {new Date(nextRace.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })}
                  </p>
                  {nextRace.laps?.total && (
                    <p className="text-[12px] text-gray-400 mt-1">
                      {nextRace.laps.total} Laps &middot; {nextRace.distance || ''}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href={`/sport/formula-1?q=${encodeURIComponent(nextRace.competition?.name || 'F1')}`}
                    className="inline-block px-6 py-3 bg-[#2B7FFF] rounded-xl text-[14px] font-bold hover:bg-[#1E6FEF] transition-colors"
                  >
                    Buy Tickets
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="pb-12 px-4">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Driver Standings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-[16px] font-bold text-gray-900">드라이버 순위 Top 10</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-gray-400 bg-gray-50 border-b border-gray-100">
                      <th className="text-left py-3 px-3 w-8">#</th>
                      <th className="text-left py-3 px-3">Driver</th>
                      <th className="text-left py-3 px-2">Team</th>
                      <th className="text-center py-3 px-2">Wins</th>
                      <th className="text-center py-3 px-2">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? [...Array(10)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="py-3 px-3"><div className="h-4 bg-gray-200 rounded w-5" /></td>
                            <td className="py-3 px-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                            <td className="py-3 px-2"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                            <td className="py-3 px-2"><div className="h-4 bg-gray-200 rounded w-8 mx-auto" /></td>
                            <td className="py-3 px-2"><div className="h-4 bg-gray-200 rounded w-10 mx-auto" /></td>
                          </tr>
                        ))
                      : topDrivers.map((d: AnyData) => (
                          <tr
                            key={d.position}
                            className="border-b border-gray-50 hover:bg-[#EFF6FF] transition-colors"
                          >
                            <td className="py-3 px-3 font-bold text-gray-900">{d.position}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                {d.driver?.image && (
                                  <div className="w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0">
                                    <Image
                                      src={d.driver.image}
                                      alt={d.driver.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-gray-900">{d.driver?.name}</p>
                                  {d.driver?.number && (
                                    <p className="text-[10px] text-gray-400">#{d.driver.number}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-1.5">
                                {d.team?.logo && (
                                  <div className="w-4 h-4 relative flex-shrink-0">
                                    <Image
                                      src={d.team.logo}
                                      alt={d.team.name}
                                      fill
                                      className="object-contain"
                                      unoptimized
                                    />
                                  </div>
                                )}
                                <span className="text-gray-600 truncate">{d.team?.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center font-semibold text-gray-700">
                              {d.wins ?? 0}
                            </td>
                            <td className="py-3 px-2 text-center font-bold text-gray-900">
                              {d.points}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Constructor Standings Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-[16px] font-bold text-gray-900">Constructor 순위</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <div key={i} className="px-5"><SkeletonRow /></div>
                    ))
                  : topTeams.map((t: AnyData) => (
                      <div
                        key={t.position}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50"
                      >
                        <span className="text-[13px] font-bold text-gray-400 w-5 text-center">
                          {t.position}
                        </span>
                        {t.team?.logo && (
                          <div className="w-8 h-8 relative flex-shrink-0">
                            <Image
                              src={t.team.logo}
                              alt={t.team.name}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        <span className="text-[12px] font-semibold text-gray-900 flex-1 truncate">
                          {t.team?.name}
                        </span>
                        <span className="text-[13px] font-bold text-gray-900">
                          {t.points} pts
                        </span>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Race Calendar */}
      <section className="bg-[#0F172A] py-12 px-4">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-[20px] font-bold text-white mb-6">Race Calendar</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Upcoming */}
              {upcomingRaces.length > 0 && (
                <div className="mb-8">
                  <p className="text-[12px] font-semibold text-[#93C5FD] mb-3 uppercase tracking-wider">
                    Upcoming
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingRaces.map((race: AnyData, i: number) => {
                      const raceDate = new Date(race.date)
                      return (
                        <div
                          key={i}
                          className="bg-white/10 rounded-xl p-5 border border-white/10 hover:border-[#2B7FFF]/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[14px] font-bold text-white">
                                {race.competition?.name || 'Grand Prix'}
                              </p>
                              <p className="text-[12px] text-gray-400 mt-1">
                                {race.circuit?.name}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {race.circuit?.location?.city},{' '}
                                {race.circuit?.location?.country}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[12px] font-semibold text-[#93C5FD]">
                                {raceDate.toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Completed */}
              {completedRaces.length > 0 && (
                <div>
                  <p className="text-[12px] font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                    Completed
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {completedRaces.map((race: AnyData, i: number) => {
                      const raceDate = new Date(race.date)
                      return (
                        <div
                          key={i}
                          className="bg-white/5 rounded-xl p-4 opacity-70"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[13px] font-semibold text-gray-300">
                                {race.competition?.name || 'Grand Prix'}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {race.circuit?.location?.city},{' '}
                                {race.circuit?.location?.country}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] text-gray-500">
                                {raceDate.toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                                DONE
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
