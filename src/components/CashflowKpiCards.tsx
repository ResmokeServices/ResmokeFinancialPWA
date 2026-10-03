'use client';

import React from 'react';
import { useCurrentCashflowKpis } from '@/lib/store';
import { formatCurrency } from '@/lib/calculations';
import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Percent, Flame } from 'lucide-react';

export function CashflowKpiCards() {
  const { monthlyInflow, monthlyOutflow, netCashflow, incomeBurnRatePercent, isDeficit } =
    useCurrentCashflowKpis();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {/* 1. Monthly Inflow (Budget) */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-emerald-200/60 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1 text-slate-500 mb-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Monthly Inflow
          </span>
          <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-2xl font-bold text-emerald-700 tracking-tight">
            {formatCurrency(monthlyInflow)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Combined Budget Ceiling
          </p>
        </div>
      </div>

      {/* 2. Monthly Outflow (Expenses) */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-violet-200/60 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1 text-slate-500 mb-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-violet-800">
            Monthly Outflow
          </span>
          <div className="p-1 rounded-lg bg-violet-50 text-violet-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-2xl font-bold text-violet-700 tracking-tight">
            {formatCurrency(monthlyOutflow)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Total Effective Due
          </p>
        </div>
      </div>

      {/* 3. Net Cashflow (Deficit / Surplus) */}
      <div
        className={`bg-white rounded-2xl p-3.5 sm:p-4 border shadow-xs flex flex-col justify-between ${
          isDeficit ? 'border-rose-200/80 bg-rose-50/10' : 'border-emerald-200/80 bg-emerald-50/10'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wider ${
              isDeficit ? 'text-rose-800' : 'text-emerald-800'
            }`}
          >
            {isDeficit ? 'Net Deficit' : 'Net Cashflow'}
          </span>
          <div
            className={`p-1 rounded-lg ${
              isDeficit ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {isDeficit ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
        <div>
          <div
            className={`text-lg sm:text-2xl font-bold tracking-tight ${
              isDeficit ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {isDeficit ? '-' : '+'}
            {formatCurrency(Math.abs(netCashflow))}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isDeficit ? 'Outflow exceeds inflow' : 'Free cash surplus'}
          </p>
        </div>
      </div>

      {/* 4. Income Burn Rate % */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1 text-slate-500 mb-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700">
            Burn Rate %
          </span>
          <div className="p-1 rounded-lg bg-amber-50 text-amber-600">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-lg sm:text-2xl font-bold tracking-tight ${
                incomeBurnRatePercent > 100
                  ? 'text-rose-600'
                  : incomeBurnRatePercent > 80
                  ? 'text-amber-600'
                  : 'text-slate-900'
              }`}
            >
              {incomeBurnRatePercent}%
            </span>
            <span className="text-xs text-slate-400">of income</span>
          </div>

          <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                incomeBurnRatePercent > 100
                  ? 'bg-rose-500'
                  : incomeBurnRatePercent > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, incomeBurnRatePercent)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
