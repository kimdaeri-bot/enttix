'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  ticketedOrders: number;
  totalRevenue: number;
  todayOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, paidOrders: 0, ticketedOrders: 0, totalRevenue: 0, todayOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (orders) {
      const today = new Date().toISOString().slice(0, 10);
      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        paidOrders: orders.filter(o => o.status === 'paid').length,
        ticketedOrders: orders.filter(o => o.status === 'ticketed').length,
        totalRevenue: orders.filter(o => ['paid', 'ticketed'].includes(o.status)).reduce((sum, o) => sum + Number(o.total_price), 0),
        todayOrders: orders.filter(o => o.created_at?.slice(0, 10) === today).length,
      });
      setRecentOrders(orders.slice(0, 10));
    }
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-[#FEF3C7] text-[#92400E]',
    confirmed: 'bg-[#DBEAFE] text-[#1D4ED8]',
    paid: 'bg-[#D1FAE5] text-[#065F46]',
    ticketed: 'bg-[#EDE9FE] text-[#5B21B6]',
    cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
    refunded: 'bg-[#F3F4F6] text-[#374151]',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-[24px] font-bold text-white mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: stats.totalOrders, icon: '📋', color: '#2B7FFF' },
          { label: 'Pending', value: stats.pendingOrders, icon: '⏳', color: '#F59E0B' },
          { label: 'Paid', value: stats.paidOrders, icon: '💰', color: '#10B981' },
          { label: 'Ticketed', value: stats.ticketedOrders, icon: '🎫', color: '#7C3AED' },
        ].map(s => (
          <div key={s.label} className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[24px]">{s.icon}</span>
              <span className="text-[28px] font-bold text-white">{s.value}</span>
            </div>
            <p className="text-[12px] text-[#94A3B8]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue + Today */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
          <p className="text-[12px] text-[#94A3B8] mb-1">Total Revenue</p>
          <p className="text-[28px] font-bold text-[#10B981]">£{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
          <p className="text-[12px] text-[#94A3B8] mb-1">Today&apos;s Orders</p>
          <p className="text-[28px] font-bold text-white">{stats.todayOrders}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#334155]">
          <h2 className="text-[16px] font-bold text-white">Recent Orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[#64748B] text-[14px]">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Order</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Customer</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Event</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Amount</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30 transition-colors">
                    <td className="px-5 py-3 text-[13px] text-[#2B7FFF] font-mono font-semibold">{order.order_number}</td>
                    <td className="px-5 py-3">
                      <p className="text-[13px] text-white">{order.customer_name}</p>
                      <p className="text-[11px] text-[#64748B]">{order.customer_email}</p>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#CBD5E1] max-w-[200px] truncate">{order.event_name}</td>
                    <td className="px-5 py-3 text-[13px] text-white font-semibold">{order.currency} {Number(order.total_price).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[order.status] || 'bg-[#F3F4F6] text-[#374151]'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-[#94A3B8]">{new Date(order.created_at).toLocaleDateString('ko-KR')}</td>
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
