const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

let mainWindow;
const noteWindows = new Map(); // 存储便签窗口

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
});

// 监听 Vue 发送的 IPC 事件
ipcMain.on('open-note', (event, noteData) => {
  const noteId = `${noteData.id}-${Date.now()}`;

  if (noteWindows.has(noteId)) {
    const existingWindow = noteWindows.get(noteId);
    existingWindow.focus();
    existingWindow.webContents.send('update-note-content', noteData);
    return;
  }

  const noteWindow = new BrowserWindow({
    width: 400,
    height: 500,
    alwaysOnTop: true,  // 仅便签窗口置顶
    title: `便签 - ${noteData.title || '无标题'}`,
    backgroundColor: noteData.backgroundColor || '#fff',
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  noteWindow.loadFile(path.resolve(__dirname, 'note.html')).catch((err) => {
    console.error("Failed to load note.html:", err);
  });

  noteWindow.on('closed', () => {
    noteWindows.delete(noteId);
  });

  noteWindow.webContents.once('did-finish-load', () => {
    console.log("note.html 加载完成");
    noteWindow.webContents.send('update-note-content', noteData);
  });

  noteWindows.set(noteId, noteWindow);
});
