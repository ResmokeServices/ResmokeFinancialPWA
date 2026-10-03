import { create } from 'zustand';
import {
  CashflowKpiSummary,
  ExpenseDocument,
  FinanceAppState,
  IncomeDocument,
  MonthCashflowMetrics,
  PaymentEntry,
} from '@/types/finance';
import { INITIAL_EXPENSES, INITIAL_INCOMES } from '@/lib/mockData';
import {
  db,
  hasFirebaseConfig,
  getFirestoreExpenses,
  saveFirestoreExpense,
  batchSaveFirestoreExpenses,
  deleteFirestoreExpense,
  getFirestoreIncomes,
  saveFirestoreIncome,
} from '@/lib/firebase';
import {
  resolveMonthExpense,
  calculateMonthKpis,
  build12MonthCashflow,
  round2,
  updateExpenseMonthlyDue,
  matchesCycle,
} from '@/lib/calculations';

const EXPENSES_STORAGE_KEY = 'resmoke_financial_pwa_expenses';
const INCOMES_STORAGE_KEY = 'resmoke_financial_pwa_incomes';

const saveExpensesToLocalStorage = (expenses: ExpenseDocument[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    } catch {
      // Ignore
    }
  }
};

const saveIncomesToLocalStorage = (incomes: Record<string, IncomeDocument>) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(INCOMES_STORAGE_KEY, JSON.stringify(incomes));
    } catch {
      // Ignore
    }
  }
};

