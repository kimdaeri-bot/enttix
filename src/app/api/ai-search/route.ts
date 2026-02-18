import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TIXSTOCK_BASE_URL = process.env.TIXSTOCK_BASE_URL!;
const TIXSTOCK_TOKEN = process.env.TIXSTOCK_TOKEN!;
const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

// ============================================================
// City mapping (Korean ↔ English)
// ============================================================
const CITY_MAP: Record<string, string> = {
  '런던': 'London', '뉴욕': 'New York', '파리': 'Paris', '바르셀로나': 'Barcelona',
  '마드리드': 'Madrid', '밀라노': 'Milan', '뮌헨': 'Munich', '맨체스터': 'Manchester',
  '리버풀': 'Liverpool', '로마': 'Rome', '베를린': 'Berlin', '암스테르담': 'Amsterdam',
  '도쿄': 'Tokyo', '라스베가스': 'Las Vegas', '시카고': 'Chicago', '로스앤젤레스': 'Los Angeles',
  '마이애미': 'Miami', '토론토': 'Toronto', '시드니': 'Sydney', '두바이': 'Dubai',
  '모나코': 'Monaco', '싱가포르': 'Singapore', '홍콩': 'Hong Kong',
  'london': 'London', 'new york': 'New York', 'paris': 'Paris', 'barcelona': 'Barcelona',
  'madrid': 'Madrid', 'milan': 'Milan', 'munich': 'Munich', 'manchester': 'Manchester',
  'liverpool': 'Liverpool', 'rome': 'Rome', 'berlin': 'Berlin', 'amsterdam': 'Amsterdam',
};

// ============================================================
// Category mapping
// ============================================================
const CATEGORY_MAP: Record<string, string[]> = {
  '축구': ['English Premier League', 'Spanish La Liga', 'German Bundesliga', 'Italian Serie A', 'French Ligue 1', 'Champions League'],
  'football': ['English Premier League', 'Spanish La Liga', 'German Bundesliga', 'Italian Serie A', 'French Ligue 1', 'Champions League'],
  'soccer': ['English Premier League', 'Spanish La Liga', 'German Bundesliga', 'Italian Serie A', 'French Ligue 1', 'Champions League'],
  '프리미어리그': ['English Premier League'], 'premier league': ['English Premier League'], 'epl': ['English Premier League'],
  '라리가': ['Spanish La Liga'], 'la liga': ['Spanish La Liga'], 'laliga': ['Spanish La Liga'],
  '분데스리가': ['German Bundesliga'], 'bundesliga': ['German Bundesliga'],
  '세리에': ['Italian Serie A'], 'serie a': ['Italian Serie A'],
  '리그앙': ['French Ligue 1'], 'ligue 1': ['French Ligue 1'], '리그1': ['French Ligue 1'],
  '챔스': ['Champions League'], '챔피언스리그': ['Champions League'], 'champions league': ['Champions League'],
  'f1': ['Formula 1'], '포뮬러': ['Formula 1'], 'formula 1': ['Formula 1'],
  '농구': ['NBA'], 'nba': ['NBA'], 'basketball': ['NBA'],
  '테니스': ['Tennis'], 'tennis': ['Tennis'],
  '골프': ['Golf'], 'golf': ['Golf'],
  '럭비': ['Rugby'], 'rugby': ['Rugby'],
  '복싱': ['Boxing'], 'boxing': ['Boxing'],
  '격투기': ['UFC'], 'ufc': ['UFC'],
  '콘서트': ['Pop', 'Rock', 'Rap/Hip-hop'], 'concert': ['Pop', 'Rock', 'Rap/Hip-hop'],
  '팝': ['Pop'], 'pop': ['Pop'],
  '록': ['Rock'], 'rock': ['Rock'],
  '힙합': ['Rap/Hip-hop'], 'hip-hop': ['Rap/Hip-hop'], 'rap': ['Rap/Hip-hop'],
  '클래식': ['Classical'], 'classical': ['Classical'],
  '재즈': ['Jazz'], 'jazz': ['Jazz'],
  '일렉': ['Electronic'], 'electronic': ['Electronic'],
  '뮤지컬': ['Musical/Play'], 'musical': ['Musical/Play'],
};

