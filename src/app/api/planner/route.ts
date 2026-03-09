import { NextRequest, NextResponse } from 'next/server';
import { getAttractionsByCity, getEveningAttractions, matchAttraction, normalizeCity } from '@/lib/attractions-db';

const TIXSTOCK_BASE = process.env.TIXSTOCK_BASE_URL!;
const TIXSTOCK_TOKEN = process.env.TIXSTOCK_TOKEN!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const TIQETS_TOKEN = process.env.TIQETS_TOKEN!;
const TM_KEY = process.env.TICKETMASTER_API_KEY || '';

const TIQETS_CITY_IDS: Record<string, number> = {
  'london': 67458, 'paris': 66746, 'barcelona': 66342, 'rome': 71631,
  'amsterdam': 75061, 'new york': 260932, 'dubai': 60005, 'istanbul': 79079,
  'singapore': 78125, 'tokyo': 72181, 'florence': 71854, 'lisbon': 76528,
  'venice': 71510, 'berlin': 65144, 'milan': 71749, 'sydney': 60400,
  'athens': 99239, 'bangkok': 78586, 'edinburgh': 21, 'dublin': 68616,
  'prague': 64162, 'madrid': 66254, 'vienna': 60335, 'osaka': 28,
  'kyoto': 72420, 'seoul': 73067, 'budapest': 68199, 'brussels': 60843,
};

interface PlannerItem {
  time: string;
  type: 'attraction' | 'food' | 'event' | 'cafe' | 'dessert' | 'shopping' | 'transport' | 'musical';
  name: string;
  desc: string;
  event_id?: number | null;
  musical_event_id?: number | null;
  price?: number | null;
  event_date?: string | null;
  venue?: string | null;
  bookable?: boolean;
  attraction_url?: string | null;
  attraction_price?: number | null;
  attraction_currency?: string | null;
  booking_url?: string | null;
}

interface PlannerDay {
  day: number;
  date: string;
  title: string;
  items: PlannerItem[];
}

interface PlannerResult {
  city: string;
  country: string;
  days: PlannerDay[];
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    // Estimate days from query to set max_tokens dynamically
    const daysMatch = query.match(/(\d+)\s*(일|박|days?|day)/i);
    const estimatedDays = daysMatch ? Math.min(parseInt(daysMatch[1]), 14) : 4;
    // ~500 tokens per day, minimum 1500
    const maxTokens = Math.max(1500, Math.min(estimatedDays * 600, 4096));

