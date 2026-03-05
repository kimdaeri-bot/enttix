// Supabase Keep-Alive — Vercel Cron이 주기적으로 호출
// GET /api/health
import { NextResponse } from 'next/server';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  const ts = new Date().toISOString();
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/tiqets_images?select=product_id&limit=1`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
      cache: 'no-store',
    });
    return NextResponse.json({ ok: r.ok, ts, status: r.status });
  } catch (e) {
    return NextResponse.json({ ok: false, ts, error: String(e) }, { status: 500 });
  }
}
