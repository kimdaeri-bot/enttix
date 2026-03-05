'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

interface TheatreVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  nearestTube: string;
}

interface Show {
  EventId: number;
  Name: string;
  MainImageUrl: string;
  TagLine: string;
  EventMinimumPrice: number;
  StartDate: string;
  EndDate: string;
}

function formatPrice(price: number) {
  if (!price) return null;
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(price);
}

function formatDateRange(start: string, end: string) {
  if (!start) return '';
  const s = new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (!end) return s;
  const e = new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${s} – ${e}`;
}

export default function TheatreVenueClient({ slug }: { slug: string }) {
  const [venue, setVenue] = useState<TheatreVenue | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/ltd/events');
        if (!res.ok) return;
        const data = await res.json();
        const allEvents: Record<string, unknown>[] = data.events || [];

        let matchedVenue: TheatreVenue | null = null;
        const venueShows: Show[] = [];

        for (const ev of allEvents) {
          const vObj = ev.Venue as Record<string, unknown> | undefined;
          const vName = String(vObj?.Name || ev.VenueName || '');
          if (!vName) continue;

          if (toSlug(vName) === slug) {
            if (!matchedVenue) {
              const addr = String(vObj?.Address || ev.VenueAddress || '');
              const addrParts = addr.split(',').map((s: string) => s.trim()).filter(Boolean);
              const city = addrParts.length >= 2 ? addrParts[addrParts.length - 2] : (addrParts[0] || 'London');
              matchedVenue = {
                id: String(vObj?.Id || vName),
                name: vName,
                address: addr,
                city,
                nearestTube: String(ev.VenueNearestTube || vObj?.NearestTube || ''),
              };
            }
            venueShows.push({
              EventId: ev.EventId as number,
              Name: ev.Name as string || '',
              MainImageUrl: ev.MainImageUrl as string || '',
              TagLine: ev.TagLine as string || '',
              EventMinimumPrice: ev.EventMinimumPrice as number || 0,
              StartDate: ev.StartDate as string || '',
              EndDate: ev.EndDate as string || '',
            });
          }
        }

        setVenue(matchedVenue);
        setShows(venueShows);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const mapsUrl = venue?.address
    ? `https://maps.google.com/?q=${encodeURIComponent(venue.address)}`
    : '#';

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Hero */}
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
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[11px] font-bold text-[#A855F7] bg-[#A855F7]/20 px-2.5 py-1 rounded-full">Theatre</span>
              </div>
              <h1 className="text-[32px] md:text-[44px] font-extrabold text-white leading-tight">{venue.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {venue.city && (
                  <span className="flex items-center gap-1.5 text-[14px] text-[#DBEAFE]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                      <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    {venue.city}
                  </span>
                )}
                {venue.nearestTube && (
                  <span className="text-[13px] text-[rgba(219,234,254,0.7)]">🚇 {venue.nearestTube}</span>
                )}
                {venue.address && (
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
                )}
              </div>
            </>
          ) : (
            <div>
              <h1 className="text-[32px] font-extrabold text-white">Theatre not found</h1>
              <p className="text-[#DBEAFE] mt-2">No shows found for this theatre.</p>
            </div>
          )}
        </div>
      </div>

      {/* Shows */}
      <div className="max-w-[1280px] mx-auto px-4 -mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold text-[#171717]">
            Current Shows
            {shows.length > 0 && <span className="ml-2 text-[14px] font-medium text-[#6B7280]">({shows.length})</span>}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden animate-pulse">
                <div className="h-48 bg-[#F3F4F6]"/>
                <div className="p-4">
                  <div className="h-4 bg-[#F3F4F6] rounded w-3/4 mb-2"/>
                  <div className="h-3 bg-[#F3F4F6] rounded w-1/2"/>
                </div>
              </div>
            ))}
          </div>
        ) : shows.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-[#E5E7EB]">
            <div className="text-[48px] mb-4">🎭</div>
            <p className="text-[16px] font-semibold text-[#374151]">No shows at this theatre</p>
            <Link href="/venues" className="mt-3 inline-block text-[14px] text-[#2B7FFF] hover:underline">
              Browse all venues →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shows.map(show => (
              <Link key={show.EventId} href={`/musical/event/${show.EventId}`} className="block">
                <div className="bg-white rounded-xl border border-[#E5E7EB] hover:border-[#9333EA] hover:shadow-lg transition-all overflow-hidden">
                  {show.MainImageUrl ? (
                    <div className="relative h-48 w-full bg-[#F3F4F6] overflow-hidden">
                      <Image
                        src={show.MainImageUrl}
                        alt={show.Name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-[#9333EA]/20 to-[#7C3AED]/30 flex items-center justify-center">
                      <span className="text-[48px]">🎭</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-[15px] font-bold text-[#171717] leading-tight mb-1">{show.Name}</h3>
                    {show.TagLine && (
                      <p className="text-[12px] text-[#6B7280] line-clamp-2 mb-2">{show.TagLine}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F3F4F6]">
                      {(show.StartDate || show.EndDate) && (
                        <span className="text-[11px] text-[#9CA3AF]">
                          {formatDateRange(show.StartDate, show.EndDate)}
                        </span>
                      )}
                      {show.EventMinimumPrice > 0 && (
                        <span className="text-[13px] font-bold text-[#171717]">
                          From {formatPrice(show.EventMinimumPrice)}
                        </span>
                      )}
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
