const toggle = document.getElementById('toggleExtension');
const btnMulai = document.getElementById('btnMulai');
const btnMulaiMingguan = document.getElementById('btnMulaiMingguan');
const btnStop = document.getElementById('btnStop');
const speedSelect = document.getElementById('speedSelect');

chrome.storage.local.get(['extensionActive', 'speedSetting'], (result) => {
  const isActive = result.extensionActive !== false;
  toggle.checked = isActive;
  btnMulai.disabled = !isActive;
  btnMulaiMingguan.disabled = !isActive;
  if (result.speedSetting) {
    speedSelect.value = result.speedSetting;
  }
});

toggle.addEventListener('change', () => {
  const isActive = toggle.checked;
  chrome.storage.local.set({ extensionActive: isActive }, () => {
    btnMulai.disabled = !isActive;
    btnMulaiMingguan.disabled = !isActive;
  });
});

speedSelect.addEventListener('change', () => {
  chrome.storage.local.set({ speedSetting: speedSelect.value });
});

// Jalankan Harian
btnMulai.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.includes('app.kejar.id')) {
    setRunningState();
    chrome.tabs.sendMessage(tab.id, { action: "jalankan_otomatis", speed: speedSelect.value }, (response) => {
      if (chrome.runtime.lastError) {
        alert("Gagal terhubung. Refresh halaman (F5).");
        resetButtons();
      }
    });
  } else {
    alert("Buka halaman app.kejar.id terlebih dahulu!");
  }
});

// Jalankan Mingguan
btnMulaiMingguan.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.includes('app.kejar.id')) {
    setRunningState();
    chrome.tabs.sendMessage(tab.id, { action: "jalankan_mingguan", speed: speedSelect.value }, (response) => {
      if (chrome.runtime.lastError) {
        alert("Gagal terhubung. Refresh halaman (F5).");
        resetButtons();
      }
    });
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

function setRunningState() {
  btnMulai.style.display = 'none';
  btnMulaiMingguan.style.display = 'none';
  btnStop.style.display = 'block';
}

function resetButtons() {
  btnMulai.style.display = 'block';
  btnMulaiMingguan.style.display = 'block';
  btnStop.style.display = 'none';
}