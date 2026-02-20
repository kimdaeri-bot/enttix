'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface SeatMapSection {
  name: string;
  minPrice?: number;
  count?: number;
}

interface SeatMapProps {
  venueName: string;
  mapUrl?: string;           // ← Tixstock map_url (dynamic SVG)
  sections?: SeatMapSection[];
  selectedSection?: string | null;
  onSectionClick?: (section: string | null) => void;
  compact?: boolean;
  highlightSection?: string; // for compact mode
}

// Convert section name → SVG data-stand / data-category slug
function toStandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Find best matching data-stand value for a ticket section name
function matchStand(sectionName: string, stands: string[]): string | null {
  const slug = toStandSlug(sectionName);
  // Exact slug
  if (stands.includes(slug)) return slug;
  // Partial: stand slug contains section keyword
  const lower = sectionName.toLowerCase();
  const found = stands.find(
    (s) => s.includes(lower.replace(/\s+/g, '-')) || lower.includes(s.replace(/-/g, ' '))
  );
  return found ?? null;
}

// Color based on price percentile
function priceColor(minPrice: number, globalMin: number, globalMax: number): string {
  if (globalMax === globalMin) return '#F59E0B';
  const ratio = (minPrice - globalMin) / (globalMax - globalMin);
  if (ratio < 0.2) return '#22C55E';
  if (ratio < 0.4) return '#84CC16';
  if (ratio < 0.6) return '#F59E0B';
  if (ratio < 0.8) return '#F97316';
  return '#EF4444';
}

