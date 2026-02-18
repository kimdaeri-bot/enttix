'use client';
import { useState, useEffect, use, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

interface Area {
  AreaId: number;
  AreaName: string;
  Prices: { Price: number; FaceValue: number; AvailableSeatsCount: number }[];
}

function BookingContent({ performanceId }: { performanceId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const eventId = params.get('eventId') || '';
  const eventName = params.get('eventName') || 'Show';
  const minPrice = params.get('price') || '0';

  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [qty, setQty] = useState(2);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  // router is used for potential future navigation; suppress lint warning
  void router;

  useEffect(() => {
    fetch(`/api/ltd/performance/${performanceId}/areas`)
      .then(r => r.json())
      .then(d => setAreas(d.areas || []))
      .finally(() => setLoading(false));
  }, [performanceId]);

  const totalAmount = selectedPrice * qty;

  async function handleBook() {
    if (!selectedArea || !selectedPrice) return;
    setBooking(true);
    setError('');
    try {
      const b1 = await fetch('/api/ltd/basket?action=create', { method: 'POST' });
      const { basketId, error: e1 } = await b1.json();
      if (!basketId) throw new Error(e1 || 'Failed to create basket');

      const b2 = await fetch('/api/ltd/basket?action=add-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId,
          performanceId: Number(performanceId),
          areaId: selectedArea.AreaId,
          seatsCount: qty,
          price: selectedPrice,
        }),
      });
      const { error: e2 } = await b2.json();
      if (e2) throw new Error(e2);

      const b3 = await fetch('/api/ltd/basket?action=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basketId, affiliateId: '775854e9-b102-48d9-99bc-4b288a67b538' }),
      });
      const { paymentUrl, error: e3 } = await b3.json();
      if (e3) throw new Error(e3);
      window.location.href = paymentUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setBooking(false);
    }
  }

  return (
    <div className="max-w-[680px] mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href={eventId ? `/musical/event/${eventId}` : '/musical/west-end'}
        className="flex items-center gap-2 text-[13px] text-[#64748B] hover:text-[#2B7FFF] mb-6 transition-colors group"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-0.5 transition-transform">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to {eventName}
      </Link>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2B7FFF] to-[#1D6AE5] px-6 py-5">
          <h1 className="text-[20px] font-extrabold text-white">{eventName}</h1>
          <p className="text-[#BFDBFE] text-[13px] mt-1">Select your seats</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
              <p className="text-[#94A3B8] text-sm">Loading available seats...</p>
            </div>
          ) : areas.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">😔</div>
              <p className="text-[#64748B]">No seats available for this performance.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Best Available */}
              <div className="rounded-xl border-2 border-dashed border-[#E2E8F0] p-4 flex items-center gap-3 hover:border-[#2B7FFF]/40 hover:bg-[#F8FAFC] transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2B7FFF] group-hover:bg-[#2B7FFF] group-hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[#0F172A]">Best Available</p>
                  <p className="text-[12px] text-[#94A3B8]">Best seat auto-assigned · From £{minPrice}</p>
                </div>
              </div>

              {/* Area cards */}
              {areas.map(area =>
                (area.Prices || []).map((pr, pi) => {
                  const isSelected = selectedArea?.AreaId === area.AreaId && selectedPrice === pr.Price;
                  return (
                    <button
                      key={`${area.AreaId}-${pi}`}
                      onClick={() => { setSelectedArea(area); setSelectedPrice(pr.Price); }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[#2B7FFF] bg-[#EFF6FF] shadow-sm'
                          : 'border-[#E2E8F0] hover:border-[#2B7FFF]/50 hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#2B7FFF] bg-[#2B7FFF]' : 'border-[#CBD5E1]'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-[#0F172A]">{area.AreaName}</p>
                          <p className="text-[11px] text-[#94A3B8]">Face value £{pr.FaceValue}</p>
                          {pr.AvailableSeatsCount > 0 && (
                            <p className="text-[11px] text-[#10B981]">{pr.AvailableSeatsCount} seats left</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[20px] font-extrabold text-[#2B7FFF]">£{pr.Price}</p>
                        <p className="text-[11px] text-[#94A3B8]">per ticket</p>
                      </div>
                    </button>
                  );
                })
              )}

              {/* Quantity + Book */}
              {selectedArea && selectedPrice > 0 && (
                <div className="mt-4 bg-[#F8FAFC] rounded-xl p-4 space-y-4 border border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-[#0F172A]">Tickets</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-9 h-9 rounded-full border-2 border-[#E2E8F0] flex items-center justify-center text-[#374151] hover:border-[#2B7FFF] hover:text-[#2B7FFF] text-xl font-bold transition-colors"
                      >−</button>
                      <span className="text-[18px] font-bold text-[#0F172A] w-8 text-center">{qty}</span>
                      <button
                        onClick={() => setQty(Math.min(10, qty + 1))}
                        className="w-9 h-9 rounded-full border-2 border-[#E2E8F0] flex items-center justify-center text-[#374151] hover:border-[#2B7FFF] hover:text-[#2B7FFF] text-xl font-bold transition-colors"
                      >+</button>
                    </div>
                  </div>
                  <div className="border-t border-[#E2E8F0] pt-3 space-y-1">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#64748B]">{selectedArea.AreaName} × {qty}</span>
                      <span className="font-semibold text-[#374151]">£{(selectedPrice * qty).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                      <span className="text-[15px] font-bold text-[#0F172A]">Total</span>
                      <span className="text-[20px] font-extrabold text-[#2B7FFF]">£{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  {error && (
                    <p className="text-[#EF4444] text-[12px] bg-[#FEF2F2] border border-[#FECACA] p-3 rounded-lg">{error}</p>
                  )}
                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className={`w-full py-4 rounded-xl text-[16px] font-bold transition-all ${
                      booking
                        ? 'bg-[#94A3B8] text-white cursor-not-allowed'
                        : 'bg-[#10B981] text-white hover:bg-[#059669] active:scale-[0.98] shadow-lg shadow-[#10B981]/25'
                    }`}
                  >
                    {booking ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25"/>
                          <path d="M21 12a9 9 0 00-9-9"/>
                        </svg>
                        Redirecting to payment...
                      </span>
                    ) : '🎫 Book Now'}
                  </button>
                  <p className="text-[11px] text-[#94A3B8] text-center">🔒 Secure payment by London Theatre Direct · No booking fees</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingPage({ params }: { params: Promise<{ performanceId: string }> }) {
  const { performanceId } = use(params);
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
        </div>
      }>
        <BookingContent performanceId={performanceId} />
      </Suspense>
    </main>
  );
}
