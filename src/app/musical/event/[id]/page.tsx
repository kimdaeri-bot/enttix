'use client';
import { useState, useEffect, use } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface Performance { PerformanceId: number; PerformanceDate: string; TotalAvailableTickesCount: number; MinimumTicketPrice: number; DirectlyBookablePerformance: boolean; }
interface Area { AreaId: number; AreaName: string; Prices: { Price: number; FaceValue: number; AvailableSeatsCount: number }[]; }
interface LTDEvent { EventId: number; Name: string; Description: string; TagLine: string; MainImageUrl: string; DetailImageUrl: string; RunningTime: string; EventMinimumPrice: number; AgeRating: number; MinimumAge: string; ImportantNotice: string; StartDate: string; EndDate: string; Images: {Url:string}[]; MultimediaContent: {Type:number;Url:string}[]; Cast: {Name:string;Description:string}[]; }

type BookingStep = 'idle' | 'areas' | 'confirm' | 'booking' | 'done';

function stripHtml(html: string) { return html.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\r\n/g,'\n').trim(); }

export default function MusicalEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<LTDEvent|null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  // Booking state
  const [selectedPerf, setSelectedPerf] = useState<Performance|null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area|null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [qty, setQty] = useState(2);
  const [bookingStep, setBookingStep] = useState<BookingStep>('idle');
  const [bookingError, setBookingError] = useState('');
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    fetch(`/api/ltd/event/${id}`)
      .then(r=>r.json())
      .then(d => {
        setEvent(d.event);
        const now = new Date();
        const up = (d.performances||[]).filter((p:Performance)=>new Date(p.PerformanceDate)>=now&&p.DirectlyBookablePerformance).sort((a:Performance,b:Performance)=>new Date(a.PerformanceDate).getTime()-new Date(b.PerformanceDate).getTime());
        setPerformances(up);
      }).finally(()=>setLoading(false));
  }, [id]);

  const selectPerformance = async (p: Performance) => {
    setSelectedPerf(p); setSelectedArea(null); setSelectedPrice(0); setBookingStep('areas'); setBookingError('');
    setAreasLoading(true);
    const r = await fetch(`/api/ltd/performance/${p.PerformanceId}/areas`);
    const d = await r.json();
    setAreas(d.areas || []);
    setAreasLoading(false);
  };

  const handleBook = async () => {
    if (!selectedPerf || !selectedArea || !selectedPrice) return;
    setBookingStep('booking'); setBookingError('');
    try {
      // 1. Create basket
      const b1 = await fetch('/api/ltd/basket?action=create', { method: 'POST' });
      const { basketId, error: e1 } = await b1.json();
      if (!basketId) throw new Error(e1||'바스켓 생성 실패');

      // 2. Add tickets
      const b2 = await fetch('/api/ltd/basket?action=add-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basketId, performanceId: selectedPerf.PerformanceId, areaId: selectedArea.AreaId, seatsCount: qty, price: selectedPrice }),
      });
      const { error: e2 } = await b2.json();
      if (e2) throw new Error(e2);

      // 3. Submit order → payment URL
      const b3 = await fetch('/api/ltd/basket?action=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basketId, affiliateId: '775854e9-b102-48d9-99bc-4b288a67b538' }),
      });
      const { paymentUrl, error: e3 } = await b3.json();
      if (e3) throw new Error(e3);
      window.location.href = paymentUrl;
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : String(err));
      setBookingStep('areas');
    }
  };

  // Group performances by month
  const now = new Date();
  const months: Record<string, Performance[]> = {};
  performances.forEach(p => {
    const d = new Date(p.PerformanceDate);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!months[key]) months[key] = [];
    months[key].push(p);
  });
  const monthKeys = Object.keys(months).sort();
  const currentMonthKey = monthKeys[monthOffset] || monthKeys[0];
  const currentMonthPerfs = months[currentMonthKey] || [];
  const KR_DAYS = ['일','월','화','수','목','금','토'];

  const youtubeUrl = event?.MultimediaContent?.find(m=>m.Type===0)?.Url;

  if (loading) return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <div className="flex justify-center py-24"><div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin"/></div>
    </main>
  );
  if (!event) return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <div className="text-center py-24 text-[#94A3B8]">공연을 찾을 수 없습니다. <Link href="/musical/west-end" className="text-[#2B7FFF]">목록으로</Link></div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Hero */}
      <div className="relative bg-[#0F172A] overflow-hidden">
        <Header hideSearch />
        {event.DetailImageUrl && <div className="absolute inset-0"><img src={event.DetailImageUrl} alt="" className="w-full h-full object-cover opacity-15"/><div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/80 to-[#0F172A]"/></div>}
        <div className="relative max-w-[1100px] mx-auto px-4 pt-8 pb-12 flex flex-col md:flex-row gap-8 items-end">
          <div className="flex-shrink-0 w-[160px] md:w-[200px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-[#1E293B]">
            {event.MainImageUrl && <img src={event.MainImageUrl} alt={event.Name} className="w-full h-full object-cover"/>}
          </div>
          <div className="flex-1">
            <span className="text-[#DBEAFE] text-[11px] font-bold tracking-widest">🎭 LONDON WEST END</span>
            <h1 className="text-[28px] md:text-[42px] font-extrabold text-white leading-tight mt-1 mb-2">{event.Name}</h1>
            {event.TagLine && <p className="text-[#94A3B8] text-[14px] mb-4 leading-relaxed max-w-[600px]">{event.TagLine}</p>}
            <div className="flex flex-wrap gap-2">
              {event.RunningTime && <span className="bg-white/10 text-white text-[12px] px-3 py-1 rounded-full">⏱ {event.RunningTime}</span>}
              {event.EventMinimumPrice>0 && <span className="bg-[#2B7FFF] text-white text-[12px] px-3 py-1 rounded-full font-bold">From £{event.EventMinimumPrice}</span>}
              {event.AgeRating && <span className="bg-white/10 text-white text-[12px] px-3 py-1 rounded-full">{event.AgeRating}+</span>}
              {performances.length>0 && <span className="bg-[#10B981] text-white text-[12px] px-3 py-1 rounded-full font-semibold">✅ 예약 가능</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 py-8 grid md:grid-cols-[1fr_360px] gap-8">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Description */}
          {event.Description && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
              <h2 className="text-[17px] font-bold text-[#0F172A] mb-3">공연 소개</h2>
              <p className="text-[#374151] text-[14px] leading-relaxed whitespace-pre-line">
                {showMore ? stripHtml(event.Description) : stripHtml(event.Description).slice(0,400)+'...'}
              </p>
              <button onClick={()=>setShowMore(!showMore)} className="mt-2 text-[13px] text-[#2B7FFF] font-semibold hover:underline">{showMore?'접기':'더보기'}</button>
            </div>
          )}

          {/* YouTube */}
          {youtubeUrl && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
              <h2 className="text-[17px] font-bold text-[#0F172A] mb-3">🎬 트레일러</h2>
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe src={youtubeUrl.replace('autoplay=true','autoplay=0')} className="w-full h-full" allowFullScreen/>
              </div>
            </div>
          )}

          {/* Cast */}
          {event.Cast && event.Cast.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
              <h2 className="text-[17px] font-bold text-[#0F172A] mb-3">🎭 출연진</h2>
              <div className="flex flex-wrap gap-2">{event.Cast.map((c,i)=><span key={i} className="px-3 py-1.5 bg-[#F1F5F9] rounded-lg text-[13px] text-[#374151]">{c.Name}</span>)}</div>
            </div>
          )}

          {/* Notice */}
          {event.ImportantNotice && (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-5">
              <p className="text-[#92400E] text-[13px] font-bold mb-1">⚠️ 관람 안내</p>
              <p className="text-[#78350F] text-[13px] leading-relaxed">{event.ImportantNotice}</p>
            </div>
          )}

          <Link href="/musical/west-end" className="inline-flex items-center gap-2 text-[13px] text-[#64748B] hover:text-[#2B7FFF]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            다른 공연 보기
          </Link>
        </div>

        {/* RIGHT — Booking Panel */}
        <div className="space-y-4">
          {/* Performance selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#0F172A]">날짜 선택</h2>
              <span className="text-[12px] text-[#94A3B8]">{performances.length}회 공연</span>
            </div>

            {performances.length === 0 ? (
              <div className="px-5 py-8 text-center text-[#94A3B8] text-[13px]">현재 예약 가능한 공연이 없습니다.</div>
            ) : (
              <>
                {/* Month nav */}
                {monthKeys.length > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[#F1F5F9] bg-[#F8FAFC]">
                    <button onClick={()=>setMonthOffset(Math.max(0,monthOffset-1))} disabled={monthOffset===0}
                      className={`p-1.5 rounded-lg ${monthOffset===0?'text-[#D1D5DB]':'text-[#2B7FFF] hover:bg-[#EFF6FF]'}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <span className="text-[13px] font-bold text-[#0F172A]">
                      {currentMonthKey ? new Date(currentMonthKey+'-01').toLocaleDateString('ko-KR',{year:'numeric',month:'long'}) : ''}
                    </span>
                    <button onClick={()=>setMonthOffset(Math.min(monthKeys.length-1,monthOffset+1))} disabled={monthOffset>=monthKeys.length-1}
                      className={`p-1.5 rounded-lg ${monthOffset>=monthKeys.length-1?'text-[#D1D5DB]':'text-[#2B7FFF] hover:bg-[#EFF6FF]'}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>
                )}

                {/* Performance list */}
                <div className="divide-y divide-[#F1F5F9] max-h-[320px] overflow-y-auto">
                  {currentMonthPerfs.map(p => {
                    const dt = new Date(p.PerformanceDate);
                    const isSelected = selectedPerf?.PerformanceId === p.PerformanceId;
                    return (
                      <button key={p.PerformanceId} onClick={()=>selectPerformance(p)}
                        className={`w-full px-5 py-3.5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors text-left ${isSelected?'bg-[#EFF6FF] border-l-2 border-[#2B7FFF]':''}`}>
                        <div>
                          <p className="text-[13px] font-semibold text-[#0F172A]">
                            {dt.getMonth()+1}월 {dt.getDate()}일 ({KR_DAYS[dt.getDay()]})
                          </p>
                          <p className="text-[11px] text-[#94A3B8]">
                            {String(dt.getHours()).padStart(2,'0')}:{String(dt.getMinutes()).padStart(2,'0')}
                            {p.TotalAvailableTickesCount>0 ? ` · 잔여 ${p.TotalAvailableTickesCount}석` : ' · 잔여석 확인 중'}
                          </p>
                        </div>
                        <div className="text-right">
                          {p.MinimumTicketPrice>0 && <p className="text-[#2B7FFF] font-bold text-[13px]">From £{p.MinimumTicketPrice}</p>}
                          {isSelected ? <span className="text-[#2B7FFF] text-[11px] font-bold">선택됨 ✓</span> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Area / Seat selection */}
          {bookingStep !== 'idle' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F1F5F9]">
                <h2 className="text-[16px] font-bold text-[#0F172A]">좌석 구역 선택</h2>
                {selectedPerf && (
                  <p className="text-[12px] text-[#94A3B8] mt-0.5">
                    {new Date(selectedPerf.PerformanceDate).toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})} · {String(new Date(selectedPerf.PerformanceDate).getHours()).padStart(2,'0')}:{String(new Date(selectedPerf.PerformanceDate).getMinutes()).padStart(2,'0')}
                  </p>
                )}
              </div>

              {areasLoading ? (
                <div className="flex justify-center py-8"><div className="w-8 h-8 rounded-full border-3 border-[#2B7FFF] border-t-transparent animate-spin"/></div>
              ) : areas.length === 0 ? (
                <div className="px-5 py-6 text-center text-[#94A3B8] text-[13px]">좌석 정보를 불러올 수 없습니다.</div>
              ) : (
                <div className="p-4 space-y-2">
                  {areas.map(area => {
                    const prices = area.Prices || [];
                    const isSelected = selectedArea?.AreaId === area.AreaId;
                    return (
                      <div key={area.AreaId} className="space-y-1">
                        {prices.map((pr, pi) => (
                          <button key={pi} onClick={()=>{setSelectedArea(area); setSelectedPrice(pr.Price);}}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                              isSelected && selectedPrice===pr.Price ? 'border-[#2B7FFF] bg-[#EFF6FF]' : 'border-[#E5E7EB] hover:border-[#2B7FFF]/40 hover:bg-[#F8FAFC]'
                            }`}>
                            <div className="text-left">
                              <p className="text-[13px] font-semibold text-[#0F172A]">{area.AreaName}</p>
                              <p className="text-[11px] text-[#94A3B8]">Face value: £{pr.FaceValue}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[15px] font-bold text-[#2B7FFF]">£{pr.Price}</p>
                              <p className="text-[10px] text-[#94A3B8]">/ 인</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quantity + Book */}
          {selectedArea && selectedPrice > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5 space-y-4">
              {/* Qty */}
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-[#0F172A]">인원</p>
                <div className="flex items-center gap-3">
                  <button onClick={()=>setQty(Math.max(1,qty-1))} className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#374151] hover:border-[#2B7FFF] hover:text-[#2B7FFF] text-lg font-bold">−</button>
                  <span className="text-[16px] font-bold text-[#0F172A] w-6 text-center">{qty}</span>
                  <button onClick={()=>setQty(Math.min(10,qty+1))} className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#374151] hover:border-[#2B7FFF] hover:text-[#2B7FFF] text-lg font-bold">+</button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#F8FAFC] rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#64748B]">{selectedArea.AreaName} × {qty}매</span>
                  <span className="font-semibold text-[#0F172A]">£{(selectedPrice * qty).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#94A3B8]">
                  <span>티켓당</span><span>£{selectedPrice}</span>
                </div>
                <div className="border-t border-[#E5E7EB] pt-1.5 flex justify-between">
                  <span className="text-[14px] font-bold text-[#0F172A]">합계</span>
                  <span className="text-[16px] font-extrabold text-[#2B7FFF]">£{(selectedPrice * qty).toFixed(2)}</span>
                </div>
              </div>

              {bookingError && <p className="text-[#EF4444] text-[12px] bg-[#FEF2F2] p-3 rounded-lg">{bookingError}</p>}

              <button onClick={handleBook} disabled={bookingStep==='booking'}
                className={`w-full py-4 rounded-xl text-[15px] font-bold transition-all ${
                  bookingStep==='booking' ? 'bg-[#94A3B8] text-white cursor-not-allowed' : 'bg-[#2B7FFF] text-white hover:bg-[#1D6AE5] active:scale-[0.98] shadow-lg shadow-[#2B7FFF]/25'
                }`}>
                {bookingStep==='booking' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/></svg>
                    결제 페이지로 이동 중...
                  </span>
                ) : '🎫 지금 예약하기'}
              </button>
              <p className="text-[11px] text-[#94A3B8] text-center">London Theatre Direct 보안 결제 · 수수료 없음</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
