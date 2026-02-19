import React from 'react';
import { StadiumSection, SectionProps, StadiumModule } from './types';

export const VIEWBOX = '0 0 800 700';

const CX = 400, CY = 350;
const SX = 1.22, SY = 1.0;
const INNER = 115;
const OUTER_LOW = 170;
const OUTER_UP = 225;
const MID_LOW = (INNER + OUTER_LOW) / 2;   // ~142
const MID_UP  = (OUTER_LOW + OUTER_UP) / 2; // ~197

function describeArc(
  cx: number, cy: number,
  innerR: number, outerR: number,
  startDeg: number, endDeg: number,
  scaleX = SX, scaleY = SY
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const pt = (r: number, a: number) => ({
    x: cx + r * scaleX * Math.cos(toRad(a)),
    y: cy + r * scaleY * Math.sin(toRad(a)),
  });
  const span = (endDeg - startDeg + 360) % 360;
  const large = span > 180 ? 1 : 0;
  const o1 = pt(outerR, startDeg), o2 = pt(outerR, endDeg);
  const i1 = pt(innerR, startDeg), i2 = pt(innerR, endDeg);
  const orx = (outerR * scaleX).toFixed(1), ory = (outerR * scaleY).toFixed(1);
  const irx = (innerR * scaleX).toFixed(1), iry = (innerR * scaleY).toFixed(1);
  return [
    `M ${o1.x.toFixed(1)} ${o1.y.toFixed(1)}`,
    `A ${orx} ${ory} 0 ${large} 1 ${o2.x.toFixed(1)} ${o2.y.toFixed(1)}`,
    `L ${i2.x.toFixed(1)} ${i2.y.toFixed(1)}`,
    `A ${irx} ${iry} 0 ${large} 0 ${i1.x.toFixed(1)} ${i1.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

function labelPos(midDeg: number, midR: number, scaleX = SX, scaleY = SY) {
  const rad = (midDeg * Math.PI) / 180;
  return {
    labelX: CX + midR * scaleX * Math.cos(rad),
    labelY: CY + midR * scaleY * Math.sin(rad),
  };
}

function mid(start: number, end: number): number {
  if (end >= start) return (start + end) / 2;
  return ((start + end + 360) / 2) % 360;
}

// Emirates layout:
// North Bank (top): 213° → 327°  (114° arc — same long sides)
// South Stand (bottom): 33° → 147°
// West Stand (left): 147° → 213°  (66° arc)
// East Stand (right): 327° → 33°  (66° arc, wraps 0°)

const sections: StadiumSection[] = [
  // ── North Bank Lower (7 blocks) ───────────────────────────────────────────
  ...([
    ['nbl-1', 'NB 65', 213, 229],
    ['nbl-2', 'NB 66', 229, 245],
    ['nbl-3', 'NB 67', 245, 258],
    ['nbl-4', 'NB 68', 258, 270],
    ['nbl-5', 'NB 69', 270, 283],
    ['nbl-6', 'NB 70', 283, 311],
    ['nbl-7', 'NB 71', 311, 327],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, INNER, OUTER_LOW, s, e),
    ...labelPos(mid(s, e), MID_LOW),
  })),

  // ── North Bank Upper (4 blocks) ───────────────────────────────────────────
  ...([
    ['nbu-1', 'NB U65', 213, 243],
    ['nbu-2', 'NB U66', 243, 270],
    ['nbu-3', 'NB U67', 270, 297],
    ['nbu-4', 'NB U68', 297, 327],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, OUTER_LOW, OUTER_UP, s, e),
    ...labelPos(mid(s, e), MID_UP),
  })),

  // ── South Stand Lower (7 blocks) ──────────────────────────────────────────
  ...([
    ['ssl-1', 'SS 27', 33, 49],
    ['ssl-2', 'SS 28', 49, 65],
    ['ssl-3', 'SS 29', 65, 79],
    ['ssl-4', 'SS 30', 79, 90],
    ['ssl-5', 'SS 31', 90, 103],
    ['ssl-6', 'SS 32', 103, 119],
    ['ssl-7', 'SS 33', 119, 147],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, INNER, OUTER_LOW, s, e),
    ...labelPos(mid(s, e), MID_LOW),
  })),

  // ── South Stand Upper (4 blocks) ──────────────────────────────────────────
  ...([
    ['ssu-1', 'SS U27', 33, 63],
    ['ssu-2', 'SS U28', 63, 90],
    ['ssu-3', 'SS U29', 90, 117],
    ['ssu-4', 'SS U30', 117, 147],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, OUTER_LOW, OUTER_UP, s, e),
    ...labelPos(mid(s, e), MID_UP),
  })),

  // ── West Stand Lower (6 blocks, incl. Clock End side) ────────────────────
  ...([
    ['wsl-1', 'WS 51', 147, 158],
    ['wsl-2', 'WS 52', 158, 169],
    ['wsl-3', 'WS 53', 169, 180],
    ['wsl-4', 'WS 54', 180, 191],
    ['wsl-5', 'WS 55', 191, 202],
    ['wsl-6', 'WS 56', 202, 213],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, INNER, OUTER_LOW, s, e),
    ...labelPos(mid(s, e), MID_LOW),
  })),

  // ── West Stand Upper (4 blocks) ───────────────────────────────────────────
  ...([
    ['wsu-1', 'WS U51', 147, 163],
    ['wsu-2', 'WS U52', 163, 180],
    ['wsu-3', 'WS U53', 180, 197],
    ['wsu-4', 'WS U54', 197, 213],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, OUTER_LOW, OUTER_UP, s, e),
    ...labelPos(mid(s, e), MID_UP),
  })),

  // ── East Stand Lower (6 blocks) ───────────────────────────────────────────
  ...([
    ['esl-1', 'ES 1', 327, 338],
    ['esl-2', 'ES 2', 338, 349],
    ['esl-3', 'ES 3', 349, 360],
    ['esl-4', 'ES 4', 360, 12],
    ['esl-5', 'ES 5', 12, 22],
    ['esl-6', 'ES 6', 22, 33],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, INNER, OUTER_LOW, s, e),
    ...labelPos(mid(s, e), MID_LOW),
  })),

  // ── East Stand Upper (4 blocks) ───────────────────────────────────────────
  ...([
    ['esu-1', 'ES U1', 327, 344],
    ['esu-2', 'ES U2', 344, 360],
    ['esu-3', 'ES U3', 360, 16],
    ['esu-4', 'ES U4', 16, 33],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, OUTER_LOW, OUTER_UP, s, e),
    ...labelPos(mid(s, e), MID_UP),
  })),

  // ── Diamond Club / Premium boxes (West mid) ────────────────────────────────
  {
    id: 'diamond-club',
    label: 'Diamond Club',
    type: 'path' as const,
    d: describeArc(CX, CY, OUTER_LOW - 2, OUTER_LOW + 28, 158, 202),
    ...labelPos(mid(158, 202), OUTER_LOW + 13),
  },
];

export const SECTIONS: StadiumSection[] = sections;

// ── Field (pitch) component ──────────────────────────────────────────────────
export function Field(): React.ReactElement {
  const lw = 0.9, lo = 0.45;
  const px = 283, py = 255, pw = 234, ph = 190;
  const pcx = px + pw / 2, pcy = py + ph / 2;
  const pbW = 52, pbH = 104;
  const pbX1 = px, pbX2 = px + pw - pbW;
  const pbY = pcy - pbH / 2;
  const gbW = 20, gbH = 62;
  const gbX1 = px, gbX2 = px + pw - gbW;
  const gbY = pcy - gbH / 2;

  return (
    <g>
      <rect x={px} y={py} width={pw} height={ph} rx={4}
        fill="#16a34a" fillOpacity={0.18} stroke="#22c55e" strokeWidth={1.2} />
      <rect x={px} y={py} width={pw} height={ph}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <line x1={pcx} y1={py} x2={pcx} y2={py + ph}
        stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <circle cx={pcx} cy={pcy} r={33}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <circle cx={pcx} cy={pcy} r={3} fill="#22c55e" fillOpacity={0.5} />
      <rect x={pbX1} y={pbY} width={pbW} height={pbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <rect x={pbX2} y={pbY} width={pbW} height={pbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <rect x={gbX1} y={gbY} width={gbW} height={gbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <rect x={gbX2} y={gbY} width={gbW} height={gbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <circle cx={px + 42} cy={pcy} r={2.5} fill="#22c55e" fillOpacity={0.4} />
      <circle cx={px + pw - 42} cy={pcy} r={2.5} fill="#22c55e" fillOpacity={0.4} />
      {/* Corner arcs */}
      <path d={`M ${px} ${py + 8} A 8 8 0 0 1 ${px + 8} ${py}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <path d={`M ${px + pw} ${py + 8} A 8 8 0 0 0 ${px + pw - 8} ${py}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <path d={`M ${px} ${py + ph - 8} A 8 8 0 0 0 ${px + 8} ${py + ph}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <path d={`M ${px + pw} ${py + ph - 8} A 8 8 0 0 1 ${px + pw - 8} ${py + ph}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      {/* Stand labels */}
      <text x={pcx} y={py - 12} textAnchor="middle" fontSize={10} fill="#6B7280" fontWeight="600">
        NORTH BANK
      </text>
      <text x={pcx} y={py + ph + 20} textAnchor="middle" fontSize={10} fill="#6B7280" fontWeight="600">
        SOUTH STAND
      </text>
      <text x={px - 14} y={pcy} textAnchor="middle" fontSize={9} fill="#6B7280" fontWeight="600"
        transform={`rotate(-90, ${px - 14}, ${pcy})`}>
        WEST
      </text>
      <text x={px + pw + 14} y={pcy} textAnchor="middle" fontSize={9} fill="#6B7280" fontWeight="600"
        transform={`rotate(90, ${px + pw + 14}, ${pcy})`}>
        EAST
      </text>
    </g>
  );
}

// ── Section renderer ─────────────────────────────────────────────────────────
export function Section({
  section, fill, fillOpacity, stroke, strokeWidth, showLabel,
}: SectionProps): React.ReactElement {
  if (section.type === 'path') {
    return (
      <g>
        <path
          d={section.d}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          style={{ transition: 'fill-opacity 0.15s, stroke-width 0.15s' }}
        />
        {showLabel && (
          <text
            x={section.labelX}
            y={section.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={8}
            fontWeight="600"
            fill={fillOpacity > 0.5 ? '#fff' : '#374151'}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {section.label}
          </text>
        )}
      </g>
    );
  }
  const s = section as { x: number; y: number; w: number; h: number; rx2?: number; labelX: number; labelY: number; label: string };
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx2 ?? 4}
        fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} />
      {showLabel && (
        <text x={s.labelX} y={s.labelY} textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fill="#374151" style={{ pointerEvents: 'none' }}>
          {s.label}
        </text>
      )}
    </g>
  );
}

const EmiratesStadium: StadiumModule = { VIEWBOX, SECTIONS, Field, Section };
export default EmiratesStadium;
