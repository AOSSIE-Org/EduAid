const { contextBridge, ipcRenderer } = require('electron');
const config = require('./config'); 

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform information
  platform: process.platform,

  // API Configuration (NEW)
  getApiConfig: () => ({
    baseUrl: config.apiUrl,
    env: config.env
  }),

  // Secure API Proxy (NEW)
  makeApiRequest: async (endpoint, options) => {
    return ipcRenderer.invoke('api-request', {
      endpoint,
      options
    });
  },
  
  // Menu events
  onMenuNewQuestionSet: (callback) => {
    ipcRenderer.on('menu-new-question-set', callback);
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // App information
  getAppVersion: () => {
    return process.env.npm_package_version || '1.0.0';
  },
  
  // File operations (if needed in the future)
  openFile: () => {
    return ipcRenderer.invoke('dialog:openFile');
  },
  
  saveFile: (data) => {
    return ipcRenderer.invoke('dialog:saveFile', data);
  }
});

// DOM Content Loaded event
window.addEventListener('DOMContentLoaded', () => {
  // Add any initialization code here
  console.log('EduAid Desktop App loaded');
  
  // Add desktop-specific styling or behavior
  document.body.classList.add('electron-app');
  
  // Handle keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Prevent default browser shortcuts that don't make sense in desktop app
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'r':
        case 'R':
          if (!event.shiftKey) {
            event.preventDefault();
          }
          break;
        case 'w':
        case 'W':
          event.preventDefault();
          break;
      }
    }
  });
});
