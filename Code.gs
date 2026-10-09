/**
 * SURVEI KETERLIBATAN PEGAWAI BP BESAKIH — backend Google Apps Script
 *
 * Cara pasang singkat (detail di README.md):
 * 1. Buat Google Sheet baru > Extensions > Apps Script > tempel seluruh file ini > Save.
 * 2. Reload Sheet, lalu jalankan menu "Survei > 1. Siapkan sheet".
 * 3. Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 *
 * Setiap kali file ini diubah: Deploy > Manage deployments > Edit > Version: New version.
 */

const NAMA = {
  PENGATURAN: 'Pengaturan',
  KUESIONER: 'Kuesioner',
  KODE: 'Kode',
  RESPON: 'Respon',
  DASBOR: 'Dasbor',
  SLIP: 'Slip Kode'
};
const ZONA = 'Asia/Makassar';
const SKALA = ['Sangat tidak setuju', 'Tidak setuju', 'Netral', 'Setuju', 'Sangat setuju'];
const ALFABET_KODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // tanpa I, L, O, 0, 1 supaya tidak tertukar saat diketik
const PANJANG_KODE = 6;
const BATAS_TEKS = 1000;
const KOLOM_AWAL = ['Tanggal', 'ID Kirim', 'Unit Kerja', 'Masa Kerja'];
const KOLOM_AKHIR = ['Terbuka 1', 'Terbuka 2', 'Durasi (detik)'];
const WARNA_KATEGORI = { 'Kuat': '#D9EAD3', 'Perlu perhatian': '#FFF2CC', 'Prioritas': '#F4CCCC' };
const WARNA_KEPALA = '#F1E4E4';
const WARNA_SAMAR = '#EEEEEE';

const PENGATURAN_AWAL = [
  ['Judul survei', 'Survei Keterlibatan Pegawai BP Besakih 2026', 'Tampil di halaman depan dan di slip kode.'],
  ['Pengantar', 'Survei ini mengukur kondisi kerja di BP Besakih, bukan menilai kinerja Anda. Hasilnya dipakai untuk menyusun perbaikan bersama.', 'Paragraf pembuka di halaman depan.'],
  ['Catatan atasan', 'Kata "atasan" dalam survei ini berarti atasan langsung Anda, yaitu orang yang sehari-hari memberi Anda tugas.', 'Kosongkan kalau tidak perlu.'],
  ['Status survei', 'BUKA', 'BUKA atau TUTUP.'],
  ['Wajib kode akses', 'YA', 'YA: tiap orang perlu kode dari slip. TIDAK: siapa pun yang punya tautan bisa mengisi, tanpa pencegahan isi ganda.'],
  ['Unit kerja', 'Unit 1, Unit 2, Unit 3, Lainnya', 'WAJIB DIGANTI. Pisahkan dengan koma, jangan pakai koma di dalam nama. Gabungkan unit kecil supaya tiap kelompok minimal 5 orang.'],
  ['Masa kerja', 'Kurang dari 1 tahun, 1–2 tahun, Lebih dari 2 tahun', 'Pisahkan dengan koma.'],
  ['Pertanyaan terbuka 1', 'Apa satu hal yang paling membantu Anda bekerja dengan baik di sini?', 'Boleh dikosongkan.'],
  ['Pertanyaan terbuka 2', 'Apa satu hal yang paling perlu diperbaiki?', 'Boleh dikosongkan.'],
  ['Minimal responden per kelompok', 5, 'Kelompok di bawah angka ini tidak ditampilkan di dasbor.'],
  ['URL survei', '', 'Alamat halaman survei setelah deploy, misalnya https://survei-bp-besakih.vercel.app. Dipakai di slip kode.']
];

