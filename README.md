# ⚡ API Gateway Performance & Architectural Load Benchmark
### Kong vs. Traefik Proxy vs. Apache APISIX

Bu repo, modern mikroservis mimarilerinde en çok tercih edilen 3 büyük açık kaynaklı **API Gateway** çözümünün (**Kong**, **Traefik**, **Apache APISIX**) eşit donanım sınırları altında gecikme (latency), verim (throughput/RPS), bellek (RAM) ve doygunluk (stress) performanslarını bilimsel olarak karşılaştıran uçtan uca bir kıyaslama (benchmarking) çalışmasıdır.

---

## 🏗️ Mimari ve Test Laboratuvarı

Tüm bileşenler aynı izole Docker köprü ağında (`loadtest-net`) ve eşit donanım sınırlarıyla (**1.0 vCPU, 512MB RAM**) çalıştırılmıştır:

```
                  ┌──────────────────────────────────────────────┐
                  │             YÜK TESTİ İSTEMCİSİ              │
                  │                (Grafana k6)                  │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTP İstekleri
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
          ┌───────────────────┐┌───────────────────┐┌───────────────────┐
          │   Kong Gateway    ││   Traefik Proxy   ││   Apache APISIX   │
          │   (Port: 8000)    ││   (Port: 8082)    ││   (Port: 9080)    │
          │ Nginx + LuaJIT    ││ Go M:N Goroutines ││ RadixTree Routing │
          └─────────┬─────────┘└─────────┬─────────┘└─────────┬─────────┘
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         │ Proxy Yönlendirmesi
                                         ▼
                          ┌─────────────────────────────┐
                          │   MOCK HEDEF SERVİS (GO)    │
                          │   (Port: 8081) ~0.86 ms     │
                          └─────────────────────────────┘
```

---

## 📊 Özet Karşılaştırma Tablosu

| Metrik / Senaryo | Referans (Backend) | 🦍 Kong Gateway | 🚦 Traefik Proxy | ⚡ Apache APISIX | Kazanan |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Senaryo 1: Saf Proxy (p50)** | **0.86 ms** | 1.49 ms (+0.63ms) | 1.31 ms (+0.45ms) | **1.07 ms (+0.21ms)** | ⚡ **APISIX (En Hızlı)** |
| **Senaryo 1: Yük Altında RAM** | ~9 MB | 173.3 MB | **53.9 MB** | 188.5 MB | 🚦 **Traefik (3 Kat Az)** |
| **Senaryo 2: Rate Limit 429 Hızı**| - | 1.17 ms | **0.68 ms (682 µs)** | 0.69 ms | 🚦 **Traefik & APISIX** |
| **Senaryo 2: Kota Hassasiyeti** | - | ~208 req/s | ~189 req/s | **Tam 200.0 req/s** | ⚡ **APISIX (Sıfır Hata)** |
| **Senaryo 3: Kimlik Doğrulama** | - | 1.92 ms | 1.19 ms | **1.04 ms** | ⚡ **APISIX (En Hızlı)** |
| **Senaryo 4: Stres (150 VU) Hacim**| - | 58,117 İstek | 66,452 İstek | **70,587 İstek** | ⚡ **APISIX (Zirve Hacim)**|
| **Senaryo 4: p95 Kuyruk Stabilitesi**| - | **129.32 ms** | 151.42 ms | 144.19 ms | 🦍 **Kong (En Dar Jitter)**|

---

## 🎨 İnteraktif Web Kontrol Paneli (Dashboard)

Sonuçları görselleştirmek ve canlı gateway denetimi yapmak için `dashboard/index.html` arayüzü sunulmuştur:
- **Canlı Gateway Test Konsolu:** Gateway'lere tek tıkla HTTP isteği fırlatıp başlıkları (`X-Kong-Proxy-Latency`, `Server`, `X-RateLimit-Limit`) inceleme.
- **İnteraktif Grafikler:** Chart.js ile 4 senaryonun gecikme, throughput ve bellek grafikleri.
- **Mimari Yetenek Radarı:** 5 eksende (Gecikme, Verim, Bellek, Stabilite, Olgunluk) karşılaştırma.

---

## 🚀 Projeyi Yerelde Çalıştırma

### 1. Servisleri Ayağa Kaldırma
```bash
docker compose up -d
```

### 2. Arayüzü Başlatma
```bash
python -m http.server 3000 --directory dashboard
# Tarayıcıda açın: http://localhost:3000
```

### 3. Yük Testlerini Koşturma
```bash
# Senaryo 1: Saf Yönlendirme (Pure Proxy)
docker run --rm --network loadtest-net -v "${PWD}/tests:/tests" -e GATEWAY_URL=http://kong-gateway:8000/api/v1/test grafana/k6 run /tests/01_pure_proxy.js

# Senaryo 2: Hız Sınırlama (Rate Limiting)
docker run --rm --network loadtest-net -v "${PWD}/tests:/tests" -e GATEWAY_URL=http://traefik-proxy:80/api/v1/test grafana/k6 run /tests/02_rate_limiting.js

# Senaryo 3: Kimlik Doğrulama (Authentication)
docker run --rm --network loadtest-net -v "${PWD}/tests:/tests" -e GATEWAY_URL=http://apisix-gateway:9080/api/v1/test grafana/k6 run /tests/03_auth.js

# Senaryo 4: Ağır Stres & Doygunluk (150 VU)
docker run --rm --network loadtest-net -v "${PWD}/tests:/tests" -e GATEWAY_URL=http://apisix-gateway:9080/api/v1/test grafana/k6 run /tests/04_stress_saturation.js
```

---

## 📁 Dizin Yapısı
```
├── backend/          # Go diliyle yazılmış ultra-hafif mock servis
├── gateways/
│   ├── kong/         # Kong deklaratif DB-less yapılandırması
│   ├── traefik/      # Traefik statik ve dinamik yapılandırması
│   └── apisix/       # Apache APISIX standalone yapılandırması
├── tests/            # JavaScript tabanlı Grafana k6 test senaryoları
├── results/          # Senaryo bazlı detaylı akademik test raporları
├── dashboard/        # İnteraktif Web Analiz ve Kontrol Paneli
└── docs/             # Teorik ve mimari altyapı dokümantasyonu
```
