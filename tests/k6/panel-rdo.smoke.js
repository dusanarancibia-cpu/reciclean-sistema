// k6 SMOKE · panel-rdo prod
// Pieza #4 Plan 99-99 · firma C2.a + cierre Riesgo R1 sesion 17-jun-2026
//
// Objetivo: verificar que panel-rdo.html sirve HTTP 200 desde Vercel prod
// con presupuesto de latencia p95 < 3s (umbral SPEC k6 HTML L432).
//
// Ejecutar local: k6 run tests/k6/panel-rdo.smoke.js
// Ejecutar CI: ./.github/workflows/k6.yml job "smoke"

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    'http_req_failed{endpoint:panel-rdo}': ['rate==0'],
    'http_req_duration{endpoint:panel-rdo}': ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.E2E_BASE_URL || 'https://reciclean-sistema.vercel.app';

export default function () {
  const res = http.get(`${BASE_URL}/panel-rdo.html`, {
    tags: { endpoint: 'panel-rdo' },
    headers: { 'User-Agent': 'k6-smoke-pieza4/1.0' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has html': (r) => typeof r.body === 'string' && r.body.includes('<html'),
    'body has panel anchor': (r) => typeof r.body === 'string' && r.body.toLowerCase().includes('panel'),
  });

  sleep(0.5);
}
