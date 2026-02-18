import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const TIXSTOCK_BASE_URL = process.env.TIXSTOCK_BASE_URL!;
const TIXSTOCK_TOKEN = process.env.TIXSTOCK_TOKEN!;

// City name mapping (Korean ↔ English)
const CITY_MAP: Record<string, string> = {
  '런던': 'London', '뉴욕': 'New York', '파리': 'Paris', '바르셀로나': 'Barcelona',
  '마드리드': 'Madrid', '밀라노': 'Milan', '뮌헨': 'Munich', '맨체스터': 'Manchester',
  '리버풀': 'Liverpool', '로마': 'Rome', '베를린': 'Berlin', '암스테르담': 'Amsterdam',
  '도쿄': 'Tokyo', '라스베가스': 'Las Vegas', '시카고': 'Chicago', '로스앤젤레스': 'Los Angeles',
  '마이애미': 'Miami', '토론토': 'Toronto', '시드니': 'Sydney', '두바이': 'Dubai',
  '모나코': 'Monaco', '싱가포르': 'Singapore', '홍콩': 'Hong Kong',
};

// Category mapping (Korean → English)
const CATEGORY_MAP: Record<string, string[]> = {
  '축구': ['English Premier League', 'Spanish La Liga', 'German Bundesliga', 'Italian Serie A', 'French Ligue 1', 'Champions League'],
  '프리미어리그': ['English Premier League'], 'EPL': ['English Premier League'],
  '라리가': ['Spanish La Liga'], '분데스리가': ['German Bundesliga'],
  '세리에': ['Italian Serie A'], '리그앙': ['French Ligue 1'],
  '챔스': ['Champions League'], '챔피언스리그': ['Champions League'],
  'F1': ['Formula 1'], '포뮬러': ['Formula 1'],
  '농구': ['NBA'], 'NBA': ['NBA'],
  '테니스': ['Tennis'], '골프': ['Golf'], '럭비': ['Rugby'],
  '복싱': ['Boxing'], '격투기': ['UFC'],
  '콘서트': ['Pop', 'Rock', 'Rap/Hip-hop'], '팝': ['Pop'], '록': ['Rock'], '힙합': ['Rap/Hip-hop'],
  '클래식': ['Classical'], '재즈': ['Jazz'], '일렉': ['Electronic'],
};

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function buildParsePrompt(): string {
  const today = getToday();
  return `You are a search query parser for Enttix, a sports/concert ticket marketplace.
Convert natural language queries into structured JSON filters.

Current date: ${today} (year: 2026).

CATEGORIES (use exact names):
Sports: English Premier League, Spanish La Liga, German Bundesliga, Italian Serie A, French Ligue 1, Champions League, Formula 1, NBA, Tennis, Golf, Rugby, Cricket, MotoGP, Boxing, UFC
Concerts: Pop, Rock, Rap/Hip-hop, R&B, Country, Latin, Alternative, Electronic, Soul, Classical, Jazz, Metal, Reggae, Blues

RULES:
- Relative dates: "이번 달"/"this month" → date_from: first day, date_to: last day of current month
- "다음 주"/"next week" → Monday to Sunday of next week
- "이번 주"/"this week" → today to Sunday of this week
- "오늘"/"today" → ${today}
- "주말"/"weekend" → nearest Saturday-Sunday
- Month without year → assume 2026
- Korean city names: map to English (런던→London, 뉴욕→New York, etc.)
- "football"/"soccer"/"축구" → set category to relevant football league, or use keywords ["football"]
- "유럽"/"Europe" → use keywords ["Europe"] and leave city/country empty
- "싼"/"cheap"/"저렴" → set max_price to 100
- "VIP"/"프리미엄" → set min_price to 200
- If user mentions a specific team, put it in "performer"
- If user mentions a league name in any language, map to exact category name

Return ONLY valid JSON:
{
  "category": "",
  "performer": "",
  "venue": "",
  "city": "",
  "country": "",
  "date_from": "",
  "date_to": "",
  "min_price": null,
  "max_price": null,
  "keywords": [],
  "summary": ""
}

"summary" = 1-line description in user's language. Empty fields as "" or null. Dates as YYYY-MM-DD.`;
}

