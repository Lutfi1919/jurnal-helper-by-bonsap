// Fungsi untuk menampilkan pop-up Neo Brutalism yang estetik
function showNeoAlert(message, type = "success") {
  // Hapus alert lama jika masih ada
  const existingModal = document.getElementById('neo-brutalist-modal');
  if (existingModal) existingModal.remove();

  // Tentukan warna tema berdasarkan jenis pesan
  let bgColor = "#00f0ff"; // Cyan untuk sukses
  let titleText = "BERHASIL! 🎉";
  if (type === "error") {
    bgColor = "#ff5757"; // Merah untuk error/stop
    titleText = "INFO 🛑";
  } else if (type === "warning") {
    bgColor = "#ffde59"; // Kuning untuk peringatan
    titleText = "PERHATIAN ⚠️";
  }

  // Buat kontainer utama overlay
  const overlay = document.createElement('div');
  overlay.id = 'neo-brutalist-modal';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  // Buat kotak dialog pop-up
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background-color: ${bgColor};
    border: 4px solid #111;
    border-radius: 8px;
    box-shadow: 5px 5px 0px #111;
    padding: 20px 24px;
    width: 320px;
    text-align: center;
    animation: neoPop 0.2s ease-out;
  `;

  dialog.innerHTML = `
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
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 3px 3px 0px #111;
      transition: transform 0.1s, box-shadow 0.1s;
    ">OKE MENGERTI</button>
  `;

  // Efek tombol saat diklik
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const okBtn = document.getElementById('neo-ok-btn');
  okBtn.addEventListener('mousedown', () => {
    okBtn.style.transform = 'translate(2px, 2px)';
    okBtn.style.boxShadow = 'none';
  });
  okBtn.addEventListener('click', () => {
    overlay.remove();
  });
}

// dont touch this code above, it's for the alert pop-up design

let stopProcess = false;

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
    chrome.storage.local.get(['ruleTahajud', 'ruleDhuha', 'ruleDays'], (result) => {
      resolve({
        tahajud: result.ruleTahajud || "Tidak",
        dhuha: result.ruleDhuha || "4 Rakaat",
        allowedDays: result.ruleDays !== undefined ? result.ruleDays : [0, 1, 2, 3, 4, 5, 6] // Default semua hari
      });
    });
  });
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "jalankan_otomatis") {
    stopProcess = false;
    chrome.storage.local.get(['extensionActive'], async (result) => {
      const isActive = result.extensionActive !== false; 
      if (!isActive) {
        alert("Ekstensi sedang dalam posisi OFF!");
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
        alert("Ekstensi sedang dalam posisi OFF!");
        chrome.runtime.sendMessage({ action: "proses_selesai" });
        return;
      }
      
      await jalankanMingguanLintasMinggu(request.speed, request.autoNext);
      chrome.runtime.sendMessage({ action: "proses_selesai" });
    });
    sendResponse({ status: "started" });
  } else if (request.action === "hentikan_proses") {
    stopProcess = true;
    sendResponse({ status: "stopped" });
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
    alert("Tidak ditemukan tabel jurnal harian di halaman ini.");
    return;
  }

  const dates = [...new Set(allCells.map(c => c.getAttribute('data-date')))];
  
  for (let d = 0; d < dates.length; d++) {
    if (stopProcess) break;
    const date = dates[d];

    // Cek apakah hari ini termasuk dalam hari yang dipilih di pengaturan kustom
    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (!rules.allowedDays.includes(dayOfWeek)) {
      continue; // Lewati hari yang tidak dicentang
    }

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
      
      const tr = cell.closest('tr');
      let habitName = "";
      if (tr) {
        const td = tr.querySelector('td');
        if (td) habitName = td.textContent.toLowerCase();
      }
      const groupAttr = cell.getAttribute('data-group') || "";
      const textInfo = (habitName + " " + groupAttr).toLowerCase();

      const isFriday = (dayOfWeek === 5);

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
          if (isFriday) {
            targetItem = items.find(el => el.textContent.includes("Melaksanakan"));
          } else {
            targetItem = items.find(el => el.textContent.includes("Tidak melaksanakan") || el.textContent.includes("Tidak"));
          }
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
          if (isFriday) {
            clickModalOption(modalContent, 'input[data-category="Melaksanakan"], input[data-point="1"]', "Melaksanakan");
          } else {
            clickModalOption(modalContent, 'input[data-category="Tidak Melaksanakan"], input[data-point="0"]', "Tidak Melaksanakan");
          }
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
    showNeoAlert("Seluruh jurnal harian berhasil diisi dan diperbarui dengan sempurna!", "success");
  } else {
    showNeoAlert("Proses pengisian jurnal berhasil dihentikan.", "error");
  }
}

// LOGIKA MINGGUAN LINTAS MINGGU
async function jalankanMingguanLintasMinggu(speedMode, autoNext) {
  let weekLoopCount = 0;
  const maxWeeks = 10;

  while (weekLoopCount < maxWeeks && !stopProcess) {
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
    showNeoAlert("Seluruh jurnal mingguan berhasil diisi dan diperbarui dengan sempurna!", "success");
  } else {
    showNeoAlert("Proses pengisian jurnal berhasil dihentikan.", "error");
  }
}

async function jalankanMingguanOtomatis(speedMode) {
  let delay = 400;
  if (speedMode === "normal") delay = 1000;
  if (speedMode === "instant") delay = 120;

  let safetyCounter = 0;
  const maxItems = 20;

  while (!stopProcess && safetyCounter < maxItems) {
    const link = document.querySelector('#render-habituation-weekly a.habit-weekly');
    if (!link) {
      break;
    }

    const tr = link.closest('tr');
    const habitName = tr ? tr.textContent.trim().toLowerCase() : "";

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

    if (habitName.includes("puasa") || habitName.includes("sunnah")) {
      const undoneRadio = modal.querySelector('input[name="radioCategory"][data-type="undone"], input[value="tidak melaksanakan"]');
      if (undoneRadio) {
        undoneRadio.click();
        undoneRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      const doingRadio = modal.querySelector('input[name="radioCategory"][data-type="doing"], input[value="melaksanakan"]');
      if (doingRadio) {
        doingRadio.click();
        doingRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    await sleep(delay);

    const dayRadios = Array.from(modal.querySelectorAll('input[name="dateWeekly"]'));
    if (dayRadios.length > 0) {
      let targetDayRadio = null;

      if (habitName.includes("sholat jumat") || habitName.includes("jumat")) {
        targetDayRadio = dayRadios.find(input => {
          const dateStr = input.getAttribute('data-date');
          return new Date(`${dateStr}T00:00:00Z`).getUTCDay() === 5;
        });
      } else {
        const weekendRadios = dayRadios.filter(input => {
          const dateStr = input.getAttribute('data-date');
          const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
          return day === 6 || day === 0;
        });
        if (weekendRadios.length > 0) {
          targetDayRadio = weekendRadios[Math.floor(Math.random() * weekendRadios.length)];
        }
      }

      if (!targetDayRadio) {
        targetDayRadio = dayRadios[0];
      }

      if (targetDayRadio) {
        targetDayRadio.click();
        targetDayRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    await sleep(delay);

    const parentWitness = modal.querySelector('input[name="witness_type"][value="PARENT"]');
    if (parentWitness) {
      parentWitness.click();
      parentWitness.dispatchEvent(new Event('change', { bubbles: true }));
    }
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