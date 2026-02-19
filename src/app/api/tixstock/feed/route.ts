import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.TIXSTOCK_BASE_URL!;
const TOKEN = process.env.TIXSTOCK_TOKEN!;
const INTERNAL_URL = 'https://sandbox-internal-2.tixstock.com/v1';
const RESELLER_TOKEN = process.env.TIXSTOCK_RESELLER_TOKEN!;

// Diplat Co가 직접 올린 featured 이벤트 ID 목록 (내부 API에서 확인)
const FEATURED_EVENT_IDS = [
  '01kdmq9xzg3fpwa884q65vpcrs', // Manchester City FC vs Newcastle United FC (Feb 21)
];

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.toString();
    const params = req.nextUrl.searchParams;

    // 특정 event_id 조회 시 — 일반 API로 처리
    const eventId = params.get('event_id');

    // 일반 API 호출
    const res = await fetch(`${BASE_URL}/feed?${query}`, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json({ error: `Feed error: ${res.status}` }, { status: res.status });
    const data = await res.json();

    // event_id 직접 조회면 그냥 반환
    if (eventId) return NextResponse.json(data);

    // 일반 피드 조회 시 — featured 이벤트(Diplat Co 리스팅) 앞에 추가
    const existingIds = new Set((data.data || []).map((e: { id: string }) => e.id));
    const featuredEvents: unknown[] = [];

    for (const fid of FEATURED_EVENT_IDS) {
      if (!existingIds.has(fid) && RESELLER_TOKEN) {
        try {
          const fr = await fetch(`${INTERNAL_URL}/feed?event_id=${fid}`, {
            headers: { Authorization: `Bearer ${RESELLER_TOKEN}`, 'Content-Type': 'application/json' },
            next: { revalidate: 300 },
          });
          if (fr.ok) {
            const fd = await fr.json();
            if (fd.data?.length > 0) featuredEvents.push(...fd.data);
          }
        } catch { /* ignore */ }
      }
    }

    return NextResponse.json({
      ...data,
      data: [...featuredEvents, ...(data.data || [])],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
