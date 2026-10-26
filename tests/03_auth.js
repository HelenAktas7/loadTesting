import http from 'k6/http';
import { check, sleep } from 'k6';

// -------------------------------------------------------------
// SENARYO 3: KİMLİK DOĞRULAMA (AUTHENTICATION) TESTİ
// Amaç: Her gelen istekte Authorization başlığındaki kimlik
// bilgilerini çözme, şifre hash'ini doğrulama ve tüketiciyi (consumer)
// bellekte eşleştirme sürecinin sisteme getirdiği KRİPTOGRAFİK
// VE MİDDLEWARE MALİYETİNİ ölçmek.
// -------------------------------------------------------------

export const options = {
  stages: [
    { duration: '5s', target: 50 },   // 5 saniyede 50 sanal kullanıcıya tırman
    { duration: '20s', target: 50 },  // 20 saniye boyunca tam yük
    { duration: '5s', target: 0 },    // 5 saniyede soğuma
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Kimlik doğrulama %99+ başarılı olmalı
  },
};

const GATEWAY_URL = __ENV.GATEWAY_URL;

// Doğru Kimlik Bilgileri: loadtest_user:secret123 (Base64)
const AUTH_HEADERS = {
  headers: {
    'Authorization': 'Basic bG9hZHRlc3RfdXNlcjpzZWNyZXQxMjM=',
  },
};

export default function () {
  const res = http.get(GATEWAY_URL, AUTH_HEADERS);

  check(res, {
    'status is 200 (authenticated)': (r) => r.status === 200,
    'backend header verified': (r) => r.headers['X-Mock-Backend'] === 'Go-UltraFast-v1',
  });

  sleep(0.01);
}