export const useFinanceStore = create<FinanceAppState>((set, get) => ({
  // Navigation & Filtering
  selectedMonth: '2026-10', // Default active cycle in blueprint
  activeScopeTab: 'all',
  searchQuery: '',
  selectedUrgencyFilter: 'ALL',

  // Critical requirement: renderOrder kept intact as []
  renderOrder: [],

  // Data Collections - initialized consistently across SSR and initial Client render
  expenses: INITIAL_EXPENSES,
  incomes: INITIAL_INCOMES,
  isLoading: false,
  error: null,
  userId: 'user_demo_01',

  setSelectedMonth: (month: string) => set({ selectedMonth: month }),
  setActiveScopeTab: (tab) => set({ activeScopeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setUrgencyFilter: (filter) => set({ selectedUrgencyFilter: filter }),
  setUserId: (userId) => set({ userId }),

  fetchExpenses: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (hasFirebaseConfig && db) {
        const firestoreData = await getFirestoreExpenses(userId);
        if (firestoreData.length > 0) {
          set({ expenses: firestoreData, isLoading: false });
          saveExpensesToLocalStorage(firestoreData);
          return;
        }
      }
      // Client-side fallback to localStorage (runs safely post-mount)
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(EXPENSES_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              set({ expenses: parsed, isLoading: false });
              return;
            }
          } catch {
            // Ignore
          }
        }
      }
      set({ isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch expenses';
      set({ error: message, isLoading: false });
    }
  },

  updateExpense: async (expenseId: string, delta: Partial<ExpenseDocument>) => {
    const { expenses, userId } = get();
    const updated = expenses.map((exp) =>
      exp.id === expenseId
        ? { ...exp, ...delta, updatedAt: new Date().toISOString() }
        : exp
    );
    set({ expenses: updated });
    saveExpensesToLocalStorage(updated);

    const target = updated.find((exp) => exp.id === expenseId);
    if (target && hasFirebaseConfig) {
      try {
        await saveFirestoreExpense(userId, target);
      } catch (e) {
        console.error('Firestore sync error:', e);
      }
    }
  },

  savePaymentRecords: async (
    expenseId: string,
    monthKey: string,
    newMonthPayments: PaymentEntry[]
  ) => {
    const { expenses, userId } = get();
    const target = expenses.find((exp) => exp.id === expenseId);
    if (!target) return;

    const otherMonthPayments = (target.payments || []).filter(
      (p) => !matchesCycle(p?.date, monthKey)
    );

    const mergedPayments = [...otherMonthPayments, ...newMonthPayments];
    const updated = expenses.map((exp) =>
      exp.id === expenseId
        ? {
            ...exp,
            payments: mergedPayments,
            updatedAt: new Date().toISOString(),
          }
        : exp
    );

    set({ expenses: updated });
    saveExpensesToLocalStorage(updated);

    const modified = updated.find((e) => e.id === expenseId);
    if (modified && hasFirebaseConfig) {
      try {
        await saveFirestoreExpense(userId, modified);
      } catch (e) {
        console.error('Firestore save payments error:', e);
      }
    }
  },

  toggleSettleExpense: async (expenseId: string, monthKey: string) => {
    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator
    ) {
      try {
        navigator.vibrate?.(30);
      } catch {
        // Safe fallback
      }
    }

    const { expenses, userId } = get();
    const target = expenses.find((exp) => exp.id === expenseId);
    if (!target) return;

    const computed = resolveMonthExpense(target, monthKey);
    let updatedPayments: PaymentEntry[];

    if (computed.isPaid) {
      updatedPayments = (target.payments || []).filter(
        (p) => !matchesCycle(p?.date, monthKey)
      );
    } else {
      const settlementDate =
        monthKey === 'ALL'
          ? new Date().toISOString().slice(0, 10)
          : `${monthKey}-01`;

      const settlementPayment: PaymentEntry = {
        id: `pay_${Date.now()}`,
        amount: computed.balanceDue > 0 ? computed.balanceDue : computed.totalDue,
        date: settlementDate,
        reference: 'Quick Settlement',
      };
      const existingWithoutMonth = (target.payments || []).filter(
        (p) => !matchesCycle(p?.date, monthKey)
      );
      updatedPayments = [...existingWithoutMonth, settlementPayment];
    }

    const updated = expenses.map((exp) =>
      exp.id === expenseId
        ? {
            ...exp,
            payments: updatedPayments,
            updatedAt: new Date().toISOString(),
          }
        : exp
    );

    set({ expenses: updated });
    saveExpensesToLocalStorage(updated);

    const updatedTarget = updated.find((e) => e.id === expenseId);
    if (updatedTarget && hasFirebaseConfig) {
      try {
        await saveFirestoreExpense(userId, updatedTarget);
      } catch (e) {
        console.error('Firestore toggle settle error:', e);
      }
    }
  },

  deleteExpense: async (expenseId: string) => {
    const { expenses, userId } = get();
    const updated = expenses.filter((e) => e.id !== expenseId);
    set({ expenses: updated });
    saveExpensesToLocalStorage(updated);

    if (hasFirebaseConfig) {
      try {
        await deleteFirestoreExpense(userId, expenseId);
      } catch (e) {
        console.error('Firestore delete error:', e);
      }
    }
  },

  addExpense: async (expenseData) => {
    const { expenses, userId } = get();
    const newExpense: ExpenseDocument = {
      ...expenseData,
      id: `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: expenseData.payments || [],
    };

    const updated = [newExpense, ...expenses];
    set({ expenses: updated });
    saveExpensesToLocalStorage(updated);

    if (hasFirebaseConfig) {
      try {
        await saveFirestoreExpense(userId, newExpense);
      } catch (e) {
        console.error('Firestore add expense error:', e);
      }
    }
  },

  batchAddExpenses: async (newExpenses: ExpenseDocument[]) => {
    const { expenses, userId } = get();
    // Deduplicate against existing expenses by name & reference to prevent double entry
    const existingKeys = new Set(expenses.map((e) => `${e.name.toLowerCase()}_${e.reference.toLowerCase()}`));
    const deduplicated = newExpenses.filter(
      (e) => !existingKeys.has(`${e.name.toLowerCase()}_${e.reference.toLowerCase()}`)
    );

    const merged = [...deduplicated, ...expenses];
    set({ expenses: merged });
    saveExpensesToLocalStorage(merged);

    if (hasFirebaseConfig) {
      try {
        await batchSaveFirestoreExpenses(userId, newExpenses);
      } catch (e) {
        console.error('Firestore batch save error:', e);
      }
    }
    return newExpenses.length;
  },

  updateExpenseDue: async (
    expenseId: string,
    monthKey: string,
    newTotalDue: number,
    scope: 'this_month' | 'following_months'
  ) => {
    const { expenses, userId } = get();
    const target = expenses.find((e) => e.id === expenseId);
    if (!target) return;

    const updatedDueConfig = updateExpenseMonthlyDue(
      target,
      monthKey,
      newTotalDue,
      scope
    );

    const updated = expenses.map((exp) =>
      exp.id === expenseId
        ? {
            ...exp,
            monthlyDueConfig: updatedDueConfig,
            updatedAt: new Date().toISOString(),
          }
        : exp
    );

    set({ expenses: updated });
    saveExpensesToLocalStorage(updated);

    const updatedTarget = updated.find((e) => e.id === expenseId);
    if (updatedTarget && hasFirebaseConfig) {
      try {
        await saveFirestoreExpense(userId, updatedTarget);
      } catch (e) {
        console.error('Firestore update expense due error:', e);
      }
    }
  },

  // --- Phase 2: Income & Cashflow State Management ---
  fetchIncome: async (userId: string) => {
    try {
      if (hasFirebaseConfig && db) {
        const firestoreIncomes = await getFirestoreIncomes(userId);
        if (Object.keys(firestoreIncomes).length > 0) {
          set({ incomes: firestoreIncomes });
          saveIncomesToLocalStorage(firestoreIncomes);
          return;
        }
      }
      // Client-side fallback to localStorage (runs safely post-mount)
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(INCOMES_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
              set((state) => ({ incomes: { ...state.incomes, ...parsed } }));
              return;
            }
          } catch {
            // Ignore
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch income records:', err);
    }
  },

  updateIncome: async (
    monthId: string,
    personalIncome: number,
    companyIncome: number
  ) => {
    const { incomes, userId } = get();
    const cleanPersonal = round2(Number(personalIncome) || 0);
    const cleanCompany = round2(Number(companyIncome) || 0);

    const updatedRecord: IncomeDocument = {
      monthId,
      personalIncome: cleanPersonal,
      companyIncome: cleanCompany,
      updatedAt: new Date().toISOString(),
    };

    const newIncomes = {
      ...incomes,
      [monthId]: updatedRecord,
    };

    set({ incomes: newIncomes });
    saveIncomesToLocalStorage(newIncomes);

    if (hasFirebaseConfig) {
      try {
        await saveFirestoreIncome(userId, updatedRecord);
      } catch (e) {
        console.error('Firestore save income error:', e);
      }
    }
  },
}));

/**
 * Custom Selector Hook: Expense KPI summary metrics for the selected month
 */
export function useMonthMetrics() {
  const expenses = useFinanceStore((state) => state.expenses);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  return calculateMonthKpis(expenses, selectedMonth);
}

/**
 * Custom Selector Hook: Cashflow KPI Summary (Inflow, Outflow, Net, Burn Rate) for selected month
 */
export function useCurrentCashflowKpis(): CashflowKpiSummary {
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const incomes = useFinanceStore((state) => state.incomes);
  const expenses = useFinanceStore((state) => state.expenses);

  if (selectedMonth === 'ALL') {
    // Aggregate full year for "ALL"
    let totalInflow = 0;
    let totalOutflow = 0;

    Object.values(incomes).forEach((inc) => {
      totalInflow += (inc.personalIncome || 0) + (inc.companyIncome || 0);
    });

    expenses.forEach((exp) => {
      const resolved = resolveMonthExpense(exp, 'ALL');
      totalOutflow += resolved.totalDue;
    });

    totalInflow = round2(totalInflow);
    totalOutflow = round2(totalOutflow);
    const netCashflow = round2(totalInflow - totalOutflow);
    const incomeBurnRatePercent =
      totalInflow > 0 ? round2((totalOutflow / totalInflow) * 100) : 0;

    return {
      monthlyInflow: totalInflow,
      monthlyOutflow: totalOutflow,
      netCashflow,
      incomeBurnRatePercent,
      isDeficit: netCashflow < 0,
    };
  }

  const currentIncome = incomes[selectedMonth] || {
    monthId: selectedMonth,
    personalIncome: 0,
    companyIncome: 0,
  };

  const monthlyInflow = round2(
    (Number(currentIncome.personalIncome) || 0) +
      (Number(currentIncome.companyIncome) || 0)
  );

  let monthlyOutflow = 0;
  expenses.forEach((exp) => {
    const resolved = resolveMonthExpense(exp, selectedMonth);
    monthlyOutflow += resolved.totalDue;
  });
  monthlyOutflow = round2(monthlyOutflow);

  const netCashflow = round2(monthlyInflow - monthlyOutflow);
  const incomeBurnRatePercent =
    monthlyInflow > 0 ? round2((monthlyOutflow / monthlyInflow) * 100) : 0;

  return {
    monthlyInflow,
    monthlyOutflow,
    netCashflow,
    incomeBurnRatePercent,
    isDeficit: netCashflow < 0,
  };
}

/**
 * Custom Selector Hook: 12-Month Inflow vs Outflow records for charts and tables
 */
export function use12MonthCashflow(): MonthCashflowMetrics[] {
  const expenses = useFinanceStore((state) => state.expenses);
  const incomes = useFinanceStore((state) => state.incomes);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);

  const year = selectedMonth !== 'ALL' ? selectedMonth.split('-')[0] : '2026';
  return build12MonthCashflow(expenses, incomes, year);
}

/**
 * Custom Selector Hook: Filtered & Sorted Expenses for the active view
 */
export function useFilteredExpenses() {
  const expenses = useFinanceStore((state) => state.expenses);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const activeScopeTab = useFinanceStore((state) => state.activeScopeTab);
  const searchQuery = useFinanceStore((state) => state.searchQuery.toLowerCase().trim());
  const selectedUrgencyFilter = useFinanceStore((state) => state.selectedUrgencyFilter);

  const computedList = expenses.map((expense) =>
    resolveMonthExpense(expense, selectedMonth)
  );

  let filtered = computedList;
  if (activeScopeTab !== 'all') {
    filtered = filtered.filter((item) => item.expense.scope === activeScopeTab);
  }

  if (searchQuery) {
    filtered = filtered.filter((item) => {
      const name = item.expense.name.toLowerCase();
      const ref = item.expense.reference.toLowerCase();
      const method = item.expense.paymentMethod.toLowerCase();
      return (
        name.includes(searchQuery) ||
        ref.includes(searchQuery) ||
        method.includes(searchQuery)
      );
    });
  }

  if (selectedUrgencyFilter !== 'ALL') {
    filtered = filtered.filter((item) => item.urgency === selectedUrgencyFilter);
  }

  filtered.sort((a, b) => {
    if (a.isPaid !== b.isPaid) {
      return a.isPaid ? 1 : -1;
    }
    return a.effectiveDueDate.localeCompare(b.effectiveDueDate);
  });

  return filtered;
}
