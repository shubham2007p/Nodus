const path = require('path');
const fs = require('fs');
const http = require('http');
const { app, BrowserWindow, ipcMain, shell } = require('electron');

let mainWindow = null;

function checkDevServer(url, callback) {
  const req = http.get(url, (res) => {
    callback(res.statusCode === 200);
  });
  req.on('error', () => {
    callback(false);
  });
  req.setTimeout(400, () => {
    req.destroy();
    callback(false);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 840,
    minHeight: 560,
    frame: false, // Frameless window for custom Windows 11 titlebar
    transparent: false,
    backgroundColor: '#09090b',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const devUrl = 'http://localhost:5173';
  const distPath = path.join(__dirname, '../dist/index.html');

  // If local build exists, default directly to dist/index.html unless explicitly in dev mode with live server
  checkDevServer(devUrl, (isRunning) => {
    if (isRunning) {
      mainWindow.loadURL(devUrl);
    } else {
      mainWindow.loadFile(distPath);
    }
  });

  // Window state handlers
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-changed', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-changed', { isMaximized: false });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Window control IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize-toggle', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
