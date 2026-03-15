const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  sendChat: (query) => ipcRenderer.invoke('chat:send', query),
  clearChatHistory: () => ipcRenderer.invoke('chat:clearHistory'),
  clearChat: () => ipcRenderer.invoke('chat:clearHistory'),
  listFiles: () => ipcRenderer.invoke('files:list'),
  uploadFile: () => ipcRenderer.invoke('files:upload'),
  savePath: (srcPath) => ipcRenderer.invoke('files:save-path', srcPath),
  readFile: (filename) => ipcRenderer.invoke('files:read', filename),
  addFolders: () => ipcRenderer.invoke('folders:add'),
  addExcludes: () => ipcRenderer.invoke('folders:exclude'),
  rebuildIndex: (scanDirs, excludeDirs) => ipcRenderer.invoke('index:rebuild', scanDirs, excludeDirs),
  exportSession: (chatHtml) => ipcRenderer.invoke('session:export', chatHtml),
});
