'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';

type SeatInfo = { tid: number; label: string; price: number; description: string };

/* ── Privacy Modal ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] sticky top-0 bg-white">
          <h3 className="text-[15px] font-bold text-[#0F172A]">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] text-lg font-bold">×</button>
        </div>
        <div className="px-5 py-4 text-[13px] text-[#374151] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

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

  /* Timer */
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  /* Form */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  /* Agreements */
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);

  /* Modals */
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showThirdPartyModal, setShowThirdPartyModal] = useState(false);

  /* Basket expiration */
  useEffect(() => {
    if (!basketId) return;
    const fallback = () => setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
    fetch(`/api/ltd/basket?basketId=${basketId}`)
      .then(r => r.json())
      .then(data => {
        if (data.expirationDate) {
          const exp = new Date(data.expirationDate);
          if (!isNaN(exp.getTime()) && exp.getTime() > Date.now()) setExpiresAt(exp);
          else fallback();
        } else fallback();
      })
      .catch(fallback);
  }, [basketId]);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('0:00'); setExpired(true); return; }
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${min}:${String(sec).padStart(2, '0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  const formatDateShort = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const day = d.getDate();
    const suffix = [1,21,31].includes(day) ? 'st' : [2,22].includes(day) ? 'nd' : [3,23].includes(day) ? 'rd' : 'th';
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    return `${weekday} ${day}${suffix} ${month} ${year}`;
  };
  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const h = d.getHours(), m = d.getMinutes();
    return `${h % 12 || 12}.${String(m).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`;
  };

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && email.includes('@');
  const allAgreed = agreeRefund && agreePrivacy && agreeThirdParty;
  const canSubmit = isFormValid && allAgreed && !submitting && !expired;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      // 주문 참조 번호 생성 (ENT-YYYYMMDD-RANDOM6)
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orderRef = `ENT-${dateStr}-${rand}`;

      // LTD 결제 URL 요청 (success URL에 ref 포함)
      const siteUrl = window.location.origin;
      const successUrl = `${siteUrl}/${locale}/musical/payment/success?ref=${orderRef}`;
      const failureUrl = `${siteUrl}/${locale}/musical/payment/fail?ref=${orderRef}`;

      const r = await fetch('/api/ltd/basket?action=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId,
          leadCustomer: { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() },
          successUrl,
          failureUrl,
        }),
      });
      const d = await r.json();
      if (!d.paymentUrl) throw new Error(d.error || 'No payment URL returned');

      // Supabase에 주문 정보 저장 (결제 이전에 저장 — 결제 완료 후 조회용)
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref: orderRef,
          basketId,
          eventName,
          venue,
          performanceDate,
          seats,
          total,
          currency: 'GBP',
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        }),
      }).catch(() => {}); // 저장 실패해도 결제 진행

      window.location.href = d.paymentUrl;
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!basketId) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-red-600 text-lg font-bold mb-4">No basket found</p>
      <button onClick={() => router.back()} className="px-5 py-2 bg-[#2B7FFF] text-white rounded-lg text-sm font-semibold">Go back</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Timer bar */}
      <div className={`rounded-xl px-4 py-3 mb-6 flex items-center justify-between ${
        expired ? 'bg-red-50 border border-red-200' :
        timeLeft && parseInt(timeLeft) <= 2 ? 'bg-amber-50 border border-amber-200' :
        'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={expired ? '#DC2626' : '#2B7FFF'} strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <span className={`text-sm font-semibold ${expired ? 'text-red-700' : 'text-[#0F172A]'}`}>
            {expired ? 'Reservation expired' : 'Seats held for you'}
          </span>
        </div>
        <span className={`text-lg font-bold tabular-nums ${expired ? 'text-red-600' : parseInt(timeLeft) <= 2 ? 'text-amber-600' : 'text-[#2B7FFF]'}`}>
          {timeLeft || '--:--'}
        </span>
      </div>

      {expired && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-red-700 font-bold mb-2">Your seat reservation has expired.</p>
          <p className="text-red-600 text-sm mb-4">Please go back and select your seats again.</p>
          <button onClick={() => router.push(`/${locale}/musical/book/${performanceId}`)}
            className="px-5 py-2 bg-[#2B7FFF] text-white rounded-lg text-sm font-semibold hover:bg-[#1D6AE5]">
            Back to seat selection
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Customer info */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">Customer Information</h2>
              <p className="text-sm text-[#64748B] mb-5">Please enter your details to complete the booking.</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-1">First Name <span className="text-red-500">*</span></label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" required
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7FFF]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" required
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7FFF]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" required
                    className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7FFF]" />
                  <p className="text-xs text-[#94A3B8] mt-1">Booking confirmation will be sent to this email.</p>
                </div>

                {/* 약관 동의 */}
                <div className="border-t border-[#E5E7EB] pt-4 space-y-2.5">
                  {/* 요금규정 */}
                  <div className="flex items-center gap-2.5 py-1">
                    <input type="checkbox" id="chk-refund" checked={agreeRefund} onChange={e => setAgreeRefund(e.target.checked)}
                      className="w-4 h-4 accent-[#2B7FFF] cursor-pointer shrink-0" />
                    <label htmlFor="chk-refund" className="text-[13px] text-[#374151] flex-1 cursor-pointer">
                      요금규정 동의 — <span className="font-semibold">환불/변경 불가</span>
                      <span className="text-red-500 ml-1">(필수)</span>
                    </label>
                    <button type="button" onClick={() => setShowRefundModal(true)}
                      className="shrink-0 px-2.5 py-1 bg-[#FF6B35] text-white text-[11px] font-bold rounded hover:bg-[#E55A25]">상세</button>
                  </div>

                  {/* 개인정보 수집 및 이용 */}
                  <div className="flex items-center gap-2.5 py-1">
                    <input type="checkbox" id="chk-privacy" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)}
                      className="w-4 h-4 accent-[#2B7FFF] cursor-pointer shrink-0" />
                    <label htmlFor="chk-privacy" className="text-[13px] text-[#374151] flex-1 cursor-pointer">
                      개인 정보 수집 및 이용<span className="text-red-500 ml-1">(필수)</span>
                    </label>
                    <button type="button" onClick={() => setShowPrivacyModal(true)}
                      className="shrink-0 px-2.5 py-1 bg-[#FF6B35] text-white text-[11px] font-bold rounded hover:bg-[#E55A25]">상세</button>
                  </div>

                  {/* 개인정보 제 3자 제공 */}
                  <div className="flex items-center gap-2.5 py-1">
                    <input type="checkbox" id="chk-third" checked={agreeThirdParty} onChange={e => setAgreeThirdParty(e.target.checked)}
                      className="w-4 h-4 accent-[#2B7FFF] cursor-pointer shrink-0" />
                    <label htmlFor="chk-third" className="text-[13px] text-[#374151] flex-1 cursor-pointer">
                      개인 정보 제 3자 제공<span className="text-red-500 ml-1">(필수)</span>
                    </label>
                    <button type="button" onClick={() => setShowThirdPartyModal(true)}
                      className="shrink-0 px-2.5 py-1 bg-[#FF6B35] text-white text-[11px] font-bold rounded hover:bg-[#E55A25]">상세</button>
                  </div>

                  {!allAgreed && (firstName || lastName || email) && (
                    <p className="text-[11px] text-amber-600 pt-1">모든 필수 항목에 동의해야 결제를 진행할 수 있습니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 sticky top-[80px]">
              <h3 className="text-[17px] font-bold text-[#0F172A] mb-4">Order Summary</h3>

              {/* Show 정보 */}
              <div className="border-b border-[#E5E7EB] pb-4 mb-3">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">Show</p>
                <p className="text-[16px] font-extrabold text-[#0F172A] leading-tight">{eventName}</p>
                {venue && <p className="text-[12px] text-[#64748B] mt-1">{venue}</p>}
                {performanceDate && (
                  <p className="text-[12px] text-[#2B7FFF] font-semibold mt-1">
                    📅 {formatDateShort(performanceDate)} · {formatTime(performanceDate)}
                  </p>
                )}
              </div>

              {/* Seats */}
              <div className="space-y-2.5 mb-3">
                {seats.map((seat, i) => (
                  <div key={seat.tid || i} className="flex items-start justify-between gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0F172A] text-[13px]">{seat.label}</p>
                      {seat.description && <p className="text-[11px] text-[#94A3B8] leading-tight mt-0.5">{seat.description}</p>}
                    </div>
                    <span className="text-[#0F172A] font-semibold text-[13px] shrink-0">£{seat.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-[#E5E7EB] pt-3 flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#0F172A]">Total</span>
                <span className="text-lg font-extrabold text-[#0F172A]">£{total.toFixed(2)}</span>
              </div>

              {/* 결제 버튼 — Total 아래 */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-red-600 text-sm">{submitError}</p>
                </div>
              )}
              <button type="submit" disabled={!canSubmit}
                className={`w-full py-3.5 rounded-xl text-[15px] font-bold transition-all ${
                  !canSubmit
                    ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                    : 'bg-[#22c55e] text-white hover:bg-[#16a34a] active:scale-[0.98] shadow-lg'
                }`}>
                {submitting ? 'Processing...' : expired ? 'Reservation expired' : `Proceed to Payment — £${total.toFixed(2)}`}
              </button>
              {!allAgreed && !expired && (
                <p className="text-[11px] text-[#94A3B8] text-center mt-2">필수 약관 3가지에 모두 동의해 주세요</p>
              )}
              <p className="text-[12px] font-bold text-red-600 text-center mt-2">⚠️ 해외 결제 가능 카드만 이용가능</p>
            </div>
          </div>
        </div>
      </form>

      {/* 요금규정 모달 */}
      {showRefundModal && (
        <Modal title="요금규정 — 환불/변경 불가" onClose={() => setShowRefundModal(false)}>
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-[13px] font-bold text-red-700">⚠️ 예약 완료 후 환불 및 변경이 불가합니다.</p>
            </div>
            <p className="text-[13px] text-[#374151]">런던 뮤지컬 티켓 특성상 예약 완료 후 취소, 환불, 날짜 변경, 좌석 변경이 일절 불가합니다.</p>
            <ul className="text-[12px] text-[#374151] space-y-1.5 list-disc list-inside">
              <li>예약 확정 후 취소 불가</li>
              <li>날짜/시간 변경 불가</li>
              <li>좌석 변경 불가</li>
              <li>공연 당일 노쇼(No-Show) 시 환불 불가</li>
              <li>천재지변 등 불가항력에 의한 공연 취소 시 별도 안내</li>
            </ul>
            <p className="text-[12px] text-[#64748B]">본 규정에 동의하신 후 결제를 진행해 주시기 바랍니다.</p>
          </div>
        </Modal>
      )}

      {/* 개인정보 수집 및 이용 모달 */}
      {showPrivacyModal && (
        <Modal title="개인정보 수집 및 이용" onClose={() => setShowPrivacyModal(false)}>
          <table className="w-full text-[12px] border-collapse border border-[#E5E7EB] mb-4">
            <thead>
              <tr className="bg-[#F8FAFC]">
                {['구분','수집항목','수집목적','보유기간'].map(h => (
                  <th key={h} className="border border-[#E5E7EB] px-2 py-2 text-left font-semibold text-[#374151]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151] align-top">서비스 제공에 따른 계약 이행 및 요금정산</td>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151]">대표 예약자명 정보 : 영문 성명, 이메일, 휴대폰번호</td>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151]">뮤지컬티켓 예약/결제/발권/차내서비스처리, 본인확인</td>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151]">①고객 삭제 요구 시②관계 법령의 규정에 의하여 관계법령이 정한 기간</td>
              </tr>
              <tr>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151] align-top">서비스이용에 따른 자동수집 및 생성정보</td>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151]">접속IP정보, 쿠키, 접속로그, 모바일 단말기정보(운영체제 및 버전, 단말기식별번호), 결제기록</td>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151]">본인 확인 서비스 이용 통계 작성, 부정이용방지, 맞춤형 서비스 및 마케팅 정보 제공</td>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151]">3개월</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[12px] text-[#374151]">회사는 상품판매 및 결제, 상담, 기타 고객 서비스 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
          <p className="text-[12px] text-[#64748B] mt-3 font-semibold">*동의를 거부할 권리 및 동의를 거부할 경우의 불이익</p>
          <p className="text-[12px] text-[#374151] mt-1">개인정보주체는 개인정보 수집 및 이용동의를 거부할 권리가 있습니다. 동의를 거부할 경우 서비스 이용이 불가함을 알려드립니다.</p>
        </Modal>
      )}

      {/* 개인정보 제 3자 제공 모달 */}
      {showThirdPartyModal && (
        <Modal title="개인정보 제 3자 제공" onClose={() => setShowThirdPartyModal(false)}>
          <p className="text-[12px] text-[#374151] mb-4">
            디플랫코리아는 정보제공 주체자의 동의가 있거나 관련법령의 규정에 의한 경우를 제외하고는 어떠한 경우에도 &apos;개인정보의 수집 및 이용목적&apos;에서 고지한 범위를 넘어서거나, 서비스 영역과 무관한 타 기업/기관에 제공하거나 이용하지 않습니다.
          </p>
          <table className="w-full text-[12px] border-collapse border border-[#E5E7EB] mb-4">
            <thead>
              <tr className="bg-[#F8FAFC]">
                {['제공받는 자','제공하는 항목','이용목적','국외 이전여부','보유 및 이용기간'].map(h => (
                  <th key={h} className="border border-[#E5E7EB] px-2 py-2 text-left font-semibold text-[#374151]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151]">London Theatre Direct Ltd</td>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151]">이메일, 영문성명</td>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151]">티켓 예약 및 문의</td>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151]">영국</td>
                <td className="border border-[#E5E7EB] px-2 py-2 text-[#374151]">이용 목적달성시 까지</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[12px] font-semibold text-[#374151] mb-2">수집한 개인정보의 위탁</p>
          <p className="text-[12px] text-[#374151] mb-3">
            디플랫코리아는 고객의 원활한 서비스 제공을 위하여 일부 업무를 전문업체에 위탁 운영하고 있으며, 위탁계약시 개인정보 안전하게 관리함에 있어 관계법령에 따라 보호 안전을 기하며, 위탁계약 종료시까지 적법한 처리절차, 보안지시엄수, 개인정보에 관한 비밀유지, 업무 목적 및 범위를 벗어난 사용의 제한, 재위탁 제한 등 사고시의 손해배상 책임부담을 명확히 규정하고 해당 계약내용을 서면 또는 전자적으로 보관하여 이를 엄격하게 관리감독 하고 있으며, 위탁업무내용 또는 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개합니다.
          </p>
          <p className="text-[12px] text-[#64748B] font-semibold">*동의를 거부할 권리 및 동의를 거부할 경우의 불이익</p>
          <p className="text-[12px] text-[#374151] mt-1">개인정보주체는 개인정보 수집 및 이용동의를 거부할 권리가 있습니다. 동의를 거부할 경우 서비스 이용이 불가함을 알려드립니다.</p>
        </Modal>
      )}
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
