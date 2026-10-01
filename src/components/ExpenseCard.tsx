'use client';

import React from 'react';
import { ComputedExpenseMonth } from '@/types/finance';
import { formatCurrency } from '@/lib/calculations';
import { useFinanceStore } from '@/lib/store';
import { Check, Calendar, ChevronRight, Tag } from 'lucide-react';

interface ExpenseCardProps {
  computed: ComputedExpenseMonth;
  onOpenPaymentModal: () => void;
}

export function ExpenseCard({ computed, onOpenPaymentModal }: ExpenseCardProps) {
  const { expense, totalDue, settledPaid, balanceDue, isPaid, urgency, effectiveDueDate } =
    computed;

  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const toggleSettleExpense = useFinanceStore((state) => state.toggleSettleExpense);

  const handleToggleSettle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSettleExpense(expense.id, selectedMonth);
  };

  // Urgency Pill styling
  const urgencyBadges: Record<
    string,
    { label: string; bg: string; text: string; border: string }
  > = {
    settled: {
      label: 'Settled',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200/70',
    },
    overdue: {
      label: 'Overdue',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200/70',
    },
    next_due: {
      label: 'Due Soon',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200/70',
    },
    future_due: {
      label: 'Upcoming',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200/70',
    },
  };

  const badge = urgencyBadges[urgency] || urgencyBadges.future_due;

  // Format due date for friendly display
  const formattedDueDate = (() => {
    try {
      const parts = effectiveDueDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      }
    } catch {
      // Fallback
    }
    return effectiveDueDate;
  })();

  const isPersonal = expense.scope === 'personal';

  return (
    <div
      onClick={onOpenPaymentModal}
      className={`group relative bg-white rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 shadow-xs hover:shadow-sm cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3 ${
        isPaid
          ? 'border-emerald-200/60 bg-emerald-50/20'
          : 'border-slate-200/80 hover:border-violet-300'
      }`}
    >
      {/* Scope Indicator Line on left border */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
          isPersonal ? 'bg-violet-600' : 'bg-sky-500'
        }`}
      />

      {/* Left: Quick Settlement Checkbox Button */}
      <button
        type="button"
        onClick={handleToggleSettle}
        aria-label={isPaid ? 'Mark as unpaid' : 'Mark as settled'}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
          isPaid
            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
            : 'border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-300 bg-slate-50'
        }`}
      >
        <Check className="w-4 h-4 stroke-[3]" />
      </button>

      {/* Center: Vendor Info, Reference, Payment Method, Urgency Pill */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3
            className={`font-semibold text-sm sm:text-base leading-tight truncate ${
              isPaid ? 'text-slate-600 line-through decoration-slate-300' : 'text-slate-900'
            }`}
          >
            {expense.name}
          </h3>

          {/* Scope Tag */}
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
              isPersonal
                ? 'bg-violet-100 text-violet-700'
                : 'bg-sky-100 text-sky-700'
            }`}
          >
            {isPersonal ? 'Pers' : 'Comp'}
          </span>
        </div>

        {/* Reference + Due Date + Method Chips */}
        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
          {expense.reference && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
              <Tag className="w-2.5 h-2.5" />
              {expense.reference}
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <Calendar className="w-3 h-3 text-slate-400" />
            {formattedDueDate}
          </span>

          <span className="text-[11px] text-slate-400">
            • {expense.paymentMethod}
          </span>

          {/* Dynamic Urgency Pill */}
          <span
            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* Right: Amounts (Total Due, Paid, Remaining Balance) */}
      <div className="text-right shrink-0">
        <div className="text-xs text-slate-400 font-medium">
          Due: {formatCurrency(totalDue)}
        </div>

        {settledPaid > 0 && (
          <div className="text-[11px] text-emerald-600 font-medium">
            Paid: {formatCurrency(settledPaid)}
          </div>
        )}

        <div
          className={`font-bold text-sm sm:text-base tracking-tight ${
            isPaid ? 'text-emerald-700' : 'text-slate-900'
          }`}
        >
          {isPaid ? 'R 0.00' : formatCurrency(balanceDue)}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 hidden sm:block" />
    </div>
  );
}
