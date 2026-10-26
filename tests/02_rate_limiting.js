import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// -------------------------------------------------------------
// SENARYO 2: HIZ SINIRLAMA (RATE LIMITING) TESTİ
// Kural: Saniyede 200 istek kotası.
// Yük: 50 Sanal Kullanıcı (VU) ile saniyede ~3.000 istek yağdıracağız.
// Beklenti:
//  - Saniyede ~200 istek 200 OK almalı (Hedefe iletilmeli).
//  - Kalan ~2.800 istek anında 429 Too Many Requests ile kesilmeli.
//  - Gateway'ler kilitlenme (lock contention) veya 5xx hatası yaşamamalı.
// -------------------------------------------------------------

// Özel Metrik Sayaçları
const count200 = new Counter('http_200_allowed');
const count429 = new Counter('http_429_rate_limited');
const countErrors = new Counter('http_5xx_unexpected_errors');

export const options = {
  stages: [
    { duration: '5s', target: 50 },   // 5 saniyede 50 sanal kullanıcıya tırman
    { duration: '20s', target: 50 },  // 20 saniye boyunca tam yük uygula
    { duration: '5s', target: 0 },    // 5 saniyede yükü sıfırla
  ],
  thresholds: {
    // 5xx sunucu hatası kesinlikle %0 olmalıdır
    http_5xx_unexpected_errors: ['count==0'],
  },
};

const GATEWAY_URL = __ENV.GATEWAY_URL;

export default function () {
  const res = http.get(GATEWAY_URL);

  if (res.status === 200) {
    count200.add(1);
  } else if (res.status === 429) {
    count429.add(1);
  } else {
    countErrors.add(1);
  }

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'no 5xx server error': (r) => r.status < 500,
  });

  sleep(0.01);
}
