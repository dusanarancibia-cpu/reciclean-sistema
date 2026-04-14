// ═══════════════════════════════════════════════════════════
// GOOGLE DRIVE — Subida automática a Unidad compartida
// v3 · 14-abril-2026
// FIX: Soporte correcto para Shared Drives
// - Obtener rootFolderId del Shared Drive y usarlo como raíz
// - Agregar corpora=drive + driveId en todas las queries
// - Corregir filtro de parents con rootFolderId
// ═══════════════════════════════════════════════════════════

let _driveToken = null;
let _driveTokenClient = null;
let _driveChecking = false;
let _driveFolderCache = {};
let _driveRootFolderId = null;

// ── Helper: buscar archivos en Drive ──
async function driveQuery(q, fields, orderBy, pageSize, extraParams){
  const params = new URLSearchParams({
    q: q,
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
    fields: 'files('+fields+')'
  });
  if(extraParams) Object.entries(extraParams).forEach(([k,v])=>params.set(k,v));
  if(orderBy) params.set('orderBy', orderBy);
  if(pageSize) params.set('pageSize', pageSize);
  const res = await fetch('https://www.googleapis.com/drive/v3/files?'+params.toString(),{
    headers: {'Authorization':'Bearer '+_driveToken}
  });
  if(!res.ok){
    const err = await res.json().catch(()=>({}));
    throw new Error(err.error?.message || 'HTTP '+res.status);
  }
  const data = await res.json();
  return data.files || [];
}

// ── Obtener rootFolderId del Shared Drive ──
async function getSharedDriveRootFolderId(driveId){
  // Intentar obtener rootFolderId de la API de Drives
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/drives/'+driveId+'?fields=id,name',{
      headers: {'Authorization':'Bearer '+_driveToken}
    });
    if(res.ok){
      // Para Shared Drives, el driveId se usa como parent de la raíz
      return driveId;
    }
  } catch(e){}
  // Fallback: usar el ID tal cual
  return driveId;
}

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
        callback: async (resp) => {
          if(resp.error){
            console.warn('Drive auth error:', resp.error);
            toast('⚠ No se pudo conectar a Drive','warn');
            driveUpdateUI(false);
            _driveToken = null;
            _driveRootFolderId = null;
            return;
          }
          _driveToken = resp.access_token;
          try {
            _driveRootFolderId = await getSharedDriveRootFolderId(GOOGLE_DRIVE_FOLDER_ID);
            console.log('Drive root:', _driveRootFolderId);
          } catch(e){
            console.warn('No se pudo acceder al Shared Drive:', e);
            _driveRootFolderId = GOOGLE_DRIVE_FOLDER_ID;
          }
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
  _driveRootFolderId = null;
  _driveFolderCache = {};
  localStorage.removeItem('rf_drive_connected');
  driveUpdateUI(false);
  toast('Drive desconectado','ok');
}

// ── Actualizar indicador visual ──
function driveUpdateUI(connected){
  const el = document.getElementById('drive-status');
  if(!el) return;
  if(connected && _driveToken && _driveRootFolderId){
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
      _driveRootFolderId = null;
      driveUpdateUI(false);
      toast('⚠ Sesión de Drive expiró — reconecta desde Herramientas','warn');
      return false;
    }
    return false;
  } catch(e){ return false; }
}

