import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lifeos/budget';
const BUDGETS_KEY = '@lifeos/budget_limits';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes: string;
  recurring: boolean;
  linkedTaskIds: string[];
  linkedPersonIds: string[];
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  createdAt: string;
}

const genId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

export const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Entertainment', 'Shopping',
  'Health', 'Bills', 'Travel', 'Education', 'Personal', 'Other',
];
export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Gift', 'Bonus', 'Other',
];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F97316', Transport: '#3B82F6', Entertainment: '#8B5CF6',
  Shopping: '#EC4899', Health: '#10B981', Bills: '#EF4444',
  Travel: '#14B8A6', Education: '#6366F1', Personal: '#F59E0B', Other: '#6B7280',
  Salary: '#10B981', Freelance: '#14B8A6', Investment: '#3B82F6',
  Gift: '#EC4899', Bonus: '#F97316',
};

const now = new Date();
const d = (offsetDays: number) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - offsetDays).toISOString();

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', title: 'Monthly Salary', amount: 8500, type: 'income', category: 'Salary', date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), notes: '', recurring: true, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-2', title: 'Rent', amount: 2200, type: 'expense', category: 'Bills', date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), notes: '', recurring: true, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-3', title: 'Groceries', amount: 145, type: 'expense', category: 'Food', date: d(2), notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-4', title: 'Freelance project', amount: 1200, type: 'income', category: 'Freelance', date: d(5), notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-5', title: 'Restaurant', amount: 78, type: 'expense', category: 'Food', date: d(1), notes: 'Lunch with team', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-6', title: 'Spotify', amount: 10, type: 'expense', category: 'Entertainment', date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(), notes: '', recurring: true, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-7', title: 'Uber', amount: 32, type: 'expense', category: 'Transport', date: d(0), notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-8', title: 'Gym membership', amount: 55, type: 'expense', category: 'Health', date: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(), notes: '', recurring: true, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-9', title: 'Electricity bill', amount: 120, type: 'expense', category: 'Bills', date: new Date(now.getFullYear(), now.getMonth(), 8).toISOString(), notes: '', recurring: true, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-10', title: 'Amazon order', amount: 67, type: 'expense', category: 'Shopping', date: d(3), notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-11', title: 'Coffee shop', amount: 18, type: 'expense', category: 'Food', date: d(0), notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-12', title: 'Netflix', amount: 16, type: 'expense', category: 'Entertainment', date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(), notes: '', recurring: true, linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
];

const SEED_BUDGETS: Budget[] = [
  { id: 'b-1', category: 'Food', monthlyLimit: 400, createdAt: new Date().toISOString() },
  { id: 'b-2', category: 'Transport', monthlyLimit: 150, createdAt: new Date().toISOString() },
  { id: 'b-3', category: 'Entertainment', monthlyLimit: 100, createdAt: new Date().toISOString() },
  { id: 'b-4', category: 'Shopping', monthlyLimit: 200, createdAt: new Date().toISOString() },
  { id: 'b-5', category: 'Bills', monthlyLimit: 2500, createdAt: new Date().toISOString() },
];

