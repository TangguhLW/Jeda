# Jeda

Website penghitung selisih hari dan waktu, tanggal tersimpan, serta pengingat.

Snapshot sumber terbaru yang tersedia pada 27 Oktober 2026. Versi: **2026-10-27**.

## Dokumentasi proyek

# Jeda

Website lokal untuk bertanya tentang selisih waktu sampai detik, menyimpan tanggal, membuat pengingat, dan membuka riwayat tanpa login. Desain Liquid Workspace, tema light/dark dengan circular reveal, dan indikator navigasi Framer Motion tetap dipakai.

## Menjalankan

1. `npm install`
2. `npm run dev`
3. Buka http://127.0.0.1:4796/

Server pengembangan sudah menyertakan API Gemini; tidak perlu menjalankan server kedua. Untuk build produksi lokal: `npm run build`, hentikan server pengembangan, lalu `npm start`. Node 22.6+ diperlukan; proyek ini diuji dengan Node 24. Server produksi default hanya mendengarkan 127.0.0.1.

## Mengisi API key Gemini

File `.env.local` sudah disiapkan dengan key kosong dan diabaikan Git. Isi sendiri:

```dotenv
GEMINI_API_KEY=isi_key_kamu_di_sini
GEMINI_MODEL=gemini-3.1-flash-lite
```

Restart `npm run dev` atau `npm start` setelah mengubahnya. Jika file itu belum ada pada salinan proyek lain, salin `.env.example` menjadi `.env.local`. Jangan gunakan awalan `VITE_` untuk key. Model dapat diganti ke model Gemini yang mendukung structured output dan tersedia untuk key kamu.

