// 이메일 발송 API (Resend)
// 실서비스 전환 시 RESEND_API_KEY 환경변수 설정 필요
// 무료 플랜: 100 emails/day, resend.com

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_placeholder';
const FROM_EMAIL = 'Enttix <tickets@enttix.com>';

const resend = new Resend(RESEND_API_KEY);

// ── 주문 확인 이메일 HTML 템플릿 ──
function buildOrderConfirmHtml({
  customerName, orderId, orderName, amount, method, approvedAt, items,
}: {
  customerName: string;
  orderId: string;
  orderName: string;
  amount: number;
  method: string;
  approvedAt: string;
  items?: { name: string; section: string; qty: number; price: number }[];
}) {
  const dateStr = new Date(approvedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const itemRows = items?.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:13px;color:#374151">${item.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:13px;color:#374151;text-align:center">${item.section}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:13px;color:#374151;text-align:center">${item.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:13px;font-weight:700;color:#2B7FFF;text-align:right">₩${(item.price * item.qty * 1700).toLocaleString()}</td>
    </tr>
  `).join('') || '';

  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2B7FFF,#1D6AE5);padding:36px 32px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:-0.5px">enttix</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">결제가 완료되었습니다 ✓</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 20px;color:#0F172A;font-size:16px">안녕하세요, <strong>${customerName}</strong>님 👋</p>
      <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6">
        <strong>${orderName}</strong> 티켓 주문이 성공적으로 완료되었습니다.<br>
        티켓 정보는 이메일로 별도 발송될 예정입니다.
      </p>

      <!-- Order Summary -->
      <div style="background:#F8FAFC;border-radius:12px;padding:20px;margin-bottom:24px">
        <h3 style="margin:0 0 14px;color:#0F172A;font-size:14px;font-weight:700">주문 정보</h3>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="font-size:13px;color:#64748B;padding:4px 0">주문번호</td><td style="font-size:12px;font-family:monospace;color:#374151;text-align:right">${orderId}</td></tr>
          <tr><td style="font-size:13px;color:#64748B;padding:4px 0">결제수단</td><td style="font-size:13px;color:#374151;text-align:right">${method}</td></tr>
          <tr><td style="font-size:13px;color:#64748B;padding:4px 0">결제시각</td><td style="font-size:13px;color:#374151;text-align:right">${dateStr}</td></tr>
          <tr><td style="font-size:15px;font-weight:700;color:#0F172A;padding:10px 0 4px">합계</td><td style="font-size:20px;font-weight:900;color:#2B7FFF;text-align:right">₩${amount.toLocaleString()}</td></tr>
        </table>
      </div>

      ${itemRows ? `
      <!-- Items -->
      <h3 style="margin:0 0 10px;color:#0F172A;font-size:14px;font-weight:700">구매 티켓</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;margin-bottom:24px">
        <thead>
          <tr style="background:#F1F5F9">
            <th style="padding:10px 12px;font-size:11px;color:#64748B;text-align:left;font-weight:600">이벤트</th>
            <th style="padding:10px 12px;font-size:11px;color:#64748B;text-align:center;font-weight:600">좌석</th>
            <th style="padding:10px 12px;font-size:11px;color:#64748B;text-align:center;font-weight:600">수량</th>
            <th style="padding:10px 12px;font-size:11px;color:#64748B;text-align:right;font-weight:600">금액</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      ` : ''}

      <!-- Notice -->
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:14px 16px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#1E40AF;line-height:1.6">
          📧 전자티켓은 입력하신 이메일로 발송됩니다.<br>
          문의: <a href="mailto:support@enttix.com" style="color:#2B7FFF">support@enttix.com</a>
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align:center">
        <a href="https://enttix-omega.vercel.app/mypage" style="display:inline-block;background:#2B7FFF;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 32px;border-radius:12px">
          내 주문 확인하기
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#F8FAFC;border-top:1px solid #E5E7EB;padding:20px 32px;text-align:center">
      <p style="margin:0;color:#94A3B8;font-size:11px">© 2026 Enttix. All rights reserved.</p>
      <p style="margin:4px 0 0;color:#94A3B8;font-size:11px">enttix-omega.vercel.app</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, ...data } = body;

    if (!to || !type) {
      return NextResponse.json({ error: 'to and type are required' }, { status: 400 });
    }

    if (type === 'order_confirm') {
      const html = buildOrderConfirmHtml(data);
      const { data: result, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject: `[Enttix] 주문 확인 - ${data.orderName || '티켓 구매'}`,
        html,
      });

      if (error) {
        console.error('Resend error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, id: result?.id });
    }

    return NextResponse.json({ error: 'Unknown email type' }, { status: 400 });
  } catch (e) {
    console.error('Email send error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
