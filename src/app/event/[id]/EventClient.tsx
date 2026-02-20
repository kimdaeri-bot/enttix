'use client';
import Header from '@/components/Header';
import SeatMap from '@/components/SeatMap';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Match } from '@/types';
// Cart removed — Buy Now direct flow only

interface TicketListing {
  id: string;
  section: string;
  svgSection?: string;  // data-section key for map matching
  row: string;
  seat: string;
  type: string;
  price: number;
  maxQty: number;
  quantityOptions: number[];
  benefits: string[];
  splitWarning?: string;
  isEticket: boolean;
  isAisle: boolean;
  isVip: boolean;
  isGA?: boolean;
}

const demoTickets: TicketListing[] = [
  { id: 't1', section: 'North Stand', row: '12', seat: '1-4', type: 'eTicket', price: 151.45, maxQty: 4, quantityOptions: [1,2,3,4], benefits: [], isEticket: true, isAisle: false, isVip: false },
  { id: 't2', section: 'East Stand', row: '8', seat: '15-16', type: 'eTicket', price: 195.00, maxQty: 2, quantityOptions: [2], benefits: ['Includes unlimited food and drinks'], isEticket: true, isAisle: true, isVip: true, splitWarning: 'Cannot purchase leaving only 1 ticket' },
  { id: 't3', section: 'South Stand', row: 'Standing', seat: 'GA', type: 'eTicket', price: 85.00, maxQty: 8, quantityOptions: [1,2,3,4,5,6,7,8], benefits: [], isEticket: true, isAisle: false, isVip: false },
  { id: 't4', section: 'West Stand', row: '3', seat: '22-23', type: 'Paper', price: 220.00, maxQty: 2, quantityOptions: [1,2], benefits: ['VIP entrance access'], isEticket: false, isAisle: false, isVip: true },
  { id: 't5', section: 'NW Corner', row: '6', seat: '1-6', type: 'eTicket', price: 110.00, maxQty: 6, quantityOptions: [1,2,3,4,5,6], benefits: [], isEticket: true, isAisle: true, isVip: false },
];

/* ── Mini Stadium Thumbnail (TX Trade style) ── */
function MiniStadium({ section, highlighted }: { section: string; highlighted: boolean }) {
  const s = section.toLowerCase();
  const isN = s.includes('north') || s.includes('longside lower') || s.includes('shed');
  const isS = s.includes('south') || s.includes('longside upper') || s.includes('east stand lower');
  const isE = s.includes('east') || s.includes('matthew');
  const isW = s.includes('west') || s.includes('colin') || s.includes('shortside');
  const hl = highlighted ? '#22C55E' : '#3B82F6';
  const base = '#C4B5FD';
  return (
    <svg width="60" height="48" viewBox="0 0 60 48" fill="none" className="rounded-[4px]">
      <rect width="60" height="48" fill="#F1F5F9"/>
      {/* Field */}
      <rect x="15" y="11" width="30" height="26" rx="1" fill="#4ADE80"/>
      <rect x="15" y="11" width="30" height="26" rx="1" stroke="white" strokeWidth="0.6" fill="none"/>
      <line x1="30" y1="11" x2="30" y2="37" stroke="white" strokeWidth="0.5"/>
      <circle cx="30" cy="24" r="5" stroke="white" strokeWidth="0.5" fill="none"/>
      <rect x="22" y="11" width="16" height="4" stroke="white" strokeWidth="0.5" fill="none"/>
      <rect x="22" y="33" width="16" height="4" stroke="white" strokeWidth="0.5" fill="none"/>
      {/* Stands */}
      <rect x="15" y="2" width="30" height="8" rx="2" fill={isN ? hl : base}/>
      <rect x="15" y="38" width="30" height="8" rx="2" fill={isS ? hl : base}/>
      <rect x="2" y="11" width="12" height="26" rx="2" fill={isW ? hl : base}/>
      <rect x="46" y="11" width="12" height="26" rx="2" fill={isE ? hl : base}/>
    </svg>
  );
}