const BUTIR_AWAL = [
  ["BN01", "Basic Needs", "Saya memahami dengan jelas tugas dan tanggung jawab saya."],
  ["BN02", "Basic Needs", "Saya memahami target atau hasil kerja yang diharapkan dari saya."],
  ["BN03", "Basic Needs", "Saya memiliki informasi yang cukup untuk menyelesaikan pekerjaan dengan baik."],
  ["BN04", "Basic Needs", "Saya memiliki fasilitas dan peralatan yang diperlukan untuk menjalankan pekerjaan."],
  ["BN05", "Basic Needs", "Prosedur kerja yang berlaku membantu saya menyelesaikan pekerjaan dengan efektif."],
  ["IC01", "Individual Contribution", "Saya memiliki kesempatan untuk menggunakan kemampuan terbaik saya dalam pekerjaan."],
  ["IC02", "Individual Contribution", "Kontribusi saya terhadap pekerjaan mendapatkan apresiasi yang sesuai."],
  ["IC03", "Individual Contribution", "Atasan saya memberikan dukungan ketika saya menghadapi kendala pekerjaan."],
  ["IC04", "Individual Contribution", "Saya mendapatkan kesempatan untuk meningkatkan kemampuan yang relevan dengan pekerjaan saya."],
  ["IC05", "Individual Contribution", "Saya merasa kontribusi saya memberikan nilai bagi unit kerja saya."],
  ["TW01", "Teamwork", "Saya merasa nyaman menyampaikan pendapat atau masukan di lingkungan kerja."],
  ["TW02", "Teamwork", "Anggota tim saya saling membantu ketika menghadapi kendala pekerjaan."],
  ["TW03", "Teamwork", "Saya memahami bagaimana pekerjaan saya berkontribusi terhadap tujuan tim."],
  ["TW04", "Teamwork", "Anggota tim saya memiliki komitmen terhadap kualitas pekerjaan."],
  ["TW05", "Teamwork", "Saya memiliki hubungan kerja yang positif dengan rekan-rekan saya."],
  ["GR01", "Growth", "Atasan saya secara rutin membahas perkembangan pekerjaan saya."],
  ["GR02", "Growth", "Saya mendapatkan feedback yang membantu saya meningkatkan kinerja."],
  ["GR03", "Growth", "Saya memiliki kesempatan untuk mempelajari keterampilan baru."],
  ["GR04", "Growth", "Saya mengetahui peluang pengembangan karier yang tersedia bagi saya."],
  ["GR05", "Growth", "Saya melihat peluang untuk berkembang di BP Besakih."],
  ["LD01", "Leadership", "Atasan saya memberikan arahan yang jelas."],
  ["LD02", "Leadership", "Atasan saya memberikan contoh perilaku kerja yang baik."],
  ["LD03", "Leadership", "Atasan saya memperlakukan anggota tim secara adil."],
  ["LD04", "Leadership", "Atasan saya terbuka terhadap masukan dari anggota tim."],
  ["LD05", "Leadership", "Atasan saya memberikan dukungan yang saya perlukan untuk mencapai target."],
  ["CM01", "Communication", "Informasi yang berkaitan dengan pekerjaan disampaikan secara jelas."],
  ["CM02", "Communication", "Saya mendapatkan informasi penting yang saya perlukan tepat waktu."],
  ["CM03", "Communication", "Koordinasi antarbagian berjalan dengan baik."],
  ["CM04", "Communication", "Saya mengetahui perubahan kebijakan atau prosedur yang berdampak pada pekerjaan saya."],
  ["CM05", "Communication", "Saya merasa komunikasi di lingkungan kerja berlangsung secara terbuka."],
  ["WE01", "Work Environment", "Saya merasa lingkungan kerja mendukung saya untuk bekerja dengan baik."],
  ["WE02", "Work Environment", "Saya merasa aman untuk menyampaikan masalah terkait pekerjaan."],
  ["WE03", "Work Environment", "Beban kerja saya secara umum dapat dikelola dengan baik."],
  ["WE04", "Work Environment", "Hubungan kerja di lingkungan saya berlangsung secara profesional."],
  ["WE05", "Work Environment", "BP Besakih menunjukkan perhatian terhadap kondisi kerja karyawan."],
  ["OA01", "Organizational Alignment", "Saya memahami tujuan utama BP Besakih."],
  ["OA02", "Organizational Alignment", "Saya memahami bagaimana pekerjaan saya berkontribusi terhadap tujuan BP Besakih."],
  ["OA03", "Organizational Alignment", "Saya merasa pekerjaan saya memiliki makna."],
  ["OA04", "Organizational Alignment", "Saya merasa bangga menjadi bagian dari BP Besakih."],
  ["OA05", "Organizational Alignment", "Saya melihat adanya keselarasan antara nilai BP Besakih dan cara kita bekerja."]
];

/* ============================ MENU ============================ */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Survei')
    .addItem('1. Siapkan sheet', 'siapkanSheet')
    .addItem('2. Buat kode akses', 'buatKode')
    .addItem('3. Buat slip kode untuk dicetak', 'buatSlip')
    .addSeparator()
    .addItem('Perbarui dasbor', 'perbaruiDasbor')
    .addToUi();
}

/* ========================= WEB APP (API) ========================= */

