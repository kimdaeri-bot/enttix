'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import { Suspense } from 'react';

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();

  const holdId = params.get('holdId') || '';
  const listingId = params.get('listingId') || '';
  const quantity = parseInt(params.get('quantity') || '1', 10);
  const price = parseFloat(params.get('price') || '0');
  const section = params.get('section') || '';
  const row = params.get('row') || '';
  const seat = params.get('seat') || '';
  const eventId = params.get('eventId') || '';
  const eventName = params.get('eventName') || '';
  const generalAdmission = params.get('general_admission') === 'true';

  const grandTotal = (price * quantity).toFixed(2);

  // 10-minute countdown
  const [timeLeft, setTimeLeft] = useState(10 * 60);

  const handleExpire = useCallback(() => {
    router.push(`/event/${eventId}?holdExpired=1`);
  }, [router, eventId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleExpire();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, handleExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const timerUrgent = timeLeft < 120;

  // Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    agreed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreed) {
      setError('Please agree to the terms and conditions.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const orderId = `ENT-${Date.now()}`;
      const datetime = new Date().toISOString().replace('Z', '+0000');

      const res = await fetch('/api/tixstock/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdId,
          quantity,
          orderData: {
            order_id: orderId,
            order_status: 'Approved',
            datetime,
            currency: 'GBP',
            customer: {
              id: `CUST-${Date.now()}`,
              first_name: form.firstName,
              last_name: form.lastName,
              email_address: form.email,
              contact_number: form.phone || null,
            },
            items: Array.from({ length: quantity }, () => ({
              general_admission: generalAdmission,
              row: row || '',
              seat: seat || '',
              price: price,
            })),
          },
        }),
      });

      const data = await res.json();
      const tixstockOrderId = data.data?.id;

      if (tixstockOrderId) {
        router.push(
          `/sport/order-success?orderId=${tixstockOrderId}&enttixOrderId=${encodeURIComponent(data.data?.order_id || '')}` +
          `&eventName=${encodeURIComponent(eventName)}&quantity=${quantity}&total=${grandTotal}&listingId=${listingId}`
        );
      } else {
        const errMsg = data.errors
          ? Object.values(data.errors).flat().join(', ')
          : data.error || 'Order failed. Please try again.';
        setError(errMsg);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header /></div>

      <div className="max-w-[720px] mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/event/${eventId}`} className="text-[#6B7280] hover:text-[#374151] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <h1 className="text-[22px] font-extrabold text-[#171717]">Checkout</h1>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 mb-5">
          <h2 className="text-[15px] font-bold text-[#171717] mb-4">Order Summary</h2>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[10px] bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2">
                <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 010 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 010-4V7a2 2 0 00-2-2H5z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[16px] font-bold text-[#171717]">{eventName || 'Event'}</p>
              <p className="text-[13px] text-[#6B7280] mt-0.5">
                {section}{row ? ` · Row ${row}` : ''}{seat ? ` · Seat ${seat}` : ''}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F1F5F9]">
                <p className="text-[13px] text-[#6B7280]">{quantity} × £{price.toFixed(2)}</p>
                <p className="text-[18px] font-extrabold text-[#171717]">£{grandTotal}</p>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className={`mt-4 pt-4 border-t border-[#F1F5F9] flex items-center gap-2 rounded-[10px] px-3 py-2.5 ${timerUrgent ? 'bg-[#FEF2F2]' : 'bg-[#F0FDF4]'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={timerUrgent ? '#EF4444' : '#16A34A'} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            <span className={`text-[13px] font-semibold ${timerUrgent ? 'text-[#EF4444]' : 'text-[#16A34A]'}`}>
              {timerDisplay} remaining · Tickets released if not purchased in time
            </span>
          </div>
        </div>

        {/* Customer Info Form */}
        <form onSubmit={handleConfirmOrder}>
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 mb-5">
            <h2 className="text-[15px] font-bold text-[#171717] mb-4">Your Details</h2>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[12px] font-semibold text-[#374151] mb-1 block">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#374151] mb-1 block">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Smith"
                  required
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[12px] font-semibold text-[#374151] mb-1 block">Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
              />
            </div>

            <div className="mb-5">
              <label className="text-[12px] font-semibold text-[#374151] mb-1 block">Phone Number <span className="text-[#9CA3AF] font-normal">(optional)</span></label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+44 7700 900000"
                className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreed"
                checked={form.agreed}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 rounded border-[#E5E7EB] text-[#2B7FFF] focus:ring-[#2B7FFF]/20 flex-shrink-0"
              />
              <span className="text-[13px] text-[#6B7280] leading-relaxed">
                I agree that all ticket sales are <strong className="text-[#374151]">final — no refunds or exchanges</strong> unless the event is cancelled. I confirm my details are correct.
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] px-4 py-3 mb-4">
              <p className="text-[13px] text-[#EF4444] font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-[12px] bg-[#2B7FFF] hover:bg-[#1D6AE5] disabled:opacity-50 text-white text-[16px] font-bold transition-colors active:scale-[0.99] shadow-lg shadow-[#2B7FFF]/30"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Processing...
              </span>
            ) : (
              `Confirm & Pay · £${grandTotal}`
            )}
          </button>

          <p className="text-center text-[12px] text-[#9CA3AF] mt-3">
            🔒 Secure checkout powered by Enttix
          </p>
        </form>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="bg-[#0F172A]"><Header /></div>
        <div className="flex items-center justify-center py-32">
          <div className="text-[18px] font-semibold text-[#9CA3AF] animate-pulse">Loading checkout...</div>
        </div>
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
