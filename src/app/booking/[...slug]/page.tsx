/**
 * LTD Calendar Widget → 예약 redirect (locale-free)
 *
 * 달력 위젯 redirect URL: {siteUrl}/booking/{eventUrlId}/{yearMonth}/{performanceId}
 * 예: /booking/phantom-of-the-opera-tickets/03-2026/730848
 */
import { redirect } from 'next/navigation';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

export default async function BookingRedirectPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const performanceId = slug[slug.length - 1];

  if (!performanceId || isNaN(Number(performanceId))) {
    redirect('/ko/musical');
  }

  try {
    const res = await fetch(`${LTD_BASE_URL}/Performances/${performanceId}`, {
      headers: { 'Api-Key': LTD_API_KEY },
      next: { revalidate: 60 },
    });
    const data = await res.json();
    const perf = data.Performance || data;

    const eventId = perf.EventId || '';
    const eventName = encodeURIComponent(perf.EventName || '');
    const minPrice = perf.MinimumTicketPrice || 0;
    const venue = encodeURIComponent(perf.VenueName || perf.Venue?.Name || '');
    const date = encodeURIComponent(perf.PerformanceDate || '');

    redirect(
      `/ko/musical/book/${performanceId}?eventId=${eventId}&eventName=${eventName}&price=${minPrice}&venue=${venue}&date=${date}`
    );
  } catch {
    redirect(`/ko/musical/book/${performanceId}`);
  }
}
