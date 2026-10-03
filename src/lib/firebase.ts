import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { ExpenseDocument, IncomeDocument } from '@/types/finance';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

const app =
  getApps().length > 0
    ? getApp()
    : hasFirebaseConfig
    ? initializeApp(firebaseConfig)
    : null;

export const db = app ? getFirestore(app) : null;

/**
 * Fetch expenses from Firestore subcollection: /users/{userId}/expenses
 */
export async function getFirestoreExpenses(userId: string): Promise<ExpenseDocument[]> {
  if (!db || !hasFirebaseConfig) {
    return [];
  }
  const expensesRef = collection(db, 'users', userId, 'expenses');
  const snapshot = await getDocs(expensesRef);
  const expenses: ExpenseDocument[] = [];
  snapshot.forEach((docSnap) => {
    expenses.push({ ...(docSnap.data() as ExpenseDocument), id: docSnap.id });
  });
  return expenses;
}

/**
 * Save or update expense in Firestore: /users/{userId}/expenses/{expenseId}
 */
export async function saveFirestoreExpense(
  userId: string,
  expense: ExpenseDocument
): Promise<void> {
  if (!db || !hasFirebaseConfig) return;
  const expenseRef = doc(db, 'users', userId, 'expenses', expense.id);
  await setDoc(
    expenseRef,
    {
      ...expense,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Batch write multiple expenses in chunks to Firestore: /users/{userId}/expenses/{expenseId}
 */
export async function batchSaveFirestoreExpenses(
  userId: string,
  expenses: ExpenseDocument[]
): Promise<number> {
  if (!db || !hasFirebaseConfig || expenses.length === 0) return 0;

  const CHUNK_SIZE = 400; // Well below Firestore's 500 operations per batch limit
  let count = 0;

  for (let i = 0; i < expenses.length; i += CHUNK_SIZE) {
    const chunk = expenses.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((exp) => {
      const expRef = doc(db, 'users', userId, 'expenses', exp.id);
      batch.set(
        expRef,
        {
          ...exp,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
    count += chunk.length;
  }

  return count;
}

/**
 * Delete expense from Firestore: /users/{userId}/expenses/{expenseId}
 */
export async function deleteFirestoreExpense(
  userId: string,
  expenseId: string
): Promise<void> {
  if (!db || !hasFirebaseConfig) return;
  const expenseRef = doc(db, 'users', userId, 'expenses', expenseId);
  await deleteDoc(expenseRef);
}

/**
 * Fetch all monthly income records from Firestore subcollection: /users/{userId}/income
 */
export async function getFirestoreIncomes(
  userId: string
): Promise<Record<string, IncomeDocument>> {
  if (!db || !hasFirebaseConfig) {
    return {};
  }
  const incomeRef = collection(db, 'users', userId, 'income');
  const snapshot = await getDocs(incomeRef);
  const incomeMap: Record<string, IncomeDocument> = {};
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as IncomeDocument;
    incomeMap[docSnap.id] = {
      ...data,
      monthId: docSnap.id,
    };
  });
  return incomeMap;
}

/**
 * Save or update monthly income record in Firestore: /users/{userId}/income/{monthId}
 */
export async function saveFirestoreIncome(
  userId: string,
  income: IncomeDocument
): Promise<void> {
  if (!db || !hasFirebaseConfig) return;
  const incomeDocRef = doc(db, 'users', userId, 'income', income.monthId);
  await setDoc(
    incomeDocRef,
    {
      ...income,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