function doGet(e) {
  try {
    const aksi = (e && e.parameter && e.parameter.action) || 'config';
    if (aksi === 'config') return json_(konfigurasi_());
    return json_({ ok: false, jenis: 'server', pesan: 'Aksi tidak dikenal.' });
  } catch (err) {
    return json_({ ok: false, jenis: 'server', pesan: String((err && err.message) || err) });
  }
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, jenis: 'server', pesan: 'Format data tidak dikenali.' });
  }
  try {
    if (data.action === 'cekKode') return json_(cekKode_(data.kode));
    if (data.action === 'kirim') return json_(simpanRespons_(data));
    return json_({ ok: false, jenis: 'server', pesan: 'Aksi tidak dikenal.' });
  } catch (err) {
    return json_({ ok: false, jenis: 'server', pesan: String((err && err.message) || err) });
  }
}

function konfigurasi_() {
  const p = bacaPengaturan_();
  return {
    ok: true,
    judul: teks_(p['Judul survei']) || 'Survei Keterlibatan Pegawai',
    pengantar: teks_(p['Pengantar']),
    catatan: teks_(p['Catatan atasan']),
    buka: surveiBuka_(p),
    wajibKode: wajibKode_(p),
    minKelompok: minKelompok_(p),
    unitKerja: daftar_(p['Unit kerja']),
    masaKerja: daftar_(p['Masa kerja']),
    skala: SKALA,
    butir: bacaButir_(),
    terbuka: pertanyaanTerbuka_(p)
  };
}

function cekKode_(kodeMentah) {
  const p = bacaPengaturan_();
  if (!surveiBuka_(p)) return { ok: false, jenis: 'tutup', pesan: 'Survei sudah ditutup.' };
  if (!wajibKode_(p)) return { ok: true };
  const kode = normalKode_(kodeMentah);
  if (!kode) return { ok: false, jenis: 'kode', pesan: 'Masukkan kode akses dari slip Anda.' };
  const k = cariKode_(kode);
  if (!k) return { ok: false, jenis: 'kode', pesan: 'Kode tidak ditemukan. Periksa lagi huruf dan angkanya.' };
  if (k.status === 'TERPAKAI') return { ok: false, jenis: 'kode', pesan: 'Kode ini sudah dipakai untuk mengirim jawaban.' };
  return { ok: true };
}

