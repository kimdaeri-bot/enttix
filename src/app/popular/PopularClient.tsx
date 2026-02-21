'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────
interface TxEvent {
  id: string; name: string; datetime?: string;
  venue?: { name?: string; city?: string };
  min_ticket_price?: number; startingPrice?: number;
  currency?: string; competition?: string;
  total_tickets?: number;
}
interface TmEvent {
  id: string; name: string; url: string; imageUrl: string;
  date: string; time: string; venueName: string; city: string;
  minPrice: number | null; currency: string;
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
  viewAllHref: string; bgImg: string; badgeColor?: string;
}

const CATEGORIES: Category[] = [
  { key: 'all',            label: 'All',                flag: '🔥', source: 'tixstock',    viewAllHref: '/popular',         bgImg: '' },
  { key: 'premier-league', label: 'Premier League',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', source: 'tixstock',    fetchKey: 'Football',   competition: 'Premier League',   viewAllHref: '/sport/football',      bgImg: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&h=400&fit=crop', badgeColor: '#3B82F6' },
  { key: 'serie-a',        label: 'Italian Serie A',    flag: '🇮🇹', source: 'tixstock',    fetchKey: 'Football',   competition: 'Serie A',          viewAllHref: '/sport/football',      bgImg: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&h=400&fit=crop', badgeColor: '#3B82F6' },
  { key: 'la-liga',        label: 'Spanish La Liga',    flag: '🇪🇸', source: 'tixstock',    fetchKey: 'Football',   competition: 'La Liga',          viewAllHref: '/sport/football',      bgImg: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&h=400&fit=crop', badgeColor: '#3B82F6' },
  { key: 'bundesliga',     label: 'Bundesliga',         flag: '🇩🇪', source: 'tixstock',    fetchKey: 'Football',   competition: 'Bundesliga',       viewAllHref: '/sport/football',      bgImg: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop', badgeColor: '#3B82F6' },
  { key: 'ucl',            label: 'Champions League',   flag: '🏆', source: 'tixstock',    fetchKey: 'Football',   competition: 'Champions League', viewAllHref: '/sport/football',      bgImg: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&h=400&fit=crop', badgeColor: '#8B5CF6' },
  { key: 'world-cup',      label: 'FIFA World Cup',     flag: '🌍', source: 'tixstock',    fetchKey: 'Football',   competition: 'World Cup',        viewAllHref: '/sport/football',      bgImg: 'https://images.unsplash.com/photo-1540747913346-19212a4e6d27?w=600&h=400&fit=crop', badgeColor: '#10B981' },
  { key: 'mls',            label: 'MLS',                flag: '🇺🇸', source: 'ticketmaster', league: 'mls',         viewAllHref: '/sport',           bgImg: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=400&fit=crop', badgeColor: '#10B981' },
  { key: 'mlb',            label: 'MLB',                flag: '⚾', source: 'ticketmaster', league: 'mlb',         viewAllHref: '/sport',           bgImg: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&h=400&fit=crop', badgeColor: '#EF4444' },
  { key: 'nba',            label: 'NBA',                flag: '🏀', source: 'tixstock',    fetchKey: 'Basketball', competition: 'NBA',              viewAllHref: '/sport',           bgImg: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop', badgeColor: '#F97316' },
  { key: 'nfl',            label: 'NFL',                flag: '🏈', source: 'ticketmaster', league: 'nfl',         viewAllHref: '/sport',           bgImg: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&h=400&fit=crop', badgeColor: '#10B981' },
  { key: 'formula1',       label: 'Formula 1',          flag: '🏎️', source: 'tixstock',    fetchKey: 'Formula 1', competition: 'Formula 1',        viewAllHref: '/sport/formula-1', bgImg: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&h=400&fit=crop', badgeColor: '#EF4444' },
  { key: 'london-musical', label: 'London Musical',     flag: '🎭', source: 'ltd',          viewAllHref: '/shows', bgImg: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&h=400&fit=crop', badgeColor: '#8B5CF6' },
  { key: 'broadway',       label: 'Broadway Musical',   flag: '🗽', source: 'tbd',          viewAllHref: '/shows', bgImg: 'https://images.unsplash.com/photo-1490157175177-71e8789e0f44?w=600&h=400&fit=crop', badgeColor: '#8B5CF6' },
];

function formatShortDate(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
}

// ── Tixstock card (dark overlay style) ───────────────────────────
function TxCard({ event, cat }: { event: TxEvent; cat: Category }) {
  const price = event.min_ticket_price || event.startingPrice;
  const date  = event.datetime ? formatShortDate(event.datetime) : '';
  const isFast = (event.total_tickets ?? 99) <= 5;

  return (
    <Link href={`/event/${event.id}`}
      className="flex-none w-[200px] h-[280px] relative rounded-[16px] overflow-hidden group cursor-pointer flex-shrink-0">
      {/* BG image */}
      <img src={cat.bgImg} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

      {/* Top badge */}
      {isFast && (
        <div className="absolute top-3 left-3">
          <span className="bg-[#EF4444] text-white text-[10px] font-black px-2.5 py-1 rounded-md tracking-wide">SELLING FAST</span>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        {date && (
          <div className="flex items-center gap-1 text-[#94A3B8] text-[11px] mb-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            {date}
          </div>
        )}
        <div className="mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: cat.badgeColor || '#3B82F6' }}>{cat.label}</span>
        </div>
        <h3 className="text-white text-[13px] font-bold leading-tight mb-2.5 line-clamp-2">{event.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-white text-[13px] font-bold">{price ? `From $${price}` : 'See prices'}</span>
          <div className="w-8 h-8 rounded-full bg-[#2B7FFF] flex items-center justify-center group-hover:bg-[#1D6AE5] transition-colors flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── TM card (dark overlay style) ─────────────────────────────────
function TmCard({ event, cat }: { event: TmEvent; cat: Category }) {
  const [imgErr, setImgErr] = useState(false);
  const sym = event.currency === 'GBP' ? '£' : event.currency === 'EUR' ? '€' : '$';
  const badge = event.subGenre && event.subGenre !== 'Undefined' ? event.subGenre : event.genre;

  return (
    <a href={event.url} target="_blank" rel="noopener noreferrer"
      className="flex-none w-[200px] h-[280px] relative rounded-[16px] overflow-hidden group cursor-pointer flex-shrink-0">
      <img
        src={!imgErr && event.imageUrl ? event.imageUrl : cat.bgImg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setImgErr(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

      {badge && (
        <div className="absolute top-3 left-3">
          <span className="bg-[#10B981] text-white text-[10px] font-black px-2.5 py-1 rounded-md tracking-wide">EXCLUSIVE EVENT</span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3">
        {event.date && (
          <div className="flex items-center gap-1 text-[#94A3B8] text-[11px] mb-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()}
          </div>
        )}
        <div className="mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: cat.badgeColor || '#3B82F6' }}>{cat.label}</span>
        </div>
        <h3 className="text-white text-[13px] font-bold leading-tight mb-2.5 line-clamp-2">{event.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-white text-[13px] font-bold">{event.minPrice ? `From ${sym}${event.minPrice.toFixed(0)}` : 'See prices'}</span>
          <div className="w-8 h-8 rounded-full bg-[#2B7FFF] flex items-center justify-center group-hover:bg-[#1D6AE5] transition-colors flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    </a>
  );
}

// ── LTD card (portrait style) ─────────────────────────────────────
function LtdCard({ show }: { show: LtdEvent }) {
  return (
    <Link href={`/musical/event/${show.EventId}`}
      className="flex-none w-[160px] h-[280px] relative rounded-[16px] overflow-hidden group cursor-pointer flex-shrink-0">
      {show.ImageUrl
        ? <img src={show.ImageUrl} alt={show.Name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        : <div className="absolute inset-0 bg-gradient-to-br from-[#4C1D95] to-[#1E0A3C]" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      <div className="absolute top-3 left-3">
        <span className="bg-[#8B5CF6] text-white text-[10px] font-black px-2.5 py-1 rounded-md">WEST END</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="mb-1.5">
          <span className="text-[#A78BFA] text-[10px] font-bold uppercase tracking-wide">London Musical</span>
        </div>
        <h3 className="text-white text-[13px] font-bold leading-tight mb-2.5 line-clamp-2">{show.Name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-white text-[13px] font-bold">{show.EventMinimumPrice ? `From £${show.EventMinimumPrice}` : 'See prices'}</span>
          <div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center group-hover:bg-[#7C3AED] transition-colors flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────
function SkeletonCard({ portrait = false }: { portrait?: boolean }) {
  return (
    <div className={`flex-none rounded-[16px] overflow-hidden animate-pulse bg-[#1E293B] flex-shrink-0 ${portrait ? 'w-[160px] h-[280px]' : 'w-[200px] h-[280px]'}`}>
      <div className="absolute inset-0" />
    </div>
  );
}

// ── Section with slider ───────────────────────────────────────────
function PopularSection({ cat, txData, tmData, ltdShows, loading }: {
  cat: Category;
  txData: Record<string, TxEvent[]>;
  tmData: Record<string, TmEvent[]>;
  ltdShows: LtdEvent[];
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 640 : -640, behavior: 'smooth' });
  };

  let txEvents: TxEvent[] = [];
  let tmEvents: TmEvent[] = [];
  let ltd: LtdEvent[] = [];

  if (cat.source === 'tixstock' && cat.fetchKey) {
    const pool = txData[cat.fetchKey] || [];
    if (cat.competition) {
      const kw = cat.competition.toLowerCase();
      const filtered = pool.filter(e => (e.competition || '').toLowerCase().includes(kw) || e.name.toLowerCase().includes(kw));
      txEvents = (filtered.length > 0 ? filtered : pool).slice(0, 10);
    } else { txEvents = pool.slice(0, 10); }
  } else if (cat.source === 'ticketmaster' && cat.league) {
    tmEvents = (tmData[cat.league] || []).slice(0, 10);
  } else if (cat.source === 'ltd') {
    ltd = ltdShows.slice(0, 12);
  }

  const total = txEvents.length + tmEvents.length + ltd.length;
  const isEmpty = !loading && total === 0;
  const isPortrait = cat.source === 'ltd';

  return (
    <section id={cat.key} className="scroll-mt-20 mb-10">
      {/* Section header */}
      <div className="relative overflow-hidden rounded-t-[12px]">
        {cat.bgImg && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${cat.bgImg})` }} />}
        <div className="absolute inset-0 bg-[#0F172A]/85" />
        <div className="relative flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{cat.flag}</span>
            <h2 className="text-white text-[16px] font-bold">{cat.label}</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: `${cat.badgeColor}22`, color: cat.badgeColor || '#fff' }}>
              {cat.source === 'ltd' ? 'LTD' : cat.source === 'ticketmaster' ? 'Ticketmaster' : 'Tixstock'}
            </span>
          </div>
          <Link href={cat.viewAllHref} className="text-[#60A5FA] text-[12px] font-semibold hover:text-white transition-colors flex items-center gap-1">View All →</Link>
        </div>
      </div>

      {/* Slider */}
      <div className="relative bg-[#F8FAFC] border border-t-0 border-[#E5E7EB] rounded-b-[12px] px-4 py-4">
        {/* Left arrow */}
        <button onClick={() => scroll('left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F1F5F9] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide mx-6">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} portrait={isPortrait} />)
          ) : cat.source === 'tbd' ? (
            <div className="flex-none flex flex-col items-center justify-center w-full py-10 text-[#9CA3AF] min-w-[300px]">
              <span className="text-3xl mb-2">🚧</span><p className="text-[13px]">Broadway coming soon</p>
            </div>
          ) : isEmpty ? (
            <div className="flex-none flex flex-col items-center justify-center w-full py-10 text-[#9CA3AF] min-w-[300px]">
              <span className="text-3xl mb-2">📅</span><p className="text-[13px]">No upcoming events</p>
            </div>
          ) : (
            <>
              {txEvents.map(e => <TxCard key={e.id} event={e} cat={cat} />)}
              {tmEvents.map(e => <TmCard key={e.id} event={e} cat={cat} />)}
              {ltd.map(e => <LtdCard key={e.EventId} show={e} />)}
              {/* View all card */}
              <Link href={cat.viewAllHref}
                className="flex-none w-[120px] h-[280px] bg-white rounded-[16px] border-2 border-dashed border-[#D1D5DB] flex flex-col items-center justify-center gap-2 hover:border-[#2B7FFF] hover:bg-[#EFF6FF] transition-colors flex-shrink-0">
                <span className="text-[#2B7FFF] text-2xl">→</span>
                <span className="text-[#2B7FFF] text-[11px] font-semibold text-center px-2">View All</span>
              </Link>
            </>
          )}
        </div>

        {/* Right arrow */}
        <button onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F1F5F9] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function PopularClient() {
  const [txData,       setTxData]       = useState<Record<string, TxEvent[]>>({});
  const [tmData,       setTmData]       = useState<Record<string, TmEvent[]>>({});
  const [ltdShows,     setLtdShows]     = useState<LtdEvent[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/tixstock/feed?category_name=Football&size=50').then(r => r.json()),
      fetch('/api/tixstock/feed?category_name=Basketball&size=20').then(r => r.json()),
      fetch('/api/tixstock/feed?category_name=Formula+1&size=20').then(r => r.json()),
      fetch('/api/ticketmaster/events?tab=sports&countryCode=US&league=mls&size=10').then(r => r.json()),
      fetch('/api/ticketmaster/events?tab=sports&countryCode=US&league=mlb&size=10').then(r => r.json()),
      fetch('/api/ticketmaster/events?tab=sports&countryCode=US&league=nfl&size=10').then(r => r.json()),
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
      {/* Hero — NO duplicate tabs, just title */}
      <div className="bg-[#0F172A]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 pt-10 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-bold text-[#F97316] tracking-[1.5px]">ENTTIX</span>
            <span className="text-[12px] text-[#475569]">·</span>
            <span className="text-[12px] text-[#475569]">Trending Events</span>
          </div>
          <h1 className="text-[32px] md:text-[48px] font-extrabold text-white tracking-[-1px] mb-2">🔥 Popular</h1>
          <p className="text-[14px] text-[#94A3B8]">Top events across sports, musicals &amp; entertainment worldwide</p>
        </div>
      </div>

      {/* Sticky filter bar (single row) */}
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
          <PopularSection key={cat.key} cat={cat} txData={txData} tmData={tmData} ltdShows={ltdShows} loading={loading} />
        ))}
      </div>
    </div>
  );
}
