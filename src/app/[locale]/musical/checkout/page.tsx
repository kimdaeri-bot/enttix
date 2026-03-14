'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';

type SeatInfo = { tid: number; label: string; price: number; description: string };

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const routeParams = useParams();
  const locale = (routeParams?.locale as string) || 'en';

  const basketId = params.get('basketId') || '';
  const eventName = params.get('eventName') || 'Show';
  const venue = params.get('venue') || '';
  const performanceId = params.get('performanceId') || '';
  const performanceDate = params.get('performanceDate') || '';
  const total = Number(params.get('total')) || 0;

  let seats: SeatInfo[] = [];
  try { seats = JSON.parse(params.get('seats') || '[]'); } catch { seats = []; }

  /* Timer state — basket expires in ~10 min */
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  /* Form state */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  /* Fetch basket expiration */
  useEffect(() => {
    if (!basketId) return;
    const fallback = () => setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
    fetch(`/api/ltd/basket?basketId=${basketId}`)
      .then(r => r.json())
      .then(data => {
        if (data.expirationDate) {
          const exp = new Date(data.expirationDate);
          // Only use API date if it's in the future; otherwise use fallback
          if (!isNaN(exp.getTime()) && exp.getTime() > Date.now()) {
            setExpiresAt(exp);
          } else {
            fallback();
          }
        } else {
          fallback();
        }
      })
      .catch(fallback);
  }, [basketId]);

  /* Countdown timer */
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('0:00');
        setExpired(true);
        return;
      }
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${min}:${String(sec).padStart(2, '0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  /* Format helpers */
  const formatDateShort = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const day = d.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    return `${weekday} ${day}${suffix} ${month} ${year}`;
  };
  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}.${String(m).padStart(2, '0')}${ampm}`;
  };

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && email.includes('@');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || expired) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const r = await fetch('/api/ltd/basket?action=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId,
          leadCustomer: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
          },
        }),
      });
      const d = await r.json();
      if (d.paymentUrl) {
        window.location.href = d.paymentUrl;
      } else {
        throw new Error(d.error || 'No payment URL returned');
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!basketId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-red-600 text-lg font-bold mb-4">No basket found</p>
        <button onClick={() => router.back()} className="px-5 py-2 bg-[#2B7FFF] text-white rounded-lg text-sm font-semibold">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Timer bar */}
      <div className={`rounded-xl px-4 py-3 mb-6 flex items-center justify-between ${
        expired ? 'bg-red-50 border border-red-200' :
        timeLeft && parseInt(timeLeft) <= 2 ? 'bg-amber-50 border border-amber-200' :
        'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={expired ? '#DC2626' : '#2B7FFF'} strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <span className={`text-sm font-semibold ${expired ? 'text-red-700' : 'text-[#0F172A]'}`}>
            {expired ? 'Reservation expired' : 'Seats held for you'}
          </span>
        </div>
        <span className={`text-lg font-bold tabular-nums ${
          expired ? 'text-red-600' : parseInt(timeLeft) <= 2 ? 'text-amber-600' : 'text-[#2B7FFF]'
        }`}>
          {timeLeft || '--:--'}
        </span>
      </div>

      {expired && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-red-700 font-bold mb-2">Your seat reservation has expired.</p>
          <p className="text-red-600 text-sm mb-4">Please go back and select your seats again.</p>
          <button
            onClick={() => router.push(`/${locale}/musical/book/${performanceId}`)}
            className="px-5 py-2 bg-[#2B7FFF] text-white rounded-lg text-sm font-semibold hover:bg-[#1D6AE5]"
          >
            Back to seat selection
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Customer info form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-1">Customer Information</h2>
            <p className="text-sm text-[#64748B] mb-5">Please enter your details to complete the booking.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-1">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7FFF] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                    className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7FFF] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7FFF] focus:border-transparent"
                />
                <p className="text-xs text-[#94A3B8] mt-1">Booking confirmation will be sent to this email.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-1">Phone <span className="text-[#94A3B8] font-normal">(optional)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+44 7700 900000"
                  className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7FFF] focus:border-transparent"
                />
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{submitError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || submitting || expired}
                className={`w-full py-3.5 rounded-xl text-[15px] font-bold transition-all ${
                  !isFormValid || submitting || expired
                    ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                    : 'bg-[#22c55e] text-white hover:bg-[#16a34a] active:scale-[0.98] shadow-lg'
                }`}
              >
                {submitting ? 'Processing...' : expired ? 'Reservation expired' : `Proceed to Payment — £${total.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sticky top-[80px]">
            <h3 className="text-[15px] font-bold text-[#0F172A] mb-3">Order Summary</h3>

            {/* Show info */}
            <div className="border-b border-[#E5E7EB] pb-3 mb-3">
              <p className="text-sm font-semibold text-[#0F172A]">{eventName}</p>
              <p className="text-xs text-[#64748B] mt-0.5">{venue}</p>
              {performanceDate && (
                <p className="text-xs text-[#64748B] mt-0.5">
                  {formatDateShort(performanceDate)} · {formatTime(performanceDate)}
                </p>
              )}
            </div>

            {/* Seats */}
            <div className="space-y-2 mb-3">
              {seats.map((seat, i) => (
                <div key={seat.tid || i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-[#0F172A] text-[13px]">{seat.label}</p>
                    {seat.description && <p className="text-[11px] text-[#94A3B8]">{seat.description}</p>}
                  </div>
                  <span className="text-[#0F172A] font-semibold text-[13px]">£{seat.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-[#E5E7EB] pt-3 flex items-center justify-between">
              <span className="text-sm font-bold text-[#0F172A]">Total</span>
              <span className="text-lg font-extrabold text-[#0F172A]">£{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}
