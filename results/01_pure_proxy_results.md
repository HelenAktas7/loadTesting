# Senaryo 1: Saf Yönlendirme (Pure Proxy / Pass-Through) Test Sonuçları

Bu testte, hiçbir eklenti (Auth, Rate Limit vb.) araya girmeden her üç Gateway de aynı backend servisine eşit kaynak sınırları (1.0 vCPU, 512MB RAM) ve 50 Sanal Kullanıcı (VU) ile 30 saniye boyunca test edilmiştir.

---

## 1. Karşılaştırmalı Büyük Skor Tablosu

| Metrik | Referans (Baseline) | 🦍 Kong Gateway | 🚦 Traefik Proxy | ⚡ Apache APISIX | Kazanan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Toplam Başarılı İstek** | 81,490 | **99,195** | **99,225** | 98,584 | **Traefik** |
| **Throughput (RPS)** | 2,716 req/s | **3,306 req/s** | **3,307 req/s** | 3,286 req/s | **Traefik & Kong** |
| **Hata Oranı (Fail %)** | %0.00 | %0.00 | %0.00 | %0.00 | **Hepsi (%100 Başarı)** |
| **Medyan Gecikme (p50)** | **0.86 ms** | 1.49 ms | 1.31 ms | **1.07 ms** | ⚡ **APISIX (En Hızlı)** |
| **Saf Ek Gecikme (Overhead)** | *0.00 ms* | +0.63 ms | +0.45 ms | **+0.21 ms** | ⚡ **APISIX (En Düşük)** |
| **p90 Gecikmesi** | 6.80 ms | 3.47 ms | 3.20 ms | **3.06 ms** | ⚡ **APISIX** |
| **p95 Gecikmesi** | 14.59 ms | 4.90 ms | **4.67 ms** | 5.32 ms | 🚦 **Traefik** |
| **Maksimum Gecikme (Max)** | 161.45 ms | **56.76 ms** | 60.08 ms | 78.33 ms | 🦍 **Kong (En Kararlı)** |
| **Yük Altında RAM Tüketimi** | ~9.2 MB | 173.3 MB | **53.9 MB** | 188.5 MB | 🚦 **Traefik (3 Kat Az RAM)** |
| **PIDS (İş Parçacıkları)** | 13 | **2** | 18 | 20 | 🦍 **Kong (En Yalın)** |

---

## 2. Mühendislik Analizi ve Jüri İçin Değerlendirme

### A) Saf Gecikme Şampiyonu: Apache APISIX (+0.21 ms Overhead)
* **Neden?** APISIX, Nginx C çekirdeği üzerinde çalışan **Radix Tree (Trie)** rota eşleştirme motoru sayesinde rotayı mikrosaniyeler içinde çözdü.
* İsteklerin %50'sini sadece **1.07 ms** gibi neredeyse doğrudan arka uç hızında tamamladı.

### B) Bellek ve Verimlilik Şampiyonu: Traefik Proxy (53.9 MB RAM)
* **Neden?** Go dilinin derlenmiş binary yapısı ve goroutine mimarisi sayesinde, Kong ve APISIX'e kıyasla **3 kattan daha az RAM** tüketti.
* Hem toplam istek sayısında (99.225) hem de p95 gecikmesinde (4.67 ms) zirveye oturdu.

### C) Kararlılık Şampiyonu: Kong Gateway (Max 56.76 ms)
* **Neden?** Nginx'in olgun master-worker mimarisi ve tek iş parçacıklı event-loop'u sayesinde en yavaş istekte bile (Max Latency) rakiplerinden daha az gecikme dalgalanması yaşadı.