interface BudgetContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  loading: boolean;

  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransaction: (id: string) => Transaction | undefined;

  // Budgets
  addBudget: (b: Omit<Budget, 'id' | 'createdAt'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetForCategory: (category: string) => Budget | undefined;

  // Analytics
  getMonthTransactions: (month: Date) => Transaction[];
  getMonthlyIncome: (month?: Date) => number;
  getMonthlyExpenses: (month?: Date) => number;
  getMonthlyBalance: (month?: Date) => number;
  getTransactionsByCategory: (month?: Date) => Record<string, number>;
  getRecentTransactions: (count?: number) => Transaction[];
  getBudgetsWithProgress: (month?: Date) => Array<{ budget: Budget; spent: number; pct: number; overBudget: boolean }>;
  getSpendingTrend: () => Array<{ month: string; income: number; expenses: number }>;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(BUDGETS_KEY),
    ]).then(([txRaw, bRaw]) => {
      try { setTransactions(txRaw ? JSON.parse(txRaw) : SEED_TRANSACTIONS); } catch { setTransactions(SEED_TRANSACTIONS); }
      try { setBudgets(bRaw ? JSON.parse(bRaw) : SEED_BUDGETS); } catch { setBudgets(SEED_BUDGETS); }
      setLoading(false);
    });
  }, []);

  // ─── Transactions ────────────────────────────────────────────────────────
  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const newTx: Transaction = { ...tx, id: genId(), createdAt: new Date().toISOString() };
    setTransactions(prev => {
      const u = [newTx, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return u;
    });
    return newTx;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const u = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return u;
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const u = prev.filter(t => t.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return u;
    });
  }, []);

  const getTransaction = useCallback((id: string) => transactions.find(t => t.id === id), [transactions]);

  // ─── Budgets ─────────────────────────────────────────────────────────────
  const addBudget = useCallback((b: Omit<Budget, 'id' | 'createdAt'>) => {
    const newB: Budget = { ...b, id: genId(), createdAt: new Date().toISOString() };
    setBudgets(prev => {
      const u = [...prev, newB];
      AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(u));
      return u;
    });
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setBudgets(prev => {
      const u = prev.map(b => b.id === id ? { ...b, ...updates } : b);
      AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(u));
      return u;
    });
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setBudgets(prev => {
      const u = prev.filter(b => b.id !== id);
      AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(u));
      return u;
    });
  }, []);

  const getBudgetForCategory = useCallback((category: string) =>
    budgets.find(b => b.category === category), [budgets]);

  // ─── Analytics ───────────────────────────────────────────────────────────
  const getMonthTransactions = useCallback((month: Date) => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
    });
  }, [transactions]);

  const getMonthlyIncome = useCallback((month?: Date) => {
    return getMonthTransactions(month || new Date())
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
  }, [getMonthTransactions]);

  const getMonthlyExpenses = useCallback((month?: Date) => {
    return getMonthTransactions(month || new Date())
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  }, [getMonthTransactions]);

  const getMonthlyBalance = useCallback((month?: Date) =>
    getMonthlyIncome(month) - getMonthlyExpenses(month),
    [getMonthlyIncome, getMonthlyExpenses]);

  const getTransactionsByCategory = useCallback((month?: Date) => {
    const result: Record<string, number> = {};
    getMonthTransactions(month || new Date())
      .filter(t => t.type === 'expense')
      .forEach(t => { result[t.category] = (result[t.category] || 0) + t.amount; });
    return result;
  }, [getMonthTransactions]);

  const getRecentTransactions = useCallback((count = 10) =>
    [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count),
    [transactions]);

  const getBudgetsWithProgress = useCallback((month?: Date) => {
    const byCategory = getTransactionsByCategory(month);
    return budgets.map(budget => {
      const spent = byCategory[budget.category] || 0;
      const pct = budget.monthlyLimit > 0 ? Math.min((spent / budget.monthlyLimit) * 100, 100) : 0;
      return { budget, spent, pct, overBudget: spent > budget.monthlyLimit };
    });
  }, [budgets, getTransactionsByCategory]);

  const getSpendingTrend = useCallback(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        month: m.toLocaleDateString([], { month: 'short' }),
        income: getMonthlyIncome(m),
        expenses: getMonthlyExpenses(m),
      });
    }
    return result;
  }, [getMonthlyIncome, getMonthlyExpenses]);

  return (
    <BudgetContext.Provider value={{
      transactions, budgets, loading,
      addTransaction, updateTransaction, deleteTransaction, getTransaction,
      addBudget, updateBudget, deleteBudget, getBudgetForCategory,
      getMonthTransactions, getMonthlyIncome, getMonthlyExpenses, getMonthlyBalance,
      getTransactionsByCategory, getRecentTransactions, getBudgetsWithProgress, getSpendingTrend,
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}
