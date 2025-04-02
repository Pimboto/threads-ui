//lib\services\accounts-service.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3090/api';

export interface Category {
  id?: string;
  name: string;
  description?: string;
  accounts?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AccountCategory {
  id: string;
  name: string;
}

export interface Account {
  id?: string;
  username: string;
  proxy?: string;
  status?: string;
  categories?: AccountCategory[]; // Ahora es un array de objetos con id y name
  category?: string; // Mantener para compatibilidad con código existente
  createdAt?: string;
  lastActive?: string;
}

export interface BulkPostPayload {
  usernames?: string[];
  categoryId: string;
  texts: string[];
  scheduledTimes: string[];
  randomDelayMinutes?: number;
}

export const accountsService = {

  async createBulkPost(payload: BulkPostPayload): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/posts/bulk`, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating bulk post:', error);
      throw error;
    }
  },

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

  async getCategoriesWithAccounts(): Promise<Category[]> {
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
      // Normalizar las cuentas para mantener compatibilidad con la interfaz existente
      const accounts = response.data.data.map((account: any) => {
        // Transformar los datos para que sean compatibles con la interfaz Account
        const normalizedAccount: Account = {
          ...account,
          // Añadir un campo category para compatibilidad con el código existente
          category: account.categories && account.categories.length > 0 
            ? account.categories[0].name 
            : undefined,
          // Conservar el campo categories original con id y name
          categories: account.categories || []
        };
        return normalizedAccount;
      });
      
      return accounts;
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

  async deleteAccount(username: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/accounts/${username}`);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
}
