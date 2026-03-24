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
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL이 필요합니다' }, { status: 400, headers: CORS });
    }

    // 1. 페이지 HTML fetch
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!pageRes.ok) {
      return NextResponse.json({ error: `페이지 로드 실패: HTTP ${pageRes.status}` }, { status: 422, headers: CORS });
    }

    const html = await pageRes.text();

    // 2. 이미지 URL 추출 (img src 패턴)
    const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
    const baseUrl = new URL(url);
    const images: string[] = [];
    for (const m of imgMatches) {
      const src = m[1];
      if (!src || src.startsWith('data:')) continue;
      // 아이콘/로고/버튼 등 제외 (작은 이미지)
      if (src.includes('icon') || src.includes('logo') || src.includes('btn') || src.includes('arrow')) continue;
      // 절대경로 변환
      const absUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
      if (!images.includes(absUrl)) images.push(absUrl);
      if (images.length >= 5) break;
    }

    // 3. HTML → 텍스트 변환 (태그 제거)
    const plainText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s{3,}/g, '\n')
      .trim()
      .slice(0, 8000); // Claude 입력 제한

    // 4. Claude로 구조화 파싱
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `아래는 크루즈 여행상품 페이지의 텍스트입니다.
이 내용을 분석해서 아래 JSON 형식으로만 응답하세요. 마크다운이나 설명 없이 순수 JSON만 출력하세요.

{
  "title": "상품명 (예: 지중해 이탈리아·그리스 9박 크루즈)",
  "cruiseline": "선사명 (예: MSC Cruises, Norwegian Cruise Line 등)",
  "ship": "선박명 (예: MSC Bellissima)",
  "nights": 박수(숫자),
  "category": "지중해|알래스카|카리브해|한국일본|북유럽|아시아중동|기타 중 하나",
  "desc": "상품 한 줄 설명 (100자 이내)",
  "departures": ["YYYY-MM-DD 형식 출발일 배열"],
  "fares": [
    { "type": "객실 타입 (예: 인사이드, 오션뷰, 발코니, 스위트)", "price": 숫자(원화면 0으로), "priceKRW": 숫자(원화 가격), "note": "비고" }
  ],
  "itinerary": [
    { "day": "1", "port": "항구/도시명", "arrive": "", "depart": "", "note": "" }
  ],
  "included": ["포함사항 배열"],
  "excluded": ["불포함사항 배열"]
}

주의:
- 날짜는 반드시 YYYY-MM-DD 형식
- 가격이 원화(KRW)이면 priceKRW에 숫자만, price는 0
- 일정 정보가 없으면 itinerary는 빈 배열
- 순수 JSON만 출력, 다른 텍스트 절대 금지

페이지 텍스트:
${plainText}`,
      }],
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: '파싱 실패', raw }, { status: 422, headers: CORS });
    }

    const parsed = JSON.parse(match[0]);

    // 5. 이미지 병합 (파싱된 이미지 + HTML에서 추출한 이미지)
    const finalImages = [...new Set([...(parsed.images || []), ...images])].slice(0, 5);

    return NextResponse.json({ ...parsed, images: finalImages }, { headers: CORS });

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}
