// Tixstock Sandbox API client
import { Match } from '@/types';

const BASE_URL = 'https://sandbox-pf.tixstock.com/v1';
const BEARER_TOKEN = 'ac1f6d1f4c3ba067b8d13f2419';

const headers = () => ({
  'Authorization': `Bearer ${BEARER_TOKEN}`,
  'Content-Type': 'application/json',
});

// Convert Tixstock feed event to our Match type
function feedEventToMatch(event: Record<string, unknown>): Match {
  const venue = (event.venue as Record<string, unknown>) || {};
  const performers = (event.performers as Array<Record<string, unknown>>) || [];
  const categories = (event.categories as Array<Record<string, string>>) || [];
  const name = (event.name as string) || '';

  // Try to extract home/away from event name (e.g. "Team A vs Team B")
  const parts = name.split(/\s+vs?\s+/i);
  const homeTeam = parts[0]?.trim() || name;
  const awayTeam = parts[1]?.trim() || (performers[1] as Record<string, unknown>)?.name as string || '';

  const categoryName = categories[0]?.name || '';

  // Map category to league
  const leagueMap: Record<string, { id: string; name: string }> = {
    'English Premier League': { id: 'epl', name: 'English Premier League' },
    'Premier League': { id: 'epl', name: 'English Premier League' },
    'Spanish La Liga': { id: 'laliga', name: 'Spanish La Liga' },
    'La Liga': { id: 'laliga', name: 'Spanish La Liga' },
    'German Bundesliga': { id: 'bundesliga', name: 'German Bundesliga' },
    'Bundesliga': { id: 'bundesliga', name: 'German Bundesliga' },
    'Italian Serie A': { id: 'seriea', name: 'Italian Serie A' },
    'Serie A': { id: 'seriea', name: 'Italian Serie A' },
    'French Ligue 1': { id: 'ligue1', name: 'French Ligue 1' },
    'Ligue 1': { id: 'ligue1', name: 'French Ligue 1' },
    'Champions League': { id: 'ucl', name: 'Champions League' },
    'UEFA Champions League': { id: 'ucl', name: 'Champions League' },
    'Formula 1': { id: 'f1', name: 'Formula 1' },
    'NBA': { id: 'nba', name: 'NBA' },
  };

  const league = leagueMap[categoryName] || { id: categoryName.toLowerCase().replace(/\s+/g, '-'), name: categoryName };

  return {
    id: String(event.id || ''),
    name,
    homeTeam,
    awayTeam,
    datetime: (event.datetime as string) || '',
    venue: {
      id: String(venue.id || ''),
      name: (venue.name as string) || '',
      address_line_1: (venue.address_line_1 as string) || '',
      address_line_2: (venue.address_line_2 as string) || '',
      city: (venue.city as string) || '',
      state: (venue.state as string) || '',
      postcode: (venue.postcode as string) || '',
      country_code: (venue.country_code as string) || '',
      latitude: (venue.latitude as number) || 0,
      longitude: (venue.longitude as number) || 0,
    },
    leagueId: league.id,
    leagueName: league.name,
    startingPrice: (event.min_ticket_price as number) || (event.starting_price as number) || 0,
    currency: (event.currency as string) || 'USD',
    ticketsLeft: (event.total_tickets as number) || (event.tickets_available as number) || 0,
  };
}

export const tixstockApi = {
  // Get events feed
  async getFeed(params: Record<string, string> = {}): Promise<{ data: Record<string, unknown>[]; meta?: Record<string, unknown> }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/feed?${query}`, { headers: headers(), next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Feed error: ${res.status}`);
    return res.json();
  },

  // Get tickets for an event
  async getTickets(eventId: string, params: Record<string, string> = {}) {
    const query = new URLSearchParams({ event_id: eventId, lighter_response: '1', per_page: '500', ...params }).toString();
    const res = await fetch(`${BASE_URL}/tickets/feed?${query}`, { headers: headers(), cache: 'no-store' });
    if (!res.ok) throw new Error(`Tickets error: ${res.status}`);
    return res.json();
  },

  // Hold tickets
  async holdTickets(listingId: string, quantity: number) {
    const res = await fetch(`${BASE_URL}/tickets/hold`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ listing_id: listingId, quantity }),
    });
    if (!res.ok) throw new Error(`Hold error: ${res.status}`);
    return res.json();
  },

  // Release held tickets
  async releaseTickets(holdId: string) {
    const res = await fetch(`${BASE_URL}/tickets/release`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ hold_id: holdId }),
    });
    if (!res.ok) throw new Error(`Release error: ${res.status}`);
    return res.json();
  },

  // Add order
  async addOrder(holdId: string, quantity: number, orderData: Record<string, unknown>) {
    const res = await fetch(`${BASE_URL}/orders/add/${holdId}/${quantity}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error(`Order error: ${res.status}`);
    return res.json();
  },

  // Get categories
  async getCategories() {
    const res = await fetch(`${BASE_URL}/categories`, { headers: headers(), next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Categories error: ${res.status}`);
    return res.json();
  },
};

