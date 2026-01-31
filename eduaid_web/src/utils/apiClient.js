// API client that works both in web and Electron environments
class ApiClient {
  constructor() {
    this.isElectron = typeof window !== "undefined" && window.electronAPI;
    this.baseUrl = this.isElectron
      ? window.electronAPI.getApiConfig().baseUrl
      : process.env.REACT_APP_BASE_URL || "http://localhost:5000";
  }

  async makeRequest(endpoint, options = {}) {
    if (this.isElectron && window.electronAPI?.makeApiRequest) {
      try {
        const response = await window.electronAPI.makeApiRequest(
          endpoint,
          options
        );

        if (response.ok) {
          return response.data;
        }

        throw new Error(`API request failed with status ${response.status}`);
      } catch (error) {
        console.error("Electron API request failed:", error);
        throw error;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

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
    // Electron path (keeps behaviour consistent with other methods)
    if (this.isElectron && window.electronAPI?.makeApiRequest) {
      try {
        const response = await window.electronAPI.makeApiRequest(endpoint, {
          ...options,
          method: "POST",
          body: formData,
          isFormData: true,
        });

        if (response.ok) {
          return response.data;
        }

        throw new Error(`API request failed with status ${response.status}`);
      } catch (error) {
        console.error("Electron API request failed:", error);
        throw error;
      }
    }

    // Web fallback
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

const apiClient = new ApiClient();
export default apiClient;
