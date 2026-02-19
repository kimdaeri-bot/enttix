'use client';

import { useState, useRef } from 'react';
import EtihadStadium from './stadiums/EtihadStadium';
import EmiratesStadium from './stadiums/EmiratesStadium';
import GenericStadium from './stadiums/GenericStadium';
import { StadiumModule, StadiumSection } from './stadiums/types';

interface SeatMapSection {
  name: string;
  minPrice?: number;
  count?: number;
}

interface SeatMapProps {
  venueName: string;
  sections?: SeatMapSection[];
  selectedSection?: string | null;
  onSectionClick?: (section: string | null) => void;
  compact?: boolean;
  highlightSection?: string;
}

function getStadiumData(venueName: string): StadiumModule {
  const lower = venueName.toLowerCase();
  if (lower.includes('etihad')) return EtihadStadium;
  if (lower.includes('emirates')) return EmiratesStadium;
  return GenericStadium;
}

/** Match an API section name to a SVG section id */
function matchSection(apiName: string, svgSections: StadiumSection[]): string | null {
  if (!apiName) return null;
  const lower = apiName.toLowerCase();

  // 1. Exact slug match
  const slug = lower.replace(/\s+/g, '-');
  let match = svgSections.find((s) => s.id === slug);
  if (match) return match.id;

  // 2. Label contains apiName
  match = svgSections.find(
    (s) =>
      s.label.toLowerCase().includes(lower) ||
      lower.includes(s.label.toLowerCase())
  );
  if (match) return match.id;

  // 3. Keyword partial: block number extraction
  const blockNum = apiName.match(/\b(\d+)\b/)?.[1];
  if (blockNum) {
    match = svgSections.find((s) => {
      const nums: string[] = s.label.match(/\b(\d+)\b/g) ?? [];
      return nums.includes(blockNum as string);
    });
    if (match) return match.id;
  }

  // 4. Stand keyword matching
  const standMap: Record<string, string[]> = {
    north: ['north', 'nb '],
    south: ['south', 'ss '],
    east:  ['east',  'es '],
    west:  ['west',  'ws ', 'colin bell'],
  };
  for (const [keyword, prefixes] of Object.entries(standMap)) {
    if (prefixes.some((p) => lower.includes(p) || lower.includes(keyword))) {
      match = svgSections.find((s) => s.id.startsWith(keyword) || s.label.toLowerCase().startsWith(keyword));
      if (match) return match.id;
    }
  }

  return null;
}

function getPriceColor(ratio: number): string {
  if (ratio < 0.2) return '#22C55E';
  if (ratio < 0.4) return '#84CC16';
  if (ratio < 0.6) return '#F59E0B';
  if (ratio < 0.8) return '#F97316';
  return '#EF4444';
}

export default function SeatMap({
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

  // Build price lookup
  const allPrices = (sections ?? [])
    .map((s) => s.minPrice ?? 0)
    .filter((p) => p > 0);
  const minPrice = allPrices.length ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length ? Math.max(...allPrices) : 0;

  function getSectionColor(sectionId: string): string {
    if (!sections?.length) return '#94A3B8';
    const matched = sections.find(
      (s) => matchSection(s.name, svgSections) === sectionId
    );
    if (!matched?.minPrice) return '#94A3B8';
    const ratio =
      maxPrice === minPrice
        ? 0.5
        : (matched.minPrice - minPrice) / (maxPrice - minPrice);
    return getPriceColor(ratio);
  }

  function hasData(sectionId: string): boolean {
    return !!(
      sections?.some((s) => matchSection(s.name, svgSections) === sectionId)
    );
  }

  const hoveredSectionInfo = hoveredId
    ? sections?.find((s) => matchSection(s.name, svgSections) === hoveredId)
    : null;
  const svgHovered = svgSections.find((s) => s.id === hoveredId);

  // ── Compact mode ─────────────────────────────────────────────────────────
  if (compact) {
    const highlightedId = highlightSection
      ? matchSection(highlightSection, svgSections)
      : null;

    return (
      <div className="rounded-[12px] overflow-hidden bg-[#F8FAFC] border border-[#E5E7EB]">
        <svg viewBox={VIEWBOX} className="w-full max-h-[200px]">
          <Field />
          {svgSections.map((sec) => {
            const isHighlight =
              sec.id === highlightedId ||
              (highlightSection
                ? sec.label.toLowerCase().includes(highlightSection.toLowerCase())
                : false);
            return (
              <Section
                key={sec.id}
                section={sec}
                fill={isHighlight ? '#2B7FFF' : '#CBD5E1'}
                fillOpacity={isHighlight ? 0.9 : 0.35}
                stroke={isHighlight ? '#1D4ED8' : '#94A3B8'}
                strokeWidth={isHighlight ? 2 : 0.5}
                showLabel={isHighlight}
              />
            );
          })}
        </svg>
        {highlightSection && (
          <div className="px-4 py-2 text-center">
            <p className="text-[12px] font-semibold text-[#374151]">
              📍 Your seats: {highlightSection}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Full interactive mode ─────────────────────────────────────────────────
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
            Clear filter ✕
          </button>
        )}
      </div>

      {/* SVG map */}
      <div ref={containerRef} className="relative select-none">
        <svg
          viewBox={VIEWBOX}
          className="w-full"
          onMouseLeave={() => setHoveredId(null)}
        >
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
                onClick={() => {
                  if (!sectionHasData) return;
                  onSectionClick?.(isSelected ? null : sec.id);
                }}
                onMouseEnter={(e) => {
                  if (!sectionHasData) return;
                  setHoveredId(sec.id);
                  const rect = containerRef.current?.getBoundingClientRect();
                  const target = (e.currentTarget as SVGGElement).getBoundingClientRect();
                  if (rect) {
                    setTooltipPos({
                      x: target.left - rect.left + target.width / 2,
                      y: target.top - rect.top,
                    });
                  }
                }}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Section
                  section={sec}
                  fill={color}
                  fillOpacity={
                    selectedSection && !isSelected
                      ? 0.1
                      : isSelected
                      ? 0.95
                      : isHovered
                      ? 0.8
                      : sectionHasData
                      ? 0.45
                      : 0.18
                  }
                  stroke={isSelected || isHovered ? color : '#94A3B8'}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.5}
                  showLabel={true}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredId && hoveredSectionInfo && svgHovered && (
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: Math.min(
                tooltipPos.x,
                (containerRef.current?.offsetWidth ?? 300) - 160
              ),
              top: Math.max(tooltipPos.y - 85, 0),
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-[#0F172A] text-white rounded-[10px] px-3 py-2 shadow-xl text-[12px] whitespace-nowrap">
              <p className="font-bold">{svgHovered.label}</p>
              {hoveredSectionInfo.minPrice != null && (
                <p className="text-[#93C5FD]">
                  From £{hoveredSectionInfo.minPrice.toFixed(2)}
                </p>
              )}
              {hoveredSectionInfo.count != null && hoveredSectionInfo.count > 0 && (
                <p className="text-[#86EFAC]">
                  {hoveredSectionInfo.count} tickets available
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[11px] text-[#6B7280] flex-wrap">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#22C55E]" /> Budget
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#F59E0B]" /> Mid
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#EF4444]" /> Premium
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#CBD5E1]" /> No listings
        </div>
      </div>
    </div>
  );
}
