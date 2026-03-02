// API client that works both in web and Electron environments
class ApiClient {
  constructor() {
    this.isElectron = typeof window !== "undefined" && window.electronAPI;
    this.baseUrl = this.isElectron
      ? window.electronAPI.getApiConfig().baseUrl
      : process.env.REACT_APP_BASE_URL || "http://localhost:5000";

    this.listeners = new Set();
    this.currentStatus = "unknown"; // unknown | up | down | error
    this.currentDetail = "";
  }

  subscribeConnectionStatus(listener) {
    this.listeners.add(listener);
    listener({ status: this.currentStatus, detail: this.currentDetail });
    return () => this.listeners.delete(listener);
  }

  notifyConnectionStatus(status, detail = "") {
    this.listeners.forEach((listener) => {
      try {
        listener({ status, detail });
      } catch (error) {
        console.error("Connection listener failed:", error);
      }
    });
  }

  setConnectionStatus(status, detail = "") {
    if (this.currentStatus === status && this.currentDetail === detail) return;
    this.currentStatus = status;
    this.currentDetail = detail;
    this.notifyConnectionStatus(status, detail);
  }

  getFallbackBaseUrls() {
    if (this.isElectron || process.env.REACT_APP_BASE_URL) return [];
    if (typeof window === "undefined") return [];

    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return [];

    if (this.baseUrl.includes(":5000")) return ["http://localhost:5001"];
    if (this.baseUrl.includes(":5001")) return ["http://localhost:5000"];
    return [];
  }

  async parseJsonResponse(response) {
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${text || "Request Failed"}`);
    }
    return response.json();
  }

  async fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    return this.parseJsonResponse(response);
  }

  async requestWithFallback(endpoint, options = {}) {
    const primaryUrl = `${this.baseUrl}${endpoint}`;

    try {
      const data = await this.fetchJson(primaryUrl, options);
      this.setConnectionStatus("up");
      return data;
    } catch (error) {
      const isNetworkError = error instanceof TypeError;
      if (!isNetworkError) {
        this.setConnectionStatus("error", error.message);
        throw error;
      }

      const fallbackBaseUrls = this.getFallbackBaseUrls().filter(
        (url) => url !== this.baseUrl
      );

      for (const fallbackBaseUrl of fallbackBaseUrls) {
        try {
          const data = await this.fetchJson(`${fallbackBaseUrl}${endpoint}`, options);
          this.baseUrl = fallbackBaseUrl;
          this.setConnectionStatus("up");
          return data;
        } catch (fallbackError) {
          if (!(fallbackError instanceof TypeError)) {
            this.setConnectionStatus("error", fallbackError.message);
            throw fallbackError;
          }
        }
      }

      this.setConnectionStatus(
        "down",
        `Cannot reach backend at ${this.baseUrl}. Check server and REACT_APP_BASE_URL.`
      );
      throw error;
    }
  }

  async makeRequest(endpoint, options = {}) {
    if (this.isElectron) {
      try {
        const response = await window.electronAPI.makeApiRequest(endpoint, options);
        if (!response.ok) {
          const err = new Error(`API request failed with status ${response.status}`);
          err.isHttpError = true;
          this.setConnectionStatus("error", err.message);
          throw err;
        }
        this.setConnectionStatus("up");
        return response.data;
      } catch (error) {
        if (error?.isHttpError) {
          throw error;
        }
        this.setConnectionStatus("down", error?.message || "API request failed");
        throw error;
      }
    }

    return this.requestWithFallback(endpoint, options);
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
    if (this.isElectron) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          method: "POST",
          body: formData,
        });
        const data = await this.parseJsonResponse(response);
        this.setConnectionStatus("up");
        return data;
      } catch (error) {
        const status = error instanceof TypeError ? "down" : "error";
        this.setConnectionStatus(status, error.message);
        throw error;
      }
    }

    return this.requestWithFallback(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    });
  }
}

const apiClient = new ApiClient();
export default apiClient;
