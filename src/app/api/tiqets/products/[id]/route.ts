import { NextRequest, NextResponse } from 'next/server';

const TIQETS_TOKEN = process.env.TIQETS_TOKEN!;
const BASE_URL = 'https://api.tiqets.com/v2';
const tiqetsHeaders = {
  'Authorization': `Token ${TIQETS_TOKEN}`,
  'User-Agent': 'Enttix',
  'Accept': 'application/json',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [productRes, variantsRes] = await Promise.all([
    fetch(`${BASE_URL}/products/${id}?currency=USD&lang=en`, { headers: tiqetsHeaders }),
    fetch(`${BASE_URL}/products/${id}/product-variants?lang=en`, { headers: tiqetsHeaders }),
  ]);
  const productData = await productRes.json();
  const variantsData = await variantsRes.json();
  return NextResponse.json({
    product: productData.product,
    variants: variantsData.variants || [],
  });
}
