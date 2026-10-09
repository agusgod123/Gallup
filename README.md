# Survei Keterlibatan Pegawai BP Besakih

Web app survei anonim dengan kode akses sekali pakai. Pegawai mengisi lewat HP, jawaban masuk ke Google Sheet, dan dasbor skor dibuat dari menu di Sheet.

| File | Fungsi | Dipasang di |
|---|---|---|
| `index.html` | Halaman survei yang dibuka pegawai | Vercel atau GitHub Pages |
| `apps-script/Code.gs` | API penyimpan jawaban + menu Survei (kode akses, slip, dasbor) | Apps Script di Google Sheet |

## Yang perlu disiapkan

- Akun Google yang boleh men-deploy web app dengan akses "Anyone". Akun kantor lebih baik supaya datanya milik lembaga.
- Akun GitHub dan Vercel (atau GitHub Pages).
- Daftar unit kerja yang sudah digabung supaya tiap kelompok berisi minimal 5 orang.
- Jumlah pegawai yang akan mengisi, dan printer untuk slip kode.

## 1. Pasang backend (Google Sheet + Apps Script)

1. Buat Google Sheet baru, misalnya "Survei Keterlibatan Pegawai 2026".
2. Buka **Extensions > Apps Script**. Hapus isi `Code.gs` bawaan, tempel seluruh isi `apps-script/Code.gs`, lalu simpan.
3. Kembali ke Sheet dan reload. Menu **Survei** muncul. Jalankan **Survei > 1. Siapkan sheet**.
   Saat diminta izin, pilih akun, klik **Advanced > Go to … (unsafe) > Allow**. Ini normal untuk script buatan sendiri.
4. Buka sheet **Pengaturan** dan ganti **Unit kerja** (sel kuning). Periksa juga judul, masa kerja, dan dua pertanyaan terbuka.
5. Periksa sheet **Kuesioner**. Teks pernyataan boleh diubah kapan saja sebelum survei disebar. Kode butir (BN01, IC01, dst.) jangan diubah setelah ada respons.
6. Di editor Apps Script: **Deploy > New deployment > ikon gir > Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**

   Klik Deploy, lalu salin **Web app URL** yang berakhiran `/exec`.

## 2. Pasang halaman survei

1. Buka `index.html`, cari baris `const API_URL = ...`, ganti dengan URL `/exec` tadi.
2. Buat repo GitHub baru (misalnya `survei-keterlibatan`) dan unggah `index.html` ke root repo.
3. Di Vercel: **Add New > Project**, import repo, Framework Preset **Other**, lalu Deploy.
   Alternatif GitHub Pages: **Settings > Pages > Deploy from a branch**, pilih `main` dan folder root.
4. Salin alamat halaman (misalnya `https://survei-keterlibatan.vercel.app`) ke **Pengaturan > URL survei**. Alamat ini dicetak di slip.

## 3. Uji coba sebelum disebar

1. **Survei > 2. Buat kode akses**, isi `2`.
2. Buka halaman survei dari HP dan isi sampai terkirim. Sheet **Respon** harus bertambah satu baris dan status kode di sheet **Kode** berubah jadi TERPAKAI.
3. Jalankan **Survei > Perbarui dasbor** dan periksa sheet **Dasbor**.
4. Hapus data uji: hapus baris respons di sheet Respon (baris judul jangan dihapus), lalu hapus dua kode uji di sheet Kode.

## 4. Sebar survei

1. **Survei > 2. Buat kode akses** sejumlah pegawai ditambah sekitar 10% cadangan.
2. **Survei > 3. Buat slip kode untuk dicetak**, lalu **File > Cetak** (pilih lembar saat ini) dan gunting.
3. Masukkan slip ke kotak, kocok, dan biarkan pegawai mengambil sendiri. **Jangan mencatat siapa mendapat kode apa.** Anonimitas survei ini bergantung pada langkah ini.
4. Sebaiknya pimpinan membuka survei dengan menjelaskan tujuannya: mengukur kondisi kerja, bukan menilai orang.

