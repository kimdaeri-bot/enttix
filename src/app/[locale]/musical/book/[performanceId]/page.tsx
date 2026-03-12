'use client';
import React, { useState, useEffect, use, Suspense, useRef } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

/* ── Types ── */
interface Performance {
  PerformanceId: number;
  PerformanceDate: string;
  MinimumTicketPrice: number;
  TotalAvailableTickesCount: number; // >0 = available, 0 = sold out
}

interface EventData {
  event: {
    EventName: string;
    VenueName: string;
    MainImageUrl?: string;
    SmallImageUrl?: string;
    Performances: Performance[];
  };
  performances: Performance[];
}

/* ── Helpers ── */
function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return `${weekday} ${day}${suffix} ${month} ${year}`;
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}.${String(m).padStart(2, '0')}${ampm}`;
}

/* ── Mini Calendar Component ── */
function MiniCalendar({
  performances,
  selectedDate,
  onSelectDate,
}: {
  performances: Performance[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (performances.length > 0) {
      return new Date(performances[0].PerformanceDate);
    }
    return new Date();
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, etc.

  // Group performances by date
  const perfsByDate: Record<string, Performance[]> = {};
  performances.forEach(p => {
    const dateKey = p.PerformanceDate.slice(0, 10);
    if (!perfsByDate[dateKey]) perfsByDate[dateKey] = [];
    perfsByDate[dateKey].push(p);
  });

  // Generate calendar grid
  const calendar: (number | null)[] = [];
  // Adjust to start on Monday (LTD style)
  const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  for (let i = 0; i < offset; i++) calendar.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendar.push(day);

  const getAvailabilityColor = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const perfs = perfsByDate[dateStr];
    if (!perfs || perfs.length === 0) return 'gray';

    // Check TotalAvailableTickesCount: >0 = available, 0 = sold out
    const hasAvailable = perfs.some(p => p.TotalAvailableTickesCount > 0);
    if (hasAvailable) return 'green';

    return 'gray';
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const perfs = perfsByDate[dateStr];
    // Only allow click if there are performances with availability
    if (perfs && perfs.some(p => p.TotalAvailableTickesCount > 0)) {
      onSelectDate(dateStr);
    }
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-[#64748B] hover:text-[#2B7FFF] p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <span className="text-[13px] font-bold text-[#0F172A]">
          {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="text-[#64748B] hover:text-[#2B7FFF] p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-[10px] font-semibold text-[#94A3B8] text-center">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendar.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasPerfs = !!perfsByDate[dateStr];
          const color = getAvailabilityColor(day);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              disabled={!hasPerfs || color === 'gray'}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[11px] font-semibold transition-all ${
                isSelected
                  ? 'bg-[#2B7FFF] text-white'
                  : hasPerfs && color !== 'gray'
                  ? 'hover:bg-[#F1F5F9] text-[#0F172A]'
                  : 'text-[#CBD5E1] cursor-not-allowed'
              }`}
            >
              <span>{day}</span>
              {hasPerfs && !isSelected && (
                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                  color === 'green' ? 'bg-[#10B981]' : 'bg-[#94A3B8]'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          <span className="text-[10px] text-[#64748B]">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
          <span className="text-[10px] text-[#64748B]">Sold Out</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   BOOKING CONTENT
══════════════════════════════════════════ */
function BookingContent({ performanceId }: { performanceId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const routeParams = useParams();
  const locale = (routeParams?.locale as string) || 'en';

  const [eventId, setEventId] = useState(params.get('eventId') || '');
  const [eventName, setEventName] = useState(params.get('eventName') || 'Show');
  const [venue, setVenue] = useState(params.get('venue') || '');

  /* Event & Performances state */
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* Calendar state */
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<Performance[]>([]);

  /* Current performance state */
  const [currentPerf, setCurrentPerf] = useState<Performance | null>(null);

  /* Seating Plan state */
  const seatSpinnerRef = useRef<HTMLDivElement>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);
  const [selectedSeatLabels, setSelectedSeatLabels] = useState<string[]>([]);
  const [selectedSeatTotal, setSelectedSeatTotal] = useState(0);
  const seatPlanMounted = useRef(false);
  const goStep2Ref = useRef<() => void>(() => {});

  /* Price filter state */
  const [priceBands, setPriceBands] = useState<number[]>([]);
  const [priceFilter, setPriceFilter] = useState<number | null>(null);

  /* Basket state */
  const [basketCreating, setBasketCreating] = useState(false);
  const [basketCreateError, setBasketCreateError] = useState('');

  /* Responsive layout */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* eventId 없을 때 performanceId로 조회 */
  useEffect(() => {
    if (eventId) return;
    fetch(`/api/ltd/performance/${performanceId}`)
      .then(r => r.json())
      .then(d => {
        if (d.eventId) {
          setEventId(String(d.eventId));
          if (!params.get('eventName') && d.eventName) setEventName(d.eventName);
          if (!params.get('venue') && d.venueName) setVenue(d.venueName);
        } else {
          setError(true);
          setLoading(false);
        }
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [performanceId, eventId]);

  /* Load event data */
  useEffect(() => {
    if (!eventId) return;

    fetch(`/api/ltd/event/${eventId}`)
      .then(r => {
        if (!r.ok) throw new Error('failed');
        return r.json();
      })
      .then((d: EventData & { error?: string }) => {
        // eventId가 틀렸을 경우 (Tixstock ID 등) → performanceId로 정확한 eventId 재조회
        if (d.error === 'Event not found') {
          return fetch(`/api/ltd/performance/${performanceId}`)
            .then(r => r.json())
            .then(p => {
              if (p.eventId && String(p.eventId) !== eventId) {
                setEventId(String(p.eventId));
                if (p.eventName) setEventName(p.eventName);
                if (p.venueName) setVenue(p.venueName);
              } else {
                setError(true);
                setLoading(false);
              }
            });
        }
        setEventData(d);
        // Find current performance
        const perfs = d.event?.Performances || d.performances || [];
        const perf = perfs.find(p => String(p.PerformanceId) === String(performanceId));
        if (perf) {
          setCurrentPerf(perf);
          const dateKey = perf.PerformanceDate.slice(0, 10);
          setSelectedDate(dateKey);
        }

        // Extract unique sorted price bands from all performances
        const prices = perfs
          .map(p => p.MinimumTicketPrice)
          .filter((p): p is number => typeof p === 'number' && p > 0);
        const uniquePrices = Array.from(new Set(prices)).sort((a, b) => a - b);
        setPriceBands(uniquePrices);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [eventId, performanceId]);

  /* Update time slots when date changes */
  useEffect(() => {
    if (!eventData || !selectedDate) {
      setTimeSlots([]);
      return;
    }
    const perfs = eventData.event?.Performances || eventData.performances || [];
    const slots = perfs.filter(p => p.PerformanceDate.slice(0, 10) === selectedDate);
    setTimeSlots(slots);
  }, [eventData, selectedDate]);

  /* LTD Embedded Seating Plan */
  useEffect(() => {
    // DOM에 #seatplan-main이 없을 때(로딩 중)는 skip — loading=false 후 re-run됨
    if (loading) return;
    const seatplanEl = document.getElementById('seatplan-main');
    if (!seatplanEl) return;

    // Use window flag to survive Strict Mode double-mount
    const w = window as unknown as Record<string, unknown>;
    const perfKey = `${performanceId}_${isMobile ? 'm' : 'pc'}`;
    if (w.__seatPlanPerf === perfKey) return;
    w.__seatPlanPerf = perfKey;

    type LTDSeat = { Tid?: string; SP?: number; A?: string; R?: string; S?: string };
    type LTDSeatDetail = { seat?: LTDSeat; selection?: LTDSeat[] };

    const updateSelection = (e: Event) => {
      const sel: LTDSeat[] = (e as CustomEvent<LTDSeatDetail>).detail?.selection || [];
      setSelectedTicketIds(sel.map(s => Number(s.Tid)).filter(Boolean));
      setSelectedSeatLabels(sel.map(s => `${s.A || ''} Row ${s.R || ''} Seat ${s.S || ''}`.trim()));
      setSelectedSeatTotal(sel.reduce((sum, s) => sum + (s.SP ?? 0), 0));
    };

    const hideSpinner = () => {
      if (seatSpinnerRef.current) seatSpinnerRef.current.style.display = 'none';
      document.querySelectorAll('[data-seat-spinner]').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    };

    const spinnerTimeout = setTimeout(hideSpinner, 10000);

    type LTDInstance = {
      availability?: { _done: number; _firstFetch: unknown; _attempts: number; fetch: (e: boolean) => void };
      draw?: { redraw: () => void };
    };
    const getLTDInstance = (): LTDInstance | undefined =>
      (window as unknown as { LTD?: { SeatPlan?: { instance?: LTDInstance } } }).LTD?.SeatPlan?.instance;

    const triggerZoomReset = () => {
      const btn = document.querySelector('.ltd-seatplan__zoomreset') as HTMLElement | null;
      if (btn) btn.click();
    };

    let drawFixApplied = false;
    const onDrawFinished = () => {
      triggerZoomReset();
      setTimeout(triggerZoomReset, 100);
      setTimeout(triggerZoomReset, 500);
      setTimeout(triggerZoomReset, 1200);
      if (drawFixApplied) return;
      drawFixApplied = true;
      const inst = getLTDInstance();
      const avail = inst?.availability;
      if (avail && avail._done === 0) {
        avail._firstFetch = undefined;
        avail._attempts = 3;
        avail.fetch(true);
        setTimeout(() => inst?.draw?.redraw(), 2000);
      }
    };

    const onAvailabilityFinished = () => {
      hideSpinner();
      setTimeout(() => getLTDInstance()?.draw?.redraw(), 100);
    };
    const onReady = () => {
      hideSpinner();
      setTimeout(triggerZoomReset, 200);
      setTimeout(triggerZoomReset, 800);
    };
    const onBasketSubmit = () => { goStep2Ref.current(); };

    document.addEventListener('LTD.SeatPlan.OnSeatSelected', updateSelection);
    document.addEventListener('LTD.SeatPlan.OnSeatUnselected', updateSelection);
    document.addEventListener('LTD.SeatPlan.OnAvailabilityFinished', onAvailabilityFinished);
    document.addEventListener('LTD.SeatPlan.OnReady', onReady);
    document.addEventListener('LTD.SeatPlan.OnDrawFinished', onDrawFinished);
    document.addEventListener('LTD.Basket.OnSubmit', onBasketSubmit);

    const initOpts = {
      clientId: '775854e9-b102-48d9-99bc-4b288a67b538',
      performanceId: performanceId,
      ctx: seatplanEl,
      locale: 'en-GB',
      canvasFillMethod: 'cover',
      event: { forceScrollY: true, scrollMove: false, scrollZoom: true, doubletapZoom: true },
      behavior: { formatPrice: (num: number) => `£${num.toFixed(2)}` },
      url: {
        availability: `https://spdp.londontheatredirect.com/GetSeatingPlanAvailability.ashx?_=${Date.now()}&l=en-GB&p=${performanceId}&s=false&a=775854e9-b102-48d9-99bc-4b288a67b538`,
        scheme: `/api/ltd/scheme`,
      },
      i18n: { basket: { addSingle: 'Reserve %d seat', addMultiple: 'Reserve %d seats', add: 'Proceed to Booking →' } },
    };

    // Already loaded check
    if ((window as unknown as { LTD?: { SeatPlan?: unknown } }).LTD?.SeatPlan) {
      // seat-plan.js already loaded, init directly
      const LTD2 = (window as unknown as Record<string, unknown>).LTD as {
        SeatPlan: { init: (opts: Record<string, unknown>) => void };
      } | undefined;
      if (LTD2?.SeatPlan) {
        LTD2.SeatPlan.init(initOpts);
      }
    }

    const existingScript = document.querySelector('script[src="https://finale-cdn.uk/latest/seat-plan.js"]');
    const script = document.createElement('script');
    if (!existingScript) {
    script.src = 'https://finale-cdn.uk/latest/seat-plan.js';
    script.async = true;
    script.onload = () => {
      const LTD = (window as unknown as Record<string, unknown>).LTD as {
        SeatPlan: { init: (opts: Record<string, unknown>) => void };
      } | undefined;
      if (!LTD?.SeatPlan) return;
      LTD.SeatPlan.init(initOpts);
    };
    document.head.appendChild(script);
    } // end if !existingScript

    return () => {
      clearTimeout(spinnerTimeout);
      document.removeEventListener('LTD.SeatPlan.OnSeatSelected', updateSelection);
      document.removeEventListener('LTD.SeatPlan.OnSeatUnselected', updateSelection);
      document.removeEventListener('LTD.SeatPlan.OnAvailabilityFinished', onAvailabilityFinished);
      document.removeEventListener('LTD.SeatPlan.OnReady', onReady);
      document.removeEventListener('LTD.SeatPlan.OnDrawFinished', onDrawFinished);
      document.removeEventListener('LTD.Basket.OnSubmit', onBasketSubmit);
    };
  }, [performanceId, isMobile, loading]);

  /* goStep2Ref */
  useEffect(() => {
    goStep2Ref.current = goStep2;
  });

  async function goStep2() {
    if (selectedTicketIds.length === 0) return;
    setBasketCreating(true);
    setBasketCreateError('');
    try {
      const r1 = await fetch('/api/ltd/basket?action=create', { method: 'POST' });
      const d1 = await r1.json();
      if (!d1.basketId) throw new Error(d1.error || 'Failed to create basket');

      const r2 = await fetch('/api/ltd/basket?action=add-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basketId: d1.basketId, tickets: selectedTicketIds }),
      });
      const d2 = await r2.json();
      if (d2.error) throw new Error(d2.error);

      const checkoutUrl = d2.basket?.CheckoutUrl || d1.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: unknown) {
      setBasketCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setBasketCreating(false);
    }
  }

  const handleTimeSlotClick = (perf: Performance) => {
    router.push(`/${locale}/musical/book/${perf.PerformanceId}?eventId=${eventId}&eventName=${encodeURIComponent(eventName)}&venue=${encodeURIComponent(venue)}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-red-600 text-lg">Failed to load event data</p>
      </div>
    );
  }

  const performances = eventData.event?.Performances || eventData.performances || [];

  /* ──────────────────────────────
     PC LAYOUT (>=1024px)
  ────────────────────────────── */
  return (
    <>
      {/* PC Layout */}
      {!isMobile && <div className="w-full max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex gap-6 items-start">
          {/* LEFT PANEL - 310px, sticky */}
          <div className="w-[310px] flex-shrink-0 sticky top-[70px] self-start space-y-4">
            {/* Event image */}
            {eventData.event?.MainImageUrl ? (
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#E2E8F0]">
                <img
                  src={eventData.event.MainImageUrl}
                  alt={eventName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#E2E8F0] flex items-center justify-center text-5xl">
                🎭
              </div>
            )}

            {/* Event name + venue */}
            <div>
              <h1 className="text-[16px] font-bold text-[#0F172A] mb-1">{eventName}</h1>
              <p className="text-[13px] text-[#64748B]">{venue}</p>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 text-[12px] text-[#1E40AF]">
              달력에서 날짜를 선택하고, 좌석을 클릭해 선택하세요.
            </div>

            {/* Mini calendar */}
            <MiniCalendar
              performances={performances}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* Time slots */}
            {timeSlots.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-3">
                <h3 className="text-[13px] font-bold text-[#0F172A] mb-2">Available Times</h3>
                <div className="space-y-2">
                  {timeSlots.map(ts => {
                    const isCurrent = String(ts.PerformanceId) === String(performanceId);
                    return (
                      <div key={ts.PerformanceId} className={`p-2 rounded-lg border ${isCurrent ? 'border-[#2B7FFF] bg-[#EFF6FF]' : 'border-[#E5E7EB]'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-semibold text-[#0F172A]">{formatTime(ts.PerformanceDate)}</span>
                          <span className="text-[11px] text-[#64748B]">From £{ts.MinimumTicketPrice?.toFixed(0) || '0'}</span>
                        </div>
                        {!isCurrent && (
                          <button
                            onClick={() => handleTimeSlotClick(ts)}
                            className="w-full py-1 px-2 rounded bg-[#2B7FFF] text-white text-[11px] font-semibold hover:bg-[#1D6AE5] transition-colors"
                          >
                            Select
                          </button>
                        )}
                        {isCurrent && (
                          <div className="text-[10px] text-[#2B7FFF] font-semibold text-center">Selected</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL - flex-1 */}
          <div className="flex-1 min-w-0">
            {/* Sticky header bar */}
            <div className="sticky top-[70px] z-40 bg-white border border-[#E5E7EB] rounded-xl p-3 mb-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-bold text-[#0F172A]">
                  {currentPerf && formatDateShort(currentPerf.PerformanceDate)} - {currentPerf && formatTime(currentPerf.PerformanceDate)}
                </div>
                {/* Price filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#64748B]">Filter seats:</span>
                  <button
                    onClick={() => setPriceFilter(null)}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      priceFilter === null
                        ? 'bg-[#2B7FFF] text-white'
                        : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    All
                  </button>
                  {priceBands.map(price => (
                    <button
                      key={price}
                      onClick={() => setPriceFilter(price)}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                        priceFilter === price
                          ? 'bg-[#2B7FFF] text-white'
                          : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      £{price.toFixed(0)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seat map container */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden mb-4">
              <div className="relative w-full" style={{ height: 700 }}>
                <div ref={seatSpinnerRef} data-seat-spinner className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
                  <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
                  <p className="text-[#94A3B8] text-sm">Loading seat map...</p>
                </div>
                <div className="booking-seatplan-content w-full h-full">
                  <div className="seat-plan w-full h-full">
                    <div className="sticky-content w-full h-full">
                      <div className="seating-plan--big w-full h-full">
                        <div id="seatplan-main" className="ltd-seatplan w-full h-full" suppressHydrationWarning dangerouslySetInnerHTML={{__html:""}} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* LTD legend — required by controller.js */}
              <div id="ltd-legend" className="ltd-legend mt-3" suppressHydrationWarning dangerouslySetInnerHTML={{__html:""}} />
            </div>

            {/* Fixed bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#E5E7EB] shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
              <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex-1">
                  {selectedTicketIds.length === 0 ? (
                    <p className="text-[14px] text-[#64748B]">No seats selected</p>
                  ) : (
                    <div>
                      <p className="text-[14px] font-bold text-[#0F172A]">{selectedTicketIds.length} seat(s) selected</p>
                      <p className="text-[12px] text-[#64748B]">Total: £{selectedSeatTotal.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => goStep2Ref.current()}
                  disabled={selectedTicketIds.length === 0 || basketCreating}
                  className={`px-6 py-3 rounded-xl text-[15px] font-bold transition-all ${
                    selectedTicketIds.length === 0 || basketCreating
                      ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                      : 'bg-[#22c55e] text-white hover:bg-[#16a34a] active:scale-[0.98] shadow-lg'
                  }`}
                >
                  {basketCreating ? 'Processing...' : selectedTicketIds.length === 0 ? '좌석을 선택해주세요' : `Reserve Tickets → (${selectedTicketIds.length}석 £${selectedSeatTotal.toFixed(2)})`}
                </button>
              </div>
              {basketCreateError && (
                <div className="max-w-[1400px] mx-auto px-4 pb-2">
                  <p className="text-red-500 text-[12px]">{basketCreateError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>}

      {/* MOBILE LAYOUT (<1024px) */}
      {isMobile && <div className="px-4 py-4">
        {/* Compact top bar */}
        <div className="flex items-center justify-between mb-4">
          <Link href={eventId ? `/musical/event/${eventId}` : "/musical/west-end"} className="text-[#2B7FFF] text-[13px] font-semibold">
            ← Back
          </Link>
          <div className="flex-1 mx-3 text-center">
            <p className="text-[12px] font-bold text-[#0F172A] truncate">{eventName}</p>
            <p className="text-[10px] text-[#64748B]">
              {currentPerf && formatDateShort(currentPerf.PerformanceDate)} - {currentPerf && formatTime(currentPerf.PerformanceDate)}
            </p>
          </div>
          <button
            onClick={() => setSelectedDate(null)}
            className="text-[#2B7FFF] text-[13px] font-semibold"
          >
            Change
          </button>
        </div>

        {/* Price filter horizontal scroll */}
        <div className="overflow-x-auto mb-3 -mx-4 px-4">
          <div className="ltd-legend-prices inline-flex gap-2" />
        </div>

        {/* Seat map full width inline */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden mb-24">
          <div className="relative w-full" style={{ height: 520 }}>
            <div ref={seatSpinnerRef} data-seat-spinner className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
              <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
              <p className="text-[#94A3B8] text-sm">Loading seat map...</p>
            </div>
            <div className="booking-seatplan-content w-full h-full">
              <div className="seat-plan w-full h-full">
                <div className="sticky-content w-full h-full">
                  <div className="seating-plan--big w-full h-full">
                    <div id="seatplan-main" className="ltd-seatplan w-full h-full" suppressHydrationWarning dangerouslySetInnerHTML={{__html:""}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* LTD legend — required by controller.js */}
          <div id="ltd-legend" className="ltd-legend px-3 pb-2" suppressHydrationWarning dangerouslySetInnerHTML={{__html:""}} />
        </div>

        {/* Fixed bottom bar - mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#E5E7EB] shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              {selectedTicketIds.length === 0 ? (
                <p className="text-[13px] text-[#64748B]">No seats selected</p>
              ) : (
                <>
                  <div>
                    <p className="text-[13px] font-bold text-[#0F172A]">{selectedTicketIds.length} seat(s) selected</p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {selectedSeatLabels.slice(0, 3).map((label, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-[#d60c5b] text-white text-[9px] rounded-full font-medium">{label}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[16px] font-extrabold text-[#7B1FA2]">£{selectedSeatTotal.toFixed(2)}</p>
                </>
              )}
            </div>
            <button
              onClick={() => goStep2Ref.current()}
              disabled={selectedTicketIds.length === 0 || basketCreating}
              className={`w-full py-3 rounded-xl text-[15px] font-bold transition-all ${
                selectedTicketIds.length === 0 || basketCreating
                  ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                  : 'bg-[#22c55e] text-white hover:bg-[#16a34a] active:scale-[0.98]'
              }`}
            >
              {basketCreating ? 'Processing...' : selectedTicketIds.length === 0 ? '좌석을 선택해주세요' : 'Reserve Tickets →'}
            </button>
            {basketCreateError && <p className="text-red-500 text-[11px] text-center mt-2">{basketCreateError}</p>}
          </div>
        </div>
      </div>}

      {/* basketCreating overlay */}
      {basketCreating && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
            <p className="text-[15px] font-bold text-[#0F172A]">Reserving your seats...</p>
            <p className="text-[12px] text-[#64748B]">Please wait</p>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   PAGE WRAPPER
══════════════════════════════════════════ */
export default function BookingPage({ params }: { params: Promise<{ performanceId: string }> }) {
  const { performanceId } = use(params);
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
        </div>
      }>
        <BookingContent performanceId={performanceId} />
      </Suspense>
    </main>
  );
}
