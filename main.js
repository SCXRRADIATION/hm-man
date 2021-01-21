"use strict";

const {app, BrowserWindow} = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.setMenu(null);

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', _ => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', _ => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});