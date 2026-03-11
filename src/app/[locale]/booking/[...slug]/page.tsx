/**
 * LTD Calendar Widget → 예약 페이지 redirect handler
 *
 * 달력 위젯이 날짜/공연 선택 시 이 경로로 리다이렉트합니다:
 *   {siteUrl}/booking/{eventUrlId}/{yearMonth}/{performanceId}
 * 예: /booking/phantom-of-the-opera-tickets/03-2026/730848
 *
 * 여기서 performanceId를 추출 → /ko/musical/book/[performanceId]?... 로 redirect
 */

import { redirect } from 'next/navigation';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

interface Props {
  params: Promise<{ locale: string; slug: string[] }>;
}

export default async function BookingRedirectPage({ params }: Props) {
  const { locale, slug } = await params;

  // slug = [eventUrlId, yearMonth, performanceId]
  // 예: ['phantom-of-the-opera-tickets', '03-2026', '730848']
  const performanceId = slug[slug.length - 1];

  if (!performanceId || isNaN(Number(performanceId))) {
    redirect(`/${locale}/musical`);
  }

  try {
    // performanceId로 공연 정보 조회
    const res = await fetch(
      `${LTD_BASE_URL}/Performances/${performanceId}`,
      { headers: { 'Api-Key': LTD_API_KEY }, next: { revalidate: 60 } }
    );
    const data = await res.json();
    const perf = data.Performance || data;

    const eventId = perf.EventId || '';
    const eventName = perf.EventName || '';
    const minPrice = perf.MinimumTicketPrice || perf.TicketPrice || 0;
    const venue = perf.VenueName || perf.Venue?.Name || '';
    const date = perf.PerformanceDate || '';

    const params = new URLSearchParams({
      eventId: String(eventId),
      eventName,
      price: String(minPrice),
      venue,
      date,
    });

    redirect(`/${locale}/musical/book/${performanceId}?${params.toString()}`);
  } catch {
    // API 실패 시 performanceId만으로 이동
    redirect(`/${locale}/musical/book/${performanceId}`);
  }
}
