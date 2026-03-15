'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface OrderData {
  order_number: string;
  event_name: string;
  venue: string;
  event_date: string;
  notes: string;
  total_price: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
}

interface TicketData {
  printAtHome: null | { Url?: string; TicketUrl?: string; PdfUrl?: string; Tickets?: { Url?: string; TicketUrl?: string; Barcode?: string; QrCode?: string }[] };
  etickets: null | { Url?: string; Tickets?: { Url?: string; Barcode?: string; QrCode?: string }[] };
  debug?: { pahRaw?: { status: number; body?: string }; etixRaw?: { status: number; body?: string } };
}

function SuccessContent() {
  const params = useSearchParams();
  const ref = params.get('ref') || '';
  const basketId = params.get('basketId') || '';

  const [order, setOrder] = useState<OrderData | null>(null);
  const [tickets, setTickets] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetches: Promise<void>[] = [];

    if (ref) {
      fetches.push(
        fetch(`/api/orders?ref=${ref}`)
          .then(r => r.json())
          .then(d => { if (d.order) setOrder(d.order); })
          .catch(() => {})
      );
    }

    if (basketId) {
      fetches.push(
        fetch(`/api/ltd/tickets?basketId=${encodeURIComponent(basketId)}`)
          .then(r => r.json())
          .then(d => setTickets(d))
          .catch(() => {})
      );
    }

    Promise.allSettled(fetches).finally(() => setLoading(false));
  }, [ref, basketId]);

  const seats: { tid: number; label: string; price: number }[] = (() => {
    if (!order?.notes) return [];
    try {
      const n = JSON.parse(order.notes);
      return Array.isArray(n.seats) ? n.seats : [];
    } catch { return []; }
  })();

  // LTD 티켓 URL 추출
  const ticketPdfUrl = (() => {
    if (!tickets) return null;
    if (tickets.printAtHome) {
      const p = tickets.printAtHome;
      const url = p.Url || p.TicketUrl || p.PdfUrl || p.Tickets?.[0]?.Url || p.Tickets?.[0]?.TicketUrl;
      if (url) return { type: 'pdf', url };
    }
    if (tickets.etickets) {
      const e = tickets.etickets;
      const url = e.Url || e.Tickets?.[0]?.Url;
      if (url) return { type: 'eticket', url };
    }
    return null;
  })();

  const ticketQrCode = (() => {
    if (!tickets) return null;
    const t = tickets.printAtHome?.Tickets?.[0] || tickets.etickets?.Tickets?.[0];
    return t?.QrCode || t?.Barcode || null;
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
      const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`enttix-confirmation-${ref}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
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
          <p className="text-[#64748B] text-[15px]">결제가 완료됐습니다.</p>
        </div>

        {/* LTD 실제 티켓 섹션 (있을 때만) */}
        {ticketPdfUrl && (
          <div className="bg-[#ECFDF5] border border-[#6EE7B7] rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🎟️</span>
              <div>
                <p className="font-bold text-[#065F46] text-[15px]">티켓 준비 완료!</p>
                <p className="text-[#047857] text-[12px]">London Theatre Direct에서 발급된 공식 티켓입니다</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={ticketPdfUrl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-xl font-bold text-[14px] hover:bg-[#059669] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {ticketPdfUrl.type === 'pdf' ? 'Download Ticket PDF' : 'View E-Ticket'}
              </a>
            </div>
            {/* QR 코드 (LTD 제공 시) */}
            {ticketQrCode && (
              <div className="mt-4 flex justify-center">
                <div className="bg-white p-3 rounded-xl border border-[#6EE7B7]">
                  <img src={ticketQrCode} alt="Ticket QR Code" className="w-[140px] h-[140px]" />
                  <p className="text-[10px] text-center text-[#047857] mt-1">입장 QR 코드</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 주문 확인 카드 */}
        <div ref={ticketRef} className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden mb-6">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest mb-1">enttix</p>
                <h2 className="text-white text-[20px] font-extrabold leading-tight">
                  {order?.event_name || 'West End Show'}
                </h2>
                {order?.venue && (
                  <p className="text-[#94A3B8] text-[12px] mt-1">📍 {order.venue}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide mb-1">Order Ref</p>
                <p className="text-white font-mono font-bold text-[12px] bg-white/10 px-2 py-1 rounded">{ref || order?.order_number}</p>
              </div>
            </div>
          </div>

          {/* 점선 */}
          <div className="flex items-center px-0">
            <div className="w-5 h-5 rounded-full bg-[#F5F7FA] -ml-2.5 flex-shrink-0 border border-[#E2E8F0]" />
            <div className="flex-1 border-t-2 border-dashed border-[#E2E8F0]" />
            <div className="w-5 h-5 rounded-full bg-[#F5F7FA] -mr-2.5 flex-shrink-0 border border-[#E2E8F0]" />
          </div>

          {/* 내용 */}
          <div className="px-6 py-5 space-y-4">
            {order?.event_date && (
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide mb-1">Date & Time</p>
                  <p className="text-[#0F172A] font-semibold text-[14px]">{formatDate(order.event_date)}</p>
                  <p className="text-[#374151] text-[13px]">{formatTime(order.event_date)}</p>
                </div>
              </div>
            )}

            {seats.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide mb-1">Seats</p>
                <div className="flex flex-wrap gap-1">
                  {seats.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#F1F5F9] rounded text-[12px] font-mono text-[#374151] border border-[#E2E8F0]">
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {order && (
              <div className="flex justify-between items-center pt-2 border-t border-[#F1F5F9]">
                <div>
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide mb-1">Booking Name</p>
                  <p className="text-[#374151] text-[13px]">{order.customer_name}</p>
                  <p className="text-[#94A3B8] text-[12px]">{order.customer_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide mb-1">Total</p>
                  <p className="text-[#0F172A] font-extrabold text-[20px]">£{order.total_price.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          {/* 이메일 안내 */}
          <div className="mx-5 mb-5 px-4 py-3 bg-[#FEF3C7] rounded-xl border border-[#FDE68A] flex items-start gap-2">
            <span className="text-[15px] flex-shrink-0 mt-0.5">📧</span>
            <p className="text-[12px] text-[#92400E] leading-relaxed">
              <span className="font-bold">실제 입장 티켓은 이메일로 발송됩니다.</span><br/>
              {order?.customer_email || '입력하신 이메일'}로 전송된 London Theatre Direct 메일을 확인해 주세요.
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
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Save Confirmation PDF</>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#0F172A] border-2 border-[#E2E8F0] rounded-xl font-bold text-[14px] hover:border-[#2B7FFF] hover:text-[#2B7FFF] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
        </div>

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