// ============================================================
// Musical/Theatre keyword detection → LTD API
// ============================================================
const LTD_KEYWORDS = [
  '뮤지컬', 'musical', '연극', 'play', '오페라', 'opera', '발레', 'ballet',
  '댄스쇼', 'dance show', '서커스', 'circus', '웨스트엔드', 'west end', 'westend',
  '브로드웨이', 'broadway', '공연', 'theatre', 'theater', '라이온킹', 'lion king',
  '위키드', 'wicked', '레미제라블', 'les misérables', 'les miserables',
  '팬텀', 'phantom', '해밀턴', 'hamilton', '마틸다', 'matilda',
  '맘마미아', 'mamma mia', '시카고', 'chicago show', '아베마리아', 'les mis',
];

// LTD EventType filter by keyword
const LTD_TYPE_MAP: Record<string, number> = {
  '오페라': 4, 'opera': 4,
  '발레': 5, 'ballet': 5,
  '댄스': 3, 'dance': 3,
  '서커스': 6, 'circus': 6,
  '연극': 2, 'play': 2,
  '뮤지컬': 1, 'musical': 1,
};

function detectLtdKeyword(query: string): { isLtd: boolean; ltdType: number | null; searchTerm: string } {
  const lower = query.toLowerCase();
  let ltdType: number | null = null;
  let searchTerm = '';

  // Check type-specific keywords first
  for (const [key, type] of Object.entries(LTD_TYPE_MAP)) {
    if (lower.includes(key)) { ltdType = type; break; }
  }

  // Check any LTD keyword
  const isLtd = LTD_KEYWORDS.some(kw => lower.includes(kw));

  // Extract show title as search term (remove known category words)
  searchTerm = query
    .replace(/뮤지컬|연극|오페라|발레|서커스|공연|티켓|예매|예약/g, '')
    .replace(/musical|theatre|theater|play|opera|ballet|circus/gi, '')
    .replace(/런던|london|웨스트엔드|west end/gi, '')
    .trim();

  return { isLtd, ltdType, searchTerm };
}

// ============================================================
// Team name mapping
// ============================================================
const TEAM_MAP: Record<string, string> = {
  '아스널': 'Arsenal', '아스날': 'Arsenal', 'arsenal': 'Arsenal',
  '첼시': 'Chelsea', 'chelsea': 'Chelsea',
  '토트넘': 'Tottenham', 'tottenham': 'Tottenham', '스퍼스': 'Tottenham',
  '맨유': 'Manchester United', '맨체스터유나이티드': 'Manchester United', 'man utd': 'Manchester United',
  '맨시티': 'Manchester City', '맨체스터시티': 'Manchester City', 'man city': 'Manchester City',
  '리버풀': 'Liverpool', 'liverpool': 'Liverpool',
  '바르사': 'Barcelona', '바르셀로나': 'Barcelona',
  '레알': 'Real Madrid', '레알마드리드': 'Real Madrid', 'real madrid': 'Real Madrid',
  '바이에른': 'Bayern Munich', 'bayern': 'Bayern Munich',
  '유벤투스': 'Juventus', 'juventus': 'Juventus',
  'psg': 'Paris Saint-Germain', '파리생제르맹': 'Paris Saint-Germain',
  '이강인': 'Lee Kang-in', '손흥민': 'Son Heung-min', '김민재': 'Kim Min-jae',
};

// ============================================================
// Date parsing
// ============================================================
function getToday(): Date { return new Date(); }
function fmt(d: Date): string { return d.toISOString().split('T')[0]; }

