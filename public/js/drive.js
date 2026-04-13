// ═══════════════════════════════════════════════════════════
// GOOGLE DRIVE — Subida automática a Unidad compartida
// v1 · 13-abril-2026
// Fuentes: plan original + correcciones IA #2 (estado real,
// carga robusta, checkToken) + fixes KIMI (#1 query parents,
// #3 validación respuestas)
// ═══════════════════════════════════════════════════════════

let _driveToken = null;
let _driveTokenClient = null;
let _driveChecking = false;

// ── Inicializar cuando la librería de Google esté lista ──
function driveInit(){
  if(_driveChecking) return;
  _driveChecking = true;

  let attempts = 0;
  function checkGoogle(){
    if(typeof google !== 'undefined' && google.accounts && google.accounts.oauth2){
      _driveTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: (resp) => {
          if(resp.error){
            console.warn('Drive auth error:', resp.error);
            toast('⚠ No se pudo conectar a Drive','warn');
            driveUpdateUI(false);
            _driveToken = null;
            return;
          }
          _driveToken = resp.access_token;
          safeLS('rf_drive_connected','1');
          driveUpdateUI(true);
          toast('☁ Google Drive conectado','ok');
        }
      });
      if(localStorage.getItem('rf_drive_connected')==='1'){
        driveConnectSilent();
      }
      _driveChecking = false;
    } else {
      attempts++;
      if(attempts < 50){
        setTimeout(checkGoogle, 100);
      } else {
        console.warn('Google Identity Services no cargó a tiempo');
        _driveChecking = false;
      }
    }
  }
  checkGoogle();
}

// ── Conectar (con popup de Google) ──
function driveConnect(){
  if(!_driveTokenClient){
    toast('⚠ Google no cargó correctamente — recarga la página','warn');
    return;
  }
  _driveTokenClient.requestAccessToken({prompt:'consent'});
}

// ── Reconectar sin popup ──
function driveConnectSilent(){
  if(!_driveTokenClient) return;
  _driveTokenClient.requestAccessToken({prompt:''});
}

// ── Desconectar ──
function driveDisconnect(){
  _driveToken = null;
  localStorage.removeItem('rf_drive_connected');
  driveUpdateUI(false);
  toast('Drive desconectado','ok');
}

// ── Actualizar indicador visual ──
function driveUpdateUI(connected){
  const el = document.getElementById('drive-status');
  if(!el) return;
  if(connected && _driveToken){
    el.textContent = '☁ Drive ✓';
    el.style.color = '#4ADE80';
  } else {
    el.textContent = '☁ Drive ✗';
    el.style.color = 'var(--text4)';
  }
  const btn = document.getElementById('drive-connect-btn');
  if(btn){
    btn.textContent = connected && _driveToken ? '☁ Desconectar Drive' : '☁ Conectar Drive';
    btn.onclick = function(){
      if(connected && _driveToken) driveDisconnect();
      else driveConnect();
      if(typeof toggleToolsMenu === 'function') toggleToolsMenu();
    };
  }
}

// ── Verificar si el token es válido ──
async function driveCheckToken(){
  if(!_driveToken) return false;
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user',{
      headers: {'Authorization':'Bearer '+_driveToken}
    });
    if(res.ok) return true;
    if(res.status === 401){
      _driveToken = null;
      driveUpdateUI(false);
      toast('⚠ Sesión de Drive expiró — reconecta desde Herramientas','warn');
      return false;
    }
    return false;
  } catch(e){ return false; }
}

// ── Subir archivo a la Unidad compartida ──
async function driveUpload(blob, filename, subcarpeta){
  if(!_driveToken) return;

  const valid = await driveCheckToken();
  if(!valid) return;

  try {
    const folderId = await driveGetOrCreateFolder(subcarpeta);
    if(!folderId) throw new Error('No se pudo obtener/crear la carpeta');

    const metadata = { name: filename, parents: [folderId] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)],{type:'application/json'}));
    form.append('file', blob);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true',{
      method:'POST',
      headers: {'Authorization':'Bearer '+_driveToken},
      body: form
    });

    if(!res.ok){
      const err = await res.json().catch(()=>({}));
      if(res.status === 401){
        _driveToken = null;
        driveUpdateUI(false);
        toast('⚠ Sesión de Drive expiró — reconecta desde Herramientas','warn');
        return;
      }
      throw new Error(err.error?.message || 'HTTP '+res.status);
    }

    toast('☁ '+filename+' subido a Drive/'+subcarpeta,'ok');
  } catch(e){
    console.warn('Drive upload error:', e);
    toast('⚠ No se pudo subir a Drive: '+e.message,'warn');
  }
}

// ── Buscar o crear subcarpeta en Shared Drive ──
// Fix KIMI #1: filtra por parent para no confundir carpetas de otros lugares
// Fix KIMI #3: valida res.ok antes de usar respuesta
async function driveGetOrCreateFolder(name){
  const escapedName = name.replace(/'/g,"\\'");
  const query = `name='${escapedName}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${GOOGLE_DRIVE_FOLDER_ID}&fields=files(id,name)`;

  const searchRes = await fetch(url,{
    headers: {'Authorization':'Bearer '+_driveToken}
  });
  if(!searchRes.ok) throw new Error('Error buscando carpeta: HTTP '+searchRes.status);
  const searchData = await searchRes.json();
  if(searchData.files && searchData.files.length > 0){
    return searchData.files[0].id;
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true',{
    method:'POST',
    headers: {
      'Authorization':'Bearer '+_driveToken,
      'Content-Type':'application/json'
    },
    body: JSON.stringify({
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [GOOGLE_DRIVE_FOLDER_ID]
    })
  });
  if(!createRes.ok) throw new Error('Error creando carpeta: HTTP '+createRes.status);
  const createData = await createRes.json();
  if(!createData.id) throw new Error('No se pudo crear carpeta');
  return createData.id;
}

// ── Inicializar al cargar la página ──
window.addEventListener('load', ()=>{ setTimeout(driveInit, 100); });
