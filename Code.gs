/**
 * SASA Yapay Zeka Programı karar sunumu — oy kaydı.
 * Bu dosya bir Google E-Tablosu'na bağlı Apps Script projesine yapıştırılır.
 * Oylar "Oylar" sayfasına satır satır eklenir; hiçbir satır silinmez (iz kalır).
 * Fikir portalından gelen öneriler "Oneriler" sayfasına yazılır.
 */
const SAYFA = 'Oylar';
const YONETIM_SIFRESI = 'DEGISTIR';
const OY_METIN_SINIRI = 20000;   // D önerisinde vizyon ve misyon için üst sınır (pratikte sınırsız; tablo hücresi 50.000 karakter alır)   // Yönetim sayfasının şifresi: kendi şifrenizi yazın.

function doGet(e) {
  const p = (e && e.parameter) || {};
  let sonuc;
  try {
    if (p.islem === 'oy') sonuc = oyYaz(p);
    else if (p.islem === 'liste') sonuc = liste(p);
    else if (p.islem === 'var') sonuc = fikirVarMi(p);
    else if (p.islem === 'oyvar') sonuc = oyVarMi(p);
    else if (p.islem === 'oneriler') sonuc = fikirListe(p);
    else sonuc = { ok: false, hata: 'bilinmeyen islem' };
  } catch (err) {
    sonuc = { ok: false, hata: String(err) };
  }
  const json = JSON.stringify(sonuc);
  const cb = String(p.callback || '').replace(/[^A-Za-z0-9_]/g, '');
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function sayfa() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SAYFA);
  if (!sh) {
    sh = ss.insertSheet(SAYFA);
    sh.appendRow(['Zaman', 'Ad Soyad', 'Seçim', 'Cihaz', 'Vizyon Önerisi', 'Misyon Önerisi', 'Kayıt No']);
  } else if (sh.getLastColumn() < 7) {
    sh.getRange(1, 5, 1, 3).setValues([['Vizyon Önerisi', 'Misyon Önerisi', 'Kayıt No']]);
  }
  return sh;
}