const RECOMMEND_PROMPT = `You are Enttix AI, a ticket availability assistant. Answer ONLY about the specific event/match the user asked about.

FORMAT:
- Match user's language (Korean → Korean, English → English)
- No emoji, no greetings, no filler
- Facts only. Be direct like a booking agent.

WHEN RESULTS EXIST, answer these in order (skip if data unavailable):
1. 예약 가능 여부 (Available / Sold out)
2. 정확한 일정 (날짜, 시간, 요일)
3. 장소 (경기장/공연장, 도시)
4. 가격대 (최저가 ~ 범위)
5. 좌석/티켓 종류 (있으면)

Keep it under 4 lines. No recommendations for other events. No suggestions for alternatives unless user asked. Do NOT list multiple events — focus on the ONE the user asked about. If multiple dates exist for the same matchup, list only the closest upcoming one.

WHEN NO RESULTS: Say it's not currently available. Suggest checking back later or broadening the search. 1 sentence max.

NEVER include JSON, technical details, marketing copy, or apologies.`;

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Pre-process: resolve Korean city/category before AI parsing
    let enhancedQuery = query;
    for (const [kr, en] of Object.entries(CITY_MAP)) {
      if (query.includes(kr)) {
        enhancedQuery = `${query} (${kr}=${en})`;
        break;
      }
    }

    // Step 1: Parse query into filters
    const parseMsg = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      system: buildParsePrompt(),
      messages: [{ role: 'user', content: enhancedQuery }],
    });

    const parseText = parseMsg.content[0].type === 'text' ? parseMsg.content[0].text : '';
    let filters;
    try {
      // Extract JSON from response (handle cases where model wraps in markdown)
      const jsonMatch = parseText.match(/\{[\s\S]*\}/);
      filters = JSON.parse(jsonMatch ? jsonMatch[0] : parseText);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: parseText }, { status: 500 });
    }

    // Post-process: apply Korean mappings
    if (filters.city) {
      filters.city = CITY_MAP[filters.city] || filters.city;
    }

    // Resolve Korean category keywords
    let categoryExpansion: string[] = [];
    for (const [kr, cats] of Object.entries(CATEGORY_MAP)) {
      if (query.toLowerCase().includes(kr.toLowerCase())) {
        categoryExpansion = cats;
        if (!filters.category && cats.length === 1) {
          filters.category = cats[0];
        }
        break;
      }
    }

    // Step 2: Fetch from Tixstock
    const params = new URLSearchParams({ has_listing: 'true', per_page: '50' });
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.performer) params.set('performer', filters.performer);
    if (filters.category) params.set('category', filters.category);
    if (filters.city) params.set('city', filters.city);
    if (filters.country) params.set('country', filters.country);
    if (filters.venue) params.set('venue', filters.venue);

    const feedRes = await fetch(`${TIXSTOCK_BASE_URL}/feed?${params.toString()}`, {
      headers: { Authorization: `Bearer ${TIXSTOCK_TOKEN}`, 'Content-Type': 'application/json' },
    });

    let events: Record<string, unknown>[] = [];
    if (feedRes.ok) {
      const feedData = await feedRes.json();
      events = feedData.data || [];
    }

    // Smart keyword filtering with scoring
    if (filters.keywords && filters.keywords.length > 0 && events.length > 0) {
      const keywords = filters.keywords.map((k: string) => k.toLowerCase());
      const scored = events.map((e: Record<string, unknown>) => {
        const name = ((e.name as string) || '').toLowerCase();
        const venue = ((e.venue as Record<string, unknown>)?.name as string || '').toLowerCase();
        const city = ((e.venue as Record<string, unknown>)?.city as string || '').toLowerCase();
        const country = ((e.venue as Record<string, unknown>)?.country as string || '').toLowerCase();
        const cats = ((e.categories as Array<Record<string, string>>) || []).map(c => c.name.toLowerCase());
        const allText = [name, venue, city, country, ...cats].join(' ');
        const score = keywords.reduce((s: number, kw: string) => s + (allText.includes(kw) ? 1 : 0), 0);
        return { event: e, score };
      });
      // Keep events with at least 1 keyword match, sorted by relevance
      const matched = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
      events = matched.length > 0 ? matched.map(s => s.event) : events;
    }

    // Category expansion filter (for multi-category Korean terms like "축구")
    if (categoryExpansion.length > 1 && events.length > 0) {
      const catNames = categoryExpansion.map(c => c.toLowerCase());
      const filtered = events.filter((e: Record<string, unknown>) => {
        const cats = ((e.categories as Array<Record<string, string>>) || []).map(c => c.name.toLowerCase());
        return cats.some(c => catNames.some(cn => c.includes(cn)));
      });
      if (filtered.length > 0) events = filtered;
    }

    // Fallback: if 0 results and city was set, retry without city (broader search)
    if (events.length === 0 && filters.city) {
      const fallbackParams = new URLSearchParams({ has_listing: 'true', per_page: '50' });
      if (filters.date_from) fallbackParams.set('date_from', filters.date_from);
      if (filters.date_to) fallbackParams.set('date_to', filters.date_to);
      if (filters.category) fallbackParams.set('category', filters.category);
      if (filters.country) fallbackParams.set('country', filters.country);

      const fallbackRes = await fetch(`${TIXSTOCK_BASE_URL}/feed?${fallbackParams.toString()}`, {
        headers: { Authorization: `Bearer ${TIXSTOCK_TOKEN}`, 'Content-Type': 'application/json' },
      });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        events = fallbackData.data || [];
      }
    }

    // Sort by date (nearest first)
    events.sort((a, b) => {
      const da = new Date((a.datetime as string) || '').getTime();
      const db = new Date((b.datetime as string) || '').getTime();
      return da - db;
    });

    // Step 3: Generate AI recommendation
    // For ticket queries: show only the most relevant events (top 3 closest match)
    const topEvents = events.slice(0, 5);
    const eventSummaries = topEvents.map((e: Record<string, unknown>) => {
      const venue = e.venue as Record<string, unknown> || {};
      const price = e.min_ticket_price ? `${e.currency || 'GBP'} ${e.min_ticket_price}` : 'price TBD';
      const dt = e.datetime ? new Date(e.datetime as string) : null;
      const dateStr = dt ? dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
      const timeStr = dt ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
      return `- ${e.name} | ${dateStr} ${timeStr} | ${venue.name || ''}, ${venue.city || ''} | from ${price} | available: yes`;
    }).join('\n');

    const recommendMsg = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: RECOMMEND_PROMPT,
      messages: [{
        role: 'user',
        content: `User asked: "${query}"
${events.length} total events found. Top matches:
${eventSummaries || '(No matching events found)'}

Answer about the specific event the user asked about:`,
      }],
    });

    const aiMessage = recommendMsg.content[0].type === 'text' ? recommendMsg.content[0].text : '';

    // Return only the most relevant events (max 10, closest matches)
    const relevantEvents = events.slice(0, 10);

    return NextResponse.json({
      filters,
      summary: filters.summary || '',
      aiMessage,
      events: relevantEvents,
      total: relevantEvents.length,
    });
  } catch (e) {
    console.error('AI search error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
