import { NextRequest, NextResponse } from 'next/server';

const TIQETS_TOKEN = process.env.TIQETS_TOKEN!;
const BASE_URL = 'https://api.tiqets.com/v2';

// 5분 캐시
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_MS = 5 * 60 * 1000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cacheKey = `avail_${id}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    const res = await fetch(`${BASE_URL}/products/${id}/availability`, {
      headers: {
        Authorization: `Token ${TIQETS_TOKEN}`,
        'User-Agent': 'Enttix',
        Accept: 'application/json',
      },
    });
    const raw = await res.json();
    // 날짜별 맵으로 변환: { "2026-03-05": { availability: 40, timeslots: ["19:00", "19:30"] } }
    const dateMap: Record<string, { availability: number; timeslots: string[] }> = {};
    for (const d of raw.dates ?? []) {
      dateMap[d.date] = {
        availability: d.availability ?? 0,
        timeslots: (d.timeslots ?? []).map((s: { time: string }) => s.time),
      };
    }
    const result = { dateMap };
    cache.set(cacheKey, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ dateMap: {} });
  }
}
