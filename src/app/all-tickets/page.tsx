'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MatchCard from '@/components/MatchCard';
import MatchRow from '@/components/MatchRow';
import SearchBar from '@/components/SearchBar';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Match } from '@/types';
import { demoData } from '@/lib/api';

function feedEventToMatch(event: Record<string, unknown>): Match {
  const venue = (event.venue as Record<string, unknown>) || {};
  const performers = (event.performers as Array<Record<string, unknown>>) || [];
  const categories = (event.categories as Array<Record<string, string>>) || [];
  const name = (event.name as string) || '';
  const parts = name.split(/\s+vs?\s+/i);
  const homeTeam = parts[0]?.trim() || name;
  const awayTeam = parts[1]?.trim() || (performers[1] as Record<string, unknown>)?.name as string || '';
  const categoryName = categories[0]?.name || '';

  return {
    id: String(event.id || ''),
    name,
    homeTeam,
    awayTeam,
    datetime: (event.datetime as string) || '',
    venue: {
      id: String(venue.id || ''), name: (venue.name as string) || '',
      address_line_1: (venue.address_line_1 as string) || '', address_line_2: (venue.address_line_2 as string) || '',
      city: (venue.city as string) || '', state: (venue.state as string) || '',
      postcode: (venue.postcode as string) || '', country_code: (venue.country_code as string) || '',
      latitude: (venue.latitude as number) || 0, longitude: (venue.longitude as number) || 0,
    },
    leagueId: categoryName.toLowerCase().replace(/\s+/g, '-'),
    leagueName: categoryName,
    startingPrice: (event.min_ticket_price as number) || (event.starting_price as number) || 0,
    currency: (event.currency as string) || 'USD',
    ticketsLeft: (event.total_tickets as number) || (event.tickets_available as number) || 0,
  };
}

// --- Planner types ---
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

const typeConfig: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  attraction: { icon: '🏛️', label: 'Attraction', color: '#6366F1', bg: '#EEF2FF' },
  food: { icon: '🍽️', label: 'Restaurant', color: '#F59E0B', bg: '#FFFBEB' },
  event: { icon: '🎫', label: 'Event', color: '#2B7FFF', bg: '#EFF6FF' },
};

