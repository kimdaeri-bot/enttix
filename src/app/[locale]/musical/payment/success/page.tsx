'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { QRCodeSVG } from 'qrcode.react';

interface OrderData {
  order_number: string;
  event_name: string;
  venue: string;
  event_date: string;
  notes: string; // JSON: { basketId, seats }
  total_price: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
}

function SuccessContent() {
  const params = useSearchParams();
  const ref = params.get('ref') || '';
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref) { setLoading(false); return; }
    fetch(`/api/orders?ref=${ref}`)
      .then(r => r.json())
      .then(d => { if (d.order) setOrder(d.order); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ref]);

  const seats: { tid: number; label: string; price: number }[] = (() => {
    if (!order?.notes) return [];
    try {
      const n = JSON.parse(order.notes);
      return Array.isArray(n.seats) ? n.seats : [];
    } catch { return []; }
  })();

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };
  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const h = d.getHours(), m = d.getMinutes();
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const handleSavePDF = async () => {
    if (!ticketRef.current) return;
    setSaving(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`enttix-ticket-${ref}.pdf`);
    } catch (e) {
      console.error('PDF save error:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="bg-[#0F172A]"><Header hideSearch /></div>
        <div className="flex items-center justify-center py-40">
          <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>

      <div className="max-w-[640px] mx-auto px-4 py-10">
        {/* 성공 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-[28px] font-extrabold text-[#0F172A] mb-2">Booking Confirmed!</h1>
          <p className="text-[#64748B] text-[15px]">
            결제가 완료됐습니다. 확인 이메일이 곧 발송됩니다.
          </p>
        </div>

        {/* 티켓 카드 (PDF 저장 대상) */}
        <div
          ref={ticketRef}
          className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden mb-6"
        >
          {/* 티켓 헤더 */}
          <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest mb-1">enttix</p>
                <h2 className="text-white text-[22px] font-extrabold leading-tight">
                  {order?.event_name || 'West End Show'}
                </h2>
                {order?.venue && (
                  <p className="text-[#94A3B8] text-[13px] mt-1 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#94A3B8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    {order.venue}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">Ref</p>
                <p className="text-white font-mono font-bold text-[13px]">{ref || order?.order_number}</p>
              </div>
            </div>
          </div>

          {/* 점선 구분 */}
          <div className="flex items-center px-6 py-0">
            <div className="w-5 h-5 rounded-full bg-[#F5F7FA] -ml-8 flex-shrink-0 border border-[#E2E8F0]" />
            <div className="flex-1 border-t-2 border-dashed border-[#E2E8F0] mx-2" />
            <div className="w-5 h-5 rounded-full bg-[#F5F7FA] -mr-8 flex-shrink-0 border border-[#E2E8F0]" />
          </div>

          {/* 공연 정보 + QR */}
          <div className="px-6 py-5 flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* 날짜/시간 */}
              {order?.event_date && (
                <div>
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">Date & Time</p>
                  <p className="text-[#0F172A] font-semibold text-[14px]">{formatDate(order.event_date)}</p>
                  <p className="text-[#374151] text-[13px]">{formatTime(order.event_date)}</p>
                </div>
              )}
              {/* 좌석 */}
              {seats.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">Seats</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {seats.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#F1F5F9] rounded text-[12px] font-mono text-[#374151] border border-[#E2E8F0]">
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* 고객 */}
              {order && (
                <div>
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">Booking Name</p>
                  <p className="text-[#374151] text-[13px]">{order.customer_name}</p>
                  <p className="text-[#94A3B8] text-[12px]">{order.customer_email}</p>
                </div>
              )}
              {/* 금액 */}
              {order && (
                <div>
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">Total Paid</p>
                  <p className="text-[#0F172A] font-extrabold text-[18px]">
                    £{order.total_price.toFixed(2)}
                    <span className="text-[12px] font-normal text-[#94A3B8] ml-1">GBP</span>
                  </p>
                </div>
              )}
            </div>

            {/* QR 코드 */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="p-2 bg-white border-2 border-[#E2E8F0] rounded-xl">
                <QRCodeSVG
                  value={`https://enttix-omega.vercel.app/order/${ref || order?.order_number}`}
                  size={110}
                  bgColor="#ffffff"
                  fgColor="#0F172A"
                  level="M"
                />
              </div>
              <p className="text-[10px] text-[#94A3B8] text-center">Booking Reference<br/>QR Code</p>
            </div>
          </div>

          {/* 안내 배너 */}
          <div className="mx-6 mb-5 px-4 py-3 bg-[#FEF3C7] rounded-xl border border-[#FDE68A] flex items-start gap-2">
            <span className="text-[16px] flex-shrink-0">📧</span>
            <p className="text-[12px] text-[#92400E] leading-relaxed">
              <span className="font-bold">실제 입장 티켓(e-ticket)은 이메일로 발송됩니다.</span><br/>
              London Theatre Direct에서 {order?.customer_email || '입력하신 이메일'}로 전송된 이메일을 확인하세요.
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button
            onClick={handleSavePDF}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0F172A] text-white rounded-xl font-bold text-[14px] hover:bg-[#1E293B] transition-colors disabled:opacity-60"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
            ) : (
              <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Save as PDF</>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#0F172A] border-2 border-[#E2E8F0] rounded-xl font-bold text-[14px] hover:border-[#2B7FFF] hover:text-[#2B7FFF] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print Ticket
          </button>
        </div>

        {/* 하단 링크 */}
        <div className="text-center">
          <Link href="/ko/musical/west-end" className="inline-flex items-center gap-1 text-[#2B7FFF] font-semibold text-[14px] hover:underline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Browse More Shows
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
