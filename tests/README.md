# Test Senaryoları (k6)
Bu dizinde her bir test senaryosu için k6 yük testi scriptleri yer alacaktır:
- 00_baseline.js: Doğrudan backend testi (referans gecikme)
- 01_pure_proxy.js: Eklentisiz doğrudan yönlendirme testi
- 02_rate_limiting.js: Rate limit kuralı altındaki performans
- 03_auth_jwt.js: JWT doğrulama eklentisi altındaki performans
- 04_stress_saturation.js: Doygunluk ve kırılma noktası testi
