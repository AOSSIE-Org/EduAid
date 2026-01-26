// API client that works both in web and Electron environments
import { getMockResponse } from './mockApi';

const USE_MOCK = process.env.REACT_APP_USE_MOCK_API === 'true';

class ApiClient {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;
    this.baseUrl = this.isElectron 
      ? window.electronAPI.getApiConfig().baseUrl 
      : process.env.REACT_APP_BASE_URL || 'http://localhost:5000';
  }

  async makeRequest(endpoint, options = {}) {
      if (USE_MOCK) {
    console.warn(`[MOCK API] ${endpoint}`);
    return getMockResponse(endpoint);
  }

    if (this.isElectron) {
      // Use Electron's IPC for API requests
      try {
        const response = await window.electronAPI.makeApiRequest(endpoint, options);
        if (response.ok) {
          return response.data;
        } else {
          throw new Error(`API request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error('Electron API request failed:', error);
        throw error;
      }
    } else {
      // Use regular fetch for web environment
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    }
  }

  // Convenience methods for common HTTP verbs
  async get(endpoint, options = {}) {
    return this.makeRequest(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    });
  }

  async postFormData(endpoint, formData, options = {}) {
    if (this.isElectron) {
      // For Electron, we need to handle file uploads differently
      // Since we can't easily pass files through IPC, we'll fall back to fetch
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } else {
      // For web, use FormData directly
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    }
  }
}

// Export a singleton instance
export default new ApiClient();
