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

// LOGIKA HARIAN
async function jalankanDenganKontrol(speedMode) {
  let delay = 200;
  if (speedMode === "normal") delay = 600;
  if (speedMode === "instant") delay = 0;

  const allCells = Array.from(document.querySelectorAll('.column-daily-habit[data-date]'));
  if (allCells.length === 0) {
    alert("Tidak ditemukan tabel jurnal harian di halaman ini.");
    return;
  }

  const dates = [...new Set(allCells.map(c => c.getAttribute('data-date')))];
  
  for (let d = 0; d < dates.length; d++) {
    if (stopProcess) break;
    const date = dates[d];

    const editBtn = document.querySelector(`.daily-habit-edit-button[data-date="${date}"]`);
    if (editBtn) {
      editBtn.click();
      await sleep(delay > 0 ? delay : 30);
    }

    if (stopProcess) break;

    const cellsForDay = Array.from(document.querySelectorAll(`.column-daily-habit[data-date="${date}"]`));
    const unfiled = cellsForDay.filter(cell => {
      const caption = cell.querySelector('.button-dropdown-caption');
      const dropdownDiv = cell.querySelector('.dropdown');
      return (caption && caption.textContent.trim() === "Isi") || (dropdownDiv && !dropdownDiv.classList.contains('d-none'));
    });

    for (let i = 0; i < unfiled.length; i++) {
      if (stopProcess) break;
      const cell = unfiled[i];
      
      const tr = cell.closest('tr');
      let habitName = "";
      if (tr) {
        const td = tr.querySelector('td');
        if (td) habitName = td.textContent.toLowerCase();
      }
      const groupAttr = cell.getAttribute('data-group') || "";
      const textInfo = (habitName + " " + groupAttr).toLowerCase();

      const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
      const isFriday = (dayOfWeek === 5);

      const trigger = cell.querySelector('.button-dropdown-caption, [data-toggle="dropdown"]') || cell;
      trigger.click();
      await sleep(delay > 0 ? 200 : 30); 

      const dropdownMenu = cell.querySelector('.dropdown-menu') || document.querySelector('.dropdown-menu.show');
      if (dropdownMenu) {
        const items = Array.from(dropdownMenu.querySelectorAll('.dropdown-item'));
        let targetItem = null;

        if (textInfo.includes("dhuha")) {
          targetItem = items.find(el => el.textContent.includes("4 Rakaat"));
        } else if (textInfo.includes("tidur")) {
          targetItem = items.find(el => el.textContent.includes("22.00"));
        } else if (textInfo.includes("bangun")) {
          targetItem = items.find(el => el.textContent.includes("05.00") || el.textContent.includes("5.00"));
        } else if (textInfo.includes("malam") || textInfo.includes("tahajud")) {
          targetItem = items.find(el => el.textContent.includes("Tidak"));
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
          clickModalOption(modalContent, 'input[data-category="Tidak Melaksanakan"], input[data-point="0"]', "Tidak Melaksanakan");
        } else if (titleText.includes("dhuha")) {
          clickModalOption(modalContent, 'input[data-category="4 Rakaat"], input[data-point="4"]', "4 Rakaat");
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
    alert("Selesai! Seluruh jurnal harian berhasil diisi.");
  } else {
    alert("Proses harian dihentikan.");
  }
}

// LOGIKA MINGGUAN DENGAN FITUR AUTO NEXT WEEK
async function jalankanMingguanLintasMinggu(speedMode, autoNext) {
  let weekLoopCount = 0;
  const maxWeeks = 10; // Batas aman maksimal perpindahan minggu

  while (weekLoopCount < maxWeeks && !stopProcess) {
    // 1. Jalankan pengisian mingguan untuk minggu yang sedang aktif di layar
    await jalankanMingguanOtomatis(speedMode);

    if (stopProcess) break;

    // 2. Jika opsi "Auto Next Week" tidak dicentang, cukup jalankan 1 minggu lalu berhenti
    if (!autoNext) {
      break;
    }

    // 3. Cari tombol "Minggu Selanjutnya" (`#next-week`)
    const nextWeekBtn = document.querySelector('#next-week');
    if (!isVisible(nextWeekBtn)) {
      break; // Jika tombol tidak ada atau tersembunyi, akhiri proses
    }

    // Klik tombol ke minggu selanjutnya
    nextWeekBtn.click();
    
    // Tunggu halaman atau tabel mingguan termuat ulang
    await sleep(1500);
    weekLoopCount++;
  }

  if (!stopProcess) {
    alert("Selesai! Seluruh jurnal mingguan (termasuk lintas minggu) berhasil diisi otomatis.");
  } else {
    alert("Proses mingguan dihentikan.");
  }
}

// Inti Proses Pengisian 1 Minggu
async function jalankanMingguanOtomatis(speedMode) {
  let delay = 400;
  if (speedMode === "normal") delay = 1000;
  if (speedMode === "instant") delay = 120;

  let safetyCounter = 0;
  const maxItems = 20;

  while (!stopProcess && safetyCounter < maxItems) {
    const link = document.querySelector('#render-habituation-weekly a.habit-weekly');
    if (!link) {
      break; // Selesai jika tidak ada link "Isi Jurnal" lagi di minggu ini
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

    // STEP 1: Laporan
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

    // STEP 2: Tanggal / Hari
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

    // STEP 3: Saksi (Orang Tua / PARENT)
    const parentWitness = modal.querySelector('input[name="witness_type"][value="PARENT"]');
    if (parentWitness) {
      parentWitness.click();
      parentWitness.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await sleep(delay);

    // STEP 4: Simpan
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