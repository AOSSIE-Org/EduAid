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

  createHttpError(status, responseBody = "") {
    const error = new Error(`HTTP ${status}`);
    error.isHttpError = true;
    error.status = status;
    error.responseBody = responseBody;
    return error;
  }

  getConnectionFailureDetail(baseUrl = this.baseUrl) {
    return `Cannot reach backend at ${baseUrl}. Check server and API URL.`;
  }

  getBackendErrorDetail(status) {
    if (status) {
      return `Backend is reachable but returned HTTP ${status}.`;
    }
    return "Backend is reachable but returned an unexpected response.";
  }

  subscribeConnectionStatus(listener) {
    this.listeners.add(listener);
    try {
      listener({ status: this.currentStatus, detail: this.currentDetail });
    } catch (error) {
      console.error("Connection listener failed:", error);
    }
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

    if (this.baseUrl.includes(":5000")) return [`http://${host}:5001`];
    if (this.baseUrl.includes(":5001")) return [`http://${host}:5000`];
    return [];
  }

  async parseJsonResponse(response) {
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw this.createHttpError(response.status, text);
    }

    if (response.status === 204 || response.status === 205) return null;

    const contentLength = response.headers.get("Content-Length");
    const contentType = response.headers.get("Content-Type");
    if (contentLength === "0" || !contentType) return null;
    return await response.json();
  }

  async fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    return this.parseJsonResponse(response);
  }

  getCandidateBaseUrls() {
    return [this.baseUrl, ...this.getFallbackBaseUrls().filter((url) => url !== this.baseUrl)];
  }

  async probeConnection(baseUrl) {
    if (this.isElectron) {
      const response = await window.electronAPI.makeApiRequest("/", { method: "GET" });
      if (!response.ok) {
        throw this.createHttpError(response.status);
      }
      return true;
    }

    const response = await fetch(`${baseUrl}/`, { method: "GET" });
    if (!response.ok) {
      throw this.createHttpError(response.status);
    }
    return true;
  }

  async retryConnection() {
    const candidateBaseUrls = this.getCandidateBaseUrls();
    let lastError = null;

    for (const baseUrl of candidateBaseUrls) {
      try {
        await this.probeConnection(baseUrl);
        this.baseUrl = baseUrl;
        this.setConnectionStatus("up");
        return true;
      } catch (error) {
        lastError = error;
        if (error?.isHttpError) {
          this.baseUrl = baseUrl;
          this.setConnectionStatus("error", this.getBackendErrorDetail(error.status));
          return false;
        }
      }
    }

    this.setConnectionStatus("down", this.getConnectionFailureDetail());
    if (lastError) {
      throw lastError;
    }
    throw new TypeError(this.getConnectionFailureDetail());
  }

  async requestWithFallback(endpoint, options = {}) {
    const candidateBaseUrls = this.getCandidateBaseUrls();
    let lastError = null;

    for (const baseUrl of candidateBaseUrls) {
      try {
        const data = await this.fetchJson(`${baseUrl}${endpoint}`, options);
        this.baseUrl = baseUrl;
        this.setConnectionStatus("up");
        return data;
      } catch (error) {
        lastError = error;
        if (error?.isHttpError) {
          this.baseUrl = baseUrl;
          this.setConnectionStatus("up");
          throw error;
        }
      }
    }

    this.setConnectionStatus("down", this.getConnectionFailureDetail());
    if (lastError) {
      throw lastError;
    }
    throw new TypeError(this.getConnectionFailureDetail());
  }

  async makeRequest(endpoint, options = {}) {
    if (this.isElectron) {
      try {
        const response = await window.electronAPI.makeApiRequest(endpoint, options);
        if (!response.ok) {
          const responseBody =
            typeof response.data === "string"
              ? response.data
              : JSON.stringify(response.data ?? "");
          const err = this.createHttpError(response.status, responseBody);
          this.setConnectionStatus("up");
          throw err;
        }
        this.setConnectionStatus("up");
        return response.data;
      } catch (error) {
        if (error?.isHttpError) {
          throw error;
        }
        this.setConnectionStatus("down", error?.message || this.getConnectionFailureDetail());
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
        if (error?.isHttpError) {
          this.setConnectionStatus("up");
          throw error;
        }
        this.setConnectionStatus("down", error?.message || this.getConnectionFailureDetail());
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
