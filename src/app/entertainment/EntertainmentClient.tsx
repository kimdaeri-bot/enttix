'use client';
import { useState, useEffect, useCallback } from 'react';

interface TmEvent {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  date: string;
  time: string;
  venueName: string;
  city: string;
  country: string;
  minPrice: number | null;
  currency: string;
  genre: string;
  subGenre: string;
}

interface PageInfo {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const TABS = [
  { key: 'arts',   label: '🎭 Arts & Theatre' },
  { key: 'music',  label: '🎵 Music' },
  { key: 'sports', label: '🏆 Sports' },
];

// Sports 리그 필터
const LEAGUES = [
  { key: '',    label: 'All Sports',       icon: '🏆', count: 26546 },
  { key: 'mlb', label: 'MLB',              icon: '⚾', count: 8096  },
  { key: 'nba', label: 'NBA',              icon: '🏀', count: 1959  },
  { key: 'nhl', label: 'NHL',              icon: '🏒', count: 1513  },
  { key: 'mls', label: 'MLS',              icon: '⚽', count: 913   },
  { key: 'nfl', label: 'NFL',              icon: '🏈', count: 552   },
];

// Music 장르 필터
const MUSIC_GENRES = [
  { key: '',            label: 'All Music',       icon: '🎵', count: 76601 },
  { key: 'rock',        label: 'Rock',             icon: '🎸', count: 20250 },
  { key: 'pop',         label: 'Pop',              icon: '🎤', count: 7873  },
  { key: 'country',     label: 'Country',          icon: '🤠', count: 3551  },
  { key: 'alternative', label: 'Alternative',      icon: '🎶', count: 3186  },
  { key: 'hiphop',      label: 'Hip-Hop/Rap',      icon: '🎧', count: 2794  },
  { key: 'metal',       label: 'Metal',            icon: '🤘', count: 2194  },
  { key: 'folk',        label: 'Folk',             icon: '🪕', count: 1826  },
  { key: 'jazz',        label: 'Jazz',             icon: '🎷', count: 1789  },
  { key: 'electronic',  label: 'Dance/Electronic', icon: '🎛️', count: 1749  },
  { key: 'blues',       label: 'Blues',            icon: '🎺', count: 1179  },
  { key: 'latin',       label: 'Latin',            icon: '💃', count: 1027  },
  { key: 'classical',   label: 'Classical',        icon: '🎻', count: 900   },
  { key: 'reggae',      label: 'Reggae',           icon: '🌴', count: 486   },
];

// Arts & Theatre 장르 필터
const ARTS_GENRES = [
  { key: '',          label: 'All Arts',           icon: '🎭', count: 139714 },
  { key: 'theatre',   label: 'Theatre',            icon: '🎭', count: 35040  },
  { key: 'comedy',    label: 'Comedy',             icon: '😂', count: 13192  },
  { key: 'fineart',   label: 'Fine Art',           icon: '🖼️', count: 4935   },
  { key: 'circus',    label: 'Circus & Acrobatics',icon: '🎪', count: 2789   },
  { key: 'magic',     label: 'Magic & Illusion',   icon: '🎩', count: 2316   },
  { key: 'variety',   label: 'Variety',            icon: '✨', count: 1206   },
  { key: 'cultural',  label: 'Cultural',           icon: '🌏', count: 1492   },
  { key: 'dance',     label: 'Dance',              icon: '💃', count: 1332   },
  { key: 'childrens', label: "Children's",         icon: '🧒', count: 1071   },
  { key: 'classical', label: 'Classical',          icon: '🎻', count: 923    },
];

// Ticketmaster 지원 국가 (이벤트 수 기준 정렬)
const COUNTRIES = [
  { code: '', name: 'All', flag: '🌏' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
];

// 이벤트 수 (국가별 표시용 - 전체 기준)
const COUNTRY_COUNTS: Record<string, number> = {
  '': 280452,
  US: 171736, GB: 39848, CA: 12887, AU: 11631, IE: 3295,
  MX: 2684, NL: 2122, DE: 1947, ES: 1730, TR: 1563,
  NZ: 1518, BE: 1184, DK: 773, PL: 736, IT: 678,
  JP: 641, NO: 442, CH: 378, CZ: 369, SE: 314,
  FI: 220, ZA: 218, AT: 132, SG: 116, BR: 77,
  PE: 29, LU: 7, FR: 5, CL: 3, GR: 1,
};

function formatDate(dateStr: string) {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number | null, currency: string) {
  if (amount === null || amount === 0) return 'See prices';
  const sym = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency + ' ';
  return `From ${sym}${amount.toFixed(0)}`;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

function EventCard({ event }: { event: TmEvent }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:border-[#2B7FFF]/30 transition-all duration-200 flex flex-col"
    >
      {/* 이미지 */}
      <div className="relative aspect-[16/9] bg-[#E5E7EB] overflow-hidden flex-shrink-0">
        {!imgErr && event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-30">🎬</span>
          </div>
        )}
        {event.genre && event.genre !== 'Undefined' && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.5px] text-white bg-black/60 backdrop-blur-sm">
              {event.genre}
            </span>
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[14px] font-bold text-[#171717] leading-[20px] mb-2 line-clamp-2 group-hover:text-[#2B7FFF] transition-colors">
          {event.name}
        </h3>

        <div className="flex flex-col gap-1 mb-3 flex-1">
          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            {formatDate(event.date)}{event.time ? ` · ${event.time.slice(0, 5)}` : ''}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="truncate">
              {[event.venueName, event.city].filter(Boolean).join(', ')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-[14px] font-bold text-[#171717]">
            {formatCurrency(event.minPrice, event.currency)}
          </span>
          <span className="flex items-center gap-1 text-[12px] font-semibold text-[#2B7FFF] group-hover:gap-2 transition-all">
            Buy Tickets
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}

export default function EntertainmentClient() {
  const [activeTab, setActiveTab] = useState('arts');
  const [activeCountry, setActiveCountry] = useState('GB');
  const [activeLeague, setActiveLeague] = useState('');  // sports 전용
  const [activeGenre, setActiveGenre]   = useState('');  // music/arts 전용
  const [events, setEvents] = useState<TmEvent[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ number: 0, size: 20, totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const fetchEvents = useCallback(async (
    tab: string, countryCode: string, league: string, genre: string, page: number
  ) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ tab, page: String(page), size: '20' });
      if (countryCode) params.set('countryCode', countryCode);
      if (tab === 'sports' && league) params.set('league', league);
      if ((tab === 'music' || tab === 'arts') && genre) params.set('genre', genre);
      const res = await fetch(`/api/ticketmaster/events?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(data.events || []);
      setPageInfo(data.page || { number: 0, size: 20, totalElements: 0, totalPages: 0 });
    } catch (e) {
      setError('이벤트를 불러오는데 실패했습니다.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(0);
    fetchEvents(activeTab, activeCountry, activeLeague, activeGenre, 0);
  }, [activeTab, activeCountry, activeLeague, activeGenre, fetchEvents]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchEvents(activeTab, activeCountry, activeLeague, activeGenre, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCountryObj = COUNTRIES.find(c => c.code === activeCountry) || COUNTRIES[0];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* 히어로 + 탭 */}
      <div className="bg-[#0F172A]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 pt-10 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-bold text-[#2B7FFF] tracking-[1.5px]">TICKETMASTER</span>
            <span className="text-[12px] text-[#475569]">·</span>
            <span className="text-[12px] text-[#475569]">Global Events</span>
          </div>
          <h1 className="text-[32px] md:text-[48px] font-extrabold text-white tracking-[-1px] mb-2">
            Entertainment
          </h1>
          <p className="text-[14px] text-[#94A3B8] mb-6">
            30개국 · {formatCount(COUNTRY_COUNTS[''])}+ 이벤트 — 실시간 Ticketmaster 데이터
          </p>
        </div>

        {/* 카테고리 탭 */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setActiveLeague('');
                  setActiveGenre('');
                  setCurrentPage(0);
                }}
                className={`flex-shrink-0 px-5 py-3 text-[14px] font-semibold rounded-t-[10px] transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#F5F7FA] text-[#171717]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 국가 선택 바 */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {COUNTRIES.map(country => (
              <button
                key={country.code}
                onClick={() => { setActiveCountry(country.code); setCurrentPage(0); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all ${
                  activeCountry === country.code
                    ? 'bg-[#2B7FFF] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#374151] hover:bg-[#E2E8F0]'
                }`}
              >
                <span className="text-[14px]">{country.flag}</span>
                <span>{country.name}</span>
                {COUNTRY_COUNTS[country.code] && (
                  <span className={`text-[10px] ${activeCountry === country.code ? 'text-white/80' : 'text-[#9CA3AF]'}`}>
                    {formatCount(COUNTRY_COUNTS[country.code])}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 서브카테고리 필터 바 (탭별 다르게 표시) */}
      {(() => {
        let items: { key: string; label: string; icon: string; count: number }[] = [];
        let activeKey = '';
        let onSelect: (key: string) => void = () => {};

        if (activeTab === 'sports') {
          items = LEAGUES;
          activeKey = activeLeague;
          onSelect = (k) => { setActiveLeague(k); setCurrentPage(0); };
        } else if (activeTab === 'music') {
          items = MUSIC_GENRES;
          activeKey = activeGenre;
          onSelect = (k) => { setActiveGenre(k); setCurrentPage(0); };
        } else if (activeTab === 'arts') {
          items = ARTS_GENRES;
          activeKey = activeGenre;
          onSelect = (k) => { setActiveGenre(k); setCurrentPage(0); };
        }

        return (
          <div className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <div className="max-w-[1280px] mx-auto px-4 md:px-10">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
                {items.map(item => (
                  <button
                    key={item.key}
                    onClick={() => onSelect(item.key)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all border ${
                      activeKey === item.key
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                        : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#0F172A]/30 hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <span className="text-[15px]">{item.icon}</span>
                    <span>{item.label}</span>
                    <span className={`text-[10px] font-medium ${activeKey === item.key ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                      {formatCount(item.count)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 컨텐츠 */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
        {/* 상단 정보 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-[13px] text-[#6B7280]">
            {!loading && pageInfo.totalElements > 0 && (
              <>
                <span className="font-semibold text-[#171717]">{activeCountryObj.flag} {activeCountryObj.name}</span>
                {' · '}총{' '}
                <span className="font-semibold text-[#171717]">{pageInfo.totalElements.toLocaleString()}</span>개 이벤트
                {' · '}페이지{' '}
                <span className="font-semibold text-[#171717]">{pageInfo.number + 1}</span> / {pageInfo.totalPages.toLocaleString()}
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
            <span>Powered by</span>
            <span className="font-bold text-[#026CDF]">Ticketmaster</span>
          </div>
        </div>

        {/* 로딩 스켈레톤 */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] animate-pulse">
                <div className="aspect-[16/9] bg-[#E5E7EB]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#E5E7EB] rounded w-3/4" />
                  <div className="h-3 bg-[#E5E7EB] rounded w-1/2" />
                  <div className="h-3 bg-[#E5E7EB] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div className="text-center py-20 text-[#EF4444]">{error}</div>
        )}

        {/* 이벤트 그리드 */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* 빈 결과 */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[48px] mb-4">🎭</p>
            <p className="text-[#374151] font-semibold text-[16px] mb-2">이벤트가 없습니다</p>
            <p className="text-[#94A3B8] text-[13px]">다른 국가나 카테고리를 선택해보세요</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && pageInfo.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
              className="px-3 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[12px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              «
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[13px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Prev
            </button>

            {/* 페이지 번호 (최대 5개) */}
            {Array.from({ length: Math.min(5, pageInfo.totalPages) }, (_, i) => {
              const start = Math.max(0, Math.min(currentPage - 2, pageInfo.totalPages - 5));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-9 h-9 rounded-[8px] text-[13px] font-semibold transition-colors ${
                    p === currentPage
                      ? 'bg-[#2B7FFF] text-white'
                      : 'border border-[#E5E7EB] text-[#374151] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {p + 1}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pageInfo.totalPages - 1}
              className="px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[13px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button
              onClick={() => handlePageChange(pageInfo.totalPages - 1)}
              disabled={currentPage >= pageInfo.totalPages - 1}
              className="px-3 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[12px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
