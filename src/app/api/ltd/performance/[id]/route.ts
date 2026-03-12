import { NextRequest, NextResponse } from 'next/server';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

/**
 * GET /api/ltd/performance/[id]
 * performanceId → EventId, EventName, VenueName, PerformanceDate 반환
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`${LTD_BASE_URL}/Performances/${id}`, {
      headers: { 'Api-Key': LTD_API_KEY, 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json({ error: 'Performance not found' }, { status: 404 });
    const data = await res.json();
    const perf = data.Performance || data;
    return NextResponse.json({
      performanceId: perf.PerformanceId,
      eventId: perf.EventId,
      eventName: perf.EventName,
      venueName: perf.VenueName || perf.Venue?.Name,
      performanceDate: perf.PerformanceDate,
      minPrice: perf.MinimumTicketPrice || perf.TicketPrice || 0,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
