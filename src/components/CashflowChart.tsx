'use client';

import React, { useState } from 'react';
import { use12MonthCashflow } from '@/lib/store';
import { formatCurrency, round2 } from '@/lib/calculations';
import { MonthCashflowMetrics } from '@/types/finance';

export function CashflowChart() {
  const data = use12MonthCashflow();
  const [hoveredMonth, setHoveredMonth] = useState<MonthCashflowMetrics | null>(null);

  // Calculate highest value for dynamic Y-axis scaling
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.totalInflow, d.totalExpenses)),
    5000
  );
  // Round up to nearest 5000 for clean ticks
  const roundCeil = Math.ceil(maxValue / 5000) * 5000;

  const yTicks = [
    roundCeil,
    round2(roundCeil * 0.75),
    round2(roundCeil * 0.5),
    round2(roundCeil * 0.25),
    0,
  ];

  return (
    <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative">
      {/* Header and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            12-Month Inflow vs. Outflow Comparison
          </h3>
          <p className="text-xs text-slate-400">
            Real-time projection comparing total monthly income to effective expense dues
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block shadow-2xs" />
            <span className="text-slate-600">Inflow (Income)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-violet-600 inline-block shadow-2xs" />
            <span className="text-slate-600">Outflow (Expenses)</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative pt-6 pb-2">
        {/* Floating Interactive Tooltip */}
        {hoveredMonth && (
          <div className="absolute top-0 right-4 sm:right-6 z-20 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1 animate-sheet-up pointer-events-none">
            <div className="font-bold text-slate-200 border-b border-slate-800 pb-0.5 flex justify-between gap-3">
              <span>{hoveredMonth.monthLabel}</span>
              <span className={hoveredMonth.isDeficit ? 'text-rose-400' : 'text-emerald-400'}>
                {hoveredMonth.isDeficit ? 'Deficit' : 'Surplus'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-emerald-400">
              <span>Inflow:</span>
              <span className="font-bold font-mono">{formatCurrency(hoveredMonth.totalInflow)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-violet-300">
              <span>Outflow:</span>
              <span className="font-bold font-mono">{formatCurrency(hoveredMonth.totalExpenses)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-0.5 border-t border-slate-800 font-bold">
              <span className="text-slate-400">Net Margin:</span>
              <span className={hoveredMonth.netCashflow >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                {hoveredMonth.netCashflow >= 0 ? '+' : ''}{formatCurrency(hoveredMonth.netCashflow)}
              </span>
            </div>
          </div>
        )}

        {/* Visual Chart Grid */}
        <div className="relative h-56 sm:h-64 flex">
          {/* Y-Axis Labels */}
          <div className="flex flex-col justify-between text-[10px] text-slate-400 font-medium pr-2 text-right select-none w-10 sm:w-12 shrink-0">
            {yTicks.map((tick, i) => (
              <span key={i}>
                {tick >= 1000 ? `R${Math.round(tick / 1000)}k` : `R${tick}`}
              </span>
            ))}
          </div>

          {/* Bar Chart Area */}
          <div className="relative flex-1 flex flex-col justify-between">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {yTicks.map((_, i) => (
                <div key={i} className="w-full border-b border-slate-100" />
              ))}
            </div>

            {/* Bars Container */}
            <div className="relative h-full flex items-end justify-between gap-1 sm:gap-2 px-1">
              {data.map((item) => {
                const inflowHeight = roundCeil > 0 ? (item.totalInflow / roundCeil) * 100 : 0;
                const outflowHeight = roundCeil > 0 ? (item.totalExpenses / roundCeil) * 100 : 0;
                const isHovered = hoveredMonth?.monthId === item.monthId;

                return (
                  <div
                    key={item.monthId}
                    onMouseEnter={() => setHoveredMonth(item)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    onClick={() => setHoveredMonth(isHovered ? null : item)}
                    className={`flex-1 h-full flex items-end justify-center gap-0.5 sm:gap-1 cursor-pointer transition-all rounded-t-lg group relative ${
                      isHovered ? 'bg-slate-100/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Inflow Bar */}
                    <div
                      style={{ height: `${Math.max(inflowHeight, 2)}%` }}
                      className="w-1.5 sm:w-3 bg-emerald-600 group-hover:bg-emerald-500 rounded-t-sm transition-all duration-300 shadow-2xs"
                      title={`${item.monthLabel} Inflow: ${formatCurrency(item.totalInflow)}`}
                    />
                    {/* Outflow Bar */}
                    <div
                      style={{ height: `${Math.max(outflowHeight, 2)}%` }}
                      className="w-1.5 sm:w-3 bg-violet-600 group-hover:bg-violet-500 rounded-t-sm transition-all duration-300 shadow-2xs"
                      title={`${item.monthLabel} Outflow: ${formatCurrency(item.totalExpenses)}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* X-Axis Month Labels */}
        <div className="flex pl-10 sm:pl-12 pt-2 border-t border-slate-200">
          {data.map((item) => {
            const shortLabel = item.monthLabel.split(' ')[0];
            const isHovered = hoveredMonth?.monthId === item.monthId;
            return (
              <div
                key={item.monthId}
                onClick={() => setHoveredMonth(isHovered ? null : item)}
                className={`flex-1 text-center text-[10px] sm:text-xs font-semibold cursor-pointer transition-colors ${
                  isHovered ? 'text-violet-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {shortLabel}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CashflowChart;