/* Hücreye formül olarak yazılmasın diye baştaki = + - @ işaretlerini etkisizleştirir. */
function temiz(metin, uzunluk) {
  let t = String(metin || '').trim().slice(0, uzunluk);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

function oyYaz(p) {
  const secim = String(p.secim || '');
  if (['A', 'B', 'C', 'D'].indexOf(secim) < 0) return { ok: false, hata: 'gecersiz secim' };
  const ad = temiz(p.ad, 80);
  if (ad.length < 3) return { ok: false, hata: 'ad gerekli' };
  const vizyon = secim === 'D' ? temiz(p.vizyon, OY_METIN_SINIRI) : '';
  const misyon = secim === 'D' ? temiz(p.misyon, OY_METIN_SINIRI) : '';
  const id = kayitNo(p.id);
  if (secim === 'D' && vizyon.length < 10 && misyon.length < 10) return { ok: false, hata: 'oneri gerekli' };
  const cihaz = String(p.cihaz || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  const kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    const sh = sayfa();
    if (id && oyIdleri(sh).indexOf(id) >= 0) return { ok: true, tekrar: true };   // aynı gönderim ikinci kez yazılmaz
    sh.appendRow([new Date(), ad, secim, cihaz, vizyon, misyon, id]);
  } finally {
    kilit.releaseLock();
  }
  return { ok: true };
}

function oyIdleri(sh) {
  const son = sh.getLastRow();
  if (son < 2 || sh.getLastColumn() < 7) return [];
  return sh.getRange(2, 7, son - 1, 1).getValues().map(function (r) { return String(r[0]); });
}

function oyVarMi(p) {
  const id = kayitNo(p.id);
  if (id.length < 6) return { ok: false, hata: 'kayit no gerekli' };
  return { ok: true, var: oyIdleri(sayfa()).indexOf(id) >= 0 };
}

function liste(p) {
  if (YONETIM_SIFRESI === 'DEGISTIR') return { ok: false, hata: 'sifre ayarlanmamis' };
  if (String(p.anahtar || '') !== YONETIM_SIFRESI) return { ok: false, hata: 'yetkisiz' };
  const satirlar = sayfa().getDataRange().getValues().slice(1);
  return {
    ok: true,
    oylar: satirlar.map(function (r) {
      return {
        zaman: (r[0] instanceof Date) ? r[0].toISOString() : String(r[0]),
        ad: String(r[1]),
        secim: String(r[2]),
        cihaz: String(r[3]),
        vizyon: String(r[4] || ''),
        misyon: String(r[5] || '')
      };
    })
  };
}

/* ------------------------------------------------------------------
 * Fikir portalı: öneriler "Oneriler" sayfasına yazılır.
 * ------------------------------------------------------------------ */
const FIKIR_SAYFASI = 'Oneriler';
const FIKIR_BASLIK = ['Zaman', 'Kayıt No', 'Ad Soyad', 'Dil', 'Birim', 'Konular', 'Başlık', 'Anlatım',
  'Haftalık Saat', 'Kişi', 'Yıllık Saat', 'Veri', 'Fayda', 'Etki', 'Yapılabilirlik'];

function doPost(e) {
  let sonuc;
  try {
    const v = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (v.islem === 'oneri') sonuc = fikirYaz(v);
    else if (v.islem === 'oy') sonuc = oyYaz(v);
    else sonuc = { ok: false, hata: 'bilinmeyen islem' };
  } catch (err) {
    sonuc = { ok: false, hata: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(sonuc)).setMimeType(ContentService.MimeType.JSON);
}

function fikirSayfasi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(FIKIR_SAYFASI);
  if (!sh) {
    sh = ss.insertSheet(FIKIR_SAYFASI);
    sh.appendRow(FIKIR_BASLIK);
  }
  return sh;
}

function kayitNo(deger) {
  return String(deger || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 24);
}

function sayi(deger, enAz, enCok) {
  const n = Number(deger);
  if (!isFinite(n)) return enAz;
  return Math.max(enAz, Math.min(enCok, Math.round(n)));
}

function liste_(dizi, adet, uzunluk) {
  if (!Array.isArray(dizi)) return '';
  return dizi.slice(0, adet).map(function (x) { return String(x).trim().slice(0, uzunluk); }).join(' | ');
}

function fikirIdleri(sh) {
  const son = sh.getLastRow();
  if (son < 2) return [];
  return sh.getRange(2, 2, son - 1, 1).getValues().map(function (r) { return String(r[0]); });
}

function fikirYaz(v) {
  const id = kayitNo(v.id);
  const ad = temiz(v.ad, 80);
  const baslik = temiz(v.baslik, 120);
  const anlatim = temiz(v.anlatim, 1200);
  if (id.length < 6) return { ok: false, hata: 'kayit no gerekli' };
  if (ad.length < 3 || baslik.length < 3 || anlatim.length < 20) return { ok: false, hata: 'eksik alan' };
  const kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    const sh = fikirSayfasi();
    if (fikirIdleri(sh).indexOf(id) >= 0) return { ok: true, tekrar: true };   // aynı gönderim ikinci kez yazılmaz
    sh.appendRow([new Date(), id, ad, v.dil === 'en' ? 'en' : 'tr', temiz(v.birim, 60), temiz(liste_(v.konular, 4, 120), 500),
      baslik, anlatim, sayi(v.saat, 0, 40), sayi(v.kisi, 1, 200), sayi(v.yillik, 0, 400000),
      temiz(liste_(v.veri, 9, 60), 400), temiz(liste_(v.fayda, 6, 60), 300), sayi(v.etki, 1, 5), sayi(v.yapilabilirlik, 1, 5)]);
  } finally {
    kilit.releaseLock();
  }
  return { ok: true };
}

function fikirVarMi(p) {
  const id = kayitNo(p.id);
  if (id.length < 6) return { ok: false, hata: 'kayit no gerekli' };
  return { ok: true, var: fikirIdleri(fikirSayfasi()).indexOf(id) >= 0 };
}

function fikirListe(p) {
  if (YONETIM_SIFRESI === 'DEGISTIR') return { ok: false, hata: 'sifre ayarlanmamis' };
  if (String(p.anahtar || '') !== YONETIM_SIFRESI) return { ok: false, hata: 'yetkisiz' };
  const satirlar = fikirSayfasi().getDataRange().getValues().slice(1);
  return {
    ok: true,
    fikirler: satirlar.map(function (r) {
      return {
        zaman: (r[0] instanceof Date) ? r[0].toISOString() : String(r[0]),
        id: String(r[1]), ad: String(r[2]), dil: String(r[3]), birim: String(r[4]), konular: String(r[5]),
        baslik: String(r[6]), anlatim: String(r[7]), saat: Number(r[8]) || 0, kisi: Number(r[9]) || 0, yillik: Number(r[10]) || 0,
        veri: String(r[11]), fayda: String(r[12]), etki: Number(r[13]) || 0, yapilabilirlik: Number(r[14]) || 0
      };
    })
  };
}
