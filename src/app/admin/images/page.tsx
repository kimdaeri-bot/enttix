'use client';
import { useState, useEffect } from 'react';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/* 35개 도시 목록 */
const CITIES = [
  { id: 67458,  name: 'London',      slug: 'london' },
  { id: 66746,  name: 'Paris',       slug: 'paris' },
  { id: 66342,  name: 'Barcelona',   slug: 'barcelona' },
  { id: 71631,  name: 'Rome',        slug: 'rome' },
  { id: 75061,  name: 'Amsterdam',   slug: 'amsterdam' },
  { id: 60005,  name: 'Dubai',       slug: 'dubai' },
  { id: 78125,  name: 'Singapore',   slug: 'singapore' },
  { id: 64162,  name: 'Prague',      slug: 'prague' },
  { id: 66254,  name: 'Madrid',      slug: 'madrid' },
  { id: 60335,  name: 'Vienna',      slug: 'vienna' },
  { id: 260932, name: 'New York',    slug: 'new-york' },
  { id: 72181,  name: 'Tokyo',       slug: 'tokyo' },
  { id: 79079,  name: 'Istanbul',    slug: 'istanbul' },
  { id: 71854,  name: 'Florence',    slug: 'florence' },
  { id: 76528,  name: 'Lisbon',      slug: 'lisbon' },
  { id: 71510,  name: 'Venice',      slug: 'venice' },
  { id: 65144,  name: 'Berlin',      slug: 'berlin' },
  { id: 71749,  name: 'Milan',       slug: 'milan' },
  { id: 46,     name: 'Krakow',      slug: 'krakow' },
  { id: 60400,  name: 'Sydney',      slug: 'sydney' },
  { id: 99239,  name: 'Athens',      slug: 'athens' },
  { id: 78586,  name: 'Bangkok',     slug: 'bangkok' },
  { id: 21,     name: 'Edinburgh',   slug: 'edinburgh' },
  { id: 68616,  name: 'Dublin',      slug: 'dublin' },
  { id: 74040,  name: 'Mexico City', slug: 'mexico-city' },
  { id: 31,     name: 'Munich',      slug: 'munich' },
  { id: 68199,  name: 'Budapest',    slug: 'budapest' },
  { id: 60843,  name: 'Brussels',    slug: 'brussels' },
  { id: 82923,  name: 'Cape Town',   slug: 'cape-town' },
  { id: 65792,  name: 'Cairo',       slug: 'cairo' },
  { id: 267738, name: 'Bali',        slug: 'bali' },
  { id: 60844,  name: 'Bruges',      slug: 'bruges' },
  { id: 28,     name: 'Osaka',       slug: 'osaka' },
  { id: 72420,  name: 'Kyoto',       slug: 'kyoto' },
  { id: 73067,  name: 'Seoul',       slug: 'seoul' },
];

interface CityStats { city_id: number; count: number }
interface ScrapeResult {
  processed?: number; scraped_new?: number; from_api?: number;
  failed?: number; saved?: number; already_in_db?: number; total_products?: number; error?: string;
}
interface ManualProduct { id: number; title: string; product_url?: string }

