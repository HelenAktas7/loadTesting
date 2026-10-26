# Senaryo 3: Kimlik Doğrulama (Authentication / Basic Auth) Test Sonuçları

Bu testte, her gelen istekte `Authorization: Basic ...` başlığı gönderilmiş; her üç Gateway'in de şifreyi çözme, hash doğrulama ve tüketiciyi (consumer) bellekte eşleştirme sürecinde sisteme bindirdiği **kriptografik işlemci maliyeti ve gecikme artışı** ölçülmüştür.

---

## 1. Karşılaştırmalı Büyük Skor Tablosu (Senaryo 3)

| Metrik | 🦍 Kong Gateway | 🚦 Traefik Proxy | ⚡ Apache APISIX | Kazanan / Lider |
| :--- | :--- | :--- | :--- | :--- |
| **Toplam Başarılı İstek** | 93,677 | 102,361 | **102,732** | ⚡ **APISIX (En Yüksek Hacim)** |
| **Throughput (RPS)** | 3,122 req/s | 3,412 req/s | **3,423 req/s** | ⚡ **APISIX & Traefik** |
| **Hata Oranı (Fail %)** | %0.00 | %0.00 | %0.00 | **Hepsi (%100 Başarı)** |
| **Medyan Gecikme (p50)** | 1.92 ms | 1.19 ms | **1.04 ms** | ⚡ **APISIX (En Düşük Gecikme!)** |
| **p90 Gecikmesi** | 4.99 ms | 2.56 ms | **2.48 ms** | ⚡ **APISIX** |
| **p95 Gecikmesi** | 7.01 ms | **3.39 ms** | 3.63 ms | 🚦 **Traefik** |
| **Maksimum Gecikme (Max)** | **49.13 ms** | 140.88 ms | 125.71 ms | 🦍 **Kong (En Kararlı Kuyruk)** |
| **Kimlik Doğrulama Ek Maliyeti ($\Delta$ Latency)** | +0.43 ms | ~0.00 ms | ~0.00 ms | 🚦 **Traefik & APISIX** |

---

## 2. Mühendislik Analizi ve Jüri İçin Değerlendirme

### A) Kripto Doğrulama Şampiyonu: Apache APISIX (1.04 ms p50)
* APISIX, LuaJIT FFI üzerinden C tabanlı OpenSSL fonksiyonlarını doğrudan çağırarak kimlik doğrulama başlığını mikrosaniyeler içinde çözdü.
* Senaryo 1'deki saf yönlendirme hızını (1.07 ms) kimlik doğrulama altında bile neredeyse birebir korudu.

### B) Go Çalışma Zamanının Başarısı: Traefik Proxy (3.412 RPS & 1.19 ms p50)
* Go dilinin standart kütüphanesindeki `crypto/subtle` ve `crypto/sha1` optimizasyonları sayesinde Traefik, Kong'dan saniyede ~300 istek daha fazla hacim üretti.

### C) Kong Gateway Davranışı (+0.43 ms Maliyet)
* Kong `basic-auth` eklentisiyle tüm istekleri %100 başarıyla doğruladı. Ancak her istekte Lua katmanından consumer eşleştirmesi yaptığı için medyan gecikmesi 1.49 ms'den 1.92 ms'ye çıktı (+0.43 ms ek gecikme).
* Yine de maksimum gecikmede (49.13 ms) rakiplerinden daha dar ve kararlı bir dağılım sergiledi.
