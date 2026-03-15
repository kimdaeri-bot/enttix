'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { useTranslations } from 'next-intl';

/* ─── LTD EVENT TYPE ────────────────────────────────────────── */
interface LTDEvent {
  EventId: number;
  Name: string;
  TagLine: string;
  MainImageUrl: string;
  RunningTime: string;
  EventMinimumPrice: number;
  AgeRating: number;
  EndDate: string;
  StartDate: string;
  EventType: number;
  VenueId?: number;
  VenueName?: string;
}

/* ─── TOP 15 RANKING (사장님 큐레이션) ──────────────────────── */
const TOP_15_NAMES = [
  'The Lion King',
  'The Phantom of the Opera',
  'Les Misérables',
  'Hamilton',
  'Wicked',
  'Mamma Mia!',
  'Moulin Rouge! The Musical',
  'The Book of Mormon',
  'Matilda The Musical',
  'Back to the Future The Musical',
  'MJ The Musical',
  'Six',
  'Hadestown',
  'The Devil Wears Prada',
  'Harry Potter and the Cursed Child',
];

// 이름 부분 매칭 (대소문자 무시, LTD 이름이 약간 달라도 OK)
function getTop15Rank(eventName: string): number {
  const lower = eventName.toLowerCase();
  const idx = TOP_15_NAMES.findIndex(top =>
    lower.includes(top.toLowerCase()) || top.toLowerCase().includes(lower.replace(/^(disney's|the new |cameron mackintosh's )/i, ''))
  );
  return idx; // -1이면 TOP15 아님
}

/* ─── CONSTANTS ─────────────────────────────────────────────── */
const HERO_PHOTO = 'photo-1558618666-fcd25c85cd64'; // West End theatre
const FALLBACK_PHOTO = 'photo-1513635269975-59663e0ac1ad'; // London

const LTD_CATEGORIES = [
  { label: 'All',     value: 0, icon: '🎭' },
  { label: 'Musical', value: 1, icon: '🎵' },
  { label: 'Play',    value: 2, icon: '📖' },
  { label: 'Dance',   value: 3, icon: '💃' },
  { label: 'Opera',   value: 4, icon: '🎼' },
  { label: 'Ballet',  value: 5, icon: '🩰' },
  { label: 'Circus',  value: 6, icon: '🎪' },
];

const EVENT_TYPE_LABELS: Record<number, string> = {
  1: 'Musical', 2: 'Play', 3: 'Dance', 4: 'Opera', 5: 'Ballet', 6: 'Circus',
};

const EVENT_TYPE_COLORS: Record<number, string> = {
  1: 'bg-purple-600', 2: 'bg-blue-600', 3: 'bg-pink-500',
  4: 'bg-red-600',    5: 'bg-indigo-500', 6: 'bg-orange-500',
};

const THEATRE_IMAGES: Record<string, string> = {
  'Lyceum Theatre':            'photo-1503095396549-807759245b35',
  'Palace Theatre':            'photo-1578662996442-48f60103fc96',
  'Victoria Palace Theatre':   'photo-1507003211169-0a1dd7228f2d',
  'Dominion Theatre':          'photo-1514306191717-452ec28c7814',
  'Cambridge Theatre':         'photo-1516450360452-9312f5e86fc7',
  default:                     'photo-1558618666-fcd25c85cd64',
};

const AUDIENCE_CHIPS = [
  { icon: '👫', label: 'Couples' },
  { icon: '👨‍👩‍👧', label: 'Families' },
  { icon: '🧍', label: 'Solo' },
  { icon: '👥', label: 'Friends' },
  { icon: '🎒', label: 'Backpackers' },
];

type SortKey = 'popular' | 'price_asc' | 'price_desc';

