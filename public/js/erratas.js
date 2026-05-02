// ══════════════════════════════════════════════════
// TAB I · ERRATAS DIEGO — correcciones canónicas
// Patrón calcado de usuarios.js
// ══════════════════════════════════════════════════

let _errCache = [];

const _escErr = (typeof esc === 'function')
  ? esc
  : (s => { const d=document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; });

async function renderErratas(){
  const tbody = document.getElementById('err-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text3);">Cargando...</td></tr>';

  if(!_supabase){
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--red);">Supabase no inicializado</td></tr>';
    return;
  }

  const {data, error} = await _supabase
    .from('diego_correcciones')
    .select('*')
    .order('created_at', {ascending: false});

  if(error){
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--red);">Error: ${_escErr(error.message)}</td></tr>`;
    return;
  }

  _errCache = data || [];
  if(!_errCache.length){
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text3);">Sin erratas registradas</td></tr>';
    return;
  }

  tbody.innerHTML = _errCache.map(e => {
    const fecha = e.created_at ? new Date(e.created_at).toLocaleDateString('es-CL') : '';
    return `<tr>
      <td style="font-family:'Roboto Mono',monospace;font-size:11px;white-space:nowrap;">${_escErr(fecha)}</td>
      <td style="font-size:11px;max-width:240px;">${_escErr(e.error_detectado)}</td>
      <td style="font-size:11px;max-width:300px;">${_escErr(e.correccion)}</td>
      <td style="font-size:11px;">${e.tipo ? `<span class="badge bn">${_escErr(e.tipo)}</span>` : '<span style="color:var(--text4);">&mdash;</span>'}</td>
      <td style="font-size:11px;">${_escErr(e.scope || 'general')}</td>
      <td style="text-align:center;">
        <button class="btn ${e.activa ? 'ok' : 'err'}" style="font-size:10px;padding:3px 8px;"
          onclick="toggleErrata(${e.id},${!e.activa})">${e.activa ? 'Activa' : 'Inactiva'}</button>
      </td>
      <td>
        <button class="btn" style="font-size:10px;padding:3px 8px;" onclick="abrirModalErrata(${e.id})">Editar</button>
      </td>
    </tr>`;
  }).join('');
}

// ── Modal ──

function abrirModalErrata(id){
  const modal = document.getElementById('err-modal');
  const title = document.getElementById('err-modal-title');
  document.getElementById('err-edit-id').value = '';
  document.getElementById('err-error').value = '';
  document.getElementById('err-correccion').value = '';
  document.getElementById('err-tipo').value = '';
  document.getElementById('err-scope').value = 'general';
  document.getElementById('err-issue').value = '';

  if(id){
    const e = _errCache.find(x => x.id === id);
    if(e){
      title.textContent = 'Editar Errata';
      document.getElementById('err-edit-id').value = e.id;
      document.getElementById('err-error').value = e.error_detectado || '';
      document.getElementById('err-correccion').value = e.correccion || '';
      document.getElementById('err-tipo').value = e.tipo || '';
      document.getElementById('err-scope').value = e.scope || 'general';
      document.getElementById('err-issue').value = e.issue_url || '';
    }
  } else {
    title.textContent = 'Nueva Errata';
  }

  modal.style.display = 'flex';
}

function cerrarModalErrata(){
  document.getElementById('err-modal').style.display = 'none';
}

async function guardarErrata(){
  const id = document.getElementById('err-edit-id').value;
  const error_detectado = document.getElementById('err-error').value.trim();
  const correccion = document.getElementById('err-correccion').value.trim();
  const tipo = document.getElementById('err-tipo').value || null;
  const scope = document.getElementById('err-scope').value || 'general';
  const issue_url = document.getElementById('err-issue').value.trim() || null;

  if(!error_detectado){ toast('Describí qué dijo Diego mal','warn'); return; }
  if(!correccion){ toast('Escribí la corrección canónica','warn'); return; }

  let created_by = 'desconocido';
  try {
    const sess = JSON.parse(localStorage.getItem('rf_session') || '{}');
    created_by = sess.email || sess.nombre || 'desconocido';
  } catch(_){}

  const payload = { error_detectado, correccion, tipo, scope, issue_url };

  let error;
  if(id){
    ({error} = await _supabase.from('diego_correcciones').update(payload).eq('id', Number(id)));
  } else {
    payload.created_by = created_by;
    ({error} = await _supabase.from('diego_correcciones').insert(payload));
  }

  if(error){
    toast('Error: ' + error.message, 'err');
    return;
  }

  toast(id ? 'Errata actualizada' : 'Errata creada', 'ok');
  cerrarModalErrata();
  renderErratas();
}

async function toggleErrata(id, valor){
  const {error} = await _supabase.from('diego_correcciones').update({activa: valor}).eq('id', id);
  if(error){ toast('Error: ' + error.message, 'err'); return; }
  toast(valor ? 'Errata activada' : 'Errata desactivada', 'ok');
  renderErratas();
}
