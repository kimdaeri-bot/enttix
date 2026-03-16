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
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image' }, { status: 400, headers: CORS });
    }

    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
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
            text: `이 이미지는 유럽 철도 예약 확인서 또는 스케줄 이미지입니다.
이미지에서 각 기차 구간의 정보를 정확하게 추출하여 아래 JSON 형식으로만 응답하세요.
설명 없이 순수 JSON만 출력하세요. 마크다운 코드블록도 사용하지 마세요.

{
  "routes": [
    {
      "trainNumber": "기차 편명 (예: ES 9021, ICE 123, TGV 6231, Thalys 9322)",
      "fromStation": "출발역 전체명 (예: London St Pancras International)",
      "fromCity": "출발 도시 (예: London)",
      "toStation": "도착역 전체명 (예: Paris Gare du Nord)",
      "toCity": "도착 도시 (예: Paris)",
      "date": "YYYY-MM-DD 형식 출발일",
      "departureTime": "HH:MM 형식 출발시간",
      "arrivalTime": "HH:MM 형식 도착시간",
      "duration": "소요시간 (예: 2h 16m)",
      "class": "좌석 등급 (Standard / Standard Premier / Business Premier / First 등 이미지에서 읽은 그대로)",
      "pax": 인원수(숫자, 없으면 1),
      "pricePerPax": 1인당금액(숫자, 통화기호 제외, 없으면 0),
      "note": "추가 메모 또는 좌석번호 (없으면 빈 문자열)"
    }
  ],
  "currency": "통화코드 (EUR/GBP/USD/CHF, 없으면 EUR)",
  "exchangeRate": null
}

주의사항:
- 여러 구간이 있으면 routes 배열에 모두 포함
- 읽을 수 없는 항목은 빈 문자열("") 또는 0으로 처리
- 반드시 JSON만 출력, 다른 텍스트 절대 포함 금지`,
          },
        ],
      }],
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    // 코드블록 제거
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'Parse failed', raw }, { status: 422, headers: CORS });
    }
    const parsed = JSON.parse(match[0]);
    return NextResponse.json(parsed, { headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}
