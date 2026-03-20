import { NextRequest, NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO = 'kimdaeri-bot/cruiselink-v2';
const FILE_PATH = 'blog-draft/data/reports.json';
const API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

async function getFile(): Promise<{ content: unknown[]; sha: string }> {
  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
    next: { revalidate: 0 },
  });
  const data = await res.json() as { content?: string; sha?: string; message?: string };
  if (data.message) throw new Error(data.message);
  const decoded = Buffer.from(data.content!.replace(/\n/g, ''), 'base64').toString('utf-8');
  return { content: JSON.parse(decoded), sha: data.sha! };
}

async function saveFile(content: unknown[], sha: string): Promise<void> {
  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: `chore: update sales reports`, content: encoded, sha }),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// GET: 리포트 목록 조회
export async function GET() {
  try {
    const { content } = await getFile();
    return NextResponse.json(content, { headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}

// POST: 리포트 저장 (upsert by id)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, month, year, savedAt, data } = body;
    if (!id || !title) return NextResponse.json({ error: 'id, title required' }, { status: 400, headers: CORS });

    const { content: list, sha } = await getFile();
    const arr = list as Array<{ id: string; title: string; month: string; year: string; savedAt: string; data: unknown }>;
    const idx = arr.findIndex((r) => String(r.id) === String(id));
    const entry = { id: String(id), title, month, year, savedAt, data };
    if (idx >= 0) arr[idx] = entry;
    else arr.push(entry);
    // 최신순 정렬 (savedAt 기준)
    arr.sort((a, b) => String(b.id).localeCompare(String(a.id)));

    await saveFile(arr, sha);
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}

// DELETE: 리포트 삭제 (?id=xxx)
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400, headers: CORS });
    const { content: list, sha } = await getFile();
    const arr = (list as Array<{ id: string }>).filter((r) => String(r.id) !== String(id));
    await saveFile(arr, sha);
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}
