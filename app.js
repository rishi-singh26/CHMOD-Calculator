const STORAGE_KEY = "chmod-state";

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
  cb.addEventListener("change", () => {
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
  navigator.clipboard.writeText(text).then(() => {
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

// Init
loadState();

if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}
