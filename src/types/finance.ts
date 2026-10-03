export type ScopeType = 'personal' | 'company';

export type PaymentMethod =
  | 'Debit Order'
  | 'EFT'
  | 'Cash'
  | 'Card'
  | 'Cash Send';

export type UrgencyStatus = 'settled' | 'overdue' | 'next_due' | 'future_due';

export interface PaymentEntry {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  reference?: string;
}

export interface MonthlyDueConfig {
  base: number;
  overrides?: Record<string, number>; // e.g. { "2026-11": 1950.00 }
  accumulated?: Record<string, number>; // e.g. { "2026-10": 450.00 }
}

export interface MonthlyDueDateConfig {
  base: string; // e.g. "2026-10-16" or day number
  overrides?: Record<string, string>; // e.g. { "2026-12": "2026-12-10" }
}

export interface ExpenseDocument {
  id: string;
  name: string;
  reference: string;
  scope: ScopeType;
  dueDate: string; // ISO format (YYYY-MM-DD) default due date
  paymentMethod: PaymentMethod;
  monthlyDueConfig: MonthlyDueConfig;
  monthlyDueDateConfig: MonthlyDueDateConfig;
  payments: PaymentEntry[];
  basePaid?: boolean; // Fallback for legacy migrated records
  createdAt?: string;
  updatedAt?: string;
}

export interface IncomeDocument {
  monthId: string; // e.g. "2026-01" to "2026-12"
  personalIncome: number;
  companyIncome: number;
  updatedAt?: string;
}

export interface ComputedExpenseMonth {
  expense: ExpenseDocument;
  originalDue: number; // OD_m
  effectiveDueDate: string; // DD_m
  accumulatedCarryover: number; // AC_m
  totalDue: number; // TD_m
  settledPaid: number; // SP_m
  balanceDue: number; // BD_m
  isPaid: boolean;
  urgency: UrgencyStatus;
  progressPercent: number;
}

export interface MonthKpiMetrics {
  totalBudgetCeiling: number; // Sum of TD_m
  totalSettledPaid: number; // Sum of SP_m
  totalRemainingBalance: number; // Sum of BD_m
  paidProgressPercentage: number;
  personalTotal: number;
  companyTotal: number;
  personalRatio: number; // percentage (0-100)
  companyRatio: number; // percentage (0-100)
  urgencyCounts: {
    all: number;
    overdue: number;
    next_due: number;
    future_due: number;
    settled: number;
  };
}

export interface MonthCashflowMetrics {
  monthId: string;
  monthLabel: string;
  personalIncome: number;
  companyIncome: number;
  totalInflow: number; // personalIncome + companyIncome
  totalExpenses: number; // TD_m (Total Due)
  settledPaid: number; // SP_m
  netCashflow: number; // totalInflow - totalExpenses
  freeMarginPercent: number; // (netCashflow / totalInflow) * 100
  burnRatePercent: number; // (totalExpenses / totalInflow) * 100
  isDeficit: boolean;
}

export interface CashflowKpiSummary {
  monthlyInflow: number;
  monthlyOutflow: number;
  netCashflow: number;
  incomeBurnRatePercent: number;
  isDeficit: boolean;
}

export interface FinanceAppState {
  // Navigation & Filtering
  selectedMonth: string; // "2026-01" to "2026-12" or "ALL"
  activeScopeTab: 'all' | 'personal' | 'company';
  searchQuery: string;
  selectedUrgencyFilter: 'ALL' | 'overdue' | 'next_due' | 'future_due' | 'settled';

  // Critical requirement: renderOrder kept intact as []
  renderOrder: [];

  // Data Collections
  expenses: ExpenseDocument[];
  incomes: Record<string, IncomeDocument>;
  isLoading: boolean;
  error: string | null;
  userId: string;

  // Actions
  setSelectedMonth: (month: string) => void;
  setActiveScopeTab: (tab: 'all' | 'personal' | 'company') => void;
  setSearchQuery: (query: string) => void;
  setUrgencyFilter: (filter: 'ALL' | 'overdue' | 'next_due' | 'future_due' | 'settled') => void;
  setUserId: (userId: string) => void;

  // Async Sync Engine (Expenses)
  fetchExpenses: (userId: string) => Promise<void>;
  updateExpense: (expenseId: string, delta: Partial<ExpenseDocument>) => Promise<void>;
  savePaymentRecords: (expenseId: string, monthKey: string, payments: PaymentEntry[]) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  toggleSettleExpense: (expenseId: string, monthKey: string) => Promise<void>;
  addExpense: (expense: Omit<ExpenseDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  batchAddExpenses: (expenses: ExpenseDocument[]) => Promise<number>;

  // Async Sync Engine (Income & Cashflow)
  fetchIncome: (userId: string) => Promise<void>;
  updateIncome: (monthId: string, personalIncome: number, companyIncome: number) => Promise<void>;
}
