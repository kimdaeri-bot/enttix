'use client';

import { useState, useRef, useEffect } from 'react';

interface SeatMapSection {
  name: string;        // SVG data-section key (e.g. "longside-middle-tier-central_104")
  displayName?: string;
  minPrice?: number;
  count?: number;
}

interface SeatMapProps {
  venueName: string;
  mapUrl?: string;
  sections?: SeatMapSection[];
  selectedSection?: string | null;   // data-section key
  hoverSection?: string | null;      // data-section key (from ticket card hover)
  onSectionClick?: (section: string | null) => void;
  compact?: boolean;
  highlightSection?: string;
}

function priceColor(p: number, min: number, max: number): string {
  if (max === min) return '#F59E0B';
  const r = (p - min) / (max - min);
  if (r < 0.2) return '#22C55E';
  if (r < 0.4) return '#84CC16';
  if (r < 0.6) return '#F59E0B';
  if (r < 0.8) return '#F97316';
  return '#EF4444';
}

function paintEl(el: Element, fill: string, opacity: string, stroke: string, sw: string) {
  const e = el as SVGElement;
  e.style.fill = fill;
  e.style.fillOpacity = opacity;
  e.style.stroke = stroke;
  e.style.strokeWidth = sw;
}

export default function SeatMap({
  venueName,
  mapUrl,
  sections = [],
  selectedSection,
  hoverSection,
  onSectionClick,
  compact = false,
  highlightSection,
}: SeatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgDivRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipText, setTooltipText] = useState('');

  // Refs for listener closures
  const sectionsRef = useRef(sections);
  const selectedRef = useRef(selectedSection);
  const onClickRef = useRef(onSectionClick);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);
  useEffect(() => { selectedRef.current = selectedSection; }, [selectedSection]);
  useEffect(() => { onClickRef.current = onSectionClick; }, [onSectionClick]);

  // ── 1. Fetch SVG ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapUrl) return;
    setLoading(true);
    fetch(`/api/tixstock/seatmap?url=${encodeURIComponent(mapUrl)}`)
      .then((r) => r.text())
      .then((svg) => {
        setSvgContent(svg.replace(/<\?xml[^?]*\?>/g, '').trim());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mapUrl]);

  // ── 2. Base price colors + click/hover listeners (once on SVG load) ───────
  useEffect(() => {
    if (!svgContent || !svgDivRef.current) return;
    const container = svgDivRef.current;

    const t = setTimeout(() => {
      const secs = sectionsRef.current;
      const allPrices = secs.map((s) => s.minPrice ?? 0).filter((p) => p > 0);
      const gMin = allPrices.length ? Math.min(...allPrices) : 0;
      const gMax = allPrices.length ? Math.max(...allPrices) : 0;
      // Read current selected/hover at timeout time
      const curSelected = selectedRef.current;

      // Apply to data-section groups (individual blocks)
      container.querySelectorAll<SVGGElement>('g[data-section]').forEach((g) => {
        const secKey = g.getAttribute('data-section')!;
        const sec = secs.find((s) => s.name === secKey);
        const paths = g.querySelectorAll('path, polygon, rect, ellipse, circle');

        // Skip selected section — handled by useEffect #3
        if (secKey === curSelected) { g.style.cursor = 'pointer'; return; }

        if (sec?.minPrice) {
          const color = priceColor(sec.minPrice, gMin, gMax);
          paths.forEach((el) => paintEl(el, color, '0.5', color, '0.5'));
          g.style.cursor = 'pointer';
        } else {
          paths.forEach((el) => paintEl(el, '#CBD5E1', '0.25', '#CBD5E1', '0.3'));
          g.style.cursor = 'default';
        }

        g.onclick = () => {
          if (!sec) return;
          onClickRef.current?.(selectedRef.current === secKey ? null : secKey);
        };

        g.onmouseenter = () => {
          if (!sec) return;
          setHoveredSection(secKey);
          const rect = container.getBoundingClientRect();
          const gRect = g.getBoundingClientRect();
          setTooltipPos({ x: gRect.left - rect.left + gRect.width / 2, y: gRect.top - rect.top });
          const label = sec.displayName || secKey.replace(/_/g, ' ').replace(/-/g, ' ');
          let tip = label.replace(/\b\w/g, (c) => c.toUpperCase());
          if (sec.minPrice) tip += ` · £${sec.minPrice.toFixed(0)}`;
          if (sec.count) tip += ` · ${sec.count} tkts`;
          setTooltipText(tip);
        };
        g.onmouseleave = () => setHoveredSection(null);
      });
    }, 100);

    return () => clearTimeout(t);
  }, [svgContent]);

  // ── 3. Highlight: selected + hover — IMMEDIATE ────────────────────────────
  useEffect(() => {
    const container = svgDivRef.current;
    if (!container || !svgContent) return;

    const secs = sectionsRef.current;
    const allPrices = secs.map((s) => s.minPrice ?? 0).filter((p) => p > 0);
    const gMin = allPrices.length ? Math.min(...allPrices) : 0;
    const gMax = allPrices.length ? Math.max(...allPrices) : 0;
    const anySelected = !!selectedSection;

    container.querySelectorAll<SVGGElement>('g[data-section]').forEach((g) => {
      const secKey = g.getAttribute('data-section')!;
      const sec = secs.find((s) => s.name === secKey);
      const isSelected = secKey === selectedSection;
      const isHovered = secKey === hoverSection;
      const paths = g.querySelectorAll('path, polygon, rect, ellipse, circle');

      if (isSelected) {
        paths.forEach((el) => paintEl(el, '#2B7FFF', '0.9', '#1D4ED8', '2'));
      } else if (isHovered) {
        paths.forEach((el) => paintEl(el, '#2B7FFF', '0.7', '#2B7FFF', '2'));
      } else if (sec?.minPrice) {
        const color = priceColor(sec.minPrice, gMin, gMax);
        paths.forEach((el) => paintEl(el, color, anySelected ? '0.15' : '0.5', color, '0.5'));
      } else {
        paths.forEach((el) => paintEl(el, '#CBD5E1', '0.25', '#CBD5E1', '0.3'));
      }
    });
  }, [selectedSection, hoverSection, svgContent, sections]);

  if (!mapUrl) return null;

  if (compact) {
    return (
      <div className="rounded-[12px] overflow-hidden bg-[#F8FAFC] border border-[#E5E7EB]">
        {loading && <div className="h-[180px] flex items-center justify-center text-[13px] text-[#9CA3AF]">Loading map…</div>}
        {!loading && svgContent && (
          <div ref={svgDivRef} className="w-full [&>svg]:w-full [&>svg]:max-h-[200px]" dangerouslySetInnerHTML={{ __html: svgContent }} />
        )}
        {highlightSection && (
          <p className="text-[12px] font-semibold text-[#374151] text-center px-4 py-2">📍 Your seats: {highlightSection}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#171717]">{venueName}</h3>
          <p className="text-[12px] text-[#9CA3AF]">Click a section to filter tickets</p>
        </div>
        {selectedSection && (
          <button onClick={() => onSectionClick?.(null)} className="text-[12px] text-[#2B7FFF] hover:underline px-3 py-1 rounded-lg bg-[#EFF6FF]">
            Clear ✕
          </button>
        )}
      </div>

      <div ref={containerRef} className="relative select-none">
        {loading && (
          <div className="h-[320px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#2B7FFF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[13px] text-[#9CA3AF]">Loading stadium map…</p>
            </div>
          </div>
        )}
        {!loading && svgContent && (
          <div ref={svgDivRef} className="w-full [&>svg]:w-full [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: svgContent }} />
        )}

        {hoveredSection && tooltipText && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: Math.min(tooltipPos.x, (containerRef.current?.offsetWidth ?? 300) - 160),
              top: Math.max(tooltipPos.y - 80, 0),
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-[#0F172A] text-white rounded-[10px] px-3 py-2 shadow-xl text-[12px] whitespace-nowrap">
              {tooltipText}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-3 text-[11px] text-[#6B7280] flex-wrap">
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#22C55E]" /> Budget</div>
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#F59E0B]" /> Mid</div>
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#EF4444]" /> Premium</div>
        <div className="flex items-center gap-1 ml-auto"><span className="inline-block w-3 h-3 rounded-sm bg-[#CBD5E1]" /> No listings</div>
      </div>
    </div>
  );
}
