// Fungsi untuk menampilkan pop-up Neo Brutalism yang estetik
function ensureNeoStyles() {
  if (document.getElementById('neo-brutalist-styles')) return;

  const style = document.createElement('style');
  style.id = 'neo-brutalist-styles';
  style.textContent = `
    @keyframes neoFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes neoPop {
      0% { opacity: 0; transform: scale(.85) rotate(-3deg); }
      60% { transform: scale(1.04) rotate(1.5deg); }
      100% { opacity: 1; transform: scale(1) rotate(0deg); }
    }
    @keyframes neoOut {
      to { opacity: 0; transform: scale(.9) translateY(8px); }
    }
    #neo-ok-btn:hover {
      transform: translate(-1px, -2px);
      box-shadow: 5px 5px 0 #111;
    }
    #neo-ok-btn:active {
      transform: translate(2px, 2px);
      box-shadow: none;
    }
  `;
  document.head.appendChild(style);
}

function showNeoAlert(message, type = "success") {
  ensureNeoStyles();

  // Hapus alert lama jika masih ada
  const existingModal = document.getElementById('neo-brutalist-modal');
  if (existingModal) existingModal.remove();

  // Tentukan warna tema berdasarkan jenis pesan
  let bgColor = "#00f0ff"; // Cyan untuk sukses
  let titleText = "BERHASIL! 🎉";
  let iconText = "🎉";
  if (type === "error") {
    bgColor = "#ff5757"; // Merah untuk error/stop
    titleText = "INFO 🛑";
    iconText = "🛑";
  } else if (type === "warning") {
    bgColor = "#ffde59"; // Kuning untuk peringatan
    titleText = "PERHATIAN ⚠️";
    iconText = "⚠️";
  }

  // Buat kontainer utama overlay
  const overlay = document.createElement('div');
  overlay.id = 'neo-brutalist-modal';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background-color: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(3px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    animation: neoFade 0.25s ease-out;
  `;

  // Buat kotak dialog pop-up
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background-color: ${bgColor};
    border: 4px solid #111;
    border-radius: 12px;
    box-shadow: 6px 6px 0px #111;
    padding: 22px 24px;
    width: 320px;
    text-align: center;
    animation: neoPop 0.35s cubic-bezier(.34, 1.56, .64, 1);
  `;

  dialog.innerHTML = `
    <div style="
      width: 48px;
      height: 48px;
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      background: #ffffff;
      border: 3px solid #111;
      border-radius: 50%;
      box-shadow: 3px 3px 0px #111;
    ">${iconText}</div>
    <h3 style="
      margin: 0 0 10px 0;
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: #111;
    ">${titleText}</h3>
    <p style="
      margin: 0 0 20px 0;
      font-size: 13px;
      font-weight: 700;
      color: #111;
      line-height: 1.4;
    ">${message}</p>
    <button id="neo-ok-btn" style="
      background-color: #ffffff;
      color: #111;
      border: 3px solid #111;
      border-radius: 8px;
      padding: 9px 18px;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 3px 3px 0px #111;
      transition: transform 0.12s, box-shadow 0.12s;
    ">OKE MENGERTI</button>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const close = () => {
    dialog.style.animation = 'neoOut 0.18s ease-in forwards';
    overlay.style.transition = 'opacity 0.18s';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 190);
  };

  const okBtn = document.getElementById('neo-ok-btn');
  okBtn.addEventListener('click', close);
  okBtn.focus();
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

// dont touch this code above, it's for the alert pop-up design

let stopProcess = false;
const AUTO_NEXT_WEEK_ENABLED = false;
let widgetHideTimer = null;
let widgetRemoveTimer = null;

function ensureWidgetStyles() {
  if (document.getElementById('jh-widget-styles')) return;

  const style = document.createElement('style');
  style.id = 'jh-widget-styles';
  style.textContent = `
    @keyframes jhSlideIn {
      from { opacity: 0; transform: translateY(24px) scale(.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes jhSlideOut {
      to { opacity: 0; transform: translateY(16px) scale(.96); }
    }
    @keyframes jhSpin { to { transform: rotate(360deg); } }
    @keyframes jhShimmer {
      0% { background-position: 0 0; }
      100% { background-position: 28px 0; }
    }
    #jh-widget-stop:hover {
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0 #000;
    }
    #jh-widget-stop:active {
      transform: translate(1px, 1px);
      box-shadow: none;
    }
  `;
  document.head.appendChild(style);
}

function showFloatingWidget(title, subtitle) {
  ensureWidgetStyles();
  clearTimeout(widgetHideTimer);
  clearTimeout(widgetRemoveTimer);

  let widget = document.getElementById('jh-widget');
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'jh-widget';
    widget.setAttribute('role', 'status');
    widget.setAttribute('aria-live', 'polite');
    widget.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 292px;
      z-index: 999998;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: jhSlideIn .35s cubic-bezier(.34, 1.56, .64, 1);
    `;
    widget.innerHTML = `
      <div style="
        background: #111;
        border: 3px solid #111;
        border-radius: 16px;
        box-shadow: 6px 6px 0 #5ce1e6;
        padding: 12px 14px;
        color: #fff;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div id="jh-widget-spinner" style="
            width: 22px; height: 22px; flex-shrink: 0;
            border: 3px solid #333; border-top-color: #5ce1e6;
            border-radius: 50%; animation: jhSpin .8s linear infinite;
          "></div>
          <div style="flex: 1; min-width: 0;">
            <div id="jh-widget-title" style="
              font-size: 12px; font-weight: 900; letter-spacing: .3px;
              text-transform: uppercase;
            ">Jurnal Helper</div>
            <div id="jh-widget-sub" style="
              margin-top: 1px; font-size: 10px; font-weight: 600; color: #9ca3af;
              white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            ">Menyiapkan...</div>
          </div>
          <button id="jh-widget-stop" type="button" style="
            flex-shrink: 0; padding: 6px 10px; border: 2px solid #fff;
            border-radius: 8px; background: #ff5757; color: #fff;
            font-family: inherit; font-size: 9px; font-weight: 900;
            letter-spacing: .4px; text-transform: uppercase; cursor: pointer;
            box-shadow: 2px 2px 0 #000; transition: transform .12s, box-shadow .12s;
          ">Stop</button>
        </div>
        <div style="
          margin-top: 10px; height: 8px; background: #1f2937;
          border: 2px solid #333; border-radius: 999px; overflow: hidden;
        ">
          <div id="jh-widget-bar" style="
            width: 4%; height: 100%; border-radius: 999px;
            background: repeating-linear-gradient(45deg, #5ce1e6 0 8px, #ffd93d 8px 16px);
            background-size: 200% 100%;
            transition: width .35s ease;
            animation: jhShimmer 1s linear infinite;
          "></div>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    widget.querySelector('#jh-widget-stop').addEventListener('click', () => {
      stopProcess = true;
      updateFloatingWidget({ subtitle: 'Menghentikan proses...' });
      const stopBtn = document.getElementById('jh-widget-stop');
      if (stopBtn) {
        stopBtn.disabled = true;
        stopBtn.style.opacity = '.5';
        stopBtn.style.cursor = 'default';
      }
    });
  }

  const stopBtn = widget.querySelector('#jh-widget-stop');
  if (stopBtn) {
    stopBtn.disabled = false;
    stopBtn.style.display = '';
    stopBtn.style.opacity = '1';
    stopBtn.style.cursor = 'pointer';
  }

  const spinner = widget.querySelector('#jh-widget-spinner');
  if (spinner) {
    spinner.textContent = '';
    spinner.style.display = 'block';
    spinner.style.border = '3px solid #333';
    spinner.style.borderTopColor = '#5ce1e6';
    spinner.style.animation = 'jhSpin .8s linear infinite';
  }

  widget.style.animation = 'jhSlideIn .35s cubic-bezier(.34, 1.56, .64, 1)';
  updateFloatingWidget({ title, subtitle, progress: 4 });
}

function updateFloatingWidget({ title, subtitle, progress }) {
  const widget = document.getElementById('jh-widget');
  if (!widget) return;

  if (title) {
    const titleEl = widget.querySelector('#jh-widget-title');
    if (titleEl) titleEl.textContent = title;
  }
  if (subtitle) {
    const subEl = widget.querySelector('#jh-widget-sub');
    if (subEl) subEl.textContent = subtitle;
  }
  if (typeof progress === 'number') {
    const bar = widget.querySelector('#jh-widget-bar');
    if (bar) bar.style.width = `${Math.max(4, Math.min(100, progress))}%`;
  }
}

function finishFloatingWidget(success, message, hideDelay = 1600) {
  const widget = document.getElementById('jh-widget');
  if (!widget) return;

  const spinner = widget.querySelector('#jh-widget-spinner');
  if (spinner) {
    spinner.style.animation = 'none';
    spinner.style.border = 'none';
    spinner.style.display = 'grid';
    spinner.style.placeItems = 'center';
    spinner.style.fontSize = '18px';
    spinner.textContent = success ? '✅' : '🛑';
  }

  const stopBtn = widget.querySelector('#jh-widget-stop');
  if (stopBtn) stopBtn.style.display = 'none';

  updateFloatingWidget({
    title: success ? 'Selesai!' : 'Dihentikan',
    subtitle: message,
    progress: success ? 100 : 0
  });

  const bar = widget.querySelector('#jh-widget-bar');
  if (bar) bar.style.animation = 'none';

  hideFloatingWidget(hideDelay);
}

function hideFloatingWidget(delay = 0) {
  const widget = document.getElementById('jh-widget');
  if (!widget) return;

  clearTimeout(widgetHideTimer);
  clearTimeout(widgetRemoveTimer);

  widgetHideTimer = setTimeout(() => {
    if (!widget.isConnected) return;
    widget.style.animation = 'jhSlideOut .25s ease forwards';
    widgetRemoveTimer = setTimeout(() => widget.remove(), 270);
  }, delay);
}


function playCompletionSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const now = context.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startAt = now + index * 0.11;
      const stopAt = startAt + 0.28;

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(stopAt + 0.02);
    });

    if (context.state === 'suspended') {
      context.resume().catch(() => {});
    }

    setTimeout(() => {
      context.close().catch(() => {});
    }, 1400);
  } catch (error) {
    // Suara opsional; abaikan jika browser memblokir audio.
  }
}

function sleep(ms) {
  if (ms === 0) return Promise.resolve();
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isVisible(element) {
  return Boolean(element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
}

async function waitForSalatModal(timeout = 3000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const specificModal = document.querySelector('#modal-salat-zikir');
    if (isVisible(specificModal)) return specificModal;

    const visibleModal = Array.from(document.querySelectorAll('.modal-content')).find(isVisible);
    if (visibleModal) return visibleModal;
    await sleep(50);
  }
  return null;
}

function clickModalOption(modal, selectors, labelText) {
  const input = modal.querySelector(selectors);
  if (input) {
    input.click();
    return true;
  }

  const label = Array.from(modal.querySelectorAll('label')).find(element =>
    element.textContent.trim().includes(labelText)
  );
  if (label) {
    label.click();
    return true;
  }
  return false;
}

// Ambil pengaturan kustom dari storage
async function getCustomRules() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['ruleTahajud', 'ruleDhuha', 'ruleDays', 'ruleTahajudDays', 'ruleDhuhaDays', 'ruleMengajiDays'],
      (result) => {
        const legacyDays = result.ruleDays !== undefined ? result.ruleDays : [0, 1, 2, 3, 4, 5, 6];
        resolve({
          tahajud: result.ruleTahajud || "Tidak",
          dhuha: result.ruleDhuha || "4 Rakaat",
          tahajudDays: result.ruleTahajudDays !== undefined ? result.ruleTahajudDays : legacyDays,
          dhuhaDays: result.ruleDhuhaDays !== undefined ? result.ruleDhuhaDays : legacyDays,
          mengajiDays: result.ruleMengajiDays !== undefined ? result.ruleMengajiDays : legacyDays
        });
      }
    );
  });
}

// Ambil pengaturan jurnal mingguan dari storage
async function getWeeklyRules() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['weeklyHabitRules', 'weeklyStatus', 'weeklyDay', 'weeklyWitness', 'weeklyWitnessName'],
      (result) => {
        resolve({
          habitRules: result.weeklyHabitRules || {},
          defaults: {
            status: result.weeklyStatus || 'auto',
            day: result.weeklyDay !== undefined ? Number(result.weeklyDay) : 6,
            witness: result.weeklyWitness || 'PARENT',
            witnessName: result.weeklyWitnessName || ''
          }
        });
      }
    );
  });
}

function normalizeHabitName(name) {
  return (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function getHabitRule(habitRules, habitId, habitName, defaults) {
  if (habitId && habitRules[habitId]) {
    return habitRules[habitId];
  }

  const normalizedName = normalizeHabitName(habitName);
  const byName = Object.values(habitRules).find(
    (rule) => normalizeHabitName(rule.name) === normalizedName
  );
  if (byName) return byName;

  const isFriday = normalizedName.includes('jumat');
  return {
    name: habitName,
    status: defaults.status || 'auto',
    day: isFriday ? 5 : defaults.day,
    witness: defaults.witness || 'PARENT',
    witnessName: defaults.witnessName || ''
  };
}

const WITNESS_KEYWORDS = {
  PARENT: ['parent', 'orang tua', 'orangtua', 'ortu', 'ayah', 'ibu'],
  FRIEND: ['friend', 'teman', 'sahabat'],
  TEACHER: ['teacher', 'guru', 'ustadz', 'ustadzah', 'pembimbing'],
  OTHER: ['other', 'lain', 'lainnya', 'tutor', 'saksi lain']
};

function getRadioSearchText(radio) {
  const label = radio.closest('label');
  return `${radio.value || ''} ${radio.id || ''} ${radio.getAttribute('data-type') || ''} ${label ? label.textContent : ''}`.toLowerCase();
}

function findCategoryRadio(modal, status, habitName) {
  const namedRadios = Array.from(modal.querySelectorAll('input[name="radioCategory"]'));
  const pool = namedRadios.length > 0
    ? namedRadios
    : Array.from(modal.querySelectorAll('input[type="radio"]'));

  let desiredStatus = status;
  if (status === 'auto') {
    desiredStatus = (habitName.includes('puasa') || habitName.includes('sunnah'))
      ? 'undone'
      : 'doing';
  }

  const fallbackOrder = {
    doing: ['doing', 'other_choice'],
    undone: ['undone', 'no_activity'],
    other_choice: ['other_choice', 'doing'],
    no_activity: ['no_activity', 'undone']
  };
  const types = fallbackOrder[desiredStatus] || fallbackOrder.doing;

  for (const type of types) {
    const match = pool.find(
      (radio) => (radio.getAttribute('data-type') || '').toLowerCase() === type
    );
    if (match) return match;
  }

  return pool.find((radio) => {
    const text = getRadioSearchText(radio);
    if (desiredStatus === 'no_activity') return text.includes('tidak ada kegiatan');
    if (desiredStatus === 'other_choice') return text.includes('salah satu');
    if (desiredStatus === 'undone') return text.includes('tidak') || text.includes('belum');
    return text.includes('melaksanakan') || text.includes('ya');
  }) || null;
}

function findWitnessRadio(modal, witness) {
  const allRadios = Array.from(modal.querySelectorAll('input[type="radio"]'));
  let radios = allRadios.filter((radio) => /witness|saksi/i.test(`${radio.name || ''} ${radio.id || ''}`));

  if (radios.length === 0) {
    radios = allRadios.filter((radio) => {
      const label = radio.closest('label');
      return /orang tua|orangtua|guru|saksi|parent|teacher/i.test(label ? label.textContent : '');
    });
  }
  if (radios.length === 0) return null;

  const keywords = WITNESS_KEYWORDS[witness] || WITNESS_KEYWORDS.PARENT;
  const match = radios.find((radio) => keywords.some((key) => getRadioSearchText(radio).includes(key)));
  if (match) return match;

  if (witness === 'PARENT') {
    return radios.find((radio) => (radio.value || '').toLowerCase().includes('parent')) || radios[0];
  }
  return radios.find((radio) => !(radio.value || '').toLowerCase().includes('parent')) || radios[0];
}

function findWitnessNameInput(modal, includeDisabled = false) {
  const allInputs = Array.from(modal.querySelectorAll('input[type="text"], input:not([type]), textarea'))
    .filter((element) => element.type !== 'hidden');

  const named = allInputs.filter((element) =>
    /witness|saksi|nama|name/i.test(`${element.name || ''} ${element.id || ''} ${element.placeholder || ''}`)
  );

  if (named.length > 0) {
    const enabledNamed = named.filter((element) => !element.disabled);
    if (enabledNamed.length > 0) return enabledNamed[0];
    if (includeDisabled) return named[0];
  }

  return allInputs.find((element) => !element.disabled && element.offsetParent !== null) || null;
}

async function applyWeeklyWitness(modal, weeklyRules) {
  const target = findWitnessRadio(modal, weeklyRules.witness);
  if (!target) return;

  target.click();
  target.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(200);

  const targetLabel = target.closest('label');
  const targetText = `${target.value || ''} ${targetLabel ? targetLabel.textContent : ''}`.toLowerCase();
  const targetIsParent = targetText.includes('parent') || targetText.includes('orang tua') || targetText.includes('orangtua');
  const shouldClearName = weeklyRules.witness === 'PARENT' || targetIsParent;

  const nameInput = findWitnessNameInput(modal, shouldClearName);
  if (!nameInput) return;

  if (shouldClearName) {
    nameInput.value = '';
  } else {
    nameInput.value = weeklyRules.witnessName || '';
  }

  nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  nameInput.dispatchEvent(new Event('change', { bubbles: true }));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "jalankan_otomatis") {
    stopProcess = false;
    chrome.storage.local.get(['extensionActive'], async (result) => {
      const isActive = result.extensionActive !== false; 
      if (!isActive) {
        showNeoAlert("Ekstensi sedang dalam posisi OFF!", "warning");
        chrome.runtime.sendMessage({ action: "proses_selesai" });
        return;
      }
      
      await jalankanDenganKontrol(request.speed);
      chrome.runtime.sendMessage({ action: "proses_selesai" });
    });
    sendResponse({ status: "started" });
  } else if (request.action === "jalankan_mingguan") {
    stopProcess = false;
    chrome.storage.local.get(['extensionActive'], async (result) => {
      const isActive = result.extensionActive !== false; 
      if (!isActive) {
        showNeoAlert("Ekstensi sedang dalam posisi OFF!", "warning");
        chrome.runtime.sendMessage({ action: "proses_selesai" });
        return;
      }
      
      const autoNext = AUTO_NEXT_WEEK_ENABLED && request.autoNext === true;
      await jalankanMingguanLintasMinggu(request.speed, autoNext);
      chrome.runtime.sendMessage({ action: "proses_selesai" });
    });
    sendResponse({ status: "started" });
  } else if (request.action === "hentikan_proses") {
    stopProcess = true;
    sendResponse({ status: "stopped" });
  } else if (request.action === "get_weekly_habits") {
    const habits = [];
    const seen = new Set();

    document.querySelectorAll('#render-habituation-weekly tr[data-habit-id]').forEach((tr) => {
      const id = tr.getAttribute('data-habit-id');
      const name = (tr.querySelector('td') ? tr.querySelector('td').textContent : '').trim();
      if (id && name && !seen.has(id)) {
        seen.add(id);
        habits.push({ id, name });
      }
    });

    if (habits.length === 0) {
      document.querySelectorAll('#render-habit-weekly-mobile [data-habit-id]').forEach((element) => {
        const id = element.getAttribute('data-habit-id');
        const container = element.closest('.panel-card-collapsible') || element;
        const titleEl = container.querySelector('.font-17');
        const name = (titleEl ? titleEl.textContent : element.textContent || '').trim();
        if (id && name && !seen.has(id)) {
          seen.add(id);
          habits.push({ id, name });
        }
      });
    }

    sendResponse({ habits });
  }
  return true;
});

// LOGIKA HARIAN (DIPERBARUI: Menimpa jurnal yang sudah terisi & filter hari kustom)
async function jalankanDenganKontrol(speedMode) {
  let delay = 200;
  if (speedMode === "normal") delay = 600;
  if (speedMode === "instant") delay = 0;

  const rules = await getCustomRules();

  const allCells = Array.from(document.querySelectorAll('.column-daily-habit[data-date]'));
  if (allCells.length === 0) {
    showNeoAlert("Tidak ditemukan tabel jurnal harian di halaman ini.", "warning");
    return;
  }

  const dates = [...new Set(allCells.map(c => c.getAttribute('data-date')))];
  showFloatingWidget("Jurnal Harian", "Menyiapkan data...");
  
  for (let d = 0; d < dates.length; d++) {
    if (stopProcess) break;
    const date = dates[d];

    // Tentukan hari untuk filter aturan per-habit
    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

    updateFloatingWidget({
      subtitle: `Memproses ${date} • ${d + 1}/${dates.length}`,
      progress: (d / dates.length) * 100
    });

    const editBtn = document.querySelector(`.daily-habit-edit-button[data-date="${date}"]`);
    if (editBtn) {
      editBtn.click();
      await sleep(delay > 0 ? delay : 30);
    }

    if (stopProcess) break;

    // Ambil SEMUA sel pada tanggal tersebut (baik yang bertuliskan "Isi" maupun yang sudah terisi)
    const cellsForDay = Array.from(document.querySelectorAll(`.column-daily-habit[data-date="${date}"]`));
    const activeCells = cellsForDay.filter(cell => !cell.classList.contains('cursor-not-allowed'));

    for (let i = 0; i < activeCells.length; i++) {
      if (stopProcess) break;
      const cell = activeCells[i];

      updateFloatingWidget({
        subtitle: `Mengisi ${date} • ${i + 1}/${activeCells.length}`,
        progress: ((d + (i + 1) / Math.max(activeCells.length, 1)) / dates.length) * 100
      });
      
      const tr = cell.closest('tr');
      let habitName = "";
      if (tr) {
        const td = tr.querySelector('td');
        if (td) habitName = td.textContent.toLowerCase();
      }
      const groupAttr = cell.getAttribute('data-group') || "";
      const textInfo = (habitName + " " + groupAttr).toLowerCase();

      let habitAllowedToday = true;
      if (textInfo.includes("dhuha")) {
        habitAllowedToday = rules.dhuhaDays.includes(dayOfWeek);
      } else if (textInfo.includes("malam") || textInfo.includes("tahajud")) {
        habitAllowedToday = rules.tahajud.toLowerCase().includes("tidak")
          ? true
          : rules.tahajudDays.includes(dayOfWeek);
      } else if (textInfo.includes("mengaji") || textInfo.includes("tilawah")) {
        habitAllowedToday = rules.mengajiDays.includes(dayOfWeek);
      }

      if (!habitAllowedToday) continue;

      const trigger = cell.querySelector('.button-dropdown-caption, [data-toggle="dropdown"]') || cell;
      trigger.click();
      await sleep(delay > 0 ? 200 : 30); 

      const dropdownMenu = cell.querySelector('.dropdown-menu') || document.querySelector('.dropdown-menu.show');
      if (dropdownMenu) {
        const items = Array.from(dropdownMenu.querySelectorAll('.dropdown-item'));
        let targetItem = null;

        if (textInfo.includes("dhuha")) {
          targetItem = items.find(el => el.textContent.includes(rules.dhuha));
        } else if (textInfo.includes("tidur")) {
          targetItem = items.find(el => el.textContent.includes("22.00"));
        } else if (textInfo.includes("bangun")) {
          targetItem = items.find(el => el.textContent.includes("05.00") || el.textContent.includes("5.00"));
        } else if (textInfo.includes("malam") || textInfo.includes("tahajud")) {
          targetItem = items.find(el => el.textContent.includes(rules.tahajud));
        } else if (textInfo.includes("mengaji") || textInfo.includes("tilawah")) {
          targetItem = items.find(el => el.textContent.includes("Melaksanakan") || el.textContent.includes("Ya"));
        } else {
          targetItem = items.find(el => el.textContent.includes("Melaksanakan") || el.textContent.includes("Ya"));
        }

        if (targetItem) {
          targetItem.click();
        } else if (items.length > 0) {
          items[0].click();
        }
        await sleep(delay);
        continue;
      }

      const modalContent = await waitForSalatModal();
      if (modalContent) {
        const modalTitle = modalContent.querySelector('.modal-title, .font-17');
        const titleText = modalTitle ? modalTitle.textContent.toLowerCase() : textInfo;

        if (titleText.includes("malam") || titleText.includes("tahajud")) {
          if (rules.tahajud.toLowerCase().includes("tidak")) {
            clickModalOption(modalContent, 'input[data-category="Tidak Melaksanakan"], input[data-point="0"]', "Tidak Melaksanakan");
          } else {
            // Jika memilih rakaat shalat malam tertentu
            clickModalOption(modalContent, `input[data-category="${rules.tahajud}"], input[data-point="1"]`, rules.tahajud);
          }
        } else if (titleText.includes("dhuha")) {
          clickModalOption(modalContent, `input[data-category="${rules.dhuha}"], input[data-point="4"]`, rules.dhuha);
        } else if (titleText.includes("mengaji") || titleText.includes("tilawah")) {
          clickModalOption(modalContent, 'input[data-category="Melaksanakan"], input[data-point="1"]', "Melaksanakan");
        } else {
          clickModalOption(modalContent, 'input.do_pray, input[data-category="Melaksanakan"], input[data-category="Ya"], input[data-point="1"]', "Melaksanakan");
          clickModalOption(modalContent, 'form.salat-item input[data-category="Ya"], form.salat-item input[data-point="2"]', "Ya");
        }

        await sleep(delay > 0 ? 80 : 10);

        const modalSaveBtn = modalContent.querySelector('.create-salat-zikir') || document.querySelector('.create-salat-zikir');
        if (modalSaveBtn) {
          modalSaveBtn.click();
        } else {
          const closeBtn = document.querySelector('.modal-header .close');
          if (closeBtn) closeBtn.click();
        }
        await sleep(delay > 0 ? delay : 50);
      }
    }

    if (stopProcess) break;

    if (editBtn) {
      const th = editBtn.closest('th');
      const daySaveBtn = th ? th.querySelector('.daily-habit-save-button') : null;
      if (daySaveBtn) {
        daySaveBtn.click();
        await sleep(delay > 0 ? 250 : 40); 
      }
    }
  }

  if (!stopProcess) {
    playCompletionSound();
    finishFloatingWidget(true, "Jurnal harian sudah terisi");
    showNeoAlert("Jurnal harian selesai diisi. Jika ada jurnal yang belum terisi, jalankan ulang dari popup.", "success");
  } else {
    finishFloatingWidget(false, "Proses dibatalkan", 1200);
    showNeoAlert("Proses dihentikan. Jika extension macet, tekan Ctrl + Shift + R lalu jalankan ulang jurnal yang belum terisi.", "error");
  }
}

// LOGIKA MINGGUAN LINTAS MINGGU
async function jalankanMingguanLintasMinggu(speedMode, autoNext) {
  let weekLoopCount = 0;
  const maxWeeks = 10;

  showFloatingWidget("Jurnal Mingguan", "Menyiapkan data...");

  while (weekLoopCount < maxWeeks && !stopProcess) {
    updateFloatingWidget({
      subtitle: `Memproses minggu ${weekLoopCount + 1}`,
      progress: (weekLoopCount / maxWeeks) * 100
    });

    await jalankanMingguanOtomatis(speedMode);

    if (stopProcess) break;

    if (!autoNext) {
      break;
    }

    const nextWeekBtn = document.querySelector('#next-week');
    if (!isVisible(nextWeekBtn)) {
      break;
    }

    nextWeekBtn.click();
    await sleep(1500);
    weekLoopCount++;
  }

    if (!stopProcess) {
    playCompletionSound();
    finishFloatingWidget(true, "Jurnal mingguan sudah terisi");
    showNeoAlert("Jurnal mingguan selesai diisi. Jika ada jurnal yang belum terisi, jalankan ulang dari popup.", "success");
  } else {
    finishFloatingWidget(false, "Proses dibatalkan", 1200);
    showNeoAlert("Proses dihentikan. Jika extension macet, tekan Ctrl + Shift + R lalu jalankan ulang jurnal yang belum terisi.", "error");
  }
}

async function jalankanMingguanOtomatis(speedMode) {
  let delay = 400;
  if (speedMode === "normal") delay = 1000;
  if (speedMode === "instant") delay = 120;

  let safetyCounter = 0;
  const maxItems = 20;
  const weeklyConfig = await getWeeklyRules();

  while (!stopProcess && safetyCounter < maxItems) {
    const link = document.querySelector('#render-habituation-weekly a.habit-weekly');
    if (!link) {
      break;
    }

    const tr = link.closest('tr');
    const habitName = tr ? (tr.querySelector('td') ? tr.querySelector('td').textContent : '').trim() : '';
    const habitId = (tr && tr.getAttribute('data-habit-id')) || link.getAttribute('data-habit-id') || '';
    const rule = getHabitRule(weeklyConfig.habitRules, habitId, habitName, weeklyConfig.defaults);

    updateFloatingWidget({
      subtitle: `Mengisi ${habitName || `habit ${safetyCounter + 1}`}`,
      progress: (safetyCounter / maxItems) * 100
    });

    link.click();

    let modal = null;
    let attempts = 0;
    while (!modal && attempts < 25 && !stopProcess) {
      await sleep(100);
      modal = Array.from(document.querySelectorAll('.modal-content')).find(isVisible);
      attempts++;
    }

    if (!modal) {
      safetyCounter++;
      continue;
    }

    await sleep(delay);

    const categoryRadio = findCategoryRadio(modal, rule.status, habitName.toLowerCase());
    if (categoryRadio) {
      categoryRadio.click();
      categoryRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await sleep(delay);

    let dayRadios = Array.from(modal.querySelectorAll('input[name="dateWeekly"]'));
    if (dayRadios.length === 0) {
      dayRadios = Array.from(modal.querySelectorAll('input[data-date]'));
    }
    if (dayRadios.length > 0) {
      const lowerName = habitName.toLowerCase();
      const isFridayHabit = lowerName.includes('jumat');
      const isDoingStatus = rule.status === 'doing'
        || rule.status === 'other_choice'
        || (rule.status === 'auto' && !(lowerName.includes('puasa') || lowerName.includes('sunnah')));

      const targetDay = (isFridayHabit && isDoingStatus)
        ? 5
        : (rule.day !== undefined && rule.day !== null ? Number(rule.day) : 6);

      const targetDayRadio = dayRadios.find((input) => {
        const dateStr = input.getAttribute('data-date') || input.value;
        return new Date(`${dateStr}T00:00:00Z`).getUTCDay() === targetDay;
      }) || dayRadios[0];

      if (targetDayRadio) {
        targetDayRadio.click();
        targetDayRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    await sleep(delay);

    const isInactiveStatus = rule.status === 'undone' || rule.status === 'no_activity';
    const witnessRule = isInactiveStatus
      ? { ...rule, witness: 'PARENT', witnessName: '' }
      : rule;

    await applyWeeklyWitness(modal, witnessRule);
    await sleep(delay);

    const saveBtn = modal.querySelector('.create-deed-weekly, .update-deed-weekly, #buttonCreateWeekly, #buttonUpdateWeekly');
    if (saveBtn) {
      saveBtn.removeAttribute('disabled');
      saveBtn.classList.remove('btn-primary-disable');
      saveBtn.classList.add('btn-primary');
      
      saveBtn.click();
      await sleep(delay > 0 ? 800 : 250); 
    } else {
      const closeBtn = modal.querySelector('.close, [data-dismiss="modal"]');
      if (closeBtn) closeBtn.click();
      await sleep(400);
    }

    safetyCounter++;
  }
}