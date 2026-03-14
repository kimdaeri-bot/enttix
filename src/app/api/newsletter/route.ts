// 크루즈링크 뉴스레터 구독 API
// POST /api/newsletter
// - 관리자(info@cruiselink.co.kr)에게 구독자 정보 이메일 발송
// - 구독자에게 환영 이메일 발송

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_test_placeholder');
const ADMIN_EMAIL = 'info@cruiselink.co.kr';
const FROM_EMAIL = '크루즈링크 <newsletter@cruiselink.co.kr>';
const FROM_NOREPLY = '크루즈링크 <noreply@cruiselink.co.kr>';

// CORS 허용 (cruiselink.co.kr → enttix-omega.vercel.app)
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, interests, marketing } = body as {
      name: string;
      email: string;
      phone?: string;
      interests?: string[];
      marketing?: boolean;
    };

    if (!name || !email) {
      return NextResponse.json({ error: '이름과 이메일은 필수입니다.' }, { status: 400, headers: CORS });
    }

    const interestText = interests?.length ? interests.join(', ') : '선택 없음';
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    // ── 1. 관리자 알림 이메일 ──
    await resend.emails.send({
      from: FROM_NOREPLY,
      to: ADMIN_EMAIL,
      subject: `[크루즈링크] 뉴스레터 구독 신청 — ${name} (${email})`,
      html: `
        <div style="font-family:'Apple SD Gothic Neo',Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px">
          <div style="background:linear-gradient(135deg,#ff6f00,#ff8f00);padding:20px 24px;border-radius:10px;margin-bottom:20px">
            <h2 style="color:#fff;margin:0;font-size:1.1rem">📬 새 뉴스레터 구독 신청</h2>
            <p style="color:rgba(255,255,255,.8);margin:4px 0 0;font-size:0.82rem">${now}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
            <tr style="background:#fff7ed">
              <td style="padding:10px 16px;font-size:0.82rem;font-weight:700;color:#92400e;width:120px">성함</td>
              <td style="padding:10px 16px;font-size:0.88rem;color:#111;border-bottom:1px solid #f1f5f9">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:0.82rem;font-weight:700;color:#92400e;background:#fff7ed">이메일</td>
              <td style="padding:10px 16px;font-size:0.88rem;color:#2563eb;border-bottom:1px solid #f1f5f9"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:0.82rem;font-weight:700;color:#92400e;background:#fff7ed">연락처</td>
              <td style="padding:10px 16px;font-size:0.88rem;color:#111;border-bottom:1px solid #f1f5f9">${phone || '미입력'}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:0.82rem;font-weight:700;color:#92400e;background:#fff7ed">관심 노선</td>
              <td style="padding:10px 16px;font-size:0.88rem;color:#111;border-bottom:1px solid #f1f5f9">${interestText}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:0.82rem;font-weight:700;color:#92400e;background:#fff7ed">마케팅 동의</td>
              <td style="padding:10px 16px;font-size:0.88rem;color:#111">${marketing ? '✅ 동의' : '❌ 미동의'}</td>
            </tr>
          </table>
          <p style="font-size:0.76rem;color:#9ca3af;margin-top:16px;text-align:center">크루즈링크 뉴스레터 구독 시스템 · 자동 발송</p>
        </div>
      `,
    });

    // ── 2. 구독자 환영 이메일 ──
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '크루즈링크 뉴스레터 구독을 환영합니다 🚢',
      html: `
        <div style="font-family:'Apple SD Gothic Neo',Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px">
          <div style="background:linear-gradient(135deg,#0a1628,#0d3b6e);padding:32px 24px;border-radius:10px;text-align:center;margin-bottom:24px">
            <div style="font-size:2.5rem;margin-bottom:12px">🚢</div>
            <h1 style="color:#fff;font-size:1.3rem;margin:0 0 8px">크루즈링크 뉴스레터</h1>
            <p style="color:rgba(255,255,255,.75);font-size:0.88rem;margin:0">구독해 주셔서 감사합니다, ${name}님!</p>
          </div>

          <div style="background:#fff;border-radius:10px;padding:24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.08)">
            <p style="color:#374151;font-size:0.92rem;line-height:1.7;margin:0 0 16px">
              안녕하세요, <strong>${name}</strong>님!<br>
              크루즈링크 뉴스레터 구독을 완료해 주셨습니다. 감사합니다 🙇
            </p>
            <p style="color:#374151;font-size:0.88rem;line-height:1.7;margin:0">
              앞으로 관심 노선(<strong>${interestText}</strong>)의 특가 정보, 신상품 소식, 시즌 프로모션을 가장 먼저 보내드리겠습니다.
            </p>
          </div>

          <div style="background:#fff8e1;border-left:4px solid #ff6f00;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:20px">
            <p style="color:#92400e;font-size:0.85rem;margin:0;font-weight:700">📞 크루즈 상담이 필요하신가요?</p>
            <p style="color:#78350f;font-size:0.82rem;margin:6px 0 0;line-height:1.6">
              전화: 02-3788-9119<br>
              카카오톡: <a href="https://pf.kakao.com/_xgYbJG" style="color:#ff6f00">크루즈링크 채널</a>
            </p>
          </div>

          <div style="text-align:center">
            <a href="https://www.cruiselink.co.kr" style="display:inline-block;background:linear-gradient(135deg,#ff6f00,#ff8f00);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.9rem">
              크루즈링크 상품 보러가기 →
            </a>
          </div>

          <p style="font-size:0.72rem;color:#9ca3af;margin-top:20px;text-align:center;line-height:1.6">
            본 메일은 크루즈링크 뉴스레터 구독 신청 후 자동 발송됩니다.<br>
            구독 해지: <a href="mailto:info@cruiselink.co.kr?subject=뉴스레터 구독 해지" style="color:#9ca3af">info@cruiselink.co.kr</a>로 해지 요청
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (err) {
    console.error('[newsletter] error:', err);
    return NextResponse.json({ error: 'server error' }, { status: 500, headers: CORS });
  }
}
