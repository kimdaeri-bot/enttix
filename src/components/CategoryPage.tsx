'use client';
import Header from '@/components/Header';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Match } from '@/types';

interface CategoryPageProps {
  slug: string;
  displayName: string;
  categoryType: 'sport' | 'concert';
}

// Unsplash images per category
const heroImages: Record<string, string> = {
  football: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1400&q=80',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1400&q=80',
  golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1400&q=80',
  rugby: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&q=80',
  cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1400&q=80',
  'formula-1': 'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=1400&q=80',
  motogp: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1400&q=80',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1400&q=80',
  ufc: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1400&q=80',
  darts: 'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=1400&q=80',
  'ice-hockey': 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=1400&q=80',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1400&q=80',
  baseball: 'https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=1400&q=80',
  'american-football': 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=1400&q=80',
  'winter-games': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1400&q=80',
  athletics: 'https://images.unsplash.com/photo-1461896836934-bd45ba28e312?w=1400&q=80',
  cycling: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1400&q=80',
  pop: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1400&q=80',
  rock: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1400&q=80',
  'rap-hip-hop': 'https://images.unsplash.com/photo-1571266028243-d220d14b364e?w=1400&q=80',
  'r-b': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1400&q=80',
  country: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1400&q=80',
  latin: 'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=1400&q=80',
  alternative: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1400&q=80',
  electronic: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1400&q=80',
  soul: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1400&q=80',
  classical: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=1400&q=80',
  jazz: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1400&q=80',
  metal: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1400&q=80',
};

const demoCategoryEvents: Match[] = [
  {
    id: 'demo-cat-1', name: 'Manchester City FC vs Newcastle United FC', homeTeam: 'Manchester City FC', awayTeam: 'Newcastle United FC',
    datetime: '2026-02-21T15:00:00+0000', venue: { id: 'v1', name: 'Etihad Stadium', address_line_1: '', address_line_2: '', city: 'Manchester', state: 'England', postcode: '', country_code: 'GB', latitude: 0, longitude: 0 },
    leagueId: 'epl', leagueName: 'English Premier League', startingPrice: 151.45, currency: 'USD', ticketsLeft: 4,
  },
  {
    id: 'demo-cat-2', name: 'Arsenal FC vs Chelsea FC', homeTeam: 'Arsenal FC', awayTeam: 'Chelsea FC',
    datetime: '2026-02-28T15:00:00+0000', venue: { id: 'v2', name: 'Emirates Stadium', address_line_1: '', address_line_2: '', city: 'London', state: 'England', postcode: '', country_code: 'GB', latitude: 0, longitude: 0 },
    leagueId: 'epl', leagueName: 'English Premier League', startingPrice: 120, currency: 'USD', ticketsLeft: 2,
  },
  {
    id: 'demo-cat-3', name: 'Liverpool FC vs West Ham FC', homeTeam: 'Liverpool FC', awayTeam: 'West Ham FC',
    datetime: '2026-03-04T20:00:00+0000', venue: { id: 'v3', name: 'Anfield', address_line_1: '', address_line_2: '', city: 'Liverpool', state: 'England', postcode: '', country_code: 'GB', latitude: 0, longitude: 0 },
    leagueId: 'epl', leagueName: 'English Premier League', startingPrice: 85, currency: 'USD', ticketsLeft: 2,
  },
  {
    id: 'demo-cat-4', name: 'Real Madrid CF vs FC Barcelona', homeTeam: 'Real Madrid CF', awayTeam: 'FC Barcelona',
    datetime: '2026-03-15T20:00:00+0000', venue: { id: 'v4', name: 'Santiago Bernabéu', address_line_1: '', address_line_2: '', city: 'Madrid', state: '', postcode: '', country_code: 'ES', latitude: 0, longitude: 0 },
    leagueId: 'laliga', leagueName: 'Spanish La Liga', startingPrice: 250, currency: 'USD', ticketsLeft: 6,
  },
  {
    id: 'demo-cat-5', name: 'Bayern Munich vs Borussia Dortmund', homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund',
    datetime: '2026-03-22T17:30:00+0000', venue: { id: 'v5', name: 'Allianz Arena', address_line_1: '', address_line_2: '', city: 'Munich', state: '', postcode: '', country_code: 'DE', latitude: 0, longitude: 0 },
    leagueId: 'bundesliga', leagueName: 'German Bundesliga', startingPrice: 95, currency: 'USD', ticketsLeft: 10,
  },
  {
    id: 'demo-cat-6', name: 'Juventus vs AC Milan', homeTeam: 'Juventus', awayTeam: 'AC Milan',
    datetime: '2026-04-05T19:45:00+0000', venue: { id: 'v6', name: 'Allianz Stadium', address_line_1: '', address_line_2: '', city: 'Turin', state: '', postcode: '', country_code: 'IT', latitude: 0, longitude: 0 },
    leagueId: 'seriea', leagueName: 'Italian Serie A', startingPrice: 110, currency: 'USD', ticketsLeft: 3,
  },
];

