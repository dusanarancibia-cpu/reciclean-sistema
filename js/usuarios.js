// ══════════════════════════════════════════════════
// TAB F · GESTIÓN DE USUARIOS AUTORIZADOS
// ══════════════════════════════════════════════════

let _usrCache = [];

async function renderUsuarios(){
  const tbody = document.getElementById('usr-tbody');
  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text3);">Cargando...</td></tr>';

  if(!_supabase){ tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--red);">Supabase no inicializado</td></tr>'; return; }

  const {data, error} = await _supabase.from('usuarios_autorizados').select('*').order('nombre');
  if(error){
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--red);">Error: ${error.message}</td></tr>`;
    return;
  }

  _usrCache = data || [];
  if(!_usrCache.length){
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text3);">Sin usuarios registrados</td></tr>';
    return;
  }

  tbody.innerHTML = _usrCache.map(u => {
    const rolBadge = u.rol === 'admin' ? 'ba' : u.rol === 'editor' ? 'bb' : u.rol === 'visor' ? 'bn' : 'bg';
    return `<tr>
      <td style="font-weight:600;">${esc(u.nombre)}</td>
      <td style="font-family:'Roboto Mono',monospace;font-size:11px;">${esc(u.telefono||'')}</td>
      <td style="font-size:11px;">${esc(u.email||'')}</td>
      <td style="font-family:'Roboto Mono',monospace;font-size:11px;">${esc(u.pin)}</td>
      <td><span class="badge ${rolBadge}">${u.rol}</span></td>
      <td style="text-align:center;">${u.acceso_panel ? '<span style="color:var(--green);">Si</span>' : '<span style="color:var(--text4);">No</span>'}</td>
      <td style="text-align:center;">${u.acceso_asistente ? '<span style="color:var(--green);">Si</span>' : '<span style="color:var(--text4);">No</span>'}</td>
      <td style="text-align:center;">
        <button class="btn ${u.activo ? 'ok' : 'err'}" style="font-size:10px;padding:3px 8px;"
          onclick="toggleActivo(${u.id},${!u.activo})">${u.activo ? 'Activo' : 'Inactivo'}</button>
      </td>
      <td>
        <button class="btn" style="font-size:10px;padding:3px 8px;" onclick="abrirModalUsuario(${u.id})">Editar</button>
      </td>
    </tr>`;
  }).join('');
}

function esc(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

// ── Modal ──

function abrirModalUsuario(id){
  const modal = document.getElementById('usr-modal');
  const title = document.getElementById('usr-modal-title');
  document.getElementById('usr-edit-id').value = '';
  document.getElementById('usr-nombre').value = '';
  document.getElementById('usr-telefono').value = '';
  document.getElementById('usr-email').value = '';
  document.getElementById('usr-pin').value = '';
  document.getElementById('usr-rol').value = 'ejecutivo';
  document.getElementById('usr-acceso-panel').checked = false;
  document.getElementById('usr-acceso-asistente').checked = true;

  if(id){
    const u = _usrCache.find(x => x.id === id);
    if(u){
      title.textContent = 'Editar Usuario';
      document.getElementById('usr-edit-id').value = u.id;
      document.getElementById('usr-nombre').value = u.nombre || '';
      document.getElementById('usr-telefono').value = u.telefono || '';
      document.getElementById('usr-email').value = u.email || '';
      document.getElementById('usr-pin').value = u.pin || '';
      document.getElementById('usr-rol').value = u.rol || 'ejecutivo';
      document.getElementById('usr-acceso-panel').checked = !!u.acceso_panel;
      document.getElementById('usr-acceso-asistente').checked = !!u.acceso_asistente;
    }
  } else {
    title.textContent = 'Nuevo Usuario';
  }

  modal.style.display = 'flex';
}

function cerrarModalUsuario(){
  document.getElementById('usr-modal').style.display = 'none';
}

async function guardarUsuario(){
  const id = document.getElementById('usr-edit-id').value;
  const nombre = document.getElementById('usr-nombre').value.trim();
  const telefono = document.getElementById('usr-telefono').value.trim();
  const email = document.getElementById('usr-email').value.trim();
  const pin = document.getElementById('usr-pin').value.trim();
  const rol = document.getElementById('usr-rol').value;
  const acceso_panel = document.getElementById('usr-acceso-panel').checked;
  const acceso_asistente = document.getElementById('usr-acceso-asistente').checked;

  if(!nombre){ toast('Ingresa un nombre','warn'); return; }
  if(!pin){ toast('Ingresa un PIN','warn'); return; }

  const payload = { nombre, telefono, email, pin, rol, acceso_panel, acceso_asistente };

  let error;
  if(id){
    ({error} = await _supabase.from('usuarios_autorizados').update(payload).eq('id', Number(id)));
  } else {
    ({error} = await _supabase.from('usuarios_autorizados').insert(payload));
  }

  if(error){
    toast('Error: ' + error.message, 'err');
    return;
  }

  toast(id ? 'Usuario actualizado' : 'Usuario creado', 'ok');
  cerrarModalUsuario();
  renderUsuarios();
}

async function toggleActivo(id, valor){
  const {error} = await _supabase.from('usuarios_autorizados').update({activo: valor}).eq('id', id);
  if(error){ toast('Error: ' + error.message, 'err'); return; }
  toast(valor ? 'Usuario activado' : 'Usuario desactivado', 'ok');
  renderUsuarios();
}
