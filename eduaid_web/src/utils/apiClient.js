// API client that works both in web and Electron environments
class ApiClient {
  constructor() {
    this.isElectron = typeof window !== "undefined" && window.electronAPI;
    this.baseUrl = this.isElectron
      ? window.electronAPI.getApiConfig().baseUrl
      : process.env.REACT_APP_BASE_URL || "http://localhost:5000";
  }

  async handleFetch(url, options) {
    const response = await fetch(url, options);
    let data;
    try {
      data = await response.json();
    } catch {
      if (response.status === 204) {
        return null; // No content, return null
      }
      throw new Error(
        `Invalid JSON response from server! status: ${response.status}`,
      );
    }

    if (!response.ok) {
      const message = data?.error || "HTTP error";
      throw new Error(`${message}! status: ${response.status}`);
    }

    return data;
  }

  async makeRequest(endpoint, options = {}) {
    if (this.isElectron) {
      // Use Electron's IPC for API requests
      try {
        const response = await window.electronAPI.makeApiRequest(
          endpoint,
          options,
        );
        if (response.ok) {
          return response.data;
        } else {
          throw new Error(`API request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error("Electron API request failed:", error);
        throw error;
      }
    } else {
      // Use regular fetch for web environment
      const url = `${this.baseUrl}${endpoint}`;
      return this.handleFetch(url, options);
    }
  }

  // Convenience methods for common HTTP verbs
  async get(endpoint, options = {}) {
    return this.makeRequest(endpoint, { ...options, method: "GET" });
  }

  async post(endpoint, data, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }

  async postFormData(endpoint, formData, options = {}) {
    // For Electron, we need to handle file uploads differently
    // Since we can't easily pass files through IPC, we'll fall back to fetch
    const url = `${this.baseUrl}${endpoint}`;
    return this.handleFetch(url, {
      ...options,
      method: "POST",
      body: formData,
    });
  }
}

// Export a singleton instance
export default new ApiClient();
