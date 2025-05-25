import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import type { ApiResponse, Budget, Transaction, TransactionType, User } from '../types';

const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080/api' 
  : 'http://192.168.0.109:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface SavingGoal {
  id?: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  createdAt?: string;
}

export interface AccountBalance {
  balance: number;
  income: number;
  expenses: number;
}

const apiService = {
  // Auth endpoints
  login: async (email: string, password: string): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/auth/login', { email, password });
    return response.data.data;
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/auth/register', { name, email, password });
    return response.data.data;
  },

  getProfile: async (email: string): Promise<User> => {
    const headers = await getAuthHeader();
    const response = await api.get<ApiResponse<User>>(`/users/me?email=${email}`, { headers });
    return response.data.data;
  },

  // Account balance
  getAccountBalance: async (): Promise<AccountBalance> => {
    const headers = await getAuthHeader();
    const response = await api.get<ApiResponse<AccountBalance>>('/accounts/balance', { headers });
    return response.data.data;
  },

  // Budget endpoints
  getCurrentBudget: async (): Promise<Budget> => {
    const headers = await getAuthHeader();
    const response = await api.get<ApiResponse<Budget>>('/budgets/current', { headers });
    return response.data.data;
  },

  updateBudget: async (id: number, budget: Partial<Budget>): Promise<Budget> => {
    const headers = await getAuthHeader();
    const response = await api.put<ApiResponse<Budget>>(`/api/budgets/${id}`, budget, { headers });
    return response.data.data;
  },

  getBudgetHistory: async (): Promise<Budget[]> => {
    const headers = await getAuthHeader();
    const response = await api.get<ApiResponse<Budget[]>>('/budgets/history', { headers });
    return response.data.data;
  },

  // Saving Goals
  getSavingGoals: async (): Promise<SavingGoal[]> => {
    const headers = await getAuthHeader();
    const response = await api.get<ApiResponse<SavingGoal[]>>('/goals', { headers });
    return response.data.data;
  },

  createSavingGoal: async (goal: Partial<SavingGoal>): Promise<SavingGoal> => {
    const headers = await getAuthHeader();
    const response = await api.post<ApiResponse<SavingGoal>>('/goals', goal, { headers });
    return response.data.data;
  },

  updateSavingGoal: async (goalId: number, currentAmount: number): Promise<SavingGoal> => {
    const headers = await getAuthHeader();
    const response = await api.put<ApiResponse<SavingGoal>>(`/goals/${goalId}`, { currentAmount }, { headers });
    return response.data.data;
  },

  // Transaction endpoints
  getTransactions: async (): Promise<Transaction[]> => {
    const headers = await getAuthHeader();
    const response = await api.get<ApiResponse<Transaction[]>>('/transactions', { headers });
    return response.data.data;
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    const headers = await getAuthHeader();
    const response = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`, { headers });
    return response.data.data;
  },

  createTransaction: async (transaction: Omit<TransactionType, 'id'>): Promise<Transaction> => {
    const headers = await getAuthHeader();
    const response = await api.post<ApiResponse<Transaction>>('/transactions', transaction, { headers });
    return response.data.data;
  },

  updateTransaction: async (id: string, transaction: TransactionType): Promise<Transaction> => {
    const headers = await getAuthHeader();
    const response = await api.put<ApiResponse<Transaction>>(`/transactions/${id}`, transaction, { headers });
    return response.data.data;
  },

  deleteTransaction: async (id: string): Promise<void> => {
    const headers = await getAuthHeader();
    await api.delete<ApiResponse<void>>(`/transactions/${id}`, { headers });
  },

  // Category endpoints
  getCategories: async (): Promise<Category[]> => {
    const headers = await getAuthHeader();
    const response = await api.get<ApiResponse<Category[]>>('/categories', { headers });
    return response.data.data;
  },
};

export default apiService;
  