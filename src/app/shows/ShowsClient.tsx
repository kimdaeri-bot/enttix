'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';


interface LtdEvent { EventId: number; Name: string; TagLine?: string; ImageUrl?: string; EventMinimumPrice?: number; }
interface TmEvent {
  id: string; name: string; url: string; imageUrl: string;
  date: string; time: string; venueName: string; city: string;
  country: string; minPrice: number | null; currency: string;
  genre: string; subGenre: string;
}
interface PageInfo { number: number; size: number; totalElements: number; totalPages: number; }

const SHOW_TABS = [
  { key: 'all',     label: 'All Shows',  type: null },
  { key: 'musical', label: 'Musical',    type: 1 },
  { key: 'play',    label: 'Play',       type: 2 },
  { key: 'dance',   label: 'Dance',      type: 3 },
  { key: 'opera',   label: 'Opera',      type: 4 },
  { key: 'ballet',  label: 'Ballet',     type: 5 },
  { key: 'circus',  label: 'Circus',     type: 6 },
];

const ARTS_GENRES = [
  { key: '',          label: 'All Arts',          icon: '🎭', count: 139714 },
  { key: 'theatre',   label: 'Theatre',           icon: '🎬', count: 35040  },
  { key: 'comedy',    label: 'Comedy',            icon: '😂', count: 13192  },
  { key: 'fineart',   label: 'Fine Art',          icon: '🖼️', count: 4935   },
  { key: 'circus',    label: 'Circus & Acrobatics',icon: '🎪', count: 2789  },
  { key: 'magic',     label: 'Magic & Illusion',  icon: '🎩', count: 2316   },
  { key: 'variety',   label: 'Variety',           icon: '✨', count: 1206   },
  { key: 'cultural',  label: 'Cultural',          icon: '🌏', count: 1492   },
  { key: 'dance',     label: 'Dance',             icon: '💃', count: 1332   },
  { key: 'childrens', label: "Children's",        icon: '🧒', count: 1071   },
];

const COUNTRIES = [
  { code: '',   name: 'All',           flag: '🌏', count: 139714 },
  { code: 'GB', name: 'United Kingdom',flag: '🇬🇧', count: 16977  },
  { code: 'US', name: 'United States', flag: '🇺🇸', count: 12000  },
  { code: 'CA', name: 'Canada',        flag: '🇨🇦', count: 3000   },
  { code: 'AU', name: 'Australia',     flag: '🇦🇺', count: 2500   },
  { code: 'IE', name: 'Ireland',       flag: '🇮🇪', count: 1200   },
  { code: 'DE', name: 'Germany',       flag: '🇩🇪', count: 900    },
  { code: 'NL', name: 'Netherlands',   flag: '🇳🇱', count: 700    },
  { code: 'FR', name: 'France',        flag: '🇫🇷', count: 500    },
];

function formatDate(d: string) {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatCount(n: number) { return n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n); }

