const IDB_NAME    = 'reciclean_admin';
const IDB_VERSION = 1;
let _db = null;

function openDB(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = e=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains('materiales'))
        db.createObjectStore('materiales', {keyPath:'id'});
      if(!db.objectStoreNames.contains('aliases'))
        db.createObjectStore('aliases', {keyPath:'_key'}); // _key = `${material_id}|${fuente}|${alias}`
      if(!db.objectStoreNames.contains('historial'))
        db.createObjectStore('historial', {keyPath:'id', autoIncrement:true});
      if(!db.objectStoreNames.contains('config'))
        db.createObjectStore('config', {keyPath:'clave'});
      if(!db.objectStoreNames.contains('fuentes'))
        db.createObjectStore('fuentes', {keyPath:'nombre'});
    };
    req.onsuccess = e=>{ _db=e.target.result; resolve(_db); };
    req.onerror   = e=>reject(e.target.error);
  });
}

function tx(store, mode='readonly'){
  return _db.transaction(store, mode).objectStore(store);
}

function dbPut(store, obj){
  return new Promise((res,rej)=>{
    const r=tx(store,'readwrite').put(obj);
    r.onsuccess=()=>res(r.result);
    r.onerror=e=>rej(e.target.error);
  });
}
function dbDelete(store, key){
  return new Promise((res,rej)=>{
    const r=tx(store,'readwrite').delete(key);
    r.onsuccess=()=>res();
    r.onerror=e=>rej(e.target.error);
  });
}
function dbGetAll(store){
  return new Promise((res,rej)=>{
    const r=tx(store,'readonly').getAll();
    r.onsuccess=()=>res(r.result||[]);
    r.onerror=e=>rej(e.target.error);
  });
}
function dbClear(store){
  return new Promise((res,rej)=>{
    const r=tx(store,'readwrite').clear();
    r.onsuccess=()=>res();
    r.onerror=e=>rej(e.target.error);
  });
}

// ── Guardar material ──────────────────────────────────────
async function idbSaveMat(m){
  await dbPut('materiales', {...m});
}
// ── Guardar borrador (cambios no publicados) ──────────────
async function idbSaveDraft(){
  // Guardar en IndexedDB
  if(_db){
    try {
      await idbSaveConfig('draft_mats',    JSON.stringify(mats));
      await idbSaveConfig('draft_cambios', JSON.stringify(cambios));
    } catch(e){ console.warn('Error guardando borrador IDB:', e); }
  }
  // Respaldo en localStorage (sobrevive cambio de archivo)
  try {
    safeLS('rf_draft_mats',    JSON.stringify(mats));
    safeLS('rf_draft_cambios', JSON.stringify(cambios));
    safeLS('rf_draft_ts',      new Date().toISOString());
    // Actualizar indicador de guardado
    const el = document.getElementById('draft-saved-at');
    if(el) el.textContent = '💾 borrador ' + new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});
  } catch(e){ console.warn('Error guardando borrador LS:', e); }
}
async function idbClearDraft(){
  if(_db){
    await idbSaveConfig('draft_mats',    '');
    await idbSaveConfig('draft_cambios', '{}');
  }
  try {
    localStorage.removeItem('rf_draft_mats');
    localStorage.removeItem('rf_draft_cambios');
    localStorage.removeItem('rf_draft_ts');
    const el = document.getElementById('draft-saved-at');
    if(el) el.textContent = '';
  } catch(e){}
}

async function idbSaveMats(arr){
  for(const m of arr) await dbPut('materiales', {...m});
}

// ── Guardar alias ─────────────────────────────────────────
async function idbSaveAlias(material_id, fuente, alias){
  const key = `${material_id}|${fuente}|${alias}`;
  await dbPut('aliases', {_key:key, material_id, fuente, alias});
}
async function idbDeleteAlias(material_id, fuente, alias){
  const key = `${material_id}|${fuente}|${alias}`;
  await dbDelete('aliases', key);
}

// ── Guardar historial ─────────────────────────────────────
async function idbSaveHistorial(entry){
  // strip id so autoIncrement works
  const {id, ...rest} = entry;
  const newId = await dbPut('historial', rest);
  return newId;
}

// ── Guardar fuente ────────────────────────────────────────
async function idbSaveFuente(nombre){
  await dbPut('fuentes', {nombre});
}

// ── Config (spread, iva, version label) ──────────────────
async function idbSaveConfig(clave, valor){
  await dbPut('config', {clave, valor: String(valor)});
}
async function idbGetConfig(clave, defVal=''){
  return new Promise((res)=>{
    const r=tx('config','readonly').get(clave);
    r.onsuccess=()=>res(r.result?.valor ?? defVal);
    r.onerror=()=>res(defVal);
  });
}

