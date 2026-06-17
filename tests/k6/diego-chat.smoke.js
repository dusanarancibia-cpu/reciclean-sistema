// k6 SMOKE · diego-chat-process EF
// Pieza #4 Plan 99-99 · cierra deuda 3/3 scripts k6 restantes (17-jun-2026)
//
// Envia un mensaje minimo a diego-chat-process y verifica HTTP 200 + cuerpo.
// Gateada por SUPABASE_ANON_KEY (workflow k6.yml job "smoke" tiene `if: env.SUPABASE_ANON_KEY != ''`).
//
// Local: SUPABASE_ANON_KEY=<key> k6 run tests/k6/diego-chat.smoke.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    // smoke = is-alive · cualquier respuesta no-5xx vale
    'http_req_duration{endpoint:diego-chat}': ['p(95)<20000'],
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://eknmtsrtfkzroxnovfqn.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export default function () {
  if (!ANON_KEY) {
    console.warn('SUPABASE_ANON_KEY no seteada · skip smoke');
    return;
  }

  const url = `${SUPABASE_URL}/functions/v1/diego-chat-process`;
  const payload = JSON.stringify({
    message: 'ping',
    user_id: 'k6-smoke-test@reciclean.cl',
    smoke_runtime_id: `k6-smoke-${Date.now()}`,
  });
  const params = {
    tags: { endpoint: 'diego-chat' },
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
      'User-Agent': 'k6-smoke-pieza4/1.0',
    },
    timeout: '25s',
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200 or 4xx (no 5xx)': (r) => r.status >= 200 && r.status < 500,
    'body is parseable JSON': (r) => {
      try { return typeof JSON.parse(r.body) === 'object'; }
      catch (_e) { return false; }
    },
    'response is non-empty': (r) => r.body && r.body.length > 0,
  });

  sleep(0.5);
}
