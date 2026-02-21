'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface TmEvent {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  date: string;
  time: string;
  venueName: string;
  city: string;
  country: string;
  minPrice: number | null;
  currency: string;
  genre: string;
  subGenre: string;
}

const MUSIC_GENRES = [
  { key: '',            label: 'All Music',       icon: '🎵' },
  { key: 'rock',        label: 'Rock',             icon: '🎸' },
  { key: 'pop',         label: 'Pop',              icon: '🎤' },
  { key: 'country',     label: 'Country',          icon: '🤠' },
  { key: 'alternative', label: 'Alternative',      icon: '🎶' },
  { key: 'hiphop',      label: 'Hip-Hop / Rap',    icon: '🎧' },
  { key: 'metal',       label: 'Metal',            icon: '🤘' },
  { key: 'folk',        label: 'Folk',             icon: '🪕' },
  { key: 'jazz',        label: 'Jazz',             icon: '🎷' },
  { key: 'electronic',  label: 'Electronic',       icon: '🎛️' },
  { key: 'blues',       label: 'Blues',            icon: '🎺' },
  { key: 'latin',       label: 'Latin',            icon: '💃' },
  { key: 'classical',   label: 'Classical',        icon: '🎻' },
  { key: 'reggae',      label: 'Reggae',           icon: '🌴' },
];

const COUNTRIES = [
  { code: '',   name: 'All',   flag: '🌏' },
  { code: 'US', name: 'US',    flag: '🇺🇸' },
  { code: 'GB', name: 'UK',    flag: '🇬🇧' },
  { code: 'CA', name: 'Canada',flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain',  flag: '🇪🇸' },
];

export default function MusicClient() {
  const [events,    setEvents]    = useState<TmEvent[]>([]);
  const [genre,     setGenre]     = useState('');
  const [country,   setCountry]   = useState('GB');
  const [page,      setPage]      = useState(0);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ tab: 'music', page: String(page), size: '24' });
    if (genre)   params.set('genre', genre);
    if (country) params.set('countryCode', country);

    fetch(`/api/ticketmaster/events?${params}`)
      .then(r => r.json())
      .then(d => {
        setEvents(d.events || []);
        setTotal(d.page?.totalElements || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [genre, country, page]);

  const handleGenre = (g: string) => { setGenre(g); setPage(0); };
  const handleCountry = (c: string) => { setCountry(c); setPage(0); };

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Header />

      {/* Hero */}
      <div className="px-4 md:px-10 pt-10 pb-8 max-w-[1280px] mx-auto">
        <p className="text-[#64748B] text-[13px] uppercase tracking-widest mb-2">Live Concerts</p>
        <h1 className="text-white text-[40px] md:text-[52px] font-extrabold tracking-tight leading-none">🎵 Music</h1>
        <p className="text-[#94A3B8] text-[16px] mt-3">Live concerts and music events worldwide.</p>
      </div>

      <div className="px-4 md:px-10 max-w-[1280px] mx-auto pb-24">

        {/* Country filter */}
        <div className="flex gap-2 flex-wrap mb-4">
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              onClick={() => handleCountry(c.code)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-1.5 ${
                country === c.code ? 'bg-[#2B7FFF] text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
              }`}
            >
              <span>{c.flag}</span> {c.name}
            </button>
          ))}
        </div>

        {/* Genre filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {MUSIC_GENRES.map(g => (
            <button
              key={g.key}
              onClick={() => handleGenre(g.key)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-1.5 ${
                genre === g.key ? 'bg-[#EC4899] text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
              }`}
            >
              <span>{g.icon}</span> {g.label}
            </button>
          ))}
        </div>

        {/* Count */}
        {!loading && <p className="text-[#64748B] text-[13px] mb-4">{total.toLocaleString()} events</p>}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-[#1E293B] rounded-[12px] overflow-hidden animate-pulse">
                <div className="h-[180px] bg-[#263548]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#263548] rounded w-full" />
                  <div className="h-2 bg-[#263548] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-[#475569]">
            <div className="text-5xl mb-4">🎵</div>
            <p>No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {events.map(ev => (
              <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer"
                className="bg-[#1E293B] rounded-[12px] overflow-hidden hover:bg-[#263548] transition-colors group">
                <div className="h-[180px] relative overflow-hidden bg-[#0F172A]">
                  {ev.imageUrl
                    ? <img src={ev.imageUrl} alt={ev.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-[50px]">🎵</div>}
                  <span className="absolute top-2 right-2 bg-black/70 text-[#4ADE80] text-[10px] font-bold px-2 py-0.5 rounded">↗ TM</span>
                  {ev.minPrice && (
                    <span className="absolute bottom-2 right-2 bg-[#2B7FFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      from ${ev.minPrice}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-white text-[13px] font-semibold line-clamp-2 leading-snug">{ev.name}</p>
                  <p className="text-[#94A3B8] text-[11px] mt-1">{ev.date} {ev.time ? `· ${ev.time}` : ''}</p>
                  <p className="text-[#64748B] text-[11px] truncate mt-0.5">{ev.venueName}{ev.city ? `, ${ev.city}` : ''}</p>
                  {ev.subGenre && <span className="inline-block mt-1.5 text-[10px] bg-[#1E1840] text-[#818CF8] px-2 py-0.5 rounded-full">{ev.subGenre}</span>}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 24 && (
          <div className="flex justify-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-5 py-2 rounded-full bg-[#1E293B] text-[#94A3B8] text-[13px] font-semibold disabled:opacity-40 hover:bg-[#263548] transition-colors"
            >
              ← Prev
            </button>
            <span className="px-4 py-2 text-[#64748B] text-[13px]">
              Page {page + 1} / {Math.ceil(total / 24)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * 24 >= total}
              className="px-5 py-2 rounded-full bg-[#1E293B] text-[#94A3B8] text-[13px] font-semibold disabled:opacity-40 hover:bg-[#263548] transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