// --- Inline Planner Component ---
function InlinePlanner({ plan }: { plan: PlannerResult }) {
  const [activeDay, setActiveDay] = useState(1);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Record<string, Ticket[]>>({});
  const [ticketLoading, setTicketLoading] = useState<string | null>(null);

  const handleToggleTickets = async (key: string, eventId: number) => {
    if (expandedEvent === key) { setExpandedEvent(null); return; }
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
    <div className="mb-10">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {/* Top bar */}
        <div className="px-5 pt-5 pb-4 border-b border-[#F1F5F9]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2B7FFF] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-[#6366F1] mb-1">AI Travel Planner</p>
              <h3 className="text-[#0F172A] text-[22px] font-bold">
                📍 {plan.city}, {plan.country}
              </h3>
              <p className="text-[#94A3B8] text-[13px] mt-0.5">
                {plan.days.length} days · {plan.days[0]?.date} → {plan.days[plan.days.length - 1]?.date}
              </p>
            </div>
          </div>

          {/* Day Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
            {plan.days.map(day => (
              <button
                key={day.day}
                onClick={() => setActiveDay(day.day)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                  activeDay === day.day
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
              >
                Day {day.day}
              </button>
            ))}
            <button
              onClick={() => setActiveDay(0)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                activeDay === 0
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Day Content */}
        <div className="px-5 py-4">
          {plan.days
            .filter(day => activeDay === 0 || day.day === activeDay)
            .map(day => (
            <div key={day.day} className="mb-6 last:mb-0">
              {/* Day Header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">
                  D{day.day}
                </div>
                <div>
                  <h4 className="text-[#0F172A] font-bold text-[16px] leading-tight">{day.title}</h4>
                  <p className="text-[#94A3B8] text-[12px]">{day.date}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="ml-4 border-l-2 border-[#E2E8F0] pl-5 space-y-3">
                {day.items.map((item, idx) => {
                  const key = `${day.day}-${idx}`;
                  const isEvent = item.type === 'event' && item.event_id;
                  const isExpanded = expandedEvent === key;
                  const cfg = typeConfig[item.type] || typeConfig.attraction;

                  return (
                    <div key={idx}>
                      <div className="relative">
                        <div className="absolute -left-[27px] top-3 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: cfg.color }} />
                      </div>

                      <div className={`rounded-xl p-3.5 transition-all border ${
                        item.type === 'event'
                          ? 'bg-white border-[#E2E8F0] shadow-sm'
                          : 'bg-[#FAFBFC] border-[#F1F5F9]'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          <span className="text-[18px] mt-0.5">{cfg.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[#94A3B8] text-[11px] font-mono">{item.time}</span>
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                                {cfg.label}
                              </span>
                            </div>
                            <h5 className="text-[#0F172A] font-semibold text-[14px] leading-snug">{item.name}</h5>
                            <p className="text-[#64748B] text-[12px] mt-0.5">{item.desc}</p>
                            {item.venue && <p className="text-[#94A3B8] text-[11px] mt-0.5">📍 {item.venue}</p>}
                          </div>

                          {isEvent ? (
                            <button
                              onClick={() => handleToggleTickets(key, item.event_id!)}
                              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                                isExpanded
                                  ? 'bg-[#2B7FFF] text-white'
                                  : 'bg-[#EFF6FF] text-[#2B7FFF] hover:bg-[#DBEAFE]'
                              }`}
                            >
                              🎫 {item.price ? `$${item.price}` : 'Tickets'}
                            </button>
                          ) : item.type === 'event' && !item.event_id ? (
                            <span className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] text-[#9CA3AF] text-[11px] border border-[#F1F5F9]">
                              N/A
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Tickets Accordion */}
                      <div className={`overflow-hidden transition-all duration-300 ${
                        isExpanded ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden ml-6">
                          {ticketLoading === key ? (
                            <div className="flex items-center gap-2 text-[#94A3B8] text-[12px] py-6 justify-center">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              Loading...
                            </div>
                          ) : tickets[key]?.length ? (
                            <div className="divide-y divide-[#F1F5F9]">
                              {tickets[key].map((t, ti) => (
                                <div key={ti} className="flex items-center px-4 py-3 hover:bg-[#F8FAFC]">
                                  <div className="flex-1">
                                    <p className="text-[#0F172A] font-semibold text-[13px]">
                                      {t.section || 'General Admission'}{t.row ? ` · Row ${t.row}` : ''}
                                    </p>
                                    {t.quantity && <p className="text-[#94A3B8] text-[11px]">{t.quantity} tickets</p>}
                                  </div>
                                  <p className="text-[#0F172A] font-extrabold text-[16px]">
                                    {t.currency || '$'}{t.price || '—'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[#94A3B8] text-[12px] text-center py-6">No tickets available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AllTicketsContent() {
  const searchParams = useSearchParams();
  const isAI = searchParams.get('ai') === '1';
  const isPlanner = searchParams.get('planner') === '1';
  const cityFilter = searchParams.get('city') || '';
  const dateFilter = searchParams.get('date') || '';
  const queryFilter = searchParams.get('q') || '';

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [plannerResult, setPlannerResult] = useState<PlannerResult | null>(null);
  const [plannerLoading, setPlannerLoading] = useState(false);

  // Load planner results
  useEffect(() => {
    if (!isPlanner || !queryFilter) return;
    setPlannerLoading(true);
    fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryFilter }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.city) setPlannerResult(data);
      })
      .catch(() => {})
      .finally(() => setPlannerLoading(false));
  }, [isPlanner, queryFilter]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setAiSummary('');

      // AI search mode
      if (isAI) {
        try {
          const cached = sessionStorage.getItem('ai-search-result');
          if (cached) {
            sessionStorage.removeItem('ai-search-result');
            const data = JSON.parse(cached);
            const events = data.events || [];
            const mapped = events.map(feedEventToMatch);
            setMatches(mapped);
            setAiSummary(data.aiMessage || data.summary || `${mapped.length}건의 결과를 찾았습니다`);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Failed to load AI results from cache', e);
        }

        if (queryFilter) {
          try {
            const res = await fetch('/api/ai-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: queryFilter }),
            });
            if (res.ok) {
              const data = await res.json();
              const events = data.events || [];
              const mapped = events.map(feedEventToMatch);
              setMatches(mapped);
              setAiSummary(data.aiMessage || data.summary || `${mapped.length}건의 결과를 찾았습니다`);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('AI search failed', e);
          }
        }
      }

      // Regular / planner fallback — load events for the city if planner
      try {
        const params = new URLSearchParams({ per_page: '50', has_listing: 'true' });
        if (dateFilter) params.set('date_from', dateFilter);
        if (queryFilter && !isPlanner) params.set('performer', queryFilter);

        // For planner, try to get events in that city
        if (isPlanner && plannerResult?.city) {
          params.set('city', plannerResult.city);
        }

        const res = await fetch(`/api/tixstock/feed?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const events = data.data || [];
          if (events.length > 0) {
            let result = events.map(feedEventToMatch);
            if (cityFilter) {
              result = result.filter((m: Match) => m.venue.city.toLowerCase().includes(cityFilter.toLowerCase()));
            }
            if (queryFilter && !isPlanner) {
              const q = queryFilter.toLowerCase();
              result = result.filter((m: Match) =>
                m.name.toLowerCase().includes(q) ||
                m.homeTeam.toLowerCase().includes(q) ||
                m.awayTeam.toLowerCase().includes(q) ||
                m.venue.name.toLowerCase().includes(q)
              );
            }
            setMatches(result);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('API failed, using demo data', e);
      }
      let result = demoData.matches;
      if (cityFilter) result = result.filter(m => m.venue.city.toLowerCase().includes(cityFilter.toLowerCase()));
      if (queryFilter && !isPlanner) {
        const q = queryFilter.toLowerCase();
        result = result.filter(m => m.name.toLowerCase().includes(q) || m.homeTeam.toLowerCase().includes(q) || m.awayTeam.toLowerCase().includes(q));
      }
      setMatches(result);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAI, isPlanner, cityFilter, dateFilter, queryFilter, plannerResult?.city]);

  const activeFilters = [cityFilter, dateFilter, queryFilter].filter(Boolean);
  const showInlineSearch = isAI || isPlanner;

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className={`hero-bg ${showInlineSearch ? 'pb-0' : 'pb-28'}`}>
        <Header transparent />
        {!showInlineSearch && (
          <div className="max-w-[1280px] mx-auto px-4 pt-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold text-[rgba(219,234,254,0.5)] tracking-[1px]">OFFICIAL TICKET PARTNER</span>
            </div>
            <h1 className="text-[32px] md:text-[42px] font-extrabold text-white leading-tight">
              {queryFilter ? `Results for "${queryFilter}"` : 'All Tickets'}
            </h1>
            <p className="text-[15px] text-[rgba(219,234,254,0.6)] mt-2 max-w-[500px]">
              {cityFilter ? `Events in ${cityFilter}` : 'Browse all available events across leagues and cities'}
              {dateFilter ? ` on ${dateFilter}` : ''}
            </p>
            {activeFilters.length > 0 && (
              <div className="flex gap-2 mt-3">
                {cityFilter && <span className="px-3 py-1 rounded-full bg-white/15 text-[12px] text-white/80">📍 {cityFilter}</span>}
                {dateFilter && <span className="px-3 py-1 rounded-full bg-white/15 text-[12px] text-white/80">📅 {dateFilter}</span>}
                {queryFilter && <span className="px-3 py-1 rounded-full bg-white/15 text-[12px] text-white/80">🔍 {queryFilter}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`max-w-[1280px] mx-auto px-4 ${showInlineSearch ? 'mt-0' : '-mt-8'}`}>
        {/* AI/Planner mode: search bar overlapping into content */}
        {showInlineSearch && (
          <div className="mb-6 relative">
            <div className="max-w-[92%] mx-auto relative z-10">
              <SearchBar compact fullWidth />
            </div>

            {/* AI Summary Card */}
            {isAI && aiSummary && !loading && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm -mt-5 pt-8 px-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2B7FFF] to-[#7C3AED] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#6366F1] mb-1">Enttix AI</p>
                    <p className="text-[14px] text-[#374151] leading-[21px]">{aiSummary}</p>
                    <p className="text-[12px] text-[#9CA3AF] mt-2">{matches.length} events found</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search bar - non-AI/planner mode */}
        {!showInlineSearch && (
          <div className="mb-6">
            <SearchBar compact />
          </div>
        )}

        {/* Planner Results — inline, above events */}
        {isPlanner && (
          <>
            {plannerLoading && (
              <div className="flex flex-col items-center gap-3 py-12 mb-6">
                <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
                <p className="text-[#64748B] text-[14px]">✨ AI가 여행 일정을 만들고 있습니다...</p>
              </div>
            )}
            {plannerResult && <InlinePlanner plan={plannerResult} />}
          </>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="animate-spin h-8 w-8 text-[#2B7FFF]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div className="text-[16px] font-semibold text-[#9CA3AF]">
              {isAI ? '✨ AI가 검색 중...' : 'Loading events...'}
            </div>
          </div>
        ) : (
          <>
            {matches.length > 0 && (
              <>
                <h3 className="text-[13px] font-semibold text-[#9CA3AF] tracking-[0.5px] mb-4">
                  {isPlanner ? `🎫 Events in ${plannerResult?.city || 'this area'}` : 'Popular events'}
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                  {matches.slice(0, 6).map(m => (
                    <MatchCard
                      key={m.id}
                      id={m.id}
                      homeTeam={m.homeTeam}
                      awayTeam={m.awayTeam}
                      datetime={m.datetime}
                      startingPrice={m.startingPrice}
                      currency={m.currency}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-bold text-[#171717]">
                  {isPlanner ? 'All Available Events' : 'All Events'}
                </h2>
                <span className="text-[14px] font-semibold text-[#9CA3AF]">{matches.length}</span>
              </div>

              <div className="hidden md:grid grid-cols-[60px_1fr_200px_120px] gap-4 px-6 pb-3 text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px]">
                <span></span>
                <span>MATCH DATE & DETAILS</span>
                <span>LOCATION</span>
                <span className="text-right">STARTING PRICE</span>
              </div>

              <div className="bg-white rounded-[16px] border border-[#E5E7EB] overflow-hidden">
                {matches.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[18px] text-[#6B7280] mb-2">
                      {isAI || isPlanner ? '조건에 맞는 이벤트가 없습니다' : 'No events found matching your search.'}
                    </p>
                    {(isAI || isPlanner) && <p className="text-[14px] text-[#9CA3AF]">다른 조건으로 검색해보세요</p>}
                  </div>
                ) : (
                  matches.map(m => (
                    <MatchRow
                      key={m.id}
                      id={m.id}
                      homeTeam={m.homeTeam}
                      awayTeam={m.awayTeam}
                      datetime={m.datetime}
                      venue={m.venue.name}
                      city={m.venue.city}
                      startingPrice={m.startingPrice}
                      currency={m.currency}
                      ticketsLeft={m.ticketsLeft}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </main>
  );
}

export default function AllTicketsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="hero-bg pb-16"><Header transparent /></div>
        <div className="flex items-center justify-center py-16">
          <div className="text-[18px] font-semibold text-[#9CA3AF] animate-pulse">Loading...</div>
        </div>
      </main>
    }>
      <AllTicketsContent />
    </Suspense>
  );
}
