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

Today's date is 2026-02-17. If dates aren't specified, pick reasonable upcoming dates.

Return ONLY valid JSON (no markdown):
{
  "city": "London",
  "country": "UK",
  "days": [
    {
      "day": 1,
      "date": "2026-02-28",
      "title": "Arrival & South Bank",
      "items": [
        { "time": "09:00", "type": "cafe", "name": "Monmouth Coffee", "desc": "Borough Market 인근 유명 커피숍", "bookable": false },
        { "time": "10:00", "type": "attraction", "name": "Tower Bridge", "desc": "유리 보행로가 있는 상징적인 다리", "bookable": true },
        { "time": "12:30", "type": "food", "name": "Padella", "desc": "수제 파스타 맛집, 웨이팅 필수", "bookable": false },
        { "time": "14:00", "type": "attraction", "name": "Tate Modern", "desc": "세계적인 현대미술관, 무료 입장", "bookable": false },
        { "time": "15:30", "type": "dessert", "name": "Kova Patisserie", "desc": "말차 수플레 팬케이크 유명", "bookable": false },
        { "time": "18:00", "type": "food", "name": "Dishoom", "desc": "봄베이 스타일 인도 레스토랑, 예약 추천", "bookable": true },
        { "time": "20:00", "type": "event", "name": "Arsenal vs Chelsea", "desc": "프리미어 리그 경기", "event_id": null, "bookable": true },
        { "time": "19:30", "type": "musical", "name": "Hamilton", "desc": "West End 뮤지컬, 빅토리아 팰리스", "bookable": true }
      ]
    }
  ]
}

Item types: "attraction", "food", "cafe", "dessert", "event", "musical", "shopping", "transport"
- type "musical": 뮤지컬/연극 공연. Include when city has theatre district (London West End, NYC Broadway, etc.)
- type "event": 스포츠/콘서트 이벤트
- For musical: { "time": "19:30", "type": "musical", "name": "Hamilton", "desc": "West End 뮤지컬, 빅토리아 팰리스", "bookable": true }
- bookable: true if reservation/ticket is needed or recommended, false if walk-in or free

Rules:
- 6-9 items per day for a DETAILED realistic schedule
- Morning: breakfast spot or cafe
- Lunch: local restaurant recommendation with specific dish or specialty
- Afternoon: attraction + dessert/cafe break
- Dinner: restaurant with cuisine style noted
- Evening: event (sports, concert) or musical (West End/Broadway) when city has theatre district; prefer musical for London/NYC
- Use REAL, SPECIFIC restaurant/cafe names that actually exist in that city
- Include specific dish recommendations in desc when possible
- For events, use real venue/team/artist names
- Dates: YYYY-MM-DD, Times: HH:MM
- Descriptions under 60 chars
- Respond in the same language as user input
- Mix walking-friendly locations within same area each day

CRITICAL RULES FOR EVENING:
- ALWAYS include at least ONE paid evening attraction per trip (type "attraction", time 19:00-21:00)
- For London: London Eye, Sky Garden, Westminster by Night
- For Paris: Eiffel Tower at night, Seine River Night Cruise
- For Rome: Rome by Night walking tour, Trevi Fountain at night
- For Barcelona: Bunkers del Carmel sunset, Gothic Quarter night tour
- For New York: Empire State Building night, NYC Night Bus Tour
- For Dubai: Burj Khalifa At The Top, Desert Safari at sunset
- For Tokyo: Tokyo Skytree Night View, teamLab Borderless
- For Amsterdam: Canal Night Cruise
- For Singapore: Gardens by the Bay light show
- For Hong Kong: Peak Tram night view
- These MUST be bookable (bookable: true) and set at 19:30 or 20:00 time slot
- Mark them with type "attraction" but include the evening nature in description`,
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

    // Step 2: Fetch Tixstock events for date range
    const allDates = plan.days.map(d => d.date).sort();
    const dateFrom = allDates[0];
    const dateTo = allDates[allDates.length - 1];

    let feedEvents: any[] = [];
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
        let bestMatch: any = null;
        let bestScore = 0;

        for (const ev of feedEvents) {
          const evName = (ev.name || ev.title || '').toLowerCase();
          const evDate = ev.date || ev.event_date || '';
          
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
          item.event_id = bestMatch.id || bestMatch.event_id;
          item.price = bestMatch.price || bestMatch.min_price || bestMatch.from_price || null;
          item.name = bestMatch.name || bestMatch.title || item.name;
          item.event_date = bestMatch.date || bestMatch.event_date || day.date;
          item.venue = bestMatch.venue?.name || bestMatch.venue || null;
          item.desc = bestMatch.category || bestMatch.competition || item.desc;
        }
      }
    }

    // Step 4: LTD Musical matching (London only)
    let ltdEvents: any[] = [];
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
          const evName = (ev.Name || '').toLowerCase();
          return evName.includes(nameLower) || nameLower.includes(evName.split(' ')[0]);
        });
        if (match) {
          item.musical_event_id = match.EventId;
          item.venue = item.venue || match.VenueName || match.Venue?.Name || null;
          item.price = item.price || match.FromPrice || null;
        }
      }
    }

    // Auto-add unmatched LTD event to first day if no musical yet
    const usedMusicalIds = new Set(
      plan.days.flatMap(d => d.items.filter(i => i.musical_event_id).map(i => i.musical_event_id))
    );
    const firstDay = plan.days[0];
    if (firstDay && ltdEvents.length > 0) {
      const unmatched = ltdEvents.find(ev => !usedMusicalIds.has(ev.EventId) && ev.FromPrice);
      if (unmatched && !firstDay.items.some(i => i.type === 'musical')) {
        firstDay.items.push({
          time: '19:30',
          type: 'musical',
          name: unmatched.Name,
          desc: unmatched.TagLine || 'West End Musical',
          musical_event_id: unmatched.EventId,
          venue: unmatched.VenueName || null,
          price: unmatched.FromPrice || null,
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
      const evId = ev.id || ev.event_id;
      if (usedIds.has(evId)) continue;
      const evDate = (ev.date || ev.event_date || '').slice(0, 10);
      const matchingDay = plan.days.find(d => d.date === evDate);
      if (!matchingDay) continue;
      // Only add up to 1 extra real event per day
      const existingReal = matchingDay.items.filter(i => i.type === 'event' && i.event_id);
      if (existingReal.length >= 2) continue;

      matchingDay.items.push({
        time: '21:00',
        type: 'event',
        name: ev.name || ev.title || 'Live Event',
        desc: ev.category || ev.competition || 'Live event',
        event_id: evId,
        price: ev.price || ev.min_price || ev.from_price || null,
        event_date: ev.date || ev.event_date || evDate,
        venue: ev.venue?.name || ev.venue || null,
      });
      usedIds.add(evId);
    }

    return NextResponse.json(plan);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
