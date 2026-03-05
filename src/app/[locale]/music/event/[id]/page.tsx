'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface EventDetail {
  id: string; name: string; url: string; imageUrl: string; allImages: string[];
  date: string; time: string; status: string;
  venueName: string; address: string; city: string; state: string; country: string;
  lat: string; lng: string;
  minPrice: number | null; maxPrice: number | null; currency: string;
  genre: string; subGenre: string;
  info: string; pleaseNote: string;
  artists: { name: string; url: string }[];
}

function formatDate(d: string) {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}

export default function MusicEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/ticketmaster/event/${id}`)
      .then(r => r.json())
      .then(data => { setEvent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const sym = event?.currency === 'GBP' ? '£' : event?.currency === 'EUR' ? '€' : '$';

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header hideSearch />
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 rounded-full border-[3px] border-[#2B7FFF] border-t-transparent animate-spin" />
      </div>
    </div>
  );

  if (!event || (event as unknown as Record<string, unknown>).error) return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header hideSearch />
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-5xl">🎵</p>
        <p className="text-[#374151] font-semibold">Event not found</p>
        <Link href="/music" className="text-[#2B7FFF] text-[14px] font-semibold hover:underline">← Back to Music</Link>
      </div>
    </div>
  );

  const heroImg = !imgErr && event.imageUrl ? event.imageUrl : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header hideSearch />

      {/* ── HERO ── */}
      <section className="relative h-[420px] sm:h-[480px] flex flex-col justify-end pb-10">
        {heroImg
          ? <img src={heroImg} alt={event.name} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgErr(true)} />
          : <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="relative z-10 max-w-[1280px] mx-auto px-4 w-full">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-white/60 mb-4">
            <Link href="/music" className="hover:text-white transition-colors">Music</Link>
            <span>›</span>
            <span className="text-white/80 line-clamp-1">{event.name}</span>
          </div>

          {/* Genre badges */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {event.genre && event.genre !== 'Undefined' && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-[#2B7FFF]/80 backdrop-blur-sm">{event.genre}</span>
            )}
            {event.subGenre && event.subGenre !== 'Undefined' && event.subGenre !== event.genre && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-white/20 backdrop-blur-sm">{event.subGenre}</span>
            )}
          </div>

          <h1 className="text-[32px] sm:text-[44px] font-extrabold text-white leading-tight mb-3 max-w-[800px]">
            {event.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-[14px] text-white/80">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {formatDate(event.date)}{event.time ? ` · ${formatTime(event.time)}` : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {[event.venueName, event.city, event.country].filter(Boolean).join(', ')}
            </span>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-[1280px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Venue Info */}
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6">
            <h2 className="text-[18px] font-extrabold text-[#0F172A] mb-4">📍 Venue</h2>
            <div className="space-y-2">
              <p className="font-semibold text-[#171717] text-[15px]">{event.venueName}</p>
              {event.address && <p className="text-[#6B7280] text-[13px]">{event.address}</p>}
              <p className="text-[#6B7280] text-[13px]">{[event.city, event.state, event.country].filter(Boolean).join(', ')}</p>
            </div>
            {/* Map link */}
            {event.lat && event.lng && (
              <a
                href={`https://maps.google.com/?q=${event.lat},${event.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2B7FFF] hover:text-[#1D6AE5]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                View on Google Maps →
              </a>
            )}
          </div>

          {/* Artists */}
          {event.artists.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6">
              <h2 className="text-[18px] font-extrabold text-[#0F172A] mb-4">🎤 Artists</h2>
              <div className="flex flex-wrap gap-2">
                {event.artists.map((a, i) => (
                  <span key={i} className="px-4 py-2 rounded-full bg-[#F1F5F9] text-[#374151] text-[13px] font-semibold">{a.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          {(event.info || event.pleaseNote) && (
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6">
              <h2 className="text-[18px] font-extrabold text-[#0F172A] mb-4">ℹ️ Event Info</h2>
              {event.info && <p className="text-[#374151] text-[14px] leading-relaxed whitespace-pre-line">{event.info}</p>}
              {event.pleaseNote && (
                <div className="mt-4 p-4 bg-[#FFF7ED] border border-[#FED7AA] rounded-[10px]">
                  <p className="text-[#92400E] text-[13px] font-semibold mb-1">⚠️ Please Note</p>
                  <p className="text-[#78350F] text-[13px] leading-relaxed whitespace-pre-line">{event.pleaseNote}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Ticket CTA */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 sticky top-[80px]">
            <div className="text-[13px] text-[#6B7280] mb-1">Tickets from</div>
            <div className="text-[36px] font-extrabold text-[#171717] mb-1">
              {event.minPrice ? `${sym}${event.minPrice.toFixed(0)}` : 'See prices'}
            </div>
            {event.maxPrice && event.minPrice && event.maxPrice > event.minPrice && (
              <div className="text-[13px] text-[#9CA3AF] mb-4">up to {sym}{event.maxPrice.toFixed(0)}</div>
            )}

            <div className="space-y-3 mb-6 text-[13px] text-[#374151]">
              <div className="flex items-center gap-2">
                <svg className="text-[#22C55E]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Official Ticketmaster listing
              </div>
              <div className="flex items-center gap-2">
                <svg className="text-[#22C55E]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {formatDate(event.date)}
              </div>
              <div className="flex items-center gap-2">
                <svg className="text-[#22C55E]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {event.venueName || 'Venue TBA'}
              </div>
            </div>

            <a
              href={event.url}
              target="_blank" rel="noopener noreferrer"
              className="block w-full text-center py-3.5 rounded-[12px] bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white text-[15px] font-bold transition-colors"
            >
              Buy Tickets on Ticketmaster →
            </a>

            <p className="text-center text-[11px] text-[#9CA3AF] mt-3">
              You will be redirected to Ticketmaster
            </p>

            <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
              <Link href="/music" className="flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#374151]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back to Music Events
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