export default function AdminImagesPage() {
  const [stats,        setStats]        = useState<Map<number, number>>(new Map());
  const [loadingStats, setLoadingStats] = useState(true);
  const [scraping,     setScraping]     = useState<Record<number, boolean>>({});
  const [results,      setResults]      = useState<Record<number, ScrapeResult>>({});

  // 수동 업로드
  const [manualCityId,    setManualCityId]    = useState('');
  const [manualProducts,  setManualProducts]  = useState<ManualProduct[]>([]);
  const [manualLoading,   setManualLoading]   = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ManualProduct | null>(null);
  const [manualImageUrl,  setManualImageUrl]  = useState('');
  const [saving,          setSaving]          = useState(false);
  const [saveMsg,         setSaveMsg]         = useState('');

  /* DB 통계 로드 */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/tiqets_images?select=city_id&limit=10000`,
          { headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY } }
        );
        if (!res.ok) return;
        const rows: { city_id: number }[] = await res.json();
        const m = new Map<number, number>();
        rows.forEach(r => m.set(r.city_id, (m.get(r.city_id) || 0) + 1));
        setStats(m);
      } finally {
        setLoadingStats(false);
      }
    })();
  }, []);

  const totalImages = [...stats.values()].reduce((s, v) => s + v, 0);

  /* 도시 스크래핑 실행 */
  const scrapeCity = async (cityId: number) => {
    setScraping(s => ({ ...s, [cityId]: true }));
    setResults(r => ({ ...r, [cityId]: {} }));
    try {
      const res = await fetch(
        `/api/tiqets/batch-scrape?city_id=${cityId}&limit=100&offset=0`,
        { method: 'POST' }
      );
      const data = await res.json();
      setResults(r => ({ ...r, [cityId]: data }));
      // stats 갱신
      if (data.saved > 0) {
        setStats(m => {
          const nm = new Map(m);
          nm.set(cityId, (nm.get(cityId) || 0) + data.saved);
          return nm;
        });
      }
    } catch (e) {
      setResults(r => ({ ...r, [cityId]: { error: String(e) } }));
    } finally {
      setScraping(s => ({ ...s, [cityId]: false }));
    }
  };

  /* 수동 업로드 - 도시 상품 목록 로드 (서버 API 경유) */
  const loadProducts = async () => {
    if (!manualCityId) return;
    setManualLoading(true);
    setManualProducts([]);
    setSelectedProduct(null);
    try {
      const res  = await fetch(`/api/tiqets/products-list?city_id=${manualCityId}`);
      const data = await res.json();
      setManualProducts(data.products || []);
    } catch {}
    setManualLoading(false);
  };

  /* 수동 이미지 저장 */
  const saveManual = async () => {
    if (!selectedProduct || !manualImageUrl.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tiqets_images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify([{
          product_id: selectedProduct.id,
          image_url: manualImageUrl.trim(),
          city_id: parseInt(manualCityId),
          source: 'manual',
        }]),
      });
      if (res.ok) {
        setSaveMsg(`✅ Saved: ${selectedProduct.title}`);
        setManualImageUrl('');
        setSelectedProduct(null);
        setStats(m => {
          const nm = new Map(m);
          nm.set(parseInt(manualCityId), (nm.get(parseInt(manualCityId)) || 0) + 1);
          return nm;
        });
      } else {
        setSaveMsg('❌ 저장 실패 (SUPABASE_SERVICE_ROLE_KEY 필요)');
      }
    } catch { setSaveMsg('❌ 에러 발생'); }
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-[1200px]">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-[24px] font-extrabold text-[#0F172A]">🖼️ Tiqets Image Manager</h1>
        <p className="text-[#6B7280] text-[14px] mt-1">
          Supabase DB에 저장된 이미지: <span className="font-bold text-[#0F172A]">{totalImages.toLocaleString()}</span>개
          {loadingStats && <span className="ml-2 text-[12px]">Loading...</span>}
        </p>
      </div>

      {/* ── 도시별 스크래핑 ── */}
      <section className="mb-10">
        <h2 className="text-[16px] font-bold text-[#0F172A] mb-4">자동 스크래핑 (도시별)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CITIES.map(city => {
            const count = stats.get(city.id) || 0;
            const res   = results[city.id];
            const isScraping = scraping[city.id];
            return (
              <div key={city.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-[14px] text-[#0F172A]">{city.name}</p>
                    <p className="text-[12px] text-[#6B7280]">
                      DB: <span className={count > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{count}</span>개
                    </p>
                  </div>
                  <button
                    onClick={() => scrapeCity(city.id)}
                    disabled={isScraping}
                    className="px-3 py-1.5 rounded-lg bg-[#2B7FFF] text-white text-[12px] font-semibold hover:bg-[#1D6AE5] disabled:opacity-50 transition-colors"
                  >
                    {isScraping ? '⏳ 실행중...' : '▶ Scrape'}
                  </button>
                </div>
                {res && (
                  <div className={`text-[11px] rounded-lg p-2 mt-1 ${res.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
                    {res.error
                      ? `❌ ${res.error}`
                      : `✓ 저장 ${res.saved}개 | 스크래핑 ${res.scraped_new}개 | 실패 ${res.failed}개`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 수동 이미지 업로드 ── */}
      <section>
        <h2 className="text-[16px] font-bold text-[#0F172A] mb-4">수동 이미지 업로드</h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <p className="text-[13px] text-[#6B7280] mb-4">
            자동 스크래핑으로 찾지 못한 이미지를 수동으로 등록합니다.
            Tiqets 사이트에서 이미지 URL 복사 후 붙여넣기.
          </p>

          {/* 도시 선택 + 상품 로드 */}
          <div className="flex gap-3 mb-4">
            <select
              value={manualCityId}
              onChange={e => setManualCityId(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[14px] text-[#0F172A]"
            >
              <option value="">도시 선택</option>
              {CITIES.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name} (DB: {stats.get(c.id) || 0}개)</option>
              ))}
            </select>
            <button
              onClick={loadProducts}
              disabled={!manualCityId || manualLoading}
              className="px-4 py-2.5 rounded-lg bg-[#0F172A] text-white text-[13px] font-semibold hover:bg-[#1E293B] disabled:opacity-50 transition-colors"
            >
              {manualLoading ? '로딩...' : '상품 목록 로드'}
            </button>
          </div>

          {/* 상품 선택 */}
          {manualProducts.length > 0 && (
            <div className="mb-4">
              <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">상품 선택</label>
              <select
                value={selectedProduct?.id || ''}
                onChange={e => {
                  const p = manualProducts.find(p => String(p.id) === e.target.value);
                  setSelectedProduct(p || null);
                  setManualImageUrl('');
                  setSaveMsg('');
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[14px] text-[#0F172A]"
              >
                <option value="">상품 선택...</option>
                {manualProducts.map(p => (
                  <option key={p.id} value={String(p.id)}>{p.title} (ID: {p.id})</option>
                ))}
              </select>
              {selectedProduct?.product_url && (
                <a
                  href={selectedProduct.product_url}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-[12px] text-[#2B7FFF] hover:underline"
                >
                  Tiqets 페이지 열기 → 이미지 URL 복사
                </a>
              )}
            </div>
          )}

          {/* 이미지 URL 입력 */}
          {selectedProduct && (
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">이미지 URL</label>
                <input
                  type="url"
                  value={manualImageUrl}
                  onChange={e => setManualImageUrl(e.target.value)}
                  placeholder="https://aws-tiqets-cdn.imgix.net/images/content/..."
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-[14px] text-[#0F172A] placeholder:text-[#9CA3AF]"
                />
              </div>

              {/* 미리보기 */}
              {manualImageUrl && (
                <div className="flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={manualImageUrl}
                    alt="preview"
                    className="w-[120px] h-[90px] object-cover rounded-lg border border-[#E5E7EB]"
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                  />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-[#0F172A] mb-1">{selectedProduct.title}</p>
                    <p className="text-[11px] text-[#9CA3AF]">Product ID: {selectedProduct.id}</p>
                  </div>
                </div>
              )}

              <button
                onClick={saveManual}
                disabled={saving || !manualImageUrl.trim()}
                className="px-5 py-2.5 rounded-lg bg-green-600 text-white text-[13px] font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '저장 중...' : '💾 DB에 저장'}
              </button>

              {saveMsg && (
                <p className={`text-[13px] font-semibold ${saveMsg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMsg}
                </p>
              )}
            </div>
          )}

          {/* 안내 */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-[12px] text-amber-800 font-semibold mb-1">⚠️ Vercel 환경변수 필요</p>
            <p className="text-[12px] text-amber-700">
              스크래핑 저장 및 수동 업로드는 <code className="bg-amber-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>가 
              Vercel 환경변수에 설정되어야 합니다.
              Supabase 대시보드 → Settings → API → service_role key 복사 후 Vercel에 추가.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
