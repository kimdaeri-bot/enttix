'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface LTDEvent {
  EventId: number;
  Name: string;
  TagLine: string;
  MainImageUrl: string;
  DetailImageUrl: string;
  RunningTime: string;
  EventMinimumPrice: number;
  AgeRating: number;
  EndDate: string;
  StartDate: string;
  EventType: number;
}

const EVENT_TYPE_LABELS: Record<number, string> = {
  1: '뮤지컬', 2: '연극', 3: '댄스', 4: '오페라', 5: '발레', 6: '서커스',
};

const EVENT_TYPE_COLORS: Record<number, string> = {
  1: 'bg-purple-600', 2: 'bg-blue-600', 3: 'bg-pink-500',
  4: 'bg-red-600', 5: 'bg-indigo-500', 6: 'bg-orange-500',
};

/* 카테고리 필터 탭 (모든 타입) */
const FILTER_TABS = [
  { label: '전체', value: 0 },
  { label: '뮤지컬', value: 1 },
  { label: '연극', value: 2 },
  { label: '댄스', value: 3 },
  { label: '오페라', value: 4 },
  { label: '발레', value: 5 },
  { label: '서커스', value: 6 },
];

export default function MusicalListClient({
  slug,
  displayName,
  eventType,       // null = all, number = specific type
}: {
  slug: string;
  displayName: string;
  eventType: number | null;
}) {
  const [events, setEvents] = useState<LTDEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<number>(eventType ?? 0);

  /* ─── Load events ─── */
  useEffect(() => {
    setLoading(true);
    // If slug has a specific type, fetch only that type (server-side filter)
    // If it's "west-end" or unspecified, fetch all
    const typeParam = eventType !== null ? `?type=${eventType}` : '';
    fetch(`/api/ltd/events${typeParam}`)
      .then(r => r.json())
      .then(d => setEvents(d.events || []))
      .finally(() => setLoading(false));
  }, [eventType]);

  /* ─── Client-side filter (search + type tab) ─── */
  const filtered = events.filter(e => {
    const matchesType = activeType === 0 ? true : e.EventType === activeType;
    const q = search.toLowerCase();
    const matchesSearch = !q
      || e.Name.toLowerCase().includes(q)
      || (e.TagLine || '').toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  /* Show type tabs only when showing all (west-end) */
  const showTypeTabs = eventType === null;

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]">
        <Header hideSearch />
        {/* Hero */}
        <div className="max-w-[1280px] mx-auto px-4 pt-10 pb-14">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold text-[rgba(219,234,254,0.5)] tracking-[1px]">LONDON WEST END</span>
          </div>
          <h1 className="text-[36px] md:text-[48px] font-extrabold text-white leading-tight mb-2">
            🎭 {displayName}
          </h1>
          <p className="text-[16px] text-[#DBEAFE] opacity-70">
            {filtered.length}개 공연 · London Theatre Direct 공식 파트너
          </p>
          {/* Search */}
          <div className="mt-6 max-w-[500px]">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                type="text"
                placeholder="공연명 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#2B7FFF] focus:bg-white/15 transition-all text-[14px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Category filter tabs (West End only) ── */}
      {showTypeTabs && (
        <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40 shadow-sm">
          <div className="max-w-[1280px] mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveType(tab.value)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                    activeType === tab.value
                      ? 'bg-[#2B7FFF] text-white shadow-sm'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#374151]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#94A3B8]">검색 결과가 없습니다.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(ev => {
              const endDate = ev.EndDate ? new Date(ev.EndDate) : null;
              const isEnding = endDate && (endDate.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;
              const typeLabel = EVENT_TYPE_LABELS[ev.EventType] || '공연';
              const typeBg = EVENT_TYPE_COLORS[ev.EventType] || 'bg-[#0F172A]';

              return (
                <Link
                  key={ev.EventId}
                  href={`/musical/event/${ev.EventId}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E5E7EB] hover:shadow-lg hover:border-[#2B7FFF]/30 transition-all flex flex-col"
                >
                  {/* Image — 4:3 ratio */}
                  <div className="relative w-full overflow-hidden bg-[#1E293B]" style={{ aspectRatio: '4/3' }}>
                    {ev.MainImageUrl ? (
                      <img
                        src={ev.MainImageUrl}
                        alt={ev.Name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1E293B/94A3B8?text=%F0%9F%8E%AD';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🎭</div>
                    )}
                    {/* Type badge */}
                    <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                      <span className={`text-[10px] font-bold ${typeBg} text-white px-2 py-0.5 rounded-full`}>{typeLabel}</span>
                      {isEnding && (
                        <span className="text-[10px] font-bold bg-[#EF4444] text-white px-2 py-0.5 rounded-full">마감임박</span>
                      )}
                    </div>
                    {/* Price overlay at bottom */}
                    {ev.EventMinimumPrice > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3">
                        <p className="text-white font-bold text-[14px]">From £{ev.EventMinimumPrice}</p>
                        {ev.RunningTime && (
                          <p className="text-white/70 text-[11px]">⏱ {ev.RunningTime}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title + CTA */}
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-[#0F172A] text-[13px] leading-snug mb-1 group-hover:text-[#2B7FFF] transition-colors line-clamp-2 flex-1">
                      {ev.Name}
                    </h3>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#94A3B8] line-clamp-1 flex-1">
                        {ev.TagLine ? ev.TagLine.substring(0, 30) + (ev.TagLine.length > 30 ? '…' : '') : ''}
                      </span>
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F1F5F9] group-hover:bg-[#2B7FFF] flex items-center justify-center transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#94A3B8] group-hover:text-white transition-colors">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