function simpanRespons_(data) {
  const p = bacaPengaturan_();
  if (!surveiBuka_(p)) return { ok: false, jenis: 'tutup', pesan: 'Survei sudah ditutup.' };

  const idKirim = String(data.idKirim || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
  if (idKirim.length < 8) return { ok: false, jenis: 'server', pesan: 'ID pengiriman tidak valid. Muat ulang halaman.' };

  const daftarUnit = daftar_(p['Unit kerja']);
  const daftarMasa = daftar_(p['Masa kerja']);
  const unit = teks_(data.unit);
  const masa = teks_(data.masaKerja);
  if (daftarUnit.length && daftarUnit.indexOf(unit) < 0) {
    return { ok: false, jenis: 'validasi', bagian: 'profil', pesan: 'Pilih ulang unit kerja Anda.' };
  }
  if (daftarMasa.length && daftarMasa.indexOf(masa) < 0) {
    return { ok: false, jenis: 'validasi', bagian: 'profil', pesan: 'Pilih ulang masa kerja Anda.' };
  }

  const butir = bacaButir_();
  const jawaban = data.jawaban || {};
  for (let i = 0; i < butir.length; i++) {
    const v = Number(jawaban[butir[i].kode]);
    if (!(v >= 1 && v <= 5 && Math.floor(v) === v)) {
      return { ok: false, jenis: 'validasi', kodeButir: butir[i].kode, pesan: 'Masih ada pernyataan yang belum dijawab.' };
    }
  }
  const terbuka = data.terbuka || {};

  // Kunci supaya satu kode tidak bisa dipakai dua kali oleh dua kiriman yang datang bersamaan.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, jenis: 'sibuk', pesan: 'Server sedang sibuk.' };
  try {
    const sh = sheet_(NAMA.RESPON);
    const header = pastikanHeader_(sh, butir);
    const last = sh.getLastRow();

    // Kiriman ulang dengan ID yang sama (misalnya koneksi putus setelah tersimpan) dianggap berhasil.
    if (last > 1) {
      const ids = sh.getRange(2, header.indexOf('ID Kirim') + 1, last - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === idKirim) return { ok: true, pesan: 'Jawaban sudah tersimpan sebelumnya.' };
      }
    }

    let barisKode = 0;
    if (wajibKode_(p)) {
      const k = cariKode_(normalKode_(data.kode));
      if (!k) return { ok: false, jenis: 'kode', pesan: 'Kode tidak ditemukan.' };
      if (k.status === 'TERPAKAI') return { ok: false, jenis: 'kode', pesan: 'Kode ini sudah dipakai untuk mengirim jawaban.' };
      barisKode = k.baris;
    }

    // Kode akses sengaja TIDAK disimpan di sheet Respon, supaya jawaban tidak bisa ditelusuri ke slip.
    const nilai = {
      'Tanggal': Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd'),
      'ID Kirim': idKirim,
      'Unit Kerja': aman_(unit),
      'Masa Kerja': aman_(masa),
      'Terbuka 1': aman_(teks_(terbuka['Terbuka 1']).slice(0, BATAS_TEKS)),
      'Terbuka 2': aman_(teks_(terbuka['Terbuka 2']).slice(0, BATAS_TEKS)),
      'Durasi (detik)': Math.max(0, Math.min(604800, Math.round(Number(data.durasi) || 0)))
    };
    butir.forEach(function (b) { nilai[b.kode] = Number(jawaban[b.kode]); });

    sh.appendRow(header.map(function (h) {
      return Object.prototype.hasOwnProperty.call(nilai, h) ? nilai[h] : '';
    }));
    if (barisKode) sheet_(NAMA.KODE).getRange(barisKode, 2).setValue('TERPAKAI');
    SpreadsheetApp.flush();
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* ======================= MENU: SIAPKAN SHEET ======================= */

function siapkanSheet() {
  const ss = SpreadsheetApp.getActive();
  const dibuat = [];

  let sh = ss.getSheetByName(NAMA.PENGATURAN);
  if (!sh) {
    sh = ss.insertSheet(NAMA.PENGATURAN);
    sh.getRange(1, 1, 1, 3).setValues([['Pengaturan', 'Nilai', 'Keterangan']]).setFontWeight('bold').setBackground(WARNA_KEPALA);
    sh.getRange(2, 1, PENGATURAN_AWAL.length, 3).setValues(PENGATURAN_AWAL).setWrap(true).setVerticalAlignment('top');
    const baris = function (nama) {
      for (let i = 0; i < PENGATURAN_AWAL.length; i++) if (PENGATURAN_AWAL[i][0] === nama) return i + 2;
      return 0;
    };
    sh.getRange(baris('Status survei'), 2).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(['BUKA', 'TUTUP'], true).build());
    sh.getRange(baris('Wajib kode akses'), 2).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(['YA', 'TIDAK'], true).build());
    sh.getRange(baris('Unit kerja'), 2).setBackground('#FFF2CC');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 230);
    sh.setColumnWidth(2, 420);
    sh.setColumnWidth(3, 380);
    dibuat.push(NAMA.PENGATURAN);
  }

  sh = ss.getSheetByName(NAMA.KUESIONER);
  if (!sh) {
    sh = ss.insertSheet(NAMA.KUESIONER);
    sh.getRange(1, 1, 1, 4).setValues([['No', 'Kode', 'Dimensi', 'Pernyataan']]).setFontWeight('bold').setBackground(WARNA_KEPALA);
    sh.getRange(2, 1, BUTIR_AWAL.length, 4)
      .setValues(BUTIR_AWAL.map(function (b, i) { return [i + 1, b[0], b[1], b[2]]; }));
    sh.getRange(2, 4, BUTIR_AWAL.length, 1).setWrap(true);
    sh.setFrozenRows(1);
    sh.setColumnWidth(3, 190);
    sh.setColumnWidth(4, 560);
    dibuat.push(NAMA.KUESIONER);
  }

  sh = ss.getSheetByName(NAMA.KODE);
  if (!sh) {
    sh = ss.insertSheet(NAMA.KODE);
    sh.getRange(1, 1, 1, 2).setValues([['Kode', 'Status']]).setFontWeight('bold').setBackground(WARNA_KEPALA);
    sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@');
    sh.setFrozenRows(1);
    dibuat.push(NAMA.KODE);
  }

  sh = ss.getSheetByName(NAMA.RESPON);
  if (!sh) {
    sh = ss.insertSheet(NAMA.RESPON);
    dibuat.push(NAMA.RESPON);
  }
  pastikanHeader_(sh, bacaButir_());
  sh.setFrozenRows(1);

  // Hapus sheet bawaan yang masih kosong.
  ss.getSheets().forEach(function (s) {
    if (/^(Sheet|Lembar)\s?1$/i.test(s.getName()) && s.getLastRow() === 0 && ss.getSheets().length > 1) {
      ss.deleteSheet(s);
    }
  });

  SpreadsheetApp.getUi().alert(dibuat.length
    ? 'Sheet dibuat: ' + dibuat.join(', ') + '. Lanjutkan dengan mengisi Unit kerja di sheet Pengaturan.'
    : 'Semua sheet sudah ada. Tidak ada yang ditimpa.');
}

