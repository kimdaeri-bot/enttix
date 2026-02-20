import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.TICKETMASTER_API_KEY || '0HO8fB0w6EOt44tC4M4gHSFRkVTzFQ1D';
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

// tab → classificationName mapping
const TAB_MAP: Record<string, string> = {
  arts: 'Arts & Theatre',
  music: 'Music',
  sports: 'Sports',
};

// Sports 리그 → subGenreId mapping (Ticketmaster 공식 ID)
const LEAGUE_SUBGENRE: Record<string, string> = {
  mlb: 'KZazBEonSMnZfZ7vF1n',   // Baseball > MLB (8,096개)
  nba: 'KZazBEonSMnZfZ7vFJA',   // Basketball > NBA (1,959개)
  nhl: 'KZazBEonSMnZfZ7vFEE',   // Hockey > NHL (1,513개)
  mls: 'KZazBEonSMnZfZ7vFtI',   // Soccer > MLS (913개)
  nfl: 'KZazBEonSMnZfZ7vFEJ',   // Football > Professional/NFL (552개)
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tab = searchParams.get('tab') || 'arts';
  const league = searchParams.get('league') || '';   // sports 탭 전용
  const page = searchParams.get('page') || '0';
  const size = searchParams.get('size') || '20';
  const countryCode = searchParams.get('countryCode') || 'GB';

  const classificationName = TAB_MAP[tab] || 'Arts & Theatre';

  const params = new URLSearchParams({
    apikey: API_KEY,
    size,
    page,
    sort: 'date,asc',
    locale: '*',
  });

  // 국가 코드 (All = 전체)
  if (countryCode) params.set('countryCode', countryCode);

  // Sports 리그 필터: subGenreId 사용
  if (tab === 'sports' && league && LEAGUE_SUBGENRE[league]) {
    params.set('subGenreId', LEAGUE_SUBGENRE[league]);
  } else {
    params.set('classificationName', classificationName);
  }

  try {
    const res = await fetch(`${BASE_URL}?${params}`, {
      next: { revalidate: 300 }, // 5분 캐시
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Ticketmaster API error: ${res.status}`, detail: errText }, { status: res.status });
    }

    const data = await res.json();

    // 응답 정규화
    const events = (data?._embedded?.events || []).map((e: Record<string, unknown>) => {
      const embedded = (e._embedded as Record<string, unknown>) || {};
      const venues = (embedded.venues as Array<Record<string, unknown>>) || [];
      const venue = venues[0] || {};
      const city = (venue.city as Record<string, string>)?.name || '';
      const venueName = (venue.name as string) || '';
      const country = (venue.country as Record<string, string>)?.name || '';

      const images = (e.images as Array<Record<string, unknown>>) || [];
      // 가장 넓은 이미지 선택
      const bestImage = images.sort((a, b) => ((b.width as number) || 0) - ((a.width as number) || 0))[0];
      const imageUrl = (bestImage?.url as string) || '';

      const priceRanges = (e.priceRanges as Array<Record<string, unknown>>) || [];
      const minPrice = (priceRanges[0]?.min as number) || null;
      const currency = (priceRanges[0]?.currency as string) || 'GBP';

      const dates = (e.dates as Record<string, unknown>) || {};
      const start = (dates.start as Record<string, string>) || {};

      const classifications = (e.classifications as Array<Record<string, unknown>>) || [];
      const genre = ((classifications[0]?.genre as Record<string, string>)?.name) || '';
      const subGenre = ((classifications[0]?.subGenre as Record<string, string>)?.name) || '';

      return {
        id: e.id as string,
        name: e.name as string,
        url: e.url as string,  // Ticketmaster 직접 링크
        imageUrl,
        date: start.localDate || '',
        time: start.localTime || '',
        venueName,
        city,
        country,
        minPrice,
        currency,
        genre,
        subGenre,
      };
    });

    const pageInfo = data.page || {};

    return NextResponse.json({
      events,
      page: {
        number: pageInfo.number || 0,
        size: pageInfo.size || 20,
        totalElements: pageInfo.totalElements || 0,
        totalPages: pageInfo.totalPages || 0,
      },
    });
  } catch (err) {
    console.error('Ticketmaster API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
