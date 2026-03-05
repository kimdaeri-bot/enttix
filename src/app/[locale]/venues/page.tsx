'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

interface SportVenue {
  id: string;
  name: string;
  city: string;
  country_code: string;
  address_line_1: string;
  address_line_2: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  eventCount: number;
}

interface TheatreVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  nearestTube: string;
  eventCount: number;
  sampleEventId: number;
  sampleEventName: string;
  sampleImageUrl: string;
}

function SportVenueCard({ venue }: { venue: SportVenue }) {
  const slug = toSlug(venue.name);
  return (
    <Link href={`/venue/sport/${slug}`} className="block">
      <div className="bg-white rounded-xl border border-[#E5E7EB] hover:border-[#2B7FFF] hover:shadow-lg transition-all p-6 h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
            </svg>
          </div>
          <span className="text-[11px] font-bold text-[#2B7FFF] bg-[#EFF6FF] px-2 py-1 rounded-full">
            {venue.country_code || '??'}
          </span>
        </div>
        <h3 className="text-[16px] font-bold text-[#171717] leading-tight mb-1">{venue.name}</h3>
        {venue.city && (
          <p className="text-[13px] text-[#6B7280] flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            {venue.city}
          </p>
        )}
        {venue.address_line_1 && (
          <p className="text-[12px] text-[#9CA3AF] mt-1 truncate">{venue.address_line_1}</p>
        )}
        <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
          <span className="text-[12px] font-semibold text-[#6B7280]">
            {venue.eventCount} {venue.eventCount === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function TheatreVenueCard({ venue }: { venue: TheatreVenue }) {
  const slug = toSlug(venue.name);
  return (
    <Link href={`/venue/theatre/${slug}`} className="block">
      <div className="bg-white rounded-xl border border-[#E5E7EB] hover:border-[#2B7FFF] hover:shadow-lg transition-all p-6 h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#FDF4FF] flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-[11px] font-bold text-[#9333EA] bg-[#FDF4FF] px-2 py-1 rounded-full">Theatre</span>
        </div>
        <h3 className="text-[16px] font-bold text-[#171717] leading-tight mb-1">{venue.name}</h3>
        {venue.city && (
          <p className="text-[13px] text-[#6B7280] flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            {venue.city}
          </p>
        )}
        {venue.nearestTube && (
          <p className="text-[12px] text-[#9CA3AF] mt-1">🚇 {venue.nearestTube}</p>
        )}
        {venue.address && !venue.city && (
          <p className="text-[12px] text-[#9CA3AF] mt-1 truncate">{venue.address}</p>
        )}
        <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
          <span className="text-[12px] font-semibold text-[#6B7280]">
            {venue.eventCount} {venue.eventCount === 1 ? 'show' : 'shows'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function VenuesPage() {
  const [tab, setTab] = useState<'sport' | 'theatre'>('sport');
  const [search, setSearch] = useState('');
  const [sportVenues, setSportVenues] = useState<SportVenue[]>([]);
  const [theatreVenues, setTheatreVenues] = useState<TheatreVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sv, tv] = await Promise.all([
          fetch('/api/tixstock/venues').then(r => r.ok ? r.json() : { venues: [] }),
          fetch('/api/ltd/theatres').then(r => r.ok ? r.json() : { venues: [] }),
        ]);
        setSportVenues(sv.venues || []);
        setTheatreVenues(tv.venues || []);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredSport = sportVenues.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.country_code || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredTheatre = theatreVenues.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.address || '').toLowerCase().includes(search.toLowerCase())
  );

  const current = tab === 'sport' ? filteredSport : filteredTheatre;

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Hero */}
      <div className="hero-bg pb-16">
        <Header transparent hideSearch />
        <div className="max-w-[1280px] mx-auto px-4 pt-8">
          <h1 className="text-[36px] md:text-[48px] font-extrabold text-white leading-tight">
            Venues &amp;<br /><span className="text-[#2B7FFF]">Stadiums</span>
          </h1>
          <p className="text-[16px] text-[rgba(219,234,254,0.7)] mt-3 max-w-[520px]">
            Explore sport stadiums and musical theatres. Find upcoming events at your favourite venues.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-[28px] font-extrabold text-white">{sportVenues.length}</div>
              <div className="text-[12px] font-semibold text-[rgba(219,234,254,0.5)] tracking-[0.5px]">SPORT VENUES</div>
            </div>
            <div className="text-center">
              <div className="text-[28px] font-extrabold text-white">{theatreVenues.length}</div>
              <div className="text-[12px] font-semibold text-[rgba(219,234,254,0.5)] tracking-[0.5px]">THEATRES</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-4 -mt-6">
        {/* Search + Tabs */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6 shadow-sm">
          {/* Search bar */}
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search venues by name or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#2B7FFF] text-[#171717] placeholder:text-[#9CA3AF]"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setTab('sport')}
              className={`px-4 py-2 rounded-xl text-[14px] font-semibold transition-colors ${
                tab === 'sport'
                  ? 'bg-[#2B7FFF] text-white'
                  : 'text-[#6B7280] bg-[#F3F4F6] hover:bg-[#E5E7EB]'
              }`}
            >
              🏟️ Sport Stadiums {sportVenues.length > 0 && `(${sportVenues.length})`}
            </button>
            <button
              onClick={() => setTab('theatre')}
              className={`px-4 py-2 rounded-xl text-[14px] font-semibold transition-colors ${
                tab === 'theatre'
                  ? 'bg-[#9333EA] text-white'
                  : 'text-[#6B7280] bg-[#F3F4F6] hover:bg-[#E5E7EB]'
              }`}
            >
              🎭 Theatres {theatreVenues.length > 0 && `(${theatreVenues.length})`}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-6 h-[160px] animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] mb-3"/>
                <div className="h-4 bg-[#F3F4F6] rounded w-3/4 mb-2"/>
                <div className="h-3 bg-[#F3F4F6] rounded w-1/2"/>
              </div>
            ))}
          </div>
        ) : current.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-[48px] mb-4">{tab === 'sport' ? '🏟️' : '🎭'}</div>
            <p className="text-[16px] font-semibold text-[#374151]">
              {search ? 'No venues match your search' : 'No venues available'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-3 text-[14px] text-[#2B7FFF] hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tab === 'sport'
              ? filteredSport.map(v => <SportVenueCard key={v.id} venue={v} />)
              : filteredTheatre.map(v => <TheatreVenueCard key={v.id} venue={v} />)
            }
          </div>
        )}
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </main>
  );
}
