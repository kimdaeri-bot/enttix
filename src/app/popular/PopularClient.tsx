'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────
interface TxEvent {
  id: string; name: string; datetime?: string;
  venue?: { name?: string; city?: string };
  min_ticket_price?: number; startingPrice?: number;
  currency?: string; competition?: string; category_name?: string;
}
interface TmEvent {
  id: string; name: string; url: string; imageUrl: string;
  date: string; time: string; venueName: string; city: string;
  country: string; minPrice: number | null; currency: string;
  genre: string; subGenre: string;
}
interface LtdEvent {
  EventId: number; Name: string; TagLine?: string;
  ImageUrl?: string; EventMinimumPrice?: number;
}

type Source = 'tixstock' | 'ticketmaster' | 'ltd' | 'tbd';
interface Category {
  key: string; label: string; flag: string; source: Source;
  fetchKey?: string; competition?: string; league?: string;
  viewAllHref: string; bgImg: string;
}

// ── Category images ────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  { key: 'all',           label: 'All',                  flag: '🔥', source: 'tixstock',    viewAllHref: '/popular', bgImg: '' },
  { key: 'premier-league',label: 'Premier League',       flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', source: 'tixstock',    fetchKey: 'Football',   competition: 'Premier League',   viewAllHref: '/sport/football', bgImg: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=200&fit=crop' },
  { key: 'serie-a',       label: 'Italian Serie A',      flag: '🇮🇹', source: 'tixstock',    fetchKey: 'Football',   competition: 'Serie A',          viewAllHref: '/sport/football', bgImg: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&h=200&fit=crop' },
  { key: 'la-liga',       label: 'Spanish La Liga',      flag: '🇪🇸', source: 'tixstock',    fetchKey: 'Football',   competition: 'La Liga',          viewAllHref: '/sport/football', bgImg: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=200&fit=crop' },
  { key: 'bundesliga',    label: 'Bundesliga',           flag: '🇩🇪', source: 'tixstock',    fetchKey: 'Football',   competition: 'Bundesliga',       viewAllHref: '/sport/football', bgImg: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=200&fit=crop' },
  { key: 'ucl',           label: 'Champions League',     flag: '🏆', source: 'tixstock',    fetchKey: 'Football',   competition: 'Champions League', viewAllHref: '/sport/football', bgImg: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=200&fit=crop' },
  { key: 'world-cup',     label: 'FIFA World Cup',       flag: '🌍', source: 'tixstock',    fetchKey: 'Football',   competition: 'World Cup',        viewAllHref: '/sport/football', bgImg: 'https://images.unsplash.com/photo-1540747913346-19212a4e6d27?w=800&h=200&fit=crop' },
  { key: 'mls',           label: 'MLS',                  flag: '🇺🇸', source: 'ticketmaster', league: 'mls',          viewAllHref: '/sport',          bgImg: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=200&fit=crop' },
  { key: 'mlb',           label: 'MLB',                  flag: '⚾', source: 'ticketmaster', league: 'mlb',          viewAllHref: '/sport',          bgImg: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=200&fit=crop' },
  { key: 'nba',           label: 'NBA',                  flag: '🏀', source: 'tixstock',    fetchKey: 'Basketball', competition: 'NBA',              viewAllHref: '/sport',          bgImg: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=200&fit=crop' },
  { key: 'nfl',           label: 'NFL',                  flag: '🏈', source: 'ticketmaster', league: 'nfl',          viewAllHref: '/sport',          bgImg: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=200&fit=crop' },
  { key: 'formula1',      label: 'Formula 1',            flag: '🏎️', source: 'tixstock',    fetchKey: 'Formula 1',  competition: 'Formula 1',        viewAllHref: '/sport/formula-1', bgImg: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=200&fit=crop' },
  { key: 'london-musical',label: 'London Musical',       flag: '🎭', source: 'ltd',          viewAllHref: '/shows',  bgImg: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=200&fit=crop' },
  { key: 'broadway',      label: 'Broadway Musical',     flag: '🗽', source: 'tbd',          viewAllHref: '/shows',  bgImg: 'https://images.unsplash.com/photo-1490157175177-71e8789e0f44?w=800&h=200&fit=crop' },
];

function formatDate(d: string) {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Tixstock card (Entertainment style) ──────────────────────────
function TxCard({ event, cat }: { event: TxEvent; cat: Category }) {
  const price = event.min_ticket_price || event.startingPrice;
  const date  = event.datetime ? new Date(event.datetime) : null;
  const venue = event.venue?.name || '';
  const city  = event.venue?.city || '';
  return (
    <Link href={`/event/${event.id}`}
      className="group bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:border-[#2B7FFF]/30 transition-all duration-200 flex flex-col flex-shrink-0 w-[240px] md:w-auto">
      <div className="relative aspect-[16/9] bg-[#E5E7EB] overflow-hidden flex-shrink-0">
        <img src={cat.bgImg || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=225&fit=crop'}
          alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm">{cat.flag} {cat.label}</span>
        </div>
        {price ? (
          <div className="absolute bottom-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-[#2B7FFF]">from ${price}</span>
          </div>
        ) : null}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[14px] font-bold text-[#171717] leading-[20px] mb-2 line-clamp-2 group-hover:text-[#2B7FFF] transition-colors">{event.name}</h3>
        <div className="flex flex-col gap-1 mb-3 flex-1">
          {date && (
            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="truncate">{[venue, city].filter(Boolean).join(', ') || 'TBA'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[14px] font-bold text-[#171717]">{price ? `From $${price}` : 'See prices'}</span>
          <span className="flex items-center gap-1 text-[12px] font-semibold text-[#2B7FFF] group-hover:gap-2 transition-all">
            Buy Tickets<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Ticketmaster card ─────────────────────────────────────────────
function TmCard({ event }: { event: TmEvent }) {
  const [imgErr, setImgErr] = useState(false);
  const sym = event.currency === 'GBP' ? '£' : event.currency === 'EUR' ? '€' : '$';
  return (
    <a href={event.url} target="_blank" rel="noopener noreferrer"
      className="group bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:border-[#2B7FFF]/30 transition-all duration-200 flex flex-col flex-shrink-0 w-[240px] md:w-auto">
      <div className="relative aspect-[16/9] bg-[#E5E7EB] overflow-hidden flex-shrink-0">
        {!imgErr && event.imageUrl
          ? <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgErr(true)} />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-4xl opacity-30">🏆</span></div>}
        {(event.subGenre || event.genre) && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm">{event.subGenre || event.genre}</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[14px] font-bold text-[#171717] leading-[20px] mb-2 line-clamp-2 group-hover:text-[#2B7FFF] transition-colors">{event.name}</h3>
        <div className="flex flex-col gap-1 mb-3 flex-1">
          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            {formatDate(event.date)}{event.time ? ` · ${event.time.slice(0,5)}` : ''}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="truncate">{[event.venueName, event.city].filter(Boolean).join(', ')}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[14px] font-bold text-[#171717]">{event.minPrice ? `From ${sym}${event.minPrice.toFixed(0)}` : 'See prices'}</span>
          <span className="flex items-center gap-1 text-[12px] font-semibold text-[#2B7FFF] group-hover:gap-2 transition-all">
            Buy Tickets<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </div>
      </div>
    </a>
  );
}

// ── LTD card (portrait) ───────────────────────────────────────────
function LtdCard({ show }: { show: LtdEvent }) {
  return (
    <Link href={`/musical/event/${show.EventId}`}
      className="group bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:border-[#7C3AED]/30 transition-all duration-200 flex flex-col flex-shrink-0 w-[160px] md:w-auto">
      <div className="relative aspect-[2/3] bg-[#E5E7EB] overflow-hidden flex-shrink-0">
        {show.ImageUrl
          ? <img src={show.ImageUrl} alt={show.Name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-4xl opacity-30">🎭</span></div>}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-[#7C3AED]/80">West End</span>
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-[13px] font-bold text-[#171717] line-clamp-2 leading-snug group-hover:text-[#7C3AED] transition-colors mb-1">{show.Name}</h3>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-[13px] font-bold text-[#171717]">{show.EventMinimumPrice ? `From £${show.EventMinimumPrice}` : 'See prices'}</span>
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[#7C3AED] group-hover:gap-1.5 transition-all">
            Book<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────
function SkeletonCard({ portrait = false }: { portrait?: boolean }) {
  return (
    <div className={`bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] animate-pulse flex-shrink-0 ${portrait ? 'w-[160px]' : 'w-[240px] md:w-auto'}`}>
      <div className={`bg-[#E5E7EB] ${portrait ? 'aspect-[2/3]' : 'aspect-[16/9]'}`} />
      <div className="p-4 space-y-2"><div className="h-3 bg-[#E5E7EB] rounded w-3/4" /><div className="h-3 bg-[#E5E7EB] rounded w-1/2" /></div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────
function PopularSection({ cat, txData, tmData, ltdShows, loading }: {
  cat: Category;
  txData: Record<string, TxEvent[]>;
  tmData: Record<string, TmEvent[]>;
  ltdShows: LtdEvent[];
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPortrait = cat.source === 'ltd';

  let txEvents: TxEvent[] = [];
  let tmEvents: TmEvent[] = [];
  let ltd: LtdEvent[] = [];

  if (cat.source === 'tixstock' && cat.fetchKey) {
    const pool = txData[cat.fetchKey] || [];
    if (cat.competition) {
      const kw = cat.competition.toLowerCase();
      const filtered = pool.filter(e => (e.competition||'').toLowerCase().includes(kw) || e.name.toLowerCase().includes(kw));
      txEvents = (filtered.length > 0 ? filtered : pool).slice(0, 8);
    } else { txEvents = pool.slice(0, 8); }
  } else if (cat.source === 'ticketmaster' && cat.league) {
    tmEvents = (tmData[cat.league] || []).slice(0, 8);
  } else if (cat.source === 'ltd') {
    ltd = ltdShows.slice(0, 10);
  }

  const total = txEvents.length + tmEvents.length + ltd.length;
  const isEmpty = !loading && total === 0;

  const sourceBadge = cat.source === 'tixstock'
    ? <span className="text-[10px] bg-[#DBEAFE] text-[#1D4ED8] px-2 py-0.5 rounded-full font-semibold">Tixstock</span>
    : cat.source === 'ticketmaster'
    ? <span className="text-[10px] bg-[#DCFCE7] text-[#166534] px-2 py-0.5 rounded-full font-semibold">Ticketmaster</span>
    : cat.source === 'ltd'
    ? <span className="text-[10px] bg-[#EDE9FE] text-[#6D28D9] px-2 py-0.5 rounded-full font-semibold">LTD</span>
    : null;

  return (
    <section id={cat.key} className="scroll-mt-20 mb-10">
      {/* Section header */}
      <div className="relative overflow-hidden rounded-t-[12px]">
        {cat.bgImg && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${cat.bgImg})` }} />}
        <div className="absolute inset-0 bg-[#0F172A]/80" />
        <div className="relative flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{cat.flag}</span>
            <h2 className="text-white text-[16px] font-bold">{cat.label}</h2>
            {sourceBadge}
          </div>
          <Link href={cat.viewAllHref} className="text-[#60A5FA] text-[12px] font-semibold hover:text-white transition-colors flex items-center gap-1">
            View All →
          </Link>
        </div>
      </div>

      {/* Cards horizontal scroll */}
      <div ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide p-4 bg-[#F8FAFC] rounded-b-[12px] border border-t-0 border-[#E5E7EB]">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} portrait={isPortrait} />)
        ) : cat.source === 'tbd' ? (
          <div className="flex-none flex flex-col items-center justify-center w-full py-8 text-[#9CA3AF]">
            <span className="text-3xl mb-2">🚧</span>
            <p className="text-[13px]">Broadway content coming soon</p>
          </div>
        ) : isEmpty ? (
          <div className="flex-none flex flex-col items-center justify-center w-full py-8 text-[#9CA3AF]">
            <span className="text-3xl mb-2">📅</span>
            <p className="text-[13px]">No upcoming events</p>
          </div>
        ) : (
          <>
            {txEvents.map(e => <TxCard key={e.id} event={e} cat={cat} />)}
            {tmEvents.map(e => <TmCard key={e.id} event={e} />)}
            {ltd.map(e => <LtdCard key={e.EventId} show={e} />)}
            <Link href={cat.viewAllHref}
              className="flex-none w-[100px] bg-white rounded-[16px] border border-dashed border-[#D1D5DB] flex flex-col items-center justify-center gap-2 hover:border-[#2B7FFF] hover:bg-[#EFF6FF] transition-colors">
              <span className="text-[#2B7FFF] text-xl">→</span>
              <span className="text-[#2B7FFF] text-[11px] font-semibold text-center px-2">View All</span>
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function PopularClient() {
  const [txData,      setTxData]      = useState<Record<string, TxEvent[]>>({});
  const [tmData,      setTmData]      = useState<Record<string, TmEvent[]>>({});
  const [ltdShows,    setLtdShows]    = useState<LtdEvent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeFilter,setActiveFilter]= useState('all');

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/tixstock/feed?category_name=Football&size=50').then(r => r.json()),
      fetch('/api/tixstock/feed?category_name=Basketball&size=20').then(r => r.json()),
      fetch('/api/tixstock/feed?category_name=Formula+1&size=20').then(r => r.json()),
      fetch('/api/ticketmaster/events?tab=sports&countryCode=US&league=mls&size=8').then(r => r.json()),
      fetch('/api/ticketmaster/events?tab=sports&countryCode=US&league=mlb&size=8').then(r => r.json()),
      fetch('/api/ticketmaster/events?tab=sports&countryCode=US&league=nfl&size=8').then(r => r.json()),
      fetch('/api/ltd/events').then(r => r.json()),
    ]).then(([football, basketball, formula1, mls, mlb, nfl, ltd]) => {
      const tx: Record<string, TxEvent[]> = {};
      if (football.status   === 'fulfilled') tx['Football']   = football.value?.data   || [];
      if (basketball.status === 'fulfilled') tx['Basketball'] = basketball.value?.data || [];
      if (formula1.status   === 'fulfilled') tx['Formula 1']  = formula1.value?.data   || [];
      setTxData(tx);
      const tm: Record<string, TmEvent[]> = {};
      if (mls.status === 'fulfilled') tm.mls = mls.value?.events || [];
      if (mlb.status === 'fulfilled') tm.mlb = mlb.value?.events || [];
      if (nfl.status === 'fulfilled') tm.nfl = nfl.value?.events || [];
      setTmData(tm);
      if (ltd.status === 'fulfilled') { const d = ltd.value; setLtdShows(Array.isArray(d) ? d : d?.events || []); }
      setLoading(false);
    });
  }, []);

  const displayCats = activeFilter === 'all'
    ? CATEGORIES.filter(c => c.key !== 'all')
    : CATEGORIES.filter(c => c.key === activeFilter);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Hero */}
      <div className="bg-[#0F172A]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 pt-10 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-bold text-[#F97316] tracking-[1.5px]">ENTTIX</span>
            <span className="text-[12px] text-[#475569]">·</span>
            <span className="text-[12px] text-[#475569]">Trending Events</span>
          </div>
          <h1 className="text-[32px] md:text-[48px] font-extrabold text-white tracking-[-1px] mb-2">🔥 Popular</h1>
          <p className="text-[14px] text-[#94A3B8] mb-6">Top events across sports, musicals &amp; entertainment worldwide</p>
        </div>

        {/* Category filter tabs */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setActiveFilter(cat.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold rounded-t-[10px] transition-colors ${activeFilter === cat.key ? 'bg-[#F5F7FA] text-[#171717]' : 'text-[#94A3B8] hover:text-white'}`}>
                <span>{cat.flag}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-filter bar */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setActiveFilter(cat.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all ${activeFilter === cat.key ? 'bg-[#2B7FFF] text-white shadow-sm' : 'bg-[#F1F5F9] text-[#374151] hover:bg-[#E2E8F0]'}`}>
                <span>{cat.flag}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8 pb-24">
        {displayCats.map(cat => (
          <PopularSection
            key={cat.key}
            cat={cat}
            txData={txData}
            tmData={tmData}
            ltdShows={ltdShows}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}
