'use client';
import Header from '@/components/Header';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

// 토스페이먼츠 클라이언트 키 (테스트)
// 실서비스 전환 시 환경변수로 교체: NEXT_PUBLIC_TOSS_CLIENT_KEY
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TossPayments?: any;
  }
}

export default function CheckoutPage() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useAuth();

  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [widgetReady, setWidgetReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [tossLoaded, setTossLoaded] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetRef = useRef<any>(null);
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  // 사용자 정보 자동 채우기
  useEffect(() => {
    if (user) {
      setBuyerEmail(user.email || '');
      setBuyerName(user.user_metadata?.full_name || user.user_metadata?.name || '');
    }
  }, [user]);

  // 총 결제금액 (KRW)
  const totalKRW = Math.round(totalPrice * 1700); // GBP → KRW 환산 (실서비스에서 실시간 환율로 교체)
  const orderName = items.length > 0
    ? (items.length === 1 ? items[0].eventName : `${items[0].eventName} 외 ${items.length - 1}건`)
    : '티켓 구매';

  // 토스페이먼츠 SDK 로드
  useEffect(() => {
    if (items.length === 0) return;
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard';
    script.onload = () => setTossLoaded(true);
    script.onerror = () => console.error('Toss SDK 로드 실패');
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [items.length]);

  // 위젯 초기화 (SDK 로드 & 금액 확정 후)
  useEffect(() => {
    if (!tossLoaded || !window.TossPayments || items.length === 0) return;
    if (!paymentMethodRef.current || !agreementRef.current) return;
    if (widgetReady) return;

    (async () => {
      try {
        const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
        const customerKey = user?.id || `GUEST_${Date.now()}`;
        const widgets = tossPayments.widgets({ customerKey });

        await widgets.setAmount({ currency: 'KRW', value: totalKRW });

        await Promise.all([
          widgets.renderPaymentMethods({
            selector: '#toss-payment-methods',
            variantKey: 'DEFAULT',
          }),
          widgets.renderAgreement({
            selector: '#toss-agreement',
            variantKey: 'AGREEMENT',
          }),
        ]);

        widgetRef.current = widgets;
        setWidgetReady(true);
      } catch (err) {
        console.error('Toss widget init error:', err);
      }
    })();
  }, [tossLoaded, items.length, totalKRW, user, widgetReady]);

  // 결제 요청
  const handlePayment = async () => {
    if (!widgetRef.current || loading) return;
    if (!buyerName || !buyerEmail) {
      alert('이름과 이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const origin = window.location.origin;

      await widgetRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${origin}/payment/success`,
        failUrl: `${origin}/payment/fail`,
        customerEmail: buyerEmail,
        customerName: buyerName,
        customerMobilePhone: buyerPhone.replace(/-/g, ''),
      });
    } catch (err: unknown) {
      // 사용자가 결제창 닫으면 여기로 옴 (정상)
      console.log('Payment cancelled or error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="bg-[#0F172A]"><Header hideSearch /></div>
        <div className="max-w-[560px] mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h1 className="text-[24px] font-bold text-[#0F172A] mb-3">장바구니가 비어있습니다</h1>
          <p className="text-[#64748B] text-[14px] mb-6">마음에 드는 티켓을 추가해보세요</p>
          <Link href="/all-tickets"
            className="px-6 py-3 rounded-xl bg-[#2B7FFF] text-white font-semibold text-[14px] hover:bg-[#1D6AE5] transition-colors">
            티켓 둘러보기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>

      <div className="max-w-[1000px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/cart" className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            장바구니
          </Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          <span className="text-[14px] font-semibold text-[#0F172A]">결제</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT: Payment widget ── */}
          <div className="flex-1 space-y-5">

            {/* 구매자 정보 */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <h2 className="text-[16px] font-bold text-[#0F172A] mb-4">구매자 정보</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-[#64748B] block mb-1.5">이름 *</label>
                    <input
                      type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)}
                      placeholder="홍길동"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[14px] outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#64748B] block mb-1.5">연락처</label>
                    <input
                      type="tel" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[14px] outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/10 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#64748B] block mb-1.5">이메일 * (티켓 수령)</label>
                  <input
                    type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)}
                    placeholder="ticket@email.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[14px] outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 토스페이먼츠 결제 위젯 */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-6 pt-5 pb-2">
                <h2 className="text-[16px] font-bold text-[#0F172A]">결제 수단</h2>
              </div>
              {!tossLoaded ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
                </div>
              ) : (
                <>
                  <div id="toss-payment-methods" ref={paymentMethodRef} className="px-2" />
                  <div id="toss-agreement" ref={agreementRef} className="px-2 pb-4" />
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT: Order summary ── */}
          <div className="w-full lg:w-[340px] flex-shrink-0 space-y-4 lg:sticky lg:top-6">

            {/* 주문 상품 */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <h2 className="text-[15px] font-bold text-[#0F172A] mb-4">주문 상품 ({totalItems})</h2>
              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0F172A] leading-snug line-clamp-2">{item.eventName}</p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">{item.section}{item.row ? ` · Row ${item.row}` : ''} · {item.quantity}매</p>
                      <p className="text-[13px] font-bold text-[#2B7FFF] mt-0.5">
                        {item.currency || '£'}{(item.pricePerTicket * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 결제 금액 */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <div className="space-y-2.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#64748B]">티켓 소계</span>
                  <span className="font-semibold text-[#374151]">£{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#64748B]">수수료</span>
                  <span className="font-semibold text-[#10B981]">없음</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#94A3B8]">
                  <span>환율 적용 (GBP → KRW)</span>
                  <span>×1,700</span>
                </div>
                <div className="border-t border-[#E5E7EB] pt-2.5 flex justify-between">
                  <span className="text-[15px] font-bold text-[#0F172A]">합계</span>
                  <div className="text-right">
                    <p className="text-[20px] font-extrabold text-[#2B7FFF]">₩{totalKRW.toLocaleString()}</p>
                    <p className="text-[11px] text-[#94A3B8]">≈ £{totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 안심 구매 */}
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 space-y-2">
              {[
                { icon: '✓', text: '수수료 없음' },
                { icon: '🔒', text: '토스페이먼츠 보안 결제' },
                { icon: '📧', text: '이메일 티켓 즉시 발송' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px] text-[#166534]">
                  <span className="font-bold">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* 결제 버튼 */}
            <button
              onClick={handlePayment}
              disabled={!widgetReady || loading || !buyerName || !buyerEmail}
              className={`w-full py-4 rounded-2xl text-[16px] font-extrabold transition-all ${
                widgetReady && buyerName && buyerEmail && !loading
                  ? 'bg-[#2B7FFF] text-white hover:bg-[#1D6AE5] active:scale-[0.98] shadow-lg shadow-[#2B7FFF]/25'
                  : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25"/>
                    <path d="M21 12a9 9 0 00-9-9"/>
                  </svg>
                  결제 중...
                </span>
              ) : !widgetReady ? '결제 준비 중...' : `₩${totalKRW.toLocaleString()} 결제하기`}
            </button>
            {!widgetReady && tossLoaded && (
              <p className="text-[11px] text-[#94A3B8] text-center">결제 모듈 초기화 중...</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
