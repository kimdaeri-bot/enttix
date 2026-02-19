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
];

export default function TestSeatMap() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <h1 className="text-2xl font-bold mb-2 text-[#0F172A]">Seat Map Test</h1>
      <p className="text-[#64748B] text-sm mb-6">Arsenal FC — Emirates Stadium</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        {/* Emirates Stadium */}
        <div>
          <h2 className="font-semibold text-[14px] text-[#374151] mb-2">Emirates Stadium (Arsenal)</h2>
          <SeatMap
            venueName="Emirates Stadium"
            sections={DEMO_SECTIONS}
            selectedSection={selected}
            onSectionClick={setSelected}
          />
          {selected && (
            <p className="mt-3 text-sm text-[#2B7FFF] font-medium">Selected: {selected}</p>
          )}
        </div>

        {/* Etihad Stadium */}
        <div>
          <h2 className="font-semibold text-[14px] text-[#374151] mb-2">Etihad Stadium (Man City)</h2>
          <SeatMap
            venueName="Etihad Stadium"
            sections={DEMO_SECTIONS}
            selectedSection={selected}
            onSectionClick={setSelected}
          />
        </div>
      </div>
    </div>
  );
}
