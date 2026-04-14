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
          driveCheckLatest();
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

// ── Cargar último backup desde Drive ──
async function driveLoadLatest(){
  if(!_driveToken){
    toast('⚠ Primero conecta Google Drive desde Herramientas','warn');
    return;
  }
  const valid = await driveCheckToken();
  if(!valid) return;

  try {
    toast('☁ Buscando último backup en Drive...','ok');

    // Buscar carpeta Backups
    const escapedName = 'Backups'.replace(/'/g,"\\'");
    const folderQuery = `name='${escapedName}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const folderUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(folderQuery)}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${GOOGLE_DRIVE_FOLDER_ID}&fields=files(id)`;
    const folderRes = await fetch(folderUrl, { headers: {'Authorization':'Bearer '+_driveToken} });
    if(!folderRes.ok) throw new Error('No se encontró carpeta Backups');
    const folderData = await folderRes.json();
    if(!folderData.files || !folderData.files.length){
      toast('⚠ No hay carpeta Backups en Drive todavía','warn');
      return;
    }
    const backupFolderId = folderData.files[0].id;

    // Listar archivos JSON ordenados por fecha (más reciente primero)
    const filesQuery = `'${backupFolderId}' in parents and mimeType='application/json' and trashed=false`;
    const filesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(filesQuery)}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${GOOGLE_DRIVE_FOLDER_ID}&orderBy=createdTime desc&pageSize=1&fields=files(id,name,createdTime)`;
    const filesRes = await fetch(filesUrl, { headers: {'Authorization':'Bearer '+_driveToken} });
    if(!filesRes.ok) throw new Error('Error listando backups');
    const filesData = await filesRes.json();
    if(!filesData.files || !filesData.files.length){
      toast('⚠ No hay backups en Drive','warn');
      return;
    }

    const latest = filesData.files[0];
    const fecha = new Date(latest.createdTime).toLocaleString('es-CL');

    // Descargar el contenido
    const dlUrl = `https://www.googleapis.com/drive/v3/files/${latest.id}?alt=media&supportsAllDrives=true`;
    const dlRes = await fetch(dlUrl, { headers: {'Authorization':'Bearer '+_driveToken} });
    if(!dlRes.ok) throw new Error('Error descargando backup');
    const text = await dlRes.text();
    const backup = JSON.parse(text);

    if(!backup.materiales) throw new Error('Formato de backup inválido');

    // Usar la misma lógica de importBackup (estado.js)
    driveApplyBackup(backup);
    toast('☁ Backup cargado desde Drive: '+latest.name+' ('+fecha+')','ok');

  } catch(e){
    console.warn('Drive load error:', e);
    toast('⚠ Error cargando desde Drive: '+e.message,'warn');
  }
}