function parseRelativeDate(q: string): { date_from?: string; date_to?: string } {
  const today = getToday();
  const y = today.getFullYear();
  const m = today.getMonth();
  const lower = q.toLowerCase();

  if (/오늘|today/.test(lower)) { const s = fmt(today); return { date_from: s, date_to: s }; }
  if (/이번\s*주|this\s*week/.test(lower)) {
    const sun = new Date(today); sun.setDate(today.getDate() + (7 - today.getDay()));
    return { date_from: fmt(today), date_to: fmt(sun) };
  }
  if (/다음\s*주|next\s*week/.test(lower)) {
    const mon = new Date(today); mon.setDate(today.getDate() + (8 - today.getDay()));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { date_from: fmt(mon), date_to: fmt(sun) };
  }
  if (/주말|weekend/.test(lower)) {
    const sat = new Date(today); sat.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
    if (sat <= today) sat.setDate(sat.getDate() + 7);
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
    return { date_from: fmt(sat), date_to: fmt(sun) };
  }
  if (/이번\s*달|this\s*month/.test(lower)) {
    return { date_from: fmt(new Date(y, m, 1)), date_to: fmt(new Date(y, m + 1, 0)) };
  }
  if (/다음\s*달|next\s*month/.test(lower)) {
    return { date_from: fmt(new Date(y, m + 1, 1)), date_to: fmt(new Date(y, m + 2, 0)) };
  }
  const krMonth = lower.match(/(\d{1,2})월/);
  if (krMonth) {
    const mo = parseInt(krMonth[1]) - 1;
    const yr = mo < m ? y + 1 : y;
    return { date_from: fmt(new Date(yr, mo, 1)), date_to: fmt(new Date(yr, mo + 1, 0)) };
  }
  const enMonths: Record<string, number> = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 };
  for (const [name, mo] of Object.entries(enMonths)) {
    if (lower.includes(name)) {
      const yr = mo < m ? y + 1 : y;
      return { date_from: fmt(new Date(yr, mo, 1)), date_to: fmt(new Date(yr, mo + 1, 0)) };
    }
  }
  const ymMatch = lower.match(/(\d{4})년?\s*(\d{1,2})월/);
  if (ymMatch) {
    const yr = parseInt(ymMatch[1]), mo = parseInt(ymMatch[2]) - 1;
    return { date_from: fmt(new Date(yr, mo, 1)), date_to: fmt(new Date(yr, mo + 1, 0)) };
  }
  const fullDate = lower.match(/(\d{4})[-년]\s*(\d{1,2})[-월]\s*(\d{1,2})일?/);
  if (fullDate) {
    const d = fmt(new Date(parseInt(fullDate[1]), parseInt(fullDate[2]) - 1, parseInt(fullDate[3])));
    return { date_from: d, date_to: d };
  }
  return {};
}

// ============================================================
// Rule-based query parser (NO AI call)
// ============================================================
function parseQuery(query: string): {
  category: string; performer: string; city: string; country: string;
  date_from: string; date_to: string; keywords: string[];
  min_price: number | null; max_price: number | null; summary: string;
} {
  const lower = query.toLowerCase();
  let city = '', country = '', performer = '', category = '';
  const keywords: string[] = [];
  let min_price: number | null = null, max_price: number | null = null;

  for (const [key, val] of Object.entries(CITY_MAP)) {
    if (lower.includes(key.toLowerCase())) { city = val; break; }
  }
  for (const [key, cats] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key.toLowerCase())) {
      if (cats.length === 1) category = cats[0];
      break;
    }
  }
  for (const [key, val] of Object.entries(TEAM_MAP)) {
    if (lower.includes(key.toLowerCase())) { performer = val; break; }
  }
  if (/싼|cheap|저렴|budget/.test(lower)) max_price = 100;
  if (/vip|프리미엄|premium|luxury/.test(lower)) min_price = 200;
  const priceMatch = lower.match(/under\s*\$?(\d+)|(\d+)\s*(달러|파운드|유로)?\s*이하/);
  if (priceMatch) max_price = parseInt(priceMatch[1] || priceMatch[2]);

  const dates = parseRelativeDate(query);
  if (/유럽|europe/.test(lower)) keywords.push('Europe');

  const isKorean = /[가-힣]/.test(query);
  const parts: string[] = [];
  if (performer) parts.push(performer);
  if (category) parts.push(category);
  if (city) parts.push(city);
  if (dates.date_from) parts.push(dates.date_from);
  const summary = isKorean ? `${parts.join(', ')} 검색 결과` : `Results for ${parts.join(', ')}`;

  return { category, performer, city, country, date_from: dates.date_from || '', date_to: dates.date_to || '', keywords, min_price, max_price, summary };
}

