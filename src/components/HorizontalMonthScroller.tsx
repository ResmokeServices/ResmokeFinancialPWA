'use client';

import React, { useRef, useEffect } from 'react';
import { useFinanceStore } from '@/lib/store';
import { resolveMonthExpense } from '@/lib/calculations';

const MONTH_NAMES = [
  { key: '2026-01', label: 'Jan' },
  { key: '2026-02', label: 'Feb' },
  { key: '2026-03', label: 'Mar' },
  { key: '2026-04', label: 'Apr' },
  { key: '2026-05', label: 'May' },
  { key: '2026-06', label: 'Jun' },
  { key: '2026-07', label: 'Jul' },
  { key: '2026-08', label: 'Aug' },
  { key: '2026-09', label: 'Sep' },
  { key: '2026-10', label: 'Oct' },
  { key: '2026-11', label: 'Nov' },
  { key: '2026-12', label: 'Dec' },
  { key: 'ALL', label: 'Full Year (12M)' },
];

export function HorizontalMonthScroller() {
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const expenses = useFinanceStore((state) => state.expenses);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [selectedMonth]);

  const isMonthSettled = (monthKey: string) => {
    if (expenses.length === 0) return false;
    return expenses.every((exp) => {
      const resolved = resolveMonthExpense(exp, monthKey);
      return resolved.isPaid || resolved.totalDue === 0;
    });
  };

  return (
    <div className="w-full bg-white/70 backdrop-blur-xs border-b border-slate-200/60 py-2.5 px-3">
      <div
        ref={scrollRef}
        className="max-w-4xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
      >
        {MONTH_NAMES.map(({ key, label }) => {
          const isActive = selectedMonth === key;
          const settled = isMonthSettled(key);

          return (
            <button
              key={key}
              data-active={isActive}
              type="button"
              onClick={() => setSelectedMonth(key)}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{label}</span>
              {settled && (
                <span
                  title="Cycle 100% Settled"
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-emerald-400' : 'bg-emerald-500'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
