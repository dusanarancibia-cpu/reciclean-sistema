// k6 LOAD sostenida · panel-rdo prod
// Pieza #4 Plan 99-99 · job "load-weekly" del workflow k6.yml
//
// Carga minima representativa: 1 VU sostenido durante 10s con ramp up/down.
// Umbrales mas estrictos que smoke porque mide tendencia, no chequeo binario.
//
// Ejecutar local: k6 run tests/k6/panel-rdo.load.js
// Ejecutar CI: schedule lunes 10:00 UTC o workflow_dispatch.

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 1 },
    { duration: '10s', target: 1 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    'http_req_failed{endpoint:panel-rdo}': ['rate<0.05'],
    'http_req_duration{endpoint:panel-rdo}': ['p(95)<3000', 'p(99)<5000'],
  },
};

const BASE_URL = __ENV.E2E_BASE_URL || 'https://reciclean-sistema.vercel.app';

export default function () {
  const res = http.get(`${BASE_URL}/panel-rdo.html`, {
    tags: { endpoint: 'panel-rdo' },
    headers: { 'User-Agent': 'k6-load-pieza4/1.0' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
