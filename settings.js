const $ = (id) => document.getElementById(id);

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_LABELS = { 0: 'Min', 1: 'Sen', 2: 'Sel', 3: 'Rab', 4: 'Kam', 5: 'Jum', 6: 'Sab' };
const STATUS_LABELS = {
  auto: 'Otomatis',
  doing: 'Mengerjakan',
  other_choice: 'Salah Satu Hari',
  undone: 'Tidak Mengerjakan',
  no_activity: 'Tidak Ada Kegiatan'
};
const WITNESS_LABELS = {
  PARENT: 'Orang Tua',
  FRIEND: 'Teman',
  TEACHER: 'Guru',
  OTHER: 'Lainnya'
};

const tahajudSelect = $('tahajudRakaat');
const dhuhaSelect = $('dhuhaRakaat');
const tahajudDaysHint = $('tahajudDaysHint');
const btnSave = $('btnSaveSettings');
const btnBack = $('btnBack');
const btnBackBottom = $('btnBackBottom');
const toast = $('toast');
const toastMsg = $('toastMsg');
const tabsBar = $('settingsTabs');
const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = Array.from(document.querySelectorAll('.tab-panel'));
const dayRows = Array.from(document.querySelectorAll('#panel-daily .day-row'));

const weeklyNote = $('weeklyNote');
const weeklyHabitList = $('weeklyHabitList');
const weeklyEmpty = $('weeklyEmpty');
const btnReloadHabits = $('btnReloadHabits');

const rows = {
  tahajudDays: document.querySelector('[data-days="tahajudDays"]'),
  dhuhaDays: document.querySelector('[data-days="dhuhaDays"]'),
  mengajiDays: document.querySelector('[data-days="mengajiDays"]')
};

let toastTimer = null;
let weeklyHabits = [];
let weeklyRulesState = {};
let savedWeeklyRulesCache = {};

function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '⚠️', warning: '🔔' };
  toast.className = `toast ${type}`;
  toast.querySelector('.t-ico').textContent = icons[type] || icons.success;
  toastMsg.textContent = message;
  requestAnimationFrame(() => toast.classList.add('show'));

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function isPuasaHabit(name) {
  const lower = (name || '').toLowerCase();
  return lower.includes('puasa') || lower.includes('sunnah');
}

function getStatusLabel(rule) {
  if (rule.status === 'doing') {
    return isPuasaHabit(rule.name) ? '2 Hari (Senin Kamis)' : 'Mengerjakan';
  }
  return STATUS_LABELS[rule.status] || 'Otomatis';
}

function initOptionGroup(group, onChange) {
  const select = $(group.dataset.select);
  const options = Array.from(group.querySelectorAll('.option'));

  const sync = (value, animate) => {
    select.value = value;
    options.forEach((option) => {
      const selected = option.dataset.value === value;
      option.classList.toggle('is-selected', selected);
      if (selected && animate) {
        option.classList.remove('pop');
        void option.offsetWidth;
        option.classList.add('pop');
      }
    });
  };

  options.forEach((option) => {
    option.addEventListener('click', () => {
      if (select.value === option.dataset.value) return;
      sync(option.dataset.value, true);
      if (onChange) onChange(option.dataset.value);
    });
  });

  return { select, sync };
}

function setDayRow(row, values) {
  if (!row) return;
  const mode = row.dataset.mode;
  const nums = values.map(Number);
  row.querySelectorAll('.day-toggle').forEach((btn) => {
    const day = Number(btn.dataset.day);
    const active = mode === 'single' ? day === nums[0] : nums.includes(day);
    btn.classList.toggle('is-active', active);
  });
}

function getDayRow(row) {
  if (!row) return [];
  const active = Array.from(row.querySelectorAll('.day-toggle.is-active'))
    .map((btn) => Number(btn.dataset.day));
  return row.dataset.mode === 'single' ? active.slice(0, 1) : active;
}

