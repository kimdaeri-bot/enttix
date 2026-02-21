'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface TmEvent {
  id: string; name: string; url: string; imageUrl: string;
  date: string; time: string; venueName: string; city: string;
  country: string; minPrice: number | null; currency: string;
  genre: string; subGenre: string;
}
interface PageInfo { number: number; size: number; totalElements: number; totalPages: number; }

const HERO_PHOTO = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&h=800&fit=crop';

const COUNTRIES = [
  { code: '',   name: 'All',            flag: '🌏', count: 77000 },
  { code: 'US', name: 'United States',  flag: '🇺🇸', count: 45000 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', count: 12000 },
  { code: 'CA', name: 'Canada',         flag: '🇨🇦', count: 5000  },
  { code: 'AU', name: 'Australia',      flag: '🇦🇺', count: 4000  },
  { code: 'DE', name: 'Germany',        flag: '🇩🇪', count: 2000  },
  { code: 'FR', name: 'France',         flag: '🇫🇷', count: 800   },
  { code: 'NL', name: 'Netherlands',    flag: '🇳🇱', count: 700   },
  { code: 'ES', name: 'Spain',          flag: '🇪🇸', count: 600   },
  { code: 'IE', name: 'Ireland',        flag: '🇮🇪', count: 500   },
  { code: 'BE', name: 'Belgium',        flag: '🇧🇪', count: 400   },
  { code: 'SE', name: 'Sweden',         flag: '🇸🇪', count: 300   },
  { code: 'NO', name: 'Norway',         flag: '🇳🇴', count: 200   },
  { code: 'DK', name: 'Denmark',        flag: '🇩🇰', count: 180   },
  { code: 'NZ', name: 'New Zealand',    flag: '🇳🇿', count: 150   },
  { code: 'MX', name: 'Mexico',         flag: '🇲🇽', count: 120   },
  { code: 'BR', name: 'Brazil',         flag: '🇧🇷', count: 100   },
];

const MUSIC_GENRES = [
  { key: '',            label: 'All Music',   icon: '🎵', count: 77000 },
  { key: 'rock',        label: 'Rock',        icon: '🎸', count: 20000 },
  { key: 'pop',         label: 'Pop',         icon: '🎤', count: 8000  },
  { key: 'country',     label: 'Country',     icon: '🤠', count: 4000  },
  { key: 'alternative', label: 'Alternative', icon: '🎶', count: 3000  },
  { key: 'hiphop',      label: 'Hip-Hop/Rap', icon: '🎧', count: 3000  },
  { key: 'metal',       label: 'Metal',       icon: '🤘', count: 2000  },
  { key: 'folk',        label: 'Folk',        icon: '🪕', count: 2000  },
  { key: 'jazz',        label: 'Jazz',        icon: '🎷', count: 2000  },
  { key: 'classical',   label: 'Classical',   icon: '🎻', count: 1500  },
  { key: 'soul',        label: 'R&B / Soul',  icon: '🎼', count: 1200  },
  { key: 'electronic',  label: 'Electronic',  icon: '🎛️', count: 1000  },
  { key: 'latin',       label: 'Latin',       icon: '💃', count: 800   },
];

function formatDate(d: string) {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatCount(n: number) { return n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n); }

/* ── 가로 스크롤 + 화살표 버튼 ── */
function ScrollRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    if (ref.current) ref.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  };
  return (
    <div className={`relative group/scroll ${className}`}>
      <button onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center text-[#374151] hover:bg-[#F1F5F9] transition-all opacity-0 group-hover/scroll:opacity-100"
        aria-label="Scroll left">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div ref={ref} className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
        {children}
      </div>
      <button onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center text-[#374151] hover:bg-[#F1F5F9] transition-all opacity-0 group-hover/scroll:opacity-100"
        aria-label="Scroll right">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  );
}

/* ── 이벤트 카드 ── */
function EventCard({ event }: { event: TmEvent }) {
  const [imgErr, setImgErr] = useState(false);
  const sym = event.currency === 'GBP' ? '£' : event.currency === 'EUR' ? '€' : '$';
  return (
    <a href={event.url} target="_blank" rel="noopener noreferrer"
      className="group bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:border-[#2B7FFF]/30 transition-all duration-200 flex flex-col">
      <div className="relative aspect-[16/9] bg-[#E5E7EB] overflow-hidden flex-shrink-0">
        {!imgErr && event.imageUrl
          ? <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgErr(true)} />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-4xl opacity-30">🎵</span></div>}
        {event.subGenre && event.subGenre !== 'Undefined' && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm">{event.subGenre}</span>
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
          <span className="text-[14px] font-bold text-[#171717]">
            {event.minPrice ? `From ${sym}${event.minPrice.toFixed(0)}` : 'See prices'}
          </span>
          <span className="flex items-center gap-1 text-[12px] font-semibold text-[#2B7FFF] group-hover:gap-2 transition-all">
            Buy Tickets
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </div>
      </div>
    </a>
  );
}

/* ══════════════════════════════════════════════════════ */
export default function MusicClient() {
  const [activeGenre,    setActiveGenre]    = useState('');
  const [activeCountry,  setActiveCountry]  = useState('GB');
  const [searchQuery,    setSearchQuery]    = useState('');   // 실제 API 전송 값
  const [inputValue,     setInputValue]     = useState('');   // 입력창 표시값
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [events,         setEvents]         = useState<TmEvent[]>([]);
  const [pageInfo,       setPageInfo]       = useState<PageInfo>({ number: 0, size: 20, totalElements: 0, totalPages: 0 });
  const [loading,        setLoading]        = useState(true);
  const [currentPage,    setCurrentPage]    = useState(0);
  const searchRef  = useRef<HTMLDivElement>(null);
  const resultsRef  = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef(false);

  /* 자동완성: 현재 로드된 이벤트 이름에서 매칭 (2글자+, 최대 7개) */
  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.length < 2) return [];
    const q = inputValue.toLowerCase();
    return events
      .map(e => e.name)
      .filter(n => n.toLowerCase().includes(q))
      .slice(0, 7);
  }, [inputValue, events]);

  /* 외부 클릭 시 자동완성 닫기 */
  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onClickOut);
    return () => document.removeEventListener('mousedown', onClickOut);
  }, []);

  const fetchEvents = useCallback(async (genre: string, country: string, keyword: string, page: number) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ tab: 'music', page: String(page), size: '20' });
      if (genre)   p.set('genre', genre);
      if (country) p.set('countryCode', country);
      if (keyword) p.set('keyword', keyword);
      const res = await fetch(`/api/ticketmaster/events?${p}`);
      const data = await res.json();
      setEvents(data.events || []);
      setPageInfo(data.page || { number: 0, size: 20, totalElements: 0, totalPages: 0 });
    } catch { setEvents([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setCurrentPage(0);
    fetchEvents(activeGenre, activeCountry, searchQuery, 0);
  }, [activeGenre, activeCountry, searchQuery, fetchEvents]);


  /* 검색 완료 시 결과로 자동 스크롤 */
  useEffect(() => {
    if (!loading && pendingScrollRef.current) {
      pendingScrollRef.current = false;
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [loading]);

  function handleSearch() {
    pendingScrollRef.current = true;
    setSearchQuery(inputValue);
    setShowSuggestions(false);
    setCurrentPage(0);
  }
  function handleClear() {
    setInputValue('');
    setSearchQuery('');
    setCurrentPage(0);
  }

  const handlePage = (p: number) => {
    setCurrentPage(p);
    fetchEvents(activeGenre, activeCountry, searchQuery, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const countryObj = COUNTRIES.find(c => c.code === activeCountry) || COUNTRIES[0];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* ── HERO (Attractions 도시 페이지 동일 구조) ── */}
      <section className="relative h-[400px] flex flex-col justify-end pb-10">
        {/* Background */}
        <img
          src={HERO_PHOTO}
          alt="Music concerts"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

        <div className="relative z-10 max-w-[1280px] mx-auto px-4 w-full">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-white/60 mb-3">
            <span className="text-white/90">Music</span>
            <span>›</span>
            <span className="text-white/60">Ticketmaster</span>
          </div>

          {/* Title */}
          <h1 className="text-[42px] sm:text-[52px] font-extrabold text-white mb-2 leading-tight">
            🎵 Live Music Events
          </h1>
          <p className="text-white/75 text-[15px] mb-6">
            77K+ Concerts · 30 Countries · Real-time Ticketmaster Data
          </p>

          {/* Search bar */}
          <div ref={searchRef} className="relative max-w-[560px]">
            <div className="flex items-center bg-white rounded-xl shadow-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#2B7FFF]">
              <svg className="ml-4 flex-shrink-0 text-[#94A3B8]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearch();
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
                placeholder="Search concerts, artists, venues..."
                className="flex-1 px-3 py-3.5 text-[#0F172A] text-[15px] outline-none placeholder:text-[#94A3B8] bg-transparent"
              />
              {inputValue && (
                <button onClick={handleClear}
                  className="flex-shrink-0 w-6 h-6 mr-2 flex items-center justify-center rounded-full bg-[#E5E7EB] text-[#64748B] hover:bg-[#CBD5E1] text-[14px] leading-none">
                  ×
                </button>
              )}
              <button onClick={handleSearch}
                className="flex-shrink-0 m-1.5 px-5 py-2.5 rounded-lg bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white text-[14px] font-semibold transition-colors whitespace-nowrap">
                Search
              </button>
            </div>

            {/* Autocomplete */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden z-50">
                {suggestions.map((title, i) => (
                  <button key={i}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { setInputValue(title); setSearchQuery(title); setShowSuggestions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F1F5F9] transition-colors border-b border-[#F1F5F9] last:border-0">
                    <svg className="text-[#94A3B8] flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <span className="text-[14px] text-[#0F172A] line-clamp-1">{title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Country filter row ── */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <ScrollRow className="py-3">
            {COUNTRIES.map(c => (
              <button key={c.code}
                onClick={() => { setActiveCountry(c.code); setCurrentPage(0); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all ${
                  activeCountry === c.code
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#374151] hover:bg-[#E2E8F0]'
                }`}>
                <span>{c.flag}</span>
                <span>{c.name}</span>
                <span className={`text-[10px] ${activeCountry === c.code ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                  {formatCount(c.count)}
                </span>
              </button>
            ))}
          </ScrollRow>
        </div>
      </div>

      {/* ── Genre filter row ── */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <ScrollRow className="py-3">
            {MUSIC_GENRES.map(g => (
              <button key={g.key}
                onClick={() => { setActiveGenre(g.key); setCurrentPage(0); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all border ${
                  activeGenre === g.key
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                    : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#0F172A]/30 hover:bg-[#F1F5F9]'
                }`}>
                <span>{g.icon}</span>
                <span>{g.label}</span>
                <span className={`text-[10px] font-medium ${activeGenre === g.key ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                  {formatCount(g.count)}
                </span>
              </button>
            ))}
          </ScrollRow>
        </div>
      </div>

      {/* ── Content ── */}
      <div ref={resultsRef} className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
        {/* 검색 결과 표시 */}
        {searchQuery && (
          <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px]">
            <svg className="text-[#2B7FFF]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <span className="text-[13px] text-[#1D4ED8] font-semibold">검색: &ldquo;{searchQuery}&rdquo;</span>
            <button onClick={handleClear} className="ml-auto text-[12px] text-[#2B7FFF] hover:text-[#1D4ED8] font-semibold">
              Clear ×
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="text-[13px] text-[#6B7280]">
            {!loading && pageInfo.totalElements > 0 && (
              <>
                <span className="font-semibold text-[#171717]">{countryObj.flag} {countryObj.name}</span>
                {' · '}총{' '}
                <span className="font-semibold text-[#171717]">{pageInfo.totalElements.toLocaleString()}</span>개 이벤트
                {' · '}페이지{' '}
                <span className="font-semibold text-[#171717]">{pageInfo.number + 1}</span> / {pageInfo.totalPages.toLocaleString()}
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
            <span>Powered by</span><span className="font-bold text-[#026CDF]">Ticketmaster</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] animate-pulse">
                <div className="aspect-[16/9] bg-[#E5E7EB]" />
                <div className="p-4 space-y-2"><div className="h-4 bg-[#E5E7EB] rounded w-3/4" /><div className="h-3 bg-[#E5E7EB] rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎵</p>
            <p className="text-[#374151] font-semibold">이벤트가 없습니다</p>
            <p className="text-[#94A3B8] text-[13px] mt-1">
              {searchQuery ? `"${searchQuery}" 검색 결과 없음` : '다른 국가나 장르를 선택해보세요'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {events.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}

        {/* Pagination */}
        {!loading && pageInfo.totalPages > 1 && (
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
    </div>
  );
}
