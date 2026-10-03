'use client';

import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '@/lib/store';
import { formatCurrency, round2, resolveMonthExpense } from '@/lib/calculations';
import { X, Check, DollarSign, Wallet, Building2, TrendingUp, TrendingDown } from 'lucide-react';

interface AdjustIncomeModalProps {
  monthId: string;
  onClose: () => void;
}

export function AdjustIncomeModal({ monthId, onClose }: AdjustIncomeModalProps) {
  const incomes = useFinanceStore((state) => state.incomes);
  const expenses = useFinanceStore((state) => state.expenses);
  const updateIncome = useFinanceStore((state) => state.updateIncome);

  const existingIncome = incomes[monthId] || {
    monthId,
    personalIncome: 0,
    companyIncome: 0,
  };

  const [personal, setPersonal] = useState<string>(
    existingIncome.personalIncome ? existingIncome.personalIncome.toString() : ''
  );
  const [company, setCompany] = useState<string>(
    existingIncome.companyIncome ? existingIncome.companyIncome.toString() : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Compute total expenses for this month
  let monthTotalExpenses = 0;
  expenses.forEach((exp) => {
    const res = resolveMonthExpense(exp, monthId);
    monthTotalExpenses += res.totalDue;
  });
  monthTotalExpenses = round2(monthTotalExpenses);

  // Real-time inline math calculations on keystroke
  const numPersonal = parseFloat(personal) || 0;
  const numCompany = parseFloat(company) || 0;
  const totalInflow = round2(numPersonal + numCompany);
  const netCashflow = round2(totalInflow - monthTotalExpenses);
  const freeMarginPercent =
    totalInflow > 0 ? round2((netCashflow / totalInflow) * 100) : 0;
  const isDeficit = netCashflow < 0;

  // Format month title (e.g. "2026-10" -> "October 2026")
  const formatMonthTitle = (id: string) => {
    try {
      const [year, month] = id.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return id;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateIncome(monthId, numPersonal, numCompany);
      onClose();
    } catch (err) {
      console.error('Failed to update income:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-xs transition-opacity">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-sheet-up z-10 max-h-[92vh] overflow-y-auto">
        {/* Swipe-down handle bar indicator */}
        <div className="flex justify-center pt-1 pb-3 cursor-grab sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Adjust Income Streams
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cycle: {formatMonthTitle(monthId)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-Time Mathematical Feedback Bar */}
        <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
          <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Inflow
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-700 block mt-0.5 font-mono">
              {formatCurrency(totalInflow)}
            </span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Due
            </span>
            <span className="text-xs sm:text-sm font-bold text-violet-700 block mt-0.5 font-mono">
              {formatCurrency(monthTotalExpenses)}
            </span>
          </div>

          <div
            className={`p-2 bg-white rounded-xl border shadow-2xs ${
              isDeficit ? 'border-rose-200' : 'border-emerald-200'
            }`}
          >
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider block ${
                isDeficit ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {isDeficit ? 'Deficit' : 'Net Surplus'}
            </span>
            <span
              className={`text-xs sm:text-sm font-bold block mt-0.5 font-mono ${
                isDeficit ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {isDeficit ? '-' : '+'}
              {formatCurrency(Math.abs(netCashflow))}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Personal Income Field */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <Wallet className="w-3.5 h-3.5 text-violet-600" />
              <span>Personal Income Stream (ZAR)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={personal}
                onChange={(e) => setPersonal(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm sm:text-base font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          {/* Company Income Field */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Company Income Stream (ZAR)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm sm:text-base font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          {/* Margin Preview Badge */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-100 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">Free Margin Ratio:</span>
            <span
              className={`font-bold font-mono ${
                freeMarginPercent < 0
                  ? 'text-rose-600'
                  : freeMarginPercent < 15
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {freeMarginPercent}%
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-2 py-3 px-4 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? 'Updating...' : 'Save Income Streams'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
