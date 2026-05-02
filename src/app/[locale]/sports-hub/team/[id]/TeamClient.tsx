'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any

const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: 'GK',
  Defender: 'DF',
  Midfielder: 'MF',
  Attacker: 'FW',
}

const POSITION_COLORS: Record<string, string> = {
  Goalkeeper: 'bg-yellow-100 text-yellow-700',
  Defender: 'bg-blue-100 text-blue-700',
  Midfielder: 'bg-green-100 text-green-700',
  Attacker: 'bg-red-100 text-red-700',
}

function FixtureResult({ fixture, teamId }: { fixture: AnyData; teamId: number }) {
  const isHome = fixture.home.id === teamId
  const goalsFor = isHome ? fixture.goals.home : fixture.goals.away
  const goalsAgainst = isHome ? fixture.goals.away : fixture.goals.home
  const opponent = isHome ? fixture.away : fixture.home

  let result = 'D'
  let resultColor = 'bg-yellow-400'
  if (goalsFor != null && goalsAgainst != null) {
    if (goalsFor > goalsAgainst) {
      result = 'W'
      resultColor = 'bg-green-500'
    } else if (goalsFor < goalsAgainst) {
      result = 'L'
      resultColor = 'bg-red-500'
    }
  }

  const fDate = new Date(fixture.date)

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <span
        className={`w-6 h-6 rounded-full ${resultColor} text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0`}
      >
        {result}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">
            {isHome ? 'H' : 'A'}
          </span>
          {opponent.logo && (
            <div className="w-4 h-4 relative flex-shrink-0">
              <Image
                src={opponent.logo}
                alt={opponent.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          <span className="text-[12px] font-medium text-gray-900 truncate">
            {opponent.name}
          </span>
        </div>
      </div>
      <span className="text-[13px] font-bold text-gray-900 flex-shrink-0">
        {goalsFor ?? '-'}-{goalsAgainst ?? '-'}
      </span>
      <span className="text-[10px] text-gray-400 w-14 text-right flex-shrink-0">
        {fDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
      </span>
    </div>
  )
}

function PlayerCard({ player }: { player: AnyData }) {
  const posLabel = POSITION_LABELS[player.position] || player.position
  const posColor = POSITION_COLORS[player.position] || 'bg-gray-100 text-gray-600'

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-[#EFF6FF] transition-colors">
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
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${posColor}`}>
            {posLabel}
          </span>
          <span className="text-[10px] text-gray-400">
            {player.nationality} &middot; {player.age}
          </span>
        </div>
      </div>
      <div className="text-right flex-shrink-0 space-y-0.5">
        <p className="text-[11px] font-bold text-gray-900">
          {player.goals}G {player.assists}A
        </p>
        <div className="flex items-center gap-1 justify-end">
          {player.rating && (
            <span className="text-[10px] font-semibold text-[#2B7FFF]">{player.rating}</span>
          )}
          <span className="text-[10px] text-gray-400">{player.appearances} apps</span>
        </div>
      </div>
    </div>
  )
}

export default function TeamClient() {
  const params = useParams()
  const teamId = params.id as string

  const [data, setData] = useState<AnyData>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!teamId) {
      setError('No team specified')
      setLoading(false)
      return
    }
    fetch(`/api/sports-hub/team/${teamId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Failed to load team data'))
      .finally(() => setLoading(false))
  }, [teamId])

  if (loading) {
    return (
      <div className="py-20 max-w-[1100px] mx-auto px-4">
        <div className="animate-pulse space-y-6">
          <div className="bg-[#0F172A] rounded-2xl p-10 flex items-center gap-6">
            <div className="w-20 h-20 bg-gray-700 rounded-full" />
            <div>
              <div className="h-6 bg-gray-700 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-700 rounded w-32" />
            </div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6">
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-[24px] font-bold text-gray-900 mb-2">
          {error || 'Team data not available'}
        </h1>
        <Link href="/sports-hub" className="text-[#2B7FFF] font-semibold hover:underline">
          &larr; Back to Sports Hub
        </Link>
      </div>
    )
  }

  const { team, squad, fixtures, injuries } = data

  const positionOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']
  const squadSections = positionOrder
    .filter((pos) => squad[pos]?.length > 0)
    .map((pos) => ({ position: pos, players: squad[pos] }))

  return (
    <div>
      {/* Team Header */}
      <section className="bg-[#0F172A] pt-10 pb-12 px-4">
        <div className="max-w-[1100px] mx-auto">
          <Link
            href="/sports-hub"
            className="text-[13px] text-[#93C5FD] hover:text-white transition-colors mb-4 inline-block"
          >
            &larr; Sports Hub
          </Link>
          <div className="flex items-center gap-5">
            {team?.logo && (
              <div className="w-16 h-16 md:w-20 md:h-20 relative flex-shrink-0">
                <Image
                  src={team.logo}
                  alt={team.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div>
              <h1 className="text-[28px] md:text-[36px] font-extrabold text-white">
                {team?.name}
              </h1>
              <div className="flex flex-wrap gap-3 mt-1">
                {team?.country && (
                  <span className="text-[12px] text-[#93C5FD]">{team.country}</span>
                )}
                {team?.founded && (
                  <span className="text-[12px] text-gray-400">
                    Est. {team.founded}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Venue */}
          {team?.venue?.name && (
            <div className="mt-6 bg-white/5 rounded-xl p-4 flex items-center gap-4">
              {team.venue.image && (
                <div className="w-24 h-16 relative rounded-lg overflow-hidden flex-shrink-0 hidden md:block">
                  <Image
                    src={team.venue.image}
                    alt={team.venue.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div>
                <p className="text-[13px] font-semibold text-white">{team.venue.name}</p>
                <p className="text-[11px] text-gray-400">
                  {team.venue.city}
                  {team.venue.capacity && ` \u00B7 Capacity: ${team.venue.capacity.toLocaleString()}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Squad */}
            {squadSections.map(({ position, players }) => (
              <div key={position} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${POSITION_COLORS[position] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {POSITION_LABELS[position] || position}
                  </span>
                  <h3 className="text-[14px] font-bold text-gray-900">{position}s</h3>
                  <span className="text-[11px] text-gray-400">({players.length})</span>
                </div>
                <div className="p-4 space-y-2">
                  {players.map((p: AnyData) => (
                    <PlayerCard key={p.id} player={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Fixtures */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-[14px] font-bold text-gray-900">최근 경기</h3>
              </div>
              <div className="px-5 py-2">
                {fixtures.length > 0 ? (
                  fixtures.map((f: AnyData) => (
                    <FixtureResult
                      key={f.id}
                      fixture={f}
                      teamId={Number(teamId)}
                    />
                  ))
                ) : (
                  <p className="py-4 text-center text-[13px] text-gray-400">
                    최근 경기가 없습니다.
                  </p>
                )}
              </div>
            </div>

            {/* Injuries */}
            {injuries.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-[14px] font-bold text-gray-900">부상 선수</h3>
                </div>
                <div className="p-4 space-y-2">
                  {injuries.map((inj: AnyData, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-50"
                    >
                      {inj.player?.photo && (
                        <div className="w-7 h-7 relative rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={inj.player.photo}
                            alt={inj.player.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-900 truncate">
                          {inj.player?.name}
                        </p>
                        <p className="text-[9px] text-red-500">
                          {inj.player?.reason || inj.player?.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
