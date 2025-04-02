const { contextBridge, ipcRenderer } = require('electron');

// 使用 `contextBridge` 将 API 暴露给渲染进程
contextBridge.exposeInMainWorld('electron', {
  openNote: (data) => ipcRenderer.send('open-note', data),
  onUpdateNoteContent: (callback) => ipcRenderer.on('update-note-content', callback),
  getDirname: () => path.resolve(__dirname), // 暴露 __dirname
});

console.log("Preload script loaded");