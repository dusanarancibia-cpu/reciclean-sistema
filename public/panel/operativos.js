// ============================================================
// TAB OPERATIVOS (D-OP-10) — extraído de panel-rdo.html (antifragilidad panel, bloque 8)
// Bucket 'operativos' + curated.operativos_metadata.
// Destranca Cony: subir PDFs por empresa/período + lista histórica filtrable.
//
// Sin IIFE (mismo patrón que los 7 bloques anteriores): el HTML de este tab
// (que se queda en panel-rdo.html) genera onclick/onchange inline por nombre suelto.
//
// Dependencias externas (documentadas, no ocultas):
// - Entrante: dispatcher central de tabs en panel-rdo.html llama a initOperativos()
//   al cambiar de tab.
// - Saliente: ninguna hacia otros módulos, Diego LLM, el núcleo ni Mesa de Precios.
// - Usa helpers globales pre-existentes (showToast/humanizeSupabaseError) que se
//   quedan en panel-rdo.html por ser compartidos por múltiples módulos.
// ============================================================

// ============================================================
// PESTAÑA OPERATIVOS (D-OP-10 — bucket 'operativos' + curated.operativos_metadata)
// Destranca Cony: subir PDFs por empresa/período + lista histórica filtrable.
// ============================================================

let _operativosIniciado = false;
let _operativosEmpresas = [];   // [{empresa_id, razon_social}]

async function initOperativos() {
  if (_operativosIniciado) {
    loadOperativosLista();
    return;
  }
  _operativosIniciado = true;

  // Cargar empresas (catálogo común al upload y al filtro)
  const empRes = await sb.schema('curated').from('empresas_grupo')
    .select('empresa_id, razon_social').eq('activa', true).order('razon_social');
  _operativosEmpresas = empRes.data || [];

  const selUpEmp = document.getElementById('opUpEmpresa');
  const selFiltEmp = document.getElementById('opFiltroEmpresa');
  _operativosEmpresas.forEach(e => {
    const o1 = document.createElement('option');
    o1.value = e.empresa_id; o1.textContent = e.razon_social;
    selUpEmp.appendChild(o1);
    const o2 = document.createElement('option');
    o2.value = e.empresa_id; o2.textContent = e.razon_social;
    selFiltEmp.appendChild(o2);
  });

  // Años (actual ± 5)
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const selUpAnio = document.getElementById('opUpAnio');
  const selFiltAnio = document.getElementById('opFiltroAnio');
  for (let y = anioActual + 1; y >= anioActual - 5; y--) {
    const o1 = document.createElement('option');
    o1.value = y; o1.textContent = y;
    if (y === anioActual) o1.selected = true;
    selUpAnio.appendChild(o1);
    const o2 = document.createElement('option');
    o2.value = y; o2.textContent = y;
    selFiltAnio.appendChild(o2);
  }

  // Mes por defecto = mes actual
  document.getElementById('opUpMes').value = String(hoy.getMonth() + 1);

  await loadOperativosLista();
}

async function loadOperativosLista() {
  const div = document.getElementById('operativosTabla');
  div.innerHTML = '<div class="skeleton" aria-busy="true"></div>';

  const fEmp = document.getElementById('opFiltroEmpresa')?.value || '';
  const fAnio = document.getElementById('opFiltroAnio')?.value || '';
  const fMes = document.getElementById('opFiltroMes')?.value || '';

  let q = sb.schema('curated').from('operativos_metadata')
    .select('operativo_id, filename, empresa_id, periodo_anio, periodo_mes, bucket_path, uploaded_by, uploaded_at, size_bytes')
    .order('periodo_anio', { ascending: false })
    .order('periodo_mes', { ascending: false })
    .order('uploaded_at', { ascending: false });
  if (fEmp)  q = q.eq('empresa_id', fEmp);
  if (fAnio) q = q.eq('periodo_anio', Number(fAnio));
  if (fMes)  q = q.eq('periodo_mes', Number(fMes));

  const { data, error } = await q.limit(200);

  if (error) {
    console.error('[D-OP-10] loadOperativosLista error:', error);
    div.innerHTML = `<div class="p-5"><p class="text-red-600 mb-2">No se pudo cargar la lista.</p>
      <p class="text-xs text-stone-500">${escapeHtml(humanizeSupabaseError(error))}</p></div>`;
    if (typeof showToast === 'function') showToast(humanizeSupabaseError(error), 'error');
    return;
  }

  if (!data || data.length === 0) {
    div.innerHTML = `<div class="p-8 text-center">
      <p class="text-stone-400 text-base mb-1">No hay PDFs cargados para este filtro.</p>
      <p class="text-xs text-stone-400">Usá el formulario de arriba para subir el primero.</p>
    </div>`;
    return;
  }

  const empMap = new Map(_operativosEmpresas.map(e => [e.empresa_id, e.razon_social]));
  const meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const fmtSize = b => {
    if (!b) return '—';
    const kb = Number(b) / 1024;
    if (kb < 1024) return kb.toFixed(0) + ' KB';
    return (kb / 1024).toFixed(1) + ' MB';
  };

  const rows = data.map(r => `<tr class="border-b border-stone-100 hover:bg-stone-50">
    <td class="py-2 px-3 text-stone-700">${escapeHtml(empMap.get(r.empresa_id) || r.empresa_id)}</td>
    <td class="py-2 px-3 text-stone-600">${meses[r.periodo_mes] || r.periodo_mes} ${r.periodo_anio}</td>
    <td class="py-2 px-3 text-stone-700 font-medium">${escapeHtml(r.filename)}</td>
    <td class="py-2 px-3 text-right text-stone-500 text-xs">${fmtSize(r.size_bytes)}</td>
    <td class="py-2 px-3 text-stone-500 text-xs">${r.uploaded_at ? new Date(r.uploaded_at).toLocaleString('es-CL') : '—'}</td>
    <td class="py-2 px-3 text-stone-500 text-xs">${escapeHtml(r.uploaded_by || '—')}</td>
    <td class="py-2 px-3 text-center">
      <button onclick="descargarPDFOperativo('${escapeHtml(r.bucket_path)}','${escapeHtml(r.filename)}')"
              class="text-xs text-green-700 hover:underline">Ver PDF ↗</button>
    </td>
  </tr>`).join('');

  div.innerHTML = `
    <div class="table-responsive">
    <table class="min-w-full text-sm">
      <thead class="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
        <tr>
          <th class="py-2 px-3 text-left">Empresa</th>
          <th class="py-2 px-3 text-left">Período</th>
          <th class="py-2 px-3 text-left">Archivo</th>
          <th class="py-2 px-3 text-right">Tamaño</th>
          <th class="py-2 px-3 text-left">Subido</th>
          <th class="py-2 px-3 text-left">Por</th>
          <th class="py-2 px-3 text-center">Acción</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    </div>
    <p class="text-xs text-stone-400 p-3">${data.length} PDF(s) · más recientes primero · top 200</p>`;
}

