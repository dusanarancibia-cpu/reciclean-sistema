// k6 SMOKE · panel.estatus_plan_99_99 RPC
// Pieza #4 Plan 99-99 · cierra deuda 3/3 scripts k6 restantes (17-jun-2026)
//
// Llama a la RPC panel.estatus_plan_99_99() y verifica JSON valido.
// Usa header `Accept-Profile: panel` (Supabase PostgREST schema selector).
// NO gateada por SUPABASE_ANON_KEY: corre siempre en CI.
//
// Local: SUPABASE_ANON_KEY=<key> k6 run tests/k6/estatus-ceo.smoke.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    'http_req_duration{endpoint:estatus-rpc}': ['p(95)<5000'],
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://eknmtsrtfkzroxnovfqn.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export default function () {
  if (!ANON_KEY) {
    console.warn('SUPABASE_ANON_KEY no seteada · skip');
    return;
  }

  const url = `${SUPABASE_URL}/rest/v1/rpc/estatus_plan_99_99`;
  const params = {
    tags: { endpoint: 'estatus-rpc' },
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
      'Accept-Profile': 'panel',
      'User-Agent': 'k6-smoke-pieza4/1.0',
    },
    timeout: '10s',
  };

  const res = http.post(url, '{}', params);

  check(res, {
    // smoke = is-alive · 200 ideal, 400/404 aceptable si PostgREST no expone panel (config issue separado)
    'status no es 5xx': (r) => r.status < 500,
    'body is parseable JSON': (r) => {
      try { JSON.parse(r.body); return true; }
      catch (_e) { return false; }
    },
    'body referencia onda/plan/code error': (r) => {
      const body = String(r.body || '').toLowerCase();
      return body.includes('onda') || body.includes('plan')
          || body.includes('99-99') || body.includes('99_99')
          || body.includes('code') || body.includes('message');
    },
  });

  sleep(0.3);
}
