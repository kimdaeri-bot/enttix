'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
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

  const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    attraction: { icon: '🏛️', color: '#6366F1', bg: '#EEF2FF' },
    food: { icon: '🍽️', color: '#F59E0B', bg: '#FFFBEB' },
    cafe: { icon: '☕', color: '#92400E', bg: '#FEF3C7' },
    dessert: { icon: '🍰', color: '#EC4899', bg: '#FCE7F3' },
    event: { icon: '🎫', color: '#2B7FFF', bg: '#EFF6FF' },
    shopping: { icon: '🛍️', color: '#10B981', bg: '#ECFDF5' },
    transport: { icon: '🚇', color: '#6B7280', bg: '#F3F4F6' },
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="hero-bg">
        <Header transparent />
      </div>
      <div className="max-w-[800px] mx-auto px-4 -mt-16 relative z-10 pb-16">
        <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-lg border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[24px] font-bold text-[#171717]">My Trips</h1>
            <p className="text-[13px] text-[#94A3B8]">{trips.length} saved</p>
          </div>

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
            /* Detail View */
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

              {/* Day content */}
              {selectedTrip.days_json.filter((d: any) => d.day === activeDay).map((day: any) => (
                <div key={day.day}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#0F172A] flex items-center justify-center text-white font-bold text-[11px]">D{day.day}</div>
                    <div>
                      <h4 className="text-[#0F172A] font-bold text-[14px]">{day.title}</h4>
                      <p className="text-[#94A3B8] text-[11px]">{day.date}</p>
                    </div>
                  </div>
                  <div className="ml-3.5 border-l-2 border-[#E2E8F0] pl-4 space-y-2">
                    {day.items?.map((item: any, idx: number) => {
                      const cfg = typeConfig[item.type] || typeConfig.attraction;
                      return (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[21px] top-2.5 w-2 h-2 rounded-full border-2 border-white" style={{ backgroundColor: cfg.color }} />
                          <div className="rounded-lg p-3 border bg-[#FAFBFC] border-[#F1F5F9]">
                            <div className="flex items-start gap-2">
                              <span className="text-[16px]">{cfg.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[#94A3B8] text-[10px] font-mono">{item.time}</span>
                                </div>
                                <h5 className="text-[#0F172A] font-semibold text-[13px]">{item.name}</h5>
                                <p className="text-[#64748B] text-[11px]">{item.desc}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {trips.map(trip => (
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
