const els = {
  apiUrl: document.getElementById('apiUrl'),
  methodSwitch: document.getElementById('methodSwitch'),
  methodHint: document.getElementById('methodHint'),
  diskSize: document.getElementById('diskSize'),
  resetDiskBtn: document.getElementById('resetDiskBtn'),
  fileName: document.getElementById('fileName'),
  fileBlocks: document.getElementById('fileBlocks'),
  createFileBtn: document.getElementById('createFileBtn'),
  log: document.getElementById('log'),
  diskGrid: document.getElementById('diskGrid'),
  blockInfo: document.getElementById('blockInfo'),
  freeCount: document.getElementById('freeCount'),
  fileTable: document.getElementById('fileTable'),
};

const METHOD_HINTS = {
  sequential: 'Files occupy one unbroken run of blocks. Fast, but prone to fragmentation.',
  linked: 'Each block points to the next. No fragmentation, but no direct block access.',
  indexed: 'One index block stores pointers to every data block. Direct access, one block of overhead.',
};

let currentMethod = 'sequential';
let selectedBlockIndex = null;

function apiBase() {
  return els.apiUrl.value.trim().replace(/\/$/, '');
}

function logLine(message, ok = true) {
  const div = document.createElement('div');
  div.className = `log-entry ${ok ? 'ok' : 'err'}`;
  const time = new Date().toLocaleTimeString();
  div.textContent = `[${time}] ${message}`;
  els.log.prepend(div);
}

// Deterministic color per filename, for visually distinguishing files on the grid
function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 55% 62%)`;
}

async function apiCall(path, options = {}) {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

function showBlockInfo(index, owner) {
  selectedBlockIndex = index;
  const dummyAddress = `A${index + 100}`;
  const storesValue = owner !== null;
  const status = storesValue ? `stores value for ${owner}` : 'is free';
  els.blockInfo.textContent = `Block address: ${index} (${dummyAddress}) | ${status}`;

  [...els.diskGrid.children].forEach((blockEl) => {
    blockEl.classList.toggle('selected', Number(blockEl.dataset.index) === index);
  });
}

function renderDisk(state) {
  const { blocks } = state.disk;
  els.freeCount.textContent = `${state.disk.freeCount} / ${state.disk.size} free`;
  els.diskGrid.innerHTML = '';

  blocks.forEach((owner, idx) => {
    const cell = document.createElement('div');
    cell.className = 'block';
    cell.dataset.index = idx;

    const idxLabel = document.createElement('span');
    idxLabel.className = 'block-idx';
    idxLabel.textContent = idx;
    cell.appendChild(idxLabel);

    const addressLabel = document.createElement('span');
    addressLabel.className = 'block-address';
    addressLabel.textContent = `A${idx + 100}`;
    cell.appendChild(addressLabel);

    if (owner === null) {
      cell.classList.add('free');
    } else {
      cell.classList.add('used');
      const isIndexBlock = owner.endsWith('#idx');
      const label = isIndexBlock ? owner.replace('#idx', '') : owner;
      if (isIndexBlock) cell.classList.add('idx-block');
      cell.style.background = colorForName(label);

      const tag = document.createElement('span');
      tag.className = 'block-tag';
      tag.textContent = isIndexBlock ? `${label} (IDX)` : label;
      cell.appendChild(tag);
    }

    if (selectedBlockIndex === idx) {
      cell.classList.add('selected');
    }

    cell.addEventListener('click', () => showBlockInfo(idx, owner));
    els.diskGrid.appendChild(cell);
  });
}

function renderFileTable(state) {
  const { files } = state;
  els.fileTable.innerHTML = '';

  if (!files.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No files allocated yet. Create one on the left.';
    els.fileTable.appendChild(empty);
    return;
  }

  files.forEach((f) => {
    const row = document.createElement('div');
    row.className = 'file-row';

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = f.name;
    name.style.color = colorForName(f.name);

    const detail = document.createElement('div');
    detail.className = 'detail';
    if (f.method === 'sequential') {
      detail.textContent = `start=${f.start}  length=${f.blocks.length}  blocks=[${f.blocks.join(',')}]`;
    } else if (f.method === 'linked') {
      const chain = f.chain.map((c) => `${c.block}→${c.next === -1 ? 'END' : c.next}`).join('  ');
      detail.textContent = `start=${f.start}  chain: ${chain}`;
    } else {
      detail.textContent = `index=${f.indexBlock}  data=[${f.blocks.join(',')}]`;
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'btn danger-outline';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => deleteFile(f.name);

    row.appendChild(name);
    row.appendChild(detail);
    row.appendChild(delBtn);
    els.fileTable.appendChild(row);
  });
}

function render(state) {
  renderDisk(state);
  renderFileTable(state);
}

async function refreshState() {
  try {
    const state = await apiCall('/state');
    render(state);
  } catch (err) {
    logLine(`Could not reach API: ${err.message}`, false);
  }
}

async function rebuildDisk() {
  const size = parseInt(els.diskSize.value, 10);
  try {
    const data = await apiCall('/init', { method: 'POST', body: JSON.stringify({ size }) });
    logLine(data.message, true);
    render(data.state);
  } catch (err) {
    logLine(err.message, false);
  }
}

async function switchMethod(method) {
  try {
    const data = await apiCall('/method', { method: 'POST', body: JSON.stringify({ method }) });
    currentMethod = method;
    els.methodHint.textContent = METHOD_HINTS[method];
    [...els.methodSwitch.children].forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.method === method);
    });
    logLine(data.message, true);
    render(data.state);
  } catch (err) {
    logLine(err.message, false);
  }
}

async function createFile() {
  const name = els.fileName.value.trim();
  const blocks = parseInt(els.fileBlocks.value, 10);
  if (!name || !Number.isInteger(blocks) || blocks <= 0) {
    logLine('Enter a file name and a positive block count.', false);
    return;
  }
  try {
    const data = await apiCall('/files', { method: 'POST', body: JSON.stringify({ name, blocks }) });
    logLine(data.message, data.ok);
    render(data.state);
    if (data.ok) els.fileName.value = '';
  } catch (err) {
    logLine(err.message, false);
  }
}

async function deleteFile(name) {
  try {
    const data = await apiCall(`/files/${encodeURIComponent(name)}`, { method: 'DELETE' });
    logLine(data.message, data.ok);
    render(data.state);
  } catch (err) {
    logLine(err.message, false);
  }
}

els.resetDiskBtn.addEventListener('click', rebuildDisk);
els.createFileBtn.addEventListener('click', createFile);
els.fileName.addEventListener('keydown', (e) => { if (e.key === 'Enter') createFile(); });
[...els.methodSwitch.children].forEach((btn) => {
  btn.addEventListener('click', () => switchMethod(btn.dataset.method));
});

// Initial load
refreshState();
