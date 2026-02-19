'use client';
import Header from '@/components/Header';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';

export default function CheckoutPage() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [agreements, setAgreements] = useState({ fee: false, personal: false, thirdParty: false });
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const allAgreed = agreements.fee && agreements.personal && agreements.thirdParty;

  const handleCheckout = async () => {
    setProcessing(true);
    for (const item of items) {
      if (item.holdId) {
        try {
          await fetch(`https://sandbox-pf.tixstock.com/v1/orders/add/${item.holdId}/${item.quantity}`, {
            method: 'POST',
            headers: { Authorization: 'Bearer ac1f6d1f4c3ba067b8d13f2419', 'Content-Type': 'application/json' },
            body: JSON.stringify({
              buyer_name: 'Demo User', buyer_email: 'test@enttix.com',
              buyer_phone: '01011112222', shipping_address: 'Demo Address',
            }),
          });
        } catch {}
      }
    }
    clearCart();
    setProcessing(false);
    setCompleted(true);
  };

  if (completed) {
    return (
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="bg-[#0F172A]"><Header /></div>
        <div className="max-w-[600px] mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-12">
            <p className="text-[48px] mb-4">🎉</p>
            <h1 className="text-[28px] font-bold text-[#171717] mb-2">Order Confirmed!</h1>
            <p className="text-[14px] text-[#6B7280] mb-6">Your tickets have been ordered. You&apos;ll receive a confirmation email shortly.</p>
            <p className="text-[12px] text-[#F59E0B] italic mb-6">This was a demo transaction. No actual payment was processed.</p>
            <Link href="/" className="px-6 py-3 rounded-[10px] bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white font-semibold text-[14px] transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="bg-[#0F172A]"><Header /></div>
        <div className="max-w-[600px] mx-auto px-4 py-16 text-center">
          <h1 className="text-[24px] font-bold text-[#171717] mb-4">No items in cart</h1>
          <Link href="/all-tickets" className="text-[#2B7FFF] hover:underline">Browse events</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header /></div>

      <div className="max-w-[900px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-bold text-[#171717]">Checkout</h1>
            <p className="text-[14px] text-[#6B7280]">Complete your purchase</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cart" className="text-[13px] text-[#6B7280] hover:text-[#171717]">← Back to Cart</Link>
          </div>
        </div>

        {/* Timer */}
        <div className="bg-[#FFF7ED] rounded-[12px] p-4 mb-6 flex items-center gap-3">
          <span className="text-[24px] font-bold text-[#F59E0B]">{minutes}:{seconds.toString().padStart(2, '0')}</span>
          <span className="text-[13px] text-[#92400E]">Time remaining to complete payment</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6">
            {/* Buyer Info */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6">
              <h2 className="text-[16px] font-bold text-[#171717] mb-4">Buyer Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block mb-1.5">Name</label>
                  <input defaultValue="Demo User" className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-[14px] outline-none focus:border-[#2B7FFF]" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block mb-1.5">Email</label>
                  <input defaultValue="test@enttix.com" className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-[14px] outline-none focus:border-[#2B7FFF]" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block mb-1.5">Phone</label>
                  <input defaultValue="01011112222" className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-[14px] outline-none focus:border-[#2B7FFF]" />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6">
              <h2 className="text-[16px] font-bold text-[#171717] mb-4">Shipping Address</h2>
              <textarea defaultValue="31 Incheon tower-daero 25beon-gil, Yeonsu-gu, Incheon, Republic of Korea" rows={2}
                className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-[14px] outline-none focus:border-[#2B7FFF] resize-none" />
            </div>

            {/* Payment */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6">
              <h2 className="text-[16px] font-bold text-[#171717] mb-4">Payment Method</h2>
              <div className="flex items-center gap-3 p-3 rounded-[8px] border border-[#2B7FFF] bg-[#EFF6FF]">
                <div className="w-10 h-7 rounded bg-[#1E40AF] flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
                <div>
                  <p className="text-[14px] font-semibold text-[#171717]">**** 4242 Card</p>
                  <p className="text-[12px] text-[#6B7280]">Expires 12/25</p>
                </div>
              </div>
              <p className="text-[12px] text-[#F59E0B] mt-3 italic">This is a demo payment. No actual payment will be processed.</p>
            </div>

            {/* Terms */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6">
              <h2 className="text-[16px] font-bold text-[#171717] mb-4">Terms Agreement</h2>
              <label className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => setAgreements({ fee: true, personal: true, thirdParty: true })}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${allAgreed ? 'bg-[#2B7FFF] border-[#2B7FFF]' : 'border-[#D1D5DB]'}`}>
                  {allAgreed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-[14px] font-semibold text-[#171717]">Agree to All</span>
              </label>
              {[
                { key: 'fee', label: 'Fee Policy Agreement' },
                { key: 'personal', label: 'Personal Information Collection' },
                { key: 'thirdParty', label: 'Third Party Information Sharing' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between py-2 cursor-pointer"
                  onClick={() => setAgreements(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${agreements[item.key as keyof typeof agreements] ? 'bg-[#2B7FFF] border-[#2B7FFF]' : 'border-[#D1D5DB]'}`}>
                      {agreements[item.key as keyof typeof agreements] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <span className="text-[13px] text-[#374151]">{item.label} <span className="text-[#EF4444]">*</span></span>
                  </div>
                  <span className="text-[12px] text-[#2B7FFF] cursor-pointer">View Details</span>
                </label>
              ))}
              {!allAgreed && <p className="text-[12px] text-[#EF4444] mt-2">Please agree to all terms.</p>}
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-[340px] flex-shrink-0">
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 sticky top-4">
              <h2 className="text-[16px] font-bold text-[#171717] mb-4">Order Summary</h2>

              {items.map(item => {
                const sym = item.currency === 'GBP' ? '£' : '$';
                const fmtDate = (dt?: string) => {
                  if (!dt) return '';
                  try {
                    const d = new Date(dt);
                    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
                      ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                  } catch { return dt; }
                };
                return (
                  <div key={item.listingId} className="mb-4 pb-4 border-b border-[#F1F5F9] last:border-0">
                    <div className="divide-y divide-[#F1F5F9] text-[12px]">
                      {[
                        { label: 'Event', value: item.eventName },
                        { label: 'Event date', value: fmtDate(item.eventDate) },
                        { label: 'Venue', value: item.venue },
                        { label: 'Quantity', value: String(item.quantity) },
                        { label: 'Section', value: item.section || '—' },
                        { label: 'Row', value: item.row || '—' },
                        { label: 'Format', value: item.ticketType || 'eTicket' },
                      ].map(({ label, value }) => value ? (
                        <div key={label} className="flex py-2 gap-2">
                          <span className="w-[110px] flex-shrink-0 text-[#9CA3AF]">{label}</span>
                          <span className="flex-1 text-[#171717] font-semibold">{value}</span>
                        </div>
                      ) : null)}
                      <div className="flex py-2 gap-2">
                        <span className="w-[110px] flex-shrink-0 text-[#9CA3AF]">Features</span>
                        <div className="flex-1">
                          {item.benefits && item.benefits.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.benefits.map((b, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] text-[10px] font-medium text-[#2B7FFF]">{b}</span>
                              ))}
                            </div>
                          ) : <span className="text-[#171717] font-semibold">N/A</span>}
                        </div>
                      </div>
                      <div className="flex py-2 gap-2">
                        <span className="w-[110px] flex-shrink-0 text-[#9CA3AF]">Price per ticket</span>
                        <span className="flex-1 text-[#171717] font-semibold">{sym}{item.pricePerTicket.toFixed(2)}</span>
                      </div>
                      <div className="flex py-2 gap-2 font-bold">
                        <span className="w-[110px] flex-shrink-0 text-[#374151]">Total</span>
                        <span className="flex-1 text-[#171717]">{sym}{(item.pricePerTicket * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-[#E5E7EB] mt-2 pt-4">
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-[#6B7280]">Tickets ({totalItems})</span>
                  <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-[#6B7280]">Service Fee</span>
                  <span className="font-semibold">$0.00</span>
                </div>
                <div className="flex justify-between text-[16px] font-bold mt-3 pt-3 border-t border-[#E5E7EB]">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={!allAgreed || processing}
                className={`w-full mt-6 py-3.5 rounded-[12px] font-semibold text-[14px] transition-colors ${allAgreed && !processing ? 'bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white' : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'}`}
              >
                {processing ? 'Processing...' : 'Complete Payment'}
              </button>
              <p className="text-center text-[11px] text-[#9CA3AF] mt-2">🔒 Secured with SSL encryption</p>
            </div>

            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 mt-4">
              <div className="flex flex-col gap-2 text-[12px] text-[#6B7280]">
                <span>✅ 100% Buyer Guarantee</span>
                <span>🔒 Secure Transaction</span>
                <span>📧 E-Ticket Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
