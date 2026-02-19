const path = require("path");
const { app } = require("electron");

const config = {
  // Development configuration
  development: {
    webUrl: "http://localhost:3000",
    apiUrl: "http://localhost:5000",
    devTools: true,
    windowOptions: {
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
    },
  },

  // Production configuration
  production: {
    webPath: path.join(__dirname, "build", "index.html"),
    apiUrl: "http://localhost:5000",
    devTools: false,
    windowOptions: {
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
    },
  },

  // Common configuration
  common: {
    appName: "EduAid",
    appId: "com.aossie.eduaid",
    version: "1.0.0",
    author: "AOSSIE",
    description: "AI-powered educational question generator",

    // Window configuration
    window: {
      titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
      icon: path.join(__dirname, "assets/icons/win/aossie.ico"),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, "preload.js"),
      },
    },

    // Security settings
    security: {
      allowedOrigins: ["http://localhost:3000", "file://"],

      // CSP (Content Security Policy) for production
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "https:"],
        fontSrc: ["'self'", "data:"],
      },
    },

    // Menu configuration
    menu: {
      showDevTools: !app.isPackaged,
      enableReload: !app.isPackaged,
    },
  },
};

// Get current environment
const env = app.isPackaged ? "production" : "development";

// Export merged configuration
module.exports = {
  ...config.common,
  ...config[env],
  env,
  isDevelopment: env === "development",
  isProduction: env === "production",
};
