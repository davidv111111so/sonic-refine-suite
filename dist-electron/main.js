"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#0d0d0d', // Match app background
        titleBarStyle: 'hiddenInset', // Mac-style seamless titlebar
        webPreferences: {
            nodeIntegration: false, // Security: Keep true only if strictly needed (deprecated)
            contextIsolation: true, // Security: Use preload script
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
    });
    const startUrl = electron_is_dev_1.default
        ? 'http://localhost:5173'
        : `file://${path_1.default.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(startUrl);
    if (electron_is_dev_1.default) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    // Open external links in browser, not Electron
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// App Lifecycle
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// --- IPC Handlers (Backend Bridge) ---
// File Dialog (Example)
electron_1.ipcMain.handle('dialog:openFile', async () => {
    // const { dialog } = require('electron'); 
    // Implement native dialog here
    return { canceled: true, filePaths: [] };
});
// Audio Driver List (Placeholder for Audify)
electron_1.ipcMain.handle('audio:getDrivers', async () => {
    return ['Default Driver', 'ASIO Placeholder'];
});
