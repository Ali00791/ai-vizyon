# SASA Yapay Zeka Programı — karar sunumu, oylama ve fikir portalı

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Karar sunumu ve oy sayfası (telefonda da çalışır) |
| `yonetim.html` | Tek giriş: oylama ve fikir yönetimini iki sekmede gösterir |
| `oy-yonetim.html` | Oylama yönetimi: sayım, geçerli oylar, tüm oy izi |
| `fikir.html` | Fikir portalı: 4 adımda öneri toplama, asistan ipuçları, TR/EN |
| `fikir-yonetim.html` | Fikir yönetimi: birim dağılımı, etki–yapılabilirlik ızgarası, puana göre liste, CSV |
| `ayar.js` | Kayıtların yazılacağı adres (tek satır) |
| `Code.gs` | Oyları ve fikirleri Google E-Tablosu'na yazan Apps Script kodu |

## Kurulum

### 1) Kayıt (Google E-Tablosu + Apps Script)
1. Google E-Tablolar'da boş bir tablo açın.
2. Menüden Apps Script düzenleyicisini açın, içindeki kodu silip `Code.gs` içeriğini yapıştırın.
3. `YONETIM_SIFRESI` satırındaki `DEGISTIR` yerine kendi şifrenizi yazın. Bu şifreyi depoya koymayın.
4. Web uygulaması olarak dağıtın (Deploy > New deployment > Web app): "Execute as: Me", "Who has access: Anyone".
5. Verilen ve `/exec` ile biten adresi kopyalayın.

Oylar `Oylar`, fikirler `Oneriler` sayfasına yazılır; sayfalar ilk kayıtta kendiliğinden oluşur.

### 2) Adresi sayfalara tanıtma
`ayar.js` içinde:

```js
window.OY_API = "https://script.google.com/macros/s/..../exec";
```

### 3) Yayın (GitHub Pages)
Depo ayarlarından Pages'i `main` dalı için açın.

- Sunum ve oy: `https://vizyon.ustamai.com/`
- Fikir portalı: `https://vizyon.ustamai.com/fikir`
- Yönetim (tek giriş, iki sekme): `https://vizyon.ustamai.com/yonetim`

Alan adı `CNAME` dosyasında; Cloudflare'de `vizyon` CNAME kaydı `ali00791.github.io` adresine, proxy kapalı (DNS only).

## Nasıl çalışır
- **Oylama:** kişi seçeneği seçer, adını yazar, gönderir. Her gönderim yeni satırdır; aynı telefondan gelen yeni oy sayımda öncekinin yerine geçer, eskisi izde kalır.
- **Fikir portalı:** kişi birimini ve konusunu seçer, işi ve süresini anlatır, gönderir. Asistan ipuçları sayfanın içindeki kurallarla üretilir; dışarıya veri göndermez. Etki puanı beyan edilen yıllık saatten (haftalık saat × kişi × 46 hafta), yapılabilirlik puanı verinin durduğu yerden hesaplanır; bunlar ön değerlendirmedir.
- Yönetim sayfaları şifreyle açılır ve açıkken kendiliğinden yenilenir.
- `Code.gs` değiştirilirse Apps Script'te yeni sürüm dağıtılmalıdır.

## Şirket içi portala taşıma
Sayfalar tek başına çalışan HTML dosyalarıdır. Portal sunucusuna taşınırken yalnızca kayıt adresi değişir: `ayar.js` içindeki adres, portalda aynı işlemleri (`oy`, `liste`, `oneri`, `var`, `oneriler`) karşılayan bir uç noktaya çevrilir. Asistan ipuçları o aşamada yerel modele bağlanabilir.
