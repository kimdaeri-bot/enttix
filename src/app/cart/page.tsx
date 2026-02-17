'use client';
import Header from '@/components/Header';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';

export default function CartPage() {
  const { items, removeItem, totalPrice, totalItems } = useCart();
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [releasing, setReleasing] = useState<string | null>(null);

  // Timer based on earliest hold expiry
  useEffect(() => {
    const earliest = items.reduce((min, i) => {
      if (i.holdExpiresAt && i.holdExpiresAt < min) return i.holdExpiresAt;
      return min;
    }, Date.now() + 30 * 60 * 1000);
    const remaining = Math.max(0, Math.floor((earliest - Date.now()) / 1000));
    setTimeLeft(remaining);

    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [items]);

  const handleRelease = async (listingId: string, holdId?: string) => {
    setReleasing(listingId);
    if (holdId) {
      try {
        await fetch('/api/tixstock/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hold_id: holdId }),
        });
      } catch {}
    }
    removeItem(listingId);
    setReleasing(null);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header /></div>

      <div className="max-w-[900px] mx-auto px-4 py-8">
        <h1 className="text-[28px] font-bold text-[#171717] mb-2">Shopping Cart</h1>
        <p className="text-[14px] text-[#6B7280] mb-6">{totalItems} ticket{totalItems !== 1 ? 's' : ''} in your cart</p>

        {items.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-12 text-center">
            <p className="text-[40px] mb-4">🛒</p>
            <h2 className="text-[20px] font-bold text-[#171717] mb-2">Your cart is empty</h2>
            <p className="text-[14px] text-[#6B7280] mb-6">Browse events and add tickets to get started.</p>
            <Link href="/all-tickets" className="px-6 py-3 rounded-[10px] bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white font-semibold text-[14px] transition-colors">
              Browse Events
            </Link>
          </div>
        ) : (
          <>
            {/* Timer */}
            <div className="bg-[#FFF7ED] rounded-[12px] p-4 mb-6 flex items-center gap-3">
              <span className="text-[20px] font-bold text-[#F59E0B]">{minutes}:{seconds.toString().padStart(2, '0')}</span>
              <span className="text-[13px] text-[#92400E]">Tickets are held for 30 minutes. Complete your purchase before time runs out.</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Cart Items */}
              <div className="flex-1 flex flex-col gap-3">
                {items.map(item => (
                  <div key={item.listingId} className="bg-white rounded-[12px] border border-[#E5E7EB] p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[15px] font-bold text-[#171717]">{item.eventName}</h3>
                        <p className="text-[13px] text-[#6B7280] mt-1">
                          Section {item.section} • Row {item.row} • {item.quantity} ticket{item.quantity > 1 ? 's' : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[10px] font-semibold text-[#2B7FFF]">{item.ticketType}</span>
                          {item.holdId && <span className="text-[10px] text-[#22C55E]">✓ Held</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[18px] font-bold text-[#171717]">${(item.pricePerTicket * item.quantity).toFixed(2)}</p>
                        <p className="text-[11px] text-[#9CA3AF]">${item.pricePerTicket.toFixed(2)} × {item.quantity}</p>
                        <button
                          onClick={() => handleRelease(item.listingId, item.holdId)}
                          disabled={releasing === item.listingId}
                          className="text-[12px] text-[#EF4444] hover:underline mt-2 disabled:opacity-50"
                        >
                          {releasing === item.listingId ? 'Releasing...' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="w-full lg:w-[320px] flex-shrink-0">
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 sticky top-4">
                  <h2 className="text-[16px] font-bold text-[#171717] mb-4">Order Summary</h2>
                  <div className="flex justify-between text-[13px] mb-2">
                    <span className="text-[#6B7280]">Tickets ({totalItems})</span>
                    <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] mb-2">
                    <span className="text-[#6B7280]">Service Fee</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  <div className="flex justify-between text-[18px] font-bold mt-4 pt-4 border-t border-[#E5E7EB]">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <Link href="/checkout" className="block w-full text-center bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white font-semibold text-[14px] py-3.5 rounded-[12px] mt-6 transition-colors">
                    Proceed to Checkout
                  </Link>
                  <p className="text-center text-[11px] text-[#9CA3AF] mt-2">🔒 Secured with SSL encryption</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
