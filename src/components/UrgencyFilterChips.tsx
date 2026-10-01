'use client';

import React from 'react';
import { useFinanceStore, useMonthMetrics } from '@/lib/store';
import { UrgencyStatus } from '@/types/finance';

export function UrgencyFilterChips() {
  const selectedUrgencyFilter = useFinanceStore(
    (state) => state.selectedUrgencyFilter
  );
  const setUrgencyFilter = useFinanceStore((state) => state.setUrgencyFilter);
  const metrics = useMonthMetrics();

  const chips: {
    key: 'ALL' | UrgencyStatus;
    label: string;
    count: number;
    activeClass: string;
    badgeClass: string;
  }[] = [
    {
      key: 'ALL',
      label: 'All Items',
      count: metrics.urgencyCounts.all,
      activeClass: 'bg-slate-900 text-white border-slate-900',
      badgeClass: 'bg-slate-700 text-white',
    },
    {
      key: 'overdue',
      label: 'Overdue',
      count: metrics.urgencyCounts.overdue,
      activeClass: 'bg-rose-600 text-white border-rose-600',
      badgeClass: 'bg-rose-100 text-rose-800',
    },
    {
      key: 'next_due',
      label: 'Next Due (≤7d)',
      count: metrics.urgencyCounts.next_due,
      activeClass: 'bg-amber-600 text-white border-amber-600',
      badgeClass: 'bg-amber-100 text-amber-800',
    },
    {
      key: 'future_due',
      label: 'Future',
      count: metrics.urgencyCounts.future_due,
      activeClass: 'bg-sky-600 text-white border-sky-600',
      badgeClass: 'bg-sky-100 text-sky-800',
    },
    {
      key: 'settled',
      label: 'Settled',
      count: metrics.urgencyCounts.settled,
      activeClass: 'bg-emerald-600 text-white border-emerald-600',
      badgeClass: 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {chips.map((chip) => {
        const isActive = selectedUrgencyFilter === chip.key;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => setUrgencyFilter(chip.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap transition-all duration-150 shrink-0 ${
              isActive
                ? `${chip.activeClass} shadow-xs`
                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-600'
            }`}
          >
            <span>{chip.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : chip.badgeClass
              }`}
            >
              {chip.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