// Fetch matches from API with fallback to demo data
export async function getMatches(params: Record<string, string> = {}): Promise<Match[]> {
  try {
    const result = await tixstockApi.getFeed(params);
    const events = result.data || [];
    if (events.length > 0) {
      return events.map(feedEventToMatch);
    }
  } catch (e) {
    console.warn('Tixstock API failed, using demo data:', e);
  }
  return demoData.matches;
}

// Fetch tickets for an event
export async function getEventTickets(eventId: string) {
  try {
    const result = await tixstockApi.getTickets(eventId);
    return result.data || [];
  } catch (e) {
    console.warn('Tixstock tickets API failed:', e);
    return null;
  }
}

// Fetch a single event from feed
export async function getEvent(eventId: string): Promise<Match | null> {
  try {
    const result = await tixstockApi.getFeed({ event_id: eventId });
    const events = result.data || [];
    if (events.length > 0) {
      return feedEventToMatch(events[0]);
    }
  } catch (e) {
    console.warn('Tixstock event API failed:', e);
  }
  return demoData.matches.find(m => m.id === eventId) || null;
}

// Process split_type for display quantity
export function getDisplayQuantity(listing: Record<string, unknown>): number[] {
  const quantity = listing.quantity as Record<string, unknown>;
  const ticket = listing.ticket as Record<string, unknown>;
  const available = (quantity?.available as number) || 0;
  const splitType = (ticket?.split_type as string) || 'any';
  const displayQty = (quantity?.display_quantity as number) || 0;

  if (displayQty > 0) return [displayQty];

  switch (splitType) {
    case 'any':
      return Array.from({ length: available }, (_, i) => i + 1);
    case 'avoid-one':
      return Array.from({ length: available }, (_, i) => i + 1).filter(n => n !== available - 1);
    case 'none':
      return [available];
    case 'pairs':
      return Array.from({ length: Math.floor(available / 2) }, (_, i) => (i + 1) * 2);
    default:
      return Array.from({ length: available }, (_, i) => i + 1);
  }
}

