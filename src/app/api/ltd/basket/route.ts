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

  // Parse MinExpirationDate — LTD may return .NET format "/Date(1234567890000)/"
  let expirationIso: string | null = null;
  const raw = data.MinExpirationDate;
  if (raw) {
    const dotnetMatch = typeof raw === 'string' && raw.match(/\/Date\((\d+)\)\//);
    if (dotnetMatch) {
      expirationIso = new Date(Number(dotnetMatch[1])).toISOString();
    } else {
      const d = new Date(raw);
      expirationIso = isNaN(d.getTime()) ? null : d.toISOString();
    }
  }

  return NextResponse.json({
    basketId: data.BasketId,
    expirationDate: expirationIso,
    items: data.Items || [],
  });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'create') {
      // Step 1: Create basket (body: '{}' required — LTD API returns 411 without Content-Length)
      const res = await fetch(`${LTD_BASE_URL}/Baskets`, { method: 'POST', headers, body: '{}' });
      const data = await res.json();
      if (!data.Success) return NextResponse.json({ error: 'Failed to create basket' }, { status: 500 });
      return NextResponse.json({ basketId: data.BasketId });
    }

    if (action === 'add-tickets') {
      const body = await req.json();

      // 방법 A: 특정 TicketId 배열 (Seating Plan 직접 선택)
      if (body.tickets && Array.isArray(body.tickets) && body.tickets.length > 0) {
        const ltdBody = { Tickets: body.tickets };
        console.log('[LTD basket add-tickets] URL:', `${LTD_BASE_URL}/Baskets/${body.basketId}/Tickets`);
        console.log('[LTD basket add-tickets] Request body:', JSON.stringify(ltdBody));
        const res = await fetch(`${LTD_BASE_URL}/Baskets/${body.basketId}/Tickets`, {
          method: 'POST',
          headers,
          body: JSON.stringify(ltdBody),
        });
        const data = await res.json();
        console.log('[LTD basket add-tickets] Response:', JSON.stringify(data));
        if (data.Message && !data.Success) {
          return NextResponse.json({ error: data.MessageDetail || data.Message, raw: data }, { status: 502 });
        }
        if (!data.Success) {
          const reason = data.FailureReason || 0;
          const msg = reason === 1 ? '선택한 좌석이 매진되었습니다.' :
                      reason === 2 ? '한 자리 남은 좌석 선택은 불가합니다.' :
                      '티켓 추가에 실패했습니다. 다시 시도해주세요.';
          return NextResponse.json({ error: msg, reason, raw: data }, { status: 409 });
        }
        return NextResponse.json({ success: true, basket: data.GetBasketContentResult });
      }

      // 방법 B: BestSeats (구역 선택 fallback)
      const { basketId, performanceId, areaId, seatsCount, price } = body;
      const bestSeats: Record<string, unknown> = {
        PerformanceId: performanceId,
        SeatsCount: seatsCount,
        Price: price,
      };
      if (areaId && areaId !== 0) bestSeats.AreaId = areaId;

      const res = await fetch(`${LTD_BASE_URL}/Baskets/${basketId}/Tickets`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ BestSeats: bestSeats }),
      });

      const data = await res.json();

      // LTD API error (e.g. "An error has occurred" with Message/ErrorCode structure)
      if (data.Message && !data.Success) {
        const errMsg = data.MessageDetail || data.Message || '티켓 추가에 실패했습니다.';
        return NextResponse.json({ error: errMsg, raw: data }, { status: 502 });
      }

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

      if (!leadCustomer?.firstName || !leadCustomer?.lastName || !leadCustomer?.email) {
        return NextResponse.json({ error: 'Customer name and email are required' }, { status: 400 });
      }

      // Fetch available delivery types for this basket
      let deliveryType = 0;
      try {
        const delRes = await fetch(`${LTD_BASE_URL}/Baskets/${basketId}/AvailableDeliveries`, {
          headers: { 'Api-Key': LTD_API_KEY },
        });
        const deliveries = await delRes.json();
        console.log('[LTD AvailableDeliveries]', JSON.stringify(deliveries));
        // Try to extract from array or object — field name varies
        const list = Array.isArray(deliveries) ? deliveries : deliveries?.DeliveryTypes || deliveries?.Deliveries || deliveries?.Items || [];
        if (Array.isArray(list) && list.length > 0) {
          const first = list[0];
          deliveryType = first.DeliveryTypeId ?? first.Id ?? first.DeliveryId ?? first.DeliveryType ?? first.id ?? first.Type ?? 0;
        }
      } catch (err) { console.log('[LTD AvailableDeliveries error]', err); }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enttix-omega.vercel.app';
      const submitBody: Record<string, unknown> = {
        AffiliateId: affiliateId || '775854e9-b102-48d9-99bc-4b288a67b538',
        SuccessReturnUrl: successUrl || `${siteUrl}/musical/payment/success`,
        FailureReturnUrl: failureUrl || `${siteUrl}/musical/payment/fail`,
        Name: leadCustomer.firstName,
        LastName: leadCustomer.lastName,
        Email: leadCustomer.email,
      };
      if (deliveryType > 0) {
        submitBody.DeliveryTypeId = deliveryType;
      }

      if (leadCustomer.phone) {
        submitBody.Phone = leadCustomer.phone;
      }

      const res = await fetch(`${LTD_BASE_URL}/Baskets/${basketId}/SubmitOrder`, {
        method: 'POST',
        headers,
        body: JSON.stringify(submitBody),
      });
      const data = await res.json();
      console.log('[LTD SubmitOrder] Request:', JSON.stringify(submitBody));
      console.log('[LTD SubmitOrder] Response:', JSON.stringify(data));
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
