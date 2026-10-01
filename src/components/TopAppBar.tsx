'use client';

import React, { useState } from 'react';
import { useFinanceStore, useMonthMetrics } from '@/lib/store';
import { Plus, Search, Calendar, CheckCircle2, X } from 'lucide-react';

interface TopAppBarProps {
  onOpenAddModal: () => void;
}

export function TopAppBar({ onOpenAddModal }: TopAppBarProps) {
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const searchQuery = useFinanceStore((state) => state.searchQuery);
  const setSearchQuery = useFinanceStore((state) => state.setSearchQuery);
  const [showSearch, setShowSearch] = useState(false);

  const metrics = useMonthMetrics();

  const formatMonthTitle = (monthStr: string) => {
    if (monthStr === 'ALL') return 'Full Year (12M)';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left: App Identity & Active Month Pill */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-sky-500 flex items-center justify-center shadow-sm text-white font-bold text-base">
            R
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Resmoke Financial
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200/60">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                {metrics.urgencyCounts.settled}/{metrics.urgencyCounts.all} Settled
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-900 font-bold text-sm sm:text-base leading-tight">
              <Calendar className="w-3.5 h-3.5 text-violet-600" />
              <span>{formatMonthTitle(selectedMonth)}</span>
            </div>
          </div>
        </div>

        {/* Right Action Icons: Search Toggle + Add (+) Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery('');
            }}
            aria-label="Toggle search"
            className={`p-2 rounded-xl border transition-all ${
              showSearch || searchQuery
                ? 'bg-violet-50 border-violet-300 text-violet-700'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white rounded-xl font-medium text-sm shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="max-w-4xl mx-auto mt-2 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor, reference tag, or payment method..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
