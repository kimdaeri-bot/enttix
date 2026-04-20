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
    const dateKey = p.PerformanceDate?.slice(0, 10);
    if (!dateKey) return;
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

/* ── Memoized Seat Plan Area ──
   React.memo with () => true ensures this component NEVER re-renders
   after initial mount. This protects LTD's DOM from being destroyed
   by React reconciliation when other state changes (seat selection,
   calendar date, time slots, etc.) trigger a parent re-render. */
const SeatPlanArea = React.memo(function SeatPlanArea({
  containerHeight,
  mobile,
}: {
  containerHeight: number;
  mobile?: boolean;
}) {
  const height = mobile
    ? Math.max(Math.round(containerHeight * 0.85), 700)
    : containerHeight;
  const outerClass = mobile
    ? 'bg-white rounded-xl border border-[#E5E7EB] mb-24'
    : 'bg-white rounded-xl border border-[#E5E7EB] mb-4';

  return (
    <div className={outerClass}>
      {!mobile && (
        <div id="ltd-legend" className="ltd-legend px-3 pt-3" suppressHydrationWarning dangerouslySetInnerHTML={{__html:""}} />
      )}
      <div
        data-seat-container
        className="relative w-full"
        style={{ height }}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{__html: `
          <div data-seat-spinner class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
            <div class="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin"></div>
            <p class="text-[#94A3B8] text-sm">Loading seat map...</p>
          </div>
          <div class="booking-seatplan-content w-full h-full">
            <div class="seat-plan w-full h-full">
              <div class="sticky-content w-full h-full">
                <div class="seating-plan--big w-full h-full">
                  <div id="seatplan-main" class="ltd-seatplan w-full h-full"></div>
                </div>
              </div>
            </div>
          </div>
        `}}
      />
      {mobile && (
        <div id="ltd-legend" className="ltd-legend px-3 pb-2" suppressHydrationWarning dangerouslySetInnerHTML={{__html:""}} />
      )}
    </div>
  );
}, () => true); // Always return true = props always "equal" = NEVER re-render

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

  /* Seating Plan state — stored in ref to avoid React re-render on seat
     selection, which would cause React reconciliation to destroy LTD's DOM.
     A single version counter triggers re-render only for the bottom bar UI. */
  type SeatInfo = { tid: number; label: string; price: number; description: string };
  const seatDataRef = useRef({ seats: [] as SeatInfo[], ticketIds: [] as number[], total: 0 });
  const [seatVersion, setSeatVersion] = useState(0);
  const goStep2Ref = useRef<() => void>(() => {});

  /* Selected time slot for date change (not yet navigated) */
  const [pendingPerf, setPendingPerf] = useState<Performance | null>(null);

  /* Price filter state */
  const [priceBands, setPriceBands] = useState<number[]>([]);
  const [priceFilter, setPriceFilter] = useState<number | null>(null);

  /* Basket state */
  const [basketCreating, setBasketCreating] = useState(false);
  const [basketCreateError, setBasketCreateError] = useState('');

  /* Seat container height — calculated from scheme API map dimensions */
  const [seatContainerHeight, setSeatContainerHeight] = useState(1400);

  /* Responsive layout */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Fetch map dimensions from scheme API → calculate correct container height */
  useEffect(() => {
    if (!performanceId) return;
    fetch(`/api/ltd/scheme?performanceId=${performanceId}`)
      .then(r => r.json())
      .then((data: { Width?: number; Height?: number }) => {
        const mapW = data.Width;
        const mapH = data.Height;
        if (!mapW || !mapH || mapW === 0) return;
        // Container width = viewport - left panel (310px) - gaps (~70px)
        const containerW = Math.max(
          (typeof window !== 'undefined' ? window.innerWidth : 1280) - 400,
          600
        );
        // With canvasFillMethod:'cover', scale = containerW/mapW, canvas height = mapH * scale
        const neededH = Math.ceil(containerW * mapH / mapW) + 200;
        setSeatContainerHeight(Math.max(neededH, 900));
      })
      .catch(() => {});
  }, [performanceId]);

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
          const dateKey = perf.PerformanceDate?.slice(0, 10);
          if (dateKey) setSelectedDate(dateKey);
        }

        // Extract unique sorted price bands from all performances
        const prices = perfs
          .map(p => Number(p.MinimumTicketPrice))
          .filter((p): p is number => !isNaN(p) && p > 0);
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
      setPendingPerf(null);
      return;
    }
    const perfs = eventData.event?.Performances || eventData.performances || [];
    const slots = perfs.filter(p => p.PerformanceDate && p.PerformanceDate.slice(0, 10) === selectedDate);
    setTimeSlots(slots);
    // Auto-select first available time slot when date changes
    const isCurrentDate = currentPerf?.PerformanceDate?.slice(0, 10) === selectedDate;
    if (!isCurrentDate && slots.length > 0) {
      const firstAvail = slots.find(t => t.TotalAvailableTickesCount > 0);
      setPendingPerf(firstAvail || null);
    } else {
      setPendingPerf(null);
    }
  }, [eventData, selectedDate]);

  /* LTD Embedded Seating Plan */
  useEffect(() => {
    if (loading) return;

    // Use window flag to survive Strict Mode double-mount
    const w = window as unknown as Record<string, unknown>;
    const perfKey = `${performanceId}`;
    // 항상 초기화 허용 — SPA 네비게이션/뒤로가기/날짜 변경 시에도 좌석맵 리프레시
    w.__seatPlanPerf = null;

    // SPA 네비게이션 시 DOM 커밋 보장 — 충분한 대기 + 폴링
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    // AbortController로 이벤트 리스너 수명 관리
    const abortCtrl = new AbortController();
    const { signal } = abortCtrl;

    const tryInit = () => {
      if (cancelled) return;
      const seatplanEl = document.getElementById('seatplan-main');
      // DOM이 아직 마운트 안 됐거나 내부가 비어있으면 재시도
      if (!seatplanEl || !seatplanEl.offsetParent) {
        retryTimer = setTimeout(tryInit, 150);
        return;
      }

    type LTDSeat = { Tid?: string; SP?: number; A?: string; R?: string; S?: string; D?: string; SN?: string };
    type LTDSeatDetail = { seat?: LTDSeat; selection?: LTDSeat[] };

    const seatToInfo = (s: LTDSeat): SeatInfo => ({
      tid: Number(s.Tid) || 0,
      label: `${s.A || ''} Row ${s.R || ''} Seat ${s.S || ''}`.trim(),
      price: s.SP ?? 0,
      description: s.D || s.SN || '',
    });

    const updateSelection = (e: Event) => {
      try {
        const detail = (e as CustomEvent<LTDSeatDetail>).detail;
        console.log('[LTD SeatEvent]', e.type, JSON.stringify(detail));
        const prevSelection: LTDSeat[] = detail?.selection || [];
        // seat-plan.js may use lowercase or alternate key names — normalise
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawSeat: any = detail?.seat;
        const seat: LTDSeat | undefined = rawSeat ? {
          Tid: rawSeat.Tid ?? rawSeat.tid ?? rawSeat.TId ?? rawSeat.ticketId ?? rawSeat.TicketId,
          SP: rawSeat.SP ?? rawSeat.sp ?? rawSeat.sellingPrice,
          A: rawSeat.A ?? rawSeat.a ?? rawSeat.area,
          R: rawSeat.R ?? rawSeat.r ?? rawSeat.row,
          S: rawSeat.S ?? rawSeat.s ?? rawSeat.seat,
          D: rawSeat.D ?? rawSeat.d ?? rawSeat.description,
          SN: rawSeat.SN ?? rawSeat.sn ?? rawSeat.seatName,
        } : undefined;

        const isSelect = e.type === 'LTD.SeatPlan.OnSeatSelected';

        // detail.selection is the state BEFORE the change — manually add/remove detail.seat
        let currentSeats: LTDSeat[];
        if (seat) {
          const seatTid = String(seat.Tid);
          if (isSelect) {
            const alreadyIn = prevSelection.some(s => String(s.Tid) === seatTid);
            currentSeats = alreadyIn ? prevSelection : [...prevSelection, seat];
          } else {
            currentSeats = prevSelection.filter(s => String(s.Tid) !== seatTid);
          }
        } else {
          currentSeats = prevSelection;
        }

        const infos = currentSeats.map(seatToInfo).filter(s => s.tid > 0);
        console.log('[LTD SeatData] infos:', JSON.stringify(infos));
        seatDataRef.current = {
          seats: infos,
          ticketIds: infos.map(s => s.tid),
          total: infos.reduce((sum, s) => sum + s.price, 0),
        };
        setSeatVersion(v => v + 1);
      } catch (err) {
        console.error('[Seat selection error]', err);
      }
    };

    const hideSpinner = () => {
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

    // Resize the seat map container to fit the full map, then zoom-to-fit
    const resizeContainerToFitMap = () => {
      const inst = getLTDInstance();
      const draw = (inst as unknown as { draw?: { _references?: { state?: { originalWidth?: number; originalHeight?: number; containerWidth?: number } }; fitToScreen?: () => void; redraw?: () => void } })?.draw;
      const state = draw?._references?.state;
      if (!state?.originalWidth || !state?.originalHeight) return;
      const mapW = state.originalWidth;
      const mapH = state.originalHeight;
      const el = document.getElementById('seatplan-main');
      if (!el) return;
      const cw = el.offsetWidth || state.containerWidth || 800;
      const neededH = Math.ceil(cw * mapH / mapW) + 200;
      const outerEl = el.closest('[data-seat-container]') as HTMLElement | null;
      if (outerEl) {
        outerEl.style.height = `${neededH}px`;
        requestAnimationFrame(() => {
          draw?.fitToScreen?.();
          setTimeout(() => { draw?.fitToScreen?.(); draw?.redraw?.(); }, 300);
        });
      }
    };

    let drawFixApplied = false;
    const onDrawFinished = () => {
      resizeContainerToFitMap();
      if (drawFixApplied) return;
      drawFixApplied = true;
      // Availability 재시도 — 여러 번 폴링하며 완료 확인
      let availRetryCount = 0;
      const ensureAvailability = () => {
        if (cancelled || availRetryCount > 10) return;
        availRetryCount++;
        const inst = getLTDInstance();
        const avail = inst?.availability as Record<string, unknown> | undefined;
        if (!avail) {
          setTimeout(ensureAvailability, 500);
          return;
        }
        const done = avail._done as number | undefined;
        if (done === undefined || done === 0) {
          avail._firstFetch = undefined;
          avail._attempts = 3;
          (avail as { fetch: (b: boolean) => void }).fetch(true);
          setTimeout(() => {
            inst?.draw?.redraw?.();
            ensureAvailability();
          }, 1500);
        }
      };
      setTimeout(ensureAvailability, 300);
    };

    const onAvailabilityFinished = () => {
      console.log('[LTD] OnAvailabilityFinished fired');
      hideSpinner();
      setTimeout(() => {
        getLTDInstance()?.draw?.redraw();
        // 강제 redraw 한 번 더
        setTimeout(() => getLTDInstance()?.draw?.redraw(), 500);
      }, 100);
    };
    const onReady = () => {
      console.log('[LTD] OnReady fired');
      hideSpinner();
      setTimeout(resizeContainerToFitMap, 300);
    };
    const onBasketSubmit = () => { goStep2Ref.current(); };

    document.addEventListener('LTD.SeatPlan.OnSeatSelected', updateSelection, { signal });
    document.addEventListener('LTD.SeatPlan.OnSeatUnselected', updateSelection, { signal });
    document.addEventListener('LTD.SeatPlan.OnAvailabilityFinished', onAvailabilityFinished, { signal });
    document.addEventListener('LTD.SeatPlan.OnReady', onReady, { signal });
    document.addEventListener('LTD.SeatPlan.OnDrawFinished', onDrawFinished, { signal });
    document.addEventListener('LTD.Basket.OnSubmit', onBasketSubmit, { signal });

    const initOpts = {
      clientId: '775854e9-b102-48d9-99bc-4b288a67b538',
      performanceId: performanceId,
      displayFacePrice: false,
      filterPriceBands: true,
      locale: 'en-GB',
      event: { doubletapZoom: true, scrollZoom: false, scrollMove: true },
      behavior: { formatPrice: (num: number) => `£${num.toFixed(2)}` },
      // No url overrides — library calls spdp directly with full param names
      // scheme: locale/performanceId/clientId (full names) → 200 OK
      // availability: l/p/s/a (shorthand) → 200 OK, CORS * → fetch works
      // scheme proxy NOT needed: spdp accepts full params + has CORS *
      i18n: { basket: { addSingle: 'Reserve %d seat', addMultiple: 'Reserve %d seats', add: 'Proceed to Booking →' } },
    };

    const doInit = () => {
      const ltd = (window as unknown as { LTD?: { SeatPlan?: { init: (opts: Record<string, unknown>) => void } } }).LTD;
      if (ltd?.SeatPlan) {
        try {
          ltd.SeatPlan.init(initOpts);
          return true;
        } catch {
          w.__seatPlanPerf = null;
          return false;
        }
      }
      return false;
    };

    const LTD_SCRIPT_SRC = 'https://finale-cdn.uk/latest/seat-plan.js';

    const startInit = () => {
      if (doInit()) return;
      const poll = setInterval(() => { if (doInit()) clearInterval(poll); }, 200);
      setTimeout(() => clearInterval(poll), 15000);
    };

    const existingScript = document.querySelector(`script[src="${LTD_SCRIPT_SRC}"]`);
    if (existingScript) {
      w.__seatPlanPerf = perfKey;
      startInit();
    } else {
      const script = document.createElement('script');
      script.src = LTD_SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        w.__seatPlanPerf = perfKey;
        startInit();
      };
      script.onerror = () => { w.__seatPlanPerf = null; };
      document.head.appendChild(script);
    }
    }; // end tryInit

    // DOM 커밋 후 초기화 시작 — rAF 2번 연속으로 hydration 완료 보장
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(tryInit, 50);
    }));

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      abortCtrl.abort(); // 모든 이벤트 리스너 제거
      // 기존 LTD 인스턴스 정리
      const ltd = (window as unknown as { LTD?: { SeatPlan?: { instance?: { destroy?: () => void } } } }).LTD;
      try { ltd?.SeatPlan?.instance?.destroy?.(); } catch {}
      w.__seatPlanPerf = null;
    };
  }, [performanceId, loading]);

  /* Resize: redraw seat map instead of full re-init */
  useEffect(() => {
    const handleResize = () => {
      const inst = (window as unknown as { LTD?: { SeatPlan?: { instance?: { draw?: { fitToScreen?: () => void; redraw?: () => void } } } } }).LTD?.SeatPlan?.instance;
      const draw = inst?.draw;
      if (draw?.fitToScreen) {
        requestAnimationFrame(() => {
          draw.fitToScreen?.();
          setTimeout(() => { draw.fitToScreen?.(); draw.redraw?.(); }, 300);
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* goStep2Ref */
  useEffect(() => {
    goStep2Ref.current = goStep2;
  });

  async function goStep2() {
    const { ticketIds, seats, total } = seatDataRef.current;
    if (ticketIds.length === 0) return;
    setBasketCreating(true);
    setBasketCreateError('');
    try {
      // Step 1: Create basket
      const r1 = await fetch('/api/ltd/basket?action=create', { method: 'POST' });
      const d1 = await r1.json();
      if (!d1.basketId) throw new Error(d1.error || 'Failed to create basket');

      // Step 2: Add tickets — holds seats for ~10 minutes
      const r2 = await fetch('/api/ltd/basket?action=add-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId: d1.basketId,
          tickets: ticketIds.map(tid => ({ TId: tid })),
        }),
      });
      const d2 = await r2.json();
      if (d2.error) throw new Error(d2.error);

      // Navigate to checkout page with basket info
      const checkoutParams = new URLSearchParams({
        basketId: d1.basketId,
        eventName,
        venue,
        performanceId,
        performanceDate: currentPerf?.PerformanceDate || '',
        seats: JSON.stringify(seats),
        total: String(total),
      });
      router.push(`/${locale}/musical/checkout?${checkoutParams.toString()}`);
    } catch (err: unknown) {
      setBasketCreateError(err instanceof Error ? err.message : String(err));
      setBasketCreating(false);
    }
  }

  const handleTimeSlotClick = (perf: Performance) => {
    setPendingPerf(perf);
  };

  const handleSearchSeats = () => {
    const targetPerf = pendingPerf || timeSlots.find(t => t.TotalAvailableTickesCount > 0);
    if (!targetPerf) return;
    // Full page load instead of router.push to cleanly re-initialize LTD seat plan
    window.location.href = `/${locale}/musical/book/${targetPerf.PerformanceId}?eventId=${eventId}&eventName=${encodeURIComponent(eventName)}&venue=${encodeURIComponent(venue)}`;
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

  /* Read seat data from ref (seatVersion triggers re-render when it changes) */
  void seatVersion;
  const { seats: selectedSeats, ticketIds: selectedTicketIds, total: selectedSeatTotal } = seatDataRef.current;

  /* ──────────────────────────────
     PC LAYOUT (>=1024px)
  ────────────────────────────── */
  return (
    <>
      {/* PC Layout */}
      {!isMobile && <div className="w-full max-w-[1400px] mx-auto px-4 py-6 pb-24">
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

            {/* Info box — updates when seats are selected */}
            {selectedSeats.length > 0 ? (
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3 text-[12px] text-[#166534]">
                {currentPerf && (
                  <p className="font-bold mb-2 text-[#0F172A]">
                    {formatDateShort(currentPerf.PerformanceDate)} · {formatTime(currentPerf.PerformanceDate)}
                  </p>
                )}
                <p className="font-bold mb-1">{selectedSeats.length}석 선택됨 — £{selectedSeatTotal.toFixed(2)}</p>
                <div className="space-y-1.5 mt-2">
                  {selectedSeats.slice(0, 6).map((seat, i) => (
                    <div key={seat.tid || i} className="text-[11px]">
                      <span className="font-semibold">{seat.label}</span>
                      {seat.description && (
                        <span className="text-[#64748B] italic ml-1">— {seat.description}</span>
                      )}
                      <span className="text-[#166534] ml-1">£{seat.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {selectedSeats.length > 6 && <p className="text-[11px]">+{selectedSeats.length - 6}석 더</p>}
                </div>
              </div>
            ) : (
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 text-[12px] text-[#1E40AF]">
                달력에서 날짜를 선택하고, 좌석을 클릭해 선택하세요.
              </div>
            )}

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
                    const isPending = pendingPerf && String(ts.PerformanceId) === String(pendingPerf.PerformanceId);
                    return (
                      <button
                        key={ts.PerformanceId}
                        onClick={() => !isCurrent && handleTimeSlotClick(ts)}
                        disabled={isCurrent}
                        className={`w-full p-2 rounded-lg border text-left transition-all ${
                          isCurrent
                            ? 'border-[#2B7FFF] bg-[#EFF6FF]'
                            : isPending
                            ? 'border-[#2B7FFF] bg-[#DBEAFE] ring-2 ring-[#2B7FFF]'
                            : 'border-[#E5E7EB] hover:border-[#93C5FD] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-[#0F172A]">{formatTime(ts.PerformanceDate)}</span>
                          <span className="text-[11px] text-[#64748B]">From £{(Number(ts.MinimumTicketPrice) || 0).toFixed(0)}</span>
                        </div>
                        {isCurrent && (
                          <div className="text-[10px] text-[#2B7FFF] font-semibold text-center mt-1">Current</div>
                        )}
                        {isPending && (
                          <div className="text-[10px] text-[#2B7FFF] font-semibold text-center mt-1">Selected</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search seats button — shown when a different performance is pending */}
            {pendingPerf && String(pendingPerf.PerformanceId) !== String(performanceId) && (
              <button
                onClick={handleSearchSeats}
                className="w-full py-3 rounded-xl bg-[#2B7FFF] text-white text-[14px] font-bold hover:bg-[#1D6AE5] transition-colors shadow-md"
              >
                {formatDateShort((pendingPerf.PerformanceDate || '') )} · {formatTime(pendingPerf.PerformanceDate || '')} 좌석 검색
              </button>
            )}
          </div>

          {/* RIGHT PANEL - flex-1 */}
          <div className="flex-1 min-w-0">
            {/* Seat plan — wrapped in React.memo, never re-renders */}
            <SeatPlanArea containerHeight={seatContainerHeight} />

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
      {isMobile && <div className="px-4 py-4 pb-36">
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

        {/* Seat plan — wrapped in React.memo, never re-renders */}
        <SeatPlanArea containerHeight={seatContainerHeight} mobile />

        {/* Fixed bottom bar - mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#E5E7EB] shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
          <div className="px-4 py-3">
            {selectedTicketIds.length === 0 ? (
              <p className="text-[13px] text-[#64748B] mb-2">No seats selected</p>
            ) : (
              <div className="mb-2">
                {/* 좌석 수 + 날짜/시간 */}
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-[13px] font-bold text-[#0F172A] shrink-0">{selectedTicketIds.length} seat(s) selected</p>
                  {currentPerf && (
                    <p className="text-[11px] text-[#64748B] shrink-0">· {formatDateShort(currentPerf.PerformanceDate)} {formatTime(currentPerf.PerformanceDate)}</p>
                  )}
                </div>
                {/* 좌석 태그 — 가로 슬라이드 */}
                <div
                  className="flex gap-1.5 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {selectedSeats.map((seat, i) => (
                    <div key={seat.tid || i} className="flex-shrink-0 px-2 py-1 bg-[#d60c5b] text-white rounded-full">
                      <p className="text-[9px] font-semibold leading-tight whitespace-nowrap">{seat.label}</p>
                      {seat.description && (
                        <p className="text-[8px] opacity-80 leading-tight whitespace-nowrap">{seat.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* 버튼에 요금 포함 */}
            <button
              onClick={() => goStep2Ref.current()}
              disabled={selectedTicketIds.length === 0 || basketCreating}
              className={`w-full py-3 rounded-xl text-[15px] font-bold transition-all flex items-center justify-between px-4 ${
                selectedTicketIds.length === 0 || basketCreating
                  ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                  : 'bg-[#22c55e] text-white hover:bg-[#16a34a] active:scale-[0.98]'
              }`}
            >
              <span>{basketCreating ? 'Processing...' : selectedTicketIds.length === 0 ? '좌석을 선택해주세요' : 'Reserve Tickets →'}</span>
              {selectedTicketIds.length > 0 && !basketCreating && (
                <span className="text-right leading-tight">
                  <span className="block text-[13px] font-extrabold">£{selectedSeatTotal.toFixed(2)}</span>
                  <span className="block text-[10px] opacity-80">{selectedTicketIds.length}석</span>
                </span>
              )}
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

/* ── Error Boundary — prevents seat-plan errors from crashing the entire page ── */
class BookingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err?.message || 'Unknown error' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-red-600 text-lg font-bold mb-2">Something went wrong</p>
          <p className="text-[#64748B] text-sm mb-4">{this.state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-[#2B7FFF] text-white rounded-lg text-sm font-semibold hover:bg-[#1D6AE5]"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ══════════════════════════════════════════
   PAGE WRAPPER
══════════════════════════════════════════ */
export default function BookingPage({ params }: { params: Promise<{ performanceId: string }> }) {
  const { performanceId } = use(params);
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <BookingErrorBoundary>
        <Suspense fallback={
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
          </div>
        }>
          <BookingContent performanceId={performanceId} />
        </Suspense>
      </BookingErrorBoundary>
    </main>
  );
}
