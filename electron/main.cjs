const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const { fork, spawn } = require("child_process");
const http = require("http");

let mainWindow = null;
let serverProcess = null;
const SERVER_PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

// Prevent multiple instances of the app
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Function to check if local server is online
function checkServerReady(url, maxRetries = 40, intervalMs = 300) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const timer = setInterval(() => {
      retries++;
      const req = http.get(`${url}/api/health`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(timer);
          resolve(true);
        }
      });

      req.on("error", () => {
        if (retries >= maxRetries) {
          clearInterval(timer);
          resolve(false); // resolve anyway to attempt loading
        }
      });
      req.setTimeout(500, () => req.destroy());
    }, intervalMs);
  });
}

// Start backend Express server process
function startBackendServer() {
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
  const projectRoot = path.resolve(__dirname, "..");
  const serverScript = isDev
    ? path.join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs")
    : path.join(projectRoot, "dist", "server.cjs");

  const serverArgs = isDev ? [path.join(projectRoot, "server.ts")] : [];

  console.log("Starting backend server with:", serverScript, serverArgs);

  if (isDev) {
    serverProcess = fork(serverScript, serverArgs, {
      cwd: projectRoot,
      env: { ...process.env, PORT: String(SERVER_PORT), AUTO_OPEN: "false" },
      stdio: "inherit"
    });
  } else {
    serverProcess = fork(serverScript, [], {
      cwd: projectRoot,
      env: { ...process.env, PORT: String(SERVER_PORT), NODE_ENV: "production", AUTO_OPEN: "false" },
      stdio: "inherit"
    });
  }

  serverProcess.on("error", (err) => {
    console.error("Backend server failed to start:", err);
  });
}

// Create Electron Window
async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    title: "企業內部出勤與工時打卡系統",
    backgroundColor: "#020617",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    show: false, // show after ready-to-show to prevent white flash
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false
    }
  });

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Wait for the backend server to respond
  await checkServerReady(SERVER_URL);

  // Load the application
  mainWindow.loadURL(SERVER_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  startBackendServer();
  await createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Cleanly kill server process on quit
function cleanupServer() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {
      console.warn("Error killing server process:", e);
    }
    serverProcess = null;
  }
}

app.on("before-quit", cleanupServer);
app.on("window-all-closed", () => {
  cleanupServer();
  if (process.platform !== "darwin") {
    app.quit();
  } else {
    app.quit();
  }
});
