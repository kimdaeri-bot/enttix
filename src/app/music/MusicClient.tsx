'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface TmEvent {
  id: string; name: string; url: string; imageUrl: string;
  date: string; time: string; venueName: string; city: string;
  country: string; minPrice: number | null; currency: string;
  genre: string; subGenre: string; venueImageUrl?: string;
}
interface PageInfo { number: number; size: number; totalElements: number; totalPages: number; }


// 장르별 플레이스홀더 (이미지 없거나 로드 실패 시 CSS 그라데이션)
const GENRE_PLACEHOLDER: Record<string, { bg: string; icon: string }> = {
  'rock':        { bg: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', icon: '🎸' },
  'pop':         { bg: 'linear-gradient(135deg,#6a11cb 0%,#2575fc 100%)',             icon: '🎤' },
  'country':     { bg: 'linear-gradient(135deg,#8B6914 0%,#C4902C 50%,#6B4F12 100%)', icon: '🤠' },
  'alternative': { bg: 'linear-gradient(135deg,#2d3436 0%,#636e72 100%)',             icon: '🎶' },
  'hiphop':      { bg: 'linear-gradient(135deg,#000000 0%,#434343 100%)',             icon: '🎧' },
  'metal':       { bg: 'linear-gradient(135deg,#200122 0%,#6f0000 100%)',             icon: '🤘' },
  'folk':        { bg: 'linear-gradient(135deg,#56ab2f 0%,#a8e063 100%)',             icon: '🪕' },
  'jazz':        { bg: 'linear-gradient(135deg,#1a0533 0%,#2d1b69 50%,#11998e 100%)', icon: '🎷' },
  'classical':   { bg: 'linear-gradient(135deg,#2c3e50 0%,#4a5568 100%)',             icon: '🎻' },
  'soul':        { bg: 'linear-gradient(135deg,#833ab4 0%,#fd1d1d 50%,#fcb045 100%)', icon: '🎼' },
  'electronic':  { bg: 'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)', icon: '🎛️' },
  'latin':       { bg: 'linear-gradient(135deg,#f7971e 0%,#ffd200 100%)',             icon: '💃' },
  'default':     { bg: 'linear-gradient(135deg,#1E3A8A 0%,#2B7FFF 100%)',             icon: '🎵' },
};

function getGenrePlaceholder(genre: string, subGenre: string) {
  const key = (genre || subGenre || '').toLowerCase().replace(/[^a-z]/g, '');
  for (const [k, v] of Object.entries(GENRE_PLACEHOLDER)) {
    if (key.includes(k)) return v;
  }
  return GENRE_PLACEHOLDER['default'];
}

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

/* ── 달력 피커 ── */
const CAL_WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const CAL_MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];