// Demo data for when API is not connected
export const demoData = {
  matches: [
    {
      id: 'demo-1',
      name: 'Manchester City FC vs Newcastle United FC',
      homeTeam: 'Manchester City FC',
      awayTeam: 'Newcastle United FC',
      datetime: '2026-02-21T15:00:00+0000',
      venue: { id: 'v1', name: 'Etihad Stadium', address_line_1: '', address_line_2: '', city: 'Manchester', state: 'England', postcode: '', country_code: 'GB', latitude: 53.483, longitude: -2.200 },
      leagueId: 'epl',
      leagueName: 'English Premier League',
      startingPrice: 151.45,
      currency: 'USD',
      ticketsLeft: 4,
    },
    {
      id: 'demo-2',
      name: 'Arsenal FC vs Chelsea FC',
      homeTeam: 'Arsenal FC',
      awayTeam: 'Chelsea FC',
      datetime: '2026-02-28T15:00:00+0000',
      venue: { id: 'v2', name: 'Emirates Stadium', address_line_1: '', address_line_2: '', city: 'London', state: 'England', postcode: '', country_code: 'GB', latitude: 51.555, longitude: -0.108 },
      leagueId: 'epl',
      leagueName: 'English Premier League',
      startingPrice: 120,
      currency: 'USD',
      ticketsLeft: 2,
    },
    {
      id: 'demo-3',
      name: 'Liverpool FC vs West Ham FC',
      homeTeam: 'Liverpool FC',
      awayTeam: 'West Ham FC',
      datetime: '2026-02-28T15:00:00+0000',
      venue: { id: 'v3', name: 'Anfield', address_line_1: '', address_line_2: '', city: 'Liverpool', state: 'England', postcode: '', country_code: 'GB', latitude: 53.431, longitude: -2.961 },
      leagueId: 'epl',
      leagueName: 'English Premier League',
      startingPrice: 85,
      currency: 'USD',
      ticketsLeft: 2,
    },
    {
      id: 'demo-4',
      name: 'Real Madrid CF vs RCD Espanyol',
      homeTeam: 'Real Madrid CF',
      awayTeam: 'RCD Espanyol',
      datetime: '2026-05-03T20:00:00+0000',
      venue: { id: 'v4', name: 'Santiago Bernabéu', address_line_1: '', address_line_2: '', city: 'Madrid', state: '', postcode: '', country_code: 'ES', latitude: 40.453, longitude: -3.688 },
      leagueId: 'laliga',
      leagueName: 'Spanish La Liga',
      startingPrice: 95,
      currency: 'USD',
      ticketsLeft: 8,
    },
    {
      id: 'demo-5',
      name: 'Manchester City FC vs Nottingham Forest FC',
      homeTeam: 'Manchester City FC',
      awayTeam: 'Nottingham Forest FC',
      datetime: '2026-03-04T20:00:00+0000',
      venue: { id: 'v1', name: 'Etihad Stadium', address_line_1: '', address_line_2: '', city: 'Manchester', state: 'England', postcode: '', country_code: 'GB', latitude: 53.483, longitude: -2.200 },
      leagueId: 'epl',
      leagueName: 'English Premier League',
      startingPrice: 20,
      currency: 'USD',
      ticketsLeft: 1,
    },
    {
      id: 'demo-6',
      name: 'Arsenal FC vs Brighton & Hove Albion FC',
      homeTeam: 'Arsenal FC',
      awayTeam: 'Brighton & Hove Albion FC',
      datetime: '2026-03-04T20:00:00+0000',
      venue: { id: 'v5', name: 'American Express Community Stadium', address_line_1: '', address_line_2: '', city: 'Brighton', state: 'England', postcode: '', country_code: 'GB', latitude: 50.862, longitude: -0.084 },
      leagueId: 'epl',
      leagueName: 'English Premier League',
      startingPrice: 80,
      currency: 'USD',
      ticketsLeft: 4,
    },
  ],
  leagues: [
    { id: 'epl', name: 'English Premier League', slug: 'EnglishPremierLeague', eventCount: 37, image: '/images/epl.svg' },
    { id: 'laliga', name: 'Spanish La Liga', slug: 'SpanishLaLiga', eventCount: 5, image: '/images/laliga.svg' },
    { id: 'bundesliga', name: 'German Bundesliga', slug: 'GermanBundesliga', eventCount: 0, image: '' },
    { id: 'seriea', name: 'Italian Serie A', slug: 'ItalianSerieA', eventCount: 0, image: '' },
    { id: 'ligue1', name: 'French Ligue 1', slug: 'FrenchLigue1', eventCount: 0, image: '' },
    { id: 'ucl', name: 'Champions League', slug: 'ChampionsLeague', eventCount: 0, image: '' },
    { id: 'f1', name: 'Formula 1', slug: 'Formula1', eventCount: 0, image: '' },
    { id: 'nba', name: 'NBA', slug: 'NBA', eventCount: 0, image: '' },
  ],
  cities: [
    { name: 'London', slug: 'london', eventCount: 6, image: '/images/cities/london.jpg' },
    { name: 'Barcelona', slug: 'barcelona', eventCount: 3, image: '/images/cities/barcelona.jpg' },
    { name: 'Paris', slug: 'paris', eventCount: 0, image: '/images/cities/paris.jpg' },
    { name: 'Milan', slug: 'milan', eventCount: 0, image: '/images/cities/milan.jpg' },
    { name: 'Manchester', slug: 'manchester', eventCount: 5, image: '/images/cities/manchester.jpg' },
    { name: 'Madrid', slug: 'madrid', eventCount: 1, image: '/images/cities/madrid.jpg' },
  ],
};
