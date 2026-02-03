import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#0d0d0d', // Match app background
        titleBarStyle: 'hiddenInset', // Mac-style seamless titlebar
        webPreferences: {
            nodeIntegration: false, // Security: Keep true only if strictly needed (deprecated)
            contextIsolation: true, // Security: Use preload script
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    mainWindow.loadURL(startUrl);

    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    // Open external links in browser, not Electron
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App Lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// --- IPC Handlers (Backend Bridge) ---

// File Dialog (Example)
ipcMain.handle('dialog:openFile', async () => {
    // const { dialog } = require('electron'); 
    // Implement native dialog here
    return { canceled: true, filePaths: [] };
});

// Audio Driver List (Audify)
ipcMain.handle('audio:getDrivers', async () => {
    try {
        // Dynamic import to handle potential native module issues gracefully
        const audify = require('audify');
        // Prefer WASAPI on Windows for low latency, or default
        const rtAudio = new audify.RtAudio(audify.APIs.WINDOWS_WASAPI);
        const devices = rtAudio.getDevices();
        return devices.map((d: any) => d.name);
    } catch (error) {
        console.error("Failed to load audio drivers:", error);
        return ['Error: Native Audio Drivers Unavailable (Check Console)'];
    }
});
