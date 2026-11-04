# Jurnal Helper

Jurnal Helper adalah ekstensi browser untuk membantu mengisi jurnal harian dan mingguan secara otomatis di [Kejar.id](https://app.kejar.id). Ekstensi ini dibuat menggunakan Chrome Extensions Manifest V3 dan tidak memerlukan proses build atau instalasi dependency.

## Fitur

- Mengisi jurnal harian secara otomatis.
- Mengisi jurnal mingguan secara otomatis.
- Mengatur hari pelaksanaan terpisah untuk shalat malam, dhuha, dan mengaji.
- Pilihan hari shalat malam otomatis dinonaktifkan saat memilih "Tidak".
- Mengatur status, hari, jenis saksi, dan nama saksi secara terpisah untuk setiap habit jurnal mingguan.
- Pilihan status mingguan: otomatis, mengerjakan, melaksanakan 2 hari (khusus Puasa Sunnah), salah satu hari (khusus Puasa Sunnah), tidak mengerjakan, dan tidak ada kegiatan.
- Status tidak mengerjakan atau tidak ada kegiatan otomatis menonaktifkan pilihan hari dan saksi.
- Sholat Jumat otomatis terkunci pada hari Jumat saat berstatus melaksanakan.
- Memilih saksi Orang Tua otomatis mengosongkan nama saksi.
- Memilih kecepatan proses: Instan, Cepat, atau Normal.
- Suara chime saat jurnal harian atau mingguan selesai dikerjakan.
- Menonaktifkan ekstensi atau menghentikan proses yang sedang berjalan.
- Menyimpan status aktif dan pilihan kecepatan di penyimpanan browser.

## Persyaratan

- Google Chrome, Microsoft Edge dan Brave versi terbaru.
- Akun dan akses ke `https://app.kejar.id`.
- Git, jika ingin meng-clone project.

## Clone project

Ganti URL contoh di bawah dengan URL repository GitHub project ini:

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
```

Jika repository bersifat privat, pastikan akun GitHub Anda memiliki akses. Setelah proses clone selesai, folder tersebut berisi file ekstensi yang akan dimuat ke browser.

## Memasang ke Chrome

1. Clone project atau unduh repository sebagai ZIP, lalu ekstrak jika diperlukan.
2. Buka `chrome://extensions` di Chrome.
3. Aktifkan **Developer mode** di bagian kanan atas.
4. Klik **Load unpacked**.
5. Pilih folder project yang berisi `manifest.json`.
6. Pastikan **Jurnal Helper by Bonsap** muncul dalam daftar ekstensi.

## Memasang ke Microsoft Edge

1. Buka `edge://extensions` di Edge.
2. Aktifkan **Developer mode**.
3. Klik **Load unpacked**.
4. Pilih folder project yang berisi `manifest.json`.

## Menggunakan ekstensi

1. Buka dan masuk ke `https://app.kejar.id`.
2. Buka halaman yang memuat tabel jurnal harian atau mingguan.
3. Klik ikon Jurnal Helper di toolbar browser.
4. Pastikan sakelar **Status** dalam keadaan aktif, lalu pilih kecepatan proses.
5. Klik **Jurnal Harian** atau **Jurnal Mingguan** sesuai kebutuhan.
6. Untuk menghentikan proses, buka popup ekstensi dan klik **Berhenti**.
7. Setelah proses selesai, periksa kembali entri jurnal di Kejar.id.

Ekstensi hanya berjalan pada halaman `https://app.kejar.id/*`. Jika tombol tidak bekerja setelah ekstensi dipasang atau diperbarui, muat ulang halaman Kejar.id lalu coba lagi.

## Struktur file

- `manifest.json`: konfigurasi ekstensi, izin, dan halaman tempat content script dijalankan.
- `content.js`: otomatisasi pengisian jurnal harian dan mingguan pada halaman Kejar.id.
- `popup.html`: tampilan popup ekstensi.
- `popup.js`: pengaturan status, pilihan kecepatan, dan kontrol proses dari popup.

## Jika ekstensi macet

1. Buka popup ekstensi dan klik **Berhenti**.
2. Tekan **Ctrl + Shift + R** untuk refresh halaman Kejar.id.
3. Jalankan ulang jurnal. Entri yang belum terisi akan diproses kembali.

## Catatan

Ekstensi mengisi data berdasarkan aturan otomatis di dalam kode. Tinjau kembali pilihan dan hasil jurnal sebelum mengandalkannya sebagai catatan final. Perubahan pada tampilan atau struktur halaman Kejar.id dapat menyebabkan otomatisasi tidak berjalan sebagaimana mestinya.

# JANGAN LUPA STAR REPO INI!!!
Fitur **Auto Lintas Minggu** untuk sementara dinonaktifkan dan dapat diaktifkan kembali melalui flag `AUTO_NEXT_WEEK_ENABLED` di `popup.js` dan `content.js`.
