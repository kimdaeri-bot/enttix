'use client';
import { useState, useEffect, use } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface Performance {
  PerformanceId: number;
  PerformanceDate: string;
  TotalAvailableTickesCount: number;
  MinimumTicketPrice: number;
  DirectlyBookablePerformance: boolean;
}

interface LTDEvent {
  EventId: number;
  Name: string;
  Description: string;
  TagLine: string;
  MainImageUrl: string;
  DetailImageUrl: string;
  RunningTime: string;
  EventMinimumPrice: number;
  AgeRating: number;
  MinimumAge: string;
  ImportantNotice: string;
  StartDate: string;
  EndDate: string;
  Images: { Url: string; Width: number; Height: number }[];
  MultimediaContent: { Type: number; Url: string }[];
  Cast: { Name: string; Description: string }[];
}

export default function MusicalEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<LTDEvent | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch(`/api/ltd/event/${id}`)
      .then(r => r.json())
      .then(d => {
        setEvent(d.event);
        // Sort performances by date, upcoming only
        const now = new Date();
        const upcoming = (d.performances || [])
          .filter((p: Performance) => new Date(p.PerformanceDate) >= now)
          .sort((a: Performance, b: Performance) => new Date(a.PerformanceDate).getTime() - new Date(b.PerformanceDate).getTime());
        setPerformances(upcoming);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <div className="flex justify-center py-24"><div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin"/></div>
    </main>
  );

  if (!event) return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <div className="text-center py-24 text-[#94A3B8]">공연을 찾을 수 없습니다.</div>
    </main>
  );

  const displayPerfs = showAll ? performances : performances.slice(0, 8);
  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
  const youtubeUrl = event.MultimediaContent?.find(m => m.Type === 0)?.Url;

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Hero */}
      <div className="relative bg-[#0F172A] overflow-hidden">
        <Header hideSearch />
        {event.DetailImageUrl && (
          <div className="absolute inset-0 opacity-20">
            <img src={event.DetailImageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/60 via-transparent to-[#0F172A]" />
          </div>
        )}
        <div className="relative max-w-[1100px] mx-auto px-4 pt-8 pb-12 flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <div className="w-full md:w-[220px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-[#1E293B]">
              {event.MainImageUrl && <img src={event.MainImageUrl} alt={event.Name} className="w-full h-full object-cover" />}
            </div>
          </div>
          {/* Info */}
          <div className="flex-1 flex flex-col justify-end">
            <p className="text-[#DBEAFE] text-[11px] font-semibold tracking-wider mb-2">🎭 LONDON WEST END</p>
            <h1 className="text-[28px] md:text-[40px] font-extrabold text-white leading-tight mb-2">{event.Name}</h1>
            {event.TagLine && <p className="text-[#DBEAFE] text-[15px] opacity-80 mb-4 leading-relaxed">{event.TagLine}</p>}
            <div className="flex flex-wrap gap-3 text-[13px]">
              {event.RunningTime && <span className="bg-white/10 text-white px-3 py-1 rounded-full">⏱ {event.RunningTime}</span>}
              {event.EventMinimumPrice > 0 && <span className="bg-[#2B7FFF] text-white px-3 py-1 rounded-full font-bold">From £{event.EventMinimumPrice}</span>}
              {event.AgeRating && <span className="bg-white/10 text-white px-3 py-1 rounded-full">{event.AgeRating}+</span>}
              {performances.length > 0 && <span className="bg-[#ECFDF5] text-[#10B981] px-3 py-1 rounded-full font-semibold">{performances.length}회 공연 예약 가능</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 py-8 grid md:grid-cols-[1fr_340px] gap-8">
        {/* Left: Description + YouTube */}
        <div className="space-y-6">
          {/* Description */}
          {event.Description && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
              <h2 className="text-[18px] font-bold text-[#0F172A] mb-3">공연 소개</h2>
              <p className="text-[#374151] text-[14px] leading-relaxed whitespace-pre-line">{stripHtml(event.Description).slice(0, 800)}</p>
            </div>
          )}

          {/* YouTube trailer */}
          {youtubeUrl && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
              <h2 className="text-[18px] font-bold text-[#0F172A] mb-3">🎬 트레일러</h2>
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe src={youtubeUrl.replace('autoplay=true', 'autoplay=0')} className="w-full h-full" allowFullScreen />
              </div>
            </div>
          )}

          {/* Cast */}
          {event.Cast && event.Cast.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
              <h2 className="text-[18px] font-bold text-[#0F172A] mb-3">🎭 출연진</h2>
              <div className="flex flex-wrap gap-2">
                {event.Cast.map((c, i) => (
                  <span key={i} className="px-3 py-1.5 bg-[#F1F5F9] rounded-lg text-[13px] text-[#374151] font-medium">{c.Name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Important notice */}
          {event.ImportantNotice && (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-5">
              <p className="text-[#92400E] text-[13px] font-semibold mb-1">⚠️ 관람 안내</p>
              <p className="text-[#78350F] text-[13px] leading-relaxed">{event.ImportantNotice}</p>
            </div>
          )}
        </div>

        {/* Right: Performances / Book */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#0F172A]">공연 일정</h2>
              <span className="text-[12px] text-[#94A3B8]">{performances.length}회</span>
            </div>
            {performances.length === 0 ? (
              <div className="px-5 py-8 text-center text-[#94A3B8] text-[13px]">예약 가능한 공연이 없습니다.</div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {displayPerfs.map(p => {
                  const dt = new Date(p.PerformanceDate);
                  const days = ['일', '월', '화', '수', '목', '금', '토'];
                  const dateStr = `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,'0')}.${String(dt.getDate()).padStart(2,'0')} (${days[dt.getDay()]})`;
                  const timeStr = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
                  const avail = p.TotalAvailableTickesCount;
                  const price = p.MinimumTicketPrice;

                  return (
                    <div key={p.PerformanceId} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                      <div>
                        <p className="text-[13px] font-semibold text-[#0F172A]">{dateStr}</p>
                        <p className="text-[11px] text-[#94A3B8]">{timeStr} {avail > 0 ? `· 잔여 ${avail}석` : ''}</p>
                      </div>
                      <div className="text-right">
                        {price > 0 && <p className="text-[#2B7FFF] font-bold text-[13px]">£{price}</p>}
                        {avail > 0 && p.DirectlyBookablePerformance ? (
                          <a href={`https://www.londontheatredirect.com/DirectBooking.ashx?performanceId=${p.PerformanceId}&nbTickets=2`}
                            target="_blank" rel="noopener noreferrer"
                            className="mt-1 inline-block px-3 py-1 bg-[#2B7FFF] text-white text-[11px] font-bold rounded-lg hover:bg-[#1D6AE5] transition-colors">
                            예약
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8]">매진</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {performances.length > 8 && (
              <button onClick={() => setShowAll(!showAll)}
                className="w-full py-3 text-[13px] text-[#2B7FFF] font-semibold hover:bg-[#F8FAFC] transition-colors border-t border-[#E5E7EB]">
                {showAll ? '접기 ▲' : `전체 보기 (${performances.length}회) ▼`}
              </button>
            )}
          </div>

          {/* Back link */}
          <Link href="/musical/west-end" className="flex items-center gap-2 text-[13px] text-[#64748B] hover:text-[#2B7FFF] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            다른 공연 보기
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
