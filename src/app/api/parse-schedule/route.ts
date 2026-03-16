import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType || 'image/png', data: imageBase64 },
          },
          {
            type: 'text',
            text: `이 이미지는 유럽 철도(기차) 예약 스케줄 또는 일정표입니다.
이미지에서 각 기차 구간 정보를 추출하여 아래 JSON 형식으로만 응답하세요.
설명 없이 JSON만 출력하세요.

{
  "routes": [
    {
      "trainNumber": "기차편명 (예: ES 9021, ICE 123, TGV 6231)",
      "fromStation": "출발역",
      "toStation": "도착역",
      "date": "YYYY-MM-DD",
      "departureTime": "HH:MM",
      "arrivalTime": "HH:MM",
      "class": "좌석 등급 (Standard / Business / First 등)",
      "pax": 인원수(숫자),
      "pricePerPax": 1인당금액(숫자, 통화기호 제외),
      "note": "추가 메모 (없으면 빈 문자열)"
    }
  ],
  "currency": "통화코드 (EUR/GBP/USD/CHF)",
  "exchangeRate": 환율숫자_또는_null
}

- 이미지에서 읽을 수 없는 필드는 빈 문자열("") 또는 0으로 처리
- 여러 구간이 있으면 routes 배열에 모두 포함
- 반드시 JSON만 출력, 다른 텍스트 없음`,
          },
        ],
      }],
    });

    const text = (msg.content[0] as { type: string; text: string }).text.trim();
    // JSON 추출
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: 'Parse failed', raw: text }, { status: 422 });
    const parsed = JSON.parse(match[0]);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
