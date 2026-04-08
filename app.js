const STORAGE_KEY = "chmod-state";
const HISTORY_KEY = "chmod-history";
const HISTORY_LIMIT = 50;

const checkboxes = document.querySelectorAll("input[type=checkbox]");
const octalInput = document.getElementById("octal-input");
const errorMsg = document.getElementById("error-msg");

octalInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    octalInput.blur();
  }
});

octalInput.addEventListener("input", () => {
  validateAndSync();
});

function validateAndSync() {
  const val = octalInput.value;
  if (val.length === 3 && /^[0-7]{3}$/.test(val)) {
    errorMsg.textContent = "";
    const digits = val.split("").map(Number);

    checkboxes.forEach(cb => {
      const col = parseInt(cb.dataset.col);
      const bitVal = parseInt(cb.dataset.val);
      cb.checked = (digits[col] & bitVal) !== 0;
    });

    update(true);
    saveState();
    return true;
  } else {
    if (val.length > 0) {
      errorMsg.textContent = "Invalid chmod: 3 digits, each 0-7";
    } else {
      errorMsg.textContent = "";
    }
    
    checkboxes.forEach(cb => cb.checked = false);
    update(true);
    saveState();
    return false;
  }
}

function loadState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (saved.length === checkboxes.length) {
    checkboxes.forEach((cb, index) => {
      cb.checked = saved[index] || false;
    });
  }
  update();
}

function saveState() {
  const state = Array.from(checkboxes).map(cb => cb.checked);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

checkboxes.forEach(cb => {
  cb.addEventListener("click", () => {
    update();
    saveState();
    errorMsg.textContent = "";
  });
});

function update(skipInputSync = false) {
  let cols = [0, 0, 0];
  checkboxes.forEach(cb => {
    if (cb.checked) {
      let col = parseInt(cb.dataset.col);
      let val = parseInt(cb.dataset.val);
      cols[col] += val;
    }
  });

  function toSymbol(n) {
    return [
      (n & 4) ? "r" : "-",
      (n & 2) ? "w" : "-",
      (n & 1) ? "x" : "-"
    ].join("");
  }

  let octal = cols.join("");
  let symbolic = cols.map(toSymbol).join("");

  if (!skipInputSync) {
    octalInput.value = octal;
  }
  document.getElementById("symbolic").textContent = symbolic;
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  checkboxes.forEach(cb => cb.checked = false);
  update();
  errorMsg.textContent = "";
}

function copyToClipboard() {
  const text = octalInput.value;
  if (!text) return;
  const symbolic = document.getElementById('symbolic').textContent;
  navigator.clipboard.writeText(text).then(() => {
    addToHistory(text, symbolic);
    const btn = document.getElementById('copy-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    const originalBg = btn.style.background;
    btn.style.background = 'var(--success)';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = originalBg;
    }, 1500);
  });
}

document.getElementById('reset-btn').addEventListener('click', resetState);
document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
document.getElementById('history-btn').addEventListener('click', () => toggleHistoryPanel(true));
document.getElementById('history-close').addEventListener('click', () => toggleHistoryPanel(false));
document.getElementById('history-overlay').addEventListener('click', () => toggleHistoryPanel(false));
document.getElementById('clear-history-btn').addEventListener('click', clearHistory);

document.getElementById('history-list').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const index = parseInt(btn.dataset.index);
  if (btn.dataset.action === 'apply') {
    applyHistoryEntry(index);
  } else if (btn.dataset.action === 'delete') {
    deleteHistoryEntry(index);
  }
});

// ════════════════════════════════════════════════════════
// HISTORY
// ════════════════════════════════════════════════════════
function loadHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

function saveHistory(entries) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function addToHistory(octal, symbolic) {
  const entries = loadHistory();
  entries.unshift({ octal, symbolic, ts: Date.now() });
  if (entries.length > HISTORY_LIMIT) entries.length = HISTORY_LIMIT;
  saveHistory(entries);
  renderHistory();
  updateHistoryCount();
}

function deleteHistoryEntry(index) {
  const entries = loadHistory();
  entries.splice(index, 1);
  saveHistory(entries);
  renderHistory();
  updateHistoryCount();
}

function clearHistory() {
  saveHistory([]);
  renderHistory();
  updateHistoryCount();
}

function applyHistoryEntry(index) {
  const entries = loadHistory();
  if (!entries[index]) return;
  octalInput.value = entries[index].octal;
  validateAndSync();
  toggleHistoryPanel(false);
}

function toggleHistoryPanel(open) {
  document.getElementById('history-panel').classList.toggle('open', open);
  document.getElementById('history-overlay').classList.toggle('open', open);
}

function updateHistoryCount() {
  document.getElementById('history-count').textContent = loadHistory().length;
}

function formatTs(ts) {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return 'just now';
  const d = new Date(ts);
  const today = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (d.toDateString() === today.toDateString()) return `${hh}:${mm}`;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
}

function renderHistory() {
  const list = document.getElementById('history-list');
  const entries = loadHistory();
  if (entries.length === 0) {
    list.innerHTML = '<div class="history-empty">No copies yet</div>';
    return;
  }
  list.innerHTML = entries.map((e, i) => `
    <div class="history-entry">
      <div class="history-entry-info">
        <div class="history-entry-octal">${e.octal}</div>
        <div class="history-entry-symbolic">${e.symbolic}</div>
        <div class="history-entry-ts">${formatTs(e.ts)}</div>
      </div>
      <div class="history-entry-actions">
        <button class="history-action-btn apply" data-action="apply" data-index="${i}" title="Re-apply">↩</button>
        <button class="history-action-btn delete" data-action="delete" data-index="${i}" title="Delete">✕</button>
      </div>
    </div>
  `).join('');
}

// Init
loadState();
renderHistory();
updateHistoryCount();

if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}