// ─── Dynamic SVG Map (Tixstock map_url) ──────────────────────────────────────
function DynamicSeatMap({
  mapUrl,
  venueName,
  sections = [],
  selectedSection,
  onSectionClick,
  compact,
  highlightSection,
}: SeatMapProps & { mapUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredStand, setHoveredStand] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipText, setTooltipText] = useState('');

  // All stand slugs discovered in the SVG
  const [availableStands, setAvailableStands] = useState<string[]>([]);

  // Fetch SVG through proxy
  useEffect(() => {
    setLoading(true);
    fetch(`/api/tixstock/seatmap?url=${encodeURIComponent(mapUrl)}`)
      .then((r) => r.text())
      .then((svg) => {
        // Strip XML declaration if present
        const clean = svg.replace(/<\?xml[^?]*\?>/g, '').trim();
        setSvgContent(clean);

        // Discover all data-stand values
        const matches = [...clean.matchAll(/data-stand="([^"]+)"/g)];
        const stands = [...new Set(matches.map((m) => m[1]))];
        setAvailableStands(stands);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [mapUrl]);

  // Build stand → section info mapping
  const allPrices = sections.map((s) => s.minPrice ?? 0).filter((p) => p > 0);
  const globalMin = allPrices.length ? Math.min(...allPrices) : 0;
  const globalMax = allPrices.length ? Math.max(...allPrices) : 0;

  const standToSection: Record<string, SeatMapSection> = {};
  sections.forEach((sec) => {
    const stand = matchStand(sec.name, availableStands);
    if (stand) standToSection[stand] = sec;
  });

  // Apply interactive styles after SVG renders
  const applyStyles = useCallback(() => {
    const container = containerRef.current;
    if (!container || !svgContent) return;

    // Handle data-stand groups
    const standGroups = container.querySelectorAll<SVGGElement>('g[data-stand]');
    standGroups.forEach((g) => {
      const stand = g.getAttribute('data-stand')!;
      const secData = standToSection[stand];
      const isSelected = selectedSection === stand;
      const isAvailable = !!secData;

      // Set fill color on all paths/polygons inside this group
      const paths = g.querySelectorAll('path, polygon, rect, ellipse, circle');
      paths.forEach((el) => {
        const svgEl = el as SVGElement;
        if (isSelected) {
          svgEl.style.fill = '#2B7FFF';
          svgEl.style.fillOpacity = '0.85';
          svgEl.style.stroke = '#1D4ED8';
          svgEl.style.strokeWidth = '2';
        } else if (isAvailable && secData?.minPrice) {
          const color = priceColor(secData.minPrice, globalMin, globalMax);
          svgEl.style.fill = color;
          svgEl.style.fillOpacity = selectedSection ? '0.2' : '0.5';
          svgEl.style.stroke = color;
          svgEl.style.strokeWidth = '0.5';
        } else {
          svgEl.style.fill = '#CBD5E1';
          svgEl.style.fillOpacity = '0.3';
        }
      });

      // Cursor
      g.style.cursor = isAvailable ? 'pointer' : 'default';
    });
  }, [svgContent, selectedSection, standToSection, globalMin, globalMax]);

  // Attach event listeners
  const attachListeners = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const standGroups = container.querySelectorAll<SVGGElement>('g[data-stand]');
    standGroups.forEach((g) => {
      const stand = g.getAttribute('data-stand')!;
      const secData = standToSection[stand];

      g.onclick = () => {
        if (!secData) return;
        onSectionClick?.(selectedSection === stand ? null : stand);
      };

      g.onmouseenter = (e) => {
        if (!secData) return;
        setHoveredStand(stand);
        const rect = container.getBoundingClientRect();
        const gRect = g.getBoundingClientRect();
        setTooltipPos({
          x: gRect.left - rect.left + gRect.width / 2,
          y: gRect.top - rect.top,
        });
        let tip = stand.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        if (secData.minPrice) tip += ` · From $${secData.minPrice.toFixed(0)}`;
        if (secData.count) tip += ` · ${secData.count} tkts`;
        setTooltipText(tip);
      };

      g.onmouseleave = () => setHoveredStand(null);
    });
  }, [svgContent, standToSection, selectedSection, onSectionClick]);

  // Re-apply whenever SVG or sections change
  useEffect(() => {
    if (!svgContent) return;
    // Small delay for DOM to settle after dangerouslySetInnerHTML
    const t = setTimeout(() => {
      applyStyles();
      attachListeners();
    }, 50);
    return () => clearTimeout(t);
  }, [svgContent, applyStyles, attachListeners]);

  if (compact) {
    return (
      <div className="rounded-[12px] overflow-hidden bg-[#F8FAFC] border border-[#E5E7EB]">
        {loading && <div className="h-[180px] flex items-center justify-center text-[13px] text-[#9CA3AF]">Loading map…</div>}
        {!loading && svgContent && (
          <div
            ref={containerRef}
            className="w-full [&>svg]:w-full [&>svg]:max-h-[200px]"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
        {highlightSection && (
          <div className="px-4 py-2 text-center">
            <p className="text-[12px] font-semibold text-[#374151]">📍 Your seats: {highlightSection}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#171717]">{venueName}</h3>
          <p className="text-[12px] text-[#9CA3AF]">Click a section to filter tickets</p>
        </div>
        {selectedSection && (
          <button
            onClick={() => onSectionClick?.(null)}
            className="text-[12px] text-[#2B7FFF] hover:underline px-3 py-1 rounded-lg bg-[#EFF6FF]"
          >
            Clear ✕
          </button>
        )}
      </div>

      {/* SVG container */}
      <div ref={containerRef} className="relative select-none">
        {loading && (
          <div className="h-[320px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#2B7FFF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[13px] text-[#9CA3AF]">Loading stadium map…</p>
            </div>
          </div>
        )}
        {error && (
          <div className="h-[200px] flex items-center justify-center text-[13px] text-[#EF4444]">
            Map unavailable
          </div>
        )}
        {!loading && !error && svgContent && (
          <div
            className="w-full [&>svg]:w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}

        {/* Tooltip */}
        {hoveredStand && tooltipText && (
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

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[11px] text-[#6B7280] flex-wrap">
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#22C55E]" /> Budget</div>
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#F59E0B]" /> Mid</div>
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#EF4444]" /> Premium</div>
        <div className="flex items-center gap-1 ml-auto"><span className="inline-block w-3 h-3 rounded-sm bg-[#CBD5E1]" /> No listings</div>
      </div>
    </div>
  );
}

// ─── Legacy fallback (hardcoded SVG components) ───────────────────────────────
import EtihadStadium from './stadiums/EtihadStadium';
import EmiratesStadium from './stadiums/EmiratesStadium';
import GenericStadium from './stadiums/GenericStadium';
import { StadiumModule, StadiumSection } from './stadiums/types';

function getStadiumData(venueName: string): StadiumModule {
  const lower = venueName.toLowerCase();
  if (lower.includes('etihad')) return EtihadStadium;
  if (lower.includes('emirates')) return EmiratesStadium;
  return GenericStadium;
}

function legacyMatchSection(apiName: string, svgSections: StadiumSection[]): string | null {
  if (!apiName) return null;
  const lower = apiName.toLowerCase();
  const slug = lower.replace(/\s+/g, '-');
  let match = svgSections.find((s) => s.id === slug);
  if (match) return match.id;
  match = svgSections.find(
    (s) => s.label.toLowerCase().includes(lower) || lower.includes(s.label.toLowerCase())
  );
  if (match) return match.id;
  return null;
}

function getLegacyPriceColor(ratio: number): string {
  if (ratio < 0.2) return '#22C55E';
  if (ratio < 0.4) return '#84CC16';
  if (ratio < 0.6) return '#F59E0B';
  if (ratio < 0.8) return '#F97316';
  return '#EF4444';
}

function LegacySeatMap({
  venueName,
  sections,
  selectedSection,
  onSectionClick,
  compact = false,
  highlightSection,
}: SeatMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const stadium = getStadiumData(venueName);
  const { SECTIONS: svgSections, VIEWBOX, Field, Section } = stadium;

  const allPrices = (sections ?? []).map((s) => s.minPrice ?? 0).filter((p) => p > 0);
  const minPrice = allPrices.length ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length ? Math.max(...allPrices) : 0;

  function getSectionColor(sectionId: string): string {
    if (!sections?.length) return '#94A3B8';
    const matched = sections.find((s) => legacyMatchSection(s.name, svgSections) === sectionId);
    if (!matched?.minPrice) return '#94A3B8';
    const ratio = maxPrice === minPrice ? 0.5 : (matched.minPrice - minPrice) / (maxPrice - minPrice);
    return getLegacyPriceColor(ratio);
  }

  function hasData(sectionId: string): boolean {
    return !!(sections?.some((s) => legacyMatchSection(s.name, svgSections) === sectionId));
  }

  const hoveredSectionInfo = hoveredId ? sections?.find((s) => legacyMatchSection(s.name, svgSections) === hoveredId) : null;
  const svgHovered = svgSections.find((s) => s.id === hoveredId);

  if (compact) {
    const highlightedId = highlightSection ? legacyMatchSection(highlightSection, svgSections) : null;
    return (
      <div className="rounded-[12px] overflow-hidden bg-[#F8FAFC] border border-[#E5E7EB]">
        <svg viewBox={VIEWBOX} className="w-full max-h-[200px]">
          <Field />
          {svgSections.map((sec) => {
            const isHighlight = sec.id === highlightedId || (highlightSection ? sec.label.toLowerCase().includes(highlightSection.toLowerCase()) : false);
            return (
              <Section key={sec.id} section={sec} fill={isHighlight ? '#2B7FFF' : '#CBD5E1'} fillOpacity={isHighlight ? 0.9 : 0.35} stroke={isHighlight ? '#1D4ED8' : '#94A3B8'} strokeWidth={isHighlight ? 2 : 0.5} showLabel={isHighlight} />
            );
          })}
        </svg>
        {highlightSection && (
          <div className="px-4 py-2 text-center">
            <p className="text-[12px] font-semibold text-[#374151]">📍 Your seats: {highlightSection}</p>
          </div>
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
        <svg viewBox={VIEWBOX} className="w-full" onMouseLeave={() => setHoveredId(null)}>
          <Field />
          {svgSections.map((sec) => {
            const color = getSectionColor(sec.id);
            const isSelected = selectedSection === sec.id;
            const isHovered = hoveredId === sec.id;
            const sectionHasData = hasData(sec.id);
            return (
              <g
                key={sec.id}
                className={sectionHasData ? 'cursor-pointer' : 'cursor-default'}
                onClick={() => { if (!sectionHasData) return; onSectionClick?.(isSelected ? null : sec.id); }}
                onMouseEnter={(e) => {
                  if (!sectionHasData) return;
                  setHoveredId(sec.id);
                  const rect = containerRef.current?.getBoundingClientRect();
                  const target = (e.currentTarget as SVGGElement).getBoundingClientRect();
                  if (rect) setTooltipPos({ x: target.left - rect.left + target.width / 2, y: target.top - rect.top });
                }}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Section section={sec} fill={color} fillOpacity={selectedSection && !isSelected ? 0.1 : isSelected ? 0.95 : isHovered ? 0.8 : sectionHasData ? 0.45 : 0.18} stroke={isSelected || isHovered ? color : '#94A3B8'} strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.5} showLabel={true} />
              </g>
            );
          })}
        </svg>
        {hoveredId && hoveredSectionInfo && svgHovered && (
          <div className="absolute z-10 pointer-events-none" style={{ left: Math.min(tooltipPos.x, (containerRef.current?.offsetWidth ?? 300) - 160), top: Math.max(tooltipPos.y - 85, 0), transform: 'translateX(-50%)' }}>
            <div className="bg-[#0F172A] text-white rounded-[10px] px-3 py-2 shadow-xl text-[12px] whitespace-nowrap">
              <p className="font-bold">{svgHovered.label}</p>
              {hoveredSectionInfo.minPrice != null && <p className="text-[#93C5FD]">From ${hoveredSectionInfo.minPrice.toFixed(2)}</p>}
              {hoveredSectionInfo.count != null && hoveredSectionInfo.count > 0 && <p className="text-[#86EFAC]">{hoveredSectionInfo.count} tickets available</p>}
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

// ─── Main export ──────────────────────────────────────────────────────────────
export default function SeatMap(props: SeatMapProps) {
  if (props.mapUrl) {
    return <DynamicSeatMap {...props} mapUrl={props.mapUrl} />;
  }
  return <LegacySeatMap {...props} />;
}