// ── Aplicar backup descargado de Drive (replica lógica de importBackup) ──
async function driveApplyBackup(backup){
  // Restaurar materiales
  backup.materiales.forEach(m=>{
    const idx = MATS_LOCAL.findIndex(x=>x.id===m.id);
    if(idx>=0){
      const {nombre, cat, ...rest} = m;
      MATS_LOCAL[idx] = {...MATS_LOCAL[idx], ...rest};
    }
  });
  mats = MATS_LOCAL.map(m=>({...m}));
  if(typeof idbSaveMats === 'function') await idbSaveMats(mats);

  // Restaurar fuentes
  if(backup.fuentes){
    if(typeof dbClear === 'function') await dbClear('fuentes');
    backup.fuentes.forEach(f=>{ if(!FUENTES.includes(f)) FUENTES.push(f); });
    if(typeof idbSaveFuente === 'function') for(const f of FUENTES) await idbSaveFuente(f);
  }

  // Restaurar clientes_precios
  if(backup.clientes_precios){
    CLIENTES_PRECIOS = backup.clientes_precios;
    if(typeof idbSaveConfig === 'function') await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
    safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  }
  if(backup.precio_seleccionado){
    PRECIO_SELECCIONADO = backup.precio_seleccionado;
    if(typeof idbSaveConfig === 'function') await idbSaveConfig('precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
    safeLS('rf_precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
  }
  if(backup.sucursal_fuente){
    SUCURSAL_FUENTE = backup.sucursal_fuente;
    if(typeof idbSaveConfig === 'function') await idbSaveConfig('sucursal_fuente', JSON.stringify(SUCURSAL_FUENTE));
    safeLS('rf_sucursal_fuente', JSON.stringify(SUCURSAL_FUENTE));
  }
  if(backup.precio_override){
    PRECIO_OVERRIDE = backup.precio_override;
    if(typeof idbSaveConfig === 'function') await idbSaveConfig('precio_override', JSON.stringify(PRECIO_OVERRIDE));
    safeLS('rf_precio_override', JSON.stringify(PRECIO_OVERRIDE));
  }
  if(backup.flete_por_suc){
    FLETE_POR_SUC = backup.flete_por_suc;
    if(typeof idbSaveConfig === 'function') await idbSaveConfig('flete_por_suc', JSON.stringify(FLETE_POR_SUC));
    safeLS('rf_flete_por_suc', JSON.stringify(FLETE_POR_SUC));
  }
  if(backup.margen_por_suc){
    MARGEN_POR_SUC = backup.margen_por_suc;
    if(typeof idbSaveConfig === 'function') await idbSaveConfig('margen_por_suc', JSON.stringify(MARGEN_POR_SUC));
    safeLS('rf_margen_por_suc', JSON.stringify(MARGEN_POR_SUC));
  }
  if(backup.mc_ejec_por_suc){
    MC_EJEC_POR_SUC = backup.mc_ejec_por_suc;
    if(typeof idbSaveConfig === 'function') await idbSaveConfig('mc_ejec_por_suc', JSON.stringify(MC_EJEC_POR_SUC));
    safeLS('rf_mc_ejec_por_suc', JSON.stringify(MC_EJEC_POR_SUC));
  }
  if(backup.comision_ejec_por_suc){
    COMISION_EJEC_POR_SUC = backup.comision_ejec_por_suc;
    if(typeof idbSaveConfig === 'function') await idbSaveConfig('comision_ejec_por_suc', JSON.stringify(COMISION_EJEC_POR_SUC));
    safeLS('rf_comision_ejec_por_suc', JSON.stringify(COMISION_EJEC_POR_SUC));
  }
  if(backup.config?.spread_por_suc){
    backup.config.spread_por_suc.forEach((v,i)=>{ const el=document.getElementById('cfg-spread-'+i); if(el) el.value=v; });
    if(typeof idbSaveConfig === 'function') await idbSaveConfig('spread_por_suc', JSON.stringify(backup.config.spread_por_suc));
    safeLS('rf_spread_por_suc', JSON.stringify(backup.config.spread_por_suc));
  }
  if(backup.config?.iva_por_suc){
    backup.config.iva_por_suc.forEach((v,i)=>{ const el=document.getElementById('cfg-iva-'+i); if(el) el.value=v; });
    if(typeof idbSaveConfig === 'function') await idbSaveConfig('iva_por_suc', JSON.stringify(backup.config.iva_por_suc));
    safeLS('rf_iva_por_suc', JSON.stringify(backup.config.iva_por_suc));
  }
  if(backup.historial?.length){
    if(typeof dbClear === 'function') await dbClear('historial');
    if(typeof idbSaveHistorial === 'function') for(const h of backup.historial) await idbSaveHistorial(h);
    HISTORIAL = backup.historial;
  }

  // Refrescar toda la UI
  if(typeof updateAliasCnt === 'function') updateAliasCnt();
  if(typeof rebuildFuenteSelects === 'function') rebuildFuenteSelects();
  if(typeof renderAlias === 'function') renderAlias();
  if(typeof renderPrecios === 'function') renderPrecios();
  if(typeof renderHistorial === 'function') renderHistorial();
  if(typeof renderPublico === 'function') renderPublico();
  if(typeof renderFuentes === 'function') renderFuentes();
  if(typeof renderPreview === 'function') renderPreview();
}

// ── Auto-check: al conectar Drive, avisar si hay backup disponible ──
async function driveCheckLatest(){
  if(!_driveToken) return;
  try {
    const escapedName = 'Backups'.replace(/'/g,"\\'");
    const folderQuery = `name='${escapedName}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const folderUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(folderQuery)}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${GOOGLE_DRIVE_FOLDER_ID}&fields=files(id)`;
    const folderRes = await fetch(folderUrl, { headers: {'Authorization':'Bearer '+_driveToken} });
    if(!folderRes.ok) return;
    const folderData = await folderRes.json();
    if(!folderData.files || !folderData.files.length) return;

    const filesQuery = `'${folderData.files[0].id}' in parents and mimeType='application/json' and trashed=false`;
    const filesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(filesQuery)}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${GOOGLE_DRIVE_FOLDER_ID}&orderBy=createdTime desc&pageSize=1&fields=files(id,name,createdTime)`;
    const filesRes = await fetch(filesUrl, { headers: {'Authorization':'Bearer '+_driveToken} });
    if(!filesRes.ok) return;
    const filesData = await filesRes.json();
    if(!filesData.files || !filesData.files.length) return;

    const latest = filesData.files[0];
    const fecha = new Date(latest.createdTime).toLocaleString('es-CL');
    toast('☁ Backup disponible en Drive: '+latest.name+' ('+fecha+') — usa Herramientas > Cargar desde Drive','ok');
  } catch(e){ /* silencioso */ }
}

// ── Inicializar al cargar la página ──
window.addEventListener('load', ()=>{ setTimeout(driveInit, 100); });
