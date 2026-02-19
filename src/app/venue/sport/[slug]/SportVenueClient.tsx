'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

interface Venue {
  id: string;
  name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postcode: string;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
}

interface Event {
  id: string;
  name: string;
  date: string;
  venue: Venue;
  competition?: { name: string };
  min_price?: number;
  currency?: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatPrice(price?: number, currency?: string) {
  if (!price) return null;
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'GBP', minimumFractionDigits: 0 }).format(price);
}

export default function SportVenueClient({ slug }: { slug: string }) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/tixstock/feed');
        if (!res.ok) return;
        const data = await res.json();
        const allEvents: Record<string, unknown>[] = data.data || [];

        let matchedVenue: Venue | null = null;
        const venueEvents: Event[] = [];

        for (const ev of allEvents) {
          const v = ev.venue as Record<string, unknown> | undefined;
          if (!v) continue;
          const vname = String(v.name || '');
          if (toSlug(vname) === slug) {
            if (!matchedVenue) {
              matchedVenue = {
                id: String(v.id || ''),
                name: vname,
                address_line_1: String(v.address_line_1 || ''),
                address_line_2: String(v.address_line_2 || ''),
                city: String(v.city || ''),
                state: String(v.state || ''),
                postcode: String(v.postcode || ''),
                country_code: String(v.country_code || ''),
                latitude: v.latitude != null ? Number(v.latitude) : null,
                longitude: v.longitude != null ? Number(v.longitude) : null,
              };
            }
            const comp = ev.competition as Record<string, unknown> | undefined;
            const pricing = ev.min_price as Record<string, unknown> | undefined;
            venueEvents.push({
              id: String(ev.id || ''),
              name: String(ev.name || ''),
              date: String(ev.date || ev.start_date || ''),
              venue: matchedVenue,
              competition: comp ? { name: String(comp.name || '') } : undefined,
              min_price: pricing ? Number(pricing.amount || 0) : (typeof ev.min_price === 'number' ? ev.min_price : undefined),
              currency: String(ev.currency || 'GBP'),
            });
          }
        }

        setVenue(matchedVenue);
        setEvents(venueEvents);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const mapsUrl = venue
    ? venue.latitude && venue.longitude
      ? `https://maps.google.com/?q=${venue.latitude},${venue.longitude}`
      : `https://maps.google.com/?q=${encodeURIComponent([venue.address_line_1, venue.city, venue.postcode, venue.country_code].filter(Boolean).join(', '))}`
    : '#';

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="hero-bg pb-16">
        <Header transparent hideSearch />
        <div className="max-w-[1280px] mx-auto px-4 pt-8">
          <div className="flex items-center gap-2 text-[#93C5FD] text-[13px] mb-4">
            <Link href="/venues" className="hover:text-white transition-colors">Venues</Link>
            <span>/</span>
            <span className="text-white">{venue?.name || slug}</span>
          </div>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-white/10 rounded-xl w-2/3 mb-3"/>
              <div className="h-5 bg-white/10 rounded-xl w-1/3"/>
            </div>
          ) : venue ? (
            <>
              <h1 className="text-[32px] md:text-[44px] font-extrabold text-white leading-tight">{venue.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {venue.city && (
                  <span className="flex items-center gap-1.5 text-[14px] text-[#DBEAFE]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                      <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    {venue.city}{venue.country_code ? `, ${venue.country_code}` : ''}
                  </span>
                )}
                {venue.address_line_1 && (
                  <span className="text-[13px] text-[rgba(219,234,254,0.6)]">{venue.address_line_1}</span>
                )}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[13px] text-[#60A5FA] hover:text-white transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  View on Google Maps
                </a>
              </div>
            </>
          ) : (
            <div>
              <h1 className="text-[32px] font-extrabold text-white">Venue not found</h1>
              <p className="text-[#DBEAFE] mt-2">No events found for this venue.</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 -mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold text-[#171717]">
            Upcoming Events
            {events.length > 0 && <span className="ml-2 text-[14px] font-medium text-[#6B7280]">({events.length})</span>}
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-5 animate-pulse">
                <div className="h-4 bg-[#F3F4F6] rounded w-1/2 mb-2"/>
                <div className="h-3 bg-[#F3F4F6] rounded w-1/3"/>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-[#E5E7EB]">
            <div className="text-[48px] mb-4">🏟️</div>
            <p className="text-[16px] font-semibold text-[#374151]">No upcoming events at this venue</p>
            <Link href="/venues" className="mt-3 inline-block text-[14px] text-[#2B7FFF] hover:underline">
              Browse all venues →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(ev => (
              <Link key={ev.id} href={`/event/${ev.id}`} className="block">
                <div className="bg-white rounded-xl border border-[#E5E7EB] hover:border-[#2B7FFF] hover:shadow-md transition-all p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-[#171717] truncate">{ev.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        {ev.date && (
                          <span className="text-[13px] text-[#6B7280] flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            {formatDate(ev.date)}
                          </span>
                        )}
                        {ev.competition?.name && (
                          <span className="text-[12px] text-[#2B7FFF] bg-[#EFF6FF] px-2 py-0.5 rounded-full font-medium">{ev.competition.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                      {ev.min_price ? (
                        <div className="text-right">
                          <div className="text-[11px] text-[#9CA3AF]">From</div>
                          <div className="text-[16px] font-bold text-[#171717]">{formatPrice(ev.min_price, ev.currency)}</div>
                        </div>
                      ) : null}
                      <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2.5">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </main>
  );
}
