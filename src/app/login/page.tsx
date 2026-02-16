'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Demo login
    if (email && password) {
      localStorage.setItem('user', JSON.stringify({ email, name: email.split('@')[0] }));
      router.push('/');
    } else {
      setError('Please enter email and password');
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="hero-bg">
        <Header transparent />
      </div>
      <div className="max-w-[440px] mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-[20px] p-8 shadow-lg border border-[#E5E7EB]">
          <h1 className="text-[24px] font-bold text-[#171717] mb-2">Login</h1>
          <p className="text-[14px] text-[#6B7280] mb-6">Sign in to your Enttix account</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-[13px] font-semibold text-[#374151] mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-[12px] border border-[#E5E7EB] text-[14px] outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#374151] mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-[12px] border border-[#E5E7EB] text-[14px] outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
              />
            </div>
            <div className="text-right">
              <a href="#" className="text-[13px] text-[#2B7FFF] hover:text-[#1D6AE5]">Forgot your password?</a>
            </div>
            {error && <p className="text-[13px] text-[#EF4444]">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white font-semibold text-[14px] py-3.5 rounded-[12px] transition-colors active:scale-[0.98]"
            >
              Login
            </button>
          </form>
        </div>
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </main>
  );
}
