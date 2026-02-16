// Tixstock Sandbox API client
const BASE_URL = 'https://sandbox-pf.tixstock.com/v1';

// Bearer token - will be set from Reseller Admin
let BEARER_TOKEN = process.env.NEXT_PUBLIC_TIXSTOCK_TOKEN || '';

const headers = () => ({
  'Authorization': `Bearer ${BEARER_TOKEN}`,
  'Content-Type': 'application/json',
});

export const tixstockApi = {
  // Get events feed
  async getFeed(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/feed?${query}`, { headers: headers(), next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Feed error: ${res.status}`);
    return res.json();
  },

  // Get tickets for an event
  async getTickets(eventId: string, params: Record<string, string> = {}) {
    const query = new URLSearchParams({ event_id: eventId, lighter_response: '1', ...params }).toString();
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

  // Get order
  async getOrder(orderId: string) {
    const res = await fetch(`${BASE_URL}/orders/get?order_id=${orderId}`, { headers: headers() });
    if (!res.ok) throw new Error(`Get order error: ${res.status}`);
    return res.json();
  },

  // Get categories
  async getCategories() {
    const res = await fetch(`${BASE_URL}/categories`, { headers: headers(), next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Categories error: ${res.status}`);
    return res.json();
  },

  // Get venues
  async getVenues(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/venues?${query}`, { headers: headers(), next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Venues error: ${res.status}`);
    return res.json();
  },

  // Get performers
  async getPerformers(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/performers?${query}`, { headers: headers(), next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Performers error: ${res.status}`);
    return res.json();
  },
};

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
  ],
  cities: [
    { name: 'London', slug: 'london', eventCount: 6, image: '/images/cities/london.jpg' },
    { name: 'Manchester', slug: 'manchester', eventCount: 5, image: '/images/cities/manchester.jpg' },
    { name: 'Barcelona', slug: 'barcelona', eventCount: 3, image: '/images/cities/barcelona.jpg' },
    { name: 'Paris', slug: 'paris', eventCount: 0, image: '/images/cities/paris.jpg' },
    { name: 'Milan', slug: 'milan', eventCount: 0, image: '/images/cities/milan.jpg' },
    { name: 'Madrid', slug: 'madrid', eventCount: 1, image: '/images/cities/madrid.jpg' },
  ],
};
