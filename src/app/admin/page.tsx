'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Stats { totalOrders: number; totalRevenue: number; monthOrders: number; monthRevenue: number; }

const statusColors: Record<string, string> = {
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  confirmed: 'bg-[#DBEAFE] text-[#1D4ED8]',
  paid: 'bg-[#D1FAE5] text-[#065F46]',
  ticketed: 'bg-[#EDE9FE] text-[#5B21B6]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
  refunded: 'bg-[#F3F4F6] text-[#374151]',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, monthOrders: 0, monthRevenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (orders) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthOrders = orders.filter(o => o.created_at >= monthStart);
      setStats({
        totalOrders: orders.length,
        totalRevenue: orders.filter(o => ['paid', 'ticketed'].includes(o.status)).reduce((s, o) => s + Number(o.total_price), 0),
        monthOrders: monthOrders.length,
        monthRevenue: monthOrders.filter(o => ['paid', 'ticketed'].includes(o.status)).reduce((s, o) => s + Number(o.total_price), 0),
      });
      setRecentOrders(orders.slice(0, 10));
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-4 border-[#1E3A8A] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div>
      <h2 className="text-[24px] font-bold text-[#0F172A] mb-6">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Orders', value: stats.totalOrders.toString(), icon: '📋', iconBg: '#DBEAFE', iconColor: '#1E3A8A' },
          { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰', iconBg: '#D1FAE5', iconColor: '#065F46' },
          { label: 'This Month Orders', value: stats.monthOrders.toString(), icon: '📅', iconBg: '#EDE9FE', iconColor: '#5B21B6' },
          { label: 'This Month Revenue', value: `$${stats.monthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💵', iconBg: '#FEF3C7', iconColor: '#92400E' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#64748B] mb-1">{s.label}</p>
                <p className="text-[24px] font-bold text-[#0F172A]">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px]" style={{ backgroundColor: s.iconBg }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-[#0F172A]">Recent Orders</h3>
            <p className="text-[12px] text-[#94A3B8]">Latest ticket orders</p>
          </div>
          <Link href="/admin/orders" className="text-[13px] text-[#1E3A8A] hover:underline font-semibold">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#94A3B8]">No orders yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {['Order ID', 'Customer', 'Event', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 text-[13px] text-[#1E3A8A] font-mono font-semibold">{order.order_number}</td>
                  <td className="px-6 py-4">
                    <p className="text-[13px] text-[#0F172A] font-medium">{order.customer_name}</p>
                    <p className="text-[11px] text-[#94A3B8]">{order.customer_email}</p>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#374151] max-w-[200px] truncate">{order.event_name}</td>
                  <td className="px-6 py-4 text-[13px] text-[#0F172A] font-semibold">${Number(order.total_price).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${statusColors[order.status] || 'bg-[#F3F4F6] text-[#374151]'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[12px] text-[#94A3B8]">
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
