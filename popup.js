const $ = (id) => document.getElementById(id);

const toggle = $('toggleExtension');
const btnMulai = $('btnMulai');
const btnMulaiMingguan = $('btnMulaiMingguan');
const btnAutoLintasMinggu = $('btnAutoLintasMinggu');
const btnSettings = $('btnSettings');
const btnStop = $('btnStop');
const speedSelect = $('speedSelect');
const autoNextWeekCheckbox = $('autoNextWeek');
const speedSegmented = $('speedSegmented');
const speedHint = $('speedHint');
const statusCard = $('statusCard');
const statusText = $('statusText');
const statusBadge = $('statusBadge');
const actions = $('actions');
const runningPanel = $('runningPanel');
const siteNote = $('siteNote');
const toast = $('toast');
const toastMsg = $('toastMsg');

const SPEED_HINTS = { instant: 'Tanpa jeda', fast: 'Seimbang', normal: 'Aman' };
const AUTO_NEXT_WEEK_ENABLED = false;
let toastTimer = null;

function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '⚠️', warning: '🔔' };
  toast.className = `toast ${type}`;
  toast.querySelector('.t-ico').textContent = icons[type] || icons.success;
  toastMsg.textContent = message;
  requestAnimationFrame(() => toast.classList.add('show'));

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function setSpeedUI(value) {
  const speed = SPEED_HINTS[value] ? value : 'fast';
  speedSelect.value = speed;
  speedHint.textContent = SPEED_HINTS[speed];
  speedSegmented.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.speed === speed);
  });
}

function updateStatusUI(isActive) {
  statusCard.classList.toggle('is-off', !isActive);
  statusBadge.classList.toggle('off', !isActive);
  statusBadge.textContent = isActive ? 'ON' : 'OFF';
  statusText.textContent = isActive ? 'Aktif' : 'Nonaktif';
}

function updateButtonVisibility(isActive, isAutoNext) {
  const running = !runningPanel.classList.contains('hide');
  const showAuto = AUTO_NEXT_WEEK_ENABLED && isActive && isAutoNext;

  btnMulai.classList.toggle('hide', showAuto || running);
  btnMulaiMingguan.classList.toggle('hide', showAuto || running);
  btnAutoLintasMinggu.classList.toggle('hide', !showAuto || running);

  btnMulai.disabled = !isActive;
  btnMulaiMingguan.disabled = !isActive;
  btnAutoLintasMinggu.disabled = !isActive;
  btnSettings.disabled = !isActive;

  if (isActive && !running) {
    actions.classList.remove('hide');
  }
}

chrome.storage.local.get(['extensionActive', 'speedSetting', 'autoNextWeek'], (result) => {
  const isActive = result.extensionActive !== false;
  const isAutoNext = AUTO_NEXT_WEEK_ENABLED && result.autoNextWeek === true;

  toggle.checked = isActive;
  autoNextWeekCheckbox.checked = isAutoNext;
  setSpeedUI(result.speedSetting || 'fast');
  updateStatusUI(isActive);
  updateButtonVisibility(isActive, isAutoNext);
});

checkCurrentSite();

async function checkCurrentSite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const onKejar = Boolean(tab && tab.url && tab.url.includes('app.kejar.id'));
    siteNote.classList.toggle('hide', onKejar);
  } catch (err) {
    siteNote.classList.remove('hide');
  }
}

toggle.addEventListener('change', () => {
  const isActive = toggle.checked;
  updateStatusUI(isActive);
  chrome.storage.local.set({ extensionActive: isActive }, () => {
    updateButtonVisibility(isActive, autoNextWeekCheckbox.checked);
    showToast(isActive ? 'Ekstensi diaktifkan' : 'Ekstensi dinonaktifkan', isActive ? 'success' : 'warning');
  });
});

speedSegmented.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-speed]');
  if (!btn) return;
  const value = btn.dataset.speed;
  if (speedSelect.value === value) return;

  setSpeedUI(value);
  chrome.storage.local.set({ speedSetting: value });
  showToast(`Kecepatan: ${SPEED_HINTS[value]}`, 'success');
});

autoNextWeekCheckbox.addEventListener('change', () => {
  if (!AUTO_NEXT_WEEK_ENABLED) {
    autoNextWeekCheckbox.checked = false;
    return;
  }

  const isAutoNext = autoNextWeekCheckbox.checked;
  chrome.storage.local.set({ autoNextWeek: isAutoNext }, () => {
    updateButtonVisibility(toggle.checked, isAutoNext);
    showToast(
      isAutoNext ? 'Mode auto lintas minggu aktif' : 'Mode auto lintas minggu nonaktif',
      isAutoNext ? 'success' : 'warning'
    );
  });
});

btnSettings.addEventListener('click', () => {
  document.body.style.transition = 'opacity .18s ease, transform .18s ease';
  document.body.style.opacity = '0';
  document.body.style.transform = 'scale(.98)';
  setTimeout(() => { window.location.href = 'settings.html'; }, 160);
});

async function runAction(action, extra = {}) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || !tab.url.includes('app.kejar.id')) {
    siteNote.classList.remove('hide');
    showToast('Buka halaman app.kejar.id dulu!', 'error');
    return;
  }

  setRunningState();

  chrome.tabs.sendMessage(
    tab.id,
    { action, speed: speedSelect.value, ...extra },
    () => {
      if (chrome.runtime.lastError) {
        showToast('Gagal terhubung. Refresh halaman (F5).', 'error');
        resetButtons();
      }
    }
  );
}

btnMulai.addEventListener('click', () => runAction('jalankan_otomatis'));
btnMulaiMingguan.addEventListener('click', () => runAction('jalankan_mingguan', { autoNext: false }));
btnAutoLintasMinggu.addEventListener('click', () => {
  if (!AUTO_NEXT_WEEK_ENABLED) return;
  runAction('jalankan_mingguan', { autoNext: true });
});

btnStop.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'hentikan_proses' });
  }
  resetButtons();
  showToast('Proses dihentikan', 'warning');
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'proses_selesai') {
    resetButtons();
  }
});

function setRunningState() {
  actions.classList.add('hide');
  runningPanel.classList.remove('hide');
}

function resetButtons() {
  runningPanel.classList.add('hide');
  actions.classList.remove('hide');
  updateButtonVisibility(toggle.checked, autoNextWeekCheckbox.checked);
}
