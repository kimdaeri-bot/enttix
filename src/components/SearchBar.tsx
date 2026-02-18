'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

function isPlannerQuery(q: string): boolean {
  const lower = q.toLowerCase();
  const kw = ['plan','planner','itinerary','trip','travel','일정','여행','계획','짜줘','짜주','박','코스','days in','day trip','weekend in','getaway'];
  return kw.some(k => lower.includes(k));
}

const AI_SUGGESTIONS = [
  'Premier League matches in London this month',
  '3월 유럽 축구 경기 찾아줘',
  'Cheap F1 tickets in Europe',
  '이번 주말 런던 경기',
  'Arsenal vs Chelsea tickets under $200',
  'La Liga matches in March',
];

const PLANNER_SUGGESTIONS = [
  '런던 3박4일 여행 일정 짜줘',
  'Plan a 3-day trip to Barcelona',
  '파리 5박6일 여행 계획',
  '4 days in Manchester with football',
];

const CATEGORIES = [
  'All Categories','Football','Formula 1','NBA','Tennis','Golf','Rugby',
  'Pop','Rock','Hip-hop','Classical','Electronic',
];

interface PlannerItem {
  time: string;
  type: string;
  name: string;
  desc: string;
  event_id?: number | null;
  price?: number | null;
  event_date?: string | null;
  venue?: string | null;
  bookable?: boolean;
}
interface PlannerDay { day: number; date: string; title: string; items: PlannerItem[]; }
interface PlannerResult { city: string; country: string; days: PlannerDay[]; }
interface AISearchResult { aiMessage?: string; summary?: string; events?: any[]; }

const typeConfig: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  attraction: { icon: '🏛️', label: 'Attraction', color: '#6366F1', bg: '#EEF2FF' },
  food: { icon: '🍽️', label: 'Restaurant', color: '#F59E0B', bg: '#FFFBEB' },
  cafe: { icon: '☕', label: 'Cafe', color: '#92400E', bg: '#FEF3C7' },
  dessert: { icon: '🍰', label: 'Dessert', color: '#EC4899', bg: '#FCE7F3' },
  event: { icon: '🎫', label: 'Event', color: '#2B7FFF', bg: '#EFF6FF' },
  shopping: { icon: '🛍️', label: 'Shopping', color: '#10B981', bg: '#ECFDF5' },
  transport: { icon: '🚇', label: 'Transport', color: '#6B7280', bg: '#F3F4F6' },
};

// Google Calendar URL builder
function buildCalendarUrl(title: string, date: string, time: string, desc: string, location: string, durationMin = 60): string {
  const dt = date.replace(/-/g, '') + 'T' + time.replace(':', '') + '00';
  const h = Math.floor(durationMin / 60);
  const m = durationMin % 60;
  const endH = parseInt(time.split(':')[0]) + h;
  const endM = (parseInt(time.split(':')[1]) + m) % 60;
  const endDt = date.replace(/-/g, '') + 'T' + String(endH).padStart(2, '0') + String(endM).padStart(2, '0') + '00';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dt}/${endDt}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}`;
}

// Build Google Calendar URL for entire day
function buildDayCalendarUrl(day: PlannerDay, city: string): string {
  const items = day.items.map(i => `${i.time} ${(typeConfig[i.type] || typeConfig.attraction).icon} ${i.name} - ${i.desc}`).join('\n');
  const dt = day.date.replace(/-/g, '') + 'T090000';
  const endDt = day.date.replace(/-/g, '') + 'T230000';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${city} Day ${day.day}: ${day.title}`)}&dates=${dt}/${endDt}&details=${encodeURIComponent(items)}&location=${encodeURIComponent(city)}`;
}

// Google Maps search URL
function buildMapsUrl(name: string, city: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + city)}`;
}

