'use client';
import { useState, useEffect, useCallback } from 'react';


interface TmEvent {
  id: string; name: string; url: string; imageUrl: string;
  date: string; time: string; venueName: string; city: string;
  country: string; minPrice: number | null; currency: string;
  genre: string; subGenre: string;
}
interface PageInfo { number: number; size: number; totalElements: number; totalPages: number; }

const MUSIC_GENRES = [
  { key: '',            label: 'All Music',     icon: '🎵', count: 76601 },
  { key: 'rock',        label: 'Rock',           icon: '🎸', count: 20250 },
  { key: 'pop',         label: 'Pop',            icon: '🎤', count: 7873  },
  { key: 'country',     label: 'Country',        icon: '🤠', count: 3551  },
  { key: 'alternative', label: 'Alternative',    icon: '🎶', count: 3186  },
  { key: 'hiphop',      label: 'Hip-Hop/Rap',    icon: '🎧', count: 2794  },
  { key: 'metal',       label: 'Metal',          icon: '🤘', count: 2194  },
  { key: 'folk',        label: 'Folk',           icon: '🪕', count: 1826  },
  { key: 'jazz',        label: 'Jazz',           icon: '🎷', count: 1789  },
  { key: 'electronic',  label: 'Electronic',     icon: '🎛️', count: 1749  },
  { key: 'blues',       label: 'Blues',          icon: '🎺', count: 1179  },
  { key: 'latin',       label: 'Latin',          icon: '💃', count: 1027  },
  { key: 'classical',   label: 'Classical',      icon: '🎻', count: 900   },
  { key: 'reggae',      label: 'Reggae',         icon: '🌴', count: 486   },
];

const COUNTRIES = [
  { code: '',   name: 'All',           flag: '🌏', count: 76601 },
  { code: 'US', name: 'United States', flag: '🇺🇸', count: 45000 },
  { code: 'GB', name: 'United Kingdom',flag: '🇬🇧', count: 12000 },
  { code: 'CA', name: 'Canada',        flag: '🇨🇦', count: 5000  },
  { code: 'AU', name: 'Australia',     flag: '🇦🇺', count: 3500  },
  { code: 'DE', name: 'Germany',       flag: '🇩🇪', count: 1500  },
  { code: 'FR', name: 'France',        flag: '🇫🇷', count: 800   },
  { code: 'NL', name: 'Netherlands',   flag: '🇳🇱', count: 700   },
  { code: 'ES', name: 'Spain',         flag: '🇪🇸', count: 600   },
  { code: 'IE', name: 'Ireland',       flag: '🇮🇪', count: 500   },
  { code: 'BE', name: 'Belgium',       flag: '🇧🇪', count: 400   },
  { code: 'SE', name: 'Sweden',        flag: '🇸🇪', count: 300   },
  { code: 'NO', name: 'Norway',        flag: '🇳🇴', count: 200   },
  { code: 'DK', name: 'Denmark',       flag: '🇩🇰', count: 180   },
];

function formatDate(d: string) {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatCount(n: number) { return n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n); }

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

export default function MusicClient() {
  const [activeGenre,   setActiveGenre]   = useState('');
  const [activeCountry, setActiveCountry] = useState('GB');
  const [events,        setEvents]        = useState<TmEvent[]>([]);
  const [pageInfo,      setPageInfo]      = useState<PageInfo>({ number: 0, size: 20, totalElements: 0, totalPages: 0 });
  const [loading,       setLoading]       = useState(true);
  const [currentPage,   setCurrentPage]   = useState(0);

  const fetchEvents = useCallback(async (genre: string, country: string, page: number) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ tab: 'music', page: String(page), size: '20' });
      if (genre)   p.set('genre', genre);
      if (country) p.set('countryCode', country);
      const res = await fetch(`/api/ticketmaster/events?${p}`);
      const data = await res.json();
      setEvents(data.events || []);
      setPageInfo(data.page || { number: 0, size: 20, totalElements: 0, totalPages: 0 });
    } catch { setEvents([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { setCurrentPage(0); fetchEvents(activeGenre, activeCountry, 0); }, [activeGenre, activeCountry, fetchEvents]);

  const handlePage = (p: number) => { setCurrentPage(p); fetchEvents(activeGenre, activeCountry, p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const countryObj = COUNTRIES.find(c => c.code === activeCountry) || COUNTRIES[0];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Hero */}
      <div className="bg-[#0F172A]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 pt-10 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-bold text-[#2B7FFF] tracking-[1.5px]">TICKETMASTER</span>
            <span className="text-[12px] text-[#475569]">·</span>
            <span className="text-[12px] text-[#475569]">Live Concerts</span>
          </div>
          <h1 className="text-[32px] md:text-[48px] font-extrabold text-white tracking-[-1px] mb-2">🎵 Music</h1>
          <p className="text-[14px] text-[#94A3B8] mb-6">30개국 · 76K+ 이벤트 — 실시간 Ticketmaster 데이터</p>
        </div>
        {/* Genre tabs */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {MUSIC_GENRES.slice(0, 7).map(g => (
              <button key={g.key} onClick={() => { setActiveGenre(g.key); setCurrentPage(0); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-3 text-[14px] font-semibold rounded-t-[10px] transition-colors ${activeGenre === g.key ? 'bg-[#F5F7FA] text-[#171717]' : 'text-[#94A3B8] hover:text-white'}`}>
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

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
            {MUSIC_GENRES.map(g => (
              <button key={g.key} onClick={() => { setActiveGenre(g.key); setCurrentPage(0); }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all border ${activeGenre === g.key ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm' : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#0F172A]/30 hover:bg-[#F1F5F9]'}`}>
                <span>{g.icon}</span><span>{g.label}</span>
                <span className={`text-[10px] font-medium ${activeGenre === g.key ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{formatCount(g.count)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-[13px] text-[#6B7280]">
            {!loading && pageInfo.totalElements > 0 && (
              <><span className="font-semibold text-[#171717]">{countryObj.flag} {countryObj.name}</span>{' · '}총{' '}<span className="font-semibold text-[#171717]">{pageInfo.totalElements.toLocaleString()}</span>개 이벤트{' · '}페이지{' '}<span className="font-semibold text-[#171717]">{pageInfo.number + 1}</span> / {pageInfo.totalPages.toLocaleString()}</>
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
                <div className="aspect-[16/9] bg-[#E5E7EB]" /><div className="p-4 space-y-2"><div className="h-4 bg-[#E5E7EB] rounded w-3/4" /><div className="h-3 bg-[#E5E7EB] rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20"><p className="text-5xl mb-4">🎵</p><p className="text-[#374151] font-semibold">이벤트가 없습니다</p><p className="text-[#94A3B8] text-[13px] mt-1">다른 국가나 장르를 선택해보세요</p></div>
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
