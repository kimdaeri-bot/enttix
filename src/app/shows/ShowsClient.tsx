'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface LtdEvent {
  EventId: number;
  Name: string;
  TagLine?: string;
  ImageUrl?: string;
  EventMinimumPrice?: number;
  Type?: number;
}

interface TmEvent {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  date: string;
  time: string;
  venueName: string;
  city: string;
  minPrice: number | null;
  currency: string;
  genre: string;
  subGenre: string;
}

const SHOW_TABS = [
  { key: 'all',      label: 'All Shows',    type: null },
  { key: 'musical',  label: 'Musical',      type: 1 },
  { key: 'play',     label: 'Play',         type: 2 },
  { key: 'dance',    label: 'Dance',        type: 3 },
  { key: 'opera',    label: 'Opera',        type: 4 },
  { key: 'ballet',   label: 'Ballet',       type: 5 },
  { key: 'circus',   label: 'Circus',       type: 6 },
];

const ARTS_GENRES = [
  { key: '',         label: 'All Arts' },
  { key: 'theatre',  label: 'Theatre' },
  { key: 'comedy',   label: 'Comedy' },
  { key: 'fineart',  label: 'Fine Art' },
  { key: 'circus',   label: 'Circus' },
  { key: 'magic',    label: 'Magic' },
  { key: 'dance',    label: 'Dance' },
  { key: 'childrens',label: "Children's" },
];

