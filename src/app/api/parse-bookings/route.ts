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
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: 'No image' }, { status: 400, headers: CORS });

    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: (mediaType || 'image/png') as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `이 이미지는 크루즈 여행사 예약 내역 엑셀 스크린샷입니다.
이미지에서 각 예약 행의 데이터를 추출하여 아래 JSON 형식으로만 응답하세요.
마크다운 코드블록 없이 순수 JSON만 출력하세요.

{
  "bookings": [
    {
      "date": "YYYY-MM-DD (예약일자)",
      "line": "선사명",
      "bookingNo": "BOOKING# 번호",
      "sailDate": "YYYY-MM-DD (승선일)",
      "ship": "선박명",
      "cabin": "CABIN TYPE",
      "fare": 숫자(CABIN FARE, 없으면 0),
      "savings": 숫자(SAVINGS, 없으면 0),
      "ncf": 숫자(NCF, 없으면 0),
      "tax": 숫자(TAX, 없으면 0),
      "others": 숫자(OTHERS 합계, 없으면 0),
      "grossFare": 숫자(Gross Fare 합계, 없으면 자동계산),
      "comm": 숫자(COMM, 없으면 0)
    }
  ],
  "summary": {
    "totalGross": 합계숫자,
    "totalComm": 합계숫자
  }
}

- Total 행은 제외하고 개별 예약 행만 포함
- 읽을 수 없는 값은 0 또는 빈 문자열
- 반드시 JSON만 출력`,
          },
        ],
      }],
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: 'Parse failed', raw }, { status: 422, headers: CORS });
    return NextResponse.json(JSON.parse(match[0]), { headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}
