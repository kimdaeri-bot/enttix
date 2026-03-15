import { NextRequest, NextResponse } from 'next/server';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

export async function GET(req: NextRequest) {
  const basketId = req.nextUrl.searchParams.get('basketId');
  if (!basketId) return NextResponse.json({ error: 'basketId required' }, { status: 400 });

  try {
    const [pahRes, etixRes] = await Promise.allSettled([
      fetch(`${LTD_BASE_URL}/Baskets/${basketId}/PrintAtHomeTickets`, {
        headers: { 'Api-Key': LTD_API_KEY },
      }),
      fetch(`${LTD_BASE_URL}/Baskets/${basketId}/ETickets`, {
        headers: { 'Api-Key': LTD_API_KEY },
      }),
    ]);

    let printAtHome = null;
    let etickets = null;
    let pahRaw = null;
    let etixRaw = null;

    if (pahRes.status === 'fulfilled') {
      pahRaw = { status: pahRes.value.status };
      if (pahRes.value.ok) {
        const data = await pahRes.value.json();
        printAtHome = data;
      } else {
        pahRaw = { status: pahRes.value.status, body: await pahRes.value.text().catch(() => '') };
      }
    }

    if (etixRes.status === 'fulfilled') {
      etixRaw = { status: etixRes.value.status };
      if (etixRes.value.ok) {
        const data = await etixRes.value.json();
        etickets = data;
      } else {
        etixRaw = { status: etixRes.value.status, body: await etixRes.value.text().catch(() => '') };
      }
    }

    return NextResponse.json({ printAtHome, etickets, debug: { pahRaw, etixRaw } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
