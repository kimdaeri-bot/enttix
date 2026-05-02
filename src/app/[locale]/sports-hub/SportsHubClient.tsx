'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const LEAGUES = [
  { id: 39, slug: 'premier-league', name: 'EPL', fullName: 'Premier League' },
  { id: 140, slug: 'la-liga', name: 'La Liga', fullName: 'La Liga' },
  { id: 78, slug: 'bundesliga', name: 'Bundesliga', fullName: 'Bundesliga' },
  { id: 135, slug: 'serie-a', name: 'Serie A', fullName: 'Serie A' },
  { id: 61, slug: 'ligue-1', name: 'Ligue 1', fullName: 'Ligue 1' },
]

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-8" />
        <div className="flex items-center gap-3">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-full" />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-5 h-4 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="w-8 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

function HotMatchCard({ match }: { match: AnyData }) {
  const date = new Date(match.date)
  const dateStr = date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
  const timeStr = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const eventName = `${match.home.name} vs ${match.away.name}`

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-[#2B7FFF] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
          {match.league.name}
        </span>
        {match.isDerby && (
          <span className="text-[10px] font-bold text-[#EF4444] bg-[#FEF2F2] px-2 py-0.5 rounded-full">
            DERBY
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div className="w-12 h-12 relative">
            <Image
              src={match.home.logo}
              alt={match.home.name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <Link
            href={`/sports-hub/team/${match.home.id}`}
            className="text-[12px] font-semibold text-gray-900 text-center hover:text-[#2B7FFF] transition-colors leading-tight"
          >
            {match.home.name}
          </Link>
          <span className="text-[10px] text-gray-500">#{match.home.rank}</span>
        </div>

        <div className="flex flex-col items-center gap-1 px-3">
          <span className="text-[12px] font-bold text-gray-400">VS</span>
          <span className="text-[11px] text-gray-500">{dateStr}</span>
          <span className="text-[11px] text-gray-400">{timeStr}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div className="w-12 h-12 relative">
            <Image
              src={match.away.logo}
              alt={match.away.name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <Link
            href={`/sports-hub/team/${match.away.id}`}
            className="text-[12px] font-semibold text-gray-900 text-center hover:text-[#2B7FFF] transition-colors leading-tight"
          >
            {match.away.name}
          </Link>
          <span className="text-[10px] text-gray-500">#{match.away.rank}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/sports-hub/match/${match.id}?event=${encodeURIComponent(eventName)}`}
          className="flex-1 text-center py-2 rounded-lg text-[12px] font-semibold text-[#2B7FFF] border border-[#2B7FFF] hover:bg-[#EFF6FF] transition-colors"
        >
          Preview
        </Link>
        <Link
          href={`/sport/football?q=${encodeURIComponent(eventName)}`}
          className="flex-1 text-center py-2 rounded-lg text-[12px] font-semibold text-white bg-[#2B7FFF] hover:bg-[#1E6FEF] transition-colors"
        >
          Buy Tickets
        </Link>
      </div>
    </div>
  )
}

function LeagueTab({ league }: { league: typeof LEAGUES[number] }) {
  const [data, setData] = useState<AnyData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sports-hub/league/${league.id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [league.id])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <SkeletonTable />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <SkeletonTable />
        </div>
      </div>
    )
  }

  if (!data || data.error) {
    return <p className="text-gray-500 text-center py-8">Failed to load league data.</p>
  }

  const standings = (data.standings || []).slice(0, 5)
  const fixtures = (data.fixtures || []).slice(0, 3)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Standings Top 5 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[14px] font-bold text-gray-900">순위</h4>
          <Link
            href={`/sports-hub/${league.slug}`}
            className="text-[12px] font-semibold text-[#2B7FFF] hover:underline"
          >
            전체 보기 &rarr;
          </Link>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left py-2 w-8">#</th>
              <th className="text-left py-2">팀</th>
              <th className="text-center py-2">경기</th>
              <th className="text-center py-2">승점</th>
              <th className="text-center py-2">득실</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s: AnyData) => (
              <tr key={s.team.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 font-semibold text-gray-900">{s.rank}</td>
                <td className="py-2">
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
                    <span className="font-medium text-gray-900 truncate">{s.team.name}</span>
                  </Link>
                </td>
                <td className="py-2 text-center text-gray-600">{s.played}</td>
                <td className="py-2 text-center font-bold text-gray-900">{s.points}</td>
                <td className="py-2 text-center text-gray-600">
                  {s.goalDiff > 0 ? '+' : ''}
                  {s.goalDiff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Next 3 Fixtures */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h4 className="text-[14px] font-bold text-gray-900 mb-4">다음 경기</h4>
        <div className="space-y-3">
          {fixtures.map((f: AnyData) => {
            const fDate = new Date(f.date)
            const eventName = `${f.home.name} vs ${f.away.name}`
            return (
              <Link
                key={f.id}
                href={`/sports-hub/match/${f.id}?event=${encodeURIComponent(eventName)}`}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-[#EFF6FF] transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-5 h-5 relative flex-shrink-0">
                    <Image src={f.home.logo} alt={f.home.name} fill className="object-contain" unoptimized />
                  </div>
                  <span className="text-[12px] font-medium text-gray-900 truncate">{f.home.name}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 px-2">vs</span>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-[12px] font-medium text-gray-900 truncate">{f.away.name}</span>
                  <div className="w-5 h-5 relative flex-shrink-0">
                    <Image src={f.away.logo} alt={f.away.name} fill className="object-contain" unoptimized />
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 ml-3 flex-shrink-0">
                  {fDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
              </Link>
            )
          })}
          {fixtures.length === 0 && (
            <p className="text-gray-400 text-center text-[13px] py-4">예정된 경기가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function F1Tab() {
  const [drivers, setDrivers] = useState<AnyData[]>([])
  const [races, setRaces] = useState<AnyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/f1?type=drivers').then((r) => r.json()),
      fetch('/api/f1?type=races').then((r) => r.json()),
    ])
      .then(([d, r]) => {
        setDrivers(Array.isArray(d) ? d : [])
        setRaces(Array.isArray(r) ? r : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5"><SkeletonTable /></div>
        <div className="bg-white rounded-xl shadow-sm p-5"><SkeletonTable /></div>
      </div>
    )
  }

  const topDrivers = drivers.slice(0, 5)
  const nextRace = races.find(
    (r: AnyData) => r.status !== 'Completed' && new Date(r.date) > new Date()
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Driver Standings Top 5 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[14px] font-bold text-gray-900">드라이버 순위</h4>
          <Link
            href="/sports-hub/f1"
            className="text-[12px] font-semibold text-[#2B7FFF] hover:underline"
          >
            전체 보기 &rarr;
          </Link>
        </div>
        <div className="space-y-2">
          {topDrivers.map((d: AnyData) => (
            <div
              key={d.position}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
            >
              <span className="text-[13px] font-bold text-gray-400 w-5 text-center">
                {d.position}
              </span>
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
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-gray-900 truncate">{d.driver?.name}</p>
                <p className="text-[10px] text-gray-500">{d.team?.name}</p>
              </div>
              <span className="text-[12px] font-bold text-gray-900">{d.points} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Race */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h4 className="text-[14px] font-bold text-gray-900 mb-4">다음 레이스</h4>
        {nextRace ? (
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white">
            <p className="text-[11px] text-[#93C5FD] font-semibold mb-1">
              {nextRace.competition?.name || 'Grand Prix'}
            </p>
            <p className="text-[18px] font-bold mb-2">
              {nextRace.circuit?.name || 'TBD'}
            </p>
            <p className="text-[12px] text-gray-300 mb-1">
              {nextRace.circuit?.location?.city}, {nextRace.circuit?.location?.country}
            </p>
            <p className="text-[12px] text-gray-400">
              {new Date(nextRace.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
            <Link
              href="/sports-hub/f1"
              className="mt-4 inline-block px-4 py-2 bg-[#2B7FFF] rounded-lg text-[12px] font-semibold hover:bg-[#1E6FEF] transition-colors"
            >
              F1 Hub &rarr;
            </Link>
          </div>
        ) : (
          <p className="text-gray-400 text-center text-[13px] py-4">
            예정된 레이스가 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}

export default function SportsHubClient() {
  const [hotMatches, setHotMatches] = useState<AnyData[]>([])
  const [loadingHot, setLoadingHot] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('epl')

  useEffect(() => {
    fetch('/api/sports-hub/hot-matches')
      .then((r) => r.json())
      .then((data) => setHotMatches(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingHot(false))
  }, [])

  const tabs = [
    ...LEAGUES.map((l) => ({ key: l.slug.replace('-', ''), label: l.name, type: 'league' as const, league: l })),
    { key: 'f1', label: 'F1', type: 'f1' as const, league: null },
  ]

  // Map tab key to the correct league key
  const tabKeyMap: Record<string, string> = {
    premierleague: 'epl',
    laliga: 'laliga',
    bundesliga: 'bundesliga',
    seriea: 'seriea',
    ligue1: 'ligue1',
    f1: 'f1',
  }

  const activeTabObj = tabs.find((t) => {
    const mapped = tabKeyMap[t.key] || t.key
    return mapped === activeTab || t.key === activeTab
  }) || tabs[0]

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0F172A] pt-12 pb-16 px-4">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-[36px] md:text-[48px] font-extrabold text-white tracking-tight mb-3">
            Sports Hub
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#93C5FD] max-w-[600px] mx-auto">
            Top 5 League & F1 live data, match previews, and tickets
          </p>
        </div>
      </section>

      {/* Hot Matches */}
      <section className="py-12 px-4">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-[22px] font-bold text-gray-900 mb-2">
            Hot Matches
          </h2>
          <p className="text-[14px] text-gray-500 mb-6">
            7 days ahead, top rated matches across top 5 leagues
          </p>

          {loadingHot ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : hotMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {hotMatches.map((match) => (
                <HotMatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-[15px]">No upcoming hot matches found.</p>
            </div>
          )}
        </div>
      </section>

      {/* League Tabs */}
      <section className="bg-[#0F172A] py-12 px-4">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-[22px] font-bold text-white mb-6">
            Leagues & F1
          </h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => {
              const mapped = tabKeyMap[tab.key] || tab.key
              const isActive = mapped === activeTab || tab.key === activeTab
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(mapped || tab.key)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#2B7FFF] text-white'
                      : 'bg-white/10 text-[#93C5FD] hover:bg-white/20'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          {activeTabObj.type === 'f1' ? (
            <F1Tab />
          ) : activeTabObj.league ? (
            <LeagueTab key={activeTabObj.league.id} league={activeTabObj.league} />
          ) : null}
        </div>
      </section>
    </div>
  )
}