export default function CategoryPage({ slug, displayName, categoryType }: CategoryPageProps) {
  const [events, setEvents] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPerformer, setFilterPerformer] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tixstock/feed?category_name=${encodeURIComponent(displayName)}`);
        if (res.ok) {
          const data = await res.json();
          const items = data.data || [];
          if (items.length > 0) {
            setEvents(items.map((ev: Record<string, unknown>) => {
              const venue = (ev.venue as Record<string, unknown>) || {};
              const name = (ev.name as string) || '';
              const parts = name.split(/\s+vs?\s+/i);
              return {
                id: String(ev.id), name, homeTeam: parts[0]?.trim() || name, awayTeam: parts[1]?.trim() || '',
                datetime: (ev.datetime as string) || '', venue: {
                  id: String(venue.id || ''), name: (venue.name as string) || '', address_line_1: '', address_line_2: '',
                  city: (venue.city as string) || '', state: (venue.state as string) || '', postcode: '', country_code: (venue.country_code as string) || '',
                  latitude: 0, longitude: 0,
                },
                leagueId: '', leagueName: displayName, startingPrice: (ev.min_ticket_price as number) || 0, currency: (ev.currency as string) || 'USD', ticketsLeft: (ev.total_tickets as number) || 0,
              };
            }));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('API failed, using demo data', e);
      }
      setEvents(demoCategoryEvents);
      setLoading(false);
    }
    load();
  }, [displayName]);

  const heroImg = heroImages[slug] || heroImages['football'];

  const filtered = events.filter(ev => {
    if (filterPerformer && !ev.name.toLowerCase().includes(filterPerformer.toLowerCase())) return false;
    if (filterLocation && !ev.venue.city.toLowerCase().includes(filterLocation.toLowerCase()) && !ev.venue.name.toLowerCase().includes(filterLocation.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const popular = events.slice(0, 4);

  const performers = [...new Set(events.flatMap(e => [e.homeTeam, e.awayTeam].filter(Boolean)))];
  const locations = [...new Set(events.map(e => e.venue.city).filter(Boolean))];

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header /></div>

      {/* Hero Banner */}
      <div className="relative h-[280px] md:h-[340px] overflow-hidden bg-[#0F172A]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImg})` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 to-[#0F172A]/50" />
        </div>
        <div className="relative max-w-[1280px] mx-auto px-4 h-full flex flex-col justify-center">
          <p className="text-[14px] text-[#94A3B8] mb-2 uppercase tracking-wider">{categoryType === 'sport' ? 'Sports' : 'Concerts'}</p>
          <h1 className="text-[36px] md:text-[48px] font-extrabold text-white leading-tight">{displayName} Tickets</h1>
          <p className="text-[16px] text-[#CBD5E1] mt-2">{events.length} events available</p>
        </div>
      </div>

      {/* Popular Events */}
      {popular.length > 0 && (
        <div className="max-w-[1280px] mx-auto px-4 mt-8 mb-8">
          <h2 className="text-[20px] font-bold text-[#171717] mb-4">Popular Events</h2>
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {popular.map(ev => {
              const d = new Date(ev.datetime);
              return (
                <Link key={ev.id} href={`/event/${ev.id}`} className="flex-shrink-0 w-[280px] bg-white rounded-[16px] border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-[120px] bg-gradient-to-br from-[#1E3A5F] to-[#0F172A] flex items-center justify-center">
                    <span className="text-[40px]">{categoryType === 'sport' ? '⚽' : '🎵'}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-semibold text-[#2B7FFF] mb-1">
                      {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <h3 className="text-[14px] font-bold text-[#171717] line-clamp-2">{ev.name}</h3>
                    <p className="text-[12px] text-[#6B7280] mt-1">{ev.venue.name}</p>
                    {ev.startingPrice > 0 && (
                      <p className="text-[13px] font-bold text-[#171717] mt-2">From ${ev.startingPrice.toFixed(2)}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content: Filters + Event List */}
      <div className="max-w-[1280px] mx-auto px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-[260px] flex-shrink-0">
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 sticky top-4">
              <h3 className="text-[14px] font-bold text-[#171717] mb-4">Filters</h3>

              <div className="mb-4">
                <label className="text-[12px] font-semibold text-[#6B7280] block mb-1.5">Performer</label>
                <select
                  value={filterPerformer}
                  onChange={e => setFilterPerformer(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] bg-white"
                >
                  <option value="">All Performers</option>
                  {performers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="mb-4">
                <label className="text-[12px] font-semibold text-[#6B7280] block mb-1.5">Location</label>
                <select
                  value={filterLocation}
                  onChange={e => setFilterLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] bg-white"
                >
                  <option value="">All Locations</option>
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {(filterPerformer || filterLocation) && (
                <button onClick={() => { setFilterPerformer(''); setFilterLocation(''); }} className="text-[12px] text-[#2B7FFF] hover:underline">
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Event List */}
          <div className="flex-1">
            <h2 className="text-[18px] font-bold text-[#171717] mb-4">
              {loading ? 'Loading events...' : `${filtered.length} Events`}
            </h2>

            {!loading && filtered.length === 0 && (
              <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-8 text-center">
                <p className="text-[16px] text-[#6B7280]">No events found for this category.</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {filtered.map(ev => {
                const d = new Date(ev.datetime);
                return (
                  <Link key={ev.id} href={`/event/${ev.id}`} className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 flex items-center gap-4 hover:shadow-md hover:border-[#2B7FFF]/30 transition-all group">
                    {/* Date */}
                    <div className="flex-shrink-0 w-[52px] text-center">
                      <div className="text-[12px] font-bold text-[#2B7FFF] uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</div>
                      <div className="text-[22px] font-extrabold text-[#171717] leading-tight">{d.getDate()}</div>
                    </div>

                    <div className="w-[1px] h-10 bg-[#E5E7EB]" />

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-bold text-[#171717] truncate group-hover:text-[#2B7FFF] transition-colors">{ev.name}</h3>
                      <p className="text-[12px] text-[#6B7280] mt-0.5">{ev.venue.name}{ev.venue.city ? `, ${ev.venue.city}` : ''}</p>
                    </div>

                    {/* Price */}
                    <div className="flex-shrink-0 text-right">
                      {ev.startingPrice > 0 && (
                        <div className="text-[15px] font-bold text-[#171717]">${ev.startingPrice.toFixed(2)}</div>
                      )}
                      <div className="text-[11px] text-[#9CA3AF]">{ev.ticketsLeft > 0 ? `${ev.ticketsLeft} tickets` : ''}</div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 text-[#9CA3AF] group-hover:text-[#2B7FFF] transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
