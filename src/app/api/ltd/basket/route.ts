// LTD Booking API - 3-step flow:
// 1. POST /api/ltd/basket?action=create           → create basket, return BasketId
// 2. POST /api/ltd/basket?action=add-tickets      → add tickets to basket
// 3. POST /api/ltd/basket?action=submit           → submit order, return payment URL

import { NextRequest, NextResponse } from 'next/server';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;
const headers = { 'Api-Key': LTD_API_KEY, 'Content-Type': 'application/json' };

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'create') {
      // Step 1: Create basket
      const res = await fetch(`${LTD_BASE_URL}/Baskets`, { method: 'POST', headers });
      const data = await res.json();
      if (!data.Success) return NextResponse.json({ error: 'Failed to create basket' }, { status: 500 });
      return NextResponse.json({ basketId: data.BasketId });
    }

    if (action === 'add-tickets') {
      // Step 2: Add tickets via BestSeats (area + quantity auto-select)
      const { basketId, performanceId, areaId, seatsCount, price } = await req.json();
      const res = await fetch(`${LTD_BASE_URL}/Baskets/${basketId}/Tickets`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          BestSeats: { PerformanceId: performanceId, AreaId: areaId, SeatsCount: seatsCount, Price: price }
        }),
      });
      const data = await res.json();
      if (!data.Success) {
        const reason = data.FailureReason || 0;
        const msg = reason === 1 ? '선택한 좌석이 매진되었습니다.' :
                    reason === 2 ? '한 자리 남은 좌석 선택은 불가합니다.' :
                    '티켓 추가에 실패했습니다. 다시 시도해주세요.';
        return NextResponse.json({ error: msg, reason }, { status: 409 });
      }
      return NextResponse.json({ success: true, basket: data.GetBasketContentResult });
    }

    if (action === 'submit') {
      // Step 3: Submit order → get payment URL
      const { basketId, affiliateId, leadCustomer } = await req.json();
      const body: Record<string, unknown> = {};
      if (affiliateId) body.AffiliateId = affiliateId;
      if (leadCustomer) body.leadCustomer = leadCustomer;

      const res = await fetch(`${LTD_BASE_URL}/Baskets/${basketId}/SubmitOrder`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const paymentUrl = data.PaymentUrl || data.Url || data.url;
      if (!paymentUrl) return NextResponse.json({ error: 'No payment URL returned', raw: data }, { status: 500 });
      return NextResponse.json({ paymentUrl });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
