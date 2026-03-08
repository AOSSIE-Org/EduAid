// API client that works both in web and Electron environments
class ApiClient {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;
    this.baseUrl = this.isElectron 
      ? window.electronAPI.getApiConfig().baseUrl 
      : process.env.REACT_APP_BASE_URL || 'http://localhost:5000';
    this.defaultTimeout = 120000; // 2 minutes for ML model inference
  }

  async makeRequest(endpoint, options = {}) {
    const { timeout = this.defaultTimeout, ...fetchOptions } = options;

    if (this.isElectron) {
      // Use Electron's IPC for API requests
      try {
        const response = await window.electronAPI.makeApiRequest(endpoint, fetchOptions);
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
      // Use regular fetch for web environment with timeout
      const url = `${this.baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error('Invalid JSON response from server');
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. The server may be busy processing your request.');
        }
        throw error;
      }
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
    const { timeout = this.defaultTimeout, ...restOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...restOptions,
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('File upload timed out.');
      }
      throw error;
    }
  }
}

// Export a singleton instance
export default new ApiClient();
