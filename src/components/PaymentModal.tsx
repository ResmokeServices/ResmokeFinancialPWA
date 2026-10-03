'use client';

import React, { useState, useEffect } from 'react';
import { ExpenseDocument, PaymentEntry } from '@/types/finance';
import { formatCurrency, round2, resolveMonthExpense } from '@/lib/calculations';
import { useFinanceStore } from '@/lib/store';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Check,
  Tag,
  Pencil,
  SlidersHorizontal,
  FastForward,
} from 'lucide-react';

interface PaymentModalProps {
  expense: ExpenseDocument;
  onClose: () => void;
}

export function PaymentModal({ expense, onClose }: PaymentModalProps) {
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const savePaymentRecords = useFinanceStore((state) => state.savePaymentRecords);
  const updateExpenseDue = useFinanceStore((state) => state.updateExpenseDue);

  // Compute baseline total due for this month
  const computed = resolveMonthExpense(expense, selectedMonth);

  // Editable Total Due state
  const [isEditingDue, setIsEditingDue] = useState(false);
  const [editableTotalDue, setEditableTotalDue] = useState<string>(
    computed.totalDue.toString()
  );
  const [dueEditScope, setDueEditScope] = useState<
    'this_month' | 'following_months'
  >('this_month');

  // Filter payments that belong to this selected month cycle
  const initialMonthPayments = (expense.payments || []).filter((p) =>
    p.date.startsWith(selectedMonth === 'ALL' ? '' : selectedMonth)
  );

  // Local state for interactive editing with keystroke feedback
  const [payments, setPayments] = useState<PaymentEntry[]>(
    initialMonthPayments.length > 0
      ? initialMonthPayments
      : [
          {
            id: `pay_${Date.now()}`,
            amount: computed.balanceDue > 0 ? computed.balanceDue : computed.totalDue,
            date:
              selectedMonth === 'ALL'
                ? new Date().toISOString().slice(0, 10)
                : `${selectedMonth}-01`,
            reference: 'Settlement',
          },
        ]
  );

  const [isSaving, setIsSaving] = useState(false);

  // Prevent background scroll while bottom sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Effective Total Due based on user input
  const effectiveTotalDue =
    editableTotalDue === ''
      ? 0
      : Math.max(0, round2(parseFloat(editableTotalDue) || 0));

  // Real-time inline math calculation: Sum payments on every keystroke!
  const currentTotalSettled = round2(
    payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  );

  const currentBalanceDue =
    currentTotalSettled >= effectiveTotalDue && effectiveTotalDue > 0
      ? 0
      : Math.max(0, round2(effectiveTotalDue - currentTotalSettled));

  const isFullySettled =
    currentTotalSettled >= effectiveTotalDue && effectiveTotalDue > 0;

  // Add a new installment line
  const handleAddInstallment = () => {
    const today = new Date().toISOString().slice(0, 10);
    const defaultDate =
      selectedMonth !== 'ALL' && selectedMonth
        ? `${selectedMonth}-01`
        : today;

    setPayments((prev) => [
      ...prev,
      {
        id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        amount: currentBalanceDue > 0 ? currentBalanceDue : 0,
        date: defaultDate,
        reference: '',
      },
    ]);
  };

  // Remove an installment
  const handleRemovePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  // Update a specific field of an installment
  const handleUpdatePayment = (
    id: string,
    field: keyof PaymentEntry,
    val: string | number
  ) => {
    setPayments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  // Save payments and optional Total Due changes to Zustand store & Firestore
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. If Total Due was edited, update expense due configuration
      if (round2(effectiveTotalDue) !== round2(computed.totalDue)) {
        await updateExpenseDue(
          expense.id,
          selectedMonth,
          effectiveTotalDue,
          dueEditScope
        );
      }

      // 2. Clean payment objects with numeric amounts
      const sanitized = payments
        .filter((p) => Number(p.amount) > 0)
        .map((p) => ({
          ...p,
          amount: round2(Number(p.amount)),
        }));

      await savePaymentRecords(expense.id, selectedMonth, sanitized);
      onClose();
    } catch (e) {
      console.error('Failed to save payments and due:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-xs transition-opacity">
      {/* Backdrop Dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Bottom Sheet Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-sheet-up z-10">
        {/* Swipe-down handle bar indicator */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {expense.name}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  expense.scope === 'personal'
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-sky-100 text-sky-700'
                }`}
              >
                {expense.scope}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cycle: {selectedMonth} • {expense.paymentMethod}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metric Bar (3 mini-stat panels) with Editable Total Due Trigger */}
        <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100 text-center">
          {/* Card 1: TOTAL DUE (Clickable to Edit) */}
          <button
            type="button"
            onClick={() => setIsEditingDue(!isEditingDue)}
            className={`p-2 rounded-xl border text-center transition-all ${
              isEditingDue
                ? 'bg-violet-50/90 border-violet-400 ring-2 ring-violet-500/20'
                : 'bg-white border-slate-200/70 hover:border-violet-300 hover:bg-slate-50/80'
            } shadow-2xs group relative cursor-pointer`}
            title="Click to edit Total Due amount"
          >
            <div className="flex items-center justify-center gap-1 text-slate-400 group-hover:text-violet-600">
              <span className="text-[10px] font-semibold uppercase tracking-wider block">
                Total Due
              </span>
              <Pencil className="w-2.5 h-2.5 text-slate-400 group-hover:text-violet-600" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
              {formatCurrency(effectiveTotalDue)}
            </span>
            <span className="text-[9px] text-violet-600 font-medium block mt-0.5">
              {isEditingDue ? 'Close editor' : 'Tap to edit'}
            </span>
          </button>

          {/* Card 2: SETTLED PAID */}
          <div className="p-2 bg-white rounded-xl border border-emerald-200/60 shadow-2xs">
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Settled Paid
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-700 block mt-0.5">
              {formatCurrency(currentTotalSettled)}
            </span>
          </div>

          {/* Card 3: REMAINING */}
          <div className="p-2 bg-white rounded-xl border border-rose-200/60 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Remaining
            </span>
            <span
              className={`text-xs sm:text-sm font-bold block mt-0.5 ${
                isFullySettled ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isFullySettled ? 'Settled' : formatCurrency(currentBalanceDue)}
            </span>
          </div>
        </div>

        {/* Interactive Total Due Editor Drawer */}
        {isEditingDue && (
          <div className="px-5 py-3.5 bg-violet-50/70 border-b border-violet-200/80 space-y-3 animate-sheet-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-violet-700" />
                <span className="text-xs font-bold text-violet-900">
                  Edit Total Due Amount
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Cycle: <strong className="text-slate-800">{selectedMonth}</strong>
              </span>
            </div>

            {/* Input with Currency Prefix */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={editableTotalDue}
                onChange={(e) => setEditableTotalDue(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 text-sm sm:text-base font-bold bg-white border border-violet-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
              />
            </div>

            {/* Scope Selection: "Only this month" vs "All following months" */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                Apply change to:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDueEditScope('this_month')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    dueEditScope === 'this_month'
                      ? 'bg-violet-600 border-violet-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Only this month</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDueEditScope('following_months')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    dueEditScope === 'following_months'
                      ? 'bg-violet-600 border-violet-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>All following months</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                {dueEditScope === 'this_month'
                  ? `Overrides Total Due for ${selectedMonth} only. Other months stay unchanged.`
                  : `Updates Total Due for ${selectedMonth} and carries forward to all subsequent months.`}
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Payment Rows Feed */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Installment Records ({payments.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Real-time calculation enabled
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No payments recorded yet for this cycle. Tap below to add.
            </div>
          ) : (
            payments.map((payment, idx) => (
              <div
                key={payment.id}
                className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70 space-y-2.5 transition-all hover:bg-slate-50"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Payment #{idx + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemovePayment(payment.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove installment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Amount Numeric Input with Big Focus */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={payment.amount === 0 ? '' : payment.amount}
                      onChange={(e) =>
                        handleUpdatePayment(
                          payment.id,
                          'amount',
                          e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 text-sm sm:text-base font-bold bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                    />
                  </div>

                  {/* HTML5 Date Picker */}
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={payment.date}
                      onChange={(e) =>
                        handleUpdatePayment(payment.id, 'date', e.target.value)
                      }
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                    />
                  </div>
                </div>

                {/* Optional Payment Note / Reference */}
                <div className="relative">
                  <Tag className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={payment.reference || ''}
                    onChange={(e) =>
                      handleUpdatePayment(payment.id, 'reference', e.target.value)
                    }
                    placeholder="Reference / Bank note (e.g. First EFT)"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>
            ))
          )}

          {/* Add Installment Button */}
          <button
            type="button"
            onClick={handleAddInstallment}
            className="w-full py-2.5 px-4 border border-dashed border-violet-300 hover:border-violet-500 text-violet-700 hover:bg-violet-50/50 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Installment Entry</span>
          </button>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex-2 py-3 px-4 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isSaving
                ? 'Saving...'
                : round2(effectiveTotalDue) !== round2(computed.totalDue)
                ? 'Save Due & Payments'
                : 'Save Payment Records'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
