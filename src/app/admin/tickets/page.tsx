'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Ticket {
  id: string;
  ticket_number: string;
  order_id: string;
  seat_info: string;
  barcode: string;
  status: string;
  issued_at: string;
  sent_at: string;
  created_at: string;
  orders?: { order_number: string; customer_name: string; customer_email: string; event_name: string; event_date: string };
}

const TICKET_STATUSES = ['pending', 'issued', 'sent', 'used', 'cancelled'];

const statusColors: Record<string, string> = {
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  issued: 'bg-[#DBEAFE] text-[#1D4ED8]',
  sent: 'bg-[#D1FAE5] text-[#065F46]',
  used: 'bg-[#EDE9FE] text-[#5B21B6]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tickets')
      .select('*, orders(order_number, customer_name, customer_email, event_name, event_date)')
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'issued') updates.issued_at = new Date().toISOString();
    if (status === 'sent') updates.sent_at = new Date().toISOString();
    await supabase.from('tickets').update(updates).eq('id', id);
    setTickets(tickets.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-[24px] font-bold text-white mb-6">Tickets</h1>

      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[48px] mb-2">🎫</p>
            <p className="text-[#64748B]">No tickets yet. Tickets are auto-created when orders are set to &quot;ticketed&quot;.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[#334155]">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Ticket</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Order</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Event</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Seat</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Status</th>
              </tr></thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30 transition-colors">
                    <td className="px-4 py-3 text-[12px] text-[#7C3AED] font-mono font-semibold">{ticket.ticket_number}</td>
                    <td className="px-4 py-3 text-[12px] text-[#2B7FFF] font-mono">{ticket.orders?.order_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-white">{ticket.orders?.customer_name}</p>
                      <p className="text-[10px] text-[#64748B]">{ticket.orders?.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#CBD5E1] max-w-[180px] truncate">{ticket.orders?.event_name}</td>
                    <td className="px-4 py-3 text-[12px] text-[#94A3B8]">{ticket.seat_info || '-'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={ticket.status}
                        onChange={e => updateStatus(ticket.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border-0 outline-none cursor-pointer ${statusColors[ticket.status]}`}
                      >
                        {TICKET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
