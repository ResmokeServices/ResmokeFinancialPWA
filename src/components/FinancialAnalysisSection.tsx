'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CashflowKpiCards } from '@/components/CashflowKpiCards';
import { CashflowTable } from '@/components/CashflowTable';
import { AdjustIncomeModal } from '@/components/AdjustIncomeModal';
import { useFinanceStore } from '@/lib/store';
import { MonthCashflowMetrics } from '@/types/finance';
import { BarChart3, Table, SlidersHorizontal } from 'lucide-react';

// Dynamic import with ssr: false prevents Webpack runtime 'call' errors with charting libraries
const CashflowChart = dynamic(
  () => import('@/components/CashflowChart').then((mod) => mod.CashflowChart),
  {
    ssr: false,
    loading: () => (
      <div className="w-full bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs h-64 sm:h-72 flex items-center justify-center text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
          <span>Loading visual chart...</span>
        </div>
      </div>
    ),
  }
);

export function FinancialAnalysisSection() {
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const [activeView, setActiveView] = useState<'chart' | 'table'>('chart');
  const [editingMonthId, setEditingMonthId] = useState<string | null>(null);

  const currentMonthId = selectedMonth === 'ALL' ? '2026-10' : selectedMonth;

  return (
    <section aria-label="Financial Analysis and Cashflow" className="space-y-3.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Income & Cashflow Analysis
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-200/60 uppercase">
              Phase 2
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Real-time reconciliation of monthly revenue against budget ceilings
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => setActiveView('chart')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeView === 'chart'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chart</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeView === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setEditingMonthId(currentMonthId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjust Income</span>
          </button>
        </div>
      </div>

      <CashflowKpiCards />

      {activeView === 'chart' ? (
        <CashflowChart />
      ) : (
        <CashflowTable
          onEditMonthIncome={(month: MonthCashflowMetrics) =>
            setEditingMonthId(month.monthId)
          }
        />
      )}

      {editingMonthId && (
        <AdjustIncomeModal
          monthId={editingMonthId}
          onClose={() => setEditingMonthId(null)}
        />
      )}
    </section>
  );
}
