// k6 SMOKE · auth/v1/token Supabase login
// Pieza #4 Plan 99-99 · cierra deuda 3/3 scripts k6 restantes (17-jun-2026)
//
// Verifica que el endpoint de login responde a credenciales QA.
// Gateada por SUPABASE_ANON_KEY (workflow k6.yml job "smoke" tiene `if: env.SUPABASE_ANON_KEY != ''`).
// Si QA_EMAIL/QA_PASSWORD no estan, valida que el endpoint devuelve error parseable
// (validacion del contrato, no del flujo completo).
//
// Local: SUPABASE_ANON_KEY=<key> QA_EMAIL=<email> QA_PASSWORD=<pwd> k6 run tests/k6/login.smoke.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    'http_req_duration{endpoint:auth-login}': ['p(95)<5000'],
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://eknmtsrtfkzroxnovfqn.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const QA_EMAIL = __ENV.QA_EMAIL || 'qa-smoke@reciclean.cl';
const QA_PASSWORD = __ENV.QA_PASSWORD || 'k6-smoke-invalid-by-default';

export default function () {
  if (!ANON_KEY) {
    console.warn('SUPABASE_ANON_KEY no seteada · skip');
    return;
  }

  const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const payload = JSON.stringify({
    email: QA_EMAIL,
    password: QA_PASSWORD,
  });
  const params = {
    tags: { endpoint: 'auth-login' },
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
      'User-Agent': 'k6-smoke-pieza4/1.0',
    },
    timeout: '10s',
  };

  const res = http.post(url, payload, params);

  // El endpoint debe responder con 200 + access_token (credencial valida)
  // o 400/401/422 con JSON describiendo el error (credencial invalida).
  // Cualquier 5xx es falla del servicio.
  check(res, {
    'status no es 5xx': (r) => r.status < 500,
    'body es JSON parseable': (r) => {
      try { JSON.parse(r.body); return true; }
      catch (_e) { return false; }
    },
    'access_token o mensaje de error presente': (r) => {
      try {
        const j = JSON.parse(r.body);
        return j.access_token !== undefined
            || j.error !== undefined
            || j.error_description !== undefined
            || j.msg !== undefined
            || j.message !== undefined;
      } catch (_e) { return false; }
    },
  });

  sleep(0.3);
}
