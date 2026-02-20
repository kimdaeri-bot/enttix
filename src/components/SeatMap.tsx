'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface SeatMapSection {
  name: string;
  minPrice?: number;
  count?: number;
}

interface SeatMapProps {
  venueName: string;
  mapUrl?: string;
  sections?: SeatMapSection[];
  selectedSection?: string | null;
  hoverSection?: string | null;   // ticket card hover → highlight on map
  onSectionClick?: (section: string | null) => void;
  compact?: boolean;
  highlightSection?: string;
}

function toStandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function matchStand(sectionName: string, stands: string[]): string | null {
  const slug = toStandSlug(sectionName);
  if (stands.includes(slug)) return slug;
  const lower = sectionName.toLowerCase();
  return stands.find(
    (s) => s.includes(lower.replace(/\s+/g, '-')) || lower.includes(s.replace(/-/g, ' '))
  ) ?? null;
}

function priceColor(minPrice: number, globalMin: number, globalMax: number): string {
  if (globalMax === globalMin) return '#F59E0B';
  const ratio = (minPrice - globalMin) / (globalMax - globalMin);
  if (ratio < 0.2) return '#22C55E';
  if (ratio < 0.4) return '#84CC16';
  if (ratio < 0.6) return '#F59E0B';
  if (ratio < 0.8) return '#F97316';
  return '#EF4444';
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
  const [svgContent, setSvgContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableStands, setAvailableStands] = useState<string[]>([]);
  const [hoveredStand, setHoveredStand] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipText, setTooltipText] = useState('');

  // Fetch SVG via proxy
  useEffect(() => {
    if (!mapUrl) return;
    setLoading(true);
    fetch(`/api/tixstock/seatmap?url=${encodeURIComponent(mapUrl)}`)
      .then((r) => r.text())
      .then((svg) => {
        const clean = svg.replace(/<\?xml[^?]*\?>/g, '').trim();
        setSvgContent(clean);
        const matches = [...clean.matchAll(/data-stand="([^"]+)"/g)];
        setAvailableStands([...new Set(matches.map((m) => m[1]))]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mapUrl]);

  // Price mapping
  const allPrices = sections.map((s) => s.minPrice ?? 0).filter((p) => p > 0);
  const globalMin = allPrices.length ? Math.min(...allPrices) : 0;
  const globalMax = allPrices.length ? Math.max(...allPrices) : 0;

  const standToSection: Record<string, SeatMapSection> = {};
  sections.forEach((sec) => {
    const stand = matchStand(sec.name, availableStands);
    if (stand) standToSection[stand] = sec;
  });

  // Apply colors + listeners
  const applyStyles = useCallback(() => {
    const container = containerRef.current;
    if (!container || !svgContent) return;

    // selectedSection / hoverSection can be data-stand slug OR raw name (e.g. "East Stand")
    const selectedSlug = selectedSection ? toStandSlug(selectedSection) : null;
    const hoverSlug = hoverSection ? toStandSlug(hoverSection) : null;

    container.querySelectorAll<SVGGElement>('g[data-stand]').forEach((g) => {
      const stand = g.getAttribute('data-stand')!;
      const sec = standToSection[stand];
      const isSelected = !!(selectedSection && (selectedSection === stand || selectedSlug === stand));
      const isHoveredFromTicket = !!(hoverSection && (hoverSection === stand || hoverSlug === stand));
      const anySelected = !!(selectedSection);

      g.querySelectorAll('path, polygon, rect, ellipse, circle').forEach((el) => {
        const e = el as SVGElement;
        if (isSelected) {
          // Clicked on map: solid blue fill
          e.style.fill = '#2B7FFF';
          e.style.fillOpacity = '0.85';
          e.style.stroke = '#1D4ED8';
          e.style.strokeWidth = '2';
        } else if (isHoveredFromTicket) {
          // Hovering ticket card: bright highlight
          e.style.fill = '#2B7FFF';
          e.style.fillOpacity = '0.6';
          e.style.stroke = '#2B7FFF';
          e.style.strokeWidth = '2.5';
        } else if (sec?.minPrice) {
          const color = priceColor(sec.minPrice, globalMin, globalMax);
          e.style.fill = color;
          e.style.fillOpacity = anySelected ? '0.15' : '0.5';
          e.style.stroke = color;
          e.style.strokeWidth = '0.5';
        } else {
          e.style.fill = '#CBD5E1';
          e.style.fillOpacity = '0.3';
        }
      });

      g.style.cursor = sec ? 'pointer' : 'default';

      g.onclick = () => {
        if (!sec) return;
        onSectionClick?.(selectedSection === stand ? null : stand);
      };

      g.onmouseenter = () => {
        if (!sec) return;
        setHoveredStand(stand);
        const rect = container.getBoundingClientRect();
        const gRect = g.getBoundingClientRect();
        setTooltipPos({ x: gRect.left - rect.left + gRect.width / 2, y: gRect.top - rect.top });
        let tip = stand.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        if (sec.minPrice) tip += ` · From $${sec.minPrice.toFixed(0)}`;
        if (sec.count) tip += ` · ${sec.count} tkts`;
        setTooltipText(tip);
      };

      g.onmouseleave = () => setHoveredStand(null);
    });
  }, [svgContent, selectedSection, hoverSection, standToSection, globalMin, globalMax, onSectionClick]);

  useEffect(() => {
    if (!svgContent) return;
    const t = setTimeout(applyStyles, 50);
    return () => clearTimeout(t);
  }, [svgContent, applyStyles, selectedSection, hoverSection]);

  // No map_url → show nothing
  if (!mapUrl) return null;

  if (compact) {
    return (
      <div className="rounded-[12px] overflow-hidden bg-[#F8FAFC] border border-[#E5E7EB]">
        {loading && <div className="h-[180px] flex items-center justify-center text-[13px] text-[#9CA3AF]">Loading map…</div>}
        {!loading && svgContent && (
          <div ref={containerRef} className="w-full [&>svg]:w-full [&>svg]:max-h-[200px]" dangerouslySetInnerHTML={{ __html: svgContent }} />
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
          <div className="w-full [&>svg]:w-full [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: svgContent }} />
        )}
        {hoveredStand && tooltipText && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{ left: Math.min(tooltipPos.x, (containerRef.current?.offsetWidth ?? 300) - 160), top: Math.max(tooltipPos.y - 80, 0), transform: 'translateX(-50%)' }}
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
