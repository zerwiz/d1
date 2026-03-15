const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  sendChat: (query, pinnedFileNames) => ipcRenderer.invoke('chat:send', query, pinnedFileNames),
  clearChatHistory: () => ipcRenderer.invoke('chat:clearHistory'),
  clearChat: () => ipcRenderer.invoke('chat:clearHistory'),
  listFiles: () => ipcRenderer.invoke('files:list'),
  uploadFile: () => ipcRenderer.invoke('files:upload'),
  savePath: (srcPath) => ipcRenderer.invoke('files:save-path', srcPath),
  readFile: (filename) => ipcRenderer.invoke('files:read', filename),
  addFolders: () => ipcRenderer.invoke('folders:add'),
  addExcludes: () => ipcRenderer.invoke('folders:exclude'),
  rebuildIndex: (scanDirs, excludeDirs) => ipcRenderer.invoke('index:rebuild', scanDirs, excludeDirs),
  writeWatcherDirs: (scanDirs) => ipcRenderer.invoke('watcher:writeDirs', scanDirs),
  writeWatcherDirsIfMissing: (scanDirs) => ipcRenderer.invoke('watcher:writeDirsIfMissing', scanDirs),
  readFileByPath: (fullPath) => ipcRenderer.invoke('files:readByPath', fullPath),
  exportSession: (chatHtml) => ipcRenderer.invoke('session:export', chatHtml),
  checkLLM: () => ipcRenderer.invoke('llm:check'),
});
