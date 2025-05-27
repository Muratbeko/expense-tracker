import axios from 'axios';

import { API_BASE_URL } from '../config/api';

export interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
}

class CategoryService {
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await axios.get<Category[]>(`${API_BASE_URL}/api/categories`);
      // Преобразуем данные в нужный формат
      return response.data.map(cat => ({
        id: cat.id,
        name: String(cat.name),
        type: cat.type,
        icon: String(cat.icon || '📝'),
        color: String(cat.color || '#F5F5F5')
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const response = await axios.post<Category>(`${API_BASE_URL}/api/categories`, category);
    return {
      id: response.data.id,
      name: String(response.data.name),
      type: response.data.type,
      icon: String(response.data.icon || '📝'),
      color: String(response.data.color || '#F5F5F5')
    };
  }

  async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
    const response = await axios.put<Category>(`${API_BASE_URL}/api/categories/${id}`, category);
    return {
      id: response.data.id,
      name: String(response.data.name),
      type: response.data.type,
      icon: String(response.data.icon || '📝'),
      color: String(response.data.color || '#F5F5F5')
    };
  }

  async deleteCategory(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/categories/${id}`);
  }
}

export const categoryService = new CategoryService(); 