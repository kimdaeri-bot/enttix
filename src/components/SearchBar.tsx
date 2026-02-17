'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  'All Categories',
  'Football', 'Formula 1', 'NBA', 'Tennis', 'Golf', 'Rugby',
  'Pop', 'Rock', 'Hip-hop', 'Classical', 'Electronic',
];

// Detect if query is a travel planning request
function isPlannerQuery(q: string): boolean {
  const lower = q.toLowerCase();
  const plannerKeywords = [
    'plan', 'planner', 'itinerary', 'trip', 'travel',
    '일정', '여행', '계획', '짜줘', '짜주', '박', '코스',
    'days in', 'day trip', 'weekend in', 'getaway',
  ];
  return plannerKeywords.some(k => lower.includes(k));
}

export default function SearchBar({ compact = false, fullWidth = false }: { compact?: boolean; fullWidth?: boolean }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
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

  // Auto-detect planner mode from query
  useEffect(() => {
    if (query.trim()) {
      setMode(isPlannerQuery(query) ? 'planner' : 'search');
    }
  }, [query]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowCatDropdown(false);
        // keep expanded
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [query]);

  const handleExpand = () => {
    setExpanded(true);
    setShowDropdown(true);
    setShowCatDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSearch = async () => {
    if (!query.trim() || loading) return;

    // Route to planner if detected
    if (isPlannerQuery(query)) {
      router.push(`/planner?q=${encodeURIComponent(query.trim())}`);
      return;
    }

    setLoading(true);
    setShowDropdown(false);
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim() + (category !== 'All Categories' ? ` ${category}` : '') + (date ? ` on ${date}` : ''),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('ai-search-result', JSON.stringify(data));
        router.push(`/all-tickets?ai=1&q=${encodeURIComponent(query.trim())}`);
      }
    } catch {
      router.push(`/all-tickets?q=${encodeURIComponent(query.trim())}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowDropdown(false);

    // Route to planner if detected
    if (isPlannerQuery(suggestion)) {
      router.push(`/planner?q=${encodeURIComponent(suggestion)}`);
      return;
    }

    setTimeout(() => {
      setLoading(true);
      fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: suggestion }),
      })
        .then(r => r.json())
        .then(data => {
          sessionStorage.setItem('ai-search-result', JSON.stringify(data));
          router.push(`/all-tickets?ai=1&q=${encodeURIComponent(suggestion)}`);
        })
        .catch(() => router.push(`/all-tickets?q=${encodeURIComponent(suggestion)}`))
        .finally(() => setLoading(false));
    }, 50);
  };

  // Filter suggestions based on input
  const filtered = query.trim()
    ? AI_SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()) || query.length >= 2)
    : AI_SUGGESTIONS;

  const dateLabel = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Dates';

  return (
    <div ref={containerRef} className={`relative w-full ${fullWidth ? '' : 'max-w-[580px]'}`}>
      {/* Search Bar Pill */}
      <div className={`bg-white rounded-full shadow-xl border border-[#E0E7EF] flex items-center transition-all duration-300 ${
        expanded ? 'ring-2 ring-[#2B7FFF]/20 border-[#2B7FFF]/30' : ''
      } ${compact ? 'px-1.5 py-1.5' : 'px-2 py-2'}`}>

        {/* ✨ Search area */}
        <div
          className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ${
            expanded ? 'flex-1 min-w-0' : 'flex-shrink-0'
          } ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}
          onClick={!expanded ? handleExpand : undefined}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#7C3AED]">
            <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="currentColor" opacity="0.8"/>
          </svg>
          {expanded ? (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search events with AI..."
              className="flex-1 text-[15px] text-[#171717] outline-none bg-transparent placeholder:text-[#94A3B8] min-w-0"
              disabled={loading}
            />
          ) : (
            <span className={`${compact ? 'text-[13px]' : 'text-[15px]'} font-medium text-[#64748B]`}>Search</span>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-[#E5E7EB] flex-shrink-0" />

        {/* Dates */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => { setShowCatDropdown(false); setShowDatePicker(!showDatePicker); setShowDropdown(false); }}
            className={`flex items-center gap-1 ${compact ? 'px-2 md:px-3 py-1.5' : 'px-4 py-2'} hover:bg-[#F8FAFC] rounded-full transition-colors`}
          >
            <span className={`hidden md:inline ${compact ? 'text-[13px]' : 'text-[15px]'} font-medium ${date ? 'text-[#171717]' : 'text-[#64748B]'}`}>{dateLabel}</span>
            <span className={`md:hidden text-[11px] font-medium ${date ? 'text-[#171717]' : 'text-[#64748B]'}`}>{date ? dateLabel : 'Date'}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-3 z-50">
              <input
                ref={dateRef}
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); setShowDatePicker(false); }}
                className="text-[14px] text-[#171717] outline-none"
                autoFocus
              />
              {date && (
                <button onClick={() => { setDate(''); setShowDatePicker(false); }} className="block mt-1 text-[12px] text-[#EF4444] hover:underline">
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-[#E5E7EB] flex-shrink-0" />

        {/* Category */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => { setShowDatePicker(false); setShowCatDropdown(!showCatDropdown); setShowDropdown(false); }}
            className={`flex items-center gap-1 ${compact ? 'px-2 md:px-3 py-1.5' : 'px-4 py-2'} hover:bg-[#F8FAFC] rounded-full transition-colors`}
          >
            <span className={`hidden md:inline ${compact ? 'text-[13px]' : 'text-[15px]'} font-medium ${category !== 'All Categories' ? 'text-[#171717]' : 'text-[#64748B]'}`}>
              {category === 'All Categories' ? 'Category' : category}
            </span>
            <span className={`md:hidden text-[11px] font-medium ${category !== 'All Categories' ? 'text-[#171717]' : 'text-[#64748B]'}`}>
              {category === 'All Categories' ? 'Type' : category}
            </span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {showCatDropdown && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-[#E5E7EB] py-1 min-w-[180px] z-50 max-h-[280px] overflow-y-auto">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setShowCatDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F1F5F9] transition-colors ${
                    category === cat ? 'text-[#2B7FFF] font-semibold bg-[#EFF6FF]' : 'text-[#374151]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search button */}
        <button
          onClick={expanded ? handleSearch : handleExpand}
          disabled={loading}
          className={`flex-shrink-0 ${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-[#2B7FFF] hover:bg-[#1D6AE5] flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-60 ml-1`}
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          )}
        </button>
      </div>

      {/* AI Suggestions Dropdown */}
      {showDropdown && expanded && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[16px] shadow-xl border border-[#E5E7EB] py-2 z-50 overflow-hidden">
          {/* Mode indicator when typing */}
          {query.trim() && (
            <div className="px-3 py-1">
              <button
                onClick={() => handleSuggestionClick(query)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F1F5F9] transition-colors text-left"
              >
                {mode === 'planner' ? (
                  <span className="flex items-center gap-1.5 text-[#2B7FFF]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  </span>
                ) : (
                  <span className="text-[#9CA3AF]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  </span>
                )}
                <span className="text-[14px] text-[#171717] font-medium flex-1">{query}</span>
                {mode === 'planner' && (
                  <span className="text-[11px] font-semibold text-[#2B7FFF] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                    ✈️ Trip Planner
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Divider */}
          {query.trim() && <div className="h-px bg-[#E5E7EB] mx-3 my-1" />}

          {/* AI suggestions */}
          <div className="px-3 py-1">
            <p className="text-[10px] font-semibold text-[#9CA3AF] tracking-[0.5px] uppercase px-3 py-1.5">
              ✨ AI Search
            </p>
            {(!query.trim() ? AI_SUGGESTIONS : filtered.slice(0, 3)).map((suggestion, i) => (
              <button
                key={`ai-${i}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F1F5F9] transition-colors text-left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#7C3AED]">
                  <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="currentColor" opacity="0.6"/>
                </svg>
                <span className="text-[14px] text-[#4B5563]">{suggestion}</span>
              </button>
            ))}
          </div>

          {/* Planner suggestions */}
          <div className="h-px bg-[#E5E7EB] mx-3 my-1" />
          <div className="px-3 py-1">
            <p className="text-[10px] font-semibold text-[#9CA3AF] tracking-[0.5px] uppercase px-3 py-1.5">
              ✈️ Trip Planner
            </p>
            {PLANNER_SUGGESTIONS.slice(0, query.trim() ? 2 : 4).map((suggestion, i) => (
              <button
                key={`pl-${i}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F1F5F9] transition-colors text-left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#2B7FFF]">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" opacity="0.6"/>
                </svg>
                <span className="text-[14px] text-[#4B5563]">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
