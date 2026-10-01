'use client';

import React from 'react';
import { useMonthMetrics } from '@/lib/store';
import { formatCurrency } from '@/lib/calculations';
import { Wallet, CheckCircle, AlertCircle, PieChart } from 'lucide-react';

export function KpiSummaryCards() {
  const metrics = useMonthMetrics();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {/* 1. Baseline Budget Ceiling */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1 text-slate-500 mb-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            Budget Ceiling
          </span>
          <div className="p-1 rounded-lg bg-slate-100 text-slate-600">
            <Wallet className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(metrics.totalBudgetCeiling)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Base + Carryovers
          </p>
        </div>
      </div>

      {/* 2. Cumulative Settled Paid */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-emerald-200/60 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1 text-emerald-600 mb-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
            Settled Paid
          </span>
          <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-2xl font-bold text-emerald-700 tracking-tight">
            {formatCurrency(metrics.totalSettledPaid)}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
              <span>Settled</span>
              <span>{metrics.paidProgressPercentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${metrics.paidProgressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Remaining Balance Due */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-rose-200/70 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1 text-slate-500 mb-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            Balance Due
          </span>
          <div className="p-1 rounded-lg bg-rose-50 text-rose-600">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-lg sm:text-2xl font-bold text-rose-600 tracking-tight">
            {formatCurrency(metrics.totalRemainingBalance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {metrics.totalRemainingBalance === 0 ? 'Fully settled cycle' : 'Pending payment'}
          </p>
        </div>
      </div>

      {/* 4. Outlay Breakdown */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1 text-slate-500 mb-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            Outlay Scope
          </span>
          <div className="p-1 rounded-lg bg-violet-50 text-violet-600">
            <PieChart className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="text-violet-700">Pers: {metrics.personalRatio}%</span>
            <span className="text-sky-700">Comp: {metrics.companyRatio}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-violet-600 transition-all duration-300"
              style={{ width: `${metrics.personalRatio}%` }}
              title={`Personal: ${metrics.personalRatio}%`}
            />
            <div
              className="bg-sky-500 transition-all duration-300"
              style={{ width: `${metrics.companyRatio}%` }}
              title={`Company: ${metrics.companyRatio}%`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{formatCurrency(metrics.personalTotal)}</span>
            <span>{formatCurrency(metrics.companyTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