function updateTahajudDaysState(value) {
  const disabled = (value || '').toLowerCase().includes('tidak');
  if (rows.tahajudDays) {
    rows.tahajudDays.classList.toggle('is-disabled', disabled);
    rows.tahajudDays.querySelectorAll('.day-toggle').forEach((btn) => {
      btn.disabled = disabled;
    });
  }
  tahajudDaysHint.classList.toggle('hide', !disabled);
}

function switchTab(name) {
  tabsBar.dataset.active = name;

  tabs.forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  panels.forEach((panel) => {
    const active = panel.id === `panel-${name}`;
    panel.classList.toggle('hide', !active);
    if (active) {
      panel.style.animation = 'none';
      void panel.offsetWidth;
      panel.style.animation = '';
    }
  });
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

const tahajudGroup = initOptionGroup(
  document.querySelector('[data-select="tahajudRakaat"]'),
  updateTahajudDaysState
);
const dhuhaGroup = initOptionGroup(document.querySelector('[data-select="dhuhaRakaat"]'));

dayRows.forEach((row) => {
  row.addEventListener('click', (event) => {
    const btn = event.target.closest('.day-toggle');
    if (!btn || !row.contains(btn) || btn.disabled) return;

    if (row.dataset.mode === 'single') {
      row.querySelectorAll('.day-toggle').forEach((item) => {
        item.classList.toggle('is-active', item === btn);
      });
    } else {
      btn.classList.toggle('is-active');
    }

    btn.classList.remove('pop');
    void btn.offsetWidth;
    btn.classList.add('pop');
  });
});

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(response);
    });
  });
}

function refreshHabitCard(card, rule) {
  const lowerName = rule.name.toLowerCase();
  const isFriday = lowerName.includes('jumat');
  const isPuasa = isPuasaHabit(rule.name);
  const isInactive = rule.status === 'undone' || rule.status === 'no_activity';

  if (!isPuasa && rule.status === 'other_choice') {
    rule.status = 'doing';
  }

  const isDoing = rule.status === 'doing'
    || rule.status === 'other_choice'
    || (rule.status === 'auto' && !isPuasa);
  const locked = isFriday && isDoing;

  if (locked) rule.day = 5;

  card.querySelectorAll('.habit-status .option').forEach((btn) => {
    btn.classList.toggle('is-selected', btn.dataset.value === rule.status);
  });

  const witnessGrid = card.querySelector('.habit-witness');
  witnessGrid.classList.toggle('is-disabled', isInactive);
  witnessGrid.querySelectorAll('.option').forEach((btn) => {
    btn.classList.toggle('is-selected', btn.dataset.value === rule.witness);
    btn.disabled = isInactive;
  });

  const dayRow = card.querySelector('.habit-days');
  const dayDisabled = isInactive || locked;
  dayRow.classList.toggle('is-locked', locked);
  dayRow.classList.toggle('is-disabled', isInactive);
  dayRow.querySelectorAll('.day-toggle').forEach((btn) => {
    const day = Number(btn.dataset.day);
    btn.classList.toggle('is-active', day === Number(rule.day));
    btn.disabled = dayDisabled;
  });

  const dayHint = card.querySelector('.habit-day-hint');
  if (locked) {
    dayHint.textContent = 'Sholat Jumat dikunci ke hari Jumat saat melaksanakan.';
    dayHint.classList.remove('hide');
  } else if (isInactive) {
    dayHint.textContent = 'Hari tidak diperlukan untuk status ini.';
    dayHint.classList.remove('hide');
  } else {
    dayHint.classList.add('hide');
  }

  const nameWrap = card.querySelector('.habit-name-field');
  const nameInput = card.querySelector('.habit-witness-name');
  const isParent = rule.witness === 'PARENT';

  nameWrap.classList.toggle('hide', isParent || isInactive);
  nameInput.disabled = isParent || isInactive;
  if (isParent) {
    rule.witnessName = '';
    nameInput.value = '';
  } else if (!isInactive) {
    nameInput.value = rule.witnessName || '';
  }

  const witnessHint = card.querySelector('.habit-witness-hint');
  witnessHint.textContent = isInactive
    ? 'Saksi tidak diperlukan untuk status ini.'
    : 'Jika memilih Orang Tua, nama saksi otomatis dikosongkan.';

  const summary = card.querySelector('.habit-summary');
  const statusLabel = getStatusLabel(rule);
  const dayLabel = isInactive ? '—' : (DAY_LABELS[Number(rule.day)] || 'Sab');
  const witnessLabel = isInactive ? '—' : (WITNESS_LABELS[rule.witness] || 'Orang Tua');
  summary.textContent = `${statusLabel} • ${dayLabel} • ${witnessLabel}`;
}