// ── LTD Show Card (portrait 2:3) ──────────────────────────────────
function LtdCard({ show }: { show: LtdEvent }) {
  return (
    <Link href={`/musical/event/${show.EventId}`}
      className="group bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:border-[#7C3AED]/30 transition-all duration-200 flex flex-col">
      <div className="relative aspect-[2/3] bg-[#E5E7EB] overflow-hidden flex-shrink-0">
        {show.ImageUrl
          ? <img src={show.ImageUrl} alt={show.Name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-4xl opacity-30">🎭</span></div>}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-[#7C3AED]/80 backdrop-blur-sm">West End</span>
        </div>
        {show.EventMinimumPrice ? (
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-black/70">from £{show.EventMinimumPrice}</span>
          </div>
        ) : null}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[14px] font-bold text-[#171717] leading-[20px] mb-1 line-clamp-2 group-hover:text-[#7C3AED] transition-colors">{show.Name}</h3>
        {show.TagLine && <p className="text-[12px] text-[#6B7280] line-clamp-2 mb-3 flex-1">{show.TagLine}</p>}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-[14px] font-bold text-[#171717]">
            {show.EventMinimumPrice ? `From £${show.EventMinimumPrice}` : 'See prices'}
          </span>
          <span className="flex items-center gap-1 text-[12px] font-semibold text-[#7C3AED] group-hover:gap-2 transition-all">
            Book Now<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── TM Event Card ──────────────────────────────────────────────────
function TmCard({ event }: { event: TmEvent }) {
  const [imgErr, setImgErr] = useState(false);
  const sym = event.currency === 'GBP' ? '£' : event.currency === 'EUR' ? '€' : '$';
  return (
    <a href={`/music/event/${event.id}`}
      className="group bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:border-[#2B7FFF]/30 transition-all duration-200 flex flex-col">
      <div className="relative aspect-[16/9] bg-[#E5E7EB] overflow-hidden flex-shrink-0">
        {!imgErr && event.imageUrl
          ? <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgErr(true)} />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-4xl opacity-30">🎭</span></div>}
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

export default function ShowsClient() {
  const [section,      setSection]      = useState<'ltd' | 'tm'>('ltd');
  const [ltdTab,       setLtdTab]       = useState('all');
  const [ltdEvents,    setLtdEvents]    = useState<LtdEvent[]>([]);
  const [ltdLoading,   setLtdLoading]   = useState(true);
  const [activeCountry,setActiveCountry]= useState('GB');
  const [activeGenre,  setActiveGenre]  = useState('');
  const [tmEvents,     setTmEvents]     = useState<TmEvent[]>([]);
  const [pageInfo,     setPageInfo]     = useState<PageInfo>({ number: 0, size: 20, totalElements: 0, totalPages: 0 });
  const [tmLoading,    setTmLoading]    = useState(false);
  const [currentPage,  setCurrentPage]  = useState(0);

  // LTD
  useEffect(() => {
    const tab = SHOW_TABS.find(t => t.key === ltdTab);
    setLtdLoading(true);
    fetch(`/api/ltd/events${tab?.type ? `?type=${tab.type}` : ''}`)
      .then(r => r.json()).then(d => { setLtdEvents(d.events || []); setLtdLoading(false); })
      .catch(() => setLtdLoading(false));
  }, [ltdTab]);

  // TM Arts
  const fetchTm = useCallback(async (genre: string, country: string, page: number) => {
    setTmLoading(true);
    try {
      const p = new URLSearchParams({ tab: 'arts', page: String(page), size: '20' });
      if (genre)   p.set('genre', genre);
      if (country) p.set('countryCode', country);
      const res  = await fetch(`/api/ticketmaster/events?${p}`);
      const data = await res.json();
      setTmEvents(data.events || []);
      setPageInfo(data.page || { number: 0, size: 20, totalElements: 0, totalPages: 0 });
    } catch { setTmEvents([]); } finally { setTmLoading(false); }
  }, []);

  useEffect(() => {
    if (section === 'tm') { setCurrentPage(0); fetchTm(activeGenre, activeCountry, 0); }
  }, [section, activeGenre, activeCountry, fetchTm]);

  const handlePage = (p: number) => { setCurrentPage(p); fetchTm(activeGenre, activeCountry, p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const countryObj = COUNTRIES.find(c => c.code === activeCountry) || COUNTRIES[0];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Hero */}
      <div className="bg-[#0F172A]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 pt-10 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-bold text-[#7C3AED] tracking-[1.5px]">LTD</span>
            <span className="text-[12px] text-[#475569]">·</span>
            <span className="text-[12px] font-bold text-[#2B7FFF] tracking-[1.5px]">TICKETMASTER</span>
            <span className="text-[12px] text-[#475569]">·</span>
            <span className="text-[12px] text-[#475569]">Theatre &amp; Stage</span>
          </div>
          <h1 className="text-[32px] md:text-[48px] font-extrabold text-white tracking-[-1px] mb-2">🎭 Shows</h1>
          <p className="text-[14px] text-[#94A3B8] mb-6">West End musicals, Broadway, Opera, Ballet and Global Theatre</p>
        </div>
        {/* Section toggle tabs */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            <button onClick={() => setSection('ltd')}
              className={`flex-shrink-0 px-5 py-3 text-[14px] font-semibold rounded-t-[10px] transition-colors ${section === 'ltd' ? 'bg-[#F5F7FA] text-[#171717]' : 'text-[#94A3B8] hover:text-white'}`}>
              🎭 London West End
            </button>
            <button onClick={() => { setSection('tm'); }}
              className={`flex-shrink-0 px-5 py-3 text-[14px] font-semibold rounded-t-[10px] transition-colors ${section === 'tm' ? 'bg-[#F5F7FA] text-[#171717]' : 'text-[#94A3B8] hover:text-white'}`}>
              🌍 Global Arts &amp; Theatre
            </button>
          </div>
        </div>
      </div>

      {/* ── LTD Section ── */}
      {section === 'ltd' && (
        <>
          {/* Show type filter */}
          <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
            <div className="max-w-[1280px] mx-auto px-4 md:px-10">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
                {SHOW_TABS.map(tab => (
                  <button key={tab.key} onClick={() => setLtdTab(tab.key)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${ltdTab === tab.key ? 'bg-[#7C3AED] text-white shadow-sm' : 'bg-[#F1F5F9] text-[#374151] hover:bg-[#E2E8F0]'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] text-[#6B7280]">
                {!ltdLoading && <><span className="font-semibold text-[#171717]">🇬🇧 London West End</span> · 총 <span className="font-semibold text-[#171717]">{ltdEvents.length}</span>개 공연</>}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <span>Powered by</span><span className="font-bold text-[#7C3AED]">LTD</span>
              </div>
            </div>

            {ltdLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] animate-pulse">
                    <div className="aspect-[2/3] bg-[#E5E7EB]" /><div className="p-4 space-y-2"><div className="h-4 bg-[#E5E7EB] rounded w-3/4" /></div>
                  </div>
                ))}
              </div>
            ) : ltdEvents.length === 0 ? (
              <div className="text-center py-20"><p className="text-5xl mb-4">🎭</p><p className="text-[#374151] font-semibold">공연이 없습니다</p></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {ltdEvents.map(e => <LtdCard key={e.EventId} show={e} />)}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TM Arts Section ── */}
      {section === 'tm' && (
        <>
          {/* Country filter */}
          <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
            <div className="max-w-[1280px] mx-auto px-4 md:px-10">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
                {COUNTRIES.map(c => (
                  <button key={c.code} onClick={() => { setActiveCountry(c.code); setCurrentPage(0); }}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all ${activeCountry === c.code ? 'bg-[#2B7FFF] text-white shadow-sm' : 'bg-[#F1F5F9] text-[#374151] hover:bg-[#E2E8F0]'}`}>
                    <span>{c.flag}</span><span>{c.name}</span>
                    <span className={`text-[10px] ${activeCountry === c.code ? 'text-white/80' : 'text-[#9CA3AF]'}`}>{formatCount(c.count)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Genre sub-filter */}
          <div className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <div className="max-w-[1280px] mx-auto px-4 md:px-10">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
                {ARTS_GENRES.map(g => (
                  <button key={g.key} onClick={() => { setActiveGenre(g.key); setCurrentPage(0); }}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all border ${activeGenre === g.key ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm' : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#0F172A]/30 hover:bg-[#F1F5F9]'}`}>
                    <span>{g.icon}</span><span>{g.label}</span>
                    <span className={`text-[10px] font-medium ${activeGenre === g.key ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{formatCount(g.count)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-[13px] text-[#6B7280]">
                {!tmLoading && pageInfo.totalElements > 0 && (
                  <><span className="font-semibold text-[#171717]">{countryObj.flag} {countryObj.name}</span>{' · '}총{' '}<span className="font-semibold text-[#171717]">{pageInfo.totalElements.toLocaleString()}</span>개 이벤트{' · '}페이지{' '}<span className="font-semibold text-[#171717]">{pageInfo.number + 1}</span> / {pageInfo.totalPages.toLocaleString()}</>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <span>Powered by</span><span className="font-bold text-[#026CDF]">Ticketmaster</span>
              </div>
            </div>

            {tmLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] animate-pulse">
                    <div className="aspect-[16/9] bg-[#E5E7EB]" /><div className="p-4 space-y-2"><div className="h-4 bg-[#E5E7EB] rounded w-3/4" /><div className="h-3 bg-[#E5E7EB] rounded w-1/2" /></div>
                  </div>
                ))}
              </div>
            ) : tmEvents.length === 0 ? (
              <div className="text-center py-20"><p className="text-5xl mb-4">🎭</p><p className="text-[#374151] font-semibold">이벤트가 없습니다</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {tmEvents.map(e => <TmCard key={e.id} event={e} />)}
              </div>
            )}

            {!tmLoading && pageInfo.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button onClick={() => handlePage(currentPage - 1)} disabled={currentPage === 0}
                  className="px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[13px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 transition-colors flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Prev
                </button>
                <span className="px-4 py-2.5 text-[13px] text-[#6B7280]">{currentPage + 1} / {pageInfo.totalPages}</span>
                <button onClick={() => handlePage(currentPage + 1)} disabled={currentPage + 1 >= pageInfo.totalPages}
                  className="px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[13px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 transition-colors flex items-center gap-1.5">
                  Next<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
