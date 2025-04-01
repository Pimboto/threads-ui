// lib/services/accounts-service.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3090/api';

export interface Category {
  id?: string;
  name: string;
  description: string;
  accounts?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Account {
  id?: string;
  username: string;
  proxy?: string;
  status?: string;
  category?: string;
}



export const accountsService = {
  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    try {
      const response = await axios.post(`${API_BASE_URL}/categories`, category);
      return response.data.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/categories/${id}`, category);
      return response.data.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/categories/${id}`);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Accounts
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  async addAccountsToCategory(categoryId: string, usernames: string[]): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/accounts/category/${categoryId}`, { usernames });
    } catch (error) {
      console.error('Error adding accounts to category:', error);
      throw error;
    }
  },

  // You might want to add more methods like createAccount, updateAccount, deleteAccount
  // depending on your backend API capabilities
};
