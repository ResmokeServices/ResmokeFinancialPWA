'use client';

import React from 'react';
import { use12MonthCashflow } from '@/lib/store';
import { formatCurrency } from '@/lib/calculations';
import { MonthCashflowMetrics } from '@/types/finance';
import { Edit2, TrendingUp, TrendingDown } from 'lucide-react';

interface CashflowTableProps {
  onEditMonthIncome: (month: MonthCashflowMetrics) => void;
}

export function CashflowTable({ onEditMonthIncome }: CashflowTableProps) {
  const records = use12MonthCashflow();

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            12-Month Cashflow Summary Table
          </h3>
          <p className="text-xs text-slate-400">
            Full-year reconciliation matrix comparing income streams, outlays, and margins
          </p>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/70">
              <th className="py-3 px-3.5 sm:px-4">Cycle</th>
              <th className="py-3 px-3">Personal</th>
              <th className="py-3 px-3">Company</th>
              <th className="py-3 px-3 text-emerald-800">Total Inflow</th>
              <th className="py-3 px-3 text-violet-800">Total Due</th>
              <th className="py-3 px-3 text-emerald-700">Settled Paid</th>
              <th className="py-3 px-3">Net Cashflow</th>
              <th className="py-3 px-3">Margin %</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {records.map((row) => (
              <tr
                key={row.monthId}
                className="hover:bg-slate-50/70 transition-colors"
              >
                {/* 1. Cycle */}
                <td className="py-3 px-3.5 sm:px-4 font-semibold text-slate-900 whitespace-nowrap">
                  {row.monthLabel}
                </td>

                {/* 2. Personal Income */}
                <td className="py-3 px-3 text-slate-600 font-mono whitespace-nowrap">
                  {formatCurrency(row.personalIncome)}
                </td>

                {/* 3. Company Income */}
                <td className="py-3 px-3 text-slate-600 font-mono whitespace-nowrap">
                  {formatCurrency(row.companyIncome)}
                </td>

                {/* 4. Total Inflow */}
                <td className="py-3 px-3 font-bold text-emerald-700 font-mono whitespace-nowrap">
                  {formatCurrency(row.totalInflow)}
                </td>

                {/* 5. Total Expenses */}
                <td className="py-3 px-3 font-semibold text-violet-700 font-mono whitespace-nowrap">
                  {formatCurrency(row.totalExpenses)}
                </td>

                {/* 6. Settled Paid */}
                <td className="py-3 px-3 text-slate-500 font-mono whitespace-nowrap">
                  {formatCurrency(row.settledPaid)}
                </td>

                {/* 7. Net Cashflow */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded-lg ${
                      row.isDeficit
                        ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    }`}
                  >
                    {row.isDeficit ? (
                      <TrendingDown className="w-3 h-3 text-rose-600" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                    )}
                    {row.isDeficit ? '-' : '+'}
                    {formatCurrency(Math.abs(row.netCashflow))}
                  </span>
                </td>

                {/* 8. Free Margin % */}
                <td className="py-3 px-3 font-bold whitespace-nowrap">
                  <span
                    className={
                      row.freeMarginPercent < 0
                        ? 'text-rose-600'
                        : row.freeMarginPercent < 15
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }
                  >
                    {row.freeMarginPercent}%
                  </span>
                </td>

                {/* 9. Action Button */}
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onEditMonthIncome(row)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 text-xs font-semibold transition-all active:scale-95"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
