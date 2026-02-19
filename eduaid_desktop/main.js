const {
  app,
  BrowserWindow,
  Menu,
  shell,
  dialog,
  ipcMain,
} = require("electron");
const path = require("path");
const fs = require("fs");
const config = require("./config");
const https = require("https");
const http = require("http");

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window using configuration
  mainWindow = new BrowserWindow({
    ...config.windowOptions,
    icon: config.window.icon,
    webPreferences: config.window.webPreferences,
    show: false, // Don't show until ready
    titleBarStyle: config.window.titleBarStyle,
  });

  // Determine which URL to load based on environment
  if (!app.isPackaged) {
    // In development, load from the dev server
    mainWindow.loadURL(config.webUrl);
    // Open DevTools in development
    if (config.devTools) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(config.webPath);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    // Focus on the window
    if (config.isDevelopment) {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Check if the URL is in our allowed origins
    const isAllowed = config.security.allowedOrigins.some(
      (origin) =>
        parsedUrl.origin === origin || navigationUrl.startsWith(origin)
    );

    if (!isAllowed) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Question Set",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("menu-new-question-set");
            }
          },
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectall" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About EduAid",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About EduAid",
              message: "EduAid Desktop",
              detail:
                "An AI-powered educational question generator by AOSSIE.\n\nVersion: 1.0.0",
            });
          },
        },
        {
          label: "Learn More",
          click: () => {
            shell.openExternal("https://github.com/AOSSIE-Org/EduAid");
          },
        },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });

    // Window menu
    template[4].submenu = [
      { role: "close" },
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" },
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on("activate", () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors
app.on(
  "certificate-error",
  (event, webContents, url, error, certificate, callback) => {
    if (url.startsWith("http://localhost:")) {
      // Allow localhost in development
      event.preventDefault();
      callback(true);
    } else {
      callback(false);
    }
  }
);

// API request handler for the renderer process
ipcMain.handle("api-request", async (event, { endpoint, options }) => {
  return new Promise((resolve, reject) => {
    const apiUrl = new URL(endpoint, config.apiUrl);
    const requestOptions = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const protocol = apiUrl.protocol === "https:" ? https : http;

    const req = protocol.request(apiUrl, requestOptions, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: jsonData,
          });
        } catch (error) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
});
