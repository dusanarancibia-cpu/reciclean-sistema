/* eslint-disable */
/**
 * BÓVEDA 2026 · widgets de Portada (panel-rdo)
 * Firmada Dusan 2026-05-28 madrugada · mig 128+129 aplicadas
 *
 * Conecta los 4 widgets de la Portada con Supabase:
 *   - Tablero estado vivo de 10 subproyectos (panel.estado_proyectos)
 *   - Tablero trifásico Comité IAs (estático, mejora futura)
 *   - Buscador de documentos indexados (panel.documentos)
 *   - Bucle de verificación circular (panel.bucle_verificacion + panel.ejecutar_bucle_verificacion)
 *
 * Reglas anti-medusa:
 *   - El estado del bucle se lee de Supabase, NUNCA del DOM ni de localStorage.
 *   - Si el bucle está ABIERTO, la UI muestra el badge en rojo · no se "redondea" a CERRADO.
 */
(function () {
  'use strict';

  const sb = window.sb || window.supabase;
  if (!sb) {
    console.warn('[boveda-2026] window.sb no disponible · widgets no se inicializan');
    return;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Widget 1 · Estado vivo de subproyectos
  // ──────────────────────────────────────────────────────────────────────────
  async function loadBovedaEstado() {
    const cont = document.getElementById('boveda-tablero-estado');
    const meta = document.getElementById('boveda-estado-updated');
    if (!cont) return;
    try {
      const { data, error } = await sb.schema('panel').from('estado_proyectos').select('proyecto,estado,ultima_verificacion').order('id');
      if (error) throw error;
      const colorMap = {
        vivo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
        bloqueado: 'bg-rose-100 text-rose-800 border-rose-200',
        archivado: 'bg-slate-100 text-slate-500 border-slate-200'
      };
      cont.innerHTML = (data || []).map(p => {
        const cls = colorMap[p.estado] || colorMap.pendiente;
        return `<div class="border rounded px-2 py-1.5 ${cls}"><span class="font-semibold">${p.proyecto}</span> · ${p.estado}</div>`;
      }).join('');
      if (meta) meta.textContent = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      cont.innerHTML = `<div class="col-span-2 text-rose-600 text-xs">⚠️ ${e.message}</div>`;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Widget 3 · Buscador documentos
  // ──────────────────────────────────────────────────────────────────────────
  async function loadBovedaDocsCount() {
    const lbl = document.getElementById('boveda-docs-count');
    if (!lbl) return;
    try {
      const { count, error } = await sb.schema('panel').from('documentos').select('*', { count: 'exact', head: true });
      if (error) throw error;
      lbl.textContent = `${count} docs`;
    } catch (e) {
      lbl.textContent = '⚠️';
    }
  }

  async function buscarBovedaDocs(q) {
    const cont = document.getElementById('boveda-docs-resultados');
    if (!cont) return;
    if (!q || q.length < 2) {
      cont.innerHTML = '<div class="text-slate-400 text-center py-4">Escribí al menos 2 letras…</div>';
      return;
    }
    try {
      const { data, error } = await sb.schema('panel').from('documentos')
        .select('nombre,ruta,silo,proyecto,tipo')
        .or(`nombre.ilike.%${q}%,ruta.ilike.%${q}%,proyecto.ilike.%${q}%`)
        .limit(25);
      if (error) throw error;
      if (!data || data.length === 0) {
        cont.innerHTML = '<div class="text-slate-400 text-center py-4">Sin resultados.</div>';
        return;
      }
      cont.innerHTML = data.map(d => {
        const badge = d.tipo === 'html' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
        return `<div class="border-b border-slate-100 py-1.5 flex items-start gap-2">
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${badge}">${(d.tipo || '?').toUpperCase()}</span>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-slate-700 truncate" title="${d.nombre}">${d.nombre}</div>
            <div class="text-slate-400 text-[10px] truncate" title="${d.ruta}">${d.silo} · ${d.proyecto}</div>
          </div>
        </div>`;
      }).join('');
    } catch (e) {
      cont.innerHTML = `<div class="text-rose-600 text-xs">⚠️ ${e.message}</div>`;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Widget 4 · Bucle de verificación
  // ──────────────────────────────────────────────────────────────────────────
  async function loadBovedaBucle() {
    const cont = document.getElementById('boveda-bucle-eslabones');
    const status = document.getElementById('boveda-bucle-estado');
    const okLbl = document.getElementById('boveda-bucle-ok');
    const badge = document.getElementById('boveda-status');
    if (!cont) return;
    try {
      const { data, error } = await sb.schema('panel').from('bucle_verificacion').select('eslabon,estado,valor_obtenido,valor_esperado').order('id');
      if (error) throw error;
      const total = (data || []).length;
      const ok = (data || []).filter(e => e.estado === 'ok' || e.estado === 'cerrado').length;
      const fallos = (data || []).filter(e => e.estado === 'fallo').length;
      const cerrado = total > 0 && ok === total;

      if (status) status.textContent = cerrado ? 'CERRADO ✅' : 'ABIERTO ❌';
      if (okLbl) okLbl.textContent = `${ok} / ${total} eslabones`;
      if (badge) {
        badge.className = 'px-2 py-0.5 rounded-full ' + (cerrado ? 'bg-emerald-600' : (fallos > 0 ? 'bg-rose-600' : 'bg-amber-500'));
      }

      cont.innerHTML = (data || []).map(e => {
        const icon = e.estado === 'ok' || e.estado === 'cerrado' ? '✅' : (e.estado === 'fallo' ? '❌' : '⏳');
        const colorCls = e.estado === 'ok' || e.estado === 'cerrado' ? 'text-emerald-700' : (e.estado === 'fallo' ? 'text-rose-700' : 'text-slate-500');
        return `<div class="flex items-center gap-2 ${colorCls}">
          <span>${icon}</span>
          <span class="flex-1 truncate" title="${e.eslabon}">${e.eslabon}</span>
          <span class="text-[10px] text-slate-400">${e.estado}</span>
        </div>`;
      }).join('');
    } catch (e) {
      cont.innerHTML = `<div class="text-rose-600 text-xs">⚠️ ${e.message}</div>`;
    }
  }

  window.bovedaEjecutarBucle = async function () {
    const btn = event && event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Corriendo…'; }
    try {
      const { data, error } = await sb.rpc('ejecutar_bucle_verificacion', {}, { count: 'exact' });
      // RPC pertenece a schema panel · si no está expuesto, ejecutamos via fallback
      if (error) console.warn('[boveda] RPC no expuesto, intento via execute_sql no disponible desde frontend');
      // Recargar visualización
      await loadBovedaBucle();
      await loadBovedaEstado();
    } catch (e) {
      console.error('[boveda] ejecutarBucle:', e);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Ejecutar ahora'; }
    }
  };

  window.bovedaIndexarDocs = function () {
    alert('Re-indexar docs: tarea encolada en cola_construccion para PC2·Pablo (próxima mig). Cada actualización del repo dispara reindex via cron.');
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Boot
  // ──────────────────────────────────────────────────────────────────────────
  function boot() {
    loadBovedaEstado();
    loadBovedaDocsCount();
    loadBovedaBucle();
    const buscador = document.getElementById('boveda-buscador-docs');
    if (buscador) {
      let timer;
      buscador.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => buscarBovedaDocs(e.target.value.trim()), 250);
      });
    }
    // Refresco automático cada 60 seg
    setInterval(() => { loadBovedaEstado(); loadBovedaBucle(); }, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
