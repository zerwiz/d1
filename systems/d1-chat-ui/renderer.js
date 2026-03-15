const chatDiv = document.getElementById('chat');
const queryInput = document.getElementById('query');
const sendBtn = document.getElementById('send');
const fileList = document.getElementById('file-list');
const uploadBtn = document.getElementById('upload-btn');
const clearBtn = document.getElementById('clear-btn');
const sidebar = document.getElementById('sidebar');
const fileSearch = document.getElementById('file-search');
const folderList = document.getElementById('folder-list');
const addFolderBtn = document.getElementById('add-folder-btn');
const excludeList = document.getElementById('exclude-list');
const addExcludeBtn = document.getElementById('add-exclude-btn');
const rebuildBtn = document.getElementById('rebuild-btn');
const contextViewer = document.getElementById('context-viewer');
const contextContent = document.getElementById('context-content');
const tokenBar = document.getElementById('token-bar');
const tokenStats = document.getElementById('token-stats');
const exportBtn = document.getElementById('export-btn');
const llmBanner = document.getElementById('llm-offline-banner');
const pinnedList = document.getElementById('pinned-list');

const CONTEXT_WINDOW_SIZE = 8192;

let externalFolders = JSON.parse(localStorage.getItem('d1-folders') || '[]');
let excludedFolders = JSON.parse(localStorage.getItem('d1-excludes') || '[]');
let pinnedFiles = JSON.parse(localStorage.getItem('d1-pinned') || '[]');

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderFolders() {
  folderList.innerHTML = '';
  externalFolders.forEach((folder) => {
    const li = document.createElement('li');
    li.textContent = `\u{1F4C1} ${folder.split(/[/\\]/).pop() || folder}`;
    li.title = folder;
    folderList.appendChild(li);
  });
  localStorage.setItem('d1-folders', JSON.stringify(externalFolders));
}

function renderExcludes() {
  excludeList.innerHTML = '';
  excludedFolders.forEach((folder) => {
    const li = document.createElement('li');
    li.textContent = `\u{1F6AB} ${folder.split(/[/\\]/).pop() || folder}`;
    li.title = folder;
    excludeList.appendChild(li);
  });
  localStorage.setItem('d1-excludes', JSON.stringify(excludedFolders));
}

function renderPinned() {
  pinnedList.innerHTML = '';
  pinnedFiles.forEach((name) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    const displayName = name.includes('/') || name.includes('\\') ? name.split(/[/\\]/).pop() : name;
    span.textContent = displayName;
    span.title = name;
    span.style.overflow = 'hidden';
    span.style.textOverflow = 'ellipsis';
    span.style.whiteSpace = 'nowrap';
    li.appendChild(span);
    const btn = document.createElement('button');
    btn.className = 'unpin-btn';
    btn.textContent = 'Unpin';
    btn.addEventListener('click', () => {
      pinnedFiles = pinnedFiles.filter((n) => n !== name);
      localStorage.setItem('d1-pinned', JSON.stringify(pinnedFiles));
      renderPinned();
      loadFiles();
    });
    li.appendChild(btn);
    pinnedList.appendChild(li);
  });
  localStorage.setItem('d1-pinned', JSON.stringify(pinnedFiles));
}

async function loadFiles() {
  const entries = await window.api.listFiles();
  fileList.innerHTML = '';
  fileSearch.value = '';
  if (entries.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No files yet. Upload .md files.';
    fileList.appendChild(li);
    return;
  }
  entries.forEach((entry) => {
    const li = document.createElement('li');
    li.className = entry.isDirectory ? 'folder' : 'file';
    if (entry.isDirectory) {
      li.textContent = `📁 ${entry.name}`;
    } else {
      const nameSpan = document.createElement('span');
      nameSpan.className = 'file-name';
      nameSpan.textContent = entry.name;
      li.appendChild(nameSpan);
      const pinBtn = document.createElement('button');
      pinBtn.className = 'pin-btn' + (pinnedFiles.includes(entry.name) ? ' pinned' : '');
      pinBtn.textContent = pinnedFiles.includes(entry.name) ? 'Pinned' : 'Pin';
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pinnedFiles.includes(entry.name)) {
          pinnedFiles = pinnedFiles.filter((n) => n !== entry.name);
        } else {
          pinnedFiles = [...pinnedFiles, entry.name];
        }
        localStorage.setItem('d1-pinned', JSON.stringify(pinnedFiles));
        renderPinned();
        loadFiles();
      });
      li.appendChild(pinBtn);
      const viewBtn = document.createElement('button');
      viewBtn.className = 'view-btn';
      viewBtn.textContent = 'View';
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        viewFile(entry.name);
      });
      li.appendChild(viewBtn);
    }
    fileList.appendChild(li);
  });
}

