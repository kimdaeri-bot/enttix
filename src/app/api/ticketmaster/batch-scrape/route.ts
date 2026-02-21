/**
 * GET /api/ticketmaster/batch-scrape?genre=rock&countryCode=US&page=0
 *
 * TM 뮤직 이벤트 이미지 일괄 수집 → Supabase music_images 저장
 * - TM API에서 imageUrl 직접 수집 (HTML 스크래핑 불필요)
 * - 중복 이미지 dedup 처리 (같은 normUrl 제거)
 */
import { NextRequest, NextResponse } from 'next/server';

const TM_KEY       = process.env.TICKETMASTER_API_KEY || '0HO8fB0w6EOt44tC4M4gHSFRkVTzFQ1D';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MUSIC_GENRE: Record<string, string> = {
  rock:        'KnvZfZ7vAeA', pop:         'KnvZfZ7vAev', country:   'KnvZfZ7vAv6',
  alternative: 'KnvZfZ7vAvv', hiphop:      'KnvZfZ7vAv1', metal:     'KnvZfZ7vAvt',
  folk:        'KnvZfZ7vAva', jazz:        'KnvZfZ7vAvE', electronic:'KnvZfZ7vAvF',
  classical:   'KnvZfZ7vAeJ', latin:       'KnvZfZ7vAJ6',
};

const COUNTRIES = ['US','GB','CA','AU','DE','FR','NL','ES','IE','BE','SE','NO','DK','NZ','MX','BR'];

/* ── TM API에서 이벤트+이미지 수집 ── */
async function fetchTmEvents(genre: string, countryCode: string, page: number) {
  const today = new Date().toISOString().slice(0, 10) + 'T00:00:00Z';
  const params = new URLSearchParams({
    apikey: TM_KEY, size: '50', page: String(page),
    sort: 'date,asc', locale: '*', startDateTime: today,
  });
  if (countryCode) params.set('countryCode', countryCode);
  if (genre && MUSIC_GENRE[genre]) {
    params.set('genreId', MUSIC_GENRE[genre]);
  } else {
    params.set('classificationName', 'Music');
  }

  const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data = await res.json();

  const events = (data?._embedded?.events || []);
  const today2 = new Date().toISOString().slice(0, 10);

  // image 추출 + TM URL 필터 + 날짜 필터
  const seenImg = new Set<string>();
  return events
    .filter((e: Record<string, unknown>) => {
      const url = e.url as string || '';
      const dateStr = ((e.dates as Record<string, unknown>)?.start as Record<string, string>)?.localDate || '';
      return url.includes('ticketmaster') && (!dateStr || dateStr >= today2);
    })
    .map((e: Record<string, unknown>) => {
      const images = (e.images as Array<Record<string, unknown>>) || [];
      const embedded = (e._embedded as Record<string, unknown>) || {};
      const venues = (embedded.venues as Array<Record<string, unknown>>) || [];
      const venue = venues[0] || {};
      const country = (venue.country as Record<string, string>)?.name || countryCode;

      // 최고해상도 이미지
      const ratio169 = images.filter(img => (img.ratio as string) === '16_9');
      const pool = ratio169.length > 0 ? ratio169 : images;
      const best = [...pool].sort((a, b) => ((b.width as number) || 0) - ((a.width as number) || 0))[0];
      const imageUrl = (best?.url as string) || '';

      // dedup
      const normUrl = imageUrl.replace(/_(RETINA|TABLET|REINA|STANDARD|CUSTOM)_[A-Z0-9_]+\.(jpg|jpeg|png|webp)$/i, '');
      if (!imageUrl || (normUrl && seenImg.has(normUrl))) return null;
      if (normUrl) seenImg.add(normUrl);

      const classifications = (e.classifications as Array<Record<string, unknown>>) || [];
      const evGenre = ((classifications[0]?.genre as Record<string, string>)?.name) || genre;

      return {
        event_id: e.id as string,
        image_url: imageUrl,
        event_name: e.name as string,
        genre: evGenre,
        country,
      };
    })
    .filter(Boolean);
}

/* ── DB 저장 ── */
async function saveToDb(rows: Array<{ event_id: string; image_url: string; event_name: string; genre: string; country: string }>) {
  if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  const url = `${SUPABASE_URL}/rest/v1/music_images`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  });
  const body = await res.text();
  // 디버그: status + body 포함 에러 반환
  if (!res.ok) throw new Error(`DB(${res.status}) url=${url} svcKey=${SERVICE_KEY.slice(0,12)}... err=${body.slice(0,200)}`);
  try {
    const parsed = JSON.parse(body) as unknown[];
    return { count: parsed.length, sample: parsed.slice(0, 2) };
  } catch { return { count: rows.length, sample: [] }; }
}

/* ── 핸들러 ── */
export async function GET(req: NextRequest) {
  if (!SERVICE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const genre       = searchParams.get('genre')       || '';         // 비어있으면 전체 장르
  const countryCode = searchParams.get('countryCode') || '';         // 비어있으면 전체 국가
  const page        = parseInt(searchParams.get('page') || '0');
  const allCountries = searchParams.get('all') === 'true';           // all=true: 모든 국가 순환

  try {
    const targetCountries = allCountries ? COUNTRIES : (countryCode ? [countryCode] : ['US']);
    const allRows: Array<{ event_id: string; image_url: string; event_name: string; genre: string; country: string }> = [];

    for (const cc of targetCountries) {
      const rows = await fetchTmEvents(genre, cc, page);
      allRows.push(...rows);
    }

    let saved = 0;
    let dbError = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbDebug: any = undefined;
    if (allRows.length > 0) {
      try {
        const result = await saveToDb(allRows);
        saved = result.count;
        dbDebug = result.sample;
      } catch (e) {
        dbError = String(e);
      }
    }

    // INSERT 후 즉시 SELECT count 검증
    let verifyCount = -1;
    try {
      const vRes = await fetch(`${SUPABASE_URL}/rest/v1/music_images?select=event_id&limit=1`, {
        headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY, 'Prefer': 'count=exact' },
      });
      const range = vRes.headers.get('content-range') || '';
      verifyCount = parseInt(range.split('/')[1] || '-1');
    } catch { /* ignore */ }

    return NextResponse.json({ genre, page, countries: targetCountries, collected: allRows.length, saved, dbError: dbError || undefined, dbDebug, verifyCount, supabaseUrl: SUPABASE_URL?.slice(0,40) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
