export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  userId: string;
  walletId: string;
}

// export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Budget {
  id: number;
  month: string;
  year: number;
  total: number;
  spent: number;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  id: number;
  name: string;
  budget: number;
  spent: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
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
  id?: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  createdAt?: string;
}

export interface Budget {
  id: number;
  month: string;
  year: number;
  total: number;
  spent: number;
  categories: Array<{
    id: number;
    name: string;
    budget: number;
    spent: number;
  }>;
}

export interface AccountBalance {
  balance: number;
  income: number;
  expenses: number;
}