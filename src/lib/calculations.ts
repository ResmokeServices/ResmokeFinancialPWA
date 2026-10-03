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
 * Dynamically chains unpaid balances from prior months forward into subsequent months
 * (accumulated carryover), exactly matching standard multi-month reconciliation.
 */
export function resolveMonthExpense(
  expense: ExpenseDocument,
  monthKey: string
): ComputedExpenseMonth {
  const isAllMonths = !monthKey || monthKey === 'ALL';

  if (isAllMonths) {
    // For 12M Full Year view: simulate Jan through Dec
    let accumulatedCarryover = round2(
      expense.monthlyDueConfig?.accumulated?.['2026-01'] || 0
    );
    let totalAnnualOriginalDue = 0;
    let totalAnnualPaid = 0;
    let finalDecemberBalance = 0;

    for (let m = 1; m <= 12; m++) {
      const cycleKey = `2026-${m.toString().padStart(2, '0')}`;
      const overrides = expense.monthlyDueConfig?.overrides || {};
      const baseDue = Number(expense.monthlyDueConfig?.base) || 0;
      const originalDue = round2(
        overrides[cycleKey] !== undefined ? overrides[cycleKey] : baseDue
      );
      totalAnnualOriginalDue = round2(totalAnnualOriginalDue + originalDue);

      let cycleCarryover = accumulatedCarryover;
      if (m > 1 && expense.monthlyDueConfig?.accumulated?.[cycleKey]) {
        cycleCarryover = round2(
          cycleCarryover + expense.monthlyDueConfig.accumulated[cycleKey]
        );
      }

      const totalDue = round2(originalDue + cycleCarryover);

      const monthPayments = (expense.payments || []).filter(
        (p) => p.date && p.date.replace(/\//g, '-').startsWith(cycleKey)
      );
      let settledPaid = round2(
        monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      );
      if ((!expense.payments || expense.payments.length === 0) && expense.basePaid) {
        settledPaid = totalDue;
      }
      totalAnnualPaid = round2(totalAnnualPaid + settledPaid);

      const isPaid = settledPaid >= totalDue && totalDue > 0;
      const balanceDue = isPaid ? 0 : Math.max(0, round2(totalDue - settledPaid));
      accumulatedCarryover = balanceDue;
      if (m === 12) {
        finalDecemberBalance = balanceDue;
      }
    }

    const totalAnnualDue = totalAnnualOriginalDue;
    const isPaid = totalAnnualPaid >= totalAnnualDue && totalAnnualDue > 0;
    const balanceDue = finalDecemberBalance;
    const progressPercent =
      totalAnnualDue > 0
        ? Math.min(100, round2((totalAnnualPaid / totalAnnualDue) * 100))
        : 100;

    return {
      expense,
      originalDue: totalAnnualDue,
      effectiveDueDate: expense.dueDate,
      accumulatedCarryover: 0,
      totalDue: totalAnnualDue,
      settledPaid: totalAnnualPaid,
      balanceDue,
      isPaid,
      urgency: isPaid ? 'settled' : 'future_due',
      progressPercent,
    };
  }

  // Monthly Cycle Resolution:
  // Parse target year and target month number
  const parts = monthKey.split('-');
  const yearStr = parts[0] || '2026';
  const targetMonthNum = Math.min(12, Math.max(1, parseInt(parts[1], 10) || 1));

  // Initial opening carryover from prior period / sheet opening balance
  let runningCarryover = round2(
    expense.monthlyDueConfig?.accumulated?.['2026-01'] || 0
  );

  let targetComputed: ComputedExpenseMonth | null = null;

  for (let m = 1; m <= targetMonthNum; m++) {
    const cycleKey = `${yearStr}-${m.toString().padStart(2, '0')}`;

    // 1. Original Due (OD_m): If overrides[m] !== undefined then overrides[m] else base
    const overrides = expense.monthlyDueConfig?.overrides || {};
    const baseDue = Number(expense.monthlyDueConfig?.base) || 0;
    const originalDue = round2(
      overrides[cycleKey] !== undefined ? overrides[cycleKey] : baseDue
    );

    // 2. Accumulated Carryover (AC_m) entering this month:
    let cycleCarryover = runningCarryover;
    if (m > 1 && expense.monthlyDueConfig?.accumulated?.[cycleKey]) {
      cycleCarryover = round2(
        cycleCarryover + expense.monthlyDueConfig.accumulated[cycleKey]
      );
    }

    // 3. Effective Total Due (TD_m) = OD_m + AC_m
    const totalDue = round2(originalDue + cycleCarryover);

    // 4. Aggregated Settled Paid (SP_m)
    const monthPayments = (expense.payments || []).filter(
      (p) => p.date && p.date.replace(/\//g, '-').startsWith(cycleKey)
    );
    let settledPaid = round2(
      monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    );

    // Fallback for legacy migrated sheet records
    if ((!expense.payments || expense.payments.length === 0) && expense.basePaid) {
      settledPaid = totalDue;
    }

    // 5. Balance Due (BD_m) and Paid Status for this cycle
    const isPaid = settledPaid >= totalDue && totalDue > 0;
    const balanceDue = isPaid ? 0 : Math.max(0, round2(totalDue - settledPaid));

    if (cycleKey === monthKey) {
      const dateOverrides = expense.monthlyDueDateConfig?.overrides || {};
      const baseDueDate =
        expense.monthlyDueDateConfig?.base ||
        expense.dueDate ||
        `${yearStr}-10-01`;
      const effectiveDueDate =
        dateOverrides[cycleKey] !== undefined
          ? dateOverrides[cycleKey]
          : adjustDay(baseDueDate, cycleKey);

      const urgency = getUrgency(effectiveDueDate, isPaid, cycleKey);
      const progressPercent =
        totalDue > 0
          ? Math.min(100, round2((settledPaid / totalDue) * 100))
          : 100;

      targetComputed = {
        expense,
        originalDue,
        effectiveDueDate,
        accumulatedCarryover: cycleCarryover,
        totalDue,
        settledPaid,
        balanceDue,
        isPaid,
        urgency,
        progressPercent,
      };
      break;
    }

    // The unpaid amount carries forward into the next month!
    runningCarryover = balanceDue;
  }

  if (targetComputed) {
    return targetComputed;
  }

  // Fallback if month was outside 1..12
  const overrides = expense.monthlyDueConfig?.overrides || {};
  const baseDue = Number(expense.monthlyDueConfig?.base) || 0;
  const originalDue = round2(
    overrides[monthKey] !== undefined ? overrides[monthKey] : baseDue
  );
  const totalDue = round2(originalDue + runningCarryover);
  return {
    expense,
    originalDue,
    effectiveDueDate: expense.dueDate,
    accumulatedCarryover: runningCarryover,
    totalDue,
    settledPaid: 0,
    balanceDue: totalDue,
    isPaid: false,
    urgency: 'overdue',
    progressPercent: 0,
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

