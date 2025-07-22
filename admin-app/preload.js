const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printReceipt: (html) => ipcRenderer.send('print-receipt', { html })
  // printReceipt: (orderData) => ipcRenderer.invoke('print-receipt', orderData)
});