function CalendarPicker({
  startDate, endDate, onApply, onClear,
}: {
  startDate: string | null; endDate: string | null;
  onApply: (start: string, end: string | null) => void;
  onClear: () => void;
}) {
  const [open,      setOpen]      = useState(false);
  const [tempStart, setTempStart] = useState<string | null>(startDate);
  const [tempEnd,   setTempEnd]   = useState<string | null>(endDate);
  const [hover,     setHover]     = useState<string | null>(null);
  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const ref = useRef<HTMLDivElement>(null);
  const today = now.toISOString().slice(0, 10);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay    = new Date(calYear, calMonth, 1).getDay();

  const handleDay = (d: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(d); setTempEnd(null);
    } else {
      if (d === tempStart) { setTempEnd(null); }
      else if (d < tempStart) { setTempEnd(tempStart); setTempStart(d); }
      else { setTempEnd(d); }
    }
  };

  const isInRange = (d: string) => {
    const hi = tempEnd || hover;
    if (!tempStart || !hi) return false;
    const [lo, h] = tempStart <= hi ? [tempStart, hi] : [hi, tempStart];
    return d > lo && d < h;
  };

  const prevM = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); };
  const nextM = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); };

  const handleApply = () => { if (tempStart) { onApply(tempStart, tempEnd); setOpen(false); } };
  const handleClear = () => { setTempStart(null); setTempEnd(null); onClear(); setOpen(false); };

  const btnLabel = startDate && endDate
    ? `${startDate.slice(5).replace('-','/')} – ${endDate.slice(5).replace('-','/')}`
    : startDate ? startDate.slice(5).replace('-','/')
    : '🗓️  Date';

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold border transition-all ${
          startDate
            ? 'bg-[#2B7FFF] text-white border-[#2B7FFF] shadow-sm'
            : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#2B7FFF]/40 hover:bg-[#EFF6FF] hover:text-[#2B7FFF]'
        }`}
      >
        {btnLabel}
        {startDate && (
          <span
            onMouseDown={e => { e.stopPropagation(); handleClear(); }}
            className="ml-0.5 font-bold text-[15px] leading-none opacity-70 hover:opacity-100"
          >×</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-4 w-[272px]">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevM} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="text-[14px] font-bold text-[#0F172A]">{CAL_MONTHS[calMonth]} {calYear}</span>
            <button onClick={nextM} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {CAL_WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-[#94A3B8] py-1">{d}</div>
            ))}
          </div>
          {/* Day grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const d = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isPast   = d < today;
              const isS      = d === tempStart;
              const isE      = d === tempEnd;
              const inRange  = isInRange(d);
              const isHov    = !tempEnd && hover === d && !isPast;
              return (
                <button
                  key={d}
                  onClick={() => !isPast && handleDay(d)}
                  onMouseEnter={() => { if (!isPast && tempStart && !tempEnd) setHover(d); }}
                  onMouseLeave={() => setHover(null)}
                  disabled={isPast}
                  className={[
                    'h-9 text-[12px] font-medium transition-colors rounded-lg',
                    isPast   ? 'text-[#CBD5E1] cursor-default' : '',
                    isS || isE ? 'bg-[#2B7FFF] text-white' : '',
                    inRange  ? 'bg-[#DBEAFE] text-[#1D4ED8] rounded-none' : '',
                    isHov    ? 'bg-[#EFF6FF] text-[#2B7FFF]' : '',
                    (!isPast && !isS && !isE && !inRange && !isHov) ? 'hover:bg-[#F1F5F9] text-[#0F172A]' : '',
                  ].join(' ')}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
            <p className="text-[11px] text-[#94A3B8] mb-2 text-center">
              {!tempStart ? 'Select start date'
                : !tempEnd ? `${tempStart}  ·  select end date (optional)`
                : `${tempStart}  →  ${tempEnd}`}
            </p>
            <div className="flex gap-2">
              <button onClick={handleClear} className="flex-1 py-2 rounded-xl border border-[#E5E7EB] text-[12px] text-[#64748B] hover:bg-[#F1F5F9] transition-colors font-semibold">
                Clear
              </button>
              <button onClick={handleApply} disabled={!tempStart}
                className="flex-1 py-2 rounded-xl bg-[#2B7FFF] text-white text-[12px] font-bold hover:bg-[#1D6AE5] disabled:opacity-40 transition-colors">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(d: string) {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatCount(n: number) { return n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n); }

/* ── 가로 스크롤 + 화살표 (JS hover state 방식) ── */
function ScrollRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  };
  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center text-[#374151] hover:bg-[#F1F5F9] transition-opacity ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-label="Scroll left"
        tabIndex={-1}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
        {children}
      </div>
      <button
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center text-[#374151] hover:bg-[#F1F5F9] transition-opacity ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-label="Scroll right"
        tabIndex={-1}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  );
}

/* ── 이벤트 카드 ── */
function EventCard({ event }: { event: TmEvent }) {
  const placeholder = getGenrePlaceholder(event.genre, event.subGenre);
  const [imgErr, setImgErr] = useState(false);
  const sym = event.currency === 'GBP' ? '£' : event.currency === 'EUR' ? '€' : '$';
  return (
    <a href={event.url || '#'} target="_blank" rel="noopener noreferrer"
      className="group bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:border-[#2B7FFF]/30 transition-all duration-200 flex flex-col">
      <div className="relative aspect-[16/9] overflow-hidden flex-shrink-0">
        {!imgErr && event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2 group-hover:scale-105 transition-transform duration-300"
            style={{ background: placeholder.bg }}
          >
            <span className="text-3xl opacity-80">{placeholder.icon}</span>
            <span className="text-[11px] font-semibold text-white/70 tracking-wide uppercase">
              {event.subGenre && event.subGenre !== 'Undefined' ? event.subGenre : (event.genre || 'Music')}
            </span>
          </div>
        )}
        {event.subGenre && event.subGenre !== 'Undefined' && !imgErr && event.imageUrl && (
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
            View Details
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </div>
      </div>
    </a>
  );
}

/* ══════════════════════════════════════════════════════ */
export default function MusicClient() {
  const [activeGenre,   setActiveGenre]   = useState('');
  const [activeCountry, setActiveCountry] = useState('');
  const [calStartDate,  setCalStartDate]  = useState<string | null>(null);
  const [calEndDate,    setCalEndDate]    = useState<string | null>(null);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [inputValue,       setInputValue]       = useState('');
  const [showSuggestions,  setShowSuggestions]  = useState(false);
  const [events,           setEvents]           = useState<TmEvent[]>([]);
  const [pageInfo,         setPageInfo]         = useState<PageInfo>({ number: 0, size: 20, totalElements: 0, totalPages: 0 });
  const [loading,          setLoading]          = useState(true);
  const [currentPage,      setCurrentPage]      = useState(0);

  const searchRef  = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  /* 외부 클릭 시 자동완성 닫기 */
  useEffect(() => {
    const onOut = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);

  /* 자동완성: 현재 로드된 이벤트 이름에서 매칭 (2글자+, 최대 7개) */
  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.length < 2) return [];
    const q = inputValue.toLowerCase();
    return events.map(e => e.name).filter(n => n.toLowerCase().includes(q)).slice(0, 7);
  }, [inputValue, events]);

  /* API 호출 — 완료 시 scroll 여부 결정 */
  const fetchEvents = useCallback(async (
    genre: string, country: string, keyword: string, page: number,
    shouldScroll = false, dateStart: string | null = null, dateEnd: string | null = null
  ) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ tab: 'music', page: String(page), size: '50' });
      if (genre)   p.set('genre', genre);
      if (country) p.set('countryCode', country);
      if (keyword) p.set('keyword', keyword);
      // 날짜 범위: startDate 선택 시 TM API startDateTime 오버라이드
      if (dateStart) p.set('startDate', dateStart);
      // endDate: 단일 날짜면 같은 날 끝, 범위면 endDate
      if (dateStart) {
        const endIso = `${dateEnd || dateStart}T23:59:59Z`;
        p.set('endDateTime', endIso);
      }
      const res  = await fetch(`/api/ticketmaster/events?${p}`);
      const data = await res.json();
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const raw: TmEvent[] = (data.events || []).filter(
        (e: TmEvent) => !e.date || e.date >= today  // 날짜 없는 것 포함, 지난 것 제외
      );

      // 같은 이미지 → 삭제 아님, 해당 이벤트만 venue 이미지로 교체
      // Ticketmaster _RETINA_PORTRAIT 등 suffix 제거해 "기본 이미지 ID" 추출
      const seenImg = new Set<string>();
      const fixed = raw.map(e => {
        const normUrl = e.imageUrl
          .replace(/_(RETINA|TABLET|REINA|STANDARD|CUSTOM)_[A-Z0-9_]+\.(jpg|jpeg|png|webp)$/i, '');
        if (normUrl && seenImg.has(normUrl)) {
          // 중복 이미지 → venue 이미지로 교체 (없으면 빈 문자열 → 기본 이모지 폴백)
          return { ...e, imageUrl: e.venueImageUrl || '' };
        }
        if (normUrl) seenImg.add(normUrl);
        return e;
      });
      setEvents(fixed.slice(0, 24)); // 최대 24개 표시
      setPageInfo(data.page || { number: 0, size: 24, totalElements: 0, totalPages: 0 });
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      if (shouldScroll) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }
  }, []);

  /* 초기 및 필터 변경 시 로드 (스크롤 없음) */
  useEffect(() => {
    setCurrentPage(0);
    fetchEvents(activeGenre, activeCountry, searchQuery, 0, false, calStartDate, calEndDate);
  }, [activeGenre, activeCountry, calStartDate, calEndDate, fetchEvents]);

  /* 검색 실행 */
  function execSearch(keyword: string) {
    setSearchQuery(keyword);
    setShowSuggestions(false);
    setCurrentPage(0);
    fetchEvents(activeGenre, activeCountry, keyword, 0, true, calStartDate, calEndDate);
  }

  function handleSearch() { execSearch(inputValue); }
  function handleSelectSuggestion(title: string) { setInputValue(title); execSearch(title); }

  function handleClear() {
    setInputValue('');
    setSearchQuery('');
    setCurrentPage(0);
    fetchEvents(activeGenre, activeCountry, '', 0, false, calStartDate, calEndDate);
  }

  const handlePage = (p: number) => {
    setCurrentPage(p);
    fetchEvents(activeGenre, activeCountry, searchQuery, p, false, calStartDate, calEndDate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* 달력 날짜 적용 */
  const handleDateApply = (start: string, end: string | null) => {
    setCalStartDate(start);
    setCalEndDate(end);
    setCurrentPage(0);
    // useEffect가 calStartDate/calEndDate 변경을 감지해 자동 refetch
  };
  const handleDateClear = () => {
    setCalStartDate(null);
    setCalEndDate(null);
    setCurrentPage(0);
  };

  const countryObj = COUNTRIES.find(c => c.code === activeCountry) || COUNTRIES[0];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* ── HERO ── */}
      <section className="relative h-[400px] flex flex-col justify-end pb-10">
        <img src={HERO_PHOTO} alt="Music concerts" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

        <div className="relative z-10 max-w-[1280px] mx-auto px-4 w-full">
          <div className="flex items-center gap-1.5 text-[12px] text-white/60 mb-3">
            <span className="text-white/90">Music</span>
            <span>›</span>
            <span className="text-white/60">Ticketmaster</span>
          </div>
          <h1 className="text-[42px] sm:text-[52px] font-extrabold text-white mb-2 leading-tight">
            🎵 Live Music Events
          </h1>
          <p className="text-white/75 text-[15px] mb-6">
            77K+ Concerts · 30 Countries · Real-time Ticketmaster Data
          </p>

          {/* 검색바 */}
          <div ref={searchRef} className="relative w-full max-w-[560px]">
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
                className="flex-shrink-0 m-1.5 px-4 py-2.5 rounded-lg bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white text-[13px] sm:text-[14px] sm:px-5 font-semibold transition-colors whitespace-nowrap">
                Search
              </button>
            </div>

            {/* 자동완성 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden z-50">
                {suggestions.map((title, i) => (
                  <button key={i}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(title)}
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

      {/* ── Country filter ── */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <ScrollRow className="py-3">
            {COUNTRIES.map(c => (
              <button key={c.code}
                onClick={() => { setActiveCountry(c.code); setCurrentPage(0); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all ${
                  activeCountry === c.code ? 'bg-[#0F172A] text-white shadow-sm' : 'bg-[#F1F5F9] text-[#374151] hover:bg-[#E2E8F0]'
                }`}>
                <span>{c.flag}</span>
                <span>{c.name}</span>
                <span className={`text-[10px] ${activeCountry === c.code ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{formatCount(c.count)}</span>
              </button>
            ))}
          </ScrollRow>
        </div>
      </div>

      {/* ── Genre filter ── */}
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
                <span className={`text-[10px] font-medium ${activeGenre === g.key ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{formatCount(g.count)}</span>
              </button>
            ))}
          </ScrollRow>
        </div>
      </div>

      {/* ── Date filter ── */}
      <div className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-2.5 flex items-center gap-3">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider flex-shrink-0">Date</span>
          <CalendarPicker
            startDate={calStartDate}
            endDate={calEndDate}
            onApply={handleDateApply}
            onClear={handleDateClear}
          />
          {calStartDate && (
            <span className="text-[12px] text-[#64748B]">
              {calStartDate && calEndDate
                ? `Events from ${calStartDate} to ${calEndDate}`
                : `Events on ${calStartDate}`}
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div ref={resultsRef} className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">

        {searchQuery && (
          <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px]">
            <svg className="text-[#2B7FFF] flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
            {Array.from({ length: 24 }).map((_, i) => (
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
