import http from 'k6/http';
import { check, sleep } from 'k6';

// -------------------------------------------------------------
// SENARYO 0: BASELINE (REFERANS) TESTİ
// Amaç: Arada hiçbir Gateway olmadan doğrudan Go Mock Backend'e
// istek atarak sistemin en yalın halindeki tavan performansını
// ve minimum gecikmesini (p50, p95, p99) ölçmek.
// -------------------------------------------------------------

export const options = {
  // Test Aşamaları (Ramping VUs)
  stages: [
    { duration: '5s', target: 50 },   // 5 saniyede 50 sanal kullanıcıya (VU) çık
    { duration: '20s', target: 50 },  // 20 saniye boyunca 50 VU ile sabit yük uygula
    { duration: '5s', target: 0 },    // 5 saniyede yükü sıfırla (cool-down)
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Hata oranı %1'in altında olmalı
    http_req_duration: ['p(95)<10'],  // p95 gecikmesi 10ms altında olmalı (Doğrudan serviste beklenen: <1-2ms)
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://mock-backend:8080/api/v1/test';

export default function () {
  const res = http.get(BASE_URL);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'backend header verified': (r) => r.headers['X-Mock-Backend'] === 'Go-UltraFast-v1',
  });

  // Gerçekçi kullanıcı davranışı için mikro duraklama (isteğe bağlı, kaldırılabilir)
  sleep(0.01);
}
