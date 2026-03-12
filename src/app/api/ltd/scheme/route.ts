import { NextRequest, NextResponse } from 'next/server';

const AFFILIATE_ID = process.env.LTD_AFFILIATE_ID || '775854e9-b102-48d9-99bc-4b288a67b538';

/**
 * GET /api/ltd/scheme?locale=en-GB&performanceId=730858&clientId=...
 * spdp.londontheatredirect.com/GetSeatingPlanScheme.ashx 프록시
 * 풀네임 파라미터(locale=, performanceId=, clientId=)로 요청해야 200 반환됨
 * shorthand(l=, p=, a=)는 403 반환 — 이 프록시가 변환 역할 수행
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  // controller.js가 보내는 파라미터 (locale, performanceId, clientId)
  const locale = searchParams.get('locale') || searchParams.get('l') || 'en-GB';
  const performanceId = searchParams.get('performanceId') || searchParams.get('p');
  const clientId = searchParams.get('clientId') || searchParams.get('a') || AFFILIATE_ID;

  if (!performanceId) {
    return NextResponse.json({ error: 'performanceId required' }, { status: 400 });
  }

  const url = `https://spdp.londontheatredirect.com/GetSeatingPlanScheme.ashx?locale=${locale}&performanceId=${performanceId}&clientId=${clientId}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, */*',
      },
      next: { revalidate: 3600 }, // 1시간 캐시
    });

    if (!res.ok) {
      return NextResponse.json({ error: `spdp responded ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
