import { NextRequest, NextResponse } from 'next/server';
import { getAttractionsByCity, getEveningAttractions, matchAttraction, normalizeCity } from '@/lib/attractions-db';

const TIXSTOCK_BASE = process.env.TIXSTOCK_BASE_URL!;
const TIXSTOCK_TOKEN = process.env.TIXSTOCK_TOKEN!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

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
      const feedUrl = `${TIXSTOCK_BASE}/feed?city=${encodeURIComponent(plan.city)}&date_from=${dateFrom}&date_to=${dateTo}&has_listing=true&per_page=100`;
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

    // Step 3: Match events
    for (const day of plan.days) {
      for (const item of day.items) {
        if (item.type !== 'event') continue;

        const nameLower = item.name.toLowerCase();
        const nameWords = nameLower.split(/\s+/).filter(w => w.length > 2);

        // Find best match by name similarity and date proximity
        let bestMatch: Record<string, unknown> | null = null;
        let bestScore = 0;

        for (const ev of feedEvents) {
          const evName = ((ev.name as string) || (ev.title as string) || '').toLowerCase();
          const evDate = ((ev.date as string) || (ev.event_date as string) || '');
          
          // Score based on word matches
          let score = 0;
          for (const word of nameWords) {
            if (evName.includes(word)) score += 1;
          }
          
          // Bonus for same date
          if (evDate && evDate.startsWith(day.date)) score += 2;
          
          // Bonus for close dates
          if (evDate) {
            const dayDiff = Math.abs(new Date(day.date).getTime() - new Date(evDate).getTime()) / 86400000;
            if (dayDiff <= 1) score += 1;
          }

          if (score > bestScore) {
            bestScore = score;
            bestMatch = ev;
          }
        }

        if (bestMatch && bestScore >= 1) {
          const bmVenue = bestMatch.venue as Record<string, unknown> | null;
          item.event_id = (bestMatch.id || bestMatch.event_id) as number | null;
          item.price = (bestMatch.price || bestMatch.min_price || bestMatch.from_price || null) as number | null;
          item.name = (bestMatch.name || bestMatch.title || item.name) as string;
          item.event_date = (bestMatch.date || bestMatch.event_date || day.date) as string;
          item.venue = (bmVenue?.name || bestMatch.venue || null) as string | null;
          item.desc = (bestMatch.category || bestMatch.competition || item.desc) as string;
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
        const match = ltdEvents.find(ev => {
          const evName = ((ev.Name as string) || '').toLowerCase();
          return evName.includes(nameLower) || nameLower.includes(evName.split(' ')[0]);
        });
        if (match) {
          const matchVenue = match.Venue as Record<string, unknown> | null;
          item.musical_event_id = match.EventId as number | null;
          item.venue = item.venue || (match.VenueName as string | null) || (matchVenue?.Name as string | null) || null;
          item.price = item.price || (match.FromPrice as number | null) || null;
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
          item.attraction_url = matched.tiqetsUrl;
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
          day.items.push({
            time: '20:00',
            type: 'attraction',
            name: pick.name,
            desc: pick.descKo || pick.desc,
            bookable: true,
            attraction_url: pick.tiqetsUrl,
            attraction_price: pick.price,
            attraction_currency: pick.currency,
            venue: pick.city,
          });
        }
      }
    }

    // Also attach unmatched real events to days that have room
    // (offer real available events even if AI didn't predict them)
    const usedIds = new Set(
      plan.days.flatMap(d => d.items.filter(i => i.event_id).map(i => i.event_id))
    );

    for (const ev of feedEvents) {
      const evId = (ev.id || ev.event_id) as number;
      if (usedIds.has(evId)) continue;
      const evDate = ((ev.date || ev.event_date || '') as string).slice(0, 10);
      const matchingDay = plan.days.find(d => d.date === evDate);
      if (!matchingDay) continue;
      // Only add up to 1 extra real event per day
      const existingReal = matchingDay.items.filter(i => i.type === 'event' && i.event_id);
      if (existingReal.length >= 2) continue;

      const evVenue = ev.venue as Record<string, unknown> | null;
      matchingDay.items.push({
        time: '21:00',
        type: 'event',
        name: ((ev.name || ev.title || 'Live Event') as string),
        desc: ((ev.category || ev.competition || 'Live event') as string),
        event_id: evId,
        price: (ev.price || ev.min_price || ev.from_price || null) as number | null,
        event_date: ((ev.date || ev.event_date || evDate) as string),
        venue: ((evVenue?.name || ev.venue || null) as string | null),
      });
      usedIds.add(evId);
    }

    return NextResponse.json(plan);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
