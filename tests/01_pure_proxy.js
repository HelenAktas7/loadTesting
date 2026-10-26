import http from 'k6/http';
import { check, sleep } from 'k6';

// -------------------------------------------------------------
// SENARYO 1: SAF YÖNLENDİRME (PURE PROXY / PASS-THROUGH) TESTİ
// Amaç: Herhangi bir auth veya rate-limit eklentisi olmadan,
// Gateway'in gelen isteği yakalayıp hedef servise iletme ve
// cevabı döndürme esnasında sisteme eklediği SAF GECİKMEYİ
// (Overhead) ve işleyebileceği MAKSİMUM HACMİ (RPS) ölçmek.
// -------------------------------------------------------------

export const options = {
  stages: [
    { duration: '5s', target: 50 },   // 5 saniyede 50 sanal kullanıcıya (VU) tırman
    { duration: '20s', target: 50 },  // 20 saniye boyunca 50 VU ile doyum yükü
    { duration: '5s', target: 0 },    // 5 saniyede soğuma (cool-down)
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Hata oranı %1'in altında olmalı
  },
};

// Hedef URL komut satırından dinamik olarak verilir:
// Örn: -e GATEWAY_URL=http://kong-gateway:8000/api/v1/test
const GATEWAY_URL = __ENV.GATEWAY_URL;

export default function () {
  const res = http.get(GATEWAY_URL);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'backend header verified': (r) => r.headers['X-Mock-Backend'] === 'Go-UltraFast-v1',
  });

  // Baseline ile 1:1 birebir aynı şartlar için 10ms bekleme
  sleep(0.01);
}
