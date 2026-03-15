const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const RAG_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'rag.sh');
const HISTORY_FILE = path.join(PROJECT_ROOT, 'data', 'chat_history.json');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('chat:send', async (_event, query) => {
  return new Promise((resolve) => {
    const child = spawn('bash', [RAG_SCRIPT, 'chat', query], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, D1_PROJECT_ROOT: PROJECT_ROOT },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => {
      const raw = stdout.trim() || stderr.trim() || (code !== 0 ? stderr.trim() || `Exit code ${code}` : '(no output)');
      const paths = [];
      let response = raw;
      if (raw.includes('D1_PATHS_START') && raw.includes('D1_PATHS_END')) {
        const endMarker = 'D1_PATHS_END';
        const idx = raw.indexOf(endMarker);
        const after = raw.slice(idx + endMarker.length).trim();
        const before = raw.slice(0, idx);
        const pathBlock = before.replace('D1_PATHS_START', '').trim();
        const seen = new Set();
        pathBlock.split('\n').forEach((line) => {
          const s = line.trim();
          if (!s) return;
          try {
            const obj = JSON.parse(s);
            if (obj && typeof obj.path === 'string' && !seen.has(obj.path)) {
              seen.add(obj.path);
              paths.push(obj.path);
            }
          } catch (_) {
            if (!seen.has(s)) { seen.add(s); paths.push(s); }
          }
        });
        response = after || '(no output)';
      }
      resolve({ response, paths });
    });
    child.on('error', (err) => {
      resolve({ response: `Error: ${err.message}`, paths: [] });
    });
  });
});

ipcMain.handle('chat:clearHistory', async () => {
  try {
    fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
    fs.writeFileSync(HISTORY_FILE, '[]', 'utf-8');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('session:export', async (_event, currentChatHtml) => {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `plan-session-${timestamp}.md`;
    const filePath = path.join(DATA_DIR, fileName);

    let markdown = `# Project Planning Session — ${new Date().toLocaleString()}\n\n`;
    markdown += (currentChatHtml || '')
      .replace(/<b>You:<\/b>/gi, '\n### User\n')
      .replace(/<b>AI:<\/b>/gi, '\n### Assistant\n')
      .replace(/<b>System:<\/b>/gi, '\n> **System:** ')
      .replace(/<b>Document: ([^<]+)<\/b>/gi, '\n### Document: $1\n')
      .replace(/<b>Error[^<]*:<\/b>/gi, '\n> **Error:** ')
      .replace(/<b>Index:<\/b>/gi, '\n> **Index:** ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<pre[^>]*>/gi, '\n```\n')
      .replace(/<\/pre>/gi, '\n```\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    fs.writeFileSync(filePath, markdown, 'utf-8');
    return { ok: true, fileName };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('files:list', async () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    return [];
  }
  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
  return entries.map((e) => ({
    name: e.name,
    isDirectory: e.isDirectory(),
  })).sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
});

ipcMain.handle('files:upload', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Markdown', extensions: ['md'] }, { name: 'All', extensions: ['*'] }],
  });
  if (result.canceled || !result.filePaths.length) return { ok: false };
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  try {
    for (const filePath of result.filePaths) {
      const name = path.basename(filePath);
      fs.copyFileSync(filePath, path.join(DATA_DIR, name));
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('files:save-path', async (_event, srcPath) => {
  if (!srcPath || typeof srcPath !== 'string') return { ok: false, error: 'Invalid path' };
  const name = path.basename(srcPath);
  if (!name) return { ok: false, error: 'Invalid filename' };
  try {
    if (!fs.existsSync(srcPath) || !fs.statSync(srcPath).isFile()) {
      return { ok: false, error: 'Not a file' };
    }
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const dest = path.join(DATA_DIR, name);
    fs.copyFileSync(srcPath, dest);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('folders:add', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'multiSelections'],
    title: 'Add folders to index',
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths;
});

ipcMain.handle('folders:exclude', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'multiSelections'],
    title: 'Select folders to exclude from index',
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths;
});

ipcMain.handle('index:rebuild', async (_event, scanDirs, excludeDirs) => {
  return new Promise((resolve) => {
    const scanDirsToUse = scanDirs && scanDirs.length > 0 ? scanDirs : [DATA_DIR];
    const env = {
      ...process.env,
      D1_PROJECT_ROOT: PROJECT_ROOT,
      RAG_INDEX_DIR: path.join(PROJECT_ROOT, 'systems', 'rag', 'tantivy_index'),
      RAG_DATA_DIR: DATA_DIR,
      RAG_SCAN_DIRS: scanDirsToUse.join(','),
      RAG_EXCLUDE_DIRS: (excludeDirs && excludeDirs.length > 0 ? excludeDirs : []).join(','),
    };
    const child = spawn('bash', [RAG_SCRIPT, 'build'], { cwd: PROJECT_ROOT, env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => {
      if (code !== 0) {
        resolve(`Error: ${stderr.trim() || stdout.trim() || `Exit code ${code}`}`);
      } else {
        resolve('Index rebuilt successfully.');
      }
    });
    child.on('error', (err) => resolve(`Error: ${err.message}`));
  });
});

ipcMain.handle('files:read', async (_event, filename) => {
  if (!filename || typeof filename !== 'string') return { ok: false, error: 'Invalid filename' };
  const name = path.basename(filename);
  if (name !== filename || name.includes('..')) return { ok: false, error: 'Invalid filename' };
  const filePath = path.join(DATA_DIR, name);
  const resolved = path.resolve(filePath);
  const dataDirResolved = path.resolve(DATA_DIR);
  if (!resolved.startsWith(dataDirResolved) || resolved === dataDirResolved) {
    return { ok: false, error: 'Access denied' };
  }
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return { ok: false, error: 'Not a file' };
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