export default function SearchBar({ compact = false, fullWidth = false, inline = false }: { compact?: boolean; fullWidth?: boolean; inline?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [category, setCategory] = useState('All Categories');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mode, setMode] = useState<'search' | 'planner'>('search');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Inline result states
  const [plannerResult, setPlannerResult] = useState<PlannerResult | null>(null);
  const [aiResult, setAiResult] = useState<AISearchResult | null>(null);
  const [resultCollapsed, setResultCollapsed] = useState(false);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    if (query.trim()) setMode(isPlannerQuery(query) ? 'planner' : 'search');
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowCatDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [query]);

  // Scroll to active day card
  useEffect(() => {
    if (scrollRef.current && plannerResult) {
      const idx = activeDay === 0 ? 0 : activeDay - 1;
      const cards = scrollRef.current.children;
      if (cards[idx]) {
        (cards[idx] as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }
    }
  }, [activeDay, plannerResult]);

  // Touch swipe for day switching
  const swipeStartX = useRef(0);
  const swipeEndX = useRef(0);
  const isDragging = useRef(false);
  const handleSwipeStart = (x: number) => { swipeStartX.current = x; swipeEndX.current = x; isDragging.current = true; };
  const handleSwipeMove = (x: number) => { if (isDragging.current) swipeEndX.current = x; };
  const handleSwipeEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = swipeStartX.current - swipeEndX.current;
    if (Math.abs(diff) > 50 && plannerResult) {
      if (diff > 0 && activeDay < plannerResult.days.length) setActiveDay(activeDay + 1);
      if (diff < 0 && activeDay > 1) setActiveDay(activeDay - 1);
    }
  };

  const handleSaveTrip = async () => {
    if (!user) { router.push('/login'); return; }
    if (!plannerResult || saveStatus === 'saving' || saveStatus === 'saved') return;
    setSaveStatus('saving');
    const { error } = await supabase.from('saved_trips').insert({
      user_id: user.id,
      query: query,
      city: plannerResult.city,
      country: plannerResult.country,
      days_json: plannerResult.days,
    });
    if (error) { setSaveStatus('idle'); alert('저장 실패: ' + error.message); }
    else { setSaveStatus('saved'); setShowSaveToast(true); setTimeout(() => setShowSaveToast(false), 3000); }
  };

  const handleExpand = () => {
    setExpanded(true);
    setShowDropdown(true);
    setShowCatDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const doInlineSearch = async (q: string) => {
    setLoading(true);
    setShowDropdown(false);
    setPlannerResult(null);
    setAiResult(null);
    setResultCollapsed(false);

    if (isPlannerQuery(q)) {
      try {
        const res = await fetch('/api/planner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
        const data = await res.json();
        if (data.city) { setPlannerResult(data); setActiveDay(1); }
      } catch {}
    } else {
      try {
        const res = await fetch('/api/ai-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q + (category !== 'All Categories' ? ` ${category}` : '') + (date ? ` on ${date}` : '') }) });
        if (res.ok) setAiResult(await res.json());
      } catch {}
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    if (inline) { doInlineSearch(query.trim()); return; }
    if (isPlannerQuery(query)) { router.push(`/all-tickets?planner=1&q=${encodeURIComponent(query.trim())}`); return; }
    setLoading(true); setShowDropdown(false);
    try {
      const res = await fetch('/api/ai-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: query.trim() + (category !== 'All Categories' ? ` ${category}` : '') + (date ? ` on ${date}` : '') }) });
      if (res.ok) { const data = await res.json(); sessionStorage.setItem('ai-search-result', JSON.stringify(data)); router.push(`/all-tickets?ai=1&q=${encodeURIComponent(query.trim())}`); }
    } catch { router.push(`/all-tickets?q=${encodeURIComponent(query.trim())}`); }
    finally { setLoading(false); }
  };

  const handleSuggestionClick = (s: string) => {
    setQuery(s); setShowDropdown(false);
    if (inline) { doInlineSearch(s); return; }
    if (isPlannerQuery(s)) { router.push(`/all-tickets?planner=1&q=${encodeURIComponent(s)}`); return; }
    setLoading(true);
    fetch('/api/ai-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: s }) })
      .then(r => r.json()).then(data => { sessionStorage.setItem('ai-search-result', JSON.stringify(data)); router.push(`/all-tickets?ai=1&q=${encodeURIComponent(s)}`); })
      .catch(() => router.push(`/all-tickets?q=${encodeURIComponent(s)}`)).finally(() => setLoading(false));
  };

  const filtered = query.trim() ? AI_SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()) || query.length >= 2) : AI_SUGGESTIONS;
  const dateLabel = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Dates';

  return (
    <div ref={containerRef} className={`relative w-full z-[60] ${fullWidth ? '' : 'max-w-[580px]'}`}>
      {/* Search Bar Pill */}
      <div className={`relative z-[110] bg-white rounded-full shadow-xl border border-[#E0E7EF] flex items-center transition-all duration-300 ${expanded ? 'ring-2 ring-[#2B7FFF]/20 border-[#2B7FFF]/30' : ''} ${compact ? 'px-1.5 py-1.5' : 'px-2 py-2'}`}>
        <div className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ${expanded ? 'flex-1 min-w-0' : 'flex-shrink-0'} ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`} onClick={!expanded ? handleExpand : undefined}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#7C3AED]"><path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="currentColor" opacity="0.8"/></svg>
          {expanded ? (
            <>
            <input ref={inputRef} type="text" value={query} onChange={e => { setQuery(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }} placeholder="Search events with AI..." className="flex-1 text-[15px] text-[#171717] outline-none bg-transparent placeholder:text-[#94A3B8] min-w-0" disabled={loading} />
            {query && !loading && (
              <button onClick={() => { setQuery(''); setPlannerResult(null); setAiResult(null); setShowDropdown(false); inputRef.current?.focus(); }} className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E2E8F0] hover:bg-[#CBD5E1] flex items-center justify-center transition-colors mr-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
            </>
          ) : (
            <span className={`${compact ? 'text-[13px]' : 'text-[15px]'} font-medium text-[#64748B]`}>Search</span>
          )}
        </div>
        <div className="w-px h-7 bg-[#E5E7EB] flex-shrink-0" />
        <div className="relative flex-shrink-0">
          <button onClick={() => { setShowCatDropdown(false); setShowDatePicker(!showDatePicker); setShowDropdown(false); }} className={`flex items-center gap-1 ${compact ? 'px-2 md:px-3 py-1.5' : 'px-4 py-2'} hover:bg-[#F8FAFC] rounded-full transition-colors`}>
            <span className={`hidden md:inline ${compact ? 'text-[13px]' : 'text-[15px]'} font-medium ${date ? 'text-[#171717]' : 'text-[#64748B]'}`}>{dateLabel}</span>
            <span className={`md:hidden text-[11px] font-medium ${date ? 'text-[#171717]' : 'text-[#64748B]'}`}>{date ? dateLabel : 'Date'}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-3 z-50">
              <input ref={dateRef} type="date" value={date} onChange={e => { setDate(e.target.value); setShowDatePicker(false); }} className="text-[14px] text-[#171717] outline-none" autoFocus />
              {date && <button onClick={() => { setDate(''); setShowDatePicker(false); }} className="block mt-1 text-[12px] text-[#EF4444] hover:underline">Clear</button>}
            </div>
          )}
        </div>
        <div className="w-px h-7 bg-[#E5E7EB] flex-shrink-0" />
        <div className="relative flex-shrink-0">
          <button onClick={() => { setShowDatePicker(false); setShowCatDropdown(!showCatDropdown); setShowDropdown(false); }} className={`flex items-center gap-1 ${compact ? 'px-2 md:px-3 py-1.5' : 'px-4 py-2'} hover:bg-[#F8FAFC] rounded-full transition-colors`}>
            <span className={`hidden md:inline ${compact ? 'text-[13px]' : 'text-[15px]'} font-medium ${category !== 'All Categories' ? 'text-[#171717]' : 'text-[#64748B]'}`}>{category === 'All Categories' ? 'Category' : category}</span>
            <span className={`md:hidden text-[11px] font-medium ${category !== 'All Categories' ? 'text-[#171717]' : 'text-[#64748B]'}`}>{category === 'All Categories' ? 'Type' : category}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {showCatDropdown && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-[#E5E7EB] py-1 min-w-[180px] z-50 max-h-[280px] overflow-y-auto">
              {CATEGORIES.map(cat => (<button key={cat} onClick={() => { setCategory(cat); setShowCatDropdown(false); }} className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F1F5F9] transition-colors ${category === cat ? 'text-[#2B7FFF] font-semibold bg-[#EFF6FF]' : 'text-[#374151]'}`}>{cat}</button>))}
            </div>
          )}
        </div>
        <button onClick={expanded ? handleSearch : handleExpand} disabled={loading} className={`flex-shrink-0 ${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-[#2B7FFF] hover:bg-[#1D6AE5] flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-60 ml-1`}>
          {loading ? (<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>) : (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>)}
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && expanded && !loading && (
        <div className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-[16px] shadow-2xl border border-[#E5E7EB] py-2 z-[100] overflow-hidden`}>
          {query.trim() && (
            <div className="px-3 py-1">
              <button onClick={() => { setQuery(query); setShowDropdown(false); inputRef.current?.focus(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F1F5F9] transition-colors text-left">
                {mode === 'planner' ? (<span className="text-[#2B7FFF]"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></span>) : (<span className="text-[#9CA3AF]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></span>)}
                <span className="text-[14px] text-[#171717] font-medium flex-1">{query}</span>
                {mode === 'planner' && <span className="text-[11px] font-semibold text-[#2B7FFF] bg-[#EFF6FF] px-2 py-0.5 rounded-full">✈️ Trip Planner</span>}
              </button>
            </div>
          )}
          {query.trim() && <div className="h-px bg-[#E5E7EB] mx-3 my-1" />}
          <div className="px-3 py-1">
            <p className="text-[10px] font-semibold text-[#9CA3AF] tracking-[0.5px] uppercase px-3 py-1.5">✨ AI Search</p>
            {(!query.trim() ? AI_SUGGESTIONS : filtered.slice(0, 3)).map((s, i) => (<button key={`ai-${i}`} onClick={() => { setQuery(s); setShowDropdown(false); inputRef.current?.focus(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F1F5F9] transition-colors text-left"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#7C3AED]"><path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="currentColor" opacity="0.6"/></svg><span className="text-[14px] text-[#4B5563]">{s}</span></button>))}
          </div>
          <div className="h-px bg-[#E5E7EB] mx-3 my-1" />
          <div className="px-3 py-1">
            <p className="text-[10px] font-semibold text-[#9CA3AF] tracking-[0.5px] uppercase px-3 py-1.5">✈️ Trip Planner</p>
            {PLANNER_SUGGESTIONS.slice(0, query.trim() ? 2 : 4).map((s, i) => (<button key={`pl-${i}`} onClick={() => { setQuery(s); setShowDropdown(false); inputRef.current?.focus(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F1F5F9] transition-colors text-left"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#2B7FFF]"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" opacity="0.6"/></svg><span className="text-[14px] text-[#4B5563]">{s}</span></button>))}
          </div>
        </div>
      )}

      {/* ====== INLINE LOADING ====== */}
      {inline && loading && (
        <div className="mt-4 flex flex-col items-center gap-3 py-8">
          <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
          <p className="text-[rgba(219,234,254,0.7)] text-[14px]">{mode === 'planner' ? '✨ AI가 여행 일정을 만들고 있습니다...' : '✨ AI가 검색 중...'}</p>
        </div>
      )}

      {/* ====== INLINE PLANNER RESULT ====== */}
      {inline && plannerResult && !loading && (
        <div className="mt-4 relative z-[10]">
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-white/95 backdrop-blur rounded-t-2xl border border-[#E5E7EB] border-b-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2B7FFF] to-[#7C3AED] flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"/></svg>
              </div>
              <span className="text-[14px] font-bold text-[#0F172A]">📍 {plannerResult.city}, {plannerResult.country}</span>
              <span className="text-[12px] text-[#94A3B8]">{plannerResult.days.length} days</span>
            </div>
            <button onClick={() => { setPlannerResult(null); setAiResult(null); setSaveStatus('idle'); }} className="text-[11px] text-[#94A3B8] hover:text-[#EF4444] transition-colors">✕ Close</button>
          </div>

          {/* Collapsible content */}
          <div className={`overflow-hidden transition-all duration-400 ease-in-out ${resultCollapsed ? 'max-h-0' : 'max-h-[3000px]'}`}>
            <div className="bg-white/95 backdrop-blur border-x border-[#E5E7EB] shadow-lg">
              {/* Day tabs */}
              <div className="px-5 pt-2 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
                {plannerResult.days.map(day => (
                  <button key={day.day} onClick={() => setActiveDay(day.day)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${activeDay === day.day ? 'bg-[#0F172A] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'}`}>
                    Day {day.day}
                  </button>
                ))}
              </div>

              {/* Swipeable day cards */}
              <div
                onTouchStart={e => handleSwipeStart(e.touches[0].clientX)}
                onTouchMove={e => handleSwipeMove(e.touches[0].clientX)}
                onTouchEnd={handleSwipeEnd}
                onMouseDown={e => { e.preventDefault(); handleSwipeStart(e.clientX); }}
                onMouseMove={e => handleSwipeMove(e.clientX)}
                onMouseUp={handleSwipeEnd}
                onMouseLeave={handleSwipeEnd}
                style={{ cursor: 'grab', userSelect: 'none' }}>
                {plannerResult.days.filter(day => activeDay === 0 || activeDay === day.day).map(day => (
                  <div key={day.day} className="px-5 pb-4">
                    {/* Day header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-[#0F172A] flex items-center justify-center text-white font-bold text-[11px]">D{day.day}</div>
                      <div className="flex-1">
                        <h4 className="text-[#0F172A] font-bold text-[14px] leading-tight">{day.title}</h4>
                        <p className="text-[#94A3B8] text-[11px]">{day.date}</p>
                      </div>
                      {/* Save trip button */}
                      <button onClick={handleSaveTrip}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${saveStatus === 'saved' ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#EFF6FF] text-[#2B7FFF] hover:bg-[#DBEAFE]'}`}>
                        {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '✓ 저장됨' : '💾 일정 저장'}
                      </button>
                    </div>

                    {/* Timeline items */}
                    <div className="ml-3.5 border-l-2 border-[#E2E8F0] pl-4 space-y-2">
                      {day.items.map((item, idx) => {
                        const cfg = typeConfig[item.type] || typeConfig.attraction;
                        const isBookable = item.bookable === true;
                        const hasTicket = item.type === 'event' && item.event_id;

                        return (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[21px] top-2.5 w-2 h-2 rounded-full border-2 border-white" style={{ backgroundColor: cfg.color }} />
                            <div className={`rounded-lg p-3 border ${item.type === 'event' ? 'bg-white border-[#E2E8F0]' : 'bg-[#FAFBFC] border-[#F1F5F9]'}`}>
                              <div className="flex items-start gap-2">
                                <span className="text-[16px]">{cfg.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[#94A3B8] text-[10px] font-mono">{item.time}</span>
                                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1 py-0.5 rounded" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
                                  </div>
                                  <h5 className="text-[#0F172A] font-semibold text-[13px] leading-snug">{item.name}</h5>
                                  <p className="text-[#64748B] text-[11px]">{item.desc}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {item.venue && <span className="text-[#94A3B8] text-[10px]">📍 {item.venue}</span>}
                                    <a href={buildMapsUrl(item.name, plannerResult.city)} target="_blank" rel="noopener noreferrer"
                                      className="text-[10px] text-[#2B7FFF] hover:underline font-medium inline-flex items-center gap-0.5"><svg width="10" height="10" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> 지도저장</a>
                                    <a href={buildCalendarUrl(item.name, day.date, item.time, item.desc, item.venue || plannerResult.city)} target="_blank" rel="noopener noreferrer"
                                      className="text-[10px] text-[#2B7FFF] hover:underline font-medium inline-flex items-center gap-0.5"><svg width="10" height="10" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> 캘린더저장</a>
                                  </div>
                                </div>

                                {/* Booking button */}
                                {isBookable && (
                                  <button
                                    disabled={!hasTicket}
                                    className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                      hasTicket
                                        ? 'bg-[#2B7FFF] text-white hover:bg-[#1D6AE5] cursor-pointer'
                                        : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                                    }`}
                                  >
                                    {hasTicket ? (item.price ? `🎫 $${item.price}` : '🎫 Book') : '🎫 예약'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Swipe hint for mobile */}
                    {activeDay !== 0 && day.day < plannerResult.days.length && (
                      <div className="flex items-center justify-center mt-3 gap-1.5">
                        {plannerResult.days.map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i + 1 === activeDay ? 'bg-[#2B7FFF] w-4' : 'bg-[#D1D5DB]'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Nav arrows for day switching */}
              {activeDay !== 0 && (
                <div className="flex items-center justify-between px-5 pb-3">
                  <button
                    onClick={() => setActiveDay(Math.max(1, activeDay - 1))}
                    disabled={activeDay <= 1}
                    className={`flex items-center gap-1 text-[12px] font-semibold transition-colors ${activeDay <= 1 ? 'text-[#D1D5DB] cursor-not-allowed' : 'text-[#2B7FFF] hover:text-[#1D6AE5]'}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Prev
                  </button>
                  <span className="text-[11px] text-[#94A3B8]">Day {activeDay} / {plannerResult.days.length}</span>
                  <button
                    onClick={() => setActiveDay(Math.min(plannerResult.days.length, activeDay + 1))}
                    disabled={activeDay >= plannerResult.days.length}
                    className={`flex items-center gap-1 text-[12px] font-semibold transition-colors ${activeDay >= plannerResult.days.length ? 'text-[#D1D5DB] cursor-not-allowed' : 'text-[#2B7FFF] hover:text-[#1D6AE5]'}`}
                  >
                    Next
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Collapse button at bottom */}
          <button
            onClick={() => setResultCollapsed(!resultCollapsed)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white/95 backdrop-blur rounded-b-2xl border border-[#E5E7EB] border-t-0 hover:bg-[#F8FAFC] transition-colors"
          >
            <span className="text-[12px] font-semibold text-[#64748B]">{resultCollapsed ? '펼치기' : '접기'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"
              className={`transition-transform ${resultCollapsed ? 'rotate-180' : ''}`}>
              <path d="M18 15l-6-6-6 6"/>
            </svg>
          </button>
        </div>
      )}

      {/* ====== INLINE AI RESULT ====== */}
      {inline && aiResult && !loading && (
        <div className="mt-4 relative z-[10]">
          <div className="flex items-center justify-between px-5 py-3 bg-white/95 backdrop-blur rounded-t-2xl border border-[#E5E7EB] border-b-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2B7FFF] to-[#7C3AED] flex items-center justify-center"><svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"/></svg></div>
              <span className="text-[14px] font-semibold text-[#0F172A]">✨ AI Search Results</span>
              <span className="text-[12px] text-[#94A3B8]">{aiResult.events?.length || 0} events</span>
            </div>
            <button onClick={() => { setAiResult(null); setPlannerResult(null); }} className="text-[11px] text-[#94A3B8] hover:text-[#EF4444] transition-colors">✕ Close</button>
          </div>
          <div className={`overflow-hidden transition-all duration-400 ${resultCollapsed ? 'max-h-0' : 'max-h-[800px]'}`}>
            <div className="bg-white/95 backdrop-blur border-x border-[#E5E7EB] shadow-lg px-5 py-4">
              {(aiResult.aiMessage || aiResult.summary) && <p className="text-[14px] text-[#374151] leading-[21px] mb-3">{aiResult.aiMessage || aiResult.summary}</p>}
              {aiResult.events && aiResult.events.length > 0 ? (
                <div className="space-y-2 max-h-[450px] overflow-y-auto">
                  {aiResult.events.slice(0, 10).map((ev: any, i: number) => {
                    const evId = ev.id || ev.event_id;
                    const evName = ev.name || ev.title || '';
                    const evDate = ev.datetime || ev.date || '';
                    const evVenue = ev.venue?.name || ev.venue || '';
                    const evCity = ev.venue?.city || '';
                    const evPrice = ev.min_ticket_price || ev.starting_price || ev.price;
                    const evCurrency = ev.currency || '£';
                    const dateObj = evDate ? new Date(evDate) : null;
                    const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : '';
                    const timeStr = dateObj ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

                    return (
                      <a
                        key={i}
                        href={evId ? `/event/${evId}` : '#'}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#2B7FFF]/40 hover:shadow-md transition-all cursor-pointer group"
                      >
                        {/* Date badge */}
                        <div className="flex-shrink-0 w-[52px] h-[52px] rounded-xl bg-[#0F172A] flex flex-col items-center justify-center text-white">
                          <span className="text-[10px] font-bold uppercase leading-none">{dateStr.split(',')[0]}</span>
                          <span className="text-[18px] font-extrabold leading-tight">{dateObj ? dateObj.getDate() : ''}</span>
                          <span className="text-[9px] opacity-60 leading-none">{dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short' }) : ''}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[#0F172A] font-semibold text-[13px] leading-snug group-hover:text-[#2B7FFF] transition-colors">{evName}</p>
                          <p className="text-[#94A3B8] text-[11px] mt-0.5">{timeStr}{evVenue ? ` · ${evVenue}` : ''}{evCity ? `, ${evCity}` : ''}</p>
                          {evPrice ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[#2B7FFF] font-bold text-[13px]">From {evCurrency}{evPrice}</span>
                              <span className="text-[9px] text-[#10B981] bg-[#ECFDF5] px-1.5 py-0.5 rounded font-semibold">AVAILABLE</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#94A3B8] mt-1 inline-block">Price TBD</span>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F1F5F9] group-hover:bg-[#2B7FFF] flex items-center justify-center transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#94A3B8] group-hover:text-white transition-colors"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (<p className="text-[#94A3B8] text-[13px]">No matching events found</p>)}
            </div>
          </div>
          <button onClick={() => setResultCollapsed(!resultCollapsed)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white/95 backdrop-blur rounded-b-2xl border border-[#E5E7EB] border-t-0 hover:bg-[#F8FAFC] transition-colors">
            <span className="text-[12px] font-semibold text-[#64748B]">{resultCollapsed ? '펼치기' : '접기'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" className={`transition-transform ${resultCollapsed ? 'rotate-180' : ''}`}><path d="M18 15l-6-6-6 6"/></svg>
          </button>
        </div>
      )}

      {/* Save Toast */}
      {showSaveToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-[fadeInDown_0.3s_ease-out]">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#0F172A]">저장 완료!</p>
              <p className="text-[12px] text-[#64748B]">My Trips에 일정이 저장되었습니다</p>
            </div>
            <button onClick={() => router.push('/mypage')} className="ml-3 px-3 py-1.5 bg-[#2B7FFF] text-white text-[11px] font-semibold rounded-lg hover:bg-[#1D6AE5] transition-colors">
              보러가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
