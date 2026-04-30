import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'kimdaeri-bot/private-docs';
const PATH = 'apg-data.json';
const API = `https://api.github.com/repos/${REPO}/contents/${PATH}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const res = await fetch(API, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
    });
    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    return NextResponse.json(content, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: 'Empty data not allowed' }, { status: 400, headers: corsHeaders });
    }
    const getRes = await fetch(API, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
    });
    const existing = await getRes.json();
    const content = Buffer.from(JSON.stringify(body, null, 2), 'utf-8').toString('base64');
    const putRes = await fetch(API, {
      method: 'PUT',
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'update apg-data', content, sha: existing.sha }),
    });
    if (!putRes.ok) {
      const err = await putRes.text();
      return NextResponse.json({ error: err }, { status: 500, headers: corsHeaders });
    }
    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500, headers: corsHeaders });
  }
}
