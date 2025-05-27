import axios from 'axios';

import { API_BASE_URL } from '../config/api';


export interface Transaction {
  id?: number;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  walletId: number;
}

class TransactionService {
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const response = await axios.get<Transaction[]>(`${API_BASE_URL}/api/transactions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      const response = await axios.post<Transaction>(`${API_BASE_URL}/api/transactions`, transaction);
      return response.data;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction> {
    try {
      const response = await axios.put<Transaction>(`${API_BASE_URL}/api/transactions/${id}`, transaction);
      return response.data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/transactions/${id}`);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    try {
      const response = await axios.get<Transaction[]>(`${API_BASE_URL}/api/transactions/date-range`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions by date range:', error);
      throw error;
    }
  }

  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    try {
      const response = await axios.get<Transaction[]>(`${API_BASE_URL}/api/transactions/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions by category:', error);
      throw error;
    }
  }
}

export const transactionService = new TransactionService(); 