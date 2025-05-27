export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  userId: number;
}

// export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Budget {
  id: number;
  amount: number;
  category: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  userId: number;
}

export interface BudgetCategory {
  id: number;
  name: string;
  budget: number;
  spent: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// types/index.ts
export interface TransactionType {
  id: number;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
}

export interface SavingGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  userId: number;
}

export interface AccountBalance {
  balance: number;
  currency: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  userId: number;
}