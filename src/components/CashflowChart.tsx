'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { use12MonthCashflow } from '@/lib/store';
import { formatCurrency } from '@/lib/calculations';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const inflow = payload.find((p) => p.dataKey === 'totalInflow')?.value || 0;
    const outflow = payload.find((p) => p.dataKey === 'totalExpenses')?.value || 0;
    const net = inflow - outflow;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[180px]">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
        <div className="flex items-center justify-between text-emerald-400">
          <span>Inflow (Income):</span>
          <span className="font-bold font-mono">{formatCurrency(inflow)}</span>
        </div>
        <div className="flex items-center justify-between text-violet-300">
          <span>Outflow (Due):</span>
          <span className="font-bold font-mono">{formatCurrency(outflow)}</span>
        </div>
        <div className="border-t border-slate-800 pt-1 flex items-center justify-between font-bold">
          <span className="text-slate-400">Net Margin:</span>
          <span className={net >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function CashflowChart() {
  const data = use12MonthCashflow();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs h-64 sm:h-72 flex items-center justify-center text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
          <span>Loading visual chart...</span>
        </div>
      </div>
    );
  }

  // Shorten month label for mobile X-Axis (e.g. "Jan 2026" -> "Jan")
  const formattedData = data.map((d) => ({
    ...d,
    shortMonth: d.monthLabel.split(' ')[0],
  }));

  return (
    <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            12-Month Inflow vs. Outflow Comparison
          </h3>
          <p className="text-xs text-slate-400">
            Real-time projection comparing total monthly income to effective expense dues
          </p>
        </div>
      </div>

      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="shortMonth"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `R${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
            />
            <Bar
              dataKey="totalInflow"
              name="Inflow (Income)"
              fill="#059669"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="totalExpenses"
              name="Outflow (Expenses)"
              fill="#7C3AED"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default CashflowChart;
