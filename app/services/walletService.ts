import axios from 'axios';

import { API_BASE_URL } from '../config/api';


export interface Wallet {
  id: number;
  name: string;
  imageUrl: string;
  balance?: number;
}

class WalletService {
  async getAllWallets(): Promise<Wallet[]> {
    try {
      const response = await axios.get<Wallet[]>(`${API_BASE_URL}/api/wallets`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  }

  async createWallet(wallet: Omit<Wallet, 'id'>): Promise<Wallet> {
    try {
      const response = await axios.post<Wallet>(`${API_BASE_URL}/api/wallets`, wallet);
      return response.data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  async updateWallet(id: number, wallet: Partial<Wallet>): Promise<Wallet> {
    try {
      const response = await axios.put<Wallet>(`${API_BASE_URL}/api/wallets/${id}`, wallet);
      return response.data;
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  }

  async deleteWallet(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/wallets/${id}`);
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  }

  async updateWalletBalance(id: number, amount: number): Promise<Wallet> {
    try {
      const response = await axios.put<Wallet>(`${API_BASE_URL}/api/wallets/${id}/balance`, { amount });
      return response.data;
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  }
}

export const walletService = new WalletService(); 