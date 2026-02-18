'use client';
import { useState, useEffect, use, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

/* ── Types ── */
interface Area {
  AreaId: number;
  AreaName: string;
  Prices: { Price: number; FaceValue: number; AvailableSeatsCount: number }[];
}

/* ── Color palette for areas ── */
const AREA_COLORS = [
  { bg: '#EEF2FF', border: '#6366F1', dot: '#6366F1', label: 'Indigo' },
  { bg: '#F5F3FF', border: '#7C3AED', dot: '#7C3AED', label: 'Purple' },
  { bg: '#FDF2F8', border: '#DB2777', dot: '#DB2777', label: 'Pink' },
  { bg: '#FFF7ED', border: '#EA580C', dot: '#EA580C', label: 'Orange' },
  { bg: '#FEFCE8', border: '#CA8A04', dot: '#CA8A04', label: 'Yellow' },
  { bg: '#F0FDFA', border: '#0D9488', dot: '#0D9488', label: 'Teal' },
  { bg: '#ECFEFF', border: '#0891B2', dot: '#0891B2', label: 'Cyan' },
  { bg: '#F0FDF4', border: '#16A34A', dot: '#16A34A', label: 'Emerald' },
  { bg: '#FFF1F2', border: '#E11D48', dot: '#E11D48', label: 'Rose' },
  { bg: '#F8FAFC', border: '#64748B', dot: '#64748B', label: 'Slate' },
];

/* ── Helpers ── */
function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}
function formatDateTime(iso: string) {
  if (!iso) return '';
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

/* ── Countdown Timer ── */
function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (ref.current) clearInterval(ref.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = (remaining / seconds) * 100;
  const isUrgent = remaining < 120;

  return (
    <div className={`rounded-2xl p-4 border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-[#EFF6FF] border-[#BFDBFE]'}`}>
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={isUrgent ? '#FECACA' : '#DBEAFE'} strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={isUrgent ? '#EF4444' : '#2B7FFF'}
              strokeWidth="3"
              strokeDasharray={`${pct} 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-[10px] font-bold ${isUrgent ? 'text-red-600' : 'text-[#2B7FFF]'}`}>
              {mins}:{String(secs).padStart(2, '0')}
            </span>
          </div>
        </div>
        <div>
          <p className={`text-[14px] font-bold ${isUrgent ? 'text-red-700' : 'text-[#0F172A]'}`}>
            ⏱️ 주문 완료까지 남은 시간: {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </p>
          <p className={`text-[12px] mt-0.5 ${isUrgent ? 'text-red-600' : 'text-[#64748B]'}`}>
            주문 시간이 만료되면 자동으로 취소되며, 재주문 해야 합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   BOOKING CONTENT (3-step flow)
══════════════════════════════════════════ */
function BookingContent({ performanceId }: { performanceId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const eventId = params.get('eventId') || '';
  const eventName = params.get('eventName') || 'Show';
  const minPrice = params.get('price') || '0';
  const venue = params.get('venue') || '';
  const dateParam = params.get('date') || '';

  /* Step state */
  const [step, setStep] = useState<1 | 2 | 3>(1);

  /* Step 1 state */
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areasError, setAreasError] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [selectedAreaName, setSelectedAreaName] = useState('');
  const [qty, setQty] = useState(1);

  /* Step 2 state */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone1, setPhone1] = useState('010');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeFare, setAgreeFare] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeThird, setAgreeThird] = useState(false);

  /* Step 3 state */
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);

  /* Load areas */
  useEffect(() => {
    fetch(`/api/ltd/performance/${performanceId}/areas`)
      .then(r => {
        if (!r.ok) throw new Error('failed');
        return r.json();
      })
      .then(d => {
        if (d.areas && d.areas.length > 0) {
          setAreas(d.areas);
        } else {
          setAreasError(true);
        }
      })
      .catch(() => setAreasError(true))
      .finally(() => setAreasLoading(false));
  }, [performanceId]);

  /* Agree all sync */
  useEffect(() => {
    if (agreeFare && agreePrivacy && agreeThird) setAgreeAll(true);
    else setAgreeAll(false);
  }, [agreeFare, agreePrivacy, agreeThird]);

  function handleAgreeAll(v: boolean) {
    setAgreeAll(v);
    setAgreeFare(v);
    setAgreePrivacy(v);
    setAgreeThird(v);
  }

  /* Step 1 → 2 */
  function goStep2() {
    if (!selectedArea || !selectedPrice) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* Step 2 → 3: Payment */
  async function handlePay() {
    if (!agreeFare || !agreePrivacy || !agreeThird) return;
    if (!firstName || !lastName || !email) return;
    setStep(3);
    setProcessing(true);
    setProcessError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      /* Create basket */
      const r1 = await fetch('/api/ltd/basket?action=create', { method: 'POST' });
      const d1 = await r1.json();
      if (!d1.basketId) throw new Error(d1.error || '바스켓 생성에 실패했습니다.');

      /* Add tickets */
      const areaId = areasError ? 0 : (selectedArea?.AreaId ?? 0);
      const r2 = await fetch('/api/ltd/basket?action=add-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId: d1.basketId,
          performanceId: Number(performanceId),
          areaId,
          seatsCount: qty,
          price: selectedPrice,
        }),
      });
      const d2 = await r2.json();
      if (d2.error) throw new Error(d2.error);

      /* Submit */
      const leadCustomer = {
        FirstName: firstName,
        LastName: lastName,
        EmailAddress: email,
        MobilePhoneNumber: `${phone1}${phone2}${phone3}`,
      };
      const r3 = await fetch('/api/ltd/basket?action=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId: d1.basketId,
          affiliateId: '775854e9-b102-48d9-99bc-4b288a67b538',
          leadCustomer,
        }),
      });
      const d3 = await r3.json();
      if (d3.error) throw new Error(d3.error);
      if (!d3.paymentUrl) throw new Error('결제 URL을 받지 못했습니다.');

      setPaymentUrl(d3.paymentUrl);
      setShowPayModal(true);
    } catch (err: unknown) {
      setProcessError(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessing(false);
    }
  }

  /* Expire callback */
  function handleTimerExpire() {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const totalAmount = selectedPrice * qty;

  /* ── STEP INDICATOR ── */
  function StepBar() {
    return (
      <div className="flex items-center gap-0 mb-6">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${
              step > s ? 'bg-[#10B981] text-white' :
              step === s ? 'bg-[#2B7FFF] text-white' :
              'bg-[#E2E8F0] text-[#94A3B8]'
            }`}>
              {step > s ? '✓' : s}
            </div>
            <div className="ml-2 mr-2 flex-1">
              <p className={`text-[11px] font-semibold ${step === s ? 'text-[#2B7FFF]' : step > s ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>
                {s === 1 ? '구역 선택' : s === 2 ? '예약자 정보' : '결제'}
              </p>
            </div>
            {i < 2 && <div className={`h-px flex-1 mx-1 ${step > s ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'}`} />}
          </div>
        ))}
      </div>
    );
  }

  /* ── SUMMARY CARD ── */
  function SummaryCard({ compact }: { compact?: boolean }) {
    return (
      <div className={`bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] ${compact ? 'p-3' : 'p-4'} flex gap-3 mb-4`}>
        <div className={`${compact ? 'w-14 h-14' : 'w-20 h-20'} rounded-xl overflow-hidden bg-[#E2E8F0] flex-shrink-0`}>
          <div className="w-full h-full flex items-center justify-center text-3xl">🎭</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-[#0F172A] truncate ${compact ? 'text-[13px]' : 'text-[15px]'}`}>{eventName}</p>
          <p className="text-[12px] text-[#64748B] truncate mt-0.5">{venue}</p>
          {dateParam && (
            <p className="text-[12px] text-[#64748B] mt-0.5">{formatDateTime(dateParam)}</p>
          )}
          {selectedPrice > 0 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E2E8F0]">
              <p className="text-[12px] text-[#64748B]">
                {qty}매 {selectedAreaName && `/ ${selectedAreaName}`}
              </p>
              <p className="text-[14px] font-extrabold text-[#2B7FFF]">£{totalAmount.toFixed(2)}</p>
            </div>
          )}
          {!selectedPrice && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-[12px] text-[#64748B]">티켓: 0</p>
              <p className="text-[13px] font-bold text-[#94A3B8]">합계 £0.00</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ──────────────────────────────
     STEP 1: 구역/가격 선택
  ────────────────────────────── */
  if (step === 1) {
    return (
      <div className="max-w-[680px] mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href={eventId ? `/musical/event/${eventId}` : '/musical/west-end'}
          className="flex items-center gap-2 text-[13px] text-[#64748B] hover:text-[#2B7FFF] mb-5 transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-0.5 transition-transform">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          {eventName}로 돌아가기
        </Link>

        <StepBar />

        {/* Summary */}
        <SummaryCard />

        {/* Area selection */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-[#2B7FFF] to-[#1D6AE5] px-5 py-4">
            <h2 className="text-[16px] font-extrabold text-white">구역 / 가격 선택</h2>
            <p className="text-[#BFDBFE] text-[12px] mt-0.5">원하시는 구역을 선택하세요</p>
          </div>

          <div className="p-5">
            {areasLoading ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
                <p className="text-[#94A3B8] text-sm">좌석 정보를 불러오는 중...</p>
              </div>
            ) : areasError ? (
              /* Fallback: BestSeats */
              <div className="space-y-3">
                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 mb-3">
                  <p className="text-[12px] text-[#92400E]">* 실시간 구역별 좌석 선택은 정식 파트너 키가 필요합니다. 현재는 최적 좌석 자동 배정으로 예매합니다.</p>
                </div>
                {(() => {
                  const isSelected = selectedAreaName === 'Best Available';
                  return (
                    <button
                      onClick={() => {
                        setSelectedArea(null);
                        setSelectedPrice(Number(minPrice));
                        setSelectedAreaName('Best Available');
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[#2B7FFF] bg-[#EFF6FF]'
                          : 'border-[#E2E8F0] hover:border-[#2B7FFF]/50 hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="relative w-8 h-8 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF2FF', border: '2px solid #6366F1' }}>
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6366F1' }} />
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2B7FFF] flex items-center justify-center">
                            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2"><path d="M2 6l3 3 5-5"/></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-bold text-[#0F172A]">Best Available</p>
                        <p className="text-[12px] text-[#94A3B8]">최적 좌석 자동 배정</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[20px] font-extrabold text-[#2B7FFF]">£{minPrice}</p>
                        <p className="text-[11px] text-[#94A3B8]">per ticket</p>
                      </div>
                    </button>
                  );
                })()}
              </div>
            ) : (
              /* Real areas */
              <div className="space-y-2">
                {areas.flatMap((area, ai) =>
                  (area.Prices || []).map((pr, pi) => {
                    const colorIdx = (ai * 3 + pi) % AREA_COLORS.length;
                    const color = AREA_COLORS[colorIdx];
                    const isSelected = selectedArea?.AreaId === area.AreaId && selectedPrice === pr.Price;
                    return (
                      <button
                        key={`${area.AreaId}-${pi}`}
                        onClick={() => {
                          setSelectedArea(area);
                          setSelectedPrice(pr.Price);
                          setSelectedAreaName(area.AreaName);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-[#2B7FFF] bg-[#EFF6FF]'
                            : 'border-[#E2E8F0] hover:border-[#2B7FFF]/50 hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {/* Color dot with checkbox */}
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: color.bg, border: `2px solid ${color.border}` }}
                          >
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color.dot }} />
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2B7FFF] flex items-center justify-center">
                              <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2"><path d="M2 6l3 3 5-5"/></svg>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-[#0F172A] truncate">{area.AreaName}</p>
                          <p className="text-[11px] text-[#94A3B8]">Face value £{pr.FaceValue}</p>
                          {pr.AvailableSeatsCount > 0 && (
                            <p className="text-[11px] text-[#10B981]">{pr.AvailableSeatsCount} seats left</p>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-[20px] font-extrabold text-[#2B7FFF]">£{pr.Price}</p>
                          <p className="text-[11px] text-[#94A3B8]">per ticket</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Qty + Total */}
            {selectedPrice > 0 && (
              <div className="mt-4 bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-[#0F172A]">티켓 수량</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-9 h-9 rounded-full border-2 border-[#E2E8F0] flex items-center justify-center text-[#374151] hover:border-[#2B7FFF] hover:text-[#2B7FFF] text-xl font-bold transition-colors"
                    >−</button>
                    <span className="text-[18px] font-bold text-[#0F172A] w-8 text-center">{qty}</span>
                    <button
                      onClick={() => setQty(Math.min(6, qty + 1))}
                      className="w-9 h-9 rounded-full border-2 border-[#E2E8F0] flex items-center justify-center text-[#374151] hover:border-[#2B7FFF] hover:text-[#2B7FFF] text-xl font-bold transition-colors"
                    >+</button>
                  </div>
                </div>
                <div className="border-t border-[#E2E8F0] pt-3">
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-[#64748B]">{selectedAreaName} × {qty}</span>
                    <span className="font-semibold text-[#374151]">£{(selectedPrice * qty).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                    <span className="text-[15px] font-bold text-[#0F172A]">합계</span>
                    <span className="text-[20px] font-extrabold text-[#2B7FFF]">£{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={goStep2}
          disabled={!selectedPrice}
          className={`w-full py-4 rounded-xl text-[16px] font-bold transition-all mb-3 ${
            selectedPrice
              ? 'bg-[#2B7FFF] text-white hover:bg-[#1D6AE5] active:scale-[0.98] shadow-lg shadow-[#2B7FFF]/25'
              : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
          }`}
        >
          {selectedPrice ? '다음 단계 →' : '구역을 선택하세요'}
        </button>

        {/* No refund badge */}
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-center text-[12px] font-semibold">
          ⚠️ 환불 및 변경 불가 · No Refunds or Exchanges
        </div>
      </div>
    );
  }

  /* ──────────────────────────────
     STEP 2: 예약자 정보
  ────────────────────────────── */
  if (step === 2) {
    const canPay = agreeFare && agreePrivacy && agreeThird && firstName && lastName && email;
    return (
      <div className="max-w-[680px] mx-auto px-4 py-8">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 text-[13px] text-[#64748B] hover:text-[#2B7FFF] mb-5 transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-0.5 transition-transform">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          구역 선택으로 돌아가기
        </button>

        <StepBar />

        {/* Countdown timer */}
        <div className="mb-4">
          <CountdownTimer seconds={600} onExpire={handleTimerExpire} />
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] px-5 py-3">
            <h3 className="text-[14px] font-bold text-white">주문 요약</h3>
          </div>
          <div className="p-4">
            <div className="flex gap-3 items-start">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#E2E8F0] flex-shrink-0 flex items-center justify-center text-2xl">
                🎭
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#0F172A] truncate">{eventName}</p>
                {dateParam && (
                  <p className="text-[12px] text-[#64748B] mt-0.5">{formatDateTime(dateParam)} / {venue}</p>
                )}
                {!dateParam && venue && (
                  <p className="text-[12px] text-[#64748B] mt-0.5">{venue}</p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F1F5F9]">
                  <p className="text-[12px] text-[#64748B]">{qty}매 / {selectedAreaName}</p>
                  <p className="text-[14px] font-bold text-[#2B7FFF]">£{totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex justify-between">
              <span className="text-[14px] font-bold text-[#0F172A]">합계</span>
              <span className="text-[18px] font-extrabold text-[#2B7FFF]">£{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Agreements */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 mb-4 space-y-3">
          <h3 className="text-[14px] font-bold text-[#0F172A] mb-3">약관 동의</h3>

          {/* All agree */}
          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[#F8FAFC]">
            <input
              type="checkbox"
              checked={agreeAll}
              onChange={e => handleAgreeAll(e.target.checked)}
              className="w-4 h-4 rounded accent-[#2B7FFF]"
            />
            <span className="text-[14px] font-bold text-[#0F172A]">전체 동의</span>
          </label>

          <div className="border-t border-[#F1F5F9] pt-3 space-y-2">
            {[
              { state: agreeFare, set: setAgreeFare, label: '요금 규정 (필수)' },
              { state: agreePrivacy, set: setAgreePrivacy, label: '개인정보 수집 및 이용 (필수)' },
              { state: agreeThird, set: setAgreeThird, label: '개인정보 제3자 제공 (필수)' },
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[#F8FAFC]">
                <input
                  type="checkbox"
                  checked={item.state}
                  onChange={e => item.set(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#2B7FFF]"
                />
                <span className="text-[13px] text-[#374151] flex-1">{item.label}</span>
                <button className="text-[11px] text-[#2B7FFF] hover:underline flex-shrink-0">상세</button>
              </label>
            ))}
          </div>
        </div>

        {/* Customer info form */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 mb-4">
          <h3 className="text-[14px] font-bold text-[#0F172A] mb-4">예약자 정보</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5">영문 성 (Last Name)</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="예: KIM"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder-[#CBD5E1] focus:outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5">영문 이름 (First Name)</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="예: GILDONG"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder-[#CBD5E1] focus:outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder-[#CBD5E1] focus:outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#64748B] mb-1.5">휴대폰 번호</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={phone1}
                  onChange={e => setPhone1(e.target.value)}
                  className="w-16 px-3 py-3 rounded-xl border border-[#E2E8F0] text-[14px] text-center text-[#0F172A] focus:outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
                  maxLength={3}
                />
                <span className="flex items-center text-[#94A3B8]">-</span>
                <input
                  type="text"
                  value={phone2}
                  onChange={e => setPhone2(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="flex-1 px-3 py-3 rounded-xl border border-[#E2E8F0] text-[14px] text-center text-[#0F172A] placeholder-[#CBD5E1] focus:outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
                  maxLength={4}
                />
                <span className="flex items-center text-[#94A3B8]">-</span>
                <input
                  type="text"
                  value={phone3}
                  onChange={e => setPhone3(e.target.value.replace(/\D/g, ''))}
                  placeholder="5678"
                  className="flex-1 px-3 py-3 rounded-xl border border-[#E2E8F0] text-[14px] text-center text-[#0F172A] placeholder-[#CBD5E1] focus:outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment method icons + button */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-semibold text-[#64748B]">결제 수단</p>
            <div className="flex items-center gap-2">
              {['VISA', 'MC', 'DISC', 'DC'].map((card, i) => (
                <div key={i} className="h-6 px-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] flex items-center">
                  <span className="text-[9px] font-bold text-[#64748B]">{card}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={!canPay}
            className={`w-full py-4 rounded-xl text-[16px] font-bold transition-all ${
              canPay
                ? 'bg-[#2B7FFF] text-white hover:bg-[#1D6AE5] active:scale-[0.98] shadow-lg shadow-[#2B7FFF]/25'
                : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
            }`}
          >
            {canPay ? `💳 결제하기 · £${totalAmount.toFixed(2)}` : '필수 항목을 모두 입력해주세요'}
          </button>
          <p className="text-[11px] text-[#94A3B8] text-center mt-3">🔒 Powered by Stripe · Secure payment</p>
        </div>

        {/* No refund */}
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-center text-[12px] font-semibold">
          ⚠️ 환불 및 변경 불가 · No Refunds or Exchanges
        </div>
      </div>
    );
  }

  /* ──────────────────────────────
     STEP 3: 결제 처리
  ────────────────────────────── */
  return (
    <div className="max-w-[680px] mx-auto px-4 py-8">
      <StepBar />

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#2B7FFF] to-[#1D6AE5] px-5 py-4">
          <h2 className="text-[16px] font-extrabold text-white">결제 처리 중</h2>
          <p className="text-[#BFDBFE] text-[12px] mt-0.5">잠시만 기다려 주세요</p>
        </div>

        <div className="p-8 text-center">
          {processing ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin mx-auto" />
              <p className="text-[15px] font-semibold text-[#0F172A]">바스켓 생성 중...</p>
              <p className="text-[13px] text-[#64748B]">결제 페이지로 이동 준비 중입니다.</p>
            </div>
          ) : processError ? (
            <div className="space-y-4">
              <div className="text-5xl">😔</div>
              <p className="text-[15px] font-bold text-red-600">결제 처리 중 오류가 발생했습니다</p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
                <p className="text-[13px] text-red-700">{processError}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-[14px] font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  ← 돌아가기
                </button>
                <button
                  onClick={handlePay}
                  className="px-5 py-2.5 rounded-xl bg-[#2B7FFF] text-white text-[14px] font-bold hover:bg-[#1D6AE5] transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Payment modal */}
      {showPayModal && paymentUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPayModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-[400px] w-full p-8 text-center">
            {/* Card icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="1.5">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>

            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Powered by Stripe</p>
            <h3 className="text-[20px] font-extrabold text-[#0F172A] mb-3">결제 페이지로 이동</h3>
            <p className="text-[13px] text-[#64748B] leading-relaxed mb-6">
              이 티켓은 글로벌 결제 대행사 <strong className="text-[#0F172A]">Stripe</strong>를 통해 안전하게 결제됩니다.<br />
              버튼을 누르면 결제창으로 이동합니다.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-[14px] font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => { window.location.href = paymentUrl; }}
                className="flex-1 py-3 rounded-xl bg-[#2B7FFF] text-white text-[14px] font-bold hover:bg-[#1D6AE5] transition-colors shadow-lg shadow-[#2B7FFF]/25 flex items-center justify-center gap-2"
              >
                결제하기 →
              </button>
            </div>

            <p className="text-[11px] text-[#94A3B8] mt-4">🔒 256-bit SSL 암호화 보안</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE WRAPPER
══════════════════════════════════════════ */
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
