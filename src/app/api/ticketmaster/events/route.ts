import { NextRequest, NextResponse } from 'next/server';

const API_KEY      = process.env.TICKETMASTER_API_KEY || '0HO8fB0w6EOt44tC4M4gHSFRkVTzFQ1D';
const BASE_URL     = 'https://app.ticketmaster.com/discovery/v2/events.json';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/* ── DB 이미지 캐시 일괄 조회 ── */
async function getDbImages(ids: string[]): Promise<Map<string, string>> {
  if (!ids.length || !SUPABASE_URL || !SUPABASE_KEY) return new Map();
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/music_images?event_id=in.(${ids.map(id => `"${id}"`).join(',')})&select=event_id,image_url`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }, cache: 'no-store' }
    );
    if (!res.ok) return new Map();
    const rows: Array<{ event_id: string; image_url: string }> = await res.json();
    return new Map(rows.map(r => [r.event_id, r.image_url]));
  } catch { return new Map(); }
}

// tab → classificationName mapping
const TAB_MAP: Record<string, string> = {
  arts: 'Arts & Theatre',
  music: 'Music',
  sports: 'Sports',
};

// Sports 리그 → subGenreId (Ticketmaster 공식 ID)
const LEAGUE_SUBGENRE: Record<string, string> = {
  mlb: 'KZazBEonSMnZfZ7vF1n',
  nba: 'KZazBEonSMnZfZ7vFJA',
  nhl: 'KZazBEonSMnZfZ7vFEE',
  mls: 'KZazBEonSMnZfZ7vFtI',
  nfl: 'KZazBEonSMnZfZ7vFEJ',
};

// Music genre → genreId
const MUSIC_GENRE: Record<string, string> = {
  rock:             'KnvZfZ7vAeA',  // 20,250
  pop:              'KnvZfZ7vAev',  //  7,873
  country:          'KnvZfZ7vAv6',  //  3,551
  alternative:      'KnvZfZ7vAvv',  //  3,186
  hiphop:           'KnvZfZ7vAv1',  //  2,794
  metal:            'KnvZfZ7vAvt',  //  2,194
  folk:             'KnvZfZ7vAva',  //  1,826
  jazz:             'KnvZfZ7vAvE',  //  1,789
  electronic:       'KnvZfZ7vAvF',  //  1,749
  blues:            'KnvZfZ7vAvd',  //  1,179
  latin:            'KnvZfZ7vAJ6',  //  1,027
  classical:        'KnvZfZ7vAeJ',  //    900
  reggae:           'KnvZfZ7vAed',  //    486
};

// Arts genre → genreId
const ARTS_GENRE: Record<string, string> = {
  theatre:          'KnvZfZ7v7l1',  // 35,040
  comedy:           'KnvZfZ7vAe1',  // 13,192
  fineart:          'KnvZfZ7v7nl',  //  4,935
  circus:           'KnvZfZ7v7n1',  //  2,789
  magic:            'KnvZfZ7v7lv',  //  2,316
  variety:          'KnvZfZ7v7lJ',  //  1,206
  cultural:         'KnvZfZ7v7nE',  //  1,492
  dance:            'KnvZfZ7v7nI',  //  1,332
  childrens:        'KnvZfZ7v7na',  //  1,071
  classical:        'KnvZfZ7v7nJ',  //    923
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tab   = searchParams.get('tab')    || 'arts';
  const league = searchParams.get('league') || '';  // sports 전용
  const genre  = searchParams.get('genre')  || '';  // music/arts 전용
  const page  = searchParams.get('page')   || '0';
  const size  = searchParams.get('size')   || '20';
  const countryCode = searchParams.get('countryCode') || '';
  const keyword     = searchParams.get('keyword')     || '';
  const endDateTime = searchParams.get('endDateTime') || '';  // 날짜 범위 상한
  const startDate   = searchParams.get('startDate')   || '';  // 달력 날짜 오버라이드 (YYYY-MM-DD)

  const classificationName = TAB_MAP[tab] || 'Arts & Theatre';

  // 오늘 00:00:00 UTC 기준 — 과거 이벤트 자동 제외 (달력 선택 시 해당 날짜로 오버라이드)
  const todayISO    = new Date().toISOString().slice(0, 10) + 'T00:00:00Z';
  const startDtISO  = startDate ? `${startDate}T00:00:00Z` : todayISO;

  const params = new URLSearchParams({
    apikey: API_KEY,
    size,
    page,
    sort: 'date,asc',
    locale: '*',
    startDateTime: startDtISO,
  });

  if (countryCode) params.set('countryCode', countryCode);
  if (keyword)     params.set('keyword', keyword);
  if (endDateTime) params.set('endDateTime', endDateTime);

  // 필터 우선순위: league(sports) > genre(music/arts) > classificationName
  if (tab === 'sports' && league && LEAGUE_SUBGENRE[league]) {
    params.set('subGenreId', LEAGUE_SUBGENRE[league]);
  } else if (tab === 'music' && genre && MUSIC_GENRE[genre]) {
    params.set('genreId', MUSIC_GENRE[genre]);
  } else if (tab === 'arts' && genre && ARTS_GENRE[genre]) {
    params.set('genreId', ARTS_GENRE[genre]);
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
      // 가장 넓은 이미지 선택 (16:9 비율 우선)
      const ratio169 = images.filter(img => (img.ratio as string) === '16_9');
      const pool = ratio169.length > 0 ? ratio169 : images;
      const bestImage = [...pool].sort((a, b) => ((b.width as number) || 0) - ((a.width as number) || 0))[0];

      // 아티스트(attractions) 이미지 → venue 이미지 순 폴백
      const attractions = (embedded.attractions as Array<Record<string, unknown>>) || [];
      const artistImgs = (attractions[0]?.images as Array<Record<string, unknown>>) || [];
      const artistImg169 = artistImgs.filter(img => (img.ratio as string) === '16_9');
      const artistPool = artistImg169.length > 0 ? artistImg169 : artistImgs;
      const bestArtistImg = [...artistPool].sort((a, b) => ((b.width as number) || 0) - ((a.width as number) || 0))[0];

      const venueImages = (venue.images as Array<Record<string, unknown>>) || [];
      const venueImageUrl = (venueImages[0]?.url as string) || '';
      const imageUrl = (bestImage?.url as string) || (bestArtistImg?.url as string) || venueImageUrl;

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
        venueImageUrl,
      };
    });

    const pageInfo = data.page || {};

    // Music 탭: DB 캐시 이미지 우선 적용
    let finalEvents = events;
    if (tab === 'music' && events.length > 0) {
      const dbImgs = await getDbImages(events.map((e: { id: string }) => e.id));
      if (dbImgs.size > 0) {
        finalEvents = events.map((e: { id: string; imageUrl: string }) =>
          dbImgs.has(e.id) ? { ...e, imageUrl: dbImgs.get(e.id) } : e
        );
      }
    }

    return NextResponse.json({
      events: finalEvents,
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
