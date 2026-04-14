// ══════════════════════════════════════════════════════════════
// ACI — MODULO NURTURING
// Logica de envios automaticos + wa.me + alertas
// Asistente Comercial Integrado · Fase 5
// ══════════════════════════════════════════════════════════════

// ── Evaluar reglas nurturing despues de una visita ───────────
// Se llama desde aciRegistrarEvento cuando tipo='visita' y resultado='buena'

async function aciEvaluarNurturing(proveedorId, resultado) {
  if (resultado !== 'buena') return;

  const prov = typeof aciGetProveedorById === 'function' ? aciGetProveedorById(proveedorId) : null;
  if (!prov) return;
  if (!['prospecto', 'contactado'].includes(prov.estado_comercial)) return;

  // Verificar si ya tiene nurturing activo
  try {
    const { data: existing } = await _supa.from('nurturing_queue')
      .select('id')
      .eq('proveedor_id', proveedorId)
      .in('estado', ['programado', 'enviado'])
      .limit(1);
    if (existing && existing.length > 0) return; // Ya tiene nurturing activo
  } catch (e) { /* continuar */ }

  const ahora = new Date();
  const dia3 = new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const dia10 = new Date(ahora.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
  const dia20 = new Date(ahora.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString();

  const items = [
    {
      proveedor_id: proveedorId,
      tipo_envio: 'presentacion',
      canal: 'email',
      fecha_programada: dia3,
      estado: 'programado',
      contenido_json: {
        asunto: 'Gracias por recibirnos — Presentacion Reciclean',
        template: 'corp_v1',
        proveedor_nombre: prov.nombre,
        materiales: prov.materiales
      }
    },
    {
      proveedor_id: proveedorId,
      tipo_envio: 'recordatorio',
      canal: 'whatsapp',
      fecha_programada: dia10,
      estado: 'programado',
      contenido_json: {
        mensaje_template: 'wa_followup_v1',
        proveedor_nombre: prov.nombre,
        telefono: prov.telefono
      }
    },
    {
      proveedor_id: proveedorId,
      tipo_envio: 'alerta_interna',
      canal: 'app',
      fecha_programada: dia20,
      estado: 'programado',
      contenido_json: {
        mensaje: 'Llamar a ' + prov.nombre + ' — hace 20 dias de visita, sin compra',
        proveedor_nombre: prov.nombre,
        asignar_a: 'Andrea'
      }
    }
  ];

  try {
    const { error } = await _supa.from('nurturing_queue').insert(items);
    if (error) console.warn('Error creando nurturing queue:', error.message);
    else console.log('ACI NURTURING: 3 envios programados para ' + prov.nombre + ' (dia 3, 10, 20)');
  } catch (e) {
    console.warn('nurturing error:', e);
  }
}

// ── Obtener alertas de nurturing para el usuario actual ──────

async function aciGetAlertasNurturing() {
  try {
    const ahora = new Date().toISOString();
    const { data } = await _supa.from('nurturing_queue')
      .select('*, proveedores(nombre, telefono, zona)')
      .eq('tipo_envio', 'alerta_interna')
      .eq('estado', 'programado')
      .lte('fecha_programada', ahora)
      .order('fecha_programada', { ascending: true })
      .limit(20);
    return data || [];
  } catch (e) {
    return [];
  }
}

// ── Obtener items de nurturing pendientes de envio ───────────
// (Para Make.com webhook o procesamiento manual)

async function aciGetNurturingPendientes() {
  try {
    const ahora = new Date().toISOString();
    const { data } = await _supa.from('nurturing_queue')
      .select('*, proveedores(nombre, telefono, email, zona, materiales)')
      .eq('estado', 'programado')
      .lte('fecha_programada', ahora)
      .neq('tipo_envio', 'alerta_interna')
      .order('fecha_programada', { ascending: true })
      .limit(50);
    return data || [];
  } catch (e) {
    return [];
  }
}

// ── Generar link wa.me para nurturing WhatsApp ───────────────

function aciGenerarWANurturing(item) {
  const prov = item.proveedores || {};
  const tel = (prov.telefono || '').replace(/\s/g, '').replace(/^\+/, '');
  if (!tel) return null;

  const nombre = prov.nombre || 'estimado proveedor';
  const ejecutivo = USUARIO?.nombre || 'Reciclean';
  const materiales = (prov.materiales || 'materiales reciclables').substring(0, 60);

  const msg = 'Hola ' + nombre + ', le saluda ' + ejecutivo + ' de Reciclean. '
    + 'Pasamos a verlos hace unos dias y quedamos muy contentos con la reunion. '
    + 'Le comparto nuestra tabla de precios actualizada para ' + materiales + '. '
    + 'Cualquier consulta, estamos disponibles. Saludos!';

  return 'https://wa.me/' + tel + '?text=' + encodeURIComponent(msg);
}

// ── Marcar nurturing como enviado ────────────────────────────

async function aciMarcarNurturingEnviado(itemId) {
  try {
    await _supa.from('nurturing_queue').update({
      estado: 'enviado',
      fecha_enviado: new Date().toISOString()
    }).eq('id', itemId);
  } catch (e) {
    console.warn('Error marcando nurturing:', e);
  }
}

// ── Procesar nurturing WA pendientes (Andrea toca boton) ─────

async function aciProcesarNurturingWA() {
  const pendientes = await aciGetNurturingPendientes();
  const waPendientes = pendientes.filter(n => n.canal === 'whatsapp');

  if (!waPendientes.length) {
    alert('Sin WhatsApp pendientes de enviar');
    return;
  }

  for (const item of waPendientes) {
    const link = aciGenerarWANurturing(item);
    if (!link) continue;

    const enviar = confirm('Enviar WA nurturing a: ' + (item.proveedores?.nombre || '?') + '\n\nSe abrira WhatsApp con el mensaje listo. Toca enviar.');
    if (enviar) {
      window.open(link);
      await aciMarcarNurturingEnviado(item.id);
    }
  }

  alert('Nurturing WA procesado');
}

console.log('ACI nurturing.js cargado');
