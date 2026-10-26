import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// -------------------------------------------------------------
// SENARYO 4: STRES VE DOYGUNLUK (BREAKING POINT) TESTİ
// Amaç: Normal yük sınırlarını (50 VU) aşarak yükü kademeli
// olarak 150 Sanal Kullanıcıya (VU) ve saniyede 10.000+ isteğe
// çıkarmak; Gateway'lerin doyum (saturation) ve kırılma noktalarını,
// bellek taşması (OOM) veya bağlantı düşmesi (5xx) yaşayıp
// yaşamadıklarını tespit etmek.
// -------------------------------------------------------------

// Özel Hata ve Başarı Sayaçları
const successCount = new Counter('stress_success_2xx');
const errorCount = new Counter('stress_error_5xx');
const timeoutRate = new Rate('stress_fail_rate');

export const options = {
  stages: [
    { duration: '5s', target: 50 },    // Aşama 1: 50 VU ile başla (Normal Yük)
    { duration: '10s', target: 150 },  // Aşama 2: 150 VU'ya tırman (Ağır Baskı)
    { duration: '15s', target: 150 },  // Aşama 3: 150 VU'da kal (Tam Doyum / Stres Zirvesi)
    { duration: '5s', target: 0 },     // Aşama 4: Yükü sıfırla (Toparlanma / Recovery Kontrolü)
  ],
  thresholds: {
    // Stres testinde amacımız kırılma noktasını görmek olduğu için
    // testi yarıda kesmemek adına hata eşiğini esnek tutuyoruz.
    stress_fail_rate: ['rate<0.10'], // Hata oranı %10 altında kalabiliyor mu?
  },
};

const GATEWAY_URL = __ENV.GATEWAY_URL;

// Kimlik doğrulama başlığı (Senaryo 3 ile uyumlu)
const HEADERS = {
  headers: {
    'Authorization': 'Basic bG9hZHRlc3RfdXNlcjpzZWNyZXQxMjM=',
  },
};

export default function () {
  const res = http.get(GATEWAY_URL, HEADERS);

  if (res.status >= 200 && res.status < 300) {
    successCount.add(1);
    timeoutRate.add(0);
  } else {
    errorCount.add(1);
    timeoutRate.add(1);
  }

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'no 5xx error': (r) => r.status < 500,
  });

  // Maksimum soket doyumu için düşünme süresini (think time) 1 ms'ye indirdik
  sleep(0.001);
}