/* ======================= MENU: KODE & SLIP ======================= */

function buatKode() {
  const ui = SpreadsheetApp.getUi();
  const jawab = ui.prompt('Buat kode akses',
    'Berapa kode yang dibuat? Saran: jumlah pegawai ditambah 10% cadangan.', ui.ButtonSet.OK_CANCEL);
  if (jawab.getSelectedButton() !== ui.Button.OK) return;
  const n = parseInt(jawab.getResponseText(), 10);
  if (!(n >= 1 && n <= 2000)) {
    ui.alert('Isi dengan angka 1 sampai 2000.');
    return;
  }
  const sh = sheet_(NAMA.KODE);
  const last = sh.getLastRow();
  const ada = new Set(last > 1
    ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return teks_(r[0]).toUpperCase(); })
    : []);
  const baru = [];
  while (baru.length < n) {
    const k = kodeAcak_();
    if (!ada.has(k)) {
      ada.add(k);
      baru.push([k, 'BELUM']);
    }
  }
  const awal = Math.max(last, 1) + 1;
  sh.getRange(awal, 1, n, 1).setNumberFormat('@');
  sh.getRange(awal, 1, n, 2).setValues(baru);
  ui.alert(n + ' kode ditambahkan. Total sekarang ' + ada.size + ' kode.');
}

function buatSlip() {
  const ui = SpreadsheetApp.getUi();
  const p = bacaPengaturan_();
  const url = teks_(p['URL survei']);
  if (!/^https?:\/\//i.test(url)) {
    ui.alert('Isi dulu "URL survei" di sheet Pengaturan dengan alamat halaman survei.');
    return;
  }
  const kodeSh = sheet_(NAMA.KODE);
  const last = kodeSh.getLastRow();
  const kode = last > 1
    ? kodeSh.getRange(2, 1, last - 1, 2).getValues()
      .filter(function (r) { return teks_(r[0]) && teks_(r[1]).toUpperCase() !== 'TERPAKAI'; })
      .map(function (r) { return teks_(r[0]); })
    : [];
  if (!kode.length) {
    ui.alert('Belum ada kode yang bisa dicetak. Jalankan "2. Buat kode akses" dulu.');
    return;
  }
  acak_(kode); // urutan slip berbeda dari urutan di sheet Kode

  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(NAMA.SLIP);
  if (sh) sh.clear(); else sh = ss.insertSheet(NAMA.SLIP);

  const KOLOM = 3;
  const judul = teks_(p['Judul survei']) || 'Survei Keterlibatan Pegawai';
  const tebal = SpreadsheetApp.newTextStyle().setBold(true).setFontSize(15).build();
  const kosong = SpreadsheetApp.newRichTextValue().setText('').build();
  const grid = [];
  for (let i = 0; i < kode.length; i += KOLOM) {
    const baris = kode.slice(i, i + KOLOM).map(function (k) {
      const isi = judul + '\n' + url + '\nKode: ' + k + '\nSatu kode untuk satu orang. Tidak perlu menulis nama.';
      const mulai = isi.lastIndexOf('Kode: ') + 6;
      return SpreadsheetApp.newRichTextValue().setText(isi).setTextStyle(mulai, mulai + k.length, tebal).build();
    });
    while (baris.length < KOLOM) baris.push(kosong);
    grid.push(baris);
  }
  const rng = sh.getRange(1, 1, grid.length, KOLOM);
  rng.setFontSize(10).setWrap(true).setHorizontalAlignment('center').setVerticalAlignment('middle');
  rng.setRichTextValues(grid);
  rng.setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.DASHED);
  sh.setColumnWidths(1, KOLOM, 250);
  sh.setRowHeights(1, grid.length, 120);
  ss.setActiveSheet(sh);
  ui.alert(kode.length + ' slip siap di sheet "' + NAMA.SLIP + '". Cetak lewat File > Cetak (Lembar saat ini), gunting, lalu acak sebelum dibagikan.');
}

/* ========================= MENU: DASBOR ========================= */

