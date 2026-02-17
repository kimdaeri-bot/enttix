'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PlannerItem {
  time: string;
  type: 'attraction' | 'food' | 'event';
  name: string;
  desc: string;
  event_id?: number | null;
  price?: number | null;
  event_date?: string | null;
  venue?: string | null;
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

const typeIcons: Record<string, string> = {
  attraction: '🏛️',
  food: '🍽️',
  event: '🎫',
};

const typeLabels: Record<string, string> = {
  attraction: 'Attraction',
  food: 'Restaurant',
  event: 'Event',
};

export default function PlannerPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlannerResult | null>(null);
  const [error, setError] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null); // "day-itemIdx"
  const [tickets, setTickets] = useState<Record<string, Ticket[]>>({});
  const [ticketLoading, setTicketLoading] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  const handleSearch = async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim() || loading) return;
    setLoading(true);
    setError('');
    setPlan(null);
    setExpandedEvent(null);
    setTickets({});

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan');
      setPlan(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTickets = async (key: string, eventId: number) => {
    if (expandedEvent === key) {
      setExpandedEvent(null);
      return;
    }
    setExpandedEvent(key);

    if (tickets[key]) return; // already loaded

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
    <div className="min-h-screen bg-[#0F172A]">
      <Header />

      {/* Hero */}
      <section className="relative pt-12 pb-16 px-4">
        <div className="max-w-[720px] mx-auto text-center">
          <h1 className="text-white text-[36px] md:text-[48px] font-extrabold tracking-tight leading-tight mb-3">
            ✨ AI Travel Planner
          </h1>
          <p className="text-[#94A3B8] text-[16px] md:text-[18px] mb-8">
            Tell us where you want to go — we&apos;ll plan your trip with real bookable events
          </p>

          {/* Search Input */}
          <div className="relative max-w-[580px] mx-auto">
            <div className="bg-white rounded-full shadow-xl flex items-center px-2 py-2">
              <div className="flex-1 flex items-center gap-2 px-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#7C3AED] flex-shrink-0">
                  <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="currentColor" opacity="0.8"/>
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="런던 5박6일 일정 짜줘 / Plan 3 days in Paris..."
                  className="flex-1 text-[15px] text-[#171717] outline-none bg-transparent placeholder:text-[#94A3B8]"
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
            {!plan && !loading && (
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); handleSearch(s); }}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[13px] text-[#CBD5E1] border border-white/10 transition-colors"
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
        <div className="max-w-[720px] mx-auto px-4 pb-16">
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-12 h-12 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
            <p className="text-[#94A3B8] text-[15px]">Planning your perfect trip...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-[720px] mx-auto px-4 pb-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-6 py-4 text-red-400 text-[14px]">
            {error}
          </div>
        </div>
      )}

      {/* Plan Results */}
      {plan && (
        <section className="max-w-[720px] mx-auto px-4 pb-20">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-white text-[28px] font-bold mb-1">
              📍 {plan.city}, {plan.country}
            </h2>
            <p className="text-[#64748B] text-[14px]">
              {plan.days.length} days · {plan.days[0]?.date} → {plan.days[plan.days.length - 1]?.date}
            </p>
          </div>

          {/* Days */}
          {plan.days.map(day => (
            <div key={day.day} className="mb-8">
              {/* Day Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#2B7FFF] flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0">
                  D{day.day}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-[18px] leading-tight">{day.title}</h3>
                  <p className="text-[#64748B] text-[13px]">{day.date}</p>
                </div>
              </div>

              {/* Timeline Items */}
              <div className="ml-5 border-l-2 border-[#1E293B] pl-6 space-y-3">
                {day.items.map((item, idx) => {
                  const key = `${day.day}-${idx}`;
                  const isEvent = item.type === 'event' && item.event_id;
                  const isExpanded = expandedEvent === key;

                  return (
                    <div key={idx}>
                      <div
                        className={`rounded-xl p-4 transition-all ${
                          item.type === 'event'
                            ? 'bg-[#1E293B] border border-[#2B7FFF]/30 hover:border-[#2B7FFF]/60'
                            : 'bg-[#1E293B]/60 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-[20px] mt-0.5">{typeIcons[item.type]}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[#64748B] text-[12px] font-mono">{item.time}</span>
                              <span className="text-[#475569] text-[11px] uppercase tracking-wider">{typeLabels[item.type]}</span>
                            </div>
                            <h4 className="text-white font-semibold text-[15px] leading-snug">{item.name}</h4>
                            <p className="text-[#94A3B8] text-[13px] mt-0.5">{item.desc}</p>
                            {item.venue && <p className="text-[#64748B] text-[12px] mt-0.5">📍 {item.venue}</p>}
                          </div>

                          {/* Book Button */}
                          {isEvent && (
                            <button
                              onClick={() => handleToggleTickets(key, item.event_id!)}
                              className={`flex-shrink-0 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                                isExpanded
                                  ? 'bg-[#2B7FFF] text-white'
                                  : 'bg-[#2B7FFF]/20 text-[#2B7FFF] hover:bg-[#2B7FFF]/30'
                              }`}
                            >
                              🎫 {item.price ? `From $${item.price}` : 'View Tickets'}
                            </button>
                          )}
                          {item.type === 'event' && !item.event_id && (
                            <span className="flex-shrink-0 px-3 py-2 rounded-lg bg-[#374151]/50 text-[#64748B] text-[12px]">
                              Not available
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tickets Accordion — BookitNGo style */}
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
                                {tickets[key].map((t, ti) => {
                                  const tKey = `${key}-${ti}`;
                                  const isWished = wishlisted.has(tKey);
                                  return (
                                    <div
                                      key={ti}
                                      className="flex items-stretch hover:bg-[#F8FAFC] transition-colors relative group"
                                    >
                                      {/* Left thumbnail / section visual */}
                                      <div className="w-[72px] md:w-[88px] flex-shrink-0 bg-gradient-to-br from-[#2B7FFF] to-[#1D4ED8] flex flex-col items-center justify-center text-white">
                                        <span className="text-[20px]">🎟️</span>
                                        <span className="text-[10px] font-bold mt-1 opacity-80 uppercase tracking-wider">
                                          {t.section ? 'Sec' : 'GA'}
                                        </span>
                                      </div>

                                      {/* Info */}
                                      <div className="flex-1 min-w-0 px-4 py-3.5 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h5 className="text-[#171717] font-semibold text-[14px] truncate">
                                              {t.section || 'General Admission'}
                                              {t.row ? ` · Row ${t.row}` : ''}
                                            </h5>
                                          </div>
                                          <div className="flex items-center gap-2 flex-wrap">
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
                                          {t.notes && (
                                            <p className="text-[#94A3B8] text-[12px] mt-1 truncate">{t.notes}</p>
                                          )}
                                        </div>

                                        {/* Price — bold right */}
                                        <div className="flex-shrink-0 text-right pl-3 min-w-[80px]">
                                          <p className="text-[#171717] font-extrabold text-[20px] leading-tight">
                                            {t.currency || '$'}{t.price || '—'}
                                          </p>
                                          <p className="text-[#94A3B8] text-[11px]">per ticket</p>
                                        </div>
                                      </div>

                                      {/* Wishlist heart — top right */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setWishlisted(prev => {
                                            const next = new Set(prev);
                                            if (next.has(tKey)) next.delete(tKey); else next.add(tKey);
                                            return next;
                                          });
                                        }}
                                        className="absolute top-2.5 right-3 p-1 rounded-full hover:bg-[#FEE2E2]/60 transition-colors"
                                        aria-label="Wishlist"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill={isWished ? '#EF4444' : 'none'} stroke={isWished ? '#EF4444' : '#CBD5E1'} strokeWidth="2">
                                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                        </svg>
                                      </button>
                                    </div>
                                  );
                                })}
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
    </div>
  );
}