function toggleHabitCard(card) {
  const willOpen = !card.classList.contains('is-open');
  document.querySelectorAll('.habit-card.is-open').forEach((item) => {
    item.classList.remove('is-open');
  });
  if (willOpen) card.classList.add('is-open');
}

function renderWeeklyHabits(habits, savedRules, defaults) {
  weeklyHabits = habits;
  weeklyRulesState = { ...savedRules };
  weeklyHabitList.innerHTML = '';

  habits.forEach((habit) => {
    const saved = savedRules[habit.id]
      || Object.values(savedRules).find((rule) => normalizeName(rule.name) === normalizeName(habit.name));

    const isFriday = habit.name.toLowerCase().includes('jumat');
    const isPuasa = isPuasaHabit(habit.name);
    const rule = {
      name: habit.name,
      status: saved && saved.status ? saved.status : (defaults.status || 'auto'),
      day: saved && saved.day !== undefined
        ? Number(saved.day)
        : (isFriday ? 5 : (defaults.day !== undefined ? Number(defaults.day) : 6)),
      witness: saved && saved.witness ? saved.witness : (defaults.witness || 'PARENT'),
      witnessName: saved && saved.witnessName ? saved.witnessName : (defaults.witnessName || '')
    };

    if (!STATUS_LABELS[rule.status]) rule.status = 'auto';
    if (!isPuasa && rule.status === 'other_choice') rule.status = 'doing';
    if (!WITNESS_LABELS[rule.witness]) rule.witness = 'PARENT';

    weeklyRulesState[habit.id] = rule;

    const statusButtons = [
      { value: 'auto', label: '🤖 Otomatis' },
      { value: 'doing', label: isPuasa ? '🌙 Melaksanakan 2 Hari (Senin Kamis)' : '✅ Mengerjakan' },
      ...(isPuasa ? [{ value: 'other_choice', label: '1️⃣ Salah Satu Hari' }] : []),
      { value: 'undone', label: '🚫 Tidak Mengerjakan' },
      { value: 'no_activity', label: '💤 Tidak Ada Kegiatan' }
    ];

    const card = document.createElement('div');
    card.className = 'habit-card';
    card.dataset.habitId = habit.id;
    card.dataset.habitName = habit.name;
    card.innerHTML = `
      <button type="button" class="habit-header">
        <span class="habit-name">${escapeHtml(habit.name)}</span>
        <span class="habit-summary"></span>
        <span class="habit-chevron">▾</span>
      </button>
      <div class="habit-body">
        <div class="field-label">Status</div>
        <div class="option-grid cols-2 habit-status${isPuasa ? ' habit-status-puasa' : ''}">
          ${statusButtons.map((item) => `<button type="button" class="option" data-value="${item.value}">${item.label}</button>`).join('')}
        </div>
        <div class="field-label">Hari pelaksanaan</div>
        <div class="day-row habit-days" data-mode="single">
          ${[1, 2, 3, 4, 5, 6, 0].map((day) => `<button type="button" class="day-toggle" data-day="${day}">${DAY_LABELS[day]}</button>`).join('')}
        </div>
        <p class="card-hint habit-day-hint hide">Sholat Jumat dikunci ke hari Jumat saat melaksanakan.</p>
        <div class="field-label">Saksi</div>
        <div class="option-grid cols-2 habit-witness">
          <button type="button" class="option" data-value="PARENT">👨‍👩‍👧 Orang Tua</button>
          <button type="button" class="option" data-value="FRIEND">🧑‍🤝‍🧑 Teman</button>
          <button type="button" class="option" data-value="TEACHER">🧑‍🏫 Guru</button>
          <button type="button" class="option" data-value="OTHER">🙋 Lainnya</button>
        </div>
        <div class="name-field habit-name-field hide">
          <label>Nama Saksi</label>
          <input type="text" class="habit-witness-name" placeholder="Tulis nama saksi..." maxlength="60">
        </div>
        <p class="card-hint habit-witness-hint">Jika memilih Orang Tua, nama saksi otomatis dikosongkan.</p>
      </div>
    `;

    weeklyHabitList.appendChild(card);
    refreshHabitCard(card, rule);
  });
}

