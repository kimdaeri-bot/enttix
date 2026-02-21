import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.TICKETMASTER_API_KEY || '0HO8fB0w6EOt44tC4M4gHSFRkVTzFQ1D';
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(`${BASE_URL}/${id}.json?apikey=${API_KEY}&locale=*`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `TM API error: ${res.status}` }, { status: res.status });
    }

    const e = await res.json();
    const embedded = (e._embedded as Record<string, unknown>) || {};
    const venues = (embedded.venues as Array<Record<string, unknown>>) || [];
    const venue = venues[0] || {};
    const city    = (venue.city    as Record<string, string>)?.name    || '';
    const country = (venue.country as Record<string, string>)?.name    || '';
    const state   = (venue.state   as Record<string, string>)?.name    || '';
    const address = (venue.address as Record<string, string>)?.line1   || '';
    const lat     = (venue.location as Record<string, string>)?.latitude  || '';
    const lng     = (venue.location as Record<string, string>)?.longitude || '';

    // 이미지 선택 (16:9 우선, 가장 넓은 것)
    const images = (e.images as Array<Record<string, unknown>>) || [];
    const r169   = images.filter(img => img.ratio === '16_9');
    const pool   = r169.length > 0 ? r169 : images;
    const best   = [...pool].sort((a, b) => ((b.width as number) || 0) - ((a.width as number) || 0))[0];

    // 아티스트 이미지 폴백
    const attractions  = (embedded.attractions as Array<Record<string, unknown>>) || [];
    const artistImgs   = (attractions[0]?.images as Array<Record<string, unknown>>) || [];
    const ar169 = artistImgs.filter(img => img.ratio === '16_9');
    const aPool = ar169.length > 0 ? ar169 : artistImgs;
    const bestA = [...aPool].sort((a, b) => ((b.width as number) || 0) - ((a.width as number) || 0))[0];

    // venue 이미지 폴백
    const venueImgs = (venue.images as Array<Record<string, unknown>>) || [];
    const imageUrl  = (best?.url as string) || (bestA?.url as string) || (venueImgs[0]?.url as string) || '';

    const priceRanges = (e.priceRanges as Array<Record<string, unknown>>) || [];
    const minPrice    = (priceRanges[0]?.min as number) ?? null;
    const maxPrice    = (priceRanges[0]?.max as number) ?? null;
    const currency    = (priceRanges[0]?.currency as string) || 'USD';

    const dates     = (e.dates as Record<string, unknown>) || {};
    const start     = (dates.start as Record<string, string>) || {};
    const statusVal = (dates.status as Record<string, string>)?.code || '';

    const classifications = (e.classifications as Array<Record<string, unknown>>) || [];
    const genre    = ((classifications[0]?.genre    as Record<string, string>)?.name) || '';
    const subGenre = ((classifications[0]?.subGenre as Record<string, string>)?.name) || '';

    // 추가 이미지 목록 (갤러리용)
    const allImages = images
      .filter(img => img.ratio === '16_9')
      .sort((a, b) => ((b.width as number) || 0) - ((a.width as number) || 0))
      .slice(0, 6)
      .map(img => img.url as string);

    return NextResponse.json({
      id: e.id as string,
      name: e.name as string,
      url: e.url as string,
      imageUrl,
      allImages,
      date: start.localDate || '',
      time: start.localTime || '',
      status: statusVal,
      venueName: (venue.name as string) || '',
      address, city, state, country, lat, lng,
      minPrice, maxPrice, currency,
      genre, subGenre,
      info: (e.info as string) || '',
      pleaseNote: (e.pleaseNote as string) || '',
      artists: attractions.map(a => ({
        name: a.name as string,
        url:  a.url  as string,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