async function subirPDFOperativo() {
  const status = document.getElementById('opUpStatus');
  const empresaId = document.getElementById('opUpEmpresa').value;
  const anio = Number(document.getElementById('opUpAnio').value);
  const mes = Number(document.getElementById('opUpMes').value);
  const fileInput = document.getElementById('opUpFile');
  const file = fileInput.files && fileInput.files[0];

  // Validaciones
  if (!empresaId) { status.innerHTML = '<span class="text-red-600">Seleccioná empresa.</span>'; return; }
  if (!file)      { status.innerHTML = '<span class="text-red-600">Seleccioná un PDF.</span>'; return; }
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    status.innerHTML = '<span class="text-red-600">Solo se aceptan archivos PDF.</span>';
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    status.innerHTML = '<span class="text-red-600">El archivo supera 50 MB.</span>';
    return;
  }

  status.innerHTML = '<span class="text-stone-500">⏳ Subiendo…</span>';

  // Sanitizar filename y armar bucket_path determinista: empresa/anio/mes/<timestamp>_<filename>
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const ts = Date.now();
  const bucketPath = `${empresaId}/${anio}/${String(mes).padStart(2,'0')}/${ts}_${safeName}`;

  // 1) Upload al bucket
  const upRes = await sb.storage.from('operativos').upload(bucketPath, file, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (upRes.error) {
    console.error('[D-OP-10] upload PDF error:', upRes.error);
    status.innerHTML = `<span class="text-red-600">✗ ${escapeHtml(humanizeSupabaseError(upRes.error))}</span>`;
    if (typeof showToast === 'function') showToast(humanizeSupabaseError(upRes.error), 'error');
    return;
  }

  // 2) INSERT metadata
  const { error: insErr } = await sb.schema('curated').from('operativos_metadata').insert({
    filename:     safeName,
    empresa_id:   empresaId,
    periodo_anio: anio,
    periodo_mes:  mes,
    bucket_path:  bucketPath,
    uploaded_by:  currentUser,
    mime_type:    'application/pdf',
    size_bytes:   file.size,
  });
  if (insErr) {
    console.error('[D-OP-10] insert metadata error:', insErr);
    // No revertimos el upload — quedaría huérfano en el bucket. Mostrar al usuario.
    status.innerHTML = `<span class="text-red-600">✗ PDF subido pero la metadata falló: ${escapeHtml(humanizeSupabaseError(insErr))}</span>`;
    if (typeof showToast === 'function') showToast(humanizeSupabaseError(insErr), 'error');
    return;
  }

  status.innerHTML = `<span class="text-green-700">✓ ${escapeHtml(safeName)} guardado.</span>`;
  if (typeof showToast === 'function') showToast('PDF guardado', 'ok');
  fileInput.value = '';
  await loadOperativosLista();
}

async function descargarPDFOperativo(bucketPath, filename) {
  const { data, error } = await sb.storage.from('operativos').createSignedUrl(bucketPath, 3600);
  if (error || !data?.signedUrl) {
    console.error('[D-OP-10] signed url error:', error);
    if (typeof showToast === 'function') showToast(humanizeSupabaseError(error || { message: 'No se pudo abrir el PDF' }), 'error');
    return;
  }
  window.open(data.signedUrl, '_blank');
}