weeklyHabitList.addEventListener('click', (event) => {
  const card = event.target.closest('.habit-card');
  if (!card) return;

  const rule = weeklyRulesState[card.dataset.habitId];
  if (!rule) return;

  if (event.target.closest('.habit-header')) {
    toggleHabitCard(card);
    return;
  }

  const statusBtn = event.target.closest('.habit-status .option');
  if (statusBtn) {
    rule.status = statusBtn.dataset.value;
    refreshHabitCard(card, rule);
    return;
  }

  const dayBtn = event.target.closest('.habit-days .day-toggle');
  if (dayBtn) {
    if (dayBtn.disabled) return;
    rule.day = Number(dayBtn.dataset.day);
    refreshHabitCard(card, rule);
    return;
  }

  const witnessBtn = event.target.closest('.habit-witness .option');
  if (witnessBtn) {
    if (witnessBtn.disabled) return;
    rule.witness = witnessBtn.dataset.value;
    if (rule.witness === 'PARENT') rule.witnessName = '';
    refreshHabitCard(card, rule);
  }
});

weeklyHabitList.addEventListener('input', (event) => {
  const input = event.target.closest('.habit-witness-name');
  if (!input) return;

  const card = input.closest('.habit-card');
  const rule = weeklyRulesState[card.dataset.habitId];
  if (rule) rule.witnessName = input.value;
});

async function loadWeeklyHabits() {
  weeklyNote.textContent = 'Memuat daftar habit mingguan...';
  weeklyEmpty.classList.add('hide');
  weeklyHabitList.innerHTML = '';
  btnReloadHabits.disabled = true;

  const result = await new Promise((resolve) => {
    chrome.storage.local.get(
      ['weeklyHabitRules', 'weeklyStatus', 'weeklyDay', 'weeklyWitness', 'weeklyWitnessName'],
      resolve
    );
  });

  savedWeeklyRulesCache = result.weeklyHabitRules || {};
  const defaults = {
    status: result.weeklyStatus || 'auto',
    day: result.weeklyDay !== undefined ? Number(result.weeklyDay) : 6,
    witness: result.weeklyWitness || 'PARENT',
    witnessName: result.weeklyWitnessName || ''
  };

  let habits = [];
  let fromPage = false;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      const response = await sendMessageToTab(tab.id, { action: 'get_weekly_habits' });
      if (response && Array.isArray(response.habits) && response.habits.length > 0) {
        habits = response.habits;
        fromPage = true;
      }
    }
  } catch (error) {
    habits = [];
  }

  if (habits.length === 0) {
    habits = Object.entries(savedWeeklyRulesCache).map(([id, rule]) => ({
      id,
      name: rule.name || 'Habit Mingguan'
    }));
  }

  if (habits.length === 0) {
    weeklyNote.textContent = 'Daftar habit belum tersedia.';
    weeklyEmpty.classList.remove('hide');
    btnReloadHabits.disabled = false;
    return;
  }

  weeklyNote.textContent = fromPage
    ? `${habits.length} habit ditemukan. Klik salah satu untuk mengatur.`
    : `${habits.length} habit tersimpan. Buka halaman jurnal mingguan untuk memuat daftar terbaru.`;

  renderWeeklyHabits(habits, savedWeeklyRulesCache, defaults);
  btnReloadHabits.disabled = false;
}