Key dibaca oleh server dan dikirim lewat header autentikasi Google, sesuai [panduan API key resmi](https://ai.google.dev/gemini-api/docs/api-key). Browser hanya memanggil `/api/interpret`. Endpoint `/api/status` mengembalikan apakah key terisi, bukan key atau hasil pemeriksaan akses Google. Key tidak disimpan di browser atau dimasukkan ke bundle.

Pertanyaan dengan dua tanggal yang sudah dipahami dihitung lokal. Pertanyaan yang lebih bebas diteruskan ke Gemini dengan konteks waktu saat ditanyakan. Google hanya menerima pertanyaan itu dan konteks waktu; riwayat, tanggal tersimpan, dan pengingat tidak ikut dikirim. Koneksi Gemini nyata sudah diuji dengan pertanyaan tanggal singkat. Tes otomatis memakai provider simulasi agar tidak menggunakan kuota key.

Gemini diminta mengembalikan dua endpoint tanggal/waktu dengan [structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output?hl=en), bukan angka durasi. Server dan browser memvalidasi endpoint, lalu aplikasi menghitung hari/jam/menit/detik. Jika pertanyaannya ambigu, Gemini diminta mengajukan klarifikasi. Interpretasi bahasa AI tetap perlu dilihat pengguna; tanggal/waktu hasil interpretasi dan asumsi ditampilkan di jawaban.

Contoh setelah key aktif: “dari kemarin sore sampai sekarang berapa lama?”, “100 hari dari hari ini jatuh tanggal berapa?”, atau “berapa umurku kalau lahir 7 Juli 2000?”. Tanggal pribadi yang tidak disebut tidak boleh ditebak.

Tanpa key, dua tanggal lengkap tetap berjalan. Jika key salah, kuota habis, respons tidak valid, atau layanan lambat, aplikasi menampilkan pesan dan mempertahankan pertanyaan. API lokal membatasi ukuran permintaan dan 15 interpretasi per menit per alamat; batas ini untuk satu proses, bukan sistem kuota untuk deployment publik berskala besar.

## Sidebar dan data pribadi

- **Beranda:** pertanyaan dan jawaban, serta tindakan menyimpan tanggal akhir atau membuat pengingat.
- **Tanggal tersimpan:** tambah tanggal/waktu sampai detik dan zona waktu, cari, hitung dari sekarang, jadikan pengingat, atau hapus.
- **Pengingat:** tambah pengingat, status menunggu/waktunya tiba/selesai, izin notifikasi opsional, dan hapus.
- **Riwayat:** otomatis menyimpan setiap pertanyaan saat dikirim, termasuk jawaban, klarifikasi, kegagalan, atau permintaan yang belum selesai. Bisa dicari, dibuka lagi, dan dihapus. Membuka riwayat tidak memanggil Gemini lagi.
- **Kalkulator lengkap:** versi kalkulator sebelumnya tetap ada di `/kalkulator`, termasuk penyimpanan hitungannya yang lama.

Semua data pribadi disimpan di localStorage browser ini, tanpa akun. Tab pada alamat aplikasi yang sama saling memperbarui. Perangkat atau alamat/port berbeda tidak berbagi data. Menghapus data situs menghapus simpanan. Bila penyimpanan penuh/tidak diizinkan, pesan kegagalan ditampilkan; aplikasi tidak mengklaim berhasil menyimpan. Data rusak tidak ditimpa otomatis.

## Cara pengingat bekerja

Pemeriksaan waktu berjalan saat tab Jeda terbuka, dengan interval sekitar satu detik dan pemeriksaan saat kembali ke tab. Pengingat yang lewat ketika tab ditutup muncul saat aplikasi dibuka kembali. Izin notifikasi diminta hanya ketika pengguna menekan **Aktifkan notifikasi**. Tanpa izin atau dukungan browser, pemberitahuan tetap ada di dalam Jeda.

Ini bukan pengingat latar belakang ketika browser ditutup. Browser, tab di latar belakang, atau perangkat tidur dapat menunda pemberitahuan. Pengingat yang sudah dipicu disimpan sebagai “Waktunya tiba” agar tidak dipicu berulang saat refresh. Tidak ada email, push server, atau service worker.

## Aturan waktu

Tanggal tanpa jam memakai 00:00:00. Default WIB; WIB, WITA, WIT, dan UTC didukung. Jika salah satu tahun tidak ditulis, parser lokal menggunakan tahun dari tanggal lainnya dan menjelaskannya. Jika keduanya tanpa tahun, aplikasi meminta tahun. Selisih negatif ditampilkan positif dengan catatan urutan terbalik. Durasi adalah selisih waktu tepat; kalender inklusif tersedia terpisah di kalkulator lengkap.

Contoh: 7 Juli 2024 08:15:30 WIB → 26 Oktober 2026 14:45:50 WIB = 841 hari, 6 jam, 30 menit, 20 detik, atau 72.685.820 detik.

## Verifikasi

- `npm run build`: TypeScript + Vite build.
- `npm test`: tes browser Chrome, perhitungan, penyimpanan, pengingat, antarmuka, dan integrasi klien dengan respons Gemini simulasi.
- `npm run test:api`: tes server memakai provider simulasi; tidak memerlukan key atau menghubungi Google.
- `node record-personal.mjs`: bukti tampilan dengan data sintetis dalam konteks browser uji terpisah, tidak mengubah simpanan browser pengguna.

Laporan di `evidence/VERIFICATION.md`, screenshot `evidence/personal-*.png`, rekaman `recordings/personal-1440.webm` dan `recordings/personal-390.webm`. Reference pack asli tetap tersedia di `reference-pack/`.

Koneksi Gemini nyata telah diuji. Safari, perangkat fisik, keyboard virtual, notifikasi pada perangkat nyata, dan perangkat tidur belum diuji.

## Palet pastel dan animasi

Toggle bulat dua warna di samping tombol light/dark mengganti pink pastel ↔ biru pastel. Pilihan tersimpan di `jeda-palette`; tema dan warna independen, termasuk pada kalkulator lengkap. Ini perubahan palet yang diminta pengguna; reference pack monokrom asli tetap utuh.

Latar memakai tiga pita kaca besar dengan transform CSS yang berulang mulus (26–34 detik), di lapisan dekoratif terpisah dari teks. Ikon jam pasir Jeda berputar penuh 12 detik. Judul “Berapa lama di antaranya?” mengetik 1,55 detik, bertahan 3,2 detik, menghapus 0,8 detik, lalu jeda 0,35 detik. Layout judul dipesan tetap dan accessible name statis; kursor | hanya dekorasi.

Tombol panah textarea memakai tint transparan, rim, inset highlight/crease, shadow, dan backdrop refraction di pseudo-element. Teks/ikon tidak diblur. Kontrol palet 46px mempertahankan target lebih dari 44px saat feedback tekan.

Loop berhenti saat tab tersembunyi; latar juga berhenti saat di luar viewport. Reduced motion menampilkan judul utuh serta menonaktifkan gerak dekoratif, termasuk ketika preferensinya diubah saat aplikasi terbuka.

Bukti: `recordings/ambient-pastel-1440.webm`, `recordings/ambient-pastel-390.webm`, screenshot `evidence/ambient-*.png`, dan `evidence/pastel-contrast.json`. Kontras token solid minimum 5,59:1 untuk teks muted; bukan audit setiap piksel material kaca. Rekaman bukan benchmark FPS perangkat fisik.

## Deployment Vercel

Konfigurasi Vercel tersedia pada `vercel.json`; frontend dibangun ke dist dan endpoint api/status.mjs serta api/interpret.mjs berjalan sebagai Node.js Functions. Adapter Web Request mengalirkan body ke handler Gemini yang sama dengan server lokal. Tes adapter ada dalam `npm run test:api`.

Paket upload terpilih ada di `deployment/jeda.zip`, tanpa .env.local, node_modules, data pribadi browser, reference pack, atau rekaman. Key harus dipasang sebagai environment variable server GEMINI_API_KEY dan GEMINI_MODEL di Vercel, tidak dimasukkan ke ZIP. Data localStorage pada localhost tidak otomatis pindah ke alamat publik karena alamat situs berbeda.

## Deployment aktif

Production: https://jeda-setiap-hari-berarti.vercel.app/

Workspace THANG, project jeda-setiap-hari-berarti. Frontend Vite dan kedua endpoint API berjalan di Vercel. GEMINI_API_KEY tersimpan sebagai Secret Production dan GEMINI_MODEL sebagai Config Production. Pembaruan env memerlukan redeploy. Jangan mengunggah .env.local ketika memperbarui source.

Pemeriksaan live dicatat di evidence/vercel-live.json; skrip verify-production.mjs memeriksa route, ketersediaan env, kebocoran key pada aset frontend, serta satu interpretasi tanggal nyata. Skrip ini menghubungi Gemini menggunakan konfigurasi server dan dapat menggunakan kuota API, sehingga tidak dimasukkan ke tes otomatis.
