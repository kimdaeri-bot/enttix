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
  { key: 'arts', label: '🎭 Arts & Theatre', countryCode: 'GB' },
  { key: 'music', label: '🎵 Music', countryCode: 'GB' },
  { key: 'sports', label: '🏆 Sports', countryCode: 'GB' },
];

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
        {/* 장르 배지 */}
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
          {/* 날짜 */}
          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            {formatDate(event.date)} {event.time ? `· ${event.time.slice(0, 5)}` : ''}
          </div>
          {/* 장소 */}
          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="truncate">{event.venueName ? `${event.venueName}` : event.city}{event.city && event.venueName ? `, ${event.city}` : ''}</span>
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
  const [events, setEvents] = useState<TmEvent[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ number: 0, size: 20, totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const fetchEvents = useCallback(async (tab: string, page: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/ticketmaster/events?tab=${tab}&page=${page}&size=20`);
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
    fetchEvents(activeTab, 0);
  }, [activeTab, fetchEvents]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchEvents(activeTab, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* 히어로 */}
      <div className="bg-[#0F172A] pb-0">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-bold text-[#2B7FFF] tracking-[1.5px]">TICKETMASTER</span>
          </div>
          <h1 className="text-[32px] md:text-[48px] font-extrabold text-white tracking-[-1px] mb-2">Entertainment</h1>
          <p className="text-[15px] text-[#94A3B8]">
            UK 현지 공연 · 콘서트 · 스포츠 이벤트 — Ticketmaster 실시간 데이터
          </p>
        </div>

        {/* 탭 */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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

      {/* 컨텐츠 */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
        {/* 상단 정보 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-[13px] text-[#6B7280]">
            {!loading && pageInfo.totalElements > 0 && (
              <>
                총 <span className="font-semibold text-[#171717]">{pageInfo.totalElements.toLocaleString()}</span>개 이벤트 ·{' '}
                페이지 <span className="font-semibold text-[#171717]">{pageInfo.number + 1}</span> / {pageInfo.totalPages}
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
            <span>Powered by</span>
            <span className="font-bold text-[#026CDF]">Ticketmaster</span>
          </div>
        </div>

        {/* 로딩 */}
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
            <p className="text-[#94A3B8] text-[15px]">이벤트가 없습니다.</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && pageInfo.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
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
          </div>
        )}
      </div>
    </div>
  );
}
