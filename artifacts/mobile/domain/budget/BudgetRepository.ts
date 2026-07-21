/**
 * Budget domain types and repository port.
 *
 * This module is runtime-neutral and contains no React, React Native, Expo,
 * AsyncStorage, or other platform imports.
 *
 * Debt: id fields currently use plain `string` because the existing
 * `BudgetContext` and consumers still use plain strings. Migrate to
 * `EntityId<...>` from `@workspace/domain-core` once the rest of the
 * bounded context is updated.
 */

/** A budget transaction is either income or expense. */
export type TransactionType = 'income' | 'expense';

/** A single budget transaction. */
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes: string;
  recurring: boolean;
  // Migration debt: linked*Ids will move to the Relationships bounded context.
  linkedTaskIds: string[];
  // Migration debt: linked*Ids will move to the Relationships bounded context.
  linkedPersonIds: string[];
  createdAt: string;
}

/** A spending limit for a single category. */
export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  createdAt: string;
}

/** Built-in expense categories. */
export const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Entertainment', 'Shopping',
  'Health', 'Bills', 'Travel', 'Education', 'Personal', 'Other',
];

/** Built-in income categories. */
export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Gift', 'Bonus', 'Other',
];

/** Color mapping for budget categories. */
export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F97316', Transport: '#3B82F6', Entertainment: '#8B5CF6',
  Shopping: '#EC4899', Health: '#10B981', Bills: '#EF4444',
  Travel: '#14B8A6', Education: '#6366F1', Personal: '#F59E0B', Other: '#6B7280',
  Salary: '#10B981', Freelance: '#14B8A6', Investment: '#3B82F6',
  Gift: '#EC4899', Bonus: '#F97316',
};

/**
 * Repository port for budget persistence.
 *
 * Adapters implement this interface to hide storage details from the context.
 */
export interface BudgetRepository {
  /** Load all budgets. */
  loadBudgets(): Promise<Budget[]>;

  /** Persist all budgets. */
  saveBudgets(budgets: Budget[]): Promise<void>;

  /** Load all transactions. */
  loadTransactions(): Promise<Transaction[]>;

  /** Persist all transactions. */
  saveTransactions(transactions: Transaction[]): Promise<void>;
}