/* ─── SKELETON ───────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse mt-2" />
      </div>
    </div>
  );
}

/* ─── TOP 10 CARD ─────────────────────────────────────────────── */
function Top10Card({ ev, index }: { ev: LTDEvent; index: number }) {
  return (
    <Link
      href={`/musical/event/${ev.EventId}`}
      className="group flex-shrink-0 w-[260px] rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {ev.MainImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ev.MainImageUrl}
            alt={ev.Name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🎭</div>
        )}
        {/* Number badge */}
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-[#2B7FFF] text-white font-extrabold text-[15px] flex items-center justify-center shadow-md">
          {index + 1}
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-[13px] font-semibold text-[#0F172A] line-clamp-2 mb-1.5 leading-snug">
          {ev.Name}
        </h3>
        <span className="text-[#2B7FFF] text-[12px]">★ Official LTD Partner</span>
        {ev.EventMinimumPrice > 0 && (
          <p className="text-[13px] font-bold text-[#0F172A] mt-1">From £{ev.EventMinimumPrice}</p>
        )}
      </div>
    </Link>
  );
}

/* ─── EVENT CARD ─────────────────────────────────────────────── */
function EventCard({ ev }: { ev: LTDEvent }) {
  const endDate = ev.EndDate ? new Date(ev.EndDate) : null;
  const isEnding = endDate && endDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
  const typeLabel = EVENT_TYPE_LABELS[ev.EventType] || 'Show';
  const typeBg = EVENT_TYPE_COLORS[ev.EventType] || 'bg-[#0F172A]';

  return (
    <Link
      href={`/musical/event/${ev.EventId}`}
      className="group cursor-pointer rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {ev.MainImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ev.MainImageUrl}
            alt={ev.Name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🎭</div>
        )}
        {/* EventType badge (Bestseller position) */}
        <span className={`absolute top-2 left-2 ${typeBg} text-white text-[11px] font-bold px-2 py-0.5 rounded`}>
          {typeLabel}
        </span>
        {/* Ending Soon badge (Skip Line position) */}
        {isEnding && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded">
            Ending Soon
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-[14px] font-semibold text-[#0F172A] line-clamp-2 mb-1.5 leading-snug flex-1">
          {ev.Name}
        </h3>
        {/* LTD Partner (별점 대신) */}
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[#2B7FFF] text-[12px]">★ Official LTD Partner</span>
        </div>
        {ev.RunningTime && (
          <p className="text-[12px] text-[#64748B] mb-1.5">⏱ {ev.RunningTime}</p>
        )}
        {ev.EventMinimumPrice > 0 && (
          <p className="text-[15px] font-bold text-[#0F172A] mt-auto">From £{ev.EventMinimumPrice}</p>
        )}
      </div>
    </Link>
  );
}

/* ─── THEATRE CARD ───────────────────────────────────────────── */
function TheatreCard({
  name,
  count,
}: {
  name: string;
  count: number;
}) {
  const photoId = THEATRE_IMAGES[name] ?? THEATRE_IMAGES.default;
  const imgUrl = `https://images.unsplash.com/${photoId}?w=400&h=300&fit=crop`;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image src={imgUrl} alt={name} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 text-white">
          <p className="text-[13px] font-bold leading-tight line-clamp-2">{name}</p>
          <p className="text-[11px] text-white/75">
            {count} show{count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function MusicalListClient({
  slug,
  displayName,
  eventType,
}: {
  slug: string;
  displayName: string;
  eventType: number | null;
}) {
  const t = useTranslations('musical');
  const [events, setEvents] = useState<LTDEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(24);
  const [sort, setSort] = useState<SortKey>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number>(eventType ?? 0);
  const [isDragging, setIsDragging] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);
  const sliderRef  = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });
  const onDragStart = (clientX: number) => {
    if (!sliderRef.current) return;
    dragState.current = { isDragging: true, startX: clientX - sliderRef.current.offsetLeft, scrollLeft: sliderRef.current.scrollLeft };
    setIsDragging(true);
  };
  const onDragMove = (clientX: number) => {
    if (!dragState.current.isDragging || !sliderRef.current) return;
    const x = clientX - sliderRef.current.offsetLeft;
    sliderRef.current.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX);
  };
  const onDragEnd = () => { dragState.current.isDragging = false; setIsDragging(false); };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ltd/events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // 자동완성 후보 (inputValue 기준, 2글자 이상, 최대 7개)
  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.length < 2) return [];
    const q = inputValue.toLowerCase();
    return events
      .filter(ev => ev.Name.toLowerCase().includes(q))
      .slice(0, 7)
      .map(ev => ev.Name);
  }, [inputValue, events]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색 실행 (버튼 클릭 or Enter)
  function handleSearch() {
    setSearchQuery(inputValue);
    setShowSuggestions(false);
    setDisplayCount(24);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  // 자동완성 선택 → 즉시 검색 + 스크롤
  function handleSuggestionClick(name: string) {
    setInputValue(name);
    setSearchQuery(name);
    setShowSuggestions(false);
    setDisplayCount(24);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleClear() {
    setInputValue('');
    setSearchQuery('');
    setShowSuggestions(false);
    setDisplayCount(24);
  }

  /* ─── Filter & sort ─── */
  let filtered = events.filter(ev => {
    const matchesSearch =
      !searchQuery ||
      ev.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.TagLine || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeCategory === 0 || ev.EventType === activeCategory;
    return matchesSearch && matchesType;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'price_asc':  return (a.EventMinimumPrice || 0) - (b.EventMinimumPrice || 0);
      case 'price_desc': return (b.EventMinimumPrice || 0) - (a.EventMinimumPrice || 0);
      default: {
        // popular: TOP15 먼저 (순서대로), 그 다음 나머지 가격 높은 순
        const rankA = getTop15Rank(a.Name);
        const rankB = getTop15Rank(b.Name);
        if (rankA >= 0 && rankB >= 0) return rankA - rankB;     // 둘 다 TOP15 → 랭킹 순
        if (rankA >= 0) return -1;                               // a만 TOP15 → a 앞
        if (rankB >= 0) return 1;                                // b만 TOP15 → b 앞
        return (b.EventMinimumPrice || 0) - (a.EventMinimumPrice || 0); // 나머지 → 가격 높은 순
      }
    }
  });

  /* ─── Top 5 (TOP_15 기준 상위 5개) + 6-10위는 Six 앞에 배치 ─── */
  const { top5, extraTop } = (() => {
    const ranked: Array<{ ev: LTDEvent; rank: number }> = [];
    const unranked: LTDEvent[] = [];
    events.forEach(ev => {
      const rank = getTop15Rank(ev.Name);
      if (rank >= 0) ranked.push({ ev, rank });
      else unranked.push(ev);
    });
    ranked.sort((a, b) => a.rank - b.rank);
    const allTop = ranked.slice(0, 10).map(r => r.ev);
    if (allTop.length < 10) {
      const fill = unranked
        .sort((a, b) => (b.EventMinimumPrice || 0) - (a.EventMinimumPrice || 0))
        .slice(0, 10 - allTop.length);
      allTop.push(...fill);
    }
    return { top5: allTop.slice(0, 5), extraTop: allTop.slice(5) };
  })();
  // 하위 호환용 alias
  const top10 = top5;

  /* ─── Featured Theatres ─── */
  const theatreMap = new Map<string, number>();
  events.forEach(ev => {
    if (!ev.VenueName) return;
    theatreMap.set(ev.VenueName, (theatreMap.get(ev.VenueName) ?? 0) + 1);
  });
  const theatres = [...theatreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // top5 + extraTop에 표시된 쇼는 메인 그리드에서 제외 (중복 방지)
  const top10Ids = new Set([...top5, ...extraTop].map(ev => ev.EventId));
  const baseGridEvents = sorted.filter(ev => !top10Ids.has(ev.EventId));
  // Six 앞에 extraTop(6-10위) 삽입
  const sixIdx = baseGridEvents.findIndex(ev => ev.Name.toLowerCase().includes('six'));
  const insertAt = sixIdx >= 0 ? sixIdx : 0;
  const gridEvents = [
    ...baseGridEvents.slice(0, insertAt),
    ...extraTop,
    ...baseGridEvents.slice(insertAt),
  ];
  const displayed = gridEvents.slice(0, displayCount);
  const hasMore = displayed.length < gridEvents.length;

  const heroUrl = `https://images.unsplash.com/${HERO_PHOTO}?w=1600&h=800&fit=crop`;
  void displayName; // used by page.tsx (for breadcrumb/SEO), not displayed in this layout

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header hideSearch />

      {/* ─── 1. HERO ──────────────────────────────────────── */}
      <section className="relative h-[400px] flex flex-col justify-end pb-10">
        <Image
          src={heroUrl}
          alt="West End London"
          fill
          className="object-cover"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-[1280px] mx-auto px-4 w-full">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-white/60 mb-3">
            <Link href="/musical" className="hover:text-white transition-colors">Musicals</Link>
            <span>›</span>
            <span className="text-white/90">West End</span>
          </div>
          {/* H1 */}
          <h1 className="text-[42px] sm:text-[52px] font-extrabold text-white mb-2 leading-tight">
            West End Shows &amp; Musicals in London
          </h1>
          <p className="text-white/75 text-[15px] mb-6">
            {events.length > 0 ? `${events.length}+` : '100+'} Shows · Official LTD Partner · Book Online
          </p>
          {/* Search bar — attractions 동일 패턴 + 자동완성 */}
          <div ref={searchRef} className="relative w-full max-w-[600px]">
            <div className="flex items-center bg-white rounded-xl shadow-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#2B7FFF]">
              <svg className="ml-4 flex-shrink-0 text-[#94A3B8]"
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearch();
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
                placeholder={slug === 'london' ? 'Search London shows...' : 'Search Broadway shows...'}
                className="flex-1 px-3 py-3.5 text-[#0F172A] text-[15px] outline-none placeholder:text-[#94A3B8] bg-transparent"
              />
              {inputValue && (
                <button onClick={handleClear}
                  className="flex-shrink-0 w-6 h-6 mr-2 flex items-center justify-center rounded-full bg-[#E5E7EB] text-[#64748B] hover:bg-[#CBD5E1] text-[14px] leading-none">
                  ×
                </button>
              )}
              <button
                onClick={handleSearch}
                className="flex-shrink-0 m-1 sm:m-1.5 px-3 sm:px-5 py-2.5 rounded-lg bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white font-semibold transition-colors"
              >
                <svg className="sm:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <span className="hidden sm:inline text-[14px]">Search</span>
              </button>
            </div>

            {/* 자동완성 드롭다운 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden z-50">
                {suggestions.map((name, i) => (
                  <button
                    key={i}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSuggestionClick(name)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F1F5F9] transition-colors border-b border-[#F1F5F9] last:border-0"
                  >
                    <svg className="text-[#94A3B8] flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <span className="text-[14px] text-[#0F172A] line-clamp-1">{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 2. TOP 5 ────────────────────────────────────── */}
      {!loading && top5.length > 0 && (
        <section className="bg-white py-10 border-b border-[#E5E7EB]">
          <div className="max-w-[1280px] mx-auto px-4">
            <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-5">
              Top 5 West End Shows
            </h2>
            <div className="relative">
              {/* 왼쪽 화살표 */}
              <button
                onClick={() => { if (sliderRef.current) sliderRef.current.scrollBy({ left: -320, behavior: 'smooth' }); }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center hover:bg-[#F1F5F9] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <div
                ref={sliderRef}
                className={`flex gap-4 overflow-x-auto pb-3 scrollbar-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ WebkitOverflowScrolling: 'touch' }}
                onMouseDown={e => onDragStart(e.clientX)}
                onMouseMove={e => onDragMove(e.clientX)}
                onMouseUp={onDragEnd}
                onMouseLeave={onDragEnd}
                onTouchStart={e => onDragStart(e.touches[0].clientX)}
                onTouchMove={e => onDragMove(e.touches[0].clientX)}
                onTouchEnd={onDragEnd}
              >
                {top5.map((ev, i) => (
                  <Top10Card key={ev.EventId} ev={ev} index={i} />
                ))}
              </div>
              {/* 오른쪽 화살표 */}
              <button
                onClick={() => { if (sliderRef.current) sliderRef.current.scrollBy({ left: 320, behavior: 'smooth' }); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center hover:bg-[#F1F5F9] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─── 3. RECOMMENDED FOR ───────────────────────────── */}
      <section className="bg-white py-8 border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-5">
            West End shows recommended for
          </h2>
          <div className="flex flex-wrap gap-3">
            {AUDIENCE_CHIPS.map(chip => (
              <div
                key={chip.label}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#374151] text-[14px] font-semibold cursor-pointer hover:border-[#2B7FFF] hover:text-[#2B7FFF] transition-colors select-none"
              >
                <span className="text-[18px]">{chip.icon}</span>
                {chip.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. FILTER BAR (sticky) ────────────────────────── */}
      <div ref={resultsRef} className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4">
          {/* Category chips */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
            {LTD_CATEGORIES.map(cat => {
              const isActive = cat.value === activeCategory;
              return (
                <button
                  key={cat.value}
                  onClick={() => {
                    setActiveCategory(cat.value);
                    setDisplayCount(24);
                  }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-[#F1F5F9] text-[#374151] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Sort row */}
          <div className="flex items-center justify-between py-2 border-t border-[#F1F5F9]">
            <div>
              <h2 className="text-[16px] font-extrabold text-[#0F172A] inline mr-3">
                All West End Shows
              </h2>
              <span className="text-[13px] text-[#64748B]">
                {loading ? 'Loading…' : `${sorted.length} shows found`}
              </span>
            </div>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value as SortKey); setDisplayCount(24); }}
              className="text-[12px] font-semibold text-[#374151] border border-[#E5E7EB] rounded-lg px-3 py-1.5 outline-none focus:border-[#2B7FFF] cursor-pointer bg-white"
            >
              <option value="popular">{t('sort_popular')}</option>
              <option value="price_asc">{t('sort_price_asc')}</option>
              <option value="price_desc">{t('sort_price_desc')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 5. MAIN GRID ──────────────────────────────────── */}
      <main className="max-w-[1280px] mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : sorted.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayed.map(ev => (
                <EventCard key={ev.EventId} ev={ev} />
              ))}
            </div>

            {/* ─── 6. LOAD MORE ─────────────────────────── */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setDisplayCount(c => c + 24)}
                  className="px-10 py-3.5 rounded-xl bg-[#0F172A] text-white font-semibold text-[15px] hover:bg-[#1E293B] transition-colors"
                >
                  Load More Shows
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#94A3B8] text-[18px] mb-3">{t('no_shows')}</p>
            <button
              onClick={() => { setActiveCategory(0); setSearchQuery(''); setInputValue(''); }}
              className="text-[#2B7FFF] text-[14px] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ─── 7. FEATURED THEATRES ──────────────────────── */}
        {!loading && theatres.length > 0 && (
          <section className="mt-16">
            <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-5">
              Featured Theatres in London&apos;s West End
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {theatres.map(([name, count]) => (
                <TheatreCard key={name} name={name} count={count} />
              ))}
            </div>
          </section>
        )}

        {/* Fallback theatres when API has no VenueName data */}
        {!loading && theatres.length === 0 && (
          <section className="mt-16">
            <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-5">
              Featured Theatres in London&apos;s West End
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(THEATRE_IMAGES)
                .filter(([name]) => name !== 'default')
                .map(([name]) => (
                  <TheatreCard key={name} name={name} count={0} />
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