async function viewFile(filename) {
  const result = await window.api.readFile(filename);
  if (result && result.ok) {
    const isMd = filename.toLowerCase().endsWith('.md');
    const html = isMd && typeof window.marked !== 'undefined' && window.marked.parse
      ? window.marked.parse(result.content)
      : escapeHtml(result.content);
    const block = isMd && typeof window.marked !== 'undefined' && window.marked.parse
      ? `<div class="doc-preview markdown-body">${html}</div>`
      : `<pre class="doc-preview">${html}</pre>`;
    chatDiv.innerHTML += `<b>Document: ${escapeHtml(filename)}</b>${block}\n\n`;
    chatDiv.scrollTop = chatDiv.scrollHeight;
  } else if (result && result.error) {
    chatDiv.innerHTML += `<b>Error (view):</b> ${escapeHtml(result.error)}\n\n`;
  }
}

fileSearch.addEventListener('input', () => {
  const searchTerm = fileSearch.value.toLowerCase().trim();
  const items = fileList.querySelectorAll('li');
  items.forEach((item) => {
    if (item.classList.contains('empty')) return;
    const nameEl = item.querySelector('.file-name');
    const text = (nameEl ? nameEl.textContent : item.textContent).toLowerCase();
    item.style.display = text.includes(searchTerm) ? '' : 'none';
  });
});

addFolderBtn.addEventListener('click', async () => {
  const newFolders = await window.api.addFolders();
  if (newFolders && newFolders.length > 0) {
    externalFolders = [...new Set([...externalFolders, ...newFolders])];
    renderFolders();
    await window.api.writeWatcherDirs(externalFolders);
    const status = await window.api.rebuildIndex(externalFolders, excludedFolders);
    chatDiv.innerHTML += `<b>Index:</b> ${escapeHtml(status)}\n\n`;
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }
});

addExcludeBtn.addEventListener('click', async () => {
  const folders = await window.api.addExcludes();
  if (folders && folders.length > 0) {
    excludedFolders = [...new Set([...excludedFolders, ...folders])];
    renderExcludes();
  }
});

rebuildBtn.addEventListener('click', async () => {
  rebuildBtn.disabled = true;
  rebuildBtn.textContent = 'Indexing…';
  await window.api.writeWatcherDirs(externalFolders);
  const status = await window.api.rebuildIndex(externalFolders, excludedFolders);
  rebuildBtn.disabled = false;
  rebuildBtn.textContent = 'Rebuild index';
  chatDiv.innerHTML += `<b>Index:</b> ${escapeHtml(status)}\n\n`;
  chatDiv.scrollTop = chatDiv.scrollHeight;
  await loadFiles();
});

uploadBtn.addEventListener('click', async () => {
  const result = await window.api.uploadFile();
  if (result && result.ok) {
    await loadFiles();
  } else if (result && result.error) {
    chatDiv.innerHTML += `<b>Error (upload):</b> ${escapeHtml(result.error)}\n\n`;
  }
});

clearBtn.addEventListener('click', async () => {
  const result = await window.api.clearChatHistory();
  if (result && result.ok) {
    chatDiv.innerHTML = '';
    chatDiv.scrollTop = 0;
  } else if (result && result.error) {
    chatDiv.innerHTML += `<b>Error (clear history):</b> ${escapeHtml(result.error)}\n\n`;
  }
});

exportBtn.addEventListener('click', async () => {
  if (!chatDiv.innerHTML.trim()) {
    chatDiv.innerHTML += `<b>System:</b> Chat is empty. Nothing to export.\n\n`;
    chatDiv.scrollTop = chatDiv.scrollHeight;
    return;
  }
  const result = await window.api.exportSession(chatDiv.innerHTML);
  if (result && result.ok && result.fileName) {
    chatDiv.innerHTML += `<b>System:</b> Session exported to <strong>${escapeHtml(result.fileName)}</strong> in data folder.\n\n`;
    chatDiv.scrollTop = chatDiv.scrollHeight;
    await loadFiles();
  } else if (result && result.error) {
    chatDiv.innerHTML += `<b>Error (export):</b> ${escapeHtml(result.error)}\n\n`;
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }
});

