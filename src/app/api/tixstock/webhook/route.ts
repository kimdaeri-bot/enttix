import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Supabase REST API - service_role key로 RLS bypass
async function supabaseAdmin(path: string, method: string, body?: object) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Log the raw payload for debugging
    console.log('[Tixstock Webhook] Received:', JSON.stringify(payload, null, 2));

    const type = payload.type || payload.event || payload.webhook_type || '';
    const data = payload.data || payload.order || payload;

    // Extract order reference from various possible fields
    const orderRef = (
      data?.order_id ||
      data?.order_reference ||
      data?.reference ||
      data?.id ||
      payload?.order_id ||
      payload?.reference ||
      ''
    ).toString().toUpperCase();

    console.log(`[Tixstock Webhook] type=${type} order=${orderRef}`);

    if (!orderRef) {
      console.warn('[Tixstock Webhook] No order reference found in payload');
      return NextResponse.json({ received: true, warning: 'no_order_ref' });
    }

    // Handle each webhook type
    if (type === 'order.eticket_fulfilment' || type === 'order.eticket_fulfillment') {
      // E-ticket delivered — extract ticket URL
      const ticketUrl = (
        data?.ticket_url ||
        data?.pdf_url ||
        data?.eticket_url ||
        data?.download_url ||
        data?.tickets?.[0]?.pdf_url ||
        data?.tickets?.[0]?.url ||
        data?.tickets?.[0]?.download_url ||
        null
      );

      const updateNotes = await buildUpdatedNotes(orderRef, { ticket_url: ticketUrl });
      await supabaseAdmin(
        `/orders?order_number=eq.${orderRef}`,
        'PATCH',
        { status: 'ticketed', notes: updateNotes }
      );
      console.log(`[Tixstock Webhook] eticket fulfilled: ${orderRef} url=${ticketUrl}`);
    }

    else if (type === 'order.mobile_link_ticket_fulfilment' || type === 'order.mobile_ticket_fulfilment') {
      // Mobile link ticket
      const ticketUrl = (
        data?.mobile_link ||
        data?.link ||
        data?.url ||
        data?.ticket_url ||
        data?.tickets?.[0]?.link ||
        data?.tickets?.[0]?.url ||
        null
      );

      const updateNotes = await buildUpdatedNotes(orderRef, { ticket_url: ticketUrl, ticket_type: 'mobile_link' });
      await supabaseAdmin(
        `/orders?order_number=eq.${orderRef}`,
        'PATCH',
        { status: 'ticketed', notes: updateNotes }
      );
      console.log(`[Tixstock Webhook] mobile link fulfilled: ${orderRef} url=${ticketUrl}`);
    }

    else if (type === 'ticket.fulfillment' || type === 'ticket.fulfilment') {
      // Ticket issued
      const ticketUrl = data?.ticket_url || data?.pdf_url || data?.url || null;
      const updateNotes = await buildUpdatedNotes(orderRef, { ticket_url: ticketUrl });
      await supabaseAdmin(
        `/orders?order_number=eq.${orderRef}`,
        'PATCH',
        { status: 'ticketed', notes: updateNotes }
      );
    }

    else if (type === 'order.update') {
      // Order status update
      const newStatus = data?.status || data?.order_status || '';
      const mappedStatus = mapTixstockStatus(newStatus);
      if (mappedStatus) {
        await supabaseAdmin(
          `/orders?order_number=eq.${orderRef}`,
          'PATCH',
          { status: mappedStatus }
        );
        console.log(`[Tixstock Webhook] order update: ${orderRef} → ${mappedStatus}`);
      }
    }

    else if (type === 'ticket.hold') {
      await supabaseAdmin(`/orders?order_number=eq.${orderRef}`, 'PATCH', { status: 'confirmed' });
    }

    else if (type === 'ticket.release') {
      await supabaseAdmin(`/orders?order_number=eq.${orderRef}`, 'PATCH', { status: 'cancelled' });
    }

    else {
      // Unknown type — just log
      console.log(`[Tixstock Webhook] Unhandled type: ${type}`);
    }

    return NextResponse.json({ received: true, type, order: orderRef });
  } catch (e) {
    console.error('[Tixstock Webhook] Error:', e);
    // Always return 200 so Tixstock doesn't keep retrying
    return NextResponse.json({ received: true, error: String(e) });
  }
}

function mapTixstockStatus(tixStatus: string): string | null {
  const s = (tixStatus || '').toLowerCase();
  if (s.includes('confirm') || s.includes('approved')) return 'confirmed';
  if (s.includes('fulfil') || s.includes('fulfill') || s.includes('ticket') || s.includes('issued')) return 'ticketed';
  if (s.includes('cancel') || s.includes('refund')) return 'cancelled';
  return null;
}

async function buildUpdatedNotes(orderRef: string, extraFields: Record<string, unknown>): Promise<string> {
  try {
    const rows = await supabaseAdmin(`/orders?order_number=eq.${orderRef}&select=notes`, 'GET');
    const existingNotes = (() => {
      try { return JSON.parse(rows?.[0]?.notes || '{}'); } catch { return {}; }
    })();
    return JSON.stringify({ ...existingNotes, ...extraFields });
  } catch {
    return JSON.stringify(extraFields);
  }
}
