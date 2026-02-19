'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

function OrderSuccessContent() {
  const params = useSearchParams();

  const orderId = params.get('orderId') || '';
  const enttixOrderId = params.get('enttixOrderId') || '';
  const eventName = params.get('eventName') || 'Your Event';
  const quantity = params.get('quantity') || '1';
  const total = params.get('total') || '0.00';

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header /></div>

      <div className="max-w-[560px] mx-auto px-4 py-16 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-[#F0FDF4] border-4 border-[#86EFAC] flex items-center justify-center mx-auto mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>

        <h1 className="text-[28px] font-extrabold text-[#171717] mb-2">Order Confirmed!</h1>
        <p className="text-[15px] text-[#6B7280] mb-8">
          Your tickets have been reserved. A confirmation email will be sent to you shortly.
        </p>

        {/* Order Details Card */}
        <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 mb-6 text-left">
          <h2 className="text-[13px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Order Details</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9]">
              <span className="text-[13px] text-[#6B7280]">Tixstock Order ID</span>
              <span className="text-[14px] font-bold text-[#171717] font-mono bg-[#F8FAFC] px-2.5 py-1 rounded-[6px]">{orderId}</span>
            </div>

            {enttixOrderId && (
              <div className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9]">
                <span className="text-[13px] text-[#6B7280]">Enttix Order ID</span>
                <span className="text-[13px] font-medium text-[#374151]">{enttixOrderId}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9]">
              <span className="text-[13px] text-[#6B7280]">Event</span>
              <span className="text-[14px] font-semibold text-[#171717] text-right max-w-[60%]">{eventName}</span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9]">
              <span className="text-[13px] text-[#6B7280]">Quantity</span>
              <span className="text-[14px] font-semibold text-[#171717]">{quantity} ticket{parseInt(quantity) > 1 ? 's' : ''}</span>
            </div>

            <div className="flex items-center justify-between pt-2.5">
              <span className="text-[14px] font-bold text-[#171717]">Total Paid</span>
              <span className="text-[20px] font-extrabold text-[#2B7FFF]">£{total}</span>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="bg-[#EFF6FF] rounded-[12px] px-4 py-3 mb-8 text-left flex gap-3">
          <span className="text-[18px] flex-shrink-0">📧</span>
          <p className="text-[13px] text-[#1D4ED8] leading-relaxed">
            <strong>Check your email</strong> for your ticket confirmation and delivery instructions. Tickets will be delivered as eTickets ahead of the event.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex-1 py-3 px-6 rounded-[12px] bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white text-[15px] font-bold transition-colors text-center"
          >
            Browse More Events
          </Link>
          <Link
            href="/mypage"
            className="flex-1 py-3 px-6 rounded-[12px] border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#374151] text-[15px] font-semibold transition-colors text-center"
          >
            My Orders
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="bg-[#0F172A]"><Header /></div>
        <div className="flex items-center justify-center py-32">
          <div className="text-[18px] font-semibold text-[#9CA3AF] animate-pulse">Loading...</div>
        </div>
      </main>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