function perbaruiDasbor() {
  const ss = SpreadsheetApp.getActive();
  const p = bacaPengaturan_();
  const butir = bacaButir_();
  const minN = minKelompok_(p);
  const respon = sheet_(NAMA.RESPON);

  let d = ss.getSheetByName(NAMA.DASBOR);
  if (d) d.clear(); else d = ss.insertSheet(NAMA.DASBOR);

  const last = respon.getLastRow();
  const lastCol = respon.getLastColumn();
  if (last < 2 || lastCol < 1) {
    d.getRange(1, 1).setValue('Belum ada respons masuk.');
    ss.setActiveSheet(d);
    return;
  }
  const semua = respon.getRange(1, 1, last, lastCol).getValues();
  const header = semua[0].map(function (h) { return teks_(h); });
  const baris = semua.slice(1).filter(function (r) {
    return r.some(function (v) { return v !== '' && v !== null; });
  });
  const kol = function (nama) { return header.indexOf(nama); };

  const dimensi = [];
  butir.forEach(function (b) { if (dimensi.indexOf(b.dimensi) < 0) dimensi.push(b.dimensi); });
  const kolomDim = {};
  dimensi.forEach(function (dm) {
    kolomDim[dm] = butir.filter(function (b) { return b.dimensi === dm; })
      .map(function (b) { return kol(b.kode); })
      .filter(function (c) { return c >= 0; });
  });
  const kolomSemua = butir.map(function (b) { return kol(b.kode); }).filter(function (c) { return c >= 0; });
  const total = statistik_(baris, kolomSemua);

  const tulis = new Penulis_(d);
  tulis.judul('Dasbor ' + (teks_(p['Judul survei']) || 'Survei'), 14);
  tulis.catatan('Diperbarui ' + Utilities.formatDate(new Date(), ZONA, 'dd-MM-yyyy HH:mm') + ' WITA.');
  tulis.catatan('% favorable = persentase jawaban 4 atau 5. Kategori: Kuat 75% ke atas, Perlu perhatian 50–74%, Prioritas di bawah 50%. Kelompok dengan responden di bawah ' + minN + ' orang tidak ditampilkan (n<' + minN + ').');
  tulis.spasi();

  const iDur = kol('Durasi (detik)');
  const cepat = iDur < 0 ? 0 : baris.filter(function (r) {
    const x = Number(r[iDur]);
    return x > 0 && x < 120;
  }).length;
  const seragam = baris.filter(function (r) {
    const v = kolomSemua.map(function (c) { return Number(r[c]); });
    return v.length > 1 && v.every(function (x) { return x === v[0]; });
  }).length;

  tulis.tabel(['Ringkasan', 'Nilai'], [
    ['Jumlah responden', baris.length],
    ['Partisipasi', partisipasi_(p)],
    ['Indeks keseluruhan (0–100)', total ? bulat_(indeks_(total.rata), 1) : '—'],
    ['Rata-rata keseluruhan (1–5)', total ? bulat_(total.rata, 2) : '—'],
    ['% favorable keseluruhan', total ? bulat_(total.fav, 0) : '—'],
    ['Diisi kurang dari 2 menit (perlu dicek)', cepat],
    ['Semua jawabannya sama (perlu dicek)', seragam]
  ]);

  tulis.judul('Per dimensi');
  tulis.tabel(['Dimensi', 'Rata-rata (1–5)', '% Favorable', 'Kategori'], dimensi.map(function (dm) {
    const s = statistik_(baris, kolomDim[dm]);
    if (!s) return [dm, '—', '—', '—'];
    const fav = bulat_(s.fav, 0);
    return [dm, bulat_(s.rata, 2), fav, kategori_(fav)];
  }), [2]);

  const statButir = butir.map(function (b) {
    const c = kol(b.kode);
    return { b: b, s: c >= 0 ? statistik_(baris, [c]) : null };
  });
  const terendah = statButir.filter(function (x) { return x.s; })
    .sort(function (a, z) { return (a.s.fav - z.s.fav) || (a.s.rata - z.s.rata); })
    .slice(0, 5);
  tulis.judul('5 pernyataan dengan % favorable terendah');
  tulis.tabel(['Pernyataan', '% Favorable', 'Rata-rata (1–5)'], terendah.map(function (x) {
    return ['[' + x.b.kode + '] ' + x.b.teks, bulat_(x.s.fav, 0), bulat_(x.s.rata, 2)];
  }), [1]);

  tabelKelompok_(tulis, 'Per unit kerja (% favorable)', 'Unit Kerja', daftar_(p['Unit kerja']),
    baris, kol, dimensi, kolomDim, kolomSemua, minN);
  tabelKelompok_(tulis, 'Per masa kerja (% favorable)', 'Masa Kerja', daftar_(p['Masa kerja']),
    baris, kol, dimensi, kolomDim, kolomSemua, minN);

  tulis.judul('Semua pernyataan');
  tulis.tabel(['Pernyataan', 'Dimensi', 'Rata-rata (1–5)', '% Favorable', 'Kategori'], statButir.map(function (x) {
    const label = '[' + x.b.kode + '] ' + x.b.teks;
    if (!x.s) return [label, x.b.dimensi, '—', '—', '—'];
    const fav = bulat_(x.s.fav, 0);
    return [label, x.b.dimensi, bulat_(x.s.rata, 2), fav, kategori_(fav)];
  }), [3]);

  pertanyaanTerbuka_(p).forEach(function (t) {
    const c = kol(t.kode);
    if (c < 0) return;
    const jawab = baris.map(function (r) { return teks_(r[c]); })
      .filter(Boolean)
      .sort(function (a, z) { return a.localeCompare(z, 'id'); });
    tulis.judul('Jawaban terbuka: ' + t.teks);
    tulis.tabel(['Jawaban (' + jawab.length + ', diurutkan menurut abjad)'],
      jawab.length ? jawab.map(function (j) { return [j]; }) : [['Belum ada jawaban.']]);
  });

  const lebar = Math.max(5, dimensi.length + 3);
  d.setColumnWidth(1, 420);
  for (let c = 2; c <= lebar; c++) d.setColumnWidth(c, 120);
  d.getRange(1, 1, Math.max(d.getLastRow(), 1), lebar).setWrap(true).setVerticalAlignment('top');
  ss.setActiveSheet(d);
}