btnReloadHabits.addEventListener('click', loadWeeklyHabits);

chrome.storage.local.get(
  [
    'ruleTahajud', 'ruleDhuha', 'ruleDays',
    'ruleTahajudDays', 'ruleDhuhaDays', 'ruleMengajiDays'
  ],
  (result) => {
    const legacyDays = result.ruleDays !== undefined ? result.ruleDays : ALL_DAYS;
    const tahajudValue = result.ruleTahajud || 'Tidak';

    tahajudGroup.sync(tahajudValue, false);
    dhuhaGroup.sync(result.ruleDhuha || '4 Rakaat', false);
    updateTahajudDaysState(tahajudValue);

    setDayRow(rows.tahajudDays, result.ruleTahajudDays !== undefined ? result.ruleTahajudDays : legacyDays);
    setDayRow(rows.dhuhaDays, result.ruleDhuhaDays !== undefined ? result.ruleDhuhaDays : legacyDays);
    setDayRow(rows.mengajiDays, result.ruleMengajiDays !== undefined ? result.ruleMengajiDays : legacyDays);
  }
);

loadWeeklyHabits();

btnSave.addEventListener('click', () => {
  for (const habit of weeklyHabits) {
    const rule = weeklyRulesState[habit.id];
    if (!rule) continue;

    const isInactive = rule.status === 'undone' || rule.status === 'no_activity';
    if (!isInactive && rule.witness !== 'PARENT' && !(rule.witnessName || '').trim()) {
      switchTab('weekly');

      const card = Array.from(weeklyHabitList.querySelectorAll('.habit-card'))
        .find((item) => item.dataset.habitId === habit.id);

      if (card) {
        document.querySelectorAll('.habit-card.is-open').forEach((item) => {
          item.classList.remove('is-open');
        });
        card.classList.add('is-open');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = card.querySelector('.habit-witness-name');
        if (input) setTimeout(() => input.focus(), 200);
      }

      showToast(`Isi nama saksi untuk "${habit.name}" dulu ya!`, 'error');
      return;
    }
  }

  const settings = {
    ruleTahajud: tahajudSelect.value,
    ruleDhuha: dhuhaSelect.value,
    ruleTahajudDays: getDayRow(rows.tahajudDays),
    ruleDhuhaDays: getDayRow(rows.dhuhaDays),
    ruleMengajiDays: getDayRow(rows.mengajiDays)
  };

  if (weeklyHabits.length > 0 || Object.keys(savedWeeklyRulesCache).length > 0) {
    settings.weeklyHabitRules = weeklyRulesState;
  }

  chrome.storage.local.set(settings, () => {
    btnSave.classList.add('saved');
    btnSave.innerHTML = '<span>🎉</span> Tersimpan!';
    showToast('Pengaturan berhasil disimpan', 'success');
    burstConfetti();

    setTimeout(() => {
      document.body.style.transition = 'opacity .2s ease, transform .2s ease';
      document.body.style.opacity = '0';
      document.body.style.transform = 'scale(.98)';
      setTimeout(() => { window.location.href = 'popup.html'; }, 180);
    }, 850);
  });
});

function goBack() {
  document.body.style.transition = 'opacity .18s ease, transform .18s ease';
  document.body.style.opacity = '0';
  document.body.style.transform = 'scale(.98)';
  setTimeout(() => { window.location.href = 'popup.html'; }, 160);
}

btnBack.addEventListener('click', goBack);
btnBackBottom.addEventListener('click', goBack);

function burstConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const colors = ['#5ce1e6', '#ffd93d', '#ff6b9d', '#b39ddb', '#4ade80'];
  const count = 28;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = `${0.9 + Math.random() * 0.8}s`;
    piece.style.animationDelay = `${Math.random() * 0.25}s`;
    piece.style.width = `${5 + Math.random() * 6}px`;
    piece.style.height = `${5 + Math.random() * 6}px`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 2200);
  }
}
