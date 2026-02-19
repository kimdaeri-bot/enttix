import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 스크린샷 기반 테스트 주문 데이터
const HISTORICAL_ORDERS = [
  {
    order_number: '8B214D85',
    customer_name: 'Test Buyer',
    customer_email: 'buyer@test.com',
    event_name: 'Manchester City FC vs Newcastle United FC',
    event_date: '2026-02-21T15:00:00+0000',
    venue: 'Etihad Stadium',
    city: 'Manchester',
    quantity: 1,
    unit_price: 150.53,
    total_price: 150.53,
    currency: 'USD',
    api_source: 'tixstock',
    status: 'confirmed',
    notes: JSON.stringify({
      order_id: '4b8fabb0-20260219-000002',
      ticket_details: 'Longside Middle Tier Central 104',
      ticket_type: 'eticket',
      order_datetime: '2026-02-19T01:12:40',
    }),
  },
  {
    order_number: '30B646F0',
    customer_name: 'Test Buyer',
    customer_email: 'buyer@test.com',
    event_name: 'Burnley FC vs Wolverhampton Wanderers FC',
    event_date: '2026-05-24T16:00:00+0000',
    venue: 'Turf Moor',
    city: 'Burnley',
    quantity: 1,
    unit_price: 1.00,
    total_price: 1.00,
    currency: 'GBP',
    api_source: 'tixstock',
    status: 'confirmed',
    notes: JSON.stringify({
      order_id: 'ENT-1771463218912',
      ticket_details: 'Longside Lower Tier',
      ticket_type: 'eticket',
      order_datetime: '2026-02-19T01:06:58',
    }),
  },
  {
    order_number: '4D691144',
    customer_name: 'Test Buyer',
    customer_email: 'buyer@test.com',
    event_name: 'Arsenal FC vs Chelsea FC',
    event_date: '2026-02-28T15:00:00+0000',
    venue: 'Emirates Stadium',
    city: 'London',
    quantity: 1,
    unit_price: 2.00,
    total_price: 2.00,
    currency: 'GBP',
    api_source: 'tixstock',
    status: 'confirmed',
    notes: JSON.stringify({
      order_id: 'ENT-1771463089690',
      ticket_details: 'Away Fan Section',
      ticket_type: 'mobile-link',
      order_datetime: '2026-02-19T01:04:49',
    }),
  },
  {
    order_number: '2A244D72',
    customer_name: 'Test Buyer',
    customer_email: 'buyer@test.com',
    event_name: 'Arsenal FC vs Chelsea FC',
    event_date: '2026-02-28T15:00:00+0000',
    venue: 'Emirates Stadium',
    city: 'London',
    quantity: 1,
    unit_price: 2.71,
    total_price: 2.71,
    currency: 'USD',
    api_source: 'tixstock',
    status: 'confirmed',
    notes: JSON.stringify({
      order_id: '4b8fabb0-20260219-000001',
      ticket_details: 'Away Fan Section',
      ticket_type: 'mobile-link',
      order_datetime: '2026-02-19T01:00:50',
    }),
  },
  {
    order_number: '3BFD37C9',
    customer_name: 'Test Buyer',
    customer_email: 'buyer@test.com',
    event_name: 'Arsenal FC vs Chelsea FC',
    event_date: '2026-02-28T15:00:00+0000',
    venue: 'Emirates Stadium',
    city: 'London',
    quantity: 2,
    unit_price: 2.00,
    total_price: 4.00,
    currency: 'GBP',
    api_source: 'tixstock',
    status: 'confirmed',
    notes: JSON.stringify({
      order_id: 'ENT-1771461757',
      ticket_details: 'Away Fan Section',
      ticket_type: 'mobile-link',
      order_datetime: '2026-02-19T00:42:37',
    }),
  },
];

export async function POST() {
  const results = [];
  for (const order of HISTORICAL_ORDERS) {
    // 이미 있으면 스킵
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', order.order_number)
      .single();
    if (existing) {
      results.push({ order_number: order.order_number, status: 'skipped (already exists)' });
      continue;
    }
    const { error } = await supabase.from('orders').insert(order);
    results.push({ order_number: order.order_number, status: error ? `error: ${error.message}` : 'inserted' });
  }
  return NextResponse.json({ results });
}
