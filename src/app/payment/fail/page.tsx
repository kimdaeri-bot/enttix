'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

function FailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get('code') || '';
  const message = params.get('message') || '결제에 실패했습니다.';

  return (
    <div className="max-w-[520px] mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-2xl border border-[#FECACA] shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#EF4444] to-[#DC2626] px-8 py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </div>
          <h1 className="text-[26px] font-extrabold text-white mb-1">결제 실패</h1>
          <p className="text-white/80 text-[14px]">결제 처리 중 문제가 발생했습니다</p>
        </div>

        <div className="px-8 py-6 space-y-4">
          {code && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4">
              <p className="text-[12px] text-[#94A3B8] mb-1 font-mono">{code}</p>
              <p className="text-[14px] text-[#EF4444] font-semibold">{message}</p>
            </div>
          )}

          <p className="text-[14px] text-[#64748B]">
            결제가 완료되지 않았습니다. 카드 정보를 확인하거나 다른 결제 수단을 이용해주세요.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-xl bg-[#2B7FFF] text-white text-[14px] font-bold hover:bg-[#1D6AE5] transition-colors"
            >
              다시 시도
            </button>
            <Link href="/"
              className="flex-1 py-3 text-center rounded-xl border-2 border-[#E2E8F0] text-[#374151] text-[14px] font-semibold hover:bg-[#F8FAFC] transition-colors">
              홈으로
            </Link>
          </div>

          <p className="text-[12px] text-[#94A3B8]">
            문의: <a href="mailto:support@enttix.com" className="text-[#2B7FFF] hover:underline">support@enttix.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" /></div>}>
        <FailContent />
      </Suspense>
    </main>
  );
}
