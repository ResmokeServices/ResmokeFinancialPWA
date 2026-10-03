import {
  ComputedExpenseMonth,
  ExpenseDocument,
  IncomeDocument,
  MonthCashflowMetrics,
  MonthKpiMetrics,
  MonthlyDueConfig,
  UrgencyStatus,
} from '@/types/finance';

/**
 * Ensures currency precision to 2 decimal places to avoid floating point issues.
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Format currency in South African Rand (ZAR) format.
 * Example: R 1,893.36
 */
export function formatCurrency(amount: number): string {
  const rounded = round2(amount);
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(rounded)
    .replace('ZAR', 'R');
}

/**
 * Adjusts a base due date string into a target month (YYYY-MM).
 * Safely caps days to the maximum day of the target month (e.g. Feb 28/29, Apr 30).
 */
export function adjustDay(baseDateStr: string, monthKey: string): string {
  if (!monthKey || monthKey === 'ALL') {
    return baseDateStr;
  }

  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  let day = 1;
  if (baseDateStr.includes('-')) {
    const parts = baseDateStr.split('-');
    day = parseInt(parts[2], 10) || 1;
  } else {
    day = parseInt(baseDateStr, 10) || 1;
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(Math.max(day, 1), daysInMonth);

  const paddedDay = clampedDay.toString().padStart(2, '0');
  const paddedMonth = month.toString().padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * Calculates urgency status relative to today's date.
 */
export function getUrgency(
  dueDate: string,
  isPaid: boolean,
  _cycleMonth?: string
): UrgencyStatus {
  if (isPaid) return 'settled';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const parts = dueDate.split('-').map(Number);
  const dueYear = parts[0] || now.getFullYear();
  const dueMonth = (parts[1] || 1) - 1;
  const dueDay = parts[2] || 1;
  const due = new Date(dueYear, dueMonth, dueDay);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'next_due';
  return 'future_due';
}

/**
 * Resolves mathematical values for a single expense in a specified month cycle.
 */
export function resolveMonthExpense(
  expense: ExpenseDocument,
  monthKey: string
): ComputedExpenseMonth {
  const isAllMonths = !monthKey || monthKey === 'ALL';

  if (isAllMonths) {
    const originalDue = round2(expense.monthlyDueConfig.base * 12);
    const accumulatedCarryover = 0;
    const totalDue = originalDue;

    const settledPaid = round2(
      (expense.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    );

    const balanceDue =
      settledPaid >= totalDue && totalDue > 0
        ? 0
        : Math.max(0, round2(totalDue - settledPaid));

    const isPaid = settledPaid >= totalDue && totalDue > 0;
    const progressPercent =
      totalDue > 0 ? Math.min(100, round2((settledPaid / totalDue) * 100)) : 100;

    return {
      expense,
      originalDue,
      effectiveDueDate: expense.dueDate,
      accumulatedCarryover,
      totalDue,
      settledPaid,
      balanceDue,
      isPaid,
      urgency: isPaid ? 'settled' : 'future_due',
      progressPercent,
    };
  }

  // 1. Original Due (OD_m): If overrides[m] !== undefined then overrides[m] else base
  const overrides = expense.monthlyDueConfig?.overrides || {};
  const accumulatedMap = expense.monthlyDueConfig?.accumulated || {};
  const baseDue = Number(expense.monthlyDueConfig?.base) || 0;

  const originalDue = round2(
    overrides[monthKey] !== undefined ? overrides[monthKey] : baseDue
  );

  // 2. Due Date (DD_m): If dateOverrides[m] !== undefined then dateOverrides[m] else adjustDay(base, m)
  const dateOverrides = expense.monthlyDueDateConfig?.overrides || {};
  const baseDueDate = expense.monthlyDueDateConfig?.base || expense.dueDate || '2026-10-01';
  const effectiveDueDate =
    dateOverrides[monthKey] !== undefined
      ? dateOverrides[monthKey]
      : adjustDay(baseDueDate, monthKey);

  // 3. Accumulated Carryover (AC_m): If accumulatedOverrides[m] !== undefined then accumulatedOverrides[m] else 0
  const accumulatedCarryover = round2(
    accumulatedMap[monthKey] !== undefined ? accumulatedMap[monthKey] : 0
  );

  // 2.2 Effective Total Due (TD_m) = OD_m + AC_m
  const totalDue = round2(originalDue + accumulatedCarryover);

  // 2.3 Aggregated Settled Paid (SP_m)
  const monthPayments = (expense.payments || []).filter(
    (p) => p.date && p.date.startsWith(monthKey)
  );

  let settledPaid = round2(
    monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  );

  // Fallback for legacy migrated sheet records
  if ((!expense.payments || expense.payments.length === 0) && expense.basePaid) {
    settledPaid = totalDue;
  }

  // 2.4 Balance Due (BD_m) and Paid Status
  const isPaid = settledPaid >= totalDue && totalDue > 0;
  const balanceDue = isPaid ? 0 : Math.max(0, round2(totalDue - settledPaid));

  const urgency = getUrgency(effectiveDueDate, isPaid, monthKey);
  const progressPercent =
    totalDue > 0 ? Math.min(100, round2((settledPaid / totalDue) * 100)) : 100;

  return {
    expense,
    originalDue,
    effectiveDueDate,
    accumulatedCarryover,
    totalDue,
    settledPaid,
    balanceDue,
    isPaid,
    urgency,
    progressPercent,
  };
}

/**
 * Calculates top KPI summary metrics and urgency counts for all expenses in a given month.
 */
export function calculateMonthKpis(
  expenses: ExpenseDocument[],
  monthKey: string
): MonthKpiMetrics {
  let totalBudgetCeiling = 0;
  let totalSettledPaid = 0;
  let totalRemainingBalance = 0;
  let personalTotal = 0;
  let companyTotal = 0;

  const urgencyCounts = {
    all: expenses.length,
    overdue: 0,
    next_due: 0,
    future_due: 0,
    settled: 0,
  };

  expenses.forEach((expense) => {
    const computed = resolveMonthExpense(expense, monthKey);

    totalBudgetCeiling += computed.totalDue;
    totalSettledPaid += computed.settledPaid;
    totalRemainingBalance += computed.balanceDue;

    if (expense.scope === 'personal') {
      personalTotal += computed.totalDue;
    } else {
      companyTotal += computed.totalDue;
    }

    urgencyCounts[computed.urgency] = (urgencyCounts[computed.urgency] || 0) + 1;
  });

  totalBudgetCeiling = round2(totalBudgetCeiling);
  totalSettledPaid = round2(totalSettledPaid);
  totalRemainingBalance = round2(totalRemainingBalance);
  personalTotal = round2(personalTotal);
  companyTotal = round2(companyTotal);

  const combinedScope = personalTotal + companyTotal;
  const personalRatio =
    combinedScope > 0 ? round2((personalTotal / combinedScope) * 100) : 50;
  const companyRatio =
    combinedScope > 0 ? round2((companyTotal / combinedScope) * 100) : 50;

  const paidProgressPercentage =
    totalBudgetCeiling > 0
      ? Math.min(100, round2((totalSettledPaid / totalBudgetCeiling) * 100))
      : 0;

  return {
    totalBudgetCeiling,
    totalSettledPaid,
    totalRemainingBalance,
    paidProgressPercentage,
    personalTotal,
    companyTotal,
    personalRatio,
    companyRatio,
    urgencyCounts,
  };
}

export const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Combines 12 months of income and expenses into full-year Cashflow analytics records.
 */
export function build12MonthCashflow(
  expenses: ExpenseDocument[],
  incomes: Record<string, IncomeDocument>,
  year: string = '2026'
): MonthCashflowMetrics[] {
  return MONTH_LABELS.map((label, idx) => {
    const monthNum = (idx + 1).toString().padStart(2, '0');
    const monthId = `${year}-${monthNum}`;

    const inc = incomes[monthId] || {
      monthId,
      personalIncome: 0,
      companyIncome: 0,
    };

    const personalIncome = round2(Number(inc.personalIncome) || 0);
    const companyIncome = round2(Number(inc.companyIncome) || 0);
    const totalInflow = round2(personalIncome + companyIncome);

    // Sum expenses for this month
    let totalExpenses = 0;
    let settledPaid = 0;

    expenses.forEach((exp) => {
      const resolved = resolveMonthExpense(exp, monthId);
      totalExpenses += resolved.totalDue;
      settledPaid += resolved.settledPaid;
    });

    totalExpenses = round2(totalExpenses);
    settledPaid = round2(settledPaid);

    const netCashflow = round2(totalInflow - totalExpenses);
    const freeMarginPercent =
      totalInflow > 0 ? round2((netCashflow / totalInflow) * 100) : 0;
    const burnRatePercent =
      totalInflow > 0 ? round2((totalExpenses / totalInflow) * 100) : 0;

    return {
      monthId,
      monthLabel: `${label} ${year}`,
      personalIncome,
      companyIncome,
      totalInflow,
      totalExpenses,
      settledPaid,
      netCashflow,
      freeMarginPercent,
      burnRatePercent,
      isDeficit: netCashflow < 0,
    };
  });
}

/**
 * Calculates updated MonthlyDueConfig when Total Due is edited for an expense.
 * Supports:
 * - 'this_month': Overrides only the active month cycle without altering others.
 * - 'following_months': Locks prior months to their existing values, and updates
 *   the active month and all subsequent months forward, plus sets base.
 */
export function updateExpenseMonthlyDue(
  expense: ExpenseDocument,
  monthKey: string,
  newTotalDue: number,
  scope: 'this_month' | 'following_months'
): MonthlyDueConfig {
  const cleanDue = round2(Math.max(0, newTotalDue));
  const accumulated = expense.monthlyDueConfig?.accumulated?.[monthKey] || 0;
  // Subtract any existing carryover so the resulting totalDue = originalDue + accumulated
  const newOriginalDue = round2(Math.max(0, cleanDue - accumulated));
  const oldBase = Number(expense.monthlyDueConfig?.base) || 0;
  const currentOverrides = { ...(expense.monthlyDueConfig?.overrides || {}) };

  if (monthKey === 'ALL' || scope === 'following_months') {
    const allMonths = [
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
    ];

    allMonths.forEach((m) => {
      if (m < monthKey) {
        // Lock prior months so they keep their historical value
        if (currentOverrides[m] === undefined) {
          currentOverrides[m] = oldBase;
        }
      } else {
        // Apply to this month and all following months
        currentOverrides[m] = newOriginalDue;
      }
    });

    return {
      ...expense.monthlyDueConfig,
      base: newOriginalDue,
      overrides: currentOverrides,
    };
  }

  // 'this_month' only: override only for the selected cycle
  currentOverrides[monthKey] = newOriginalDue;

  return {
    ...expense.monthlyDueConfig,
    base: oldBase,
    overrides: currentOverrides,
  };
}

