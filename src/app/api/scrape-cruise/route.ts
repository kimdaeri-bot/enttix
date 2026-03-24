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

    // 2-1. cruznara 전용: goodSeq+eventSeq 있으면 일정 API 직접 호출
    let crzItinerary: Array<{day:string,date:string,city:string,description:string,images:string[]}> = [];
    try {
      const urlObj = new URL(url);
      const goodSeq = urlObj.searchParams.get('goodSeq');
      const eventSeq = urlObj.searchParams.get('eventSeq');
      if (goodSeq && eventSeq && urlObj.hostname.includes('cruznara')) {
        const schedRes = await fetch(
          `${baseOrigin}/goods/getEventScheduleList.json?goodSeq=${goodSeq}&eventSeq=${eventSeq}`,
          { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': url }, signal: AbortSignal.timeout(10000) }
        );
        if (schedRes.ok) {
          const schedData = await schedRes.json();
          const list: Array<Record<string,unknown>> = schedData.list || [];
          // dayCnt 기준으로 그룹핑
          const dayMap = new Map<number, Array<Record<string,unknown>>>();
          for (const item of list) {
            const d = Number(item.dayCnt) || 1;
            if (!dayMap.has(d)) dayMap.set(d, []);
            dayMap.get(d)!.push(item);
          }
          for (const [dayCnt, items] of [...dayMap.entries()].sort((a,b)=>a[0]-b[0])) {
            const cityNm = String(items[0].cityNm || items[0].travelDayNm || '').trim();
            const travelDay = String(items[0].travelDay || '').trim();
            const desc = items
              .map(it => String(it.detailConts || ''))
              .join('\n')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&nbsp;/g, ' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
              .replace(/\n{3,}/g, '\n\n').trim();
            crzItinerary.push({ day: String(dayCnt), date: travelDay, city: cityNm, description: desc, images: [] });
          }
        }
      }
    } catch {}

    // 3. 텍스트 정제 함수
    const stripHtml = (s: string) => s
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#\d+;/g, '')
      .replace(/\s{3,}/g, '\n').trim();

    // 전체 텍스트 (기본 정보 + 항공 + 포함사항 등)
    const fullText = stripHtml(html);
    const summaryText = fullText.slice(0, 8000);

    // 일정 전용 텍스트 추출 — 일정 섹션을 HTML에서 직접 찾아 별도 추출
    let itinText = '';
    // 패턴 1: tab_cont_content_row (cruznara 등)
    const tabMatch = html.match(/class="tab_cont_content_row[^"]*"[^>]*>([\s\S]{200,15000}?)<\/div>\s*(?:<div|<\/div)/i);
    if (tabMatch) {
      itinText = stripHtml(tabMatch[1]).slice(0, 12000);
    }
    // 패턴 2: "일정표" 이후 ~ "선택관광|유의사항|이용후기" 이전 텍스트
    if (!itinText) {
      const itinSection = fullText.match(/일정표\s*([\s\S]{100,}?)(?:선택관광|유의사항|이용후기|포함사항|불포함|$)/);
      if (itinSection) itinText = itinSection[1].slice(0, 10000);
    }
    // 패턴 3: "1일차" 또는 "Day 1" 이후 전체 일정 텍스트
    if (!itinText) {
      const dayMatch = fullText.match(/((?:1일차|Day\s*1|제\s*1\s*일)[\s\S]{100,})/i);
      if (dayMatch) itinText = dayMatch[1].slice(0, 10000);
    }
    // 패턴 4: 없으면 fullText 뒷부분 (앞 8000자 이후)
    if (!itinText && fullText.length > 8000) {
      itinText = fullText.slice(8000, 20000);
    }

    // 4. Claude 파싱 — 두 텍스트 구간 분리 전달
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: `아래는 크루즈·여행 상품 페이지에서 추출한 텍스트입니다.
[상품 요약 텍스트]와 [일정 텍스트] 두 구간으로 나누어 제공합니다.
정보를 빠짐없이 추출해 JSON으로만 응답하세요. 마크다운 없이 순수 JSON만.

{
  "title": "상품명",
  "productNo": "상품번호 (없으면 빈 문자열)",
  "cruiseline": "선사명",
  "ship": "선박명",
  "nights": 숙박일수(숫자),
  "category": "지중해|알래스카|카리브해|한국일본|북유럽|아시아중동|기타",
  "period": "여행기간 텍스트",
  "departures": [{"date":"날짜","cabin":"객실타입","priceAdult":성인가격(원화숫자),"priceChild":아동가격(원화숫자)}],
  "flightOut": {"airline":"","flightNo":"","depTime":"HH:MM","depDate":"","depPort":"","arrTime":"HH:MM","arrDate":"","arrPort":""},
  "flightIn":  {"airline":"","flightNo":"","depTime":"HH:MM","depDate":"","depPort":"","arrTime":"HH:MM","arrDate":"","arrPort":""},
  "itinerary": [
    {"day":"1","date":"날짜 (예: 06/02(화))","city":"도시명/항구명","description":"이 일차의 모든 일정 내용을 줄바꿈\\n으로 구분해 최대한 상세히"}
  ],
  "included": ["포함사항 배열"],
  "excluded": ["불포함사항 배열"],
  "notice": ["유의사항 배열"],
  "desc": "한줄 요약 100자 이내"
}

규칙:
- itinerary: [일정 텍스트]에서 1일차~마지막일차 모두 추출. description은 해당 일차 전체 내용 상세히.
- 항공 없으면 flightOut/flightIn = {}
- 가격 없으면 0, 날짜 없으면 빈 문자열
- 순수 JSON만 출력

=== [상품 요약 텍스트] ===
${summaryText}

=== [일정 텍스트] ===
${itinText || '(일정 텍스트 없음)'}` }],
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: '파싱 실패', raw }, { status: 422, headers: CORS });

    const parsed = JSON.parse(match[0]);

    // cruznara API로 가져온 일정이 있으면 Claude 파싱 결과보다 우선
    const finalItinerary = crzItinerary.length > 0 ? crzItinerary : (parsed.itinerary || []);

    return NextResponse.json({
      ...parsed,
      itinerary: finalItinerary,
      thumbImages,
      bodyImages,
      baseOrigin,
    }, { headers: CORS });

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}
