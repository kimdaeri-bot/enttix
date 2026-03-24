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

// 이미지 URL 품질 점수 (높을수록 상품 이미지일 가능성 높음)
function scoreImage(src: string, url: string): number {
  const s = src.toLowerCase();
  let score = 0;
  // 상품 이미지 키워드
  if (/goods|product|cruise|tour|travel|upload|image|photo|img\d/.test(s)) score += 3;
  // 아이콘/로고/버튼 제외
  if (/icon|logo|btn|button|arrow|banner_\d+x\d+|sprite|blank|pixel|loading|close|star/.test(s)) score -= 5;
  // 확장자
  if (/\.(jpg|jpeg|png|webp)(\?|$)/.test(s)) score += 2;
  if (/\.gif$/.test(s)) score -= 2;
  // 외부 CDN
  if (s.includes('data:')) return -99;
  // 크루즈 관련 도메인
  try {
    const base = new URL(url).hostname;
    const imgHost = src.startsWith('http') ? new URL(src).hostname : base;
    if (imgHost === base || imgHost.includes('cdn') || imgHost.includes('static') || imgHost.includes('assets')) score += 1;
  } catch {}
  return score;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL이 필요합니다' }, { status: 400, headers: CORS });

    // 1. 페이지 fetch
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': new URL(url).origin + '/',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!pageRes.ok) return NextResponse.json({ error: `페이지 로드 실패: HTTP ${pageRes.status}` }, { status: 422, headers: CORS });

    const html = await pageRes.text();
    const baseOrigin = new URL(url).origin;

    // 2. 범용 이미지 추출 — src 전체 스캔 후 점수 기반 필터링
    const allImgMap = new Map<string, number>();
    const imgRe = /(?:src|data-src|data-lazy|data-original)=["']([^"']{10,})["']/gi;
    for (const m of html.matchAll(imgRe)) {
      const raw = m[1];
      if (raw.startsWith('data:')) continue;
      const abs = raw.startsWith('http') ? raw : raw.startsWith('//') ? 'https:' + raw : baseOrigin + (raw.startsWith('/') ? raw : '/' + raw);
      const score = scoreImage(abs, url);
      if (score > 0) {
        allImgMap.set(abs, Math.max(allImgMap.get(abs) || 0, score));
      }
    }

    // 점수 내림차순 정렬
    const sortedImgs = [...allImgMap.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);

    // 썸네일(상단 슬라이더용) — 상위 8개
    const thumbImages = sortedImgs.slice(0, 8);
    // 본문 이미지 — 상위 30개 (ckeditor, 상품소개 등)
    const bodyImages = sortedImgs.slice(0, 30);

    // 3. 텍스트 추출
    const cleanText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#\d+;/g, '')
      .replace(/\s{3,}/g, '\n').trim()
      .slice(0, 12000);

    // 4. Claude 파싱 — 완전 범용 프롬프트
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: `아래는 크루즈·여행 상품 페이지의 텍스트입니다. 어떤 여행사 사이트든 관계없이 정보를 추출해 JSON으로만 응답하세요. 마크다운 없이 순수 JSON만.

{
  "title": "상품명 (페이지 제목에서 추출, 없으면 빈 문자열)",
  "productNo": "상품번호 또는 상품코드 (없으면 빈 문자열)",
  "cruiseline": "선사명 (MSC, NCL, Royal Caribbean 등, 없으면 빈 문자열)",
  "ship": "선박명 (없으면 빈 문자열)",
  "nights": 숙박일수(숫자, 없으면 0),
  "category": "지중해|알래스카|카리브해|한국일본|북유럽|아시아중동|기타 중 가장 적합한 것",
  "period": "여행기간 텍스트 (예: 10박11일, 06.02~06.12)",
  "departures": [
    {"date":"YYYY-MM-DD 또는 날짜 텍스트","cabin":"객실타입","priceAdult":성인가격숫자(원화),"priceChild":아동가격숫자(원화)}
  ],
  "flightOut": {"airline":"항공사","flightNo":"편명","depTime":"HH:MM","depDate":"날짜텍스트","depPort":"출발공항","arrTime":"HH:MM","arrDate":"날짜텍스트","arrPort":"도착공항"},
  "flightIn": {"airline":"항공사","flightNo":"편명","depTime":"HH:MM","depDate":"날짜텍스트","depPort":"출발공항","arrTime":"HH:MM","arrDate":"날짜텍스트","arrPort":"도착공항"},
  "itinerary": [
    {"day":"1","date":"날짜텍스트","city":"도시명","description":"일정 설명"}
  ],
  "included": ["포함사항 항목 배열"],
  "excluded": ["불포함사항 항목 배열"],
  "notice": ["유의사항 항목 배열"],
  "desc": "상품 한줄 요약 (100자 이내)"
}

주의:
- 항공편 정보 없으면 flightOut/flightIn은 빈 객체 {}
- 가격 없으면 0, 날짜 없으면 빈 문자열
- 순수 JSON만 출력, 다른 텍스트 절대 금지

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
      thumbImages,
      bodyImages,
      baseOrigin,
    }, { headers: CORS });

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}
