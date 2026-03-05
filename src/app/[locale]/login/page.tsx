'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.push('/');
  }, [user, router]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else setMessage('확인 이메일을 발송했습니다. 이메일을 확인해주세요!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push('/');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="hero-bg">
        <Header transparent />
      </div>
      <div className="max-w-[440px] mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-[20px] p-8 shadow-lg border border-[#E5E7EB]">
          <h1 className="text-[24px] font-bold text-[#171717] mb-2">
            {isSignUp ? 'Create Account' : 'Login'}
          </h1>
          <p className="text-[14px] text-[#6B7280] mb-6">
            {isSignUp ? 'Sign up to save your travel plans' : 'Sign in to your Enttix account'}
          </p>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] font-semibold text-[14px] py-3.5 rounded-[12px] transition-colors active:scale-[0.98] mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-[13px] text-[#9CA3AF]">or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <div>
              <label className="text-[13px] font-semibold text-[#374151] mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-[12px] border border-[#E5E7EB] text-[14px] outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#374151] mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isSignUp ? 'Create a password (6+ chars)' : 'Enter your password'}
                className="w-full px-4 py-3 rounded-[12px] border border-[#E5E7EB] text-[14px] outline-none focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/20 transition-all"
                required
                minLength={6}
              />
            </div>

            {error && <p className="text-[13px] text-[#EF4444] bg-[#FEF2F2] px-3 py-2 rounded-lg">{error}</p>}
            {message && <p className="text-[13px] text-[#10B981] bg-[#ECFDF5] px-3 py-2 rounded-lg">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white font-semibold text-[14px] py-3.5 rounded-[12px] transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? '...' : isSignUp ? 'Sign Up' : 'Login'}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-[13px] text-[#6B7280] mt-5">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
              className="text-[#2B7FFF] font-semibold hover:underline"
            >
              {isSignUp ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </main>
  );
}
