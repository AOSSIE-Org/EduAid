const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");

// 🔥 FIXED: Absolute path for config
const config = require(path.join(__dirname, "config.js"));

// Expose protected methods
contextBridge.exposeInMainWorld("electronAPI", {
  // Platform information
  platform: process.platform,

  // API Configuration
  getApiConfig: () => ({
    baseUrl: config.apiUrl,
    env: config.env,
  }),

  // Secure API Proxy
  makeApiRequest: async (endpoint, options) => {
    return ipcRenderer.invoke("api-request", {
      endpoint,
      options,
    });
  },

  // Menu events
  onMenuNewQuestionSet: (callback) => {
    ipcRenderer.on("menu-new-question-set", callback);
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // App information
  getAppVersion: () => {
    return process.env.npm_package_version || "1.0.0";
  },

  // File operations
  openFile: () => {
    return ipcRenderer.invoke("dialog:openFile");
  },

  saveFile: (data) => {
    return ipcRenderer.invoke("dialog:saveFile", data);
  },
});

// DOM Ready
window.addEventListener("DOMContentLoaded", () => {
  console.log("EduAid Desktop App loaded");

  document.body.classList.add("electron-app");

  document.addEventListener("keydown", (event) => {
    const isMod = event.ctrlKey || event.metaKey;
    if (!isMod) return;

    const key = event.key.toLowerCase();
    const blockShortcuts = {
      r: !event.shiftKey,
      w: true,
    };

    if (blockShortcuts[key]) {
      event.preventDefault();
    }
  });
});