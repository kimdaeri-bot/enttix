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
  // Mobile pan/zoom state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchRef = useRef<number | null>(null);
  const [mobileToast, setMobileToast] = useState<string | null>(null);

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

        const buildTip = () => {
          if (!sec) return '';
          const label = sec.displayName || secKey.replace(/_/g, ' ').replace(/-/g, ' ');
          let tip = label.replace(/\b\w/g, (c) => c.toUpperCase());
          if (sec.minPrice) tip += ` · £${sec.minPrice.toFixed(0)}`;
          if (sec.count) tip += ` · ${sec.count} tkts`;
          return tip;
        };

        g.onclick = () => {
          if (!sec) return;
          onClickRef.current?.(selectedRef.current === secKey ? null : secKey);
        };

        // Touch: tap to select + show toast
        g.ontouchend = (e) => {
          if (!sec) return;
          e.preventDefault();
          const tip = buildTip();
          setMobileToast(tip);
          setTimeout(() => setMobileToast(null), 2000);
          onClickRef.current?.(selectedRef.current === secKey ? null : secKey);
        };

        g.onmouseenter = () => {
          if (!sec) return;
          setHoveredSection(secKey);
          const rect = container.getBoundingClientRect();
          const gRect = g.getBoundingClientRect();
          setTooltipPos({ x: gRect.left - rect.left + gRect.width / 2, y: gRect.top - rect.top });
          setTooltipText(buildTip());
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
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB] bg-white flex-shrink-0">
        <div>
          <h3 className="text-[14px] font-bold text-[#171717]">{venueName}</h3>
          <p className="text-[11px] text-[#9CA3AF]">Click a section to filter tickets</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedSection && (
            <button onClick={() => onSectionClick?.(null)} className="text-[11px] text-[#2B7FFF] hover:underline px-2.5 py-1 rounded-lg bg-[#EFF6FF]">
              Clear ✕
            </button>
          )}
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 text-[10px] text-[#6B7280]">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#22C55E] inline-block"/> Budget</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] inline-block"/> Mid</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] inline-block"/> Premium</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#CBD5E1] inline-block"/> None</div>
          </div>
        </div>
      </div>

      {/* Map area */}
      <div
        ref={containerRef}
        className="relative select-none flex-1 overflow-hidden flex items-center justify-center p-4"
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            lastPinchRef.current = null;
          } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastPinchRef.current = Math.hypot(dx, dy);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 1 && lastTouchRef.current && scale > 1) {
            const dx = e.touches[0].clientX - lastTouchRef.current.x;
            const dy = e.touches[0].clientY - lastTouchRef.current.y;
            setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
            lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          } else if (e.touches.length === 2 && lastPinchRef.current !== null) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const ratio = dist / lastPinchRef.current;
            setScale((prev) => Math.min(Math.max(prev * ratio, 1), 4));
            lastPinchRef.current = dist;
          }
        }}
        onTouchEnd={() => {
          lastTouchRef.current = null;
          if (scale <= 1) setTranslate({ x: 0, y: 0 });
        }}
      >
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#2B7FFF] border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-[#9CA3AF]">Loading stadium map…</p>
          </div>
        )}
        {!loading && svgContent && (
          <div
            ref={svgDivRef}
            className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full touch-none"
            style={{ transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`, transformOrigin: 'center', transition: 'transform 0.05s' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}

        {/* Desktop tooltip */}
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

        {/* Mobile toast */}
        {mobileToast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none md:hidden">
            <div className="bg-[#0F172A] text-white rounded-[12px] px-4 py-2.5 shadow-xl text-[13px] font-medium whitespace-nowrap animate-fade-in">
              {mobileToast}
            </div>
          </div>
        )}

        {/* Mobile zoom reset button */}
        {scale > 1 && (
          <button
            className="absolute top-3 right-3 z-30 bg-white border border-[#E5E7EB] rounded-full px-3 py-1 text-[12px] text-[#374151] shadow-md md:hidden"
            onClick={() => { setScale(1); setTranslate({ x: 0, y: 0 }); }}
          >
            Reset zoom
          </button>
        )}
      </div>

      {/* Mobile legend */}
      <div className="flex md:hidden items-center justify-center gap-4 px-4 py-2 border-t border-[#E5E7EB] text-[10px] text-[#6B7280] bg-white flex-shrink-0">
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#22C55E] inline-block"/> Budget</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] inline-block"/> Mid</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] inline-block"/> Premium</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#CBD5E1] inline-block"/> None</div>
      </div>
    </div>
  );
}
