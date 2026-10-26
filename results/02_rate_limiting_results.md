# Senaryo 2: Hız Sınırlama (Rate Limiting) Test Sonuçları

Bu testte, her üç Gateway'e de **aynı IP için Saniyede 200 İstek (200 req/sec)** kotası konulmuş ve 50 Sanal Kullanıcı (VU) ile saniyede yaklaşık 3.000 istek gönderilerek sistemler yoğun bir kota aşımı baskısına sokulmuştur.

---

## 1. Karşılaştırmalı Büyük Skor Tablosu (Senaryo 2)

| Metrik | 🦍 Kong Gateway | 🚦 Traefik Proxy | ⚡ Apache APISIX | Kazanan / Lider |
| :--- | :--- | :--- | :--- | :--- |
| **Toplam İşlenen İstek** | 88,227 | **101,853** | 95,180 | 🚦 **Traefik (En Yüksek Hacim)** |
| **İzin Verilen İstek (200 OK)** | 6,249 (~208 req/s) | 5,670 (~189 req/s) | **6,000 (Tam 200.0 req/s!)** | ⚡ **APISIX (Nokta Atışı Hassasiyet)** |
| **Engellenen İstek (429)** | 81,978 | **96,183** | 89,180 | 🚦 **Traefik** |
| **Beklenmeyen Hata (5xx)** | **%0.00 (0 Hata)** | **%0.00 (0 Hata)** | **%0.00 (0 Hata)** | **Hepsi (%100 Güvenli)** |
| **Medyan Gecikme (p50)** | 1.17 ms | **0.68 ms (682 µs)** | 0.69 ms (695 µs) | 🚦 **Traefik & APISIX (< 1 ms)** |
| **p90 Gecikmesi** | 7.42 ms | **2.86 ms** | 2.96 ms | 🚦 **Traefik** |
| **p95 Gecikmesi** | 12.91 ms | **4.15 ms** | 5.35 ms | 🚦 **Traefik** |
| **Maksimum Gecikme (Max)** | 109.14 ms | **49.57 ms** | 495.25 ms | 🚦 **Traefik (En Kararlı)** |
| **Yük Altında RAM** | 171.1 MB | **30.9 MB** | 180.5 MB | 🚦 **Traefik (6 Kat Daha Az RAM!)** |
| **İş Parçacıkları (PIDS)** | **2** | 19 | 20 | 🦍 **Kong** |

---

## 2. Mühendislik Analizi ve Jüri İçin Değerlendirme

### A) Nokta Atışı Kota Doğruluğu: Apache APISIX (Tam 6.000 İstek / 30 sn = 200 req/s)
* **Neden?** APISIX'in `limit-count` eklentisi 30 saniyelik test boyunca tam olarak 6.000 isteğe `200 OK` vermiş, kalan 89.180 isteği ise milisaniyenin altında `429` ile engellemiştir.
* Matematiksel doğrulukta sıfır sapma göstermiştir.

### B) Hız Sınırlama ve Bellek Şampiyonu: Traefik Proxy (30.9 MB RAM & 0.68 ms p50)
* **Neden?** Traefik'in Go tabanlı Token Bucket algoritması muazzam bir performans sergiledi.
* Engellenen 96.183 isteği **0.68 ms (682 mikrosaniye)** gibi olağanüstü bir hızda geri çevirerek arkadaki Go servisini tamamen korudu.
* 100.000'den fazla isteği karşılarken sadece **30.9 MB RAM** harcadı.

### C) Kong Gateway Davranışı (1.17 ms p50)
* Kong'un `rate-limiting` eklentisi Nginx paylaşımlı belleğinde (`shm`) sorunsuz çalıştı.
* Ancak Traefik ve APISIX'e göre sayaç senkronizasyonunda p95 gecikmesi biraz daha yüksek çıktı (12.91 ms).
