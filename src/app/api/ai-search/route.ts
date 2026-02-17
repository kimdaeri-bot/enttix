import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const TIXSTOCK_BASE_URL = process.env.TIXSTOCK_BASE_URL!;
const TIXSTOCK_TOKEN = process.env.TIXSTOCK_TOKEN!;

const SYSTEM_PROMPT = `You are a search query parser for a ticket marketplace. Convert natural language queries into structured JSON filters.

Current year is 2026. Today's date is ${new Date().toISOString().split('T')[0]}.

Supported categories (use exact names for the "category" field):
Sports: English Premier League, Spanish La Liga, German Bundesliga, Italian Serie A, French Ligue 1, Champions League, Formula 1, NBA, Tennis, Golf, Rugby, Cricket, MotoGP, Boxing, UFC
Concerts: Pop, Rock, Rap/Hip-hop, R&B, Country, Latin, Alternative, Electronic, Soul, Classical, Jazz, Metal, Reggae, Blues

When the user mentions a month without a year, assume 2026.
When the user says "football" or "soccer" or "축구", map to relevant football categories.
When the user mentions "Europe" or "유럽", set country to European countries or leave empty and use keywords.
Support both Korean and English queries.

Return ONLY valid JSON (no markdown, no explanation) in this format:
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

The "summary" field should be a brief human-readable description of what the user is looking for, in the same language as the query.
Leave fields empty string or null if not specified. For date fields use YYYY-MM-DD format.`;

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Call Claude Haiku to parse the query
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: query }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    let filters;
    try {
      filters = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
    }

    // Build Tixstock API params from filters
    const params = new URLSearchParams({ has_listing: 'true', per_page: '50' });
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.performer) params.set('performer', filters.performer);
    if (filters.category) params.set('category', filters.category);
    if (filters.city) params.set('city', filters.city);
    if (filters.country) params.set('country', filters.country);
    if (filters.venue) params.set('venue', filters.venue);

    // Fetch from Tixstock
    const feedRes = await fetch(`${TIXSTOCK_BASE_URL}/feed?${params.toString()}`, {
      headers: { Authorization: `Bearer ${TIXSTOCK_TOKEN}`, 'Content-Type': 'application/json' },
    });

    let events: Record<string, unknown>[] = [];
    if (feedRes.ok) {
      const feedData = await feedRes.json();
      events = feedData.data || [];
    }

    // Client-side keyword filtering if we have keywords
    if (filters.keywords && filters.keywords.length > 0 && events.length > 0) {
      const keywords = filters.keywords.map((k: string) => k.toLowerCase());
      events = events.filter((e: Record<string, unknown>) => {
        const name = ((e.name as string) || '').toLowerCase();
        const venue = ((e.venue as Record<string, unknown>)?.name as string || '').toLowerCase();
        const city = ((e.venue as Record<string, unknown>)?.city as string || '').toLowerCase();
        const cats = ((e.categories as Array<Record<string, string>>) || []).map(c => c.name.toLowerCase());
        const allText = [name, venue, city, ...cats].join(' ');
        return keywords.some((kw: string) => allText.includes(kw));
      });
    }

    return NextResponse.json({
      filters,
      summary: filters.summary || '',
      events,
      total: events.length,
    });
  } catch (e) {
    console.error('AI search error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
