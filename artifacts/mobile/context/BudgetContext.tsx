import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lifeos/budget';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes: string;
  linkedTaskIds: string[];
  linkedPersonIds: string[];
  createdAt: string;
}

const genId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Bills', 'Travel', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
export { EXPENSE_CATEGORIES, INCOME_CATEGORIES };

const now = new Date();
const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', title: 'Monthly Salary', amount: 8500, type: 'income', category: 'Salary', date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), notes: '', linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-2', title: 'Rent', amount: 2200, type: 'expense', category: 'Bills', date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), notes: '', linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-3', title: 'Groceries', amount: 145, type: 'expense', category: 'Food', date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString(), notes: '', linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-4', title: 'Freelance project', amount: 1200, type: 'income', category: 'Freelance', date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString(), notes: '', linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-5', title: 'Restaurant', amount: 78, type: 'expense', category: 'Food', date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString(), notes: 'Lunch with team', linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-6', title: 'Spotify', amount: 10, type: 'expense', category: 'Entertainment', date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(), notes: '', linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
  { id: 'tx-7', title: 'Uber', amount: 32, type: 'expense', category: 'Transport', date: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(), notes: '', linkedTaskIds: [], linkedPersonIds: [], createdAt: new Date().toISOString() },
];

interface BudgetContextValue {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransaction: (id: string) => Transaction | undefined;
  getMonthlyIncome: (month?: Date) => number;
  getMonthlyExpenses: (month?: Date) => number;
  getMonthlyBalance: (month?: Date) => number;
  getTransactionsByCategory: (month?: Date) => Record<string, number>;
  getRecentTransactions: (count?: number) => Transaction[];
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setTransactions(JSON.parse(raw)); } catch { setTransactions(SEED_TRANSACTIONS); }
      } else {
        setTransactions(SEED_TRANSACTIONS);
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback((u: Transaction[]) => { setTransactions(u); AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)); }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const newTx: Transaction = { ...tx, id: genId(), createdAt: new Date().toISOString() };
    setTransactions(prev => { const u = [newTx, ...prev]; AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)); return u; });
    return newTx;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => { const u = prev.map(t => t.id === id ? { ...t, ...updates } : t); AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)); return u; });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => { const u = prev.filter(t => t.id !== id); AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)); return u; });
  }, []);

  const getTransaction = useCallback((id: string) => transactions.find(t => t.id === id), [transactions]);

  const getMonthTxs = (month?: Date) => {
    const m = month || new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
    });
  };

  const getMonthlyIncome = useCallback((month?: Date) => getMonthTxs(month).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const getMonthlyExpenses = useCallback((month?: Date) => getMonthTxs(month).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions]);
  const getMonthlyBalance = useCallback((month?: Date) => getMonthlyIncome(month) - getMonthlyExpenses(month), [getMonthlyIncome, getMonthlyExpenses]);

  const getTransactionsByCategory = useCallback((month?: Date) => {
    const result: Record<string, number> = {};
    getMonthTxs(month).filter(t => t.type === 'expense').forEach(t => {
      result[t.category] = (result[t.category] || 0) + t.amount;
    });
    return result;
  }, [transactions]);

  const getRecentTransactions = useCallback((count = 10) =>
    [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, count),
    [transactions]);

  return (
    <BudgetContext.Provider value={{ transactions, loading, addTransaction, updateTransaction, deleteTransaction, getTransaction, getMonthlyIncome, getMonthlyExpenses, getMonthlyBalance, getTransactionsByCategory, getRecentTransactions }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}
