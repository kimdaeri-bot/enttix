'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState } from 'react';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const orders = [
    { id: '1', event: 'Chelsea FC vs Leeds United FC', date: 'Feb 12, 2026', status: 'Pending' },
    { id: '2', event: 'Chelsea FC vs Leeds United FC', date: 'Feb 12, 2026', status: 'Pending' },
    { id: '3', event: 'Chelsea FC vs Leeds United FC', date: 'Feb 12, 2026', status: 'Pending' },
  ];

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]">
        <Header />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <h1 className="text-[28px] font-bold text-[#171717] mb-2">My Page</h1>
        <p className="text-[14px] text-[#6B7280] mb-8">Manage your account and view your purchase history</p>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-[240px] flex-shrink-0">
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] overflow-hidden">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'purchases', label: 'Purchase History' },
                { id: 'delete', label: 'Delete Account', danger: true },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-5 py-3.5 text-[14px] font-medium transition-colors border-b border-[#F3F4F6] last:border-0
                    ${activeTab === tab.id ? 'bg-[#EFF6FF] text-[#2B7FFF]' : tab.danger ? 'text-[#EF4444] hover:bg-[#FEF2F2]' : 'text-[#374151] hover:bg-[#F9FAFB]'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <>
                {/* Account Info */}
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 mb-6">
                  <h2 className="text-[16px] font-bold text-[#171717] mb-4">Account Information</h2>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#2B7FFF] flex items-center justify-center text-white text-[18px] font-bold">f</div>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div>
                        <span className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block">NAME</span>
                        <span className="text-[14px] font-medium text-[#171717]">ftest ltest</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block">EMAIL</span>
                        <span className="text-[14px] font-medium text-[#171717]">test@enttix.com</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block">PHONE</span>
                        <span className="text-[14px] font-medium text-[#171717]">01011112222</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block">MEMBER SINCE</span>
                        <span className="text-[14px] font-medium text-[#171717]">January 30, 2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Purchases */}
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[16px] font-bold text-[#171717]">Recent Purchases</h2>
                    <button onClick={() => setActiveTab('purchases')} className="text-[13px] font-semibold text-[#2B7FFF]">View All →</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {orders.map(order => (
                      <div key={order.id} className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
                        <div>
                          <p className="text-[14px] font-medium text-[#171717]">{order.event}</p>
                          <p className="text-[12px] text-[#6B7280]">{order.date}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFF7ED] text-[#F59E0B]">
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'purchases' && (
              <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6">
                <h2 className="text-[16px] font-bold text-[#171717] mb-4">Purchase History</h2>
                <div className="flex flex-col gap-3">
                  {orders.map(order => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
                      <div>
                        <p className="text-[14px] font-medium text-[#171717]">{order.event}</p>
                        <p className="text-[12px] text-[#6B7280]">{order.date}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFF7ED] text-[#F59E0B]">
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