document.getElementById('context-viewer-close').addEventListener('click', () => {
  contextViewer.style.display = 'none';
});

sendBtn.addEventListener('click', async () => {
  const text = queryInput.value.trim();
  if (!text) return;

  chatDiv.innerHTML += `<b>You:</b> ${escapeHtml(text)}\n\n`;
  queryInput.value = '';
  sendBtn.disabled = true;

  try {
    const result = await window.api.sendChat(text, pinnedFiles);
    let response = typeof result === 'object' && result !== null && 'response' in result ? result.response : String(result);
    const paths = typeof result === 'object' && result !== null && Array.isArray(result.paths) ? result.paths : [];
    const llmOffline = typeof result === 'object' && result !== null && result.llmOffline === true;
    if (llmOffline) {
      llmBanner.classList.add('show');
    } else {
      llmBanner.classList.remove('show');
    }

    let hasTokenMeta = false;
    if (response.includes('D1_META_START') && response.includes('D1_META_END')) {
      const metaEndIdx = response.indexOf('D1_META_END');
      const afterMeta = response.slice(metaEndIdx + 'D1_META_END'.length).trim();
      const beforeMeta = response.slice(0, metaEndIdx);
      const metaBlock = beforeMeta.split('D1_META_START')[1].trim();
      try {
        const meta = JSON.parse(metaBlock);
        const tokens = typeof meta.tokens === 'number' ? meta.tokens : 0;
        const usagePct = Math.min((tokens / CONTEXT_WINDOW_SIZE) * 100, 100);
        tokenBar.style.width = `${usagePct}%`;
        tokenStats.textContent = `Tokens: ${tokens} / ${CONTEXT_WINDOW_SIZE} (est.)`;
        tokenBar.classList.toggle('high-usage', usagePct > 80);
        hasTokenMeta = true;
      } catch (_) {}
      response = afterMeta;
    }

    if (paths.length > 0 || hasTokenMeta) {
      contextViewer.style.display = 'block';
      if (paths.length > 0) {
        contextContent.innerHTML = paths.map((p) => {
          const isPinned = pinnedFiles.includes(p);
          return `<div class="context-path"><span title="${escapeHtml(p)}">\u{1F4C4} ${escapeHtml(p.split(/[/\\]/).pop() || p)}</span> <button type="button" class="context-pin-btn" data-path="${escapeHtml(p)}" title="Pin to context" ${isPinned ? ' disabled' : ''}>${isPinned ? 'Pinned' : 'Pin'}</button></div>`;
        }).join('');
        contextContent.querySelectorAll('.context-pin-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const pathVal = btn.getAttribute('data-path');
            if (!pathVal || pinnedFiles.includes(pathVal)) return;
            pinnedFiles = [...pinnedFiles, pathVal];
            localStorage.setItem('d1-pinned', JSON.stringify(pinnedFiles));
            renderPinned();
            btn.textContent = 'Pinned';
            btn.disabled = true;
          });
        });
      }
    }
    if (paths.length === 0 && !hasTokenMeta) {
      contextContent.innerHTML = '';
      contextViewer.style.display = 'none';
    }

    chatDiv.innerHTML += `<b>AI:</b> ${escapeHtml(response)}\n\n`;
  } catch (e) {
    chatDiv.innerHTML += `<b>Error:</b> ${escapeHtml(String(e))}\n\n`;
    llmBanner.classList.add('show');
  }

  sendBtn.disabled = false;
  chatDiv.scrollTop = chatDiv.scrollHeight;
  queryInput.focus();
});

queryInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

sidebar.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  sidebar.classList.add('drag-over');
});

sidebar.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  sidebar.classList.remove('drag-over');
});

sidebar.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  sidebar.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  for (const file of files) {
    if (file.path) {
      const result = await window.api.savePath(file.path);
      if (result && !result.ok && result.error) {
        chatDiv.innerHTML += `<b>Drop error:</b> ${escapeHtml(result.error)}\n\n`;
      }
    }
  }
  await loadFiles();
});

document.querySelector('#llm-offline-banner .banner-dismiss').addEventListener('click', () => {
  llmBanner.classList.remove('show');
});

(async () => {
  const r = await window.api.checkLLM();
  if (!r || !r.ok) llmBanner.classList.add('show');
})();

if (externalFolders.length > 0) window.api.writeWatcherDirsIfMissing(externalFolders);

renderFolders();
renderExcludes();
renderPinned();
loadFiles();
