'use client';

import React, { useState, useEffect } from 'react';
import { TopAppBar } from '@/components/TopAppBar';
import { HorizontalMonthScroller } from '@/components/HorizontalMonthScroller';
import { KpiSummaryCards } from '@/components/KpiSummaryCards';
import { ScopeTabs } from '@/components/ScopeTabs';
import { UrgencyFilterChips } from '@/components/UrgencyFilterChips';
import { ExpenseCard } from '@/components/ExpenseCard';
import { PaymentModal } from '@/components/PaymentModal';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { useFinanceStore, useFilteredExpenses } from '@/lib/store';
import { ExpenseDocument } from '@/types/finance';
import { Sparkles, ReceiptText } from 'lucide-react';

export default function DashboardPage() {
  const fetchExpenses = useFinanceStore((state) => state.fetchExpenses);
  const userId = useFinanceStore((state) => state.userId);
  const filteredExpenses = useFilteredExpenses();

  const [activePaymentExpense, setActivePaymentExpense] =
    useState<ExpenseDocument | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync expenses on mount
  useEffect(() => {
    fetchExpenses(userId);
  }, [fetchExpenses, userId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12">
      {/* 1. Sticky Top App Bar */}
      <TopAppBar onOpenAddModal={() => setIsAddModalOpen(true)} />

      {/* 2. Horizontal Month Scroller */}
      <HorizontalMonthScroller />

      {/* 3. Main Dashboard Responsive Container */}
      <main className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 pt-4 space-y-4 sm:space-y-5 flex-1">
        {/* KPI Summary Cards */}
        <section aria-label="Monthly KPI Metrics">
          <KpiSummaryCards />
        </section>

        {/* Scope Tabs & Urgency Filter Chips */}
        <section className="space-y-2.5">
          <ScopeTabs />
          <UrgencyFilterChips />
        </section>

        {/* Expense List Feed */}
        <section aria-label="Expense Feed" className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span className="uppercase tracking-wider">
              Items ({filteredExpenses.length})
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
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add First Item</span>
              </button>
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