// ============================================================
// AI conversational response (Haiku, 1 call)
// ============================================================
const TICKET_PROMPT = `You are an Enttix ticket assistant. A user asked about events/shows/tickets.

RULES:
- Reply in the same language as the user (Korean → Korean, English → English)
- Conversational but fact-focused — like a knowledgeable friend who knows tickets
- NO greetings, NO filler ("안녕하세요", "좋은 선택이에요", "I'd be happy to")
- NO marketing language, NO apologies
- Stick ONLY to what the user asked. Do NOT suggest other events/dates/alternatives
- If multiple events found for same match, focus on the CLOSEST upcoming one
- For musicals/theatre: mention the show name, venue, price range, and that it runs continuously

ANSWER FORMAT (in order, skip if data missing):
1. Availability (yes/no, how many listings)
2. Exact schedule (date, day of week, time) — or "ongoing" for long-run shows
3. Venue + city
4. Price range (lowest available)
5. Ticket types if notable (e.g. seated/standing/VIP/Stalls/Circle)

Max 4-5 lines. Natural sentences, not bullet points. No JSON.

WHEN NO RESULTS: One sentence — not available now, try broadening search. Nothing more.`;

async function buildAiMessage(
  query: string,
  events: Record<string, unknown>[],
  ltdEvents: Record<string, unknown>[],
): Promise<string> {
  const topEvents = events.slice(0, 3);
  const topLtd = ltdEvents.slice(0, 3);

  const tixLines = topEvents.map(e => {
    const v = e.venue as Record<string, unknown> || {};
    const dt = e.datetime ? new Date(e.datetime as string) : null;
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dateStr = dt
      ? `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')} (${days[dt.getDay()]}) ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
      : '';
    return `[Sport/Concert] ${e.name} | ${dateStr} | ${v.name || ''}, ${v.city || ''} | from ${e.currency || 'GBP'} ${e.min_ticket_price || 'TBD'}`;
  }).join('\n');

  const ltdLines = topLtd.map(e => {
    return `[Musical/Theatre] ${e.Name} | Ongoing show | London West End | from £${e.EventMinimumPrice || 'TBD'} | ${e.RunningTime || ''}`;
  }).join('\n');

  const allLines = [tixLines, ltdLines].filter(Boolean).join('\n');
  const totalResults = events.length + ltdEvents.length;

  const msg = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 280,
    system: TICKET_PROMPT,
    messages: [{
      role: 'user',
      content: `User asked: "${query}"\n\n${totalResults === 0 ? 'No events found.' : `${totalResults} result(s) found:\n${allLines}`}`,
    }],
  });

  return msg.content[0].type === 'text' ? msg.content[0].text : '';
}

// ============================================================
// Fetch LTD events (for musical/theatre queries)
// ============================================================
async function fetchLtdEvents(searchTerm: string, ltdType: number | null): Promise<Record<string, unknown>[]> {
  try {
    let url = `${LTD_BASE_URL}/Events`;
    if (ltdType) url += `?type=${ltdType}`;

    const res = await fetch(url, {
      headers: { 'Api-Key': LTD_API_KEY, 'Content-Type': 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data = await res.json();
    let events: Record<string, unknown>[] = data.Events || [];

    // Filter by search term if provided
    if (searchTerm && searchTerm.length > 1) {
      const q = searchTerm.toLowerCase();
      const filtered = events.filter(e =>
        ((e.Name as string) || '').toLowerCase().includes(q) ||
        ((e.TagLine as string) || '').toLowerCase().includes(q)
      );
      // Only apply filter if we got results; otherwise return top shows
      if (filtered.length > 0) events = filtered;
    }

    // Keep only shows with prices (available), limit to 10
    return events
      .filter(e => (e.EventMinimumPrice as number) > 0)
      .slice(0, 10);
  } catch {
    return [];
  }
}

// ============================================================
// API Route
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Step 1: Rule-based parsing (0 AI tokens)
    const filters = parseQuery(query);
    const { isLtd, ltdType, searchTerm } = detectLtdKeyword(query);

    // Step 2: Parallel fetch — Tixstock + LTD (if musical)
    const [tixResult, ltdEvents] = await Promise.all([
      // Tixstock fetch
      (async () => {
        const params = new URLSearchParams({ has_listing: 'true', per_page: '50' });
        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);
        if (filters.performer) params.set('performer', filters.performer);
        if (filters.category) params.set('category', filters.category);
        if (filters.city) params.set('city', filters.city);
        if (filters.country) params.set('country', filters.country);

        try {
          const res = await fetch(`${TIXSTOCK_BASE_URL}/feed?${params.toString()}`, {
            headers: { Authorization: `Bearer ${TIXSTOCK_TOKEN}`, 'Content-Type': 'application/json' },
          });
          if (!res.ok) return [];
          const data = await res.json();
          return (data.data || []) as Record<string, unknown>[];
        } catch { return []; }
      })(),
      // LTD fetch (only if musical/theatre query)
      isLtd ? fetchLtdEvents(searchTerm, ltdType) : Promise.resolve([]),
    ]);

    let events = tixResult;

    // Smart keyword filtering
    if (filters.keywords.length > 0 && events.length > 0) {
      const keywords = filters.keywords.map(k => k.toLowerCase());
      const scored = events.map(e => {
        const venueObj = e.venue as Record<string, unknown> || {};
        const allText = [
          (e.name as string) || '', (venueObj.name as string) || '',
          (venueObj.city as string) || '', (venueObj.country as string) || '',
          ...((e.categories as Array<Record<string,string>>) || []).map(c => c.name),
        ].join(' ').toLowerCase();
        const score = keywords.reduce((s, kw) => s + (allText.includes(kw) ? 1 : 0), 0);
        return { event: e, score };
      });
      const matched = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
      if (matched.length > 0) events = matched.map(s => s.event);
    }

    // Category expansion filter
    for (const [key, cats] of Object.entries(CATEGORY_MAP)) {
      if (query.toLowerCase().includes(key.toLowerCase()) && cats.length > 1 && events.length > 0) {
        const catNames = cats.map(c => c.toLowerCase());
        const filtered = events.filter(e => {
          const eCats = ((e.categories as Array<Record<string,string>>) || []).map(c => c.name.toLowerCase());
          return eCats.some(c => catNames.some(cn => c.includes(cn)));
        });
        if (filtered.length > 0) events = filtered;
        break;
      }
    }

    // Performer filtering
    if (filters.performer && events.length > 0) {
      const perfLower = filters.performer.toLowerCase();
      const perfFiltered = events.filter(e => {
        const name = ((e.name as string) || '').toLowerCase();
        return perfLower.split(/\s+/).some(w => w.length > 2 && name.includes(w));
      });
      if (perfFiltered.length > 0) events = perfFiltered;
    }

    // Fallback: retry without city
    if (events.length === 0 && filters.city) {
      try {
        const p = new URLSearchParams({ has_listing: 'true', per_page: '50' });
        if (filters.date_from) p.set('date_from', filters.date_from);
        if (filters.date_to) p.set('date_to', filters.date_to);
        if (filters.category) p.set('category', filters.category);
        const r = await fetch(`${TIXSTOCK_BASE_URL}/feed?${p.toString()}`, {
          headers: { Authorization: `Bearer ${TIXSTOCK_TOKEN}`, 'Content-Type': 'application/json' },
        });
        if (r.ok) { const d = await r.json(); events = d.data || []; }
      } catch { /* ignore */ }
    }

    // Sort by date
    events.sort((a, b) => {
      const da = new Date((a.datetime as string) || '').getTime();
      const db = new Date((b.datetime as string) || '').getTime();
      return da - db;
    });

    // Step 3: AI conversational response (Haiku, 1 call)
    const aiMessage = await buildAiMessage(query, events.slice(0, 10), ltdEvents);

    return NextResponse.json({
      filters,
      summary: filters.summary || '',
      aiMessage,
      events: events.slice(0, 10),
      total: events.length,
      // LTD results (for musical queries)
      ltdEvents: ltdEvents.slice(0, 8),
      ltdTotal: ltdEvents.length,
      isMusicalQuery: isLtd,
    });
  } catch (e) {
    console.error('AI search error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