// ── Cargar todo desde IndexedDB al iniciar ────────────────
async function loadFromDB(){
  const statusEl = document.getElementById('db-status');
  try {
    await openDB();

    // Materiales (última versión publicada)
    const dbMats = await dbGetAll('materiales');
    if(dbMats.length){
      dbMats.forEach(m=>{
        const idx=MATS_LOCAL.findIndex(x=>x.id===m.id);
        if(idx>=0) MATS_LOCAL[idx]={...MATS_LOCAL[idx],...m};
      });
      mats = MATS_LOCAL.map(m=>({...m}));
    } else {
      // Fallback: intentar desde localStorage (si IDB falló al guardar)
      try{
        const lsMats = localStorage.getItem('rf_mats_pub');
        if(lsMats){
          const parsed = JSON.parse(lsMats);
          parsed.forEach(m=>{
            const idx=MATS_LOCAL.findIndex(x=>x.id===m.id);
            if(idx>=0) MATS_LOCAL[idx]={...MATS_LOCAL[idx],...m};
          });
          mats = MATS_LOCAL.map(m=>({...m}));
          console.log('Materiales restaurados desde localStorage (IDB vacío)');
        }
      }catch(e){}
    }

    // ── Borrador: cambios pendientes no publicados ──────────
    const draftJson = await idbGetConfig('draft_mats','');
    const draftCambios = await idbGetConfig('draft_cambios','');

    // Si no hay borrador en IDB, intentar desde localStorage
    let finalDraftJson = draftJson;
    let finalDraftCambios = draftCambios;
    if(!draftJson || draftJson===''){
      try {
        finalDraftJson    = localStorage.getItem('rf_draft_mats')||'';
        finalDraftCambios = localStorage.getItem('rf_draft_cambios')||'';
        const ts = localStorage.getItem('rf_draft_ts');
        if(finalDraftJson && finalDraftCambios) {
          console.log('Borrador recuperado desde localStorage', ts);
        }
      } catch(e){}
    }

    if(finalDraftJson && finalDraftCambios){
      try {
        const draftMats = JSON.parse(finalDraftJson);
        const draftChg  = JSON.parse(finalDraftCambios);
        if(Object.keys(draftChg).length > 0){
          draftMats.forEach(m=>{
            const idx=mats.findIndex(x=>x.id===m.id);
            if(idx>=0) mats[idx]={...mats[idx],...m};
          });
          cambios = draftChg;
          const n=Object.keys(cambios).length;
          const ts = localStorage.getItem('rf_draft_ts');
          const hora = ts ? new Date(ts).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'}) : '';
          setTimeout(()=>{
            toast(`↩ Borrador restaurado — ${n} cambio${n>1?'s':''} pendiente${n>1?'s':''}${hora?' ('+hora+')':''}`, 'warn');
          }, 1500);
        }
      } catch(e){ console.warn('Error restaurando borrador:', e); }
    }

    // v81: aliases eliminados — no cargar

    // Fuentes
    const dbFuentes = await dbGetAll('fuentes');
    if(dbFuentes.length){
      const names = dbFuentes.map(f=>f.nombre);
      names.forEach(n=>{ if(!FUENTES.includes(n)) FUENTES.push(n); });
    }

    // Historial
    const dbHist = await dbGetAll('historial');
    if(dbHist.length){
      HISTORIAL = dbHist.map((h,i)=>({...h, id:i+1}));
    }

    // Config
    const vLabel = await idbGetConfig('version_label','16 Mar 2026');
    const verLabel = document.getElementById('ver-label');
    if(verLabel) verLabel.textContent = vLabel;
    // Spread e IVA por sucursal
    let _spJson = await idbGetConfig('spread_por_suc','');
    if(!_spJson){ try{ _spJson=localStorage.getItem('rf_spread_por_suc')||''; }catch(e){} }
    let _ivJson = await idbGetConfig('iva_por_suc','');
    if(!_ivJson){ try{ _ivJson=localStorage.getItem('rf_iva_por_suc')||''; }catch(e){} }
    if(_spJson){ try{ const v=JSON.parse(_spJson); v.forEach((x,i)=>{ const el=document.getElementById('cfg-spread-'+i); if(el) el.value=x; }); }catch(e){} }
    if(_ivJson){ try{ const v=JSON.parse(_ivJson); v.forEach((x,i)=>{ const el=document.getElementById('cfg-iva-'+i); if(el) el.value=x; }); }catch(e){} }

    // Cargar precios por cliente y fuentes por sucursal
    const cpJson = await idbGetConfig('clientes_precios','');
    if(cpJson){ try{ CLIENTES_PRECIOS = JSON.parse(cpJson); }catch(e){} }
    const sfJson = await idbGetConfig('sucursal_fuente','');
    if(sfJson){ 
      try{ 
        SUCURSAL_FUENTE = JSON.parse(sfJson);
        // Normalizar formato viejo (null o string) a array
        SUCS.forEach(s=>{
          if(!SUCURSAL_FUENTE[s]) SUCURSAL_FUENTE[s]=[];
          else if(!Array.isArray(SUCURSAL_FUENTE[s])){
            SUCURSAL_FUENTE[s] = SUCURSAL_FUENTE[s] ? [SUCURSAL_FUENTE[s]] : [];
          }
        });
      }catch(e){} 
    }
    // También intentar desde localStorage
    if(!cpJson){
      try{
        const ls=localStorage.getItem('rf_clientes_precios');
        if(ls) CLIENTES_PRECIOS=JSON.parse(ls);
      }catch(e){}
    }
    if(!sfJson){
      try{
        const ls=localStorage.getItem('rf_sucursal_fuente');
        if(ls) SUCURSAL_FUENTE=JSON.parse(ls);
      }catch(e){}
    }

    // ── Restaurar datos desde localStorage si IDB está vacío ──
    // Protege los datos del cliente cuando se abre un archivo nuevo
    if(Object.keys(CLIENTES_PRECIOS).length===0){
      try{
        const lsCP=localStorage.getItem('rf_clientes_precios');
        if(lsCP){ CLIENTES_PRECIOS=JSON.parse(lsCP); console.log('CP restaurado desde localStorage'); }
      }catch(e){}
    }
    if(FUENTES.length===0){
      try{
        const lsF=localStorage.getItem('rf_fuentes');
        if(lsF){ const parsed=JSON.parse(lsF); parsed.forEach(f=>{ if(!FUENTES.includes(f)) FUENTES.push(f); }); console.log('FUENTES restauradas desde localStorage'); }
      }catch(e){}
    }
    if(Object.keys(PRECIO_SELECCIONADO).length===0){
      try{
        const lsPS=localStorage.getItem('rf_precio_seleccionado');
        if(lsPS){ PRECIO_SELECCIONADO=JSON.parse(lsPS); }
      }catch(e){}
    }

    // ── Restaurar PRECIO_OVERRIDE ──
    const poJson = await idbGetConfig('precio_override','');
    if(poJson){ try{ PRECIO_OVERRIDE = JSON.parse(poJson); }catch(e){} }
    if(!poJson || Object.keys(PRECIO_OVERRIDE).length===0){
      try{
        const lsPO=localStorage.getItem('rf_precio_override');
        if(lsPO){ PRECIO_OVERRIDE=JSON.parse(lsPO); console.log('PRECIO_OVERRIDE restaurado desde localStorage'); }
      }catch(e){}
    }
    // v85: Cargar flete/margen/mc por sucursal
    try{
      var fpJson=await idbGetConfig('flete_por_suc','');
      if(fpJson) FLETE_POR_SUC=JSON.parse(fpJson);
      else { var ls=localStorage.getItem('rf_flete_por_suc'); if(ls) FLETE_POR_SUC=JSON.parse(ls); }
    }catch(e){}
    // Deep-merge: ediciones manuales guardadas ganan sobre defaults de config.js
    try{
      var mpJson=await idbGetConfig('margen_por_suc','');
      var mpStored=mpJson?JSON.parse(mpJson):null;
      if(!mpStored){ var ls2=localStorage.getItem('rf_margen_por_suc'); if(ls2) mpStored=JSON.parse(ls2); }
      if(mpStored){ for(var id in mpStored){ if(!MARGEN_POR_SUC[id]) MARGEN_POR_SUC[id]={}; for(var s in mpStored[id]) MARGEN_POR_SUC[id][s]=mpStored[id][s]; } }
    }catch(e){}
    try{
      var mcJson=await idbGetConfig('mc_ejec_por_suc','');
      if(mcJson) MC_EJEC_POR_SUC=JSON.parse(mcJson);
      else { var ls3=localStorage.getItem('rf_mc_ejec_por_suc'); if(ls3) MC_EJEC_POR_SUC=JSON.parse(ls3); }
    }catch(e){}
    try{
      var ceJson=await idbGetConfig('comision_ejec_por_suc','');
      if(ceJson) COMISION_EJEC_POR_SUC=JSON.parse(ceJson);
      else { var ls4=localStorage.getItem('rf_comision_ejec_por_suc'); if(ls4) COMISION_EJEC_POR_SUC=JSON.parse(ls4); }
    }catch(e){}

    // ── Reconstruir CLIENTES_PRECIOS desde aliases + mats existentes ──
    reconstruirClientesPrecios();

    if(statusEl) statusEl.innerHTML='<span style="color:#2ECC71;">● IndexedDB</span>';
    return true;
  } catch(e){
    console.warn('IndexedDB error:', e);
    if(statusEl) statusEl.innerHTML='<span style="color:#E74C3C;">● sin BD local</span>';
    return false;
  }
}
