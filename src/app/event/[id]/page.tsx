'use client';
import Header from '@/components/Header';
import { useState, use } from 'react';
import { demoData } from '@/lib/api';

interface Ticket {
  id: string;
  section: string;
  row: string;
  type: string;
  price: number;
  maxQty: number;
}

const demoTickets: Ticket[] = [
  { id: 't1', section: '104', row: 'Standing', type: 'eTicket', price: 151.45, maxQty: 11 },
  { id: 't2', section: '101', row: 'Standing', type: 'eTicket', price: 151.45, maxQty: 11 },
  { id: 't3', section: '025', row: 'Standing', type: 'eTicket', price: 151.45, maxQty: 11 },
  { id: 't4', section: '001', row: 'Standing', type: 'eTicket', price: 151.45, maxQty: 11 },
];

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const match = demoData.matches.find(m => m.id === id);
  const [cart, setCart] = useState<{ ticket: Ticket; qty: number } | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!match) {
    return <div className="min-h-screen flex items-center justify-center text-[24px] font-bold">Event not found</div>;
  }

  const date = new Date(match.datetime);

  const addToCart = (ticket: Ticket) => {
    const qty = quantities[ticket.id] || 1;
    setCart({ ticket, qty });
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]">
        <Header />
      </div>

      {/* Event Header */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
            <div className="text-center flex-1">
              <div className="w-16 h-16 rounded-full bg-[#F1F5F9] mx-auto mb-3 flex items-center justify-center text-[18px] font-bold text-[#475569]">
                {match.homeTeam.split(' ').map(w => w[0]).join('').slice(0, 3)}
              </div>
              <h2 className="text-[18px] font-bold text-[#171717]">{match.homeTeam}</h2>
            </div>
            <div className="text-center">
              <span className="text-[14px] font-bold text-[#94A3B8]">vs</span>
            </div>
            <div className="text-center flex-1">
              <div className="w-16 h-16 rounded-full bg-[#F1F5F9] mx-auto mb-3 flex items-center justify-center text-[18px] font-bold text-[#475569]">
                {match.awayTeam.split(' ').map(w => w[0]).join('').slice(0, 3)}
              </div>
              <h2 className="text-[18px] font-bold text-[#171717]">{match.awayTeam}</h2>
            </div>
          </div>
          <div className="text-center mt-4 text-[14px] text-[#6B7280]">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            <span className="mx-2">•</span>
            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            <span className="mx-2">•</span>
            {match.venue.name}
          </div>
        </div>
      </div>

      {/* Listings + Seat Map */}
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Ticket Listings */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#171717]">{demoTickets.length} Listings</h3>
              <div className="flex items-center gap-2">
                <select className="px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] bg-white">
                  <option>1+ tickets</option>
                  <option>2+ tickets</option>
                  <option>4+ tickets</option>
                </select>
                <select className="px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] bg-white">
                  <option>All Sections</option>
                </select>
                <select className="px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] bg-white">
                  <option>All Ticket Types</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {demoTickets.map(ticket => (
                <div key={ticket.id} className="ticket-card">
                  <div className="text-center">
                    <div className="text-[20px] font-extrabold text-[#171717]">{ticket.section}</div>
                  </div>
                  <div>
                    <div className="text-[13px] text-[#6B7280]">
                      Row • Seat • Up to {ticket.maxQty}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[11px] font-semibold text-[#475569]">
                        {ticket.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-bold text-[#171717]">${ticket.price.toFixed(2)}</div>
                    <div className="text-[11px] text-[#9CA3AF]">per ticket</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={quantities[ticket.id] || 1}
                      onChange={e => setQuantities({ ...quantities, [ticket.id]: parseInt(e.target.value) })}
                      className="w-14 px-2 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] text-center"
                    >
                      {Array.from({ length: Math.min(ticket.maxQty, 10) }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => addToCart(ticket)}
                      className="px-5 py-2.5 rounded-[8px] bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white text-[13px] font-semibold transition-colors active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seat Map / Cart Sidebar */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            {/* Seat Map Placeholder */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 mb-4">
              <h3 className="text-[16px] font-bold text-[#171717] mb-1">{match.venue.name}</h3>
              <p className="text-[13px] text-[#9CA3AF] mb-4">Seat Map</p>
              <div className="w-full aspect-square rounded-[12px] bg-[#F1F5F9] flex items-center justify-center">
                <div className="text-center text-[#9CA3AF]">
                  <p className="text-[14px] font-medium">Interactive seat map coming soon</p>
                  <p className="text-[12px] mt-1">Select tickets from the list on the left to add them to your cart.</p>
                </div>
              </div>
            </div>

            {/* Shopping Cart */}
            {cart && (
              <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#2B7FFF] text-white text-[12px] font-bold flex items-center justify-center">1</span>
                  <h3 className="text-[16px] font-bold text-[#171717]">Shopping Cart</h3>
                </div>
                <p className="text-[13px] text-[#6B7280] mb-4">1 listing selected</p>

                <div className="border border-[#E5E7EB] rounded-[8px] p-4 mb-4">
                  <div className="text-[13px] font-semibold text-[#171717]">Longside Middle Tier Central</div>
                  <div className="text-[12px] text-[#6B7280] mt-1">Section {cart.ticket.section} • Row</div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[12px] text-[#6B7280]">Qty:</span>
                    <span className="text-[15px] font-bold text-[#171717]">$ {(cart.ticket.price * cart.qty).toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-[#FFF7ED] rounded-[8px] p-3 mb-4 text-[12px] text-[#92400E]">
                  You can only select one section at a time. Adding a new section will replace the current one.
                </div>

                <div className="flex items-center justify-between mb-4 pt-3 border-t border-[#E5E7EB]">
                  <span className="text-[14px] font-semibold text-[#171717]">Total</span>
                  <span className="text-[20px] font-bold text-[#171717]">$ {(cart.ticket.price * cart.qty).toFixed(2)}</span>
                </div>

                <a
                  href="/checkout"
                  className="block w-full text-center bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white font-semibold text-[14px] py-3.5 rounded-[12px] transition-colors"
                >
                  Checkout
                </a>
                <p className="text-center text-[11px] text-[#9CA3AF] mt-2">
                  🔒 Secured with SSL encryption
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
