import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const { url, mode } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL이 필요합니다' }, { status: 400, headers: CORS });

    // 1. 페이지 fetch
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://www.cruznara.com/',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!pageRes.ok) return NextResponse.json({ error: `HTTP ${pageRes.status}` }, { status: 422, headers: CORS });

    const html = await pageRes.text();
    const baseOrigin = new URL(url).origin;

    // 2. 상품 썸네일 이미지 (슬라이더)
    const thumbImgs: string[] = [];
    const thumbRe = /upload\/cruznara\/image\/goods\/main\/[^"']+\.(?:jpg|jpeg|png|webp)/gi;
    for (const m of html.matchAll(thumbRe)) {
      const abs = baseOrigin + '/' + m[0];
      if (!thumbImgs.includes(abs)) thumbImgs.push(abs);
    }

    // 3. 상품 상세 본문 이미지 (ckeditor)
    const bodyImgs: string[] = [];
    const bodyRe = /(?:src=["'])([^"']*\/upload\/cruznara\/(?:ckeditor|image)[^"']*\.(?:jpg|jpeg|png|gif|webp))["']/gi;
    for (const m of html.matchAll(bodyRe)) {
      const src = m[1];
      const abs = src.startsWith('http') ? src : baseOrigin + src;
      if (!bodyImgs.includes(abs)) bodyImgs.push(abs);
    }

    // 4. 기항지 이미지 (tourinfo)
    const portImgs: string[] = [];
    const portRe = /upload\/cruznara\/image\/tourinfo\/[^"']+\.(?:jpg|jpeg|png|webp)/gi;
    for (const m of html.matchAll(portRe)) {
      const abs = baseOrigin + '/' + m[0];
      if (!portImgs.includes(abs)) portImgs.push(abs);
    }

    // 5. 텍스트 추출
    const cleanText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/\s{3,}/g, '\n').trim().slice(0, 10000);

    // 6. Claude 파싱
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: `크루즈 여행상품 페이지 텍스트에서 정보를 추출해 JSON으로만 응답하세요. 마크다운 없이 순수 JSON만.

{
  "title": "상품명",
  "productNo": "상품번호",
  "cruiseline": "선사명",
  "ship": "선박명",
  "nights": 박수숫자,
  "category": "지중해|알래스카|카리브해|한국일본|북유럽|아시아중동|기타",
  "period": "여행기간 텍스트 (예: 10박11일 06.02~06.12)",
  "departures": [{"date":"YYYY-MM-DD","cabin":"객실타입","priceAdult":성인가격숫자KRW,"priceChild":아동가격숫자KRW}],
  "flightOut": {"airline":"항공사","flightNo":"편명","depTime":"HH:MM","depDate":"날짜","depPort":"출발공항","arrTime":"HH:MM","arrDate":"날짜","arrPort":"도착공항"},
  "flightIn": {"airline":"항공사","flightNo":"편명","depTime":"HH:MM","depDate":"날짜","depPort":"출발공항","arrTime":"HH:MM","arrDate":"날짜","arrPort":"도착공항"},
  "itinerary": [{"day":"1","date":"날짜","city":"도시명","description":"일정 설명"}],
  "included": ["포함사항 배열"],
  "excluded": ["불포함사항 배열"],
  "notice": ["유의사항 배열"]
}

텍스트:
${cleanText}` }],
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: '파싱 실패', raw }, { status: 422, headers: CORS });

    const parsed = JSON.parse(match[0]);

    return NextResponse.json({
      ...parsed,
      thumbImages: thumbImgs.slice(0, 8),
      bodyImages: bodyImgs.slice(0, 20),
      portImages: portImgs.slice(0, 50),
      baseOrigin,
    }, { headers: CORS });

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}