function getSplitQuantities(available: number, splitType: string, splitQty?: number): number[] {
  const max = Math.min(available, 10); // 최대 10개 표시
  switch (splitType) {
    case 'avoid-one': return Array.from({ length: max }, (_, i) => i + 1).filter(n => n !== available - 1);
    case 'none': return [available];
    case 'multiples': {
      const step = splitQty && splitQty > 0 ? splitQty : 1;
      return Array.from({ length: Math.floor(max / step) }, (_, i) => (i + 1) * step);
    }
    default: return Array.from({ length: max }, (_, i) => i + 1);
  }
}

export default function EventClient({ id }: { id: string }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [tickets, setTickets] = useState<TicketListing[]>(demoTickets);
  const [loading, setLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [minQtyFilter, setMinQtyFilter] = useState(1);
  const [sectionFilter, setSectionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedMapSection, setSelectedMapSection] = useState<string | null>(null);
  const [hoveredTicketSection, setHoveredTicketSection] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [expandedBenefits, setExpandedBenefits] = useState<Set<string>>(new Set());
  const toggleBenefits = (id: string) => setExpandedBenefits(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc'>('price-asc');
  const router = useRouter();
  const seatMapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const feedRes = await fetch(`/api/tixstock/feed?event_id=${id}`);
        if (feedRes.ok) {
          const feedData = await feedRes.json();
          const events = feedData.data || [];
          if (events.length > 0) {
            const ev = events[0];
            const name = ev.name || '';
            const parts = name.split(/\s+vs?\s+/i);
            setMatch({
              id: String(ev.id), name, homeTeam: parts[0]?.trim() || name, awayTeam: parts[1]?.trim() || '',
              datetime: ev.datetime || '',
              venue: ev.venue || { id: '', name: '', address_line_1: '', address_line_2: '', city: '', state: '', postcode: '', country_code: '', latitude: 0, longitude: 0 },
              leagueId: '', leagueName: ev.categories?.[0]?.name || '',
              startingPrice: ev.min_ticket_price || 0, currency: ev.currency || 'USD', ticketsLeft: ev.total_tickets || 0,
            });
            if (ev.map_url) setMapUrl(String(ev.map_url));
          }
        }

        const tickRes = await fetch(`/api/tixstock/tickets?event_id=${id}`);
        if (tickRes.ok) {
          const tickData = await tickRes.json();
          const listings = tickData.data || [];
          if (listings.length > 0) {
            setTickets(listings.map((l: Record<string, unknown>) => {
              const seat = (l.seat_details as Record<string, string>) || {};
              const proceedPrice = (l.proceed_price as Record<string, string>) || {};
              const qtyInfo = (l.number_of_tickets_for_sale as Record<string, number>) || {};
              const ticket = (l.ticket as Record<string, unknown>) || {};
              const rb = ((l.restrictions_benefits as Record<string, unknown[]>)?.options || []) as string[];
              const available = qtyInfo.quantity_available || 1;
              const splitType = String(ticket.split_type || 'No Preferences');
              const displayQty = qtyInfo.display_quantity || 0;
              const splitQty = qtyInfo.split_quantity || 0;
              const price = parseFloat(proceedPrice.amount || '0');
              const isGA = String(ticket.general_admission) === 'true';
              return {
                id: String(l.id),
                section: seat.category || seat.section || 'General',
                // SVG data-section key: "{category-slug}_{section-num}"
                svgSection: seat.category && seat.section
                  ? `${seat.category.toLowerCase().replace(/\s+/g, '-')}_${seat.section}`
                  : undefined,
                row: seat.row || '',
                seat: seat.first_seat || '',
                type: String(ticket.type || 'eTicket'),
                price,
                maxQty: displayQty || available,
                quantityOptions: getSplitQuantities(
                  displayQty || available,
                  splitType === 'No Preferences' ? 'any'
                    : splitType === 'All Together' ? 'none'
                    : splitType === 'Avoid leaving one' ? 'avoid-one'
                    : splitType === 'Sell In Multiples' ? 'multiples'
                    : 'any',
                  splitQty,
                ),
                benefits: rb,
                isEticket: String(ticket.type || '').toLowerCase().includes('eticket'),
                isAisle: false,
                isVip: rb.some((r: string) => r.toLowerCase().includes('vip')),
                isGA,
                splitWarning: splitType === 'Avoid leaving one' ? 'Cannot purchase leaving only 1 ticket' : undefined,
              };
            }));
          }
        }
      } catch (e) {
        console.warn('API failed, using demo data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  useEffect(() => {
    if (!loading && !match) {
      import('@/lib/api').then(({ demoData }) => {
        const demo = demoData.matches.find(m => m.id === id);
        if (demo) setMatch(demo);
      });
    }
  }, [loading, match, id]);

  const handleBuyNow = async (ticket: TicketListing, qty: number) => {
    setBuyingId(ticket.id);
    try {
      const res = await fetch('/api/tixstock/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: ticket.id, quantity: qty }),
      });
      const data = await res.json();
      const holdId = data.meta?.hold_id;
      if (!holdId) {
        alert('Hold failed. Please try again.');
        return;
      }
      const isGA = ticket.isGA ?? (ticket.row === 'GA' || ticket.seat === 'GA');
      const benefitsParam = ticket.benefits.length > 0
        ? `&benefits=${encodeURIComponent(JSON.stringify(ticket.benefits))}`
        : '';
      const venueStr = [match?.venue?.name, match?.venue?.city, match?.venue?.country_code].filter(Boolean).join(', ');
      router.push(
        `/sport/checkout?holdId=${holdId}&listingId=${ticket.id}&quantity=${qty}&price=${ticket.price}` +
        `&section=${encodeURIComponent(ticket.section)}&row=${encodeURIComponent(ticket.row)}` +
        `&seat=${encodeURIComponent(ticket.seat)}&eventId=${id}` +
        `&eventName=${encodeURIComponent(match?.name || '')}&general_admission=${isGA}&ticketType=${encodeURIComponent(ticket.type)}` +
        `&eventDate=${encodeURIComponent(match?.datetime || '')}&venue=${encodeURIComponent(venueStr)}` +
        `&mapUrl=${encodeURIComponent(mapUrl || '')}&svgSection=${encodeURIComponent(ticket.svgSection || '')}` +
        benefitsParam
      );
    } catch {
      alert('Hold failed. Please try again.');
    } finally {
      setBuyingId(null);
    }
  };

  // seatMapSections: tickets 변경 시에만 재계산 — early return 앞에 위치 (Hook 규칙 준수)
  const seatMapSections = useMemo(() => {
    const svgSections = [...new Set(tickets.map(t => t.svgSection).filter(Boolean))] as string[];
    return svgSections.map(svgKey => {
      const sectionTickets = tickets.filter(t => t.svgSection === svgKey);
      const min = Math.min(...sectionTickets.map(t => t.price));
      const count = sectionTickets.reduce((acc, t) => acc + t.maxQty, 0);
      const displayName = sectionTickets[0]?.section || svgKey;
      return { name: svgKey, displayName, minPrice: min, count };
    });
  }, [tickets]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="bg-[#0F172A]"><Header /></div>
        <div className="flex items-center justify-center py-32">
          <div className="text-[18px] font-semibold text-[#9CA3AF] animate-pulse">Loading event...</div>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="bg-[#0F172A]"><Header /></div>
        <div className="flex items-center justify-center py-32 text-[24px] font-bold text-[#6B7280]">Event not found</div>
      </main>
    );
  }

  const date = new Date(match.datetime);
  const sections = [...new Set(tickets.map(t => t.section))];
  const types = [...new Set(tickets.map(t => t.type))];
  const venueAddress = [
    match.venue.address_line_1,
    match.venue.address_line_2,
    match.venue.city,
    match.venue.postcode,
  ].filter(Boolean).join(', ');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.venue.name + ' ' + (match.venue.city || ''))}`;

  // Filter + sort tickets
  const filteredTickets = tickets
    .filter(t => {
      if (t.maxQty < minQtyFilter) return false;
      if (sectionFilter && t.section !== sectionFilter) return false;
      if (typeFilter && t.type !== typeFilter) return false;
      if (selectedMapSection && t.svgSection !== selectedMapSection) return false;
      return true;
    })
    .sort((a, b) => sortBy === 'price-asc' ? a.price - b.price : b.price - a.price);

  const minPrice = filteredTickets.length ? filteredTickets[0].price : 0;

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-[#0F172A]"><Header /></div>

      {/* ── Event Header ── */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            {/* Home */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[13px] font-bold text-[#475569] border border-[#E5E7EB]">
                {match.homeTeam.split(' ').map(w => w[0]).join('').slice(0, 3)}
              </div>
              <p className="text-[13px] font-bold text-[#0F172A] max-w-[90px] leading-tight">{match.homeTeam}</p>
            </div>

            <div className="flex-1 text-center">
              <h1 className="text-[16px] md:text-[20px] font-extrabold text-[#0F172A] leading-tight">{match.name}</h1>
              {/* 구장 위치 + 날짜 */}
              <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[12px] text-[#2B7FFF] hover:underline font-medium">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {match.venue.name}{match.venue.city ? `, ${match.venue.city}` : ''}
                </a>
                {venueAddress && <span className="text-[#D1D5DB]">·</span>}
                {match.venue.postcode && <span className="text-[11px] text-[#9CA3AF]">{match.venue.postcode}</span>}
                <span className="text-[#D1D5DB]">·</span>
                <span className="text-[12px] text-[#374151]">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' '}
                  {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Away */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <p className="text-[13px] font-bold text-[#0F172A] max-w-[90px] leading-tight text-right">{match.awayTeam || 'TBD'}</p>
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[13px] font-bold text-[#475569] border border-[#E5E7EB]">
                {match.awayTeam ? match.awayTeam.split(' ').map(w => w[0]).join('').slice(0, 3) : '?'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main: Left listings + Right map ── */}
      <div className="flex h-[calc(100vh-120px)] overflow-hidden max-w-[1600px] mx-auto">

        {/* LEFT: Ticket Listings (30%) */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col border-r border-[#E5E7EB] bg-white">

          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#0F172A]">{filteredTickets.length} listings</span>
              {selectedMapSection && (
                <button onClick={() => setSelectedMapSection(null)}
                  className="text-[11px] text-[#2B7FFF] hover:underline px-2 py-0.5 rounded-full bg-[#EFF6FF]">
                  Clear filter ✕
                </button>
              )}
            </div>
            <button
              onClick={() => setSortBy(s => s === 'price-asc' ? 'price-desc' : 'price-asc')}
              className="flex items-center gap-1 text-[12px] text-[#374151] hover:text-[#0F172A] transition-colors"
            >
              {sortBy === 'price-asc' ? '↑' : '↓'} Sort by price
            </button>
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#F1F5F9] flex-shrink-0 bg-[#FAFAFA]">
            <select value={minQtyFilter} onChange={e => setMinQtyFilter(Number(e.target.value))}
              className="px-2 py-1 rounded border border-[#E5E7EB] text-[11px] bg-white text-[#374151] flex-1">
              <option value={1}>1+ tickets</option>
              <option value={2}>2+ tickets</option>
              <option value={4}>4+ tickets</option>
            </select>
            <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
              className="px-2 py-1 rounded border border-[#E5E7EB] text-[11px] bg-white text-[#374151] flex-1">
              <option value="">All Sections</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-2 py-1 rounded border border-[#E5E7EB] text-[11px] bg-white text-[#374151] flex-1">
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Listings scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
            {filteredTickets.map((ticket, idx) => {
              const qty = quantities[ticket.id] || ticket.quantityOptions[0] || 1;
              const isCheapest = ticket.price === minPrice && idx === 0;
              const isLow = ticket.maxQty <= 3;
              const isHovered = hoveredTicketSection === (ticket.svgSection || ticket.section);

              return (
                <div
                  key={ticket.id}
                  className={`flex items-stretch gap-0 transition-colors cursor-pointer ${isHovered ? 'bg-[#F0F9FF]' : 'bg-white hover:bg-[#FAFAFA]'}`}
                  onMouseEnter={() => setHoveredTicketSection(ticket.svgSection || ticket.section)}
                  onMouseLeave={() => setHoveredTicketSection(null)}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, select')) return;
                    setHoveredTicketSection(ticket.svgSection || ticket.section);
                    if (window.innerWidth < 1024 && seatMapRef.current) {
                      seatMapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div className="w-[70px] flex-shrink-0 flex items-center justify-center p-2 border-r border-[#F1F5F9]">
                    <MiniStadium section={ticket.section} highlighted={isHovered} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 px-3 py-2.5 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      {isCheapest && (
                        <span className="text-[10px] font-bold text-[#16A34A] flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block"/>Cheapest
                        </span>
                      )}
                      {isLow && (
                        <span className="text-[10px] font-semibold text-[#EA580C]">
                          Only {ticket.maxQty} left
                        </span>
                      )}
                      {ticket.isVip && (
                        <span className="text-[10px] font-semibold text-[#D97706]">VIP</span>
                      )}
                    </div>
                    {/* Section */}
                    <p className="text-[13px] font-bold text-[#0F172A] leading-tight truncate">{ticket.section}</p>
                    {/* Block/Row */}
                    <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                      {ticket.svgSection ? `Block ${ticket.svgSection.split('_').pop()}` : ''}
                      {ticket.row && ticket.row !== 'GA' ? ` · Row ${ticket.row}` : ''}
                    </p>
                    {/* Icons row */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-[#374151] font-medium">■ {ticket.maxQty} available</span>
                      {ticket.isEticket && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" aria-label="eTicket">
                          <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                        </svg>
                      )}
                      {ticket.benefits.length > 0 && (
                        <span className="text-[10px] text-[#16A34A] font-medium">+{ticket.benefits.length} perks</span>
                      )}
                    </div>
                  </div>

                  {/* Price + Button */}
                  <div className="flex-shrink-0 flex flex-col items-end justify-between px-3 py-2.5 gap-1">
                    <p className="text-[15px] font-extrabold text-[#0F172A] whitespace-nowrap">£{ticket.price.toFixed(2)}</p>
                    {/* Qty selector (compact) */}
                    <div className="flex items-center gap-1">
                      <select
                        value={qty}
                        onChange={e => {
                          e.stopPropagation();
                          setQuantities({ ...quantities, [ticket.id]: Number(e.target.value) });
                        }}
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] border border-[#E5E7EB] rounded px-1 py-0.5 bg-white text-[#374151] w-12"
                      >
                        {ticket.quantityOptions.map(q => <option key={q} value={q}>{q} tkts</option>)}
                      </select>
                      {/* Green → button */}
                      <button
                        onClick={e => { e.stopPropagation(); handleBuyNow(ticket, qty); }}
                        disabled={buyingId === ticket.id}
                        className="w-8 h-8 rounded-full bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 flex items-center justify-center transition-colors flex-shrink-0 shadow-sm"
                      >
                        {buyingId === ticket.id ? (
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-[13px] text-[#6B7280]">
                No tickets match your filters.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Seat Map (fills remaining) */}
        <div ref={seatMapRef} className="flex-1 bg-[#F8FAFC] hidden lg:flex flex-col">
          <SeatMap
            venueName={match.venue.name}
            mapUrl={mapUrl || undefined}
            sections={seatMapSections}
            selectedSection={selectedMapSection}
            hoverSection={hoveredTicketSection}
            onSectionClick={setSelectedMapSection}
          />
        </div>
      </div>
    </main>
  );
}
