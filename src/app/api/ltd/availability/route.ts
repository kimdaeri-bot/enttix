import { NextRequest, NextResponse } from 'next/server';

const AFFILIATE_ID = process.env.LTD_AFFILIATE_ID || '775854e9-b102-48d9-99bc-4b288a67b538';

/**
 * GET /api/ltd/availability?l=en-GB&p=736002&s=false
 * Proxies GetSeatingPlanAvailability.ashx to avoid CORS issues.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const locale = searchParams.get('l') || searchParams.get('locale') || 'en-GB';
  const performanceId = searchParams.get('p') || searchParams.get('performanceId');
  const simple = searchParams.get('s') || 'false';
  const clientId = searchParams.get('a') || searchParams.get('clientId') || AFFILIATE_ID;

  if (!performanceId) {
    return NextResponse.json({ error: 'performanceId required' }, { status: 400 });
  }

  const url = `https://spdp.londontheatredirect.com/GetSeatingPlanAvailability.ashx?_=${Date.now()}&l=${locale}&p=${performanceId}&s=${simple}&a=${clientId}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, */*',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `spdp responded ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
