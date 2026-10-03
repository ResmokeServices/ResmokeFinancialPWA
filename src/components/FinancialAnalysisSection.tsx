'use client';

import React, { useState } from 'react';
import { CashflowKpiCards } from '@/components/CashflowKpiCards';
import { CashflowChart } from '@/components/CashflowChart';
import { CashflowTable } from '@/components/CashflowTable';
import { AdjustIncomeModal } from '@/components/AdjustIncomeModal';
import { useFinanceStore } from '@/lib/store';
import { MonthCashflowMetrics } from '@/types/finance';
import { BarChart3, Table, SlidersHorizontal, Sparkles } from 'lucide-react';

export function FinancialAnalysisSection() {
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);

  // Tab state between visual chart and full table
  const [activeView, setActiveView] = useState<'chart' | 'table'>('chart');

  // Modal state
  const [editingMonthId, setEditingMonthId] = useState<string | null>(null);

  const currentMonthId =
    selectedMonth === 'ALL' ? '2026-10' : selectedMonth;

  return (
    <section aria-label="Financial Analysis and Cashflow" className="space-y-3.5">
      {/* Section Header with Quick Actions */}
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
          {/* View Toggle (Chart vs Table) */}
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

          {/* Adjust Income Button */}
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

      {/* A. Cashflow KPI Cards */}
      <CashflowKpiCards />

      {/* B & C. Interactive Visualizations & Table */}
      {activeView === 'chart' ? (
        <CashflowChart />
      ) : (
        <CashflowTable
          onEditMonthIncome={(month: MonthCashflowMetrics) =>
            setEditingMonthId(month.monthId)
          }
        />
      )}

      {/* D. Adjust Monthly Income Streams Modal */}
      {editingMonthId && (
        <AdjustIncomeModal
          monthId={editingMonthId}
          onClose={() => setEditingMonthId(null)}
        />
      )}
    </section>
  );
}