function tabelKelompok_(tulis, judul, namaKolom, urutan, baris, kol, dimensi, kolomDim, kolomSemua, minN) {
  const c = kol(namaKolom);
  if (c < 0) return;
  const ada = [];
  baris.forEach(function (r) {
    const v = teks_(r[c]);
    if (v && ada.indexOf(v) < 0) ada.push(v);
  });
  if (!ada.length) return;
  const kelompok = urutan.filter(function (v) { return ada.indexOf(v) >= 0; })
    .concat(ada.filter(function (v) { return urutan.indexOf(v) < 0; }));
  const tanda = 'n<' + minN;
  const isi = kelompok.map(function (g) {
    const sub = baris.filter(function (r) { return teks_(r[c]) === g; });
    if (sub.length < minN) {
      return [g, sub.length].concat(dimensi.map(function () { return tanda; }), [tanda]);
    }
    const t = statistik_(sub, kolomSemua);
    return [g, sub.length]
      .concat(dimensi.map(function (dm) {
        const s = statistik_(sub, kolomDim[dm]);
        return s ? bulat_(s.fav, 0) : '—';
      }))
      .concat([t ? bulat_(indeks_(t.rata), 1) : '—']);
  });
  tulis.judul(judul);
  tulis.tabel([namaKolom, 'n'].concat(dimensi, ['Indeks (0–100)']), isi,
    dimensi.map(function (_, i) { return i + 2; }));
}

/** Penulis blok tabel berurutan ke sheet dasbor. */
function Penulis_(sh) {
  this.sh = sh;
  this.baris = 1;
}
Penulis_.prototype.judul = function (isi, ukuran) {
  this.sh.getRange(this.baris, 1).setValue(aman_(isi)).setFontWeight('bold').setFontSize(ukuran || 12);
  this.baris += 1;
};
Penulis_.prototype.catatan = function (isi) {
  this.sh.getRange(this.baris, 1).setValue(aman_(isi)).setFontColor('#625B57');
  this.baris += 1;
};
Penulis_.prototype.spasi = function () {
  this.baris += 1;
};
Penulis_.prototype.tabel = function (kepala, isi, kolomWarna) {
  const lebar = kepala.length;
  const r0 = this.baris;
  this.sh.getRange(r0, 1, 1, lebar).setValues([kepala.map(aman_)])
    .setFontWeight('bold').setBackground(WARNA_KEPALA);
  if (isi.length) {
    const nilai = isi.map(function (r) {
      return r.map(function (v) { return typeof v === 'string' ? aman_(v) : v; });
    });
    const latar = isi.map(function (r) {
      return r.map(function (v, c) {
        if (typeof v === 'number' && kolomWarna && kolomWarna.indexOf(c) >= 0) return WARNA_KATEGORI[kategori_(v)];
        if (typeof v === 'string' && WARNA_KATEGORI[v]) return WARNA_KATEGORI[v];
        if (typeof v === 'string' && v.indexOf('n<') === 0) return WARNA_SAMAR;
        return '#FFFFFF';
      });
    });
    this.sh.getRange(r0 + 1, 1, isi.length, lebar).setValues(nilai).setBackgrounds(latar);
  }
  this.baris = r0 + isi.length + 2;
};

/* ============================ UTILITAS ============================ */

