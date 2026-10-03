'use client';

import React, { useState, useEffect } from 'react';
import { TopAppBar } from '@/components/TopAppBar';
import { HorizontalMonthScroller } from '@/components/HorizontalMonthScroller';
import { KpiSummaryCards } from '@/components/KpiSummaryCards';
import { FinancialAnalysisSection } from '@/components/FinancialAnalysisSection';
import { ScopeTabs } from '@/components/ScopeTabs';
import { UrgencyFilterChips } from '@/components/UrgencyFilterChips';
import { ExpenseCard } from '@/components/ExpenseCard';
import { PaymentModal } from '@/components/PaymentModal';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { CsvMigrationTool } from '@/components/CsvMigrationTool';
import { useFinanceStore, useFilteredExpenses } from '@/lib/store';
import { ExpenseDocument } from '@/types/finance';
import { Sparkles, ReceiptText, FileSpreadsheet } from 'lucide-react';

export default function DashboardPage() {
  const fetchExpenses = useFinanceStore((state) => state.fetchExpenses);
  const fetchIncome = useFinanceStore((state) => state.fetchIncome);
  const userId = useFinanceStore((state) => state.userId);
  const filteredExpenses = useFilteredExpenses();

  const [activePaymentExpense, setActivePaymentExpense] =
    useState<ExpenseDocument | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showMigrationTool, setShowMigrationTool] = useState(false);

  // Sync expenses and income on mount
  useEffect(() => {
    fetchExpenses(userId);
    fetchIncome(userId);
  }, [fetchExpenses, fetchIncome, userId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16">
      {/* 1. Sticky Top App Bar */}
      <TopAppBar onOpenAddModal={() => setIsAddModalOpen(true)} />

      {/* 2. Horizontal Month Scroller */}
      <HorizontalMonthScroller />

      {/* 3. Main Dashboard Responsive Container */}
      <main className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 pt-4 space-y-5 sm:space-y-6 flex-1">
        {/* One-Time Google Sheets CSV Importer Banner / Drawer */}
        {showMigrationTool && (
          <section aria-label="CSV Migration Importer" className="animate-sheet-up">
            <CsvMigrationTool onClose={() => setShowMigrationTool(false)} />
          </section>
        )}

        {/* Expense KPI Summary Cards (Budget Ceiling, Settled Paid, Balance Due, Outlay Scope) */}
        <section aria-label="Monthly Expense KPI Metrics">
          <KpiSummaryCards />
        </section>

        {/* Phase 2: Financial Analysis & Cashflow Section (Inserted ABOVE Expense List Feed) */}
        <FinancialAnalysisSection />

        {/* Scope Tabs & Urgency Filter Chips */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span className="uppercase tracking-wider">Expense Filter Controls</span>
            <button
              type="button"
              onClick={() => setShowMigrationTool(!showMigrationTool)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/80 px-2.5 py-1 rounded-xl transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-violet-600" />
              <span>{showMigrationTool ? 'Hide Migration Tool' : 'Import Sheets CSV'}</span>
            </button>
          </div>
          <ScopeTabs />
          <UrgencyFilterChips />
        </section>

        {/* Expense List Feed */}
        <section aria-label="Expense Feed" className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span className="uppercase tracking-wider">
              Expense Items ({filteredExpenses.length})
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Tap checkbox to quick-settle • Tap card to edit payments
            </span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-2xs">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                <ReceiptText className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                No expenses found
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                No expense items match your current filter or search criteria for this cycle.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Add First Item</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMigrationTool(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-violet-600" />
                  <span>Import from CSV</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExpenses.map((item) => (
                <ExpenseCard
                  key={item.expense.id}
                  computed={item}
                  onOpenPaymentModal={() => setActivePaymentExpense(item.expense)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 4. Payment Entry Bottom Sheet Modal */}
      {activePaymentExpense && (
        <PaymentModal
          expense={activePaymentExpense}
          onClose={() => setActivePaymentExpense(null)}
        />
      )}

      {/* 5. Add Expense Modal */}
      {isAddModalOpen && (
        <AddExpenseModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
}
