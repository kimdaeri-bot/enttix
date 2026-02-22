'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Suspense } from 'react';

interface PlannerItem {
  time: string;
  type: 'attraction' | 'food' | 'event' | 'cafe' | 'dessert' | 'shopping' | 'transport' | 'musical';
  name: string;
  desc: string;
  event_id?: number | null;
  musical_event_id?: number | null;
  price?: number | null;
  event_date?: string | null;
  venue?: string | null;
  bookable?: boolean;
  attraction_url?: string | null;
  attraction_price?: number | null;
  attraction_currency?: string | null;
}

interface PlannerDay {
  day: number;
  date: string;
  title: string;
  items: PlannerItem[];
}

interface PlannerResult {
  city: string;
  country: string;
  days: PlannerDay[];
}

interface Ticket {
  id: number;
  section?: string;
  row?: string;
  quantity?: number;
  price?: number;
  currency?: string;
  notes?: string;
}

const SUGGESTIONS = [
  '런던 5박6일 일정 짜줘',
  'Plan a 3-day trip to Barcelona',
  '파리 3박4일 여행 계획',
  '4 days in Manchester with football matches',
  'Rome weekend getaway with concerts',
];

const typeConfig: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  attraction: { icon: '🏛️', label: 'Attraction', color: '#6366F1', bg: '#EEF2FF' },
  food: { icon: '🍽️', label: 'Restaurant', color: '#F59E0B', bg: '#FFFBEB' },
  event: { icon: '🎫', label: 'Event', color: '#2B7FFF', bg: '#EFF6FF' },
  cafe: { icon: '☕', label: 'Cafe', color: '#92400E', bg: '#FFFBEB' },
  dessert: { icon: '🍰', label: 'Dessert', color: '#EC4899', bg: '#FDF2F8' },
  shopping: { icon: '🛍️', label: 'Shopping', color: '#10B981', bg: '#ECFDF5' },
  transport: { icon: '🚇', label: 'Transport', color: '#64748B', bg: '#F1F5F9' },
  musical: { icon: '🎭', label: 'Musical', color: '#7C3AED', bg: '#F5F3FF' },
};

function getAttractionIcon(item: PlannerItem): string {
  const hour = parseInt(item.time.split(':')[0]);
  if (hour >= 18) return '🌃';
  return '🏛️';
}

function PlannerContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlannerResult | null>(null);
  const [error, setError] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Record<string, Ticket[]>>({});
  const [ticketLoading, setTicketLoading] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [expandedMusical, setExpandedMusical] = useState<string | null>(null);
  const [musicalPerformances, setMusicalPerformances] = useState<Record<string, any[]>>({});
  const [musicalLoading, setMusicalLoading] = useState<string | null>(null);

  const handleSearch = async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim() || loading) return;
    setLoading(true);
    setError('');
    setPlan(null);
    setExpandedEvent(null);
    setTickets({});
    setExpandedMusical(null);
    setMusicalPerformances({});

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan');
      setPlan(data);
      setActiveDay(1);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if query param provided
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleMusical = async (key: string, eventId: number) => {
    if (expandedMusical === key) {
      setExpandedMusical(null);
      return;
    }
    setExpandedMusical(key);
    if (musicalPerformances[key]) return;

    setMusicalLoading(key);
    try {
      const res = await fetch(`/api/ltd/event/${eventId}`);
      const data = await res.json();
      const perfs = (data.Performances || data.Event?.Performances || []).slice(0, 5);
      setMusicalPerformances(prev => ({ ...prev, [key]: perfs }));
    } catch {
      setMusicalPerformances(prev => ({ ...prev, [key]: [] }));
    } finally {
      setMusicalLoading(null);
    }
  };

  const handleToggleTickets = async (key: string, eventId: number) => {
    if (expandedEvent === key) {
      setExpandedEvent(null);
      return;
    }
    setExpandedEvent(key);
    if (tickets[key]) return;

    setTicketLoading(key);
    try {
      const res = await fetch(`/api/tixstock/tickets?event_id=${eventId}`);
      const data = await res.json();
      const list = data.data || data.tickets || data || [];
      setTickets(prev => ({ ...prev, [key]: Array.isArray(list) ? list.slice(0, 10) : [] }));
    } catch {
      setTickets(prev => ({ ...prev, [key]: [] }));
    } finally {
      setTicketLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Header hideSearch />

      {/* Hero — compact, clean */}
      <section className="bg-gradient-to-b from-[#F8FAFC] to-white pt-10 pb-8 px-4">
        <div className="max-w-[680px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF6FF] text-[#2B7FFF] text-[12px] font-semibold mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"/></svg>
            AI Travel Planner
          </div>
          <h1 className="text-[#0F172A] text-[32px] md:text-[42px] font-extrabold tracking-tight leading-tight mb-2">
            Plan your perfect trip
          </h1>
          <p className="text-[#64748B] text-[15px] md:text-[16px] mb-6">
            AI-powered itinerary with real bookable events
          </p>

          {/* Search Input */}
          <div className="relative max-w-[560px] mx-auto">
            <div className="bg-white rounded-full shadow-lg border border-[#E2E8F0] flex items-center px-2 py-2 focus-within:border-[#2B7FFF] focus-within:ring-2 focus-within:ring-[#2B7FFF]/10 transition-all">
              <div className="flex-1 flex items-center gap-2 px-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#2B7FFF] flex-shrink-0">
                  <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="currentColor" opacity="0.7"/>
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="런던 5박6일 일정 짜줘 / Plan 3 days in Paris..."
                  className="flex-1 text-[15px] text-[#0F172A] outline-none bg-transparent placeholder:text-[#94A3B8]"
                  disabled={loading}
                />
              </div>
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="w-10 h-10 rounded-full bg-[#2B7FFF] hover:bg-[#1D6AE5] flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-60 flex-shrink-0"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Suggestions */}
            {!plan && !loading && !initialQuery && (
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); handleSearch(s); }}
                    className="px-4 py-2 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[13px] text-[#475569] border border-[#E2E8F0] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="max-w-[680px] mx-auto px-4 pb-16">
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-12 h-12 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
            <p className="text-[#64748B] text-[15px]">Planning your perfect trip...</p>
            <p className="text-[#94A3B8] text-[13px]">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-[680px] mx-auto px-4 pb-8">
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-6 py-4 text-[#DC2626] text-[14px]">
            {error}
          </div>
        </div>
      )}

      {/* Plan Results */}
      {plan && (
        <section className="max-w-[780px] mx-auto px-4 pb-20">
          {/* City Header */}
          <div className="mb-6 pb-6 border-b border-[#F1F5F9]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[#0F172A] text-[26px] md:text-[30px] font-bold">
                  📍 {plan.city}, {plan.country}
                </h2>
                <p className="text-[#94A3B8] text-[14px] mt-1">
                  {plan.days.length} days · {plan.days[0]?.date} → {plan.days[plan.days.length - 1]?.date}
                </p>
              </div>
              <button
                onClick={() => { setPlan(null); setQuery(''); }}
                className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                New search
              </button>
            </div>

            {/* Day Tabs */}
            <div className="flex gap-2 mt-5 overflow-x-auto scrollbar-hide pb-1">
              {plan.days.map(day => (
                <button
                  key={day.day}
                  onClick={() => setActiveDay(day.day)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                    activeDay === day.day
                      ? 'bg-[#0F172A] text-white shadow-sm'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  Day {day.day}
                </button>
              ))}
              <button
                onClick={() => setActiveDay(0)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                  activeDay === 0
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
              >
                All Days
              </button>
            </div>
          </div>

          {/* Days */}
          {plan.days
            .filter(day => activeDay === 0 || day.day === activeDay)
            .map(day => (
            <div key={day.day} className="mb-10">
              {/* Day Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#0F172A] flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0">
                  D{day.day}
                </div>
                <div>
                  <h3 className="text-[#0F172A] font-bold text-[18px] leading-tight">{day.title}</h3>
                  <p className="text-[#94A3B8] text-[13px]">{day.date}</p>
                </div>
              </div>

              {/* Timeline Items */}
              <div className="ml-5 border-l-2 border-[#E2E8F0] pl-6 space-y-4">
                {day.items.map((item, idx) => {
                  const key = `${day.day}-${idx}`;
                  const isEvent = item.type === 'event' && item.event_id;
                  const isExpanded = expandedEvent === key;
                  const isMusical = item.type === 'musical';
                  const isMusicalExpanded = expandedMusical === key;
                  const cfg = typeConfig[item.type] || typeConfig.attraction;
                  const isEveningAttraction =
                    item.type === 'attraction' && parseInt(item.time.split(':')[0]) >= 18;
                  const attractionIcon =
                    item.type === 'attraction' ? getAttractionIcon(item) : cfg.icon;

                  return (
                    <div key={idx}>
                      {/* Timeline dot */}
                      <div className="relative">
                        <div className="absolute -left-[33px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: cfg.color }} />
                      </div>

                      <div
                        className={`rounded-xl p-4 transition-all border ${
                          item.type === 'event'
                            ? 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md'
                            : isEveningAttraction
                            ? 'bg-gradient-to-r from-[#1E1B4B]/5 to-[#312E81]/5 border-[#6366F1]/30 hover:border-[#6366F1]/50'
                            : 'bg-[#FAFBFC] border-[#F1F5F9] hover:border-[#E2E8F0]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-[20px] mt-0.5">{attractionIcon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[#94A3B8] text-[12px] font-mono">{item.time}</span>
                              <span className="text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                                {cfg.label}
                              </span>
                            </div>
                            <h4 className="text-[#0F172A] font-semibold text-[15px] leading-snug">{item.name}</h4>
                            <p className="text-[#64748B] text-[13px] mt-0.5">{item.desc}</p>
                            {item.venue && <p className="text-[#94A3B8] text-[12px] mt-1">📍 {item.venue}</p>}
                          </div>

                          {/* Book Button */}
                          {isEvent ? (
                            <Link
                              href={`/event/${item.event_id}`}
                              className="flex-shrink-0 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#EFF6FF] text-[#2B7FFF] hover:bg-[#DBEAFE] transition-all whitespace-nowrap"
                            >
                              🎫 {item.price ? `From £${item.price}` : 'View Tickets'}
                            </Link>
                          ) : item.type === 'event' && !item.event_id ? (
                            null
                          ) : isMusical ? (
                            item.musical_event_id ? (
                              <button
                                onClick={() => handleToggleMusical(key, item.musical_event_id!)}
                                className={`flex-shrink-0 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                                  isMusicalExpanded
                                    ? 'bg-[#7C3AED] text-white shadow-sm'
                                    : 'bg-[#F5F3FF] text-[#7C3AED] hover:bg-[#EDE9FE]'
                                }`}
                              >
                                🎭 {item.price ? `From £${item.price}` : 'Book Musical'}
                              </button>
                            ) : (
                              <Link
                                href="/musical/london"
                                className="flex-shrink-0 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#F5F3FF] text-[#7C3AED] hover:bg-[#EDE9FE] transition-colors"
                              >
                                🎭 Book Musical
                              </Link>
                            )
                          ) : item.type === 'attraction' && item.attraction_url ? (
                            <a
                              href={item.attraction_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#EFF6FF] text-[#2B7FFF] hover:bg-[#DBEAFE] transition-all whitespace-nowrap"
                            >
                              🎟️ {item.attraction_price
                                ? `From ${item.attraction_currency || '$'}${item.attraction_price}`
                                : 'Book'}
                            </a>
                          ) : item.type === 'attraction' && item.bookable && !item.attraction_url ? (
                            null
                          ) : null}
                        </div>
                      </div>

                      {/* Musical Accordion */}
                      {isMusical && (
                        <div className={`overflow-hidden transition-all duration-300 ${isMusicalExpanded ? 'max-h-[600px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                          <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] overflow-hidden ml-8">
                            {musicalLoading === key ? (
                              <div className="flex justify-center py-8">
                                <div className="animate-spin w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full" />
                              </div>
                            ) : musicalPerformances[key]?.length ? (
                              <div>
                                <div className="px-5 py-3 border-b border-[#F1F5F9] bg-[#F5F3FF]">
                                  <p className="text-[#7C3AED] text-[12px] font-semibold uppercase tracking-wider">
                                    🎭 Available Performances
                                  </p>
                                </div>
                                <div className="divide-y divide-[#F1F5F9]">
                                  {musicalPerformances[key].map((perf, pi) => (
                                    <div key={pi} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F9FAFB]">
                                      <div className="flex-1">
                                        <p className="text-[#0F172A] font-semibold text-[14px]">
                                          {perf.DateTime ? new Date(perf.DateTime).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                                        </p>
                                        <p className="text-[#64748B] text-[12px]">
                                          {perf.DateTime ? new Date(perf.DateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        {perf.FromPrice && (
                                          <p className="text-[#0F172A] font-bold text-[16px]">From £{perf.FromPrice}</p>
                                        )}
                                        <a
                                          href={`/musical/event/${item.musical_event_id}`}
                                          className="inline-block mt-1 px-4 py-1.5 rounded-lg bg-[#7C3AED] text-white text-[12px] font-semibold hover:bg-[#6D28D9] transition-colors"
                                        >
                                          Book Now
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="px-5 py-3 border-t border-[#F1F5F9] text-center">
                                  <a href={`/musical/event/${item.musical_event_id}`} className="text-[#7C3AED] text-[13px] font-semibold hover:underline">
                                    View All Performances →
                                  </a>
                                </div>
                              </div>
                            ) : isMusicalExpanded ? (
                              <div className="text-center py-8">
                                <p className="text-[#94A3B8] text-[13px] mb-3">No upcoming performances found</p>
                                <a href={`/musical/event/${item.musical_event_id}`} className="text-[#7C3AED] text-[13px] font-semibold hover:underline">
                                  Check availability →
                                </a>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Tickets Accordion */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded ? 'max-h-[800px] opacity-100 mt-3' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] overflow-hidden ml-8">
                          {ticketLoading === key ? (
                            <div className="flex items-center gap-2 text-[#94A3B8] text-[13px] py-8 justify-center">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              Loading tickets...
                            </div>
                          ) : tickets[key]?.length ? (
                            <div>
                              <div className="px-5 py-3 border-b border-[#F1F5F9] bg-[#F8FAFC]">
                                <p className="text-[#64748B] text-[12px] font-semibold uppercase tracking-wider">
                                  {tickets[key].length} Tickets Available
                                </p>
                              </div>
                              <div className="divide-y divide-[#F1F5F9]">
                                {tickets[key].map((t, ti) => (
                                  <div key={ti} className="flex items-stretch hover:bg-[#F8FAFC] transition-colors">
                                    <div className="w-[72px] md:w-[88px] flex-shrink-0 bg-gradient-to-br from-[#2B7FFF] to-[#1D4ED8] flex flex-col items-center justify-center text-white">
                                      <span className="text-[20px]">🎟️</span>
                                      <span className="text-[10px] font-bold mt-1 opacity-80 uppercase tracking-wider">
                                        {t.section ? 'Sec' : 'GA'}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0 px-4 py-3.5 flex items-center gap-3">
                                      <div className="flex-1 min-w-0">
                                        <h5 className="text-[#0F172A] font-semibold text-[14px] truncate">
                                          {t.section || 'General Admission'}
                                          {t.row ? ` · Row ${t.row}` : ''}
                                        </h5>
                                        <div className="flex items-center gap-2 flex-wrap mt-1">
                                          {t.section && (
                                            <span className="inline-flex px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2B7FFF] text-[10px] font-semibold uppercase tracking-wide">
                                              {t.section}
                                            </span>
                                          )}
                                          {t.quantity && (
                                            <span className="inline-flex px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] text-[10px] font-medium">
                                              {t.quantity} ticket{t.quantity > 1 ? 's' : ''}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex-shrink-0 text-right pl-3 min-w-[80px]">
                                        <p className="text-[#0F172A] font-extrabold text-[20px] leading-tight">
                                          {t.currency || '$'}{t.price || '—'}
                                        </p>
                                        <p className="text-[#94A3B8] text-[11px]">per ticket</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[#94A3B8] text-[13px] text-center py-8">
                              No tickets available at the moment
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      <Footer />
    </main>
  );
}

export default function PlannerPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white">
        <Header hideSearch />
        <div className="flex items-center justify-center py-20">
          <div className="text-[16px] text-[#94A3B8] animate-pulse">Loading...</div>
        </div>
      </main>
    }>
      <PlannerContent />
    </Suspense>
  );
}
