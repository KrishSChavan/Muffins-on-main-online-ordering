const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');


function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.join(__dirname, 'whop_admin_icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,     // ✅ keep this true
      nodeIntegration: false      // ✅ keep this false
    }
  });

  win.loadFile(path.join(__dirname, 'admin.html'));
}

ipcMain.on('print-receipt', (event, data) => {
  console.log("🖨️ RECEIPT PRINT SIGNAL RECEIVED");

  const printWin = new BrowserWindow({ show: false });
  printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(data.html)}`);

  printWin.webContents.on('did-finish-load', () => {
    printWin.webContents.print({ 
      silent: true, 
      printBackground: true,
      deviceName: 'RONGTA 80mm Series Printer'
    }, (success, failureReason) => {
      if (!success) console.error('Print failed:', failureReason);
      printWin.close();
    });
  });
});

app.whenReady().then(createWindow);
