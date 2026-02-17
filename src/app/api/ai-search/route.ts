import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const TIXSTOCK_BASE_URL = process.env.TIXSTOCK_BASE_URL!;
const TIXSTOCK_TOKEN = process.env.TIXSTOCK_TOKEN!;

const PARSE_PROMPT = `You are a search query parser for a sports/concert ticket marketplace called Enttix.
Convert natural language queries into structured JSON filters.

Current year is 2026. Today's date is ${new Date().toISOString().split('T')[0]}.

Supported categories:
Sports: English Premier League, Spanish La Liga, German Bundesliga, Italian Serie A, French Ligue 1, Champions League, Formula 1, NBA, Tennis, Golf, Rugby, Cricket, MotoGP, Boxing, UFC
Concerts: Pop, Rock, Rap/Hip-hop, R&B, Country, Latin, Alternative, Electronic, Soul, Classical, Jazz, Metal, Reggae, Blues

Rules:
- Month without year → assume 2026
- "football"/"soccer"/"축구" → football categories
- "Europe"/"유럽" → use keywords
- Support Korean and English

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

"summary" = brief description in the user's language. Leave empty fields as "" or null. Dates as YYYY-MM-DD.`;

const RECOMMEND_PROMPT = `You are Enttix AI, a friendly and knowledgeable ticket concierge for a premium sports & entertainment ticket marketplace.

Your job: Given a user's search query and the matching events found, write a warm, helpful recommendation message.

Style:
- Conversational, enthusiastic but not over-the-top
- Match the user's language (Korean query → Korean response, English → English)
- Mention specific events by name, dates, prices when available
- If few/no results: suggest alternatives or broader searches
- Keep it concise (2-4 sentences max)
- Use emoji sparingly (1-2 max)
- If the user seems like a first-timer, be extra welcoming

Do NOT include any JSON or technical details. Just a natural human-like recommendation message.`;

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Step 1: Parse query into filters
    const parseMsg = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      system: PARSE_PROMPT,
      messages: [{ role: 'user', content: query }],
    });

    const parseText = parseMsg.content[0].type === 'text' ? parseMsg.content[0].text : '';
    let filters;
    try {
      filters = JSON.parse(parseText);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: parseText }, { status: 500 });
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

    // Keyword filtering
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

    // Step 3: Generate AI recommendation message
    const eventSummaries = events.slice(0, 5).map((e: Record<string, unknown>) => {
      const venue = e.venue as Record<string, unknown> || {};
      return `- ${e.name} | ${e.datetime} | ${venue.city || ''} | ${e.currency || 'USD'} ${e.min_ticket_price || 'N/A'}`;
    }).join('\n');

    const recommendMsg = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: RECOMMEND_PROMPT,
      messages: [{
        role: 'user',
        content: `User query: "${query}"
Found ${events.length} events:
${eventSummaries || '(No events found)'}

Write a recommendation message for this user.`,
      }],
    });

    const aiMessage = recommendMsg.content[0].type === 'text' ? recommendMsg.content[0].text : '';

    return NextResponse.json({
      filters,
      summary: filters.summary || '',
      aiMessage,
      events,
      total: events.length,
    });
  } catch (e) {
    console.error('AI search error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