function sheet_(nama) {
  const sh = SpreadsheetApp.getActive().getSheetByName(nama);
  if (!sh) throw new Error('Sheet "' + nama + '" belum ada. Jalankan menu Survei > 1. Siapkan sheet.');
  return sh;
}

function bacaPengaturan_() {
  const sh = sheet_(NAMA.PENGATURAN);
  const last = sh.getLastRow();
  const p = {};
  if (last < 2) return p;
  sh.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
    const k = teks_(r[0]);
    if (k) p[k] = r[1];
  });
  return p;
}

function bacaButir_() {
  const sh = sheet_(NAMA.KUESIONER);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const terlihat = {};
  return sh.getRange(2, 1, last - 1, 4).getValues()
    .map(function (r) { return { kode: teks_(r[1]), dimensi: teks_(r[2]) || 'Lainnya', teks: teks_(r[3]) }; })
    .filter(function (b) {
      if (!b.kode || !b.teks || terlihat[b.kode]) return false;
      terlihat[b.kode] = true;
      return true;
    });
}

function pertanyaanTerbuka_(p) {
  return [p['Pertanyaan terbuka 1'], p['Pertanyaan terbuka 2']]
    .map(function (t, i) { return { kode: KOLOM_AKHIR[i], teks: teks_(t) }; })
    .filter(function (t) { return t.teks; });
}

function pastikanHeader_(sh, butir) {
  const wajib = KOLOM_AWAL.concat(butir.map(function (b) { return b.kode; }), KOLOM_AKHIR);
  const lastCol = sh.getLastColumn();
  let header = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return teks_(h); }) : [];
  const kurang = wajib.filter(function (h) { return header.indexOf(h) < 0; });
  if (kurang.length) {
    sh.getRange(1, header.length + 1, 1, kurang.length).setValues([kurang])
      .setFontWeight('bold').setBackground(WARNA_KEPALA);
    header = header.concat(kurang);
  }
  return header;
}

function cariKode_(kode) {
  if (!kode) return null;
  const sh = sheet_(NAMA.KODE);
  const last = sh.getLastRow();
  if (last < 2) return null;
  const data = sh.getRange(2, 1, last - 1, 2).getValues();
  for (let i = 0; i < data.length; i++) {
    if (teks_(data[i][0]).toUpperCase() === kode) {
      return { baris: i + 2, status: teks_(data[i][1]).toUpperCase() };
    }
  }
  return null;
}

function partisipasi_(p) {
  if (!wajibKode_(p)) return 'Tidak dihitung (mode tanpa kode)';
  const sh = SpreadsheetApp.getActive().getSheetByName(NAMA.KODE);
  if (!sh || sh.getLastRow() < 2) return 'Belum ada kode';
  const status = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues()
    .map(function (r) { return teks_(r[0]).toUpperCase(); });
  const dipakai = status.filter(function (s) { return s === 'TERPAKAI'; }).length;
  return dipakai + ' dari ' + status.length + ' kode (' + Math.round(100 * dipakai / status.length) + '%)';
}

function statistik_(baris, kolom) {
  let n = 0, jumlah = 0, fav = 0;
  baris.forEach(function (r) {
    kolom.forEach(function (c) {
      const v = Number(r[c]);
      if (v >= 1 && v <= 5) {
        n++;
        jumlah += v;
        if (v >= 4) fav++;
      }
    });
  });
  return n ? { rata: jumlah / n, fav: 100 * fav / n, n: n } : null;
}

function kategori_(fav) { return fav >= 75 ? 'Kuat' : fav >= 50 ? 'Perlu perhatian' : 'Prioritas'; }
function indeks_(rata) { return (rata - 1) / 4 * 100; }
function bulat_(x, d) { const f = Math.pow(10, d); return Math.round(x * f) / f; }
function teks_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function daftar_(v) { return teks_(v).split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
function normalKode_(v) { return teks_(v).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12); }
function surveiBuka_(p) { return teks_(p['Status survei']).toUpperCase() !== 'TUTUP'; }
function wajibKode_(p) { return teks_(p['Wajib kode akses']).toUpperCase() !== 'TIDAK'; }
function minKelompok_(p) { return Math.max(1, Math.round(Number(p['Minimal responden per kelompok']) || 5)); }

/** Cegah teks dibaca Sheets sebagai rumus atau angka/tanggal. */
function aman_(s) {
  s = teks_(s);
  return /^[=+\-@0-9]/.test(s) ? "'" + s : s;
}

function kodeAcak_() {
  let s = '';
  for (let i = 0; i < PANJANG_KODE; i++) {
    s += ALFABET_KODE.charAt(Math.floor(Math.random() * ALFABET_KODE.length));
  }
  return s;
}

function acak_(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
