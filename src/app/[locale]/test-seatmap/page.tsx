'use client';
import SeatMap from '@/components/SeatMap';
import { useState } from 'react';

const DEMO_SECTIONS = [
  { name: 'Block 1', minPrice: 45, count: 12 },
  { name: 'Block 2', minPrice: 55, count: 8 },
  { name: 'Block 3', minPrice: 60, count: 5 },
  { name: 'Block 4', minPrice: 80, count: 3 },
  { name: 'Block 5', minPrice: 90, count: 6 },
  { name: 'Block 6', minPrice: 120, count: 2 },
  { name: 'Block 7', minPrice: 150, count: 4 },
  { name: 'Block 8', minPrice: 200, count: 1 },
  { name: 'Clock End Lower', minPrice: 55, count: 10 },
  { name: 'Clock End Upper', minPrice: 70, count: 7 },
  { name: 'North Bank Lower', minPrice: 65, count: 9 },
  { name: 'North Bank Upper', minPrice: 85, count: 4 },
  { name: 'East Stand Lower', minPrice: 100, count: 3 },
  { name: 'East Stand Upper', minPrice: 130, count: 2 },
  { name: 'West Stand Lower', minPrice: 140, count: 5 },
  { name: 'Diamond Club', minPrice: 350, count: 1 },
  { name: 'North Stand Lower', minPrice: 55, count: 8 },
  { name: 'North Stand Upper', minPrice: 75, count: 6 },
  { name: 'South Stand Lower', minPrice: 60, count: 7 },
  { name: 'South Stand Upper', minPrice: 80, count: 4 },
  { name: 'East Stand', minPrice: 95, count: 5 },
  { name: 'West Stand', minPrice: 110, count: 3 },
  { name: 'Club Level', minPrice: 250, count: 2 },
  { name: 'General Admission', minPrice: 35, count: 20 },
];

const STADIUMS = [
  {
    key: 'emirates',
    venueName: 'Emirates Stadium',
    club: 'Arsenal FC',
    capacity: '60,704',
    location: 'Holloway, London',
  },
  {
    key: 'etihad',
    venueName: 'Etihad Stadium',
    club: 'Manchester City FC',
    capacity: '53,400',
    location: 'Manchester',
  },
  {
    key: 'generic',
    venueName: 'Generic Stadium',
    club: 'Generic / Fallback',
    capacity: '—',
    location: 'Any venue',
  },
];

export default function TestSeatMap() {
  const [selected, setSelected] = useState<Record<string, string | null>>({});

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold text-[#0F172A]">🏟️ Stadium Seat Map Test</h1>
          <p className="text-[#64748B] text-[14px] mt-1">구현된 모든 구장 SVG 맵 확인 페이지</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {STADIUMS.map(stadium => (
            <div key={stadium.key} className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm">
              {/* 구장 정보 */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-[18px] font-bold text-[#0F172A]">{stadium.venueName}</h2>
                  <p className="text-[13px] text-[#2B7FFF] font-semibold mt-0.5">{stadium.club}</p>
                  <div className="flex gap-3 mt-1.5 text-[12px] text-[#94A3B8]">
                    <span>📍 {stadium.location}</span>
                    <span>👥 {stadium.capacity}</span>
                  </div>
                </div>
                {selected[stadium.key] && (
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2B7FFF] text-[12px] font-semibold">
                      ✓ {selected[stadium.key]}
                    </span>
                  </div>
                )}
              </div>

              {/* 좌석 맵 */}
              <SeatMap
                venueName={stadium.venueName}
                sections={DEMO_SECTIONS}
                selectedSection={selected[stadium.key] ?? null}
                onSectionClick={(sec) =>
                  setSelected(prev => ({ ...prev, [stadium.key]: sec }))
                }
              />
            </div>
          ))}
        </div>

        <p className="text-center text-[12px] text-[#CBD5E1] mt-8">
          This is a test/preview page — not visible to end users
        </p>
      </div>
    </div>
  );
}
