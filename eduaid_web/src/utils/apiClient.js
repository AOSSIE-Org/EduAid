// API client that works both in web and Electron environments
class ApiClient {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;

    this.baseUrl = this.isElectron
      ? window.electronAPI.getApiConfig().baseUrl
      : process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

    // 🔥 New: Controller for request cancellation
    this.currentController = null;

    // 🔥 New: Default timeout (20 seconds)
    this.defaultTimeout = 20000;
  }

  async makeRequest(endpoint, options = {}) {
    // =============================
    // Electron Environment Handling
    // =============================
    if (this.isElectron) {
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
    }

    // =============================
    // Web (Fetch) Handling
    // =============================
    const url = `${this.baseUrl}${endpoint}`;

    // 🔥 Cancel previous request if still active
    if (this.currentController) {
      this.currentController.abort();
    }

    // 🔥 Create new AbortController
    this.currentController = new AbortController();

    const timeout = options.timeout || this.defaultTimeout;

    // 🔥 Setup timeout logic
    const timeoutId = setTimeout(() => {
      if (this.currentController) {
        this.currentController.abort();
      }
    }, timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: this.currentController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // 🔥 Handle Abort / Timeout cleanly
      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled or timed out');
      }

      throw error;
    } finally {
      // 🔥 Prevent memory leak
      this.currentController = null;
    }
  }

  // =============================
  // Convenience Methods
  // =============================

  async get(endpoint, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post(endpoint, data, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }

  async postFormData(endpoint, formData, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

// Export singleton instance
export default new ApiClient();