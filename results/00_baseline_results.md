# Senaryo 0: Referans (Baseline) Test Sonuçları

Bu test, hiçbir Gateway (Kong, Traefik, APISIX) araya girmeden doğrudan Go Mock Backend servisine (`http://mock-backend:8080/api/v1/test`) atılan isteklerin referans çıktısıdır.

## 1. Test Ortamı ve Parametreleri
- **Test Aracı:** Grafana k6 (Docker konteyneri içinde, `loadtest-net` ağı)
- **Süre:** 30 saniye (5s ramp-up, 20s steady, 5s cool-down)
- **Sanal Kullanıcı (VU):** Maksimum 50 VU
- **Hedef:** `http://mock-backend:8080/api/v1/test`
- **Tarih:** 2026-10-21

## 2. Temel Metrikler (Baseline)

| Metrik | Değer | Açıklama |
| :--- | :--- | :--- |
| **Toplam İstek (Requests)** | **81,490** | 30 saniyede başarıyla tamamlanan istek sayısı |
| **Throughput (RPS)** | **2,715.88 req/s** | Saniyedeki istek hacmi (10ms sleep dahil) |
| **Hata Oranı (Fail Rate)** | **%0.00 (0 / 81,490)** | Sıfır bağlantı veya HTTP hatası |
| **Minimum Gecikme (Min)** | **81.8 µs (0.08 ms)** | Bir isteğin gördüğü en düşük süre |
| **Medyan Gecikme (p50)** | **861.48 µs (0.86 ms)** | İsteklerin %50'si 1 ms'nin altında! |
| **Ortalama Gecikme (Avg)** | **3.09 ms** | Aritmetik ortalama |
| **p90 Gecikmesi** | **6.80 ms** | İsteklerin %90'ının tamamlandığı süre |
| **p95 Gecikmesi** | **14.59 ms** | En yavaş %5'lik dilim eşiği |
| **Maksimum Gecikme (Max)**| **161.45 ms** | Docker bridge ağı / OS anlık gecikmesi |

## 3. Karşılaştırma Notu (Overhead Formülü)
İlerleyen aşamalarda Kong, Traefik ve APISIX test edildiğinde ek gecikme (overhead) şu formülle hesaplanacaktır:

$$\text{Overhead (Ek Gecikme)} = \text{Gateway } p50 - 0.86\text{ ms}$$
$$\text{Overhead } p95 = \text{Gateway } p95 - 14.59\text{ ms}$$
