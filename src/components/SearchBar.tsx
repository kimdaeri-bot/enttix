'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (date) params.set('date', date);
    if (query.trim()) params.set('q', query.trim());
    router.push(`/all-tickets?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="bg-white rounded-full shadow-xl flex items-center px-2 py-2">
      {/* Location */}
      <div className="flex items-center gap-2 px-4 py-2 flex-1 min-w-0">
        <span className="text-[#2B7FFF] text-[18px]">📍</span>
        <div>
          <label className="text-[10px] font-semibold text-[#9CA3AF] tracking-[0.5px] block">LOCATION</label>
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-[14px] text-[#171717] outline-none w-full placeholder:text-[#CBD5E1] bg-transparent"
          />
        </div>
      </div>
      <div className="w-px h-8 bg-[#E5E7EB]" />
      {/* Dates */}
      <div className="flex items-center gap-2 px-4 py-2 flex-1 min-w-0">
        <span className="text-[#2B7FFF] text-[18px]">📅</span>
        <div>
          <label className="text-[10px] font-semibold text-[#9CA3AF] tracking-[0.5px] block">DATES</label>
          <input
            type="date"
            placeholder="Date"
            value={date}
            onChange={e => setDate(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-[14px] text-[#171717] outline-none w-full placeholder:text-[#CBD5E1] bg-transparent"
          />
        </div>
      </div>
      <div className="w-px h-8 bg-[#E5E7EB]" />
      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-2 flex-1 min-w-0">
        <span className="text-[#9CA3AF] text-[18px]">🔍</span>
        <div>
          <label className="text-[10px] font-semibold text-[#9CA3AF] tracking-[0.5px] block">SEARCH</label>
          <input
            type="text"
            placeholder="Event..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-[14px] text-[#171717] outline-none w-full placeholder:text-[#CBD5E1] bg-transparent"
          />
        </div>
      </div>
      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white font-semibold text-[13px] px-6 py-2.5 rounded-full transition-colors active:scale-95 flex-shrink-0"
      >
        Search
      </button>
    </div>
  );
}
