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
  // insertarPropuestas(items, cliente, destino_tipo, sb) → { n_insertadas }
  // ─────────────────────────────────────────────────────────
  async function insertarPropuestas(items, cliente, destino_tipo, sb, sucursal_id) {
    if (!items || items.length === 0) return { n_insertadas: 0 };
    if (!['referente', 'historico'].includes(destino_tipo)) {
      throw new Error(`destino_tipo inválido: ${destino_tipo}`);
    }

    const filas = items.map((it) => ({
      cliente_id: cliente.id,
      material_id: it.material_id_match, // puede ser null, el matcher posterior lo resuelve
      sucursal_id: sucursal_id || 'cerrillos', // default si no hay contexto
      precio_clp_kg: it.precio_clp_kg,
      fecha_vigencia: new Date().toISOString().slice(0, 10),
      confidence_score: it.confidence ?? 0.5,
      ruta: 'manual',
      hash_dedup: hashDedup(cliente.id, it.material_descrito, it.precio_clp_kg),
      estado: 'pendiente',
      destino_tipo,
      notas: `Diego chat · fuente: ${it.fuente_linea?.slice(0, 200)}`,
    }));

    const { data, error } = await sb
      .schema('staging')
      .from('precios_propuestos')
      .insert(filas)
      .select('id');

    if (error) {
      throw new Error(`insertarPropuestas falló: ${error.message}`);
    }
    return { n_insertadas: data?.length || 0 };
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
      const { n_insertadas } = await insertarPropuestas(r.items, cliente, destino_tipo, sb, sucursal_id);
      await notificarAprobadores(destino_tipo, n_insertadas, cliente, sb);

      uiMensaje(
        `✅ ${n_insertadas} propuesta(s) de "${cliente.razon_social}" en bandeja ` +
        `(tipo: ${destino_tipo}). Andrea/Dusan reciben aviso.`
      );
      resultados.push({ cliente: cliente.razon_social, n: n_insertadas, destino_tipo });
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
    _version: '1.1.0',
    _firma: 'D-DIEGO-PRECIOS-CLIENTE-001 · 16-jun-2026 · placeholders resueltos',
  };
})();
