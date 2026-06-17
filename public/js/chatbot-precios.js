/* ============================================================
 * chatbot-precios.js
 * Extensión del chatbot Diego para flujo "graba precios de X"
 * D-DIEGO-PRECIOS-CLIENTE-001 · firmada Dusan 16-jun-2026
 * Generado por PC1_dusan
 *
 * 6 vacíos resueltos:
 *  V1. detectarIntencion(mensaje)          → regex en cascada
 *  V2. extraerCliente(mensaje, metadatos)  → prioridad msg > meta > pregunta
 *  V3. crearClienteConTimeout(nombre)      → timeout 30s + creación auto
 *  V4. detectarMultiplesClientes(mensaje)  → separadores + procesamiento secuencial
 *  V5. procesarArchivo(archivo)            → llama EF + degradación elegante
 *  V6. notificarAprobadores(tipo, n)       → WhatsApp/Correo + badge bandeja
 *
 * REGLAS R-AUD CUMPLIDAS
 *  R-AUD-064: este JS debe pasar `node --check` (parse) antes de merge
 *  R-AUD-077: cero stub (degradación elegante a manual)
 *  R-AUD-080 tipo A: smoke runtime obligatorio en panel staging antes de prod
 * ============================================================ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // CONFIG
  // ─────────────────────────────────────────────────────────
  const EF_PROCESAR_PRECIOS_URL =
    'https://eknmtsrtfkzroxnovfqn.functions.supabase.co/procesar-precios';
  const TIMEOUT_CLIENTE_NUEVO_MS = 30_000; // V3: 30 segundos
  const SEPARADORES_CLIENTES = /\s*(?:,|;|\sy\s|\se\s|\+)\s*/i; // V4
  // H3 · Umbrales auto-aprobación por confidence_score (C2 17-jun PM-4)
  // >= 0.9 · auto-aprueba como histórico · no requiere ojo humano
  //  < 0.6 · descarta · pide al usuario re-tipear esa línea
  // 0.6 a 0.89 · bandeja humana normal
  const CONFIDENCE_AUTO_APROBAR = 0.9;
  const CONFIDENCE_MIN_REQUERIDO = 0.6;

  // ─────────────────────────────────────────────────────────
  // V1 · detectarIntencion(mensaje) → { intencion, raw_clientes } | null
  // ─────────────────────────────────────────────────────────
  function detectarIntencion(mensaje) {
    if (!mensaje || typeof mensaje !== 'string') return null;
    const limpio = mensaje.trim();

    // Patrones en cascada (más específico arriba)
    const patrones = [
      // "graba estos precios de HUAL"
      /graba(?:r)?\s+(?:estos|los|estos\s+nuevos)?\s*precios?\s+(?:de|del|para)\s+(.+?)$/i,
      // "registra precios cliente X"
      /(?:registra|guarda|sube)\s+(?:los?\s+)?precios?\s+(?:de|del|cliente)?\s+(.+?)$/i,
      // "estos son los precios de X"
      /(?:estos|aquí|aqui)\s+(?:son|tienes|van)\s+(?:los\s+)?precios?\s+(?:de|del)\s+(.+?)$/i,
      // fallback: solo "precios X"
      /^\s*precios?\s+(?:de\s+)?(.+?)$/i,
    ];

    for (const re of patrones) {
      const m = limpio.match(re);
      if (m && m[1]) {
        return { intencion: 'grabar_precios', raw_clientes: m[1].trim() };
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────
  // V4 · detectarMultiplesClientes(raw) → [string]
  // ─────────────────────────────────────────────────────────
  function detectarMultiplesClientes(raw) {
    if (!raw) return [];
    const partes = raw.split(SEPARADORES_CLIENTES).map((s) => s.trim()).filter(Boolean);
    return partes;
  }

  // ─────────────────────────────────────────────────────────
  // V2 · extraerCliente(mensaje, metadatos) → { id, razon_social, es_referente } | null
  // Prioridad: mensaje > metadatos > pregunta al usuario
  // ─────────────────────────────────────────────────────────
  async function extraerCliente(nombreCandidato, metadatos, sb) {
    if (!sb) throw new Error('Cliente Supabase requerido');

    // Prioridad 1: del mensaje (nombreCandidato)
    if (nombreCandidato) {
      const { data, error } = await sb
        .schema('curated')
        .from('clientes')
        .select('cliente_id, razon_social, es_referente_precio')
        .ilike('razon_social', `%${nombreCandidato}%`)
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        return {
          id: data.cliente_id,
          razon_social: data.razon_social,
          es_referente: data.es_referente_precio === true,
          fuente: 'mensaje',
        };
      }
    }

    // Prioridad 2: metadatos (sucursal_id, usuario_id)
    if (metadatos && metadatos.cliente_id) {
      const { data, error } = await sb
        .schema('curated')
        .from('clientes')
        .select('cliente_id, razon_social, es_referente_precio')
        .eq('cliente_id', metadatos.cliente_id)
        .maybeSingle();
      if (!error && data) {
        return {
          id: data.cliente_id,
          razon_social: data.razon_social,
          es_referente: data.es_referente_precio === true,
          fuente: 'metadatos',
        };
      }
    }

    // Prioridad 3: no encontrado → null y el caller pregunta
    return null;
  }

  // ─────────────────────────────────────────────────────────
  // V3 · crearClienteConTimeout(nombre, sb) → cliente | null
  // Pregunta al usuario; si no responde en 30s, crea automático histórico
  // ─────────────────────────────────────────────────────────
  function crearClienteConTimeout(nombre, sb, uiPreguntar) {
    return new Promise((resolve, reject) => {
      let resuelto = false;

      const timer = setTimeout(async () => {
        if (resuelto) return;
        resuelto = true;
        // V3 fallback: crear automático como histórico
        try {
          const cliente = await crearClienteHistoricoBasico(nombre, sb);
          resolve({ ...cliente, fuente: 'timeout_auto' });
        } catch (e) {
          reject(e);
        }
      }, TIMEOUT_CLIENTE_NUEVO_MS);

      // uiPreguntar es una callback inyectada que muestra los botones Sí/No al usuario
      uiPreguntar(nombre, async (respuesta) => {
        if (resuelto) return;
        resuelto = true;
        clearTimeout(timer);
        if (respuesta === 'si') {
          try {
            const cliente = await crearClienteHistoricoBasico(nombre, sb);
            resolve({ ...cliente, fuente: 'usuario_confirma' });
          } catch (e) {
            reject(e);
          }
        } else {
          resolve(null); // usuario dijo no, aborta
        }
      });
    });
  }

  async function crearClienteHistoricoBasico(nombre, sb) {
    const cliente_id = nombre.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 40);
    const { data, error } = await sb
      .schema('curated')
      .from('clientes')
      .insert({
        cliente_id,
        razon_social: nombre.trim(),
        es_referente_precio: false, // V3 default: histórico
        activo: true,
        created_by: 'diego_chatbot_precios',
        fuente_origen: 'diego_chat_precios_cliente',
      })
      .select('cliente_id, razon_social')
      .single();
    if (error) throw new Error(`crearCliente falló: ${error.message}`);
    return { id: data.cliente_id, razon_social: data.razon_social, es_referente: false };
  }

  // ─────────────────────────────────────────────────────────
  // V5 · procesarArchivo(archivo, cliente_id) → items[] | { manual_required, reason }
  // ─────────────────────────────────────────────────────────
  async function procesarArchivo(archivo, cliente_id) {
    if (!archivo || !(archivo instanceof File || archivo instanceof Blob)) {
      return { manual_required: true, reason: 'archivo_invalido' };
    }
    const form = new FormData();
    form.append('archivo', archivo);
    if (cliente_id) form.append('cliente_id', cliente_id);

    try {
      const res = await fetch(EF_PROCESAR_PRECIOS_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAnonKey()}` },
        body: form,
      });
      const json = await res.json();
      if (!json.ok) {
        return { manual_required: true, reason: json.reason || 'ef_fallo' };
      }
      return { items: json.items || [], metricas: json.metricas };
    } catch (e) {
      return { manual_required: true, reason: `red_fallo: ${e.message}` };
    }
  }

  function getAnonKey() {
    // panel-rdo.html declara SUPABASE_ANON_KEY como const global (línea ~5064).
    // Soportamos 3 variantes para resiliencia:
    //   1) window.SUPABASE_ANON_KEY (si el HTML lo expone explícito)
    //   2) const global SUPABASE_ANON_KEY (caso actual del panel)
    //   3) window.sb?.supabaseKey (cliente Supabase ya creado)
    if (typeof window.SUPABASE_ANON_KEY === 'string' && window.SUPABASE_ANON_KEY) {
      return window.SUPABASE_ANON_KEY;
    }
    if (typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY) {
      return SUPABASE_ANON_KEY;
    }
    if (window.sb && window.sb.supabaseKey) {
      return window.sb.supabaseKey;
    }
    console.warn('[ChatbotPrecios] SUPABASE_ANON_KEY no disponible · EF llamada sin auth');
    return '';
  }

  // ─────────────────────────────────────────────────────────
  // insertarPropuestas(items, cliente, destino_tipo, sb)
  //   → { n_insertadas, n_auto_aprobadas, n_duplicadas, n_descartadas_low_conf,
  //       lineas_low_conf, lineas_duplicadas }
  //
  // H3 (C2 17-jun): umbrales por confidence_score · auto-aprueba >= 0.9 ·
  //                 descarta < 0.6 con feedback al usuario.
  // H4 (C2 17-jun): captura UNIQUE violation (23505) como "ya cargado hoy" ·
  //                 inserta fila a fila para distinguir éxito vs duplicado.
  // ─────────────────────────────────────────────────────────
  async function insertarPropuestas(items, cliente, destino_tipo, sb, sucursal_id) {
    const out = {
      n_insertadas: 0,
      n_auto_aprobadas: 0,
      n_duplicadas: 0,
      n_descartadas_low_conf: 0,
      lineas_low_conf: [],
      lineas_duplicadas: [],
    };
    if (!items || items.length === 0) return out;
    if (!['referente', 'historico'].includes(destino_tipo)) {
      throw new Error(`destino_tipo inválido: ${destino_tipo}`);
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const ahoraIso = new Date().toISOString();

    for (const it of items) {
      const conf = it.confidence ?? 0.5;

      // H3 · descartar low confidence con feedback al usuario
      if (conf < CONFIDENCE_MIN_REQUERIDO) {
        out.n_descartadas_low_conf += 1;
        out.lineas_low_conf.push({
          material_descrito: it.material_descrito,
          precio_clp_kg: it.precio_clp_kg,
          confidence: conf,
          fuente_linea: it.fuente_linea?.slice(0, 200),
        });
        continue;
      }

      // H3 · auto-aprobar high confidence como histórico
      const autoAprueba = conf >= CONFIDENCE_AUTO_APROBAR && destino_tipo === 'historico';

      const fila = {
        cliente_id: cliente.id,
        material_id: it.material_id_match, // puede ser null, el matcher posterior lo resuelve
        sucursal_id: sucursal_id || 'cerrillos', // default si no hay contexto
        precio_clp_kg: it.precio_clp_kg,
        fecha_vigencia: hoy,
        confidence_score: conf,
        // FIX Opción A 17-jun PM-4: CHECK acepta auto/andrea/dusan/competencia.
        // Refactor path único (Opción C) encolado cola 0696576f para sprint próximo.
        ruta: 'dusan',
        hash_dedup: hashDedup(cliente.id, it.material_descrito, it.precio_clp_kg),
        estado: autoAprueba ? 'aprobado' : 'pendiente',
        destino_tipo,
        notas: `Diego chat · fuente: ${it.fuente_linea?.slice(0, 200)}`,
        ...(autoAprueba && {
          aprobado_por: 'auto_confidence',
          aprobado_at: ahoraIso,
        }),
      };

      const { error } = await sb
        .schema('staging')
        .from('precios_propuestos')
        .insert([fila]);

      if (error) {
        // H4 · UNIQUE violation (Postgres 23505) = duplicado del mismo día
        const esDuplicado =
          error.code === '23505' ||
          /duplicate key|hash_dedup/i.test(error.message || '');
        if (esDuplicado) {
          out.n_duplicadas += 1;
          out.lineas_duplicadas.push({
            material_descrito: it.material_descrito,
            precio_clp_kg: it.precio_clp_kg,
          });
          continue;
        }
        // cualquier otro error sí es bug · propagar
        throw new Error(`insertarPropuestas falló (línea "${it.material_descrito}"): ${error.message}`);
      }

      out.n_insertadas += 1;
      if (autoAprueba) out.n_auto_aprobadas += 1;
    }

    return out;
  }

  function hashDedup(cliente_id, material, precio) {
    const raw = `${cliente_id}|${material}|${precio}|${new Date().toISOString().slice(0, 10)}`;
    // hash básico (no crypto) — suficiente para dedup ligera intra-día
    let h = 0;
    for (let i = 0; i < raw.length; i++) {
      h = ((h << 5) - h) + raw.charCodeAt(i);
      h |= 0;
    }
    return `dch_${Math.abs(h)}`;
  }

  // ─────────────────────────────────────────────────────────
  // V6 · notificarAprobadores(destino_tipo, n_propuestas, cliente, sb)
  // Lee teléfonos vivos de panel.dotacion (sin hardcodear) y encola WhatsApp
  // + dispara evento de badge para que panel-rdo.html actualice contador.
  // ─────────────────────────────────────────────────────────
  async function getTelefonosAprobadores(sb) {
    // Aprobadores de precios = Dusan (CEO) + Andrea (Comercial).
    // Filtro por activo=true + nombre/rol conocido. Si la dotación cambia,
    // se ajusta acá sin tocar el resto del flujo.
    const { data, error } = await sb
      .schema('panel')
      .from('dotacion')
      .select('nombre, rol, telefono')
      .eq('activo', true)
      .or('nombre.ilike.%dusan%,nombre.ilike.%andrea%,rol.ilike.%CEO%,rol.ilike.%comercial%');
    if (error) {
      console.warn('[ChatbotPrecios] panel.dotacion fallo:', error.message);
      return [];
    }
    return (data || [])
      .filter((d) => d.telefono && d.telefono.trim().length >= 8)
      .map((d) => ({ telefono: d.telefono.trim(), nombre: d.nombre }));
  }

  async function notificarAprobadores(destino_tipo, n_propuestas, cliente, sb) {
    // Mensaje 1 línea, sin jerga (R-AUD-039)
    const msg =
      destino_tipo === 'referente'
        ? `📥 Cliente referente "${cliente.razon_social}" · ${n_propuestas} precio(s) para aprobar en la bandeja.`
        : `📥 Cliente histórico "${cliente.razon_social}" · ${n_propuestas} precio(s) registrados (no afectan precios vivos).`;

    // 1. Resolver destinatarios desde BD (no hardcoded)
    const aprobadores = await getTelefonosAprobadores(sb);
    if (aprobadores.length === 0) {
      console.warn('[ChatbotPrecios] No hay aprobadores con teléfono · WhatsApp no encolado');
    } else {
      const filas = aprobadores.map((a) => ({
        telefono: a.telefono,
        cuerpo: msg,
        prioridad: destino_tipo === 'referente' ? 'alta' : 'media',
        origen: 'diego_chat_precios_cliente',
        estado: 'pendiente',
      }));
      const { error } = await sb.schema('panel').from('diego_outbox_whatsapp').insert(filas);
      if (error) {
        console.error('[ChatbotPrecios] diego_outbox_whatsapp insert error:', error.message);
      }
    }

    // 2. Disparar evento para badge bandeja (panel-rdo.html lo escucha)
    window.dispatchEvent(new CustomEvent('bandeja_precios_nuevo', {
      detail: { n: n_propuestas, destino_tipo, cliente: cliente.razon_social },
    }));
  }

  // ─────────────────────────────────────────────────────────
  // mostrarConfirmacion(items, cliente, destino_tipo)
  // Devuelve Promise<'si'|'no'> según el botón que apriete el usuario
  // ─────────────────────────────────────────────────────────
  function mostrarConfirmacion(items, cliente, destino_tipo, uiRenderResumen) {
    return new Promise((resolve) => {
      const resumen = {
        n_items: items.length,
        cliente: cliente.razon_social,
        destino_tipo,
        muestra: items.slice(0, 5).map((it) => `${it.material_descrito} → $${it.precio_clp_kg}`),
      };
      uiRenderResumen(resumen, (eleccion) => resolve(eleccion === 'si' ? 'si' : 'no'));
    });
  }

  // ─────────────────────────────────────────────────────────
  // ORQUESTADOR PRINCIPAL · procesarMensajeConArchivo(mensaje, archivo, ctx)
  // Esto es lo que el chatbot llama cuando detecta archivo + mensaje en el FAB
  // ─────────────────────────────────────────────────────────
  async function procesarMensajeConArchivo(mensaje, archivo, ctx) {
    const { sb, uiPreguntar, uiRenderResumen, uiMensaje, sucursal_id, metadatos } = ctx;

    // 1. Detectar intención
    const intent = detectarIntencion(mensaje);
    if (!intent) {
      uiMensaje('asistente_general'); // fuera de flujo de precios
      return { ok: false, motivo: 'sin_intencion' };
    }

    // 4. Múltiples clientes
    const nombres = detectarMultiplesClientes(intent.raw_clientes);
    if (nombres.length === 0) {
      uiMensaje('No identifiqué a qué cliente apuntás. Escribime "graba precios de NOMBRE".');
      return { ok: false, motivo: 'sin_cliente_extraible' };
    }

    const resultados = [];
    for (const nombreCand of nombres) {
      uiMensaje(`Procesando cliente ${nombreCand}...`);

      // 2. Extraer cliente
      let cliente = await extraerCliente(nombreCand, metadatos, sb);

      // 3. Cliente no existe → preguntar con timeout
      if (!cliente) {
        cliente = await crearClienteConTimeout(nombreCand, sb, uiPreguntar);
        if (!cliente) {
          uiMensaje(`Aborto para "${nombreCand}" (usuario dijo no o sin respuesta válida).`);
          resultados.push({ cliente: nombreCand, n: 0, motivo: 'aborto_usuario' });
          continue;
        }
      }

      // 5. Procesar archivo
      const r = await procesarArchivo(archivo, cliente.id);
      if (r.manual_required) {
        uiMensaje(
          `No pude leer el archivo de ${cliente.razon_social} (${r.reason}). ` +
          `Escribime los precios línea por línea como "MATERIAL $PRECIO".`
        );
        resultados.push({ cliente: cliente.razon_social, n: 0, motivo: r.reason });
        continue;
      }

      // Resumen + confirmación
      const destino_tipo = cliente.es_referente ? 'referente' : 'historico';
      const eleccion = await mostrarConfirmacion(r.items, cliente, destino_tipo, uiRenderResumen);
      if (eleccion !== 'si') {
        uiMensaje(`OK, no creé propuestas para ${cliente.razon_social}.`);
        resultados.push({ cliente: cliente.razon_social, n: 0, motivo: 'cancelado_usuario' });
        continue;
      }

      // Insertar + notificar
      const ins = await insertarPropuestas(r.items, cliente, destino_tipo, sb, sucursal_id);
      if (ins.n_insertadas > 0) {
        await notificarAprobadores(destino_tipo, ins.n_insertadas, cliente, sb);
      }

      // H3 + H4 + H6 (C2 17-jun): feedback enriquecido al usuario
      const partes = [];
      if (ins.n_insertadas > 0) {
        partes.push(
          `✅ ${ins.n_insertadas} propuesta(s) de "${cliente.razon_social}" en bandeja ` +
          `(tipo: ${destino_tipo}).`
        );
      }
      if (ins.n_auto_aprobadas > 0) {
        partes.push(
          `🤖 ${ins.n_auto_aprobadas} auto-aprobada(s) por confidence ≥ ${CONFIDENCE_AUTO_APROBAR}.`
        );
      }
      if (ins.n_duplicadas > 0) {
        const dup = ins.lineas_duplicadas
          .slice(0, 3)
          .map((l) => `"${l.material_descrito}" ($${l.precio_clp_kg})`)
          .join(', ');
        const sufijo = ins.lineas_duplicadas.length > 3 ? ` y ${ins.lineas_duplicadas.length - 3} más` : '';
        partes.push(
          `🔁 ${ins.n_duplicadas} duplicada(s) (ya cargadas hoy): ${dup}${sufijo}.`
        );
      }
      if (ins.n_descartadas_low_conf > 0) {
        const low = ins.lineas_low_conf
          .slice(0, 3)
          .map((l) => `"${l.fuente_linea || l.material_descrito}" (conf ${l.confidence.toFixed(2)})`)
          .join('\n  · ');
        const sufijo = ins.lineas_low_conf.length > 3 ? `\n  · ...y ${ins.lineas_low_conf.length - 3} más` : '';
        partes.push(
          `⚠️ ${ins.n_descartadas_low_conf} línea(s) descartada(s) por confianza baja. ` +
          `Re-tipeá como "MATERIAL $PRECIO":\n  · ${low}${sufijo}`
        );
      }
      // H6 (C2 17-jun): exponer líneas de archivo que no se extrajeron
      if (r.metricas && r.metricas.n_lineas > r.metricas.n_items_extraidos) {
        const perdidas = r.metricas.n_lineas - r.metricas.n_items_extraidos;
        partes.push(
          `❓ ${perdidas} línea(s) del archivo no pude leer. ` +
          `Si te falta alguna, re-tipeá como "MATERIAL $PRECIO".`
        );
      }
      if (partes.length === 0) {
        partes.push(`(Sin movimientos para "${cliente.razon_social}".)`);
      } else if (ins.n_insertadas > 0) {
        partes.push('Andrea/Dusan reciben aviso.');
      }
      uiMensaje(partes.join('\n'));
      resultados.push({
        cliente: cliente.razon_social,
        n: ins.n_insertadas,
        n_auto_aprobadas: ins.n_auto_aprobadas,
        n_duplicadas: ins.n_duplicadas,
        n_descartadas_low_conf: ins.n_descartadas_low_conf,
        destino_tipo,
      });
    }

    return { ok: true, resultados };
  }

  // ─────────────────────────────────────────────────────────
  // EXPONER API global (window.ChatbotPrecios)
  // ─────────────────────────────────────────────────────────
  window.ChatbotPrecios = {
    detectarIntencion,
    detectarMultiplesClientes,
    extraerCliente,
    crearClienteConTimeout,
    procesarArchivo,
    insertarPropuestas,
    notificarAprobadores,
    getTelefonosAprobadores,
    mostrarConfirmacion,
    procesarMensajeConArchivo,
    _version: '1.2.0',
    _firma: 'D-DIEGO-PRECIOS-CLIENTE-001 · 17-jun-2026 PM-4 · C2 UX (H3+H4+H6)',
    _config: {
      CONFIDENCE_AUTO_APROBAR,
      CONFIDENCE_MIN_REQUERIDO,
    },
  };
})();
