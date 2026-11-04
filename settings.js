const tahajudSelect = document.getElementById('tahajudRakaat');
const dhuhaSelect = document.getElementById('dhuhaRakaat');
const dayCheckboxes = document.querySelectorAll('input[name="days"]');
const btnSave = document.getElementById('btnSaveSettings');
const btnBack = document.getElementById('btnBack');

chrome.storage.local.get(['ruleTahajud', 'ruleDhuha', 'ruleDays'], (result) => {
  if (result.ruleTahajud) tahajudSelect.value = result.ruleTahajud;
  if (result.ruleDhuha) dhuhaSelect.value = result.ruleDhuha;
  if (result.ruleDays) {
    dayCheckboxes.forEach(cb => {
      cb.checked = result.ruleDays.includes(parseInt(cb.value));
    });
  }
});

btnSave.addEventListener('click', () => {
  const selectedDays = Array.from(dayCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => parseInt(cb.value));

  const settings = {
    ruleTahajud: tahajudSelect.value,
    ruleDhuha: dhuhaSelect.value,
    ruleDays: selectedDays
  };

  chrome.storage.local.set(settings, () => {
    showNeoAlert("Pengaturan kustom berhasil disimpan!", "success");
    window.location.href = 'popup.html';
  });
});

btnBack.addEventListener('click', () => {
  window.location.href = 'popup.html';
});