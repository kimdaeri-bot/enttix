'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface SavedTrip {
  id: string;
  query: string;
  city: string;
  country: string;
  days_json: any[];
  created_at: string;
}

export default function MyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('saved_trips')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTrips(data || []);
        setLoading(false);
      });
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    await supabase.from('saved_trips').delete().eq('id', id);
    setTrips(trips.filter(t => t.id !== id));
    if (selectedTrip?.id === id) setSelectedTrip(null);
  };

  if (authLoading || !user) return null;

  const typeConfig: Record<string, { icon: string; label: string; color: string; bg: string }> = {
    attraction: { icon: '🏛️', label: 'Attraction', color: '#6366F1', bg: '#EEF2FF' },
    food: { icon: '🍽️', label: 'Restaurant', color: '#F59E0B', bg: '#FFFBEB' },
    cafe: { icon: '☕', label: 'Cafe', color: '#92400E', bg: '#FEF3C7' },
    dessert: { icon: '🍰', label: 'Dessert', color: '#EC4899', bg: '#FCE7F3' },
    event: { icon: '🎫', label: 'Event', color: '#2B7FFF', bg: '#EFF6FF' },
    shopping: { icon: '🛍️', label: 'Shopping', color: '#10B981', bg: '#ECFDF5' },
    transport: { icon: '🚇', label: 'Transport', color: '#6B7280', bg: '#F3F4F6' },
  };

  const buildMapsUrl = (name: string, city: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + city)}`;

  const buildCalendarUrl = (title: string, date: string, time: string, desc: string, location: string) => {
    const dt = date.replace(/-/g, '') + 'T' + time.replace(':', '') + '00';
    const endH = parseInt(time.split(':')[0]) + 1;
    const endDt = date.replace(/-/g, '') + 'T' + String(endH).padStart(2, '0') + time.split(':')[1] + '00';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dt}/${endDt}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}`;
  };

  // Swipe handlers
  const swipeRef = useRef(0);
  const handleSwipeStart = (x: number) => { swipeRef.current = x; };
  const handleSwipeEnd = () => {
    if (!selectedTrip || !swipeRef.current) return;
    swipeRef.current = 0;
  };
  const handleSwipeMove = (x: number) => {
    if (!selectedTrip || !swipeRef.current) return;
    const diff = swipeRef.current - x;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeDay < selectedTrip.days_json.length) setActiveDay(activeDay + 1);
      if (diff < 0 && activeDay > 1) setActiveDay(activeDay - 1);
      swipeRef.current = 0;
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="hero-bg">
        <Header transparent />
      </div>
      <div className="max-w-[800px] mx-auto px-4 pt-8 relative z-10 pb-16">
        <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-lg border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[24px] font-bold text-[#171717]">My Trips</h1>
            <p className="text-[13px] text-[#94A3B8]">{trips.length} saved</p>
          </div>

          {/* Search Bar */}
          {!selectedTrip && trips.length > 0 && (
            <div className="mb-5">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input
                  type="text"
                  placeholder="저장된 일정 검색..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/10 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[48px] mb-3">✈️</p>
              <p className="text-[16px] font-semibold text-[#374151] mb-1">No saved trips yet</p>
              <p className="text-[13px] text-[#94A3B8] mb-4">Search for a destination and save your AI-generated itinerary!</p>
              <button onClick={() => router.push('/')} className="px-5 py-2.5 bg-[#2B7FFF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D6AE5] transition-colors">
                Plan a Trip
              </button>
            </div>
          ) : selectedTrip ? (
            /* Detail View — matches main planner */
            <div>
              <button onClick={() => setSelectedTrip(null)} className="flex items-center gap-1 text-[13px] text-[#2B7FFF] hover:underline mb-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back to list
              </button>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[20px]">📍</span>
                <h2 className="text-[20px] font-bold text-[#0F172A]">{selectedTrip.city}, {selectedTrip.country}</h2>
                <span className="text-[12px] text-[#94A3B8]">{selectedTrip.days_json.length} days</span>
              </div>

              {/* Day tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                {selectedTrip.days_json.map((day: any) => (
                  <button key={day.day} onClick={() => setActiveDay(day.day)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${activeDay === day.day ? 'bg-[#0F172A] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'}`}>
                    Day {day.day}
                  </button>
                ))}
              </div>

              {/* Swipeable day content */}
              <div
                onTouchStart={e => handleSwipeStart(e.touches[0].clientX)}
                onTouchMove={e => handleSwipeMove(e.touches[0].clientX)}
                onTouchEnd={handleSwipeEnd}
                style={{ userSelect: 'none' }}>
                {selectedTrip.days_json.filter((d: any) => d.day === activeDay).map((day: any) => (
                  <div key={day.day}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-[#0F172A] flex items-center justify-center text-white font-bold text-[11px]">D{day.day}</div>
                      <div className="flex-1">
                        <h4 className="text-[#0F172A] font-bold text-[14px]">{day.title}</h4>
                        <p className="text-[#94A3B8] text-[11px]">{day.date}</p>
                      </div>
                    </div>
                    <div className="ml-3.5 border-l-2 border-[#E2E8F0] pl-4 space-y-2">
                      {day.items?.map((item: any, idx: number) => {
                        const cfg = typeConfig[item.type] || typeConfig.attraction;
                        const isBookable = item.bookable === true;
                        const hasTicket = item.type === 'event' && item.event_id;
                        const gSvg = <svg width="10" height="10" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;

                        return (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[21px] top-2.5 w-2 h-2 rounded-full border-2 border-white" style={{ backgroundColor: cfg.color }} />
                            <div className={`rounded-lg p-3 border ${item.type === 'event' ? 'bg-white border-[#E2E8F0]' : 'bg-[#FAFBFC] border-[#F1F5F9]'}`}>
                              <div className="flex items-start gap-2">
                                <span className="text-[16px]">{cfg.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[#94A3B8] text-[10px] font-mono">{item.time}</span>
                                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1 py-0.5 rounded" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
                                  </div>
                                  <h5 className="text-[#0F172A] font-semibold text-[13px] leading-snug">{item.name}</h5>
                                  <p className="text-[#64748B] text-[11px]">{item.desc}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {item.venue && <span className="text-[#94A3B8] text-[10px]">📍 {item.venue}</span>}
                                    <a href={buildMapsUrl(item.name, selectedTrip.city)} target="_blank" rel="noopener noreferrer"
                                      className="text-[10px] text-[#2B7FFF] hover:underline font-medium inline-flex items-center gap-0.5">{gSvg} 지도저장</a>
                                    <a href={buildCalendarUrl(item.name, day.date, item.time, item.desc, item.venue || selectedTrip.city)} target="_blank" rel="noopener noreferrer"
                                      className="text-[10px] text-[#2B7FFF] hover:underline font-medium inline-flex items-center gap-0.5">{gSvg} 캘린더저장</a>
                                  </div>
                                </div>
                                {isBookable && (
                                  <button
                                    disabled={!hasTicket}
                                    onClick={() => hasTicket && router.push(`/event/${item.event_id}`)}
                                    className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                      hasTicket ? 'bg-[#2B7FFF] text-white hover:bg-[#1D6AE5] cursor-pointer' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                                    }`}>
                                    {hasTicket ? (item.price ? `🎫 $${item.price}` : '🎫 Book') : '🎫 예약'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Swipe indicator dots */}
                    {selectedTrip.days_json.length > 1 && (
                      <div className="flex items-center justify-center mt-3 gap-1.5">
                        {selectedTrip.days_json.map((_: any, i: number) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i + 1 === activeDay ? 'bg-[#2B7FFF] w-4' : 'bg-[#D1D5DB]'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Prev / Next navigation */}
              {selectedTrip.days_json.length > 1 && (
                <div className="flex items-center justify-between mt-3">
                  <button onClick={() => setActiveDay(Math.max(1, activeDay - 1))} disabled={activeDay <= 1}
                    className={`flex items-center gap-1 text-[12px] font-semibold transition-colors ${activeDay <= 1 ? 'text-[#D1D5DB] cursor-not-allowed' : 'text-[#2B7FFF] hover:text-[#1D6AE5]'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Prev
                  </button>
                  <span className="text-[11px] text-[#94A3B8]">Day {activeDay} / {selectedTrip.days_json.length}</span>
                  <button onClick={() => setActiveDay(Math.min(selectedTrip.days_json.length, activeDay + 1))} disabled={activeDay >= selectedTrip.days_json.length}
                    className={`flex items-center gap-1 text-[12px] font-semibold transition-colors ${activeDay >= selectedTrip.days_json.length ? 'text-[#D1D5DB] cursor-not-allowed' : 'text-[#2B7FFF] hover:text-[#1D6AE5]'}`}>
                    Next <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {trips.filter(t => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return t.city?.toLowerCase().includes(q) || t.country?.toLowerCase().includes(q) || t.query?.toLowerCase().includes(q);
              }).map(trip => (
                <div key={trip.id} className="flex items-center gap-4 p-4 rounded-xl border border-[#E5E7EB] hover:border-[#2B7FFF]/30 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => { setSelectedTrip(trip); setActiveDay(1); }}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2B7FFF] to-[#7C3AED] flex items-center justify-center text-white text-[18px]">
                    ✈️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-[#0F172A] group-hover:text-[#2B7FFF] transition-colors">
                      📍 {trip.city}{trip.country ? `, ${trip.country}` : ''}
                    </h3>
                    <p className="text-[12px] text-[#94A3B8]">
                      {trip.days_json.length} days · {new Date(trip.created_at).toLocaleDateString('ko-KR')}
                    </p>
                    {trip.query && <p className="text-[11px] text-[#64748B] truncate mt-0.5">&ldquo;{trip.query}&rdquo;</p>}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(trip.id); }}
                    className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-[#FEF2F2] flex items-center justify-center text-[#94A3B8] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
