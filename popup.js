const toggle = document.getElementById('toggleExtension');
const btnMulai = document.getElementById('btnMulai');
const btnMulaiMingguan = document.getElementById('btnMulaiMingguan');
const btnAutoLintasMinggu = document.getElementById('btnAutoLintasMinggu');
const btnSettings = document.getElementById('btnSettings');
const btnStop = document.getElementById('btnStop');
const speedSelect = document.getElementById('speedSelect');
const autoNextWeekCheckbox = document.getElementById('autoNextWeek');

chrome.storage.local.get(['extensionActive', 'speedSetting', 'autoNextWeek'], (result) => {
  const isActive = result.extensionActive !== false;
  toggle.checked = isActive;

  if (result.speedSetting) {
    speedSelect.value = result.speedSetting;
  }
  
  const isAutoNext = result.autoNextWeek === true;
  autoNextWeekCheckbox.checked = isAutoNext;

  updateButtonVisibility(isActive, isAutoNext);
});

toggle.addEventListener('change', () => {
  const isActive = toggle.checked;
  chrome.storage.local.set({ extensionActive: isActive }, () => {
    updateButtonVisibility(isActive, autoNextWeekCheckbox.checked);
  });
});

speedSelect.addEventListener('change', () => {
  chrome.storage.local.set({ speedSetting: speedSelect.value });
});

autoNextWeekCheckbox.addEventListener('change', () => {
  const isAutoNext = autoNextWeekCheckbox.checked;
  chrome.storage.local.set({ autoNextWeek: isAutoNext }, () => {
    updateButtonVisibility(toggle.checked, isAutoNext);
  });
});

btnSettings.addEventListener('click', () => {
  window.location.href = 'settings.html';
});

function updateButtonVisibility(isActive, isAutoNext) {
  if (!isActive) {
    btnMulai.disabled = true;
    btnMulaiMingguan.disabled = true;
    btnAutoLintasMinggu.disabled = true;
    btnSettings.disabled = true;
    return;
  }

  btnMulai.disabled = false;
  btnMulaiMingguan.disabled = false;
  btnAutoLintasMinggu.disabled = false;
  btnSettings.disabled = false;

  if (isAutoNext) {
    btnMulai.style.display = 'none';
    btnMulaiMingguan.style.display = 'none';
    btnAutoLintasMinggu.style.display = 'block';
  } else {
    btnMulai.style.display = 'block';
    btnMulaiMingguan.style.display = 'block';
    btnAutoLintasMinggu.style.display = 'none';
  }
}

btnMulai.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.includes('app.kejar.id')) {
    setRunningState();
    chrome.tabs.sendMessage(tab.id, { action: "jalankan_otomatis", speed: speedSelect.value }, () => checkError());
  } else {
    alert("Buka halaman app.kejar.id terlebih dahulu!");
  }
});

btnMulaiMingguan.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.includes('app.kejar.id')) {
    setRunningState();
    chrome.tabs.sendMessage(tab.id, { action: "jalankan_mingguan", speed: speedSelect.value, autoNext: false }, () => checkError());
  } else {
    alert("Buka halaman app.kejar.id terlebih dahulu!");
  }
});

btnAutoLintasMinggu.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.includes('app.kejar.id')) {
    setRunningState();
    chrome.tabs.sendMessage(tab.id, { action: "jalankan_mingguan", speed: speedSelect.value, autoNext: true }, () => checkError());
  } else {
    alert("Buka halaman app.kejar.id terlebih dahulu!");
  }
});

btnStop.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: "hentikan_proses" });
  }
  resetButtons();
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "proses_selesai") {
    resetButtons();
  }
});

function checkError() {
  if (chrome.runtime.lastError) {
    alert("Gagal terhubung. Refresh halaman (F5).");
    resetButtons();
  }
}

function setRunningState() {
  btnMulai.style.display = 'none';
  btnMulaiMingguan.style.display = 'none';
  btnAutoLintasMinggu.style.display = 'none';
  btnSettings.style.display = 'none';
  btnStop.style.display = 'block';
}

function resetButtons() {
  btnStop.style.display = 'none';
  btnSettings.style.display = 'block';
  updateButtonVisibility(toggle.checked, autoNextWeekCheckbox.checked);
}