export default function ShowsClient() {
  const [ltdEvents,  setLtdEvents]  = useState<LtdEvent[]>([]);
  const [tmEvents,   setTmEvents]   = useState<TmEvent[]>([]);
  const [ltdTab,     setLtdTab]     = useState('all');
  const [artsGenre,  setArtsGenre]  = useState('');
  const [section,    setSection]    = useState<'ltd' | 'tm'>('ltd');
  const [ltdLoading, setLtdLoading] = useState(true);
  const [tmLoading,  setTmLoading]  = useState(true);
  const [tmPage,     setTmPage]     = useState(0);
  const [tmTotal,    setTmTotal]    = useState(0);

  // LTD 로드
  useEffect(() => {
    const tab = SHOW_TABS.find(t => t.key === ltdTab);
    const typeParam = tab?.type ? `?type=${tab.type}` : '';
    setLtdLoading(true);
    fetch(`/api/ltd/events${typeParam}`)
      .then(r => r.json())
      .then(d => { setLtdEvents(d.events || []); setLtdLoading(false); })
      .catch(() => setLtdLoading(false));
  }, [ltdTab]);

  // TM Arts 로드
  useEffect(() => {
    if (section !== 'tm') return;
    setTmLoading(true);
    const params = new URLSearchParams({ tab: 'arts', page: String(tmPage), size: '20', countryCode: 'GB' });
    if (artsGenre) params.set('genre', artsGenre);
    fetch(`/api/ticketmaster/events?${params}`)
      .then(r => r.json())
      .then(d => {
        setTmEvents(d.events || []);
        setTmTotal(d.page?.totalElements || 0);
        setTmLoading(false);
      })
      .catch(() => setTmLoading(false));
  }, [section, artsGenre, tmPage]);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Header />

      {/* Hero */}
      <div className="px-4 md:px-10 pt-10 pb-8 max-w-[1280px] mx-auto">
        <p className="text-[#64748B] text-[13px] uppercase tracking-widest mb-2">Theatre &amp; Stage</p>
        <h1 className="text-white text-[40px] md:text-[52px] font-extrabold tracking-tight leading-none">🎭 Shows</h1>
        <p className="text-[#94A3B8] text-[16px] mt-3">West End musicals, Broadway, opera, ballet and more.</p>
      </div>

      {/* Section toggle */}
      <div className="px-4 md:px-10 max-w-[1280px] mx-auto mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setSection('ltd')}
            className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-colors ${
              section === 'ltd' ? 'bg-[#7C3AED] text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
            }`}
          >
            🎭 London West End
          </button>
          <button
            onClick={() => setSection('tm')}
            className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-colors ${
              section === 'tm' ? 'bg-[#1D6AE5] text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
            }`}
          >
            🌍 Global Arts &amp; Theatre
          </button>
        </div>
      </div>

      <div className="px-4 md:px-10 max-w-[1280px] mx-auto pb-24">

        {/* ── LTD Section ── */}
        {section === 'ltd' && (
          <>
            {/* LTD type tabs */}
            <div className="flex gap-2 flex-wrap mb-6">
              {SHOW_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setLtdTab(tab.key)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                    ltdTab === tab.key ? 'bg-[#7C3AED] text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {ltdLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] bg-[#1E293B] rounded-[12px] mb-2" />
                    <div className="h-3 bg-[#1E293B] rounded w-3/4 mb-1" />
                    <div className="h-2 bg-[#1E293B] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : ltdEvents.length === 0 ? (
              <div className="text-center py-20 text-[#475569]">
                <div className="text-5xl mb-4">🎭</div>
                <p>No shows found</p>
              </div>
            ) : (
              <>
                <p className="text-[#64748B] text-[13px] mb-4">{ltdEvents.length} shows</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {ltdEvents.map(ev => (
                    <Link key={ev.EventId} href={`/musical/event/${ev.EventId}`}
                      className="group">
                      <div className="aspect-[2/3] relative overflow-hidden rounded-[12px] bg-[#1E0A3C] mb-2">
                        {ev.ImageUrl
                          ? <img src={ev.ImageUrl} alt={ev.Name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center text-[48px]">🎭</div>}
                        {ev.EventMinimumPrice ? (
                          <span className="absolute bottom-2 left-2 bg-[#7C3AED] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            from £{ev.EventMinimumPrice}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-white text-[13px] font-semibold line-clamp-2 leading-snug group-hover:text-[#A78BFA] transition-colors">{ev.Name}</p>
                      {ev.TagLine && <p className="text-[#64748B] text-[11px] line-clamp-1 mt-0.5">{ev.TagLine}</p>}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── TM Arts Section ── */}
        {section === 'tm' && (
          <>
            {/* Genre filter */}
            <div className="flex gap-2 flex-wrap mb-6">
              {ARTS_GENRES.map(g => (
                <button
                  key={g.key}
                  onClick={() => { setArtsGenre(g.key); setTmPage(0); }}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                    artsGenre === g.key ? 'bg-[#2B7FFF] text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {tmLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-[#1E293B] rounded-[12px] overflow-hidden animate-pulse">
                    <div className="h-[160px] bg-[#263548]" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-[#263548] rounded w-full" />
                      <div className="h-2 bg-[#263548] rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {tmTotal > 0 && <p className="text-[#64748B] text-[13px] mb-4">{tmTotal.toLocaleString()} events</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tmEvents.map(ev => (
                    <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer"
                      className="bg-[#1E293B] rounded-[12px] overflow-hidden hover:bg-[#263548] transition-colors group">
                      <div className="h-[160px] relative overflow-hidden bg-[#0F172A]">
                        {ev.imageUrl
                          ? <img src={ev.imageUrl} alt={ev.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center text-[44px]">🎟️</div>}
                        <span className="absolute top-2 right-2 bg-black/70 text-[#4ADE80] text-[10px] font-bold px-2 py-0.5 rounded">↗ TM</span>
                        {ev.minPrice && (
                          <span className="absolute bottom-2 right-2 bg-[#2B7FFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            from ${ev.minPrice}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-white text-[13px] font-semibold line-clamp-2 leading-snug">{ev.name}</p>
                        <p className="text-[#94A3B8] text-[11px] mt-1">{ev.date}</p>
                        <p className="text-[#64748B] text-[11px] truncate">{ev.venueName}{ev.city ? `, ${ev.city}` : ''}</p>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Pagination */}
                {tmTotal > 20 && (
                  <div className="flex justify-center gap-3 mt-8">
                    <button
                      onClick={() => setTmPage(p => Math.max(0, p - 1))}
                      disabled={tmPage === 0}
                      className="px-5 py-2 rounded-full bg-[#1E293B] text-[#94A3B8] text-[13px] font-semibold disabled:opacity-40 hover:bg-[#263548] transition-colors"
                    >
                      ← Prev
                    </button>
                    <span className="px-4 py-2 text-[#64748B] text-[13px]">
                      Page {tmPage + 1} / {Math.ceil(tmTotal / 20)}
                    </span>
                    <button
                      onClick={() => setTmPage(p => p + 1)}
                      disabled={(tmPage + 1) * 20 >= tmTotal}
                      className="px-5 py-2 rounded-full bg-[#1E293B] text-[#94A3B8] text-[13px] font-semibold disabled:opacity-40 hover:bg-[#263548] transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