Tips:
- Tautan bisa membawa kode langsung, misalnya `https://survei-keterlibatan.vercel.app/?kode=ABC234`, supaya kolom kode terisi otomatis.
- Untuk pegawai tanpa HP, siapkan satu tablet atau laptop bersama. Isian terhapus dari perangkat setelah terkirim, dan isian yang ditinggal di tengah jalan kedaluwarsa setelah 12 jam.

## 5. Selama dan sesudah survei

- Pantau partisipasi lewat **Survei > Perbarui dasbor** (baris "Partisipasi").
- Untuk menutup survei, ubah **Pengaturan > Status survei** menjadi `TUTUP`.
- Laporan ke pimpinan: unduh sheet Dasbor sebagai PDF (**File > Download > PDF**, pilih lembar saat ini). **Bagikan dasbornya, bukan file Sheet-nya.** Sheet Respon memuat unit, masa kerja, dan jawaban; di unit kecil kombinasi ini bisa mengarah ke orang tertentu.

## Cara membaca dasbor

- **% favorable**: persentase jawaban 4 atau 5. Lebih mudah dibaca pimpinan daripada rata-rata.
- **Indeks (0–100)**: (rata-rata − 1) ÷ 4 × 100. Rata-rata 3,8 berarti indeks 70.
- **Kategori**: Kuat 75% ke atas, Perlu perhatian 50–74%, Prioritas di bawah 50%.
- Susun perbaikan mulai dari dimensi paling dasar (Basic Needs, lalu Individual Contribution, Teamwork, Growth). Skor Growth yang tinggi tidak banyak artinya kalau Basic Needs masih rendah.
- Kelompok dengan responden di bawah batas minimal ditampilkan sebagai `n<5`, terutama penting untuk Leadership yang di unit kecil praktis menilai satu orang.
- Baris "Diisi kurang dari 2 menit" dan "Semua jawabannya sama" adalah penanda untuk dicek, tidak otomatis dibuang.

## Catatan teknis

- **Setiap kali `Code.gs` diubah**: Deploy > Manage deployments > ikon pensil > Version **New version** > Deploy. URL tetap sama. Tanpa langkah ini, perubahan kode tidak berlaku. Perubahan isi sheet Pengaturan dan Kuesioner berlaku langsung tanpa deploy ulang.
- Kalau opsi **Anyone** tidak muncul saat deploy, kebijakan Google Workspace kantor membatasinya. Minta admin Workspace membukanya, atau deploy dari akun yang mengizinkan.
- Kode akses tidak disimpan di sheet Respon, jadi jawaban tidak bisa dicocokkan ke slip.
- Setiap isian punya ID sendiri. Kalau koneksi putus setelah jawaban tersimpan lalu pegawai menekan kirim lagi, data tidak tercatat dua kali.
- Kalau puluhan orang menekan Kirim di detik yang sama, sebagian mungkin diminta mencoba lagi. Halaman sudah mencoba ulang otomatis sampai 3 kali, dan jawaban tetap tersimpan di HP.
- Mode tanpa kode (**Wajib kode akses** = `TIDAK`): siapa pun yang punya tautan bisa mengisi, dan satu orang bisa mengisi lebih dari sekali.

## Perubahan dari Question.xlsx

- Kata "perusahaan" diganti "BP Besakih" di 6 butir: GR05, WE05, OA01, OA02, OA04, OA05.
- Pasangan butir yang isinya mirip belum diubah: IC03–LD05, IC04–GR03, TW05–WE04, TW01–WE02. Kalau perbaikannya disetujui, edit langsung di sheet Kuesioner sebelum survei disebar.
- Judul survei tidak memakai nama "Gallup" atau "Q12" karena keduanya merek dagang Gallup.
