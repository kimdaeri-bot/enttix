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

function AllTicketsContent() {
  const searchParams = useSearchParams();
  const isAI = searchParams.get('ai') === '1';
  const cityFilter = searchParams.get('city') || '';
  const dateFilter = searchParams.get('date') || '';
  const queryFilter = searchParams.get('q') || '';

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');

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

      // Regular search
      try {
        const params = new URLSearchParams({ per_page: '50', has_listing: 'true' });
        if (dateFilter) params.set('date_from', dateFilter);
        if (queryFilter) params.set('performer', queryFilter);

        const res = await fetch(`/api/tixstock/feed?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const events = data.data || [];
          if (events.length > 0) {
            let result = events.map(feedEventToMatch);
            if (cityFilter) {
              result = result.filter((m: Match) => m.venue.city.toLowerCase().includes(cityFilter.toLowerCase()));
            }
            if (queryFilter) {
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
      if (queryFilter) {
        const q = queryFilter.toLowerCase();
        result = result.filter(m => m.name.toLowerCase().includes(q) || m.homeTeam.toLowerCase().includes(q) || m.awayTeam.toLowerCase().includes(q));
      }
      setMatches(result);
      setLoading(false);
    }
    load();
  }, [isAI, cityFilter, dateFilter, queryFilter]);

  const activeFilters = [cityFilter, dateFilter, queryFilter].filter(Boolean);

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className={`hero-bg ${isAI ? 'pb-0' : 'pb-28'}`}>
        <Header transparent />
        {!isAI && (
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

      <div className={`max-w-[1280px] mx-auto px-4 ${isAI ? 'mt-0' : '-mt-8'}`}>
        {/* Search bar + AI Response combined */}
        <div className="mb-6">
          {isAI ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
              {/* Search bar inside card */}
              <div className="px-4 pt-4">
                <SearchBar compact />
              </div>
              {/* AI answer */}
              {aiSummary && !loading && (
                <div className="px-5 py-4 border-t border-[#F3F4F6] mt-3">
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
          ) : (
            <SearchBar compact />
          )}
        </div>

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
                <h3 className="text-[13px] font-semibold text-[#9CA3AF] tracking-[0.5px] mb-4">Popular events</h3>
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
                <h2 className="text-[18px] font-bold text-[#171717]">All Events</h2>
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
                      {isAI ? '조건에 맞는 이벤트가 없습니다' : 'No events found matching your search.'}
                    </p>
                    {isAI && <p className="text-[14px] text-[#9CA3AF]">다른 조건으로 검색해보세요</p>}
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
