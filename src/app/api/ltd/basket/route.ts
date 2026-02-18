// LTD Booking API - 3-step flow:
// 1. POST /api/ltd/basket?action=create           → create basket, return BasketId
// 2. POST /api/ltd/basket?action=add-tickets      → add tickets to basket
// 3. POST /api/ltd/basket?action=submit           → submit order, return payment URL
// GET /api/ltd/basket?basketId={id}               → get basket info (MinExpirationDate)

import { NextRequest, NextResponse } from 'next/server';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;
const headers = { 'Api-Key': LTD_API_KEY, 'Content-Type': 'application/json' };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const basketId = searchParams.get('basketId');
  if (!basketId) return NextResponse.json({ error: 'basketId required' }, { status: 400 });

  const res = await fetch(`${LTD_BASE_URL}/Baskets/${basketId}`, { headers: { 'Api-Key': LTD_API_KEY } });
  const data = await res.json();
  return NextResponse.json({
    basketId: data.BasketId,
    expirationDate: data.MinExpirationDate,
    items: data.Items || [],
  });
}

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
      const { basketId, affiliateId, leadCustomer, successUrl, failureUrl } = await req.json();

      const submitBody: Record<string, unknown> = {
        AffiliateId: affiliateId || '775854e9-b102-48d9-99bc-4b288a67b538',
        SuccessReturnUrl: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://enttix-omega.vercel.app'}/musical/payment/success`,
        FailureReturnUrl: failureUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://enttix-omega.vercel.app'}/musical/payment/fail`,
      };

      if (leadCustomer) {
        submitBody.Name = `${leadCustomer.firstName} ${leadCustomer.lastName}`;
        submitBody.FirstName = leadCustomer.firstName;
        submitBody.LastName = leadCustomer.lastName;
        submitBody.Email = leadCustomer.email;
        submitBody.Phone = leadCustomer.phone;
      }

      const res = await fetch(`${LTD_BASE_URL}/Baskets/${basketId}/SubmitOrder`, {
        method: 'POST',
        headers,
        body: JSON.stringify(submitBody),
      });
      const data = await res.json();
      const paymentUrl = data.PaymentUrl || data.Url || data.url;
      if (!paymentUrl) {
        return NextResponse.json({
          error: data.MessageDetail || data.Message || 'Payment redirect failed',
          raw: data,
        }, { status: 500 });
      }
      return NextResponse.json({ paymentUrl });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