// ── Buscar o crear subcarpeta en Shared Drive ──
async function driveGetOrCreateFolder(name){
  if(!_driveRootFolderId) throw new Error('No se tiene la raíz del Shared Drive');
  if(_driveFolderCache[name]) return _driveFolderCache[name];

  const escapedName = name.replace(/'/g,"\\'");
  const sdParams = {corpora:'drive', driveId: GOOGLE_DRIVE_FOLDER_ID};

  // Buscar dentro del Shared Drive
  const files = await driveQuery(
    `name='${escapedName}' and '${_driveRootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    'id,name,parents',
    null, null, sdParams
  );

  if(files.length > 0){
    _driveFolderCache[name] = files[0].id;
    return files[0].id;
  }

  // Crear carpeta
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true',{
    method:'POST',
    headers: {
      'Authorization':'Bearer '+_driveToken,
      'Content-Type':'application/json'
    },
    body: JSON.stringify({
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [_driveRootFolderId]
    })
  });
  if(!createRes.ok){
    const err = await createRes.json().catch(()=>({}));
    throw new Error(err.error?.message || 'Error creando carpeta: HTTP '+createRes.status);
  }
  const createData = await createRes.json();
  if(!createData.id) throw new Error('No se pudo crear carpeta');
  _driveFolderCache[name] = createData.id;
  return createData.id;
}

// ── Subir archivo ──
async function driveUpload(blob, filename, subcarpeta){
  if(!_driveToken || !_driveRootFolderId) return;
  const valid = await driveCheckToken();
  if(!valid) return;

  try {
    const folderId = await driveGetOrCreateFolder(subcarpeta);
    if(!folderId) throw new Error('No se pudo obtener/crear la carpeta');

    const metadata = {name: filename, parents: [folderId]};
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
        _driveRootFolderId = null;
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

// ── Cargar último backup desde Drive ──
async function driveLoadLatest(){
  if(!_driveToken || !_driveRootFolderId){
    toast('⚠ Primero conecta Google Drive desde Herramientas','warn');
    return;
  }
  const valid = await driveCheckToken();
  if(!valid) return;

  try {
    toast('☁ Buscando último backup en Drive...','ok');
    const folderId = await driveGetOrCreateFolder('Backups');
    const sdParams = {corpora:'drive', driveId: GOOGLE_DRIVE_FOLDER_ID};

    const files = await driveQuery(
      `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
      'id,name,createdTime',
      'createdTime desc', '1', sdParams
    );

    if(!files.length){
      toast('⚠ No hay backups en Drive','warn');
      return;
    }

    const latest = files[0];
    const fecha = new Date(latest.createdTime).toLocaleString('es-CL');

    const dlRes = await fetch(
      'https://www.googleapis.com/drive/v3/files/'+latest.id+'?alt=media&supportsAllDrives=true',
      {headers: {'Authorization':'Bearer '+_driveToken}}
    );
    if(!dlRes.ok) throw new Error('Error descargando backup');
    const text = await dlRes.text();
    const backup = JSON.parse(text);

    if(!backup.materiales) throw new Error('Formato de backup inválido');

    driveApplyBackup(backup);
    toast('☁ Backup cargado: '+latest.name+' ('+fecha+')','ok');

  } catch(e){
    console.warn('Drive load error:', e);
    toast('⚠ Error cargando desde Drive: '+e.message,'warn');
  }
}

// ── Aplicar backup descargado de Drive ──
async function driveApplyBackup(backup){
  backup.materiales.forEach(m=>{
    const idx = MATS_LOCAL.findIndex(x=>x.id===m.id);
    if(idx>=0){
      const {nombre, cat, ...rest} = m;
      MATS_LOCAL[idx] = {...MATS_LOCAL[idx], ...rest};
    }
  });
  mats = MATS_LOCAL.map(m=>({...m}));
  if(typeof idbSaveMats === 'function') await idbSaveMats(mats);

  if(backup.fuentes){
    if(typeof dbClear === 'function') await dbClear('fuentes');
    backup.fuentes.forEach(f=>{ if(!FUENTES.includes(f)) FUENTES.push(f); });
    if(typeof idbSaveFuente === 'function') for(const f of FUENTES) await idbSaveFuente(f);
  }
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
  if(!_driveToken || !_driveRootFolderId) return;
  try {
    const folderId = await driveGetOrCreateFolder('Backups').catch(()=>null);
    if(!folderId) return;
    const sdParams = {corpora:'drive', driveId: GOOGLE_DRIVE_FOLDER_ID};
    const files = await driveQuery(
      `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
      'id,name,createdTime',
      'createdTime desc', '1', sdParams
    );
    if(files.length){
      const fecha = new Date(files[0].createdTime).toLocaleString('es-CL');
      toast('☁ Backup en Drive: '+files[0].name+' ('+fecha+') — Herramientas > Cargar desde Drive','ok');
    }
  } catch(e){ /* silencioso */ }
}

// ── Inicializar al cargar la página ──
window.addEventListener('load', ()=>{ setTimeout(driveInit, 100); });
