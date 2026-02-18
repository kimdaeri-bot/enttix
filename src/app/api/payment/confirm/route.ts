// 토스페이먼츠 결제 승인 API
// POST /api/payment/confirm

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }

    // 토스페이먼츠 결제 승인 요청
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error('Toss payment confirm failed:', tossData);
      return NextResponse.json(
        { error: tossData.message || '결제 승인 실패', code: tossData.code },
        { status: tossRes.status }
      );
    }

    // DB에 주문 저장 (Supabase)
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await supabase.from('orders').insert({
        order_id: orderId,
        payment_key: paymentKey,
        amount: tossData.totalAmount,
        method: tossData.method,
        status: 'paid',
        api_source: 'toss',
        customer_name: tossData.customerName || '',
        customer_email: tossData.customerEmail || '',
        raw_response: tossData,
      });
    } catch (dbErr) {
      console.error('DB save failed:', dbErr);
    }

    // 이메일 알림 발송 (비동기, 실패해도 결제는 성공)
    if (tossData.customerEmail) {
      const baseUrl = req.headers.get('origin') || 'https://enttix-omega.vercel.app';
      fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order_confirm',
          to: tossData.customerEmail,
          customerName: tossData.customerName || '고객',
          orderId,
          orderName: tossData.orderName || '티켓 구매',
          amount: tossData.totalAmount,
          method: tossData.method,
          approvedAt: tossData.approvedAt,
        }),
      }).catch(e => console.error('Email send failed:', e));
    }

    return NextResponse.json({
      success: true,
      paymentKey,
      orderId,
      amount: tossData.totalAmount,
      method: tossData.method,
      approvedAt: tossData.approvedAt,
    });
  } catch (e) {
    console.error('Payment confirm error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
