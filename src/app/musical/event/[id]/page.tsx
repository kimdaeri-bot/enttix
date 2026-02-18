'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

/* ─── Types ─── */
interface Performance {
  PerformanceId: number;
  PerformanceDate: string;
  TotalAvailableTickesCount: number;
  MinimumTicketPrice: number;
  DirectlyBookablePerformance: boolean;
}
interface PriceLevel {
  Price: number;
  FaceValue: number;
  AvailableSeatsCount: number;
}
interface Area {
  AreaId: number;
  AreaName: string;
  Prices: PriceLevel[];
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
  Venue?: { Name: string; City: string };
  VenueSeatingPlanUrl?: string;
  VenueName?: string;
  VenueAddress?: string;
  VenueNearestTube?: string;
  Images: { Url: string }[];
  MultimediaContent: { Type: number; Url: string }[];
  Cast: { Name: string; Description: string }[];
}
interface RelatedEvent {
  EventId: number;
  Name: string;
  MainImageUrl: string;
  EventMinimumPrice: number;
  TagLine: string;
}

type Tab = 'about' | 'schedule' | 'gallery' | 'reviews';

/* ─── Helpers ─── */
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function formatMonthYear(y: number, m: number) {
  return new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/* Calendar grid builder */
function buildCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  // convert to Mon=0 … Sun=6
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/* ─── Page ─── */
export default function MusicalEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  /* Data */
  const [event, setEvent] = useState<LTDEvent | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<RelatedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  /* Calendar */
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 'YYYY-MM-DD'
  const [selectedPerf, setSelectedPerf] = useState<Performance | null>(null);

  /* Reviews */
  const [reviews, setReviews] = useState<{ConsumerName?: string; Stars?: number; CreatedAt?: string; Content?: string}[]>([]);

  /* Tabs */
  const [activeTab, setActiveTab] = useState<Tab>('about');

  /* ─── Load event ─── */
  useEffect(() => {
    fetch(`/api/ltd/event/${id}`)
      .then(r => r.json())
      .then(d => {
        setEvent(d.event);
        const now = new Date();
        const up = ((d.performances || []) as Performance[])
          .filter(p => new Date(p.PerformanceDate) >= now && p.DirectlyBookablePerformance)
          .sort((a, b) => new Date(a.PerformanceDate).getTime() - new Date(b.PerformanceDate).getTime());
        setPerformances(up);
        if (up.length > 0) {
          const first = new Date(up[0].PerformanceDate);
          setCalYear(first.getFullYear());
          setCalMonth(first.getMonth());
        }
      })
      .finally(() => setLoading(false));

    fetch('/api/ltd/events?type=1')
      .then(r => r.json())
      .then(d => {
        const all: RelatedEvent[] = d.events || [];
        const shuffled = all.filter(e => String(e.EventId) !== id).sort(() => Math.random() - 0.5);
        setRelatedEvents(shuffled.slice(0, 4));
      })
      .catch(() => {});

    fetch(`/api/ltd/event/${id}/reviews`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .catch(() => {});
  }, [id]);

  /* ─── Calendar derived data ─── */
  const perfDateSet = new Set(
    performances.map(p => {
      const d = new Date(p.PerformanceDate);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })
  );

  const perfsByDate = performances.reduce<Record<string, Performance[]>>((acc, p) => {
    const d = new Date(p.PerformanceDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const calendarWeeks = buildCalendarGrid(calYear, calMonth);

  /* Navigate calendar months — clamp to range of available performances */
  const minMonth = performances.length > 0
    ? new Date(performances[0].PerformanceDate)
    : today;
  const maxMonth = performances.length > 0
    ? new Date(performances[performances.length - 1].PerformanceDate)
    : today;

  const canPrevMonth = calYear > minMonth.getFullYear() || (calYear === minMonth.getFullYear() && calMonth > minMonth.getMonth());
  const canNextMonth = calYear < maxMonth.getFullYear() || (calYear === maxMonth.getFullYear() && calMonth < maxMonth.getMonth());

  function prevMonth() {
    if (!canPrevMonth) return;
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (!canNextMonth) return;
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  function selectDate(day: number) {
    const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!perfDateSet.has(key)) return;
    setSelectedDate(key);
    setSelectedPerf(null);
  }

  /* Times for selected date */
  const timesForDate: Performance[] = selectedDate ? (perfsByDate[selectedDate] || []) : [];

  function selectTime(perf: Performance) {
    setSelectedPerf(perf);
  }

  /* ─── Render states ─── */
  if (loading) return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <div className="flex justify-center items-center py-40">
        <div className="w-12 h-12 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
      </div>
    </main>
  );

  if (!event) return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <div className="text-center py-32">
        <p className="text-[#64748B] text-lg mb-4">Show not found.</p>
        <Link href="/musical/west-end" className="text-[#2B7FFF] font-semibold hover:underline">← Back to shows</Link>
      </div>
    </main>
  );

  const youtubeUrl = event.MultimediaContent?.find(m => m.Type === 0)?.Url;
  const DAYS_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <main className="min-h-screen bg-[#F5F7FA]">

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <div className="bg-[#0F172A] relative overflow-hidden">
        <Header hideSearch />

        {/* Background blur image */}
        {event.DetailImageUrl && (
          <div className="absolute inset-0 pointer-events-none">
            <img src={event.DetailImageUrl} alt="" className="w-full h-full object-cover opacity-10 scale-105 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/70 via-[#0F172A]/80 to-[#0F172A]" />
          </div>
        )}

        <div className="relative max-w-[1200px] mx-auto px-6 pt-10 pb-16">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            {/* Poster */}
            <div className="flex-shrink-0 w-[180px] md:w-[220px] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10">
              {event.MainImageUrl
                ? <img src={event.MainImageUrl} alt={event.Name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-[#1E293B] flex items-center justify-center text-[#475569] text-4xl">🎭</div>
              }
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold tracking-widest text-[#93C5FD] uppercase">🎭 London West End</span>
              </div>
              <h1 className="text-[32px] md:text-[48px] font-extrabold text-white leading-[1.1] tracking-tight mb-3">
                {event.Name}
              </h1>
              {event.TagLine && (
                <p className="text-[#94A3B8] text-[15px] leading-relaxed max-w-[680px] mb-5">{event.TagLine}</p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                {event.Venue?.Name && (
                  <span className="flex items-center gap-1.5 bg-white/10 text-white text-[12px] px-3 py-1.5 rounded-full">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {event.Venue.Name}
                  </span>
                )}
                {event.RunningTime && (
                  <span className="flex items-center gap-1.5 bg-white/10 text-white text-[12px] px-3 py-1.5 rounded-full">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    {event.RunningTime}
                  </span>
                )}
                {event.AgeRating > 0 && (
                  <span className="bg-white/10 text-white text-[12px] px-3 py-1.5 rounded-full">
                    {event.AgeRating}+
                  </span>
                )}
                {event.EventMinimumPrice > 0 && (
                  <span className="bg-[#2B7FFF] text-white text-[13px] px-4 py-1.5 rounded-full font-bold">
                    From £{event.EventMinimumPrice}
                  </span>
                )}
                {performances.length > 0 && (
                  <span className="bg-[#10B981] text-white text-[12px] px-3 py-1.5 rounded-full font-semibold">
                    ✓ Available
                  </span>
                )}
              </div>

              {/* Date range */}
              {(event.StartDate || event.EndDate) && (
                <p className="text-[#64748B] text-[13px]">
                  {event.StartDate && formatDate(event.StartDate)}
                  {event.EndDate && ` – ${formatDate(event.EndDate)}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          MAIN CONTENT (Left + Right)
      ══════════════════════════════════ */}
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── LEFT COLUMN (65%) ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* ── Tabs ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
              <div className="flex border-b border-[#E2E8F0]">
                {(['about', 'schedule', 'gallery', 'reviews'] as Tab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3.5 text-[13px] font-semibold transition-colors ${
                      activeTab === tab
                        ? 'text-[#2B7FFF] border-b-2 border-[#2B7FFF] bg-[#EFF6FF]'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {tab === 'about' && 'About'}
                    {tab === 'schedule' && 'Schedule'}
                    {tab === 'gallery' && 'Gallery'}
                    {tab === 'reviews' && 'Reviews'}
                  </button>
                ))}
              </div>

              {/* Tab: About */}
              {activeTab === 'about' && (
                <div className="p-6 space-y-6">
                  {event.Description ? (
                    <div>
                      <div
                        className="prose prose-sm max-w-none text-[#374151] leading-relaxed [&_h2]:text-[#0F172A] [&_h2]:font-bold [&_strong]:text-[#0F172A] [&_a]:text-[#2B7FFF] [&_ul]:list-disc [&_ul]:pl-5"
                        dangerouslySetInnerHTML={{ __html: event.Description }}
                      />
                    </div>
                  ) : (
                    <p className="text-[#94A3B8] text-sm">No description available.</p>
                  )}

                  {/* YouTube trailer */}
                  {youtubeUrl && (
                    <div>
                      <h3 className="text-[15px] font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 bg-red-600 rounded flex items-center justify-center">
                          <svg width="8" height="10" viewBox="0 0 8 10" fill="white"><path d="M0 0l8 5-8 5z"/></svg>
                        </span>
                        Trailer
                      </h3>
                      <div className="aspect-video rounded-xl overflow-hidden bg-black">
                        <iframe
                          src={youtubeUrl.replace('autoplay=true', 'autoplay=0')}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    </div>
                  )}

                  {/* Cast */}
                  {event.Cast && event.Cast.length > 0 && (
                    <div>
                      <h3 className="text-[15px] font-bold text-[#0F172A] mb-3">🎭 Cast</h3>
                      <div className="flex flex-wrap gap-2">
                        {event.Cast.map((c, i) => (
                          <span key={i} className="px-3 py-1.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full text-[13px] text-[#374151] hover:border-[#2B7FFF]/40 hover:text-[#2B7FFF] transition-colors cursor-default">
                            {c.Name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notice */}
                  {event.ImportantNotice && (
                    <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4">
                      <p className="text-[#92400E] text-[13px] font-bold mb-1">⚠️ Important Notice</p>
                      <p className="text-[#78350F] text-[13px] leading-relaxed">{event.ImportantNotice}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Schedule */}
              {activeTab === 'schedule' && (
                <div className="p-6">
                  <h3 className="text-[15px] font-bold text-[#0F172A] mb-4">All Performances</h3>
                  {performances.length === 0 ? (
                    <p className="text-[#94A3B8] text-sm text-center py-8">No performances available.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                            <th className="text-left px-4 py-3 text-[#64748B] font-semibold">Date</th>
                            <th className="text-left px-4 py-3 text-[#64748B] font-semibold">Time</th>
                            <th className="text-right px-4 py-3 text-[#64748B] font-semibold">From</th>
                            <th className="text-right px-4 py-3 text-[#64748B] font-semibold">Available</th>
                            <th className="px-4 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {performances.map(p => {
                            const dt = new Date(p.PerformanceDate);
                            const isSelected = selectedPerf?.PerformanceId === p.PerformanceId;
                            return (
                              <tr key={p.PerformanceId} className={`hover:bg-[#F8FAFC] transition-colors ${isSelected ? 'bg-[#EFF6FF]' : ''}`}>
                                <td className="px-4 py-3 font-medium text-[#0F172A]">
                                  {dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </td>
                                <td className="px-4 py-3 text-[#374151]">{formatTime(p.PerformanceDate)}</td>
                                <td className="px-4 py-3 text-right font-bold text-[#2B7FFF]">
                                  {p.MinimumTicketPrice > 0 ? `£${p.MinimumTicketPrice}` : '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-[#64748B]">
                                  {p.TotalAvailableTickesCount > 0 ? p.TotalAvailableTickesCount : '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => {
                                      const d = dt;
                                      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                      setCalYear(d.getFullYear());
                                      setCalMonth(d.getMonth());
                                      setSelectedDate(key);
                                      selectTime(p);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="px-3 py-1.5 bg-[#2B7FFF] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1D6AE5] transition-colors"
                                  >
                                    예약
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Gallery */}
              {activeTab === 'gallery' && (
                <div className="p-6">
                  {event.Images && event.Images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {event.Images.map((img, i) => (
                        <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F1F5F9] cursor-pointer group">
                          <img
                            src={img.Url}
                            alt={`${event.Name} ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="text-5xl mb-3">🖼️</div>
                      <p className="text-[#94A3B8] text-sm">이미지가 없습니다.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Reviews */}
              {activeTab === 'reviews' && (
                <div className="p-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-14">
                      <div className="text-5xl mb-3">⭐</div>
                      <p className="text-[#64748B] font-semibold mb-1">No reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((r, i) => (
                        <div key={i} className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {Array.from({length: 5}).map((_, si) => (
                                  <svg key={si} width="14" height="14" viewBox="0 0 24 24" fill={si < (r.Stars || 5) ? '#F59E0B' : '#E2E8F0'}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                ))}
                              </div>
                            </div>
                            <span className="text-[11px] text-[#94A3B8]">{r.ConsumerName || 'Anonymous'}</span>
                          </div>
                          {r.Content && <p className="text-[13px] text-[#374151] leading-relaxed">{r.Content}</p>}
                          {r.CreatedAt && <p className="text-[11px] text-[#94A3B8] mt-2">{new Date(r.CreatedAt).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COLUMN (35%) — Sticky booking panel ── */}
          <div className="w-full lg:w-[380px] flex-shrink-0 lg:sticky lg:top-6 space-y-4">

            {/* Calendar panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F1F5F9] bg-gradient-to-r from-[#2B7FFF] to-[#1D6AE5]">
                <h2 className="text-white font-bold text-[15px]">Select Date</h2>
                <p className="text-[#BFDBFE] text-[12px] mt-0.5">{performances.length} performances available</p>
              </div>

              {performances.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="text-4xl mb-2">😔</div>
                  <p className="text-[#94A3B8] text-sm">No performances available to book.</p>
                </div>
              ) : (
                <>
                  {/* Month navigation */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
                    <button
                      onClick={prevMonth}
                      disabled={!canPrevMonth}
                      className={`p-2 rounded-lg transition-colors ${canPrevMonth ? 'text-[#2B7FFF] hover:bg-[#EFF6FF]' : 'text-[#D1D5DB] cursor-not-allowed'}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <span className="text-[14px] font-bold text-[#0F172A]">{formatMonthYear(calYear, calMonth)}</span>
                    <button
                      onClick={nextMonth}
                      disabled={!canNextMonth}
                      className={`p-2 rounded-lg transition-colors ${canNextMonth ? 'text-[#2B7FFF] hover:bg-[#EFF6FF]' : 'text-[#D1D5DB] cursor-not-allowed'}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                    {DAYS_HEADER.map(d => (
                      <div key={d} className="text-center text-[10px] font-bold text-[#94A3B8] py-1">{d}</div>
                    ))}
                  </div>

                  {/* Date grid */}
                  <div className="px-3 pb-3 space-y-1">
                    {calendarWeeks.map((week, wi) => (
                      <div key={wi} className="grid grid-cols-7 gap-0.5">
                        {week.map((day, di) => {
                          if (day === null) return <div key={di} />;
                          const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const hasPerf = perfDateSet.has(key);
                          const isSelected = selectedDate === key;
                          const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                          return (
                            <button
                              key={di}
                              onClick={() => hasPerf && selectDate(day)}
                              className={`relative flex flex-col items-center justify-center aspect-square rounded-xl text-[13px] font-medium transition-all ${
                                isSelected
                                  ? 'bg-[#2B7FFF] text-white font-bold shadow-md shadow-[#2B7FFF]/30'
                                  : hasPerf
                                    ? 'text-[#0F172A] hover:bg-[#EFF6FF] hover:text-[#2B7FFF] cursor-pointer'
                                    : 'text-[#CBD5E1] cursor-not-allowed'
                              } ${isToday && !isSelected ? 'border border-[#2B7FFF] text-[#2B7FFF]' : ''}`}
                            >
                              {day}
                              {hasPerf && !isSelected && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#2B7FFF]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Time slots */}
                  {selectedDate && timesForDate.length > 0 && (
                    <div className="border-t border-[#F1F5F9] px-4 py-4">
                      <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wide mb-2">Select Time</p>
                      <div className="grid grid-cols-2 gap-2">
                        {timesForDate.map(perf => {
                          const isSelected = selectedPerf?.PerformanceId === perf.PerformanceId;
                          return (
                            <button
                              key={perf.PerformanceId}
                              onClick={() => selectTime(perf)}
                              className={`py-2.5 px-3 rounded-xl text-[13px] font-semibold transition-all text-left ${
                                isSelected
                                  ? 'bg-[#2B7FFF] text-white shadow-md shadow-[#2B7FFF]/25'
                                  : 'bg-[#F8FAFC] text-[#374151] hover:bg-[#EFF6FF] hover:text-[#2B7FFF] border border-[#E2E8F0] hover:border-[#2B7FFF]/40'
                              }`}
                            >
                              <div>{formatTime(perf.PerformanceDate)}</div>
                              {perf.MinimumTicketPrice > 0 && (
                                <div className={`text-[11px] ${isSelected ? 'text-[#BFDBFE]' : 'text-[#94A3B8]'}`}>
                                  From £{perf.MinimumTicketPrice}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Find Tickets button */}
                  {selectedDate && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => {
                          if (selectedPerf) {
                            router.push(`/musical/book/${selectedPerf.PerformanceId}?eventId=${id}&eventName=${encodeURIComponent(event?.Name || '')}&price=${selectedPerf.MinimumTicketPrice}`);
                          } else if (timesForDate.length === 1) {
                            selectTime(timesForDate[0]);
                          }
                        }}
                        disabled={!selectedPerf}
                        className={`w-full py-4 rounded-xl text-[15px] font-bold transition-all ${
                          selectedPerf
                            ? 'bg-[#10B981] text-white hover:bg-[#059669] active:scale-[0.98] shadow-lg shadow-[#10B981]/25'
                            : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                        }`}
                      >
                        {selectedPerf ? '🎟️ Find Tickets' : 'Choose a time first'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Trust signals */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-4 space-y-3">
              {[
                { icon: '✓', text: 'No booking fees', sub: 'Zero hidden charges' },
                { icon: '🔒', text: 'Secure checkout', sub: 'London Theatre Direct' },
                { icon: '📧', text: 'Instant e-ticket', sub: 'Delivered by email' },
                { icon: '⚠️', text: 'No refunds', sub: 'No refunds or exchanges' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[14px] flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#0F172A]">{item.text}</p>
                    <p className="text-[11px] text-[#94A3B8]">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Back link */}
            <Link
              href="/musical/west-end"
              className="flex items-center gap-2 text-[13px] text-[#64748B] hover:text-[#2B7FFF] transition-colors group"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-0.5 transition-transform">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Browse all shows
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          RELATED SHOWS
      ══════════════════════════════════ */}
      {relatedEvents.length > 0 && (
        <div className="border-t border-[#E2E8F0] bg-white py-12">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedEvents.map(rel => (
                <Link
                  key={rel.EventId}
                  href={`/musical/event/${rel.EventId}`}
                  className="group bg-[#F8FAFC] rounded-2xl overflow-hidden border border-[#E2E8F0] hover:border-[#2B7FFF]/50 hover:shadow-lg transition-all duration-200"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-[#E2E8F0]">
                    {rel.MainImageUrl
                      ? <img src={rel.MainImageUrl} alt={rel.Name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl">🎭</div>
                    }
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-bold text-[#0F172A] line-clamp-2 mb-1 group-hover:text-[#2B7FFF] transition-colors">{rel.Name}</p>
                    {rel.EventMinimumPrice > 0 && (
                      <p className="text-[12px] text-[#2B7FFF] font-semibold">From £{rel.EventMinimumPrice}</p>
                    )}
                    <span className="mt-2 inline-block w-full text-center py-1.5 bg-[#2B7FFF] text-white text-[11px] font-bold rounded-lg group-hover:bg-[#1D6AE5] transition-colors">
                      예약
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
