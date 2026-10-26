# Senaryo 4: Stres, Doygunluk ve Kırılma Noktası (Stress & Saturation) Test Sonuçları

Bu testte, her üç Gateway de normal limitlerin (50 VU) 3 katına çıkarılarak **150 Sanal Kullanıcı (VU)** ve **1 ms düşünme süresi** ile tam doyum (saturation) baskısı altına alınmıştır. Amaç; sistemlerin 1.0 vCPU sınırında çöküp çökmediğini, Little Yasası uyarınca kuyruk gecikmesinin nasıl davrandığını ve toparlanma kabiliyetlerini saptamaktır.

---

## 1. Karşılaştırmalı Büyük Skor Tablosu (Senaryo 4: Stres Zirvesi)

| Metrik | 🦍 Kong Gateway | 🚦 Traefik Proxy | ⚡ Apache APISIX | Kazanan / Lider |
| :--- | :--- | :--- | :--- | :--- |
| **Toplam İşlenen İstek** | 58,117 | 66,452 | **70,587** | ⚡ **APISIX (En Yüksek Hacim)** |
| **Throughput (Zirve RPS)** | 1,660 req/s | 1,898 req/s | **2,016 req/s** | ⚡ **APISIX (Zirve Verim)** |
| **Düşen İstek / Hata (Fail %)** | **%0.00 (0 Hata)** | **%0.00 (0 Hata)** | **%0.00 (0 Hata)** | **Hepsi (%100 Çökmezlik)** |
| **Medyan Gecikme (p50)** | 57.43 ms | 38.11 ms | **31.97 ms** | ⚡ **APISIX (En Hızlı Eritme)** |
| **Ortalama Gecikme (Avg)** | 61.60 ms | 51.98 ms | **47.97 ms** | ⚡ **APISIX** |
| **p90 Gecikmesi** | 108.29 ms | 107.39 ms | **103.76 ms** | ⚡ **APISIX** |
| **p95 Gecikmesi** | **129.32 ms** | 151.42 ms | 144.19 ms | 🦍 **Kong (En Dar Kuyruk)** |
| **Maksimum Gecikme (Max)** | **331.48 ms** | 418.42 ms | 530.96 ms | 🦍 **Kong (En İyi Kuyruk Kararlılığı)** |
| **Stres Altında RAM** | 238.1 MB | **36.4 MB** | 215.3 MB | 🚦 **Traefik (6.5 Kat Daha Az RAM!)** |
| **İş Parçacıkları (PIDS)** | **2** | 20 | 20 | 🦍 **Kong** |

---

## 2. Mühendislik ve Mimari Değerlendirme (Sunumunuz İçin Altın Bulgular)

### A) Yüksek Hacim ve Hızlı Eritme Şampiyonu: Apache APISIX (70.587 İstek & 31.97 ms p50)
* APISIX, Nginx C çekirdeği + Radix Tree algoritması sayesinde 150 paralel kullanıcının soket baskısını en yüksek hacimle (saniyede 2.016 istek) ve en düşük medyan gecikmeyle (31.97 ms) eritmeyi başardı.
* Kuyruk birikmesine rağmen işlemci döngülerini rakiplerine göre en verimli kullanan motor oldu.

### B) Bellek Mucizesi: Traefik Proxy (Sadece 36.4 MB RAM!)
* Kong 238 MB, APISIX 215 MB RAM'e tırmanırken; Traefik 150 sanal kullanıcının fırtınası altında **yalnızca 36.4 MB RAM** harcadı.
* Ancak Go'nun Çöp Toplayıcısı (Garbage Collector) ve Goroutine scheduler bağlam geçişi (context switching) nedeniyle, en yavaş %5'lik dilimde (p95: 151.4 ms) kuyruk gecikmesi Kong'dan daha yüksek çıktı.

### C) Kuyruk Yönetimi ve Kararlılık Şampiyonu: Kong Gateway (Max 331 ms & p95 129 ms)
* Kong daha az toplam istek işledi (58.117), ancak **kuyruğa aldığı isteklerin gecikme sapmasını (jitter) en dar aralıkta tuttu**.
* En talihsiz istekte bile (Max Latency 331 ms) rakiplerinin 418 ms ve 530 ms'lik piklerine göre çok daha kontrollü bir tavan çizdi. Nginx'in olgun TCP soket kuyruk yönetiminin gücünü gösterdi.
