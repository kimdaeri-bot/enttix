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

export default function MusicalListClient({ slug, displayName }: { slug: string; displayName: string }) {
  const [events, setEvents] = useState<LTDEvent[]>([]);
  const [filtered, setFiltered] = useState<LTDEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/ltd/events')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setFiltered(d.events || []); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(events); return; }
    const q = search.toLowerCase();
    setFiltered(events.filter(e =>
      e.Name.toLowerCase().includes(q) || (e.TagLine || '').toLowerCase().includes(q)
    ));
  }, [search, events]);

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
            {events.length}개 공연 · London Theatre Direct 공식 파트너
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

      <div className="max-w-[1280px] mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#94A3B8]">검색 결과가 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(ev => {
              const endDate = ev.EndDate ? new Date(ev.EndDate) : null;
              const isEnding = endDate && (endDate.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;
              const typeLabel = EVENT_TYPE_LABELS[ev.EventType] || '공연';

              return (
                <Link key={ev.EventId} href={`/musical/event/${ev.EventId}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E5E7EB] hover:shadow-lg hover:border-[#2B7FFF]/30 transition-all">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#F1F5F9]">
                    {ev.MainImageUrl ? (
                      <img
                        src={ev.MainImageUrl}
                        alt={ev.Name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🎭</div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="text-[10px] font-bold bg-[#0F172A] text-white px-2 py-0.5 rounded-full">{typeLabel}</span>
                      {isEnding && <span className="text-[10px] font-bold bg-[#EF4444] text-white px-2 py-0.5 rounded-full">마감임박</span>}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-[#0F172A] text-[15px] leading-snug mb-1 group-hover:text-[#2B7FFF] transition-colors line-clamp-2">{ev.Name}</h3>
                    {ev.TagLine && <p className="text-[#64748B] text-[12px] leading-snug line-clamp-2 mb-3">{ev.TagLine}</p>}
                    <div className="flex items-center justify-between">
                      <div>
                        {ev.EventMinimumPrice > 0 ? (
                          <p className="text-[#2B7FFF] font-bold text-[15px]">From £{ev.EventMinimumPrice}</p>
                        ) : (
                          <p className="text-[#94A3B8] text-[12px]">가격 문의</p>
                        )}
                        {ev.RunningTime && <p className="text-[#94A3B8] text-[11px] mt-0.5">⏱ {ev.RunningTime}</p>}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-[#F1F5F9] group-hover:bg-[#2B7FFF] flex items-center justify-center transition-colors flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#94A3B8] group-hover:text-white transition-colors"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
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
