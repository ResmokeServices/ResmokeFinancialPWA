'use client';

import React from 'react';
import { useFinanceStore } from '@/lib/store';
import { ScopeType } from '@/types/finance';

export function ScopeTabs() {
  const activeScopeTab = useFinanceStore((state) => state.activeScopeTab);
  const setActiveScopeTab = useFinanceStore((state) => state.setActiveScopeTab);

  const tabs: { key: 'all' | ScopeType; label: string }[] = [
    { key: 'all', label: 'All Expenses' },
    { key: 'personal', label: 'Personal' },
    { key: 'company', label: 'Company' },
  ];

  return (
    <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = activeScopeTab === tab.key;
        let activeBg = 'bg-white text-slate-900 shadow-xs font-semibold';
        if (isActive && tab.key === 'personal') {
          activeBg = 'bg-violet-600 text-white shadow-xs font-semibold';
        } else if (isActive && tab.key === 'company') {
          activeBg = 'bg-sky-600 text-white shadow-xs font-semibold';
        }

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveScopeTab(tab.key)}
            className={`flex-1 py-1.5 px-3 text-xs rounded-lg transition-all text-center ${
              isActive ? activeBg : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
