import { create } from 'zustand';
import {
  ExpenseDocument,
  FinanceAppState,
  PaymentEntry,
} from '@/types/finance';
import { INITIAL_EXPENSES } from '@/lib/mockData';
import {
  db,
  hasFirebaseConfig,
  getFirestoreExpenses,
  saveFirestoreExpense,
  deleteFirestoreExpense,
} from '@/lib/firebase';
import { resolveMonthExpense, calculateMonthKpis } from '@/lib/calculations';

const LOCAL_STORAGE_KEY = 'resmoke_financial_pwa_expenses';

const getInitialExpenses = (): ExpenseDocument[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
  }
  return INITIAL_EXPENSES;
};

const saveToLocalStorage = (expenses: ExpenseDocument[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
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

  // Data Collections
  expenses: getInitialExpenses(),
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
          saveToLocalStorage(firestoreData);
          return;
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
    saveToLocalStorage(updated);

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

    // Filter out existing payments belonging to this specific month, and append new ones
    const otherMonthPayments = (target.payments || []).filter(
      (p) => !p.date.startsWith(monthKey)
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
    saveToLocalStorage(updated);

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
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
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
      // Unsettle: remove payments for this month
      updatedPayments = (target.payments || []).filter(
        (p) => !p.date.startsWith(monthKey)
      );
    } else {
      // Settle: add payment covering remaining balance
      const settlementPayment: PaymentEntry = {
        id: `pay_${Date.now()}`,
        amount: computed.balanceDue > 0 ? computed.balanceDue : computed.totalDue,
        date: `${monthKey}-01`,
        reference: 'Quick Settlement',
      };
      const existingWithoutMonth = (target.payments || []).filter(
        (p) => !p.date.startsWith(monthKey)
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
    saveToLocalStorage(updated);

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
    saveToLocalStorage(updated);

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
    saveToLocalStorage(updated);

    if (hasFirebaseConfig) {
      try {
        await saveFirestoreExpense(userId, newExpense);
      } catch (e) {
        console.error('Firestore add expense error:', e);
      }
    }
  },
}));

export function useMonthMetrics() {
  const expenses = useFinanceStore((state) => state.expenses);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  return calculateMonthKpis(expenses, selectedMonth);
}

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