    // Step 1: Generate itinerary via Claude
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: `You are an expert travel planner. Generate a detailed, realistic JSON itinerary.
The user said: "${query}"

Today's date is ${new Date().toISOString().split('T')[0]}. If dates aren't specified, pick reasonable upcoming dates.

Return ONLY valid JSON (no markdown):
{
  "city": "London",
  "country": "UK",
  "days": [
    {
      "day": 1,
      "date": "2026-03-01",
      "title": "Arrival & South Bank",
      "items": [
        { "time": "09:00", "type": "cafe", "name": "Monmouth Coffee", "desc": "Borough Market 인근 유명 커피숍. 60-90분", "bookable": false },
        { "time": "10:30", "type": "attraction", "name": "Tower Bridge", "desc": "유리 보행로. 2-3시간", "bookable": true },
        { "time": "13:00", "type": "food", "name": "Padella", "desc": "수제 파스타. 웨이팅 필수. 60-90분", "bookable": false },
        { "time": "14:30", "type": "attraction", "name": "Tate Modern", "desc": "현대미술관. 무료 입장. 2시간", "bookable": false },
        { "time": "17:00", "type": "dessert", "name": "Kova Patisserie", "desc": "말차 팬케이크. 45분", "bookable": false },
        { "time": "18:00", "type": "food", "name": "Dishoom", "desc": "봄베이 인도 레스토랑. 예약 필수. 90분", "bookable": false },
        { "time": "20:00", "type": "attraction", "name": "London Eye at Night", "desc": "야경 뷰. 입장권 필요. 60분", "bookable": true }
      ]
    }
  ]
}

Item types: "attraction", "food", "cafe", "dessert", "event", "musical", "shopping", "transport"

BOOKING RULES (CRITICAL):
- bookable: true = requires TICKET purchase (attractions, events, musicals only)
- bookable: false = walk-in, free, or restaurant reservation (NOT our ticket system)
- NEVER set bookable: true for type "food", "cafe", "dessert", "shopping", "transport"
- Free museums/galleries: bookable: false
- Paid attractions (entry ticket needed): bookable: true
- Restaurants (even if reservation needed): bookable: false — they use OpenTable/own system

TIME RULES (CRITICAL - NO OVERLAPS):
- Each item must start AFTER the previous item ends
- Duration estimates:
  * cafe/dessert: 45-60 min → next item at least 60 min later
  * food (meal): 60-90 min → next item at least 90 min later
  * attraction (museum/landmark): 90-180 min → next item at least 120 min later
  * event (sports/concert): 150-180 min → next item at least 180 min later
  * musical/theatre: 150 min → next item at least 180 min later
  * shopping: 60-90 min → next item at least 90 min later
- Start first item no earlier than 08:00
- Last item no later than 23:00
- 6-8 items per day maximum

EVENING EVENTS (one per day):
- Always include ONE bookable evening item (19:00-21:00) per day
- London: musical (West End), or London Eye night, or Sky Garden evening
- NYC: Broadway musical, or Empire State Building night view
- Paris: Eiffel Tower light show, or Seine night cruise
- Rome: Rome night walking tour, or Trevi Fountain evening
- Barcelona: Flamenco show, or Bunkers del Carmel sunset
- Tokyo: teamLab, or Tokyo Skytree night
- Dubai: Burj Khalifa At The Top, or Desert Safari

EVENT TYPE:
- type "event": sports matches, concerts (not musicals) with real team/artist names
- type "musical": West End / Broadway shows only

CONTENT RULES:
- Use REAL, SPECIFIC restaurant/cafe names
- Include specific dish in desc
- Descriptions: what it is + estimated duration
- Respond in same language as user input
- Keep locations geographically close within each day`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 });
    }

    const aiData = await aiRes.json();
    const rawText = aiData.content?.[0]?.text || '';
    
    let plan: PlannerResult;
    try {
      plan = JSON.parse(rawText);
    } catch {
      // Try to extract JSON from the response
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) return NextResponse.json({ error: 'Failed to parse AI response', raw: rawText }, { status: 500 });
      plan = JSON.parse(match[0]);
    }

    // ── Force bookable=false for non-ticketable types ─────────────────────
    for (const day of plan.days) {
      for (const item of day.items) {
        if (['food', 'cafe', 'dessert', 'shopping', 'transport'].includes(item.type)) {
          item.bookable = false;
        }
      }
    }

    // ── Time conflict resolver ────────────────────────────────────────────
    const ITEM_DURATION: Record<string, number> = {
      cafe: 60, dessert: 60, food: 90, shopping: 90, transport: 45,
      attraction: 120, event: 180, musical: 180,
    };

    function timeToMin(t: string): number {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    }
    function minToTime(min: number): string {
      const h = Math.floor(min / 60) % 24;
      const m = min % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    for (const day of plan.days) {
      // Sort items by time first
      day.items.sort((a: PlannerItem, b: PlannerItem) => a.time.localeCompare(b.time));

      // Resolve conflicts: ensure no overlap based on duration
      const resolved: PlannerItem[] = [];
      let nextAvailable = 0; // minutes from midnight

      for (const item of day.items) {
        const itemStart = timeToMin(item.time);
        const duration = ITEM_DURATION[item.type] || 90;

        if (resolved.length === 0) {
          resolved.push(item);
          nextAvailable = itemStart + duration;
        } else if (itemStart >= nextAvailable) {
          // No conflict
          resolved.push(item);
          nextAvailable = itemStart + duration;
        } else {
          // Conflict: try to reschedule to nextAvailable if it fits in the day
          if (nextAvailable < 23 * 60) {
            const rescheduled = { ...item, time: minToTime(nextAvailable) };
            resolved.push(rescheduled);
            nextAvailable = nextAvailable + duration;
          }
          // else: skip item (day is full)
        }
      }
      day.items = resolved;
    }

    // Step 2: Fetch Tixstock events for date range
    const allDates = plan.days.map(d => d.date).sort();
    const dateFrom = allDates[0];
    const dateTo = allDates[allDates.length - 1];

    let feedEvents: Record<string, unknown>[] = [];
    try {
      const feedUrl = `${TIXSTOCK_BASE}/feed?city=${encodeURIComponent(plan.city)}&date_from=${dateFrom}&date_to=${dateTo}&has_listing=true&per_page=200`;
      const feedRes = await fetch(feedUrl, {
        headers: { Authorization: `Bearer ${TIXSTOCK_TOKEN}`, 'Content-Type': 'application/json' },
      });
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        feedEvents = feedData.data || feedData.events || feedData || [];
        if (!Array.isArray(feedEvents)) feedEvents = [];
      }
    } catch {
      // Continue without event matching
    }

    // Group real events by date for fast O(1) lookup
    const eventsByDate = new Map<string, Record<string, unknown>[]>();
    for (const ev of feedEvents) {
      const evDate = ((ev.date || ev.event_date || '') as string).slice(0, 10);
      if (!evDate) continue;
      if (!eventsByDate.has(evDate)) eventsByDate.set(evDate, []);
      eventsByDate.get(evDate)!.push(ev);
    }

    // Improved scoring: match on name + category + competition
    function scoreTixstockMatch(
      itemName: string,
      dayDate: string,
      ev: Record<string, unknown>,
    ): number {
      const nameWords = itemName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const evName = ((ev.name as string) || (ev.title as string) || '').toLowerCase();
      const evCategory = ((ev.category as string) || '').toLowerCase();
      const evCompetition = ((ev.competition as string) || '').toLowerCase();
      const evDate = ((ev.date as string) || (ev.event_date as string) || '');

      let score = 0;
      for (const word of nameWords) {
        if (evName.includes(word)) score += 3;
        if (evCategory.includes(word)) score += 1;
        if (evCompetition.includes(word)) score += 1;
      }
      if (evDate && evDate.startsWith(dayDate)) score += 4;
      else if (evDate) {
        const diff = Math.abs(new Date(dayDate).getTime() - new Date(evDate).getTime()) / 86400000;
        if (diff <= 1) score += 2;
        else if (diff <= 2) score += 1;
      }
      return score;
    }

    // Step 3: Match events — improved with fallback to any real event on same day
    const usedEventIds = new Set<number>();

    for (const day of plan.days) {
      for (const item of day.items) {
        if (item.type !== 'event') continue;

        // 1) Name-based match across all feed events
        let bestMatch: Record<string, unknown> | null = null;
        let bestScore = 0;
        for (const ev of feedEvents) {
          const s = scoreTixstockMatch(item.name, day.date, ev);
          if (s > bestScore) { bestScore = s; bestMatch = ev; }
        }

        // 2) If no name match (score < 2), fallback: pick any available event on same day
        if (bestScore < 2) {
          const sameDay = (eventsByDate.get(day.date) || []).find(
            ev => !usedEventIds.has((ev.id || ev.event_id) as number),
          );
          if (sameDay) { bestMatch = sameDay; bestScore = 99; }
        }

        // 3) Still no match: try events within 2 days
        if (!bestMatch) {
          for (const ev of feedEvents) {
            const evId = (ev.id || ev.event_id) as number;
            if (usedEventIds.has(evId)) continue;
            const evDate = ((ev.date || ev.event_date || '') as string).slice(0, 10);
            const diff = Math.abs(new Date(day.date).getTime() - new Date(evDate).getTime()) / 86400000;
            if (diff <= 2) { bestMatch = ev; break; }
          }
        }

        if (bestMatch) {
          const bmVenue = bestMatch.venue as Record<string, unknown> | null;
          const evId = (bestMatch.id || bestMatch.event_id) as number;
          item.event_id = evId;
          item.price = (bestMatch.price || bestMatch.min_price || bestMatch.from_price || null) as number | null;
          item.name = (bestMatch.name || bestMatch.title || item.name) as string;
          item.event_date = (bestMatch.date || bestMatch.event_date || day.date) as string;
          item.venue = (bmVenue?.name || bestMatch.venue || null) as string | null;
          item.desc = (bestMatch.category || bestMatch.competition || item.desc) as string;
          usedEventIds.add(evId);
        }
      }
    }

    // Step 4: LTD Musical matching (London only)
    let ltdEvents: Record<string, unknown>[] = [];
    if (plan.city.toLowerCase().includes('london')) {
      try {
        const ltdRes = await fetch(`${process.env.LTD_BASE_URL}/Events`, {
          headers: { 'Api-Key': process.env.LTD_API_KEY!, 'Content-Type': 'application/json' },
          next: { revalidate: 3600 },
        });
        if (ltdRes.ok) {
          const ltdData = await ltdRes.json();
          ltdEvents = ltdData.Events || [];
        }
      } catch { /* continue without */ }
    }

    // Match musical items to LTD events
    for (const day of plan.days) {
      for (const item of day.items) {
        if (item.type !== 'musical') continue;
        const nameLower = item.name.toLowerCase();

        // Try LTD first (London)
        const match = ltdEvents.find(ev => {
          const evName = ((ev.Name as string) || '').toLowerCase();
          return evName.includes(nameLower) || nameLower.includes(evName.split(' ')[0]);
        });
        if (match) {
          const matchVenue = match.Venue as Record<string, unknown> | null;
          item.musical_event_id = match.EventId as number | null;
          item.venue = item.venue || (match.VenueName as string | null) || (matchVenue?.Name as string | null) || null;
          item.price = item.price || (match.FromPrice as number | null) || null;
        } else {
          // Fallback for non-London: try Tixstock with "theatre" or "musical" category
          const tixMatch = feedEvents.find(ev => {
            const evCat = ((ev.category as string) || '').toLowerCase();
            const evName = ((ev.name as string) || '').toLowerCase();
            const evId = (ev.id || ev.event_id) as number;
            if (usedEventIds.has(evId)) return false;
            return evCat.includes('theatre') || evCat.includes('musical') || evCat.includes('show')
              || evName.includes(nameLower.split(' ')[0]);
          });
          if (tixMatch) {
            const tmVenue = tixMatch.venue as Record<string, unknown> | null;
            const tmId = (tixMatch.id || tixMatch.event_id) as number;
            // Map to event_id for Tixstock flow (not musical_event_id)
            item.event_id = tmId;
            item.type = 'event'; // treat as regular event
            item.venue = item.venue || (tmVenue?.name as string | null) || null;
            item.price = item.price || (tixMatch.price || tixMatch.min_price || null) as number | null;
            usedEventIds.add(tmId);
          }
        }
      }
    }

    // Auto-add unmatched LTD event to first day if no musical yet
    const usedMusicalIds = new Set(
      plan.days.flatMap(d => d.items.filter(i => i.musical_event_id).map(i => i.musical_event_id))
    );
    const firstDay = plan.days[0];
    if (firstDay && ltdEvents.length > 0) {
      const unmatched = ltdEvents.find(ev => !usedMusicalIds.has(ev.EventId as number) && ev.FromPrice);
      if (unmatched && !firstDay.items.some(i => i.type === 'musical')) {
        firstDay.items.push({
          time: '19:30',
          type: 'musical',
          name: unmatched.Name as string,
          desc: (unmatched.TagLine as string) || 'West End Musical',
          musical_event_id: unmatched.EventId as number,
          venue: (unmatched.VenueName as string | null) || null,
          price: (unmatched.FromPrice as number | null) || null,
          bookable: true,
        });
      }
    }

    // Step 5: Attractions DB matching & evening auto-add
    const cityNorm = normalizeCity(plan.city);
    const eveningAttractions = getEveningAttractions(cityNorm);

    for (const day of plan.days) {
      for (const item of day.items) {
        if (item.type !== 'attraction') continue;
        if (item.event_id || item.musical_event_id) continue;

        const matched = matchAttraction(item.name, cityNorm);
        if (matched) {
          // tiqetsUrl → 내부 상세 페이지 URL 변환
          const mPid = matched.tiqetsUrl?.match(/-p(\d+)\/?/)?.[1];
          item.attraction_url = mPid
            ? `/attractions/${matched.city}/${mPid}`
            : `/attractions/${matched.city}`;
          item.attraction_price = matched.price;
          item.attraction_currency = matched.currency;
          if (!item.venue) item.venue = matched.city;
        } else if (item.bookable) {
          // Fallback: link to city attractions page
          const citySlug = plan.city.toLowerCase().replace(/\s+/g, '-');
          item.attraction_url = `/attractions/${citySlug}`;
        }
      }

      // 야경 어트랙션 자동 추가: 해당 날짜에 evening attraction이 없으면 추가
      const hasEvening = day.items.some(
        i =>
          i.type === 'attraction' &&
          (i.attraction_url || i.bookable) &&
          parseInt(i.time.split(':')[0]) >= 18,
      );

      if (!hasEvening && eveningAttractions.length > 0) {
        const usedNames = new Set(
          plan.days.flatMap(d => d.items.map(i => i.name.toLowerCase())),
        );
        const available = eveningAttractions.filter(
          a => !usedNames.has(a.name.toLowerCase()),
        );
        if (available.length > 0) {
          const pick = available[day.day % available.length];
          // tiqetsUrl → 내부 상세 페이지 URL 변환
          const pid = pick.tiqetsUrl?.match(/-p(\d+)\/?/)?.[1];
          const attractionInternalUrl = pid
            ? `/attractions/${pick.city}/${pid}`
            : `/attractions/${pick.city}`;
          day.items.push({
            time: '20:00',
            type: 'attraction',
            name: pick.name,
            desc: pick.descKo || pick.desc,
            bookable: true,
            attraction_url: attractionInternalUrl,
            attraction_price: pick.price,
            attraction_currency: pick.currency,
            venue: pick.city,
          });
        }
      }
    }

    // Step 6: Inject real Tixstock events aggressively
    // For each day, ensure at least 1 real bookable event exists (up to 2 total)
    for (const day of plan.days) {
      const existingReal = day.items.filter(i => i.type === 'event' && i.event_id);
      const maxToAdd = Math.max(0, 2 - existingReal.length);
      if (maxToAdd === 0) continue;

      // Prioritize events on the exact same date, then nearby
      const candidates = [
        ...(eventsByDate.get(day.date) || []),
        ...feedEvents.filter(ev => {
          const evDate = ((ev.date || ev.event_date || '') as string).slice(0, 10);
          if (evDate === day.date) return false; // already in first array
          const diff = Math.abs(new Date(day.date).getTime() - new Date(evDate).getTime()) / 86400000;
          return diff <= 1;
        }),
      ].filter(ev => !usedEventIds.has((ev.id || ev.event_id) as number));

      const slotTimes = ['19:00', '21:30'];
      for (let i = 0; i < Math.min(maxToAdd, candidates.length); i++) {
        const ev = candidates[i];
        const evId = (ev.id || ev.event_id) as number;
        if (usedEventIds.has(evId)) continue;
        const evVenue = ev.venue as Record<string, unknown> | null;
        const evDate = ((ev.date || ev.event_date || day.date) as string).slice(0, 10);
        day.items.push({
          time: slotTimes[existingReal.length + i] || '20:00',
          type: 'event',
          name: (ev.name || ev.title || 'Live Event') as string,
          desc: (ev.category || ev.competition || 'Live event') as string,
          event_id: evId,
          price: (ev.price || ev.min_price || ev.from_price || null) as number | null,
          event_date: evDate,
          venue: (evVenue?.name || ev.venue || null) as string | null,
          bookable: true,
        });
        usedEventIds.add(evId);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Step 7: Proactive URL injection for still-unmatched bookable items
    // Run Tiqets (attractions) + Ticketmaster (events/musicals) in parallel
    // ─────────────────────────────────────────────────────────────
    const cityLower = plan.city.toLowerCase();
    const tiqetsCityId = TIQETS_CITY_IDS[cityLower];

    const unmatched: Array<{ di: number; ii: number; item: PlannerItem; day: PlannerDay }> = [];
    for (let di = 0; di < plan.days.length; di++) {
      for (let ii = 0; ii < plan.days[di].items.length; ii++) {
        const item = plan.days[di].items[ii];
        if (!item.bookable) continue;
        if (item.event_id || item.musical_event_id || item.attraction_url) continue;
        if (['food', 'cafe', 'dessert', 'shopping', 'transport'].includes(item.type)) continue;
        unmatched.push({ di, ii, item, day: plan.days[di] });
      }
    }

    await Promise.allSettled(unmatched.slice(0, 8).map(async ({ item, day }) => {
      const keywords = item.name.replace(/[^\w\s]/g, '').trim();
      const citySlug = plan.city.toLowerCase().replace(/\s+/g, '-');

      if (item.type === 'attraction') {
        // Try Tiqets product search
        if (tiqetsCityId) {
          try {
            const tqUrl = `https://api.tiqets.com/v2/products?city_id=${tiqetsCityId}&q=${encodeURIComponent(keywords)}&limit=3`;
            const tqRes = await fetch(tqUrl, {
              headers: { Authorization: `Bearer ${TIQETS_TOKEN}`, 'Accept-Language': 'en' },
            });
            if (tqRes.ok) {
              const tqData = await tqRes.json();
              const products: Record<string, unknown>[] = tqData.products || tqData || [];
              const best = products[0];
              if (best?.id) {
                item.attraction_url = `/attractions/${citySlug}/${best.id}`;
                item.attraction_price = (best.min_price || best.price || null) as number | null;
                item.attraction_currency = (best.currency || 'EUR') as string;
                item.name = (best.title || best.name || item.name) as string;
                return;
              }
            }
          } catch { /* continue */ }
        }
        // Fallback: city attractions page
        item.attraction_url = `/attractions/${citySlug}`;

      } else if (item.type === 'event' || item.type === 'musical') {
        // Try Ticketmaster
        if (TM_KEY) {
          try {
            const params = new URLSearchParams({
              apikey: TM_KEY,
              keyword: keywords,
              city: plan.city,
              size: '3',
            });
            if (day.date) {
              params.set('startDateTime', `${day.date}T00:00:00Z`);
              params.set('endDateTime', `${day.date}T23:59:59Z`);
            }
            const tmRes = await fetch(
              `https://app.ticketmaster.com/discovery/v2/events.json?${params}`
            );
            if (tmRes.ok) {
              const tmData = await tmRes.json();
              const ev = tmData._embedded?.events?.[0];
              if (ev?.id) {
                item.attraction_url = `/music/event/${ev.id}`;
                item.name = ev.name || item.name;
                item.price = ev.priceRanges?.[0]?.min || item.price || null;
                item.venue = ev._embedded?.venues?.[0]?.name || item.venue || null;
                return;
              }
            }
          } catch { /* continue */ }
        }
        // Fallback: sport or entertainment page with keyword
        const fallbackPage = item.type === 'musical' ? 'entertainment' : 'sport';
        item.attraction_url = `/${fallbackPage}`;
      }
    }));

    return NextResponse.json(plan);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
