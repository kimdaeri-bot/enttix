import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ref, basketId, eventId, eventName, venue,
      performanceDate, seats, total, currency,
      firstName, lastName, email,
    } = body;

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        order_number: ref,
        customer_name: `${firstName} ${lastName}`,
        customer_email: email,
        event_id: eventId || null,
        event_name: eventName,
        event_date: performanceDate || null,
        venue: venue || null,
        total_price: total,
        currency: currency || 'GBP',
        status: 'pending_payment',
        payment_method: 'ltd',
        notes: JSON.stringify({ basketId, seats }),
        api_source: 'enttix_ltd',
      }])
      .select()
      .single();

    if (error) {
      console.error('[orders/POST] Supabase error:', error);
      return NextResponse.json({ ok: false, error: error.message });
    }
    return NextResponse.json({ ok: true, order: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref');
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 });

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', ref)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json({ order: data });
}
