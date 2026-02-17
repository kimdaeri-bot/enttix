'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Button that opens the Ask AI modal — used in hero and filter bars
export function AskAIButton({ variant = 'default' }: { variant?: 'default' | 'pill' | 'filter' }) {
  const [open, setOpen] = useState(false);

  const styles = {
    default: 'flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[13px] font-semibold text-[#DBEAFE] hover:text-white transition-all border border-white/15 hover:border-white/30 backdrop-blur-sm',
    pill: 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[12px] font-medium text-[#DBEAFE] transition-colors',
    filter: 'flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] hover:border-[#2B7FFF] bg-white hover:bg-[#F8FAFC] text-[13px] font-semibold text-[#374151] hover:text-[#2B7FFF] transition-all active:scale-95 shadow-sm',
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={styles[variant]}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="currentColor" opacity="0.9"/>
        </svg>
        Ask AI
      </button>
      {open && <AskAiModal onClose={() => setOpen(false)} />}
    </>
  );
}

export default function AskAiModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('ai-search-result', JSON.stringify(data));
        onClose();
        router.push(`/all-tickets?ai=1&q=${encodeURIComponent(query.trim())}`);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[520px] bg-white rounded-[20px] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[18px]">✨</span>
            <h3 className="text-[17px] font-bold text-[#171717]">Ask AI</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#9CA3AF] hover:text-[#374151] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input */}
        <div className="px-6 py-3">
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={"어떤 이벤트를 찾으시나요?\n\n예: 3월 런던 프리미어리그 경기\n예: Cheap F1 tickets in Europe\n예: 이번 주말 축구 경기 알려줘"}
            className="w-full h-[160px] px-4 py-3.5 rounded-[14px] bg-[#F8FAFC] border border-[#E5E7EB] focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/10 outline-none text-[15px] text-[#171717] placeholder:text-[#94A3B8] resize-none leading-[22px] transition-all"
            autoFocus
            disabled={loading}
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || loading}
            className="w-full py-3.5 rounded-[12px] bg-[#2B7FFF] hover:bg-[#1D6AE5] disabled:bg-[#94A3B8] text-white font-semibold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI가 검색 중...
              </>
            ) : (
              <>
                <span>✨</span>
                Find Events
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-[#9CA3AF] mt-2.5">
            Powered by AI · 한국어 & English supported
          </p>
        </div>
      </div>
    </div>
  );
}
