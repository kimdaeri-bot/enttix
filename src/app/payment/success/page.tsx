'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [paymentData, setPaymentData] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const paymentKey = params.get('paymentKey') || '';
  const orderId = params.get('orderId') || '';
  const amount = Number(params.get('amount') || 0);

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setStatus('error');
      setErrorMsg('잘못된 결제 정보입니다.');
      return;
    }

    // 서버에서 결제 승인
    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setPaymentData(data);
          setStatus('success');
        } else {
          setErrorMsg(data.error || '결제 승인 실패');
          setStatus('error');
        }
      })
      .catch(err => {
        setErrorMsg(String(err));
        setStatus('error');
      });
  }, [paymentKey, orderId, amount]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
        <p className="text-[#64748B] text-[15px]">결제를 확인하고 있습니다...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-[520px] mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-[#FECACA] p-10 shadow-sm">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-[24px] font-extrabold text-[#0F172A] mb-2">결제 실패</h1>
          <p className="text-[14px] text-[#EF4444] mb-6">{errorMsg}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl bg-[#F1F5F9] text-[#374151] text-[14px] font-semibold hover:bg-[#E2E8F0] transition-colors">
              이전으로
            </button>
            <Link href="/" className="px-5 py-2.5 rounded-xl bg-[#2B7FFF] text-white text-[14px] font-semibold hover:bg-[#1D6AE5] transition-colors">
              홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[560px] mx-auto px-4 py-14">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {/* Success header */}
        <div className="bg-gradient-to-r from-[#10B981] to-[#059669] px-8 py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h1 className="text-[28px] font-extrabold text-white mb-1">결제 완료! 🎫</h1>
          <p className="text-white/80 text-[14px]">티켓 구매가 성공적으로 완료되었습니다</p>
        </div>

        {/* Order details */}
        <div className="px-8 py-6 space-y-4">
          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-[14px]">
              <span className="text-[#64748B]">주문번호</span>
              <span className="font-semibold text-[#0F172A] font-mono text-[12px]">{orderId}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-[#64748B]">결제금액</span>
              <span className="font-extrabold text-[#2B7FFF] text-[17px]">₩{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-[#64748B]">결제수단</span>
              <span className="font-semibold text-[#374151]">{String(paymentData?.method || '카드')}</span>
            </div>
            {typeof paymentData?.approvedAt === 'string' && (
              <div className="flex justify-between text-[14px]">
                <span className="text-[#64748B]">결제시각</span>
                <span className="font-semibold text-[#374151] text-[12px]">
                  {new Date(paymentData.approvedAt).toLocaleString('ko-KR')}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <p className="text-[13px] text-[#1E40AF] leading-relaxed">
              이메일로 전자티켓이 발송됩니다. 스팸함도 확인해주세요.
              문의: <a href="mailto:support@enttix.com" className="font-semibold underline">support@enttix.com</a>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link href="/mypage"
              className="flex-1 py-3 text-center rounded-xl border-2 border-[#E2E8F0] text-[#374151] text-[14px] font-semibold hover:bg-[#F8FAFC] transition-colors">
              내 주문 보기
            </Link>
            <Link href="/"
              className="flex-1 py-3 text-center rounded-xl bg-[#2B7FFF] text-white text-[14px] font-bold hover:bg-[#1D6AE5] transition-colors">
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" /></div>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
