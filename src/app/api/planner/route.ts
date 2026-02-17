import { NextRequest, NextResponse } from 'next/server';

const TIXSTOCK_BASE = process.env.TIXSTOCK_BASE_URL!;
const TIXSTOCK_TOKEN = process.env.TIXSTOCK_TOKEN!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

interface PlannerItem {
  time: string;
  type: 'attraction' | 'food' | 'event';
  name: string;
  desc: string;
  event_id?: number | null;
  price?: number | null;
  event_date?: string | null;
  venue?: string | null;
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
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `You are a travel planner. Given a user request, generate a JSON travel itinerary.
The user said: "${query}"

Today's date is 2026-02-17. If the user doesn't specify dates, pick reasonable upcoming dates.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "city": "London",
  "country": "UK",
  "days": [
    {
      "day": 1,
      "date": "2026-02-28",
      "title": "Arrival & South Bank",
      "items": [
        { "time": "10:00", "type": "attraction", "name": "Tower Bridge", "desc": "Iconic bridge with glass walkway" },
        { "time": "13:00", "type": "food", "name": "Borough Market", "desc": "Famous food market" },
        { "time": "20:00", "type": "event", "name": "Arsenal vs Chelsea", "desc": "Premier League match", "event_id": null }
      ]
    }
  ]
}

Rules:
- Each day should have 3-5 items mixing attractions, food, and events
- Include at least 1 event per day (sports match, concert, theater, etc.) that might realistically exist
- For events, use real venue/team names for that city
- Dates in YYYY-MM-DD format
- Times in HH:MM format
- Keep descriptions concise (under 60 chars)
- Respond in the same language as the user's input`,
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
