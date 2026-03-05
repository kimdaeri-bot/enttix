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
  viewAllHref: string; bgImg: string;
  accent: string;   // CSS color for this category
  tagline: string;  // short descriptor shown under title
}

const CATEGORIES: Category[] = [
  {
    key: 'all', label: 'All', flag: '🔥', source: 'tixstock',
    viewAllHref: '/popular', bgImg: '', accent: '#F97316', tagline: '',
  },
  {
    key: 'premier-league', label: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', source: 'tixstock',
    fetchKey: 'Football', competition: 'Premier League',
    viewAllHref: '/sport/football',
    bgImg: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1400&h=600&fit=crop',
    accent: '#3B82F6', tagline: 'The world\'s most-watched football league',
  },
  {
    key: 'serie-a', label: 'Serie A', flag: '🇮🇹', source: 'tixstock',
    fetchKey: 'Football', competition: 'Serie A',
    viewAllHref: '/sport/football',
    bgImg: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=1400&h=600&fit=crop',
    accent: '#3B82F6', tagline: 'Italian football at its finest',
  },
  {
    key: 'la-liga', label: 'La Liga', flag: '🇪🇸', source: 'tixstock',
    fetchKey: 'Football', competition: 'La Liga',
    viewAllHref: '/sport/football',
    bgImg: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1400&h=600&fit=crop',
    accent: '#EF4444', tagline: 'Spain\'s elite football competition',
  },
  {
    key: 'bundesliga', label: 'Bundesliga', flag: '🇩🇪', source: 'tixstock',
    fetchKey: 'Football', competition: 'Bundesliga',
    viewAllHref: '/sport/football',
    bgImg: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&h=600&fit=crop',
    accent: '#F59E0B', tagline: 'Germany\'s top flight — highest attendance in Europe',
  },
  {
    key: 'ucl', label: 'Champions League', flag: '🏆', source: 'tixstock',
    fetchKey: 'Football', competition: 'Champions League',
    viewAllHref: '/sport/football',
    bgImg: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1400&h=600&fit=crop',
    accent: '#8B5CF6', tagline: 'Europe\'s premier club competition',
  },
  {
    key: 'world-cup', label: 'FIFA World Cup', flag: '🌍', source: 'tixstock',
    fetchKey: 'Football', competition: 'World Cup',
    viewAllHref: '/sport/football',
    bgImg: 'https://images.unsplash.com/photo-1540747913346-19212a4e6d27?w=1400&h=600&fit=crop',
    accent: '#10B981', tagline: 'The biggest sporting event on the planet',
  },
  {
    key: 'mls', label: 'MLS', flag: '🇺🇸', source: 'ticketmaster',
    league: 'mls', viewAllHref: '/sport',
    bgImg: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1400&h=600&fit=crop',
    accent: '#10B981', tagline: 'Major League Soccer — top-tier US & Canada',
  },
  {
    key: 'mlb', label: 'MLB', flag: '⚾', source: 'ticketmaster',
    league: 'mlb', viewAllHref: '/sport',
    bgImg: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=1400&h=600&fit=crop',
    accent: '#EF4444', tagline: 'America\'s pastime, 162 games a season',
  },
  {
    key: 'nba', label: 'NBA', flag: '🏀', source: 'tixstock',
    fetchKey: 'Basketball', competition: 'NBA',
    viewAllHref: '/sport',
    bgImg: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1400&h=600&fit=crop',
    accent: '#F97316', tagline: 'The world\'s best basketball',
  },
  {
    key: 'nfl', label: 'NFL', flag: '🏈', source: 'ticketmaster',
    league: 'nfl', viewAllHref: '/sport',
    bgImg: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1400&h=600&fit=crop',
    accent: '#10B981', tagline: 'America\'s most-watched sport',
  },
  {
    key: 'formula1', label: 'Formula 1', flag: '🏎️', source: 'tixstock',
    fetchKey: 'Formula 1', competition: 'Formula 1',
    viewAllHref: '/sport/formula-1',
    bgImg: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1400&h=600&fit=crop',
    accent: '#EF4444', tagline: 'The pinnacle of motorsport',
  },
  {
    key: 'london-musical', label: 'London Musical', flag: '🎭', source: 'ltd',
    viewAllHref: '/shows',
    bgImg: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1400&h=600&fit=crop',
    accent: '#8B5CF6', tagline: "West End's greatest shows, live on stage",
  },
  {
    key: 'broadway', label: 'Broadway Musical', flag: '🗽', source: 'tbd',
    viewAllHref: '/shows',
    bgImg: 'https://images.unsplash.com/photo-1490157175177-71e8789e0f44?w=1400&h=600&fit=crop',
    accent: '#8B5CF6', tagline: "New York's most iconic theatre district",
  },
];

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Ticket Card (tall portrait, dark cinema style) ─────────────────
function TicketCard({
  href, isExternal = false, image, fallbackImg, title, date, venue, price, accent, badge, urgency
}: {
  href: string; isExternal?: boolean;
  image?: string; fallbackImg?: string;
  title: string; date?: string; venue?: string;
  price?: string; accent: string; badge?: string; urgency?: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(image || fallbackImg || '');

  const inner = (
    <div className="relative w-full h-full overflow-hidden rounded-2xl group">
      {/* Background image */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => { if (fallbackImg && imgSrc !== fallbackImg) setImgSrc(fallbackImg); }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, #0F172A, ${accent}33)` }} />
      )}
      {/* Multi-stop gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      {/* Accent top line */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: accent }} />

      {/* Badges (top) */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
        {urgency && (
          <span className="flex items-center gap-1 bg-[#EF4444] text-white text-[9px] font-black px-2 py-1 rounded-md tracking-widest uppercase">
            🔥 Selling Fast
          </span>
        )}
        {badge && !urgency && (
          <span className="text-[9px] font-black px-2 py-1 rounded-md tracking-widest uppercase text-white"
            style={{ background: accent }}>
            {badge}
          </span>
        )}
      </div>

      {/* Content (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {date && (
          <p className="text-[10px] text-white/60 font-semibold mb-1 uppercase tracking-wider">{date}</p>
        )}
        <h3 className="text-white text-[14px] font-extrabold leading-snug mb-1.5 line-clamp-2">{title}</h3>
        {venue && (
          <p className="text-white/50 text-[11px] mb-3 line-clamp-1">📍 {venue}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-white font-black text-[15px]">{price || 'See prices'}</span>
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
            style={{ background: accent }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );

  const cls = 'flex-none w-[220px] h-[320px] cursor-pointer';
  return isExternal
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    : <Link href={href} className={cls}>{inner}</Link>;
}

// ── Skeleton ──────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="flex-none w-[220px] h-[320px] rounded-2xl overflow-hidden bg-white/5 animate-pulse">
      <div className="w-full h-full bg-gradient-to-b from-white/5 to-transparent" />
    </div>
  );
}

// ── Category Section ──────────────────────────────────────────────
function PopularSection({ cat, txData, tmData, ltdShows, loading }: {
  cat: Category;
  txData: Record<string, TxEvent[]>;
  tmData: Record<string, TmEvent[]>;
  ltdShows: LtdEvent[];
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 700 : -700, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Build cards
  let cards: React.ReactNode[] = [];

  if (loading) {
    cards = Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />);
  } else if (cat.source === 'tbd') {
    cards = [];
  } else if (cat.source === 'tixstock' && cat.fetchKey) {
    const pool = txData[cat.fetchKey] || [];
    let events = pool;
    if (cat.competition) {
      const kw = cat.competition.toLowerCase();
      const filtered = pool.filter(e =>
        (e.competition || '').toLowerCase().includes(kw) || e.name.toLowerCase().includes(kw)
      );
      events = (filtered.length > 0 ? filtered : pool);
    }
    cards = events.slice(0, 12).map(e => {
      const price = e.min_ticket_price || e.startingPrice;
      return (
        <TicketCard
          key={e.id}
          href={`/event/${e.id}`}
          image={cat.bgImg}
          fallbackImg={cat.bgImg}
          title={e.name}
          date={e.datetime ? formatDate(e.datetime) : undefined}
          venue={e.venue?.name}
          price={price ? `From $${price}` : undefined}
          accent={cat.accent}
          badge={cat.label}
          urgency={(e.total_tickets ?? 99) <= 5}
        />
      );
    });
  } else if (cat.source === 'ticketmaster' && cat.league) {
    const events = (tmData[cat.league] || []).slice(0, 12);
    cards = events.map(e => {
      const sym = e.currency === 'GBP' ? '£' : e.currency === 'EUR' ? '€' : '$';
      return (
        <TicketCard
          key={e.id}
          href={`/music/event/${e.id}`}
          image={e.imageUrl}
          fallbackImg={cat.bgImg}
          title={e.name}
          date={e.date ? formatDate(e.date) : undefined}
          venue={e.venueName || e.city}
          price={e.minPrice ? `From ${sym}${e.minPrice.toFixed(0)}` : undefined}
          accent={cat.accent}
          badge={cat.label}
        />
      );
    });
  } else if (cat.source === 'ltd') {
    cards = ltdShows.slice(0, 12).map(e => (
      <TicketCard
        key={e.EventId}
        href={`/musical/event/${e.EventId}`}
        image={e.ImageUrl}
        fallbackImg={cat.bgImg}
        title={e.Name}
        price={e.EventMinimumPrice ? `From £${e.EventMinimumPrice}` : undefined}
        accent={cat.accent}
        badge="West End"
      />
    ));
  }

  const isEmpty = !loading && cards.length === 0;

  return (
    <section id={cat.key} className="scroll-mt-24 mb-14">
      {/* ── Section Header ── */}
      <div className="flex items-end justify-between mb-5 px-1">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {/* Accent bar */}
            <div className="w-1 h-8 rounded-full" style={{ background: cat.accent }} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[22px] leading-none">{cat.flag}</span>
                <h2 className="text-white text-[22px] font-extrabold tracking-tight">{cat.label}</h2>
              </div>
              <p className="text-white/40 text-[12px] mt-0.5 ml-0.5">{cat.tagline}</p>
            </div>
          </div>
        </div>
        <Link
          href={cat.viewAllHref}
          className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors mb-1"
          style={{ color: cat.accent }}
        >
          View All
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* ── Slider ── */}
      <div className="relative">
        {/* Left fade + button */}
        {canLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #0A0F1E, transparent)' }} />
        )}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all ${!canLeft ? 'opacity-0 pointer-events-none' : ''}`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-1 pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center w-full py-16 text-white/30 min-w-[300px]">
              <span className="text-4xl mb-3">📅</span>
              <p className="text-[14px]">No upcoming events</p>
            </div>
          ) : cat.source === 'tbd' ? (
            <div className="flex flex-col items-center justify-center w-full py-16 text-white/30 min-w-[300px]">
              <span className="text-4xl mb-3">🚧</span>
              <p className="text-[14px] font-semibold">Broadway — Coming Soon</p>
              <p className="text-[12px] mt-1">Tickets will be available shortly</p>
            </div>
          ) : (
            <>
              {cards}
              {/* View All card */}
              <Link
                href={cat.viewAllHref}
                className="flex-none w-[160px] h-[320px] rounded-2xl border border-white/10 hover:border-white/30 flex flex-col items-center justify-center gap-3 transition-all group bg-white/5 hover:bg-white/10"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center border border-white/20 group-hover:border-white/50 transition-colors"
                  style={{ background: `${cat.accent}22` }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cat.accent} strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white/80 text-[13px] font-bold">View All</p>
                  <p className="text-white/40 text-[11px] mt-0.5">{cat.label}</p>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Right fade + button */}
        {canRight && (
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #0A0F1E, transparent)' }} />
        )}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all ${!canRight ? 'opacity-0 pointer-events-none' : ''}`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      {/* Section divider */}
      <div className="mt-10 h-px bg-white/5" />
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
      if (ltd.status === 'fulfilled') {
        const d = ltd.value;
        setLtdShows(Array.isArray(d) ? d : d?.events || []);
      }
      setLoading(false);
    });
  }, []);

  const displayCats = activeFilter === 'all'
    ? CATEGORIES.filter(c => c.key !== 'all')
    : CATEGORIES.filter(c => c.key === activeFilter);

  const activeCat = CATEGORIES.find(c => c.key === activeFilter) || CATEGORIES[0];

  return (
    <div className="min-h-screen" style={{ background: '#0A0F1E' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Animated background: full-bleed stadium image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1600&h=700&fit=crop"
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1E]/60 via-[#0A0F1E]/40 to-[#0A0F1E]" />
          {/* Color blobs */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-[#3B82F6]/10 blur-[100px]" />
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] rounded-full bg-[#8B5CF6]/10 blur-[100px]" />
        </div>

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-10 pt-12 pb-10">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
            <span className="text-[11px] font-black text-[#EF4444] tracking-[3px] uppercase">Live Now</span>
            <span className="text-white/20 mx-1">·</span>
            <span className="text-[11px] text-white/40 tracking-wider uppercase">Trending Events</span>
          </div>

          <h1 className="text-[52px] md:text-[72px] font-black text-white tracking-[-2px] leading-none mb-4">
            🔥 Popular
          </h1>
          <p className="text-white/50 text-[16px] mb-8 max-w-[500px]">
            Hand-picked top events across football, basketball, F1, musicals & more.
          </p>

          {/* Category filter pills — dark style */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(cat => {
              const isActive = activeFilter === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold transition-all border ${
                    isActive
                      ? 'text-white border-transparent'
                      : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/90'
                  }`}
                  style={isActive ? { background: cat.accent, borderColor: cat.accent } : {}}
                >
                  <span>{cat.flag}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ACTIVE SINGLE CATEGORY BANNER (if filtered) ────────── */}
      {activeFilter !== 'all' && activeCat.bgImg && (
        <div className="relative h-[180px] overflow-hidden">
          <img src={activeCat.bgImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F1E] via-[#0A0F1E]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] to-transparent" />
          <div className="relative h-full flex items-center max-w-[1280px] mx-auto px-4 md:px-10">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[3px] mb-2" style={{ color: activeCat.accent }}>
                {activeCat.flag} {activeCat.label}
              </p>
              <p className="text-white/70 text-[15px] max-w-[500px]">{activeCat.tagline}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ─────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-10 pb-24">
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
