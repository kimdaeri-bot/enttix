'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

// ── Types ────────────────────────────────────────────────────────
interface TxEvent {
  id: string;
  name: string;
  datetime?: string;
  venue?: { name?: string; city?: string };
  min_ticket_price?: number;
  startingPrice?: number;
  currency?: string;
  competition?: string;
  category_name?: string;
}

interface TmEvent {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  date: string;
  venueName: string;
  city: string;
  minPrice: number | null;
  currency: string;
}

interface LtdEvent {
  EventId: number;
  Name: string;
  TagLine?: string;
  ImageUrl?: string;
  EventMinimumPrice?: number;
}

type Source = 'tixstock' | 'ticketmaster' | 'ltd' | 'tbd';

interface Category {
  key: string;
  label: string;
  flag: string;
  source: Source;
  fetchKey?: string;
  competition?: string;
  league?: string;
  viewAllHref: string;
  sport?: string;
}

// ── Category config (사장님 지정 순서) ────────────────────────────
const CATEGORIES: Category[] = [
  { key: 'premier-league', label: 'Premier League',       flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', source: 'tixstock',     fetchKey: 'Football',    competition: 'Premier League',    viewAllHref: '/sport/football', sport: '⚽' },
  { key: 'serie-a',        label: 'Italian Serie A',      flag: '🇮🇹',          source: 'tixstock',     fetchKey: 'Football',    competition: 'Serie A',           viewAllHref: '/sport/football', sport: '⚽' },
  { key: 'la-liga',        label: 'Spanish La Liga',      flag: '🇪🇸',          source: 'tixstock',     fetchKey: 'Football',    competition: 'La Liga',           viewAllHref: '/sport/football', sport: '⚽' },
  { key: 'bundesliga',     label: 'Bundesliga',           flag: '🇩🇪',          source: 'tixstock',     fetchKey: 'Football',    competition: 'Bundesliga',        viewAllHref: '/sport/football', sport: '⚽' },
  { key: 'ucl',            label: 'UEFA Champions League',flag: '🏆',           source: 'tixstock',     fetchKey: 'Football',    competition: 'Champions League',  viewAllHref: '/sport/football', sport: '⚽' },
  { key: 'world-cup',      label: 'FIFA World Cup',       flag: '🌍',           source: 'tixstock',     fetchKey: 'Football',    competition: 'World Cup',         viewAllHref: '/sport/football', sport: '⚽' },
  { key: 'mls',            label: 'MLS',                  flag: '🇺🇸',          source: 'ticketmaster', league: 'mls',           viewAllHref: '/sport/football',   sport: '⚽' },
  { key: 'mlb',            label: 'MLB',                  flag: '⚾',           source: 'ticketmaster', league: 'mlb',           viewAllHref: '/sport/baseball',   sport: '⚾' },
  { key: 'nba',            label: 'NBA',                  flag: '🏀',           source: 'tixstock',     fetchKey: 'Basketball',  competition: 'NBA',               viewAllHref: '/sport/basketball', sport: '🏀' },
  { key: 'nfl',            label: 'NFL',                  flag: '🏈',           source: 'ticketmaster', league: 'nfl',           viewAllHref: '/sport/american-football', sport: '🏈' },
  { key: 'london-musical', label: 'London Musical',       flag: '🎭',           source: 'ltd',           viewAllHref: '/shows' },
  { key: 'broadway',       label: 'Broadway Musical',     flag: '🗽',           source: 'tbd',           viewAllHref: '/shows' },
];

// ── Source badge ──────────────────────────────────────────────────
function SourceBadge({ source }: { source: Source }) {
  if (source === 'tixstock')     return <span className="text-[10px] bg-[#1E3A5F] text-[#60A5FA] px-2 py-0.5 rounded-full font-semibold">Tixstock</span>;
  if (source === 'ticketmaster') return <span className="text-[10px] bg-[#1A3A1F] text-[#4ADE80] px-2 py-0.5 rounded-full font-semibold">Ticketmaster</span>;
  if (source === 'ltd')          return <span className="text-[10px] bg-[#2E1A5F] text-[#A78BFA] px-2 py-0.5 rounded-full font-semibold">LTD</span>;
  return null;
}

// ── Tixstock event card ───────────────────────────────────────────
function TxCard({ event, sport }: { event: TxEvent; sport?: string }) {
  const price = event.min_ticket_price || event.startingPrice;
  const date  = event.datetime ? new Date(event.datetime) : null;
  const venue = event.venue?.name || '';
  const city  = event.venue?.city || '';

  return (
    <Link href={`/event/${event.id}`}
      className="flex-none w-[190px] bg-[#1E293B] rounded-[12px] overflow-hidden hover:bg-[#263548] transition-colors group flex flex-col">
      <div className="h-[100px] bg-gradient-to-br from-[#0F172A] to-[#1E3A5F] flex items-center justify-center relative">
        <span className="text-[44px]">{sport || '⚽'}</span>
        {price ? (
          <span className="absolute bottom-2 right-2 bg-[#2B7FFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            from ${price}
          </span>
        ) : null}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-white text-[12px] font-semibold line-clamp-2 leading-snug">{event.name}</p>
        {date && <p className="text-[#94A3B8] text-[11px]">{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
        <p className="text-[#64748B] text-[10px] truncate">{venue}{city ? `, ${city}` : ''}</p>
      </div>
    </Link>
  );
}

// ── Ticketmaster event card ───────────────────────────────────────
function TmCard({ event }: { event: TmEvent }) {
  return (
    <a href={event.url} target="_blank" rel="noopener noreferrer"
      className="flex-none w-[190px] bg-[#1E293B] rounded-[12px] overflow-hidden hover:bg-[#263548] transition-colors flex flex-col">
      <div className="h-[100px] relative overflow-hidden bg-[#0F172A]">
        {event.imageUrl
          ? <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-[40px]">🎟️</div>}
        <span className="absolute top-2 right-2 bg-black/70 text-[#4ADE80] text-[9px] font-bold px-1.5 py-0.5 rounded">↗ TM</span>
        {event.minPrice && (
          <span className="absolute bottom-2 right-2 bg-[#2B7FFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            from ${event.minPrice}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-white text-[12px] font-semibold line-clamp-2 leading-snug">{event.name}</p>
        <p className="text-[#94A3B8] text-[11px]">{event.date}</p>
        <p className="text-[#64748B] text-[10px] truncate">{event.venueName}{event.city ? `, ${event.city}` : ''}</p>
      </div>
    </a>
  );
}

// ── LTD show card ─────────────────────────────────────────────────
function LtdCard({ show }: { show: LtdEvent }) {
  return (
    <Link href={`/musical/event/${show.EventId}`}
      className="flex-none w-[150px] bg-[#1E293B] rounded-[12px] overflow-hidden hover:bg-[#263548] transition-colors flex flex-col">
      <div className="h-[200px] relative overflow-hidden bg-[#1E0A3C]">
        {show.ImageUrl
          ? <img src={show.ImageUrl} alt={show.Name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-[44px]">🎭</div>}
        {show.EventMinimumPrice ? (
          <span className="absolute bottom-2 right-2 bg-[#7C3AED] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            from £{show.EventMinimumPrice}
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <p className="text-white text-[12px] font-semibold line-clamp-2 leading-snug">{show.Name}</p>
        {show.TagLine && <p className="text-[#94A3B8] text-[10px] line-clamp-1 mt-0.5">{show.TagLine}</p>}
      </div>
    </Link>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex-none w-[190px] bg-[#1E293B] rounded-[12px] overflow-hidden animate-pulse">
      <div className="h-[100px] bg-[#263548]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#263548] rounded w-full" />
        <div className="h-3 bg-[#263548] rounded w-3/4" />
        <div className="h-2 bg-[#1E293B] rounded w-1/2" />
      </div>
    </div>
  );
}

// ── Popular Section ───────────────────────────────────────────────
function PopularSection({
  cat, txFootball, txBasketball, tmData, ltdShows, loading,
}: {
  cat: Category;
  txFootball: TxEvent[];
  txBasketball: TxEvent[];
  tmData: Record<string, TmEvent[]>;
  ltdShows: LtdEvent[];
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 이벤트 결정
  let txEvents: TxEvent[] = [];
  let tmEvents: TmEvent[] = [];
  let ltdEvents: LtdEvent[] = [];

  if (cat.source === 'tixstock') {
    const pool = cat.fetchKey === 'Football' ? txFootball : txBasketball;
    if (cat.competition && pool.length > 0) {
      const kw = cat.competition.toLowerCase();
      const filtered = pool.filter(e =>
        (e.competition || '').toLowerCase().includes(kw) ||
        e.name.toLowerCase().includes(kw)
      );
      txEvents = filtered.length > 0 ? filtered : pool;
    } else {
      txEvents = pool;
    }
    txEvents = txEvents.slice(0, 8);
  } else if (cat.source === 'ticketmaster' && cat.league) {
    tmEvents = (tmData[cat.league] || []).slice(0, 8);
  } else if (cat.source === 'ltd') {
    ltdEvents = ltdShows.slice(0, 10);
  }

  const total = txEvents.length + tmEvents.length + ltdEvents.length;
  const isEmpty = !loading && total === 0;
  const isTbd = cat.source === 'tbd';

  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-10 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-xl">{cat.flag}</span>
          <h2 className="text-white text-[18px] md:text-[22px] font-bold">{cat.label}</h2>
          <SourceBadge source={cat.source} />
        </div>
        <Link href={cat.viewAllHref} className="text-[#2B7FFF] text-[13px] font-semibold hover:underline flex items-center gap-1">
          View All <span>→</span>
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-10 pb-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : isTbd ? (
          <div className="flex-none flex flex-col items-center justify-center w-full py-10 text-[#475569]">
            <span className="text-4xl mb-3">🚧</span>
            <p className="text-[14px]">Broadway content coming soon</p>
          </div>
        ) : isEmpty ? (
          <div className="flex-none flex flex-col items-center justify-center w-full py-10 text-[#475569]">
            <span className="text-4xl mb-3">📅</span>
            <p className="text-[14px]">No upcoming events</p>
          </div>
        ) : (
          <>
            {txEvents.map(e => <TxCard key={e.id} event={e} sport={cat.sport} />)}
            {tmEvents.map(e => <TmCard key={e.id} event={e} />)}
            {ltdEvents.map(e => <LtdCard key={e.EventId} show={e} />)}
            {/* View all card */}
            <Link href={cat.viewAllHref}
              className="flex-none w-[120px] bg-[#1E293B] rounded-[12px] border border-dashed border-[#334155] flex flex-col items-center justify-center gap-2 hover:bg-[#263548] transition-colors">
              <span className="text-[#2B7FFF] text-2xl">→</span>
              <span className="text-[#2B7FFF] text-[11px] font-semibold">View All</span>
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function PopularClient() {
  const [txFootball,   setTxFootball]   = useState<TxEvent[]>([]);
  const [txBasketball, setTxBasketball] = useState<TxEvent[]>([]);
  const [tmData,       setTmData]       = useState<Record<string, TmEvent[]>>({});
  const [ltdShows,     setLtdShows]     = useState<LtdEvent[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/tixstock/feed?category_name=Football&size=50').then(r => r.json()),
      fetch('/api/tixstock/feed?category_name=Basketball&size=20').then(r => r.json()),
      fetch('/api/ticketmaster/events?tab=sports&countryCode=US&league=mls&size=8').then(r => r.json()),
      fetch('/api/ticketmaster/events?tab=sports&countryCode=US&league=mlb&size=8').then(r => r.json()),
      fetch('/api/ticketmaster/events?tab=sports&countryCode=US&league=nfl&size=8').then(r => r.json()),
      fetch('/api/ltd/events').then(r => r.json()),
    ]).then(([football, basketball, mls, mlb, nfl, ltd]) => {
      if (football.status   === 'fulfilled') setTxFootball(football.value?.data   || []);
      if (basketball.status === 'fulfilled') setTxBasketball(basketball.value?.data || []);

      const tm: Record<string, TmEvent[]> = {};
      if (mls.status === 'fulfilled') tm.mls = mls.value?.events || [];
      if (mlb.status === 'fulfilled') tm.mlb = mlb.value?.events || [];
      if (nfl.status === 'fulfilled') tm.nfl = nfl.value?.events || [];
      setTmData(tm);

      if (ltd.status === 'fulfilled') {
        const d = ltd.value;
        setLtdShows(Array.isArray(d) ? d : d?.events || []);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Header />

      {/* Hero */}
      <div className="px-4 md:px-10 pt-10 pb-8 max-w-[1280px] mx-auto">
        <p className="text-[#64748B] text-[13px] uppercase tracking-widest mb-2">Trending Now</p>
        <h1 className="text-white text-[40px] md:text-[52px] font-extrabold tracking-tight leading-none">
          🔥 Popular
        </h1>
        <p className="text-[#94A3B8] text-[16px] mt-3">Top events in sports, musicals &amp; entertainment.</p>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#1E293B] mb-8" />

      {/* Sections */}
      <div className="pb-24">
        {CATEGORIES.map(cat => (
          <PopularSection
            key={cat.key}
            cat={cat}
            txFootball={txFootball}
            txBasketball={txBasketball}
            tmData={tmData}
            ltdShows={ltdShows}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}
