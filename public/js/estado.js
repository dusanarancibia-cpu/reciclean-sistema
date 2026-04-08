async function grabarEstado(){
  const btn = document.getElementById('btn-grabar');
  if(btn){ btn.disabled=true; btn.textContent='⏳ Guardando...'; }
  try {
    // 1. Borrador de materiales y cambios
    await idbSaveDraft();
    // 2. (Aliases eliminados v81)
    // 3. Fuentes
    if(_db){
      await dbClear('fuentes');
      for(const f of FUENTES) await idbSaveFuente(f);
    }
    // 4. Clientes precios
    if(_db) await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
    safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
    // 5. Sucursal fuente
    if(_db) await idbSaveConfig('sucursal_fuente', JSON.stringify(SUCURSAL_FUENTE));
    safeLS('rf_sucursal_fuente', JSON.stringify(SUCURSAL_FUENTE));
    // 6. Precio seleccionado
    if(_db) await idbSaveConfig('precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
    safeLS('rf_precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
    // 7. Materiales publicados (por si acaso)
    safeLS('rf_mats_pub', JSON.stringify(MATS_LOCAL));
    // 8. Fuentes en localStorage
    safeLS('rf_fuentes', JSON.stringify(FUENTES));
    // 9. Precio override
    if(_db) await idbSaveConfig('precio_override', JSON.stringify(PRECIO_OVERRIDE));
    safeLS('rf_precio_override', JSON.stringify(PRECIO_OVERRIDE));
    // 10. Spread e IVA por sucursal
    const _sp = JSON.stringify(SUCS.map((_,i)=>document.getElementById('cfg-spread-'+i)?.value||'15'));
    const _iv = JSON.stringify(SUCS.map((_,i)=>document.getElementById('cfg-iva-'+i)?.value||'19'));
    if(_db){ await idbSaveConfig('spread_por_suc',_sp); await idbSaveConfig('iva_por_suc',_iv); }
    safeLS('rf_spread_por_suc',_sp); safeLS('rf_iva_por_suc',_iv);

    const hora = new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const el = document.getElementById('draft-saved-at');
    if(el) el.textContent = '💾 ' + hora;
    toast('💾 Estado completo guardado — ' + hora, 'ok');
  } catch(err){
    console.error('Error en grabarEstado:', err);
    toast('⚠ Error al guardar: ' + err.message, 'err');
  }
  if(btn){ btn.disabled=false; btn.textContent='💾 GRABAR'; }
}

// ═══════════════════════════════════════════════════════════
// INDEXEDDB — Base de datos local persistente
// ═══════════════════════════════════════════════════════════

// ── Reconstruir CLIENTES_PRECIOS desde datos existentes ─────
// Se llama al iniciar — rellena CLIENTES_PRECIOS con los precios
// que ya tenemos en mats, usando los aliases como puente cliente↔material
function reconstruirClientesPrecios(){
  // Solo reconstruir si CLIENTES_PRECIOS está completamente vacío
  // (primera carga sin backup). Si ya tiene datos, no tocar.
  if(Object.keys(CLIENTES_PRECIOS).length > 0) return;
  
  console.log('CLIENTES_PRECIOS vacío — no hay datos de clientes cargados.');
  // No reconstruir desde el Excel/MATS_LOCAL — los precios reales
  // vienen de los TXT de clientes cargados via Módulo C.
}

// ═══════════════════════════════════════════════════════════
// BACKUP — Exportar / Importar
// ═══════════════════════════════════════════════════════════
async function exportBackup(){
  const fecha = new Date().toISOString().split('T')[0].replace(/-/g,'');
  const backup = {
    version: '1.2',
    fecha: new Date().toISOString(),
    materiales: mats,
    aliases: [], // v81: aliases eliminados
    fuentes: FUENTES,
    clientes_precios: CLIENTES_PRECIOS,
    sucursal_fuente: SUCURSAL_FUENTE,
    precio_seleccionado: PRECIO_SELECCIONADO,
    precio_override: PRECIO_OVERRIDE,
    flete_por_suc: FLETE_POR_SUC,
    margen_por_suc: MARGEN_POR_SUC,
    mc_ejec_por_suc: MC_EJEC_POR_SUC,
    comision_ejec_por_suc: COMISION_EJEC_POR_SUC,
    historial: HISTORIAL,
    config: {
      spread_por_suc: SUCS.map((_,i)=>document.getElementById('cfg-spread-'+i)?.value||'15'),
      iva_por_suc:    SUCS.map((_,i)=>document.getElementById('cfg-iva-'+i)?.value||'19'),
    }
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombreDescarga('json');
  a.click();
  URL.revokeObjectURL(a.href);
  toast('✓ Backup descargado: reciclean_backup_'+fecha+'.json','ok');
}

function importBackup(){
  const inp = document.createElement('input');
  inp.type='file'; inp.accept='.json';
  inp.onchange = async(e)=>{
    const file = e.target.files[0]; if(!file) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if(!backup.materiales || !backup.aliases) throw new Error('Formato inválido');

      // Restore materiales
      backup.materiales.forEach(m=>{
        const idx=MATS_LOCAL.findIndex(x=>x.id===m.id);
        if(idx>=0){
          // Preservar nombre y cat canónicos del panel, solo importar precios/config
          const {nombre, cat, ...rest} = m;
          MATS_LOCAL[idx]={...MATS_LOCAL[idx], ...rest};
        }
      });
      mats = MATS_LOCAL.map(m=>({...m}));
      await idbSaveMats(mats);

      // v81: aliases eliminados — no restaurar

      // Restore fuentes
      if(backup.fuentes){
        await dbClear('fuentes');
        backup.fuentes.forEach(f=>{ if(!FUENTES.includes(f)) FUENTES.push(f); });
        for(const f of FUENTES) await idbSaveFuente(f);
      }

      // Restore clientes_precios y sucursal_fuente (v1.1+)
      if(backup.clientes_precios){
        CLIENTES_PRECIOS = backup.clientes_precios;
        await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
        safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
      }
      if(backup.precio_seleccionado){
        PRECIO_SELECCIONADO = backup.precio_seleccionado;
        await idbSaveConfig('precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
        safeLS('rf_precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
      }
      if(backup.sucursal_fuente){
        SUCURSAL_FUENTE = backup.sucursal_fuente;
        await idbSaveConfig('sucursal_fuente', JSON.stringify(SUCURSAL_FUENTE));
        safeLS('rf_sucursal_fuente', JSON.stringify(SUCURSAL_FUENTE));
      }
      // Si es backup antiguo sin clientes_precios, reconstruir desde aliases
      if(!backup.clientes_precios) reconstruirClientesPrecios();

      // Restore precio_override (v1.2+)
      if(backup.precio_override){
        PRECIO_OVERRIDE = backup.precio_override;
        await idbSaveConfig('precio_override', JSON.stringify(PRECIO_OVERRIDE));
        safeLS('rf_precio_override', JSON.stringify(PRECIO_OVERRIDE));
      } else {
        PRECIO_OVERRIDE = {};
      }
      // v85: Restaurar flete/margen/mc por sucursal
      if(backup.flete_por_suc){
        FLETE_POR_SUC=backup.flete_por_suc;
        await idbSaveConfig('flete_por_suc',JSON.stringify(FLETE_POR_SUC));
        safeLS('rf_flete_por_suc',JSON.stringify(FLETE_POR_SUC));
      }
      if(backup.margen_por_suc){
        MARGEN_POR_SUC=backup.margen_por_suc;
        await idbSaveConfig('margen_por_suc',JSON.stringify(MARGEN_POR_SUC));
        safeLS('rf_margen_por_suc',JSON.stringify(MARGEN_POR_SUC));
      }
      if(backup.mc_ejec_por_suc){
        MC_EJEC_POR_SUC=backup.mc_ejec_por_suc;
        await idbSaveConfig('mc_ejec_por_suc',JSON.stringify(MC_EJEC_POR_SUC));
        safeLS('rf_mc_ejec_por_suc',JSON.stringify(MC_EJEC_POR_SUC));
      }
      if(backup.comision_ejec_por_suc){
        COMISION_EJEC_POR_SUC=backup.comision_ejec_por_suc;
        await idbSaveConfig('comision_ejec_por_suc',JSON.stringify(COMISION_EJEC_POR_SUC));
        safeLS('rf_comision_ejec_por_suc',JSON.stringify(COMISION_EJEC_POR_SUC));
      }
      if(backup.config?.spread_por_suc){
        backup.config.spread_por_suc.forEach((v,i)=>{ const el=document.getElementById('cfg-spread-'+i); if(el) el.value=v; });
        await idbSaveConfig('spread_por_suc',JSON.stringify(backup.config.spread_por_suc));
        safeLS('rf_spread_por_suc',JSON.stringify(backup.config.spread_por_suc));
      }
      if(backup.config?.iva_por_suc){
        backup.config.iva_por_suc.forEach((v,i)=>{ const el=document.getElementById('cfg-iva-'+i); if(el) el.value=v; });
        await idbSaveConfig('iva_por_suc',JSON.stringify(backup.config.iva_por_suc));
        safeLS('rf_iva_por_suc',JSON.stringify(backup.config.iva_por_suc));
      }

      // Restore historial
      if(backup.historial?.length){
        await dbClear('historial');
        for(const h of backup.historial) await idbSaveHistorial(h);
        HISTORIAL = backup.historial;
      }

      updateAliasCnt(); rebuildFuenteSelects(); renderAlias();
      renderPrecios(); renderHistorial(); renderPublico(); renderFuentes(); renderPreview();
      toast('✓ Backup restaurado correctamente','ok');
    } catch(err) {
      toast('Error al restaurar: '+err.message,'err');
    }
  };
  inp.click();
}

// ═══════════════════════════════════════════════════════════
// GENERAR ASISTENTE COMERCIAL
// ═══════════════════════════════════════════════════════════
async function generarAsistente(forzar){
  // Bloquear si hay cambios sin publicar (salvo si viene de publicarVersion)
  if(!forzar){
    const cr = detectarCambiosReales();
    const nCambios = Object.keys(cr).length;
    const nManual = Object.keys(cambios).length;
    if(nCambios > 0 || nManual > 0){
      toast('⚠ Publica los cambios pendientes antes de generar el Asistente','warn');
      goTab('precios', document.querySelector('.nav-tab[onclick*=precios]'));
      return;
    }
  }
  // Build MATERIALES_DATA por sucursal con precios actuales
  // Usa calc() global (utils.js) que aplica PRECIO_OVERRIDE y getPrecioCompra por sucursal
  const SUCS_LIST = ['Cerrillos','Maipú','Talca','Puerto Montt'];
  const fecha  = new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'});
  const tag    = new Date().toISOString().slice(0,10).replace(/-/g,'').slice(2);

  const DATA = {};
  SUCS_LIST.forEach(suc=>{
    const f = SUC_FACTOR[suc]||1;
    DATA[suc] = mats.map(m=>{
      const c = calc(m, f, suc);
      if(!c.compra) return null; // v92: sin precio asignado para esta sucursal = omitir del snapshot
      return {
        id:m.id, categoria:m.cat, material:m.nombre,
        reciclean:!!m.reciclean, farex:!!m.farex,
        precioCompra:c.compra, precioLista:c.lista,
        precioEjecutivo:c.ejec, precioMaximo:c.max,
        metaKgTotal:m.meta||0, metaCategoriaTotal:0,
        ivaTret:!!m.iva, flete:c.flete, margen:c.margen
      };
    }).filter(Boolean);
  });

  // Fetch V24 base HTML and inject updated data
  const base = await fetch(window.location.href).catch(()=>null);
  // Since we can't reliably fetch ourselves, build the JSON and offer it
  // as a patch instruction, OR embed directly into a minimal template

  const jsonStr = JSON.stringify(DATA, null, 0);

  // Build the assistant HTML with updated data block
  const asistente = `<!DOCTYPE html>
<!-- Asistente Comercial V${tag} · Reciclean-Farex · Generado: ${fecha} -->
<!-- INSTRUCCIÓN: Reemplaza el const MATERIALES_DATA en el archivo V24 con el JSON abajo -->
<!--
${jsonStr}
-->
<html><head><meta charset="UTF-8">
<title>Datos actualizados · ${fecha}</title>
<style>body{font-family:sans-serif;max-width:700px;margin:40px auto;padding:20px;background:#F7F6F2;}
h1{font-size:20px;font-weight:700;margin-bottom:8px;}
.info{background:#E8F5ED;border:1px solid #B8DFC7;border-radius:8px;padding:16px;margin-bottom:16px;font-size:13px;}
.step{background:#fff;border:1px solid #D6D1C4;border-radius:8px;padding:16px;margin-bottom:10px;}
.step-num{font-family:monospace;font-size:11px;color:#92650A;font-weight:700;}
pre{background:#1A1A14;color:#4ADE80;padding:12px;border-radius:6px;font-size:10px;overflow-x:auto;max-height:200px;margin-top:8px;}
.btn{display:inline-block;background:#1A7A3C;color:#fff;padding:10px 20px;border-radius:6px;cursor:pointer;border:none;font-size:13px;font-weight:600;margin-top:8px;}
</style></head><body>
<h1>📱 Actualización de Precios · ${fecha}</h1>
<div class="info">
  ✓ Versión generada el <strong>${fecha}</strong> desde el Admin Panel de Reciclean-Farex.<br>
  Contiene los precios actualizados para las 4 sucursales.
</div>
<div class="step">
  <div class="step-num">OPCIÓN A · MÁS FÁCIL</div>
  <div style="font-size:13px;margin-top:6px;">Copia el JSON de abajo y reemplaza el bloque <code>const MATERIALES_DATA = {...}</code> en el archivo <strong>Asistente_Comercial_V24.html</strong></div>
  <button class="btn" onclick="copiarJSON()">⎘ Copiar JSON actualizado</button>
  <pre id="json-pre">${jsonStr.slice(0,500)}...</pre>
</div>
<div class="step">
  <div class="step-num">OPCIÓN B · AUTOMÁTICA (requiere servidor Reinaldo)</div>
  <div style="font-size:13px;margin-top:6px;">Cuando la API esté activa, el Asistente descarga los precios automáticamente al abrir.</div>
</div>
<script>
const FULL_JSON = ${JSON.stringify(jsonStr)};
function copiarJSON(){ navigator.clipboard.writeText(FULL_JSON).then(()=>alert('✓ JSON copiado — pégalo en el Asistente Comercial V24')); }
document.getElementById('json-pre').textContent = FULL_JSON.slice(0,800)+'...';
<\/script>

</body></html>`;

  // Publicar en Supabase → Asistente online se actualiza en tiempo real
  if(_supabase){
    try {
      const {error: sbErr} = await _supabase.from('asistente_snapshot').upsert({
        id: 1,
        datos: DATA,
        version_label: tag,
        actualizado_en: new Date().toISOString()
      });
      if(!sbErr){
        toast(`☁ Precios publicados en Supabase (v${tag}) — Asistente online actualizado`,'ok');
      } else {
        toast('⚠ Supabase: '+sbErr.message,'warn');
      }
    } catch(sbEx){
      toast('⚠ Error Supabase: '+sbEx.message,'warn');
    }
  } else {
    // v91: antes este caso fallaba en silencio y el usuario creía que había publicado
    console.error('_supabase es null al intentar publicar snapshot — el Asistente NO se actualizó');
    toast('⚠ Supabase no inicializado — snapshot NO publicado. Recarga el panel.','err');
  }

  // Also offer direct V24 patch — generate the full updated HTML
  // by injecting new data into a template string
  const fullHTML = await buildV24WithData(DATA, fecha, tag);

  const blob = new Blob([fullHTML], {type:'text/html;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = nombreDescarga('html');
  a.click();
  URL.revokeObjectURL(url);

  toast(`✓ Asistente_Comercial_V${tag} generado — offline listo + online actualizado`,'ok');
}

async function buildV24WithData(DATA, fecha, tag){
  // Minimal but complete Asistente Comercial with updated prices
  // Based on V24 structure — embeds the full MATERIALES_DATA
  const jsonStr = JSON.stringify(DATA);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Asistente Comercial v${tag} · Reciclean-Farex</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
<!-- DATOS GENERADOS: ${fecha} | Admin Panel Reciclean-Farex -->
<script>
// ── MATERIALES_DATA v${tag} · ${fecha} ──
const MATERIALES_DATA = ${jsonStr};
// ── FIN DATOS ──
<\/script>
<style>
/* Asistente Comercial v${tag} — Generado ${fecha} */
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#F0F2F5;min-height:100vh;max-width:480px;margin:0 auto;color:#1A2332}
.top-notice{background:#1B5E20;color:#fff;text-align:center;padding:8px 12px;font-size:11px;font-weight:600;letter-spacing:.5px;}
.topbar{background:#0D1B2A;padding:14px 16px 0;position:sticky;top:0;z-index:100;box-shadow:0 2px 10px rgba(0,0,0,.4)}
.brand-sub{color:#4FC3F7;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase}
.brand-title{color:#fff;font-size:19px;font-weight:800;line-height:1.1}
.mc-box{text-align:right}
.negocio-bar{background:#1A2B3A;padding:10px 16px}
.neg-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px}
.neg-field label{color:#4FC3F7;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px}
.neg-input{width:100%;padding:7px 10px;border-radius:8px;border:1.5px solid #2C3E50;background:#1A2D3E;color:#fff;font-size:12px}
select.neg-input option{background:#1A2D3E}
.search-wrap{position:relative;margin-bottom:8px}
.search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#999;font-size:13px;pointer-events:none}
.search-input{width:100%;padding:8px 10px 8px 30px;border-radius:10px;border:none;background:#2C3E50;color:#fff;font-size:13px}
.cat-scroll{display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none}
.cat-scroll::-webkit-scrollbar{display:none}
.cat-btn{flex-shrink:0;padding:4px 10px;border-radius:20px;border:none;cursor:pointer;font-size:10px;font-weight:700;white-space:nowrap;transition:all .15s}
.tabs{display:flex;border-top:1px solid #2C3E50}
.tab-btn{flex:1;padding:9px 0;background:none;border:none;border-bottom:2px solid transparent;color:#888;font-weight:700;font-size:11px;cursor:pointer;text-transform:uppercase;letter-spacing:.5px}
.tab-btn.active{color:#4FC3F7;border-bottom-color:#4FC3F7}
.content{padding:12px}
.card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.09);margin-bottom:14px}
.card-header{padding:11px 14px;display:flex;justify-content:space-between;align-items:flex-start}
.cat-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
.mat-name{color:#fff;font-size:14px;font-weight:700;margin-top:2px;line-height:1.2}
.price-band{display:grid;grid-template-columns:1fr 1fr 1fr}
.price-cell{padding:9px 6px;text-align:center}
.price-label{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.price-val{font-size:14px;font-weight:800;margin-top:1px}
.inputs{padding:10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
.input-label{font-size:10px;color:#555;font-weight:600;display:block;margin-bottom:3px}
.price-input{width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid #ddd;font-size:14px;font-weight:600;color:#222}
.results{padding:0 14px 12px}
.semaforo-bar{border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center;color:#fff}
.result-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.result-cell{background:#F8F8F8;border-radius:8px;padding:7px 10px}
.result-label{font-size:9px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.3px}
.result-val{font-size:14px;font-weight:800;color:#333;margin-top:2px}
.close-btn-wrap{padding:0 14px 80px}
.close-btn{width:100%;padding:16px;border-radius:14px;border:none;background:linear-gradient(135deg,#1565C0,#0D47A1);color:#fff;font-size:15px;font-weight:800;cursor:pointer;letter-spacing:.5px;margin-bottom:8px}
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999;align-items:flex-end;justify-content:center}
.modal-overlay.show{display:flex}
.modal{background:#fff;border-radius:20px 20px 0 0;padding:24px 20px 36px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto}
.modal-title{font-size:17px;font-weight:800;color:#1A2332;margin-bottom:6px}
.footer{text-align:center;font-size:9px;color:#aaa;padding:8px;background:#F0F2F5}
.diag-tab{padding:8px 16px;background:none;border:none;font-family:'Syne',sans-serif;
  font-size:12px;font-weight:600;color:var(--text3);cursor:pointer;border-bottom:2px solid transparent;}
.diag-tab:hover{color:var(--text);}
.diag-tab.active{color:var(--amber);border-bottom-color:var(--amber);background:var(--bg4);}
.diag-tbl{width:100%;border-collapse:collapse;font-size:12px;}
.diag-tbl th{text-align:left;padding:6px 10px;background:var(--bg3);font-size:10px;color:var(--text3);
  font-weight:700;letter-spacing:.5px;text-transform:uppercase;border-bottom:1px solid var(--border);}
.diag-tbl td{padding:5px 10px;border-bottom:1px solid var(--bg4);vertical-align:top;}
.diag-tbl tr:hover{background:rgba(146,101,10,.04);}
.diag-stat{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--bg3);
  border-radius:var(--r2);border:1px solid var(--border);margin:4px;}
.diag-stat-val{font-family:'Roboto Mono',monospace;font-size:18px;font-weight:700;color:var(--text);}
.diag-stat-label{font-size:10px;color:var(--text3);}
.diag-del{background:none;border:1px solid var(--red-border);border-radius:3px;padding:2px 8px;
  font-size:10px;color:var(--red);cursor:pointer;font-weight:600;}
.diag-del:hover{background:var(--red-bg);}
</style>
</head>
<body>

<div class="top-notice">v${tag} · Actualizado: ${fecha} · Precios sujetos a cambio</div>

<div class="topbar">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
    <div><div class="brand-sub">Reciclean · Farex</div><div class="brand-title">Asistente Comercial</div></div>
    <div class="mc-box" id="mc-total-wrap" style="display:none">
      <div style="color:#4FC3F7;font-size:10px;font-weight:600">Comisión</div>
      <div id="mc-total-val" style="font-size:17px;font-weight:800"></div>
    </div>
  </div>
  <div class="negocio-bar">
    <div style="color:#fff;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;user-select:none" onclick="toggleNeg()">
      <span id="neg-arrow">▶</span> Datos del Negocio
      <span id="neg-inline" style="color:#4FC3F7;font-size:10px;font-weight:500;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
    </div>
    <div id="neg-form" class="negocio-form" style="display:none;padding-top:10px">
      <div class="neg-grid">
        <div class="neg-field"><label>Sucursal</label>
          <select class="neg-input" id="neg-suc" onchange="updateSucursalMateriales();updateNegInline()">
            <option value="">Seleccionar...</option>
            <option>Cerrillos</option><option>Maipú</option><option>Talca</option><option>Puerto Montt</option>
          </select>
        </div>
        <div class="neg-field"><label>Ejecutivo</label>
          <select class="neg-input" id="neg-tipo-ejec">
            <option>Administrador</option><option>Interno</option><option>Externo</option>
          </select>
        </div>
        <div class="neg-field"><label>Nombre Ejecutivo</label>
          <input class="neg-input" id="neg-ejec" placeholder="Nombre..." oninput="updateNegInline()">
        </div>
        <div class="neg-field"><label>Proveedor</label>
          <input class="neg-input" id="neg-prov" placeholder="Empresa..." oninput="updateNegInline()">
        </div>
      </div>
    </div>
  </div>
  <div style="padding:8px 0 0">
    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input class="search-input" id="search" placeholder="Buscar material..." oninput="render()">
    </div>
    <div class="cat-scroll" id="cat-scroll"></div>
  </div>
  <div class="tabs">
    <button class="tab-btn active" id="tab-browse" onclick="switchTab('browse')">Todos (<span id="cnt-browse">0</span>)</button>
    <button class="tab-btn" id="tab-active" onclick="switchTab('active')">Activos (<span id="cnt-active">0</span>)</button>
  </div>
</div>

<div class="content" id="content"></div>

<div class="close-btn-wrap">
  <button class="close-btn" onclick="finalizarConsulta()">📋 Generar Resumen Consulta</button>
  <button class="close-btn" style="background:linear-gradient(135deg,#17A2B8,#0D8BA7)" onclick="mostrarTablaPrecios()">📊 Ver Tabla de Precios</button>
  <button class="close-btn" style="background:linear-gradient(135deg,#F57C00,#E64A19);font-size:13px;padding:12px" onclick="limpiarMateriales()">🗑 Limpiar materiales</button>
</div>

<div class="modal-overlay" id="modal" onclick="closeModal(event)">
  <div class="modal" id="modal-box">
    <div class="modal-title" id="modal-title"></div>
    <div style="font-size:12px;color:#888;margin-bottom:18px" id="modal-sub"></div>
    <div id="modal-body"></div>
  </div>
</div>

<div class="footer">v${tag} · ${fecha} · Reciclean-Farex · *Precios referenciales sujetos a cambio</div>

<script>
let MATERIALES = MATERIALES_DATA["Cerrillos"];
const COL={"FIERROS Y LATAS":{bg:"#37474F",ac:"#78909C",lt:"#ECEFF1"},"LATA CHATARRA":{bg:"#37474F",ac:"#78909C",lt:"#ECEFF1"},"COBRES":{bg:"#BF360C",ac:"#FF7043",lt:"#FBE9E7"},"BRONCES":{bg:"#E65100",ac:"#FFB74D",lt:"#FFF3E0"},"ALUMINIOS":{bg:"#1565C0",ac:"#42A5F5",lt:"#E3F2FD"},"ACEROS INOXIDABLES":{bg:"#4A148C",ac:"#AB47BC",lt:"#F3E5F5"},"CARTÓN Y PAPEL":{bg:"#33691E",ac:"#8BC34A",lt:"#F1F8E9"},"VIDRIO":{bg:"#006064",ac:"#26C6DA",lt:"#E0F7FA"},"PLÁSTICOS — PET":{bg:"#880E4F",ac:"#EC407A",lt:"#FCE4EC"},"PLÁSTICOS — FILM Y POLIETILENOS":{bg:"#4527A0",ac:"#7E57C2",lt:"#EDE7F6"},"PLÁSTICOS — RÍGIDOS":{bg:"#1A237E",ac:"#5C6BC0",lt:"#E8EAF6"},"PLÁSTICOS — SOPLADOS":{bg:"#01579B",ac:"#29B6F6",lt:"#E1F5FE"}};
let CATS=[...new Set(MATERIALES.map(m=>m.categoria))];
const states={};
let selCats=new Set(), curTab='browse', negOpen=false;
const fmt=n=>n>0?'$'+Math.round(n).toLocaleString('es-CL'):'—';
const fmtNum=n=>n>0?n.toLocaleString('es-CL'):'-';

function getSem(kg,mat){if(!kg||kg<=0)return null;const m=mat.metaKgTotal||0;if(m<=0)return 'rojo';const p=(kg/m)*100;return p>=25?'verde':p>=5?'amarillo':'rojo';}
function getHab(sem,mat){if(!sem||sem==='rojo')return mat.precioLista;if(sem==='verde')return mat.precioMaximo;return Math.round(mat.precioLista+(mat.precioMaximo-mat.precioLista)*0.5);}
function getMC(kg,ej,mat){if(!kg||!ej||kg<=0||ej<=0||!mat.precioMaximo||mat.precioMaximo<=0||ej>mat.precioMaximo)return null;return Math.round(kg*(mat.precioMaximo-ej));}
function getComision(mc){if(mc===null||mc<=0)return null;const tipo=document.getElementById('neg-tipo-ejec')?.value||'Administrador';return Math.round(mc*(tipo==='Externo'?0.005:0.0025));}
function sinPrecios(mat){return mat.precioMaximo<=0&&mat.precioLista<=0;}
function getActives(){return MATERIALES.filter(m=>{const s=states[m.id]||{};return(parseFloat(s.kg)||0)>0||(parseFloat(s.ej)||0)>0;});}
function toggleNeg(){negOpen=!negOpen;document.getElementById('neg-form').style.display=negOpen?'block':'none';document.getElementById('neg-arrow').textContent=negOpen?'▼':'▶';}
function updateNegInline(){const s=document.getElementById('neg-suc').value,e=document.getElementById('neg-ejec').value,p=document.getElementById('neg-prov').value;document.getElementById('neg-inline').textContent=[s,e,p].filter(Boolean).join(' · ');}
function buildCats(){const w=document.getElementById('cat-scroll');w.innerHTML='';CATS.forEach(cat=>{const c=COL[cat]||{bg:'#455A64'};const on=selCats.has(cat);const btn=document.createElement('button');btn.className='cat-btn';btn.textContent=cat.replace('PLÁSTICOS — ','PL. ');btn.style.cssText='background:'+(on?c.bg:'#2C3E50')+';color:'+(on?'#fff':'#aaa');btn.onclick=()=>{selCats.has(cat)?selCats.delete(cat):selCats.add(cat);buildCats();render()};w.appendChild(btn);});}
function onInput(id,field,val){if(!states[id])states[id]={};states[id][field]=val;updateResults(id);updateTotals();}
function updateResults(id){const mat=MATERIALES.find(m=>m.id===id);const s=states[id]||{};const kg=parseFloat(s.kg)||0,ej=parseFloat(s.ej)||0;const sem=getSem(kg,mat),hab=getHab(sem,mat),mc=getMC(kg,ej,mat);const semMap={verde:{e:'🟢',l:'VERDE — hasta Precio Máximo',bg:'#1B5E20'},amarillo:{e:'🟡',l:'AMARILLO — hasta 50% spread',bg:'#F57F17'},rojo:{e:'🔴',l:'ROJO — solo Precio Lista',bg:'#B71C1C'}};const sc=sem?semMap[sem]:null;const im=mat.metaKgTotal>0&&kg>0?(kg/mat.metaKgTotal*100).toFixed(1)+'%':'—';const ic=mat.metaCategoriaTotal>0&&kg>0?(kg/mat.metaCategoriaTotal*100).toFixed(1)+'%':'—';let alerta='—';if(ej>0){if(ej>mat.precioMaximo)alerta='🔴 EXCEDE MÁXIMO';else if(ej<mat.precioLista)alerta='🔴 BAJO LISTA';else if(ej>hab)alerta='🟡 FUERA DE NIVEL';else alerta='🟢 OK';}const hv=document.getElementById('hab-val-'+id);if(hv){hv.textContent=fmt(hab);document.getElementById('hab-sub-'+id).textContent=sc?sc.e:'—';}const ei=document.getElementById('ej-input-'+id);if(ei)ei.style.borderColor=ej>mat.precioMaximo?'#c62828':ej>0&&ej>=mat.precioLista&&ej<=hab?'#2e7d32':'#f57f17';const rd=document.getElementById('res-'+id);if(!rd)return;if(kg<=0&&ej<=0){rd.innerHTML='';return;}rd.innerHTML=(sc?'<div class="semaforo-bar" style="background:'+sc.bg+'">'+sc.e+' '+sc.l+'</div>':'')+'<div class="result-grid"><div class="result-cell"><div class="result-label">Incid. Material</div><div class="result-val">'+im+'</div></div><div class="result-cell"><div class="result-label">Incid. Categoría</div><div class="result-val">'+ic+'</div></div><div class="result-cell"><div class="result-label">Alerta</div><div class="result-val">'+alerta+'</div></div><div class="result-cell" style="background:#E3F2FD"><div class="result-label">🏆 Comisión</div><div class="result-val" style="color:#1565C0">'+(getComision(mc)!==null?'$'+getComision(mc).toLocaleString('es-CL'):'—')+'</div></div></div>';}
function updateTotals(){const a=getActives();document.getElementById('cnt-active').textContent=a.length;const tot=a.reduce((s,mat)=>{const st=states[mat.id]||{};const mc=getMC(parseFloat(st.kg)||0,parseFloat(st.ej)||0,mat);return s+(mc||0);},0);const totCom=getComision(tot)||0;const w=document.getElementById('mc-total-wrap');if(a.length>0){w.style.display='block';document.getElementById('mc-total-val').innerHTML='<div style="font-size:9px;color:#B3E5FC;font-weight:700;text-transform:uppercase;letter-spacing:1px">Comisión</div><div style="color:#FFD54F;font-size:18px;font-weight:800">$'+totCom.toLocaleString('es-CL')+'</div>';}else w.style.display='none';}
function buildCard(mat){const c=COL[mat.categoria]||{bg:'#455A64',ac:'#90A4AE',lt:'#ECEFF1'};const s=states[mat.id]||{};const kg=parseFloat(s.kg)||0,ej=parseFloat(s.ej)||0;const sem=getSem(kg,mat),hab=getHab(sem,mat);const sc=sem?{verde:{e:'🟢'},amarillo:{e:'🟡'},rojo:{e:'🔴'}}[sem]:null;const ejBorder=ej>mat.precioMaximo?'#c62828':ej>0&&ej<=hab?'#2e7d32':'#ddd';const hasRes=kg>0||ej>0;return '<div class="card"><div class="card-header" style="background:'+c.bg+'"><div><div class="cat-label" style="color:'+c.ac+'">'+mat.categoria+'</div><div class="mat-name">'+mat.material+'</div></div><div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">'+(mat.farex?'<span style="font-size:9px;padding:2px 7px;border-radius:20px;font-weight:700;color:#fff;background:#1565C0">FAREX</span>':'')+(mat.reciclean?'<span style="font-size:9px;padding:2px 7px;border-radius:20px;font-weight:700;color:#fff;background:#2E7D32">RECICLEAN</span>':'')+'</div></div>'+(sinPrecios(mat)?'<div style="background:'+c.lt+';padding:10px 14px;font-size:11px;font-weight:700;color:#E65100">⚠️ Sin precios activos</div>':'<div class="price-band" style="background:'+c.lt+'"><div class="price-cell" style="border-right:1px solid '+c.bg+'18"><div class="price-label" style="color:'+c.bg+'">Precio Lista</div><div class="price-val" style="color:'+c.bg+'">'+fmt(mat.precioLista)+'</div><div style="font-size:9px;color:#666">mínimo</div></div><div class="price-cell" style="border-right:1px solid '+c.bg+'18"><div class="price-label" style="color:'+c.bg+'">Habilitado</div><div class="price-val" style="color:'+c.bg+'" id="hab-val-'+mat.id+'">'+fmt(hab)+'</div><div style="font-size:9px;color:#666" id="hab-sub-'+mat.id+'">'+(sc?sc.e:'—')+'</div></div><div class="price-cell"><div class="price-label" style="color:'+c.bg+'">Precio Máximo</div><div class="price-val" style="color:'+c.bg+'">'+fmt(mat.precioMaximo)+'</div><div style="font-size:9px;color:#666">techo</div></div></div>')+'<div class="inputs"><div><label class="input-label">Kilos proveedor</label><input class="price-input" type="number" inputmode="numeric" placeholder="kg" value="'+(s.kg||'')+'" oninput="onInput('+mat.id+',\'kg\',this.value)"></div><div><label class="input-label">Precio Ejecutivo $/kg</label><input class="price-input" id="ej-input-'+mat.id+'" type="number" inputmode="numeric" placeholder="'+(hab>0?'Sugerido '+fmt(hab):'$0')+'" value="'+(s.ej||'')+'" style="border-color:'+ejBorder+'" oninput="onInput('+mat.id+',\'ej\',this.value)"></div></div><div style="padding:8px 14px;background:'+c.lt+';border-top:1px solid '+c.bg+'18;font-size:10px;color:'+c.bg+';font-weight:600">📊 Meta: '+(mat.metaKgTotal?.toLocaleString('es-CL')||'—')+' kg/mes</div><div class="results" id="res-'+mat.id+'"></div></div>';}
function switchTab(tab){curTab=tab;document.getElementById('tab-browse').className='tab-btn'+(tab==='browse'?' active':'');document.getElementById('tab-active').className='tab-btn'+(tab==='active'?' active':'');render();}
function render(){const q=document.getElementById('search').value.toLowerCase();const actives=new Set(getActives().map(m=>m.id));document.getElementById('cnt-active').textContent=actives.size;let list=MATERIALES.filter(m=>(selCats.size===0||selCats.has(m.categoria))&&(q===''||m.material.toLowerCase().includes(q)));document.getElementById('cnt-browse').textContent=list.length;const content=document.getElementById('content');if(curTab==='active'){const al=MATERIALES.filter(m=>actives.has(m.id));content.innerHTML=al.length?al.map(buildCard).join(''):'<div style="text-align:center;padding:40px;color:#999">Sin materiales activos</div>';}else{content.innerHTML=list.map(buildCard).join('');}}
function filtrarMaterialesPorSucursal(suc,mats){if(!suc||['Cerrillos','Maipú'].includes(suc))return mats;return mats.filter(m=>m.reciclean===true);}
function updateSucursalMateriales(){const suc=document.getElementById('neg-suc').value;const allMats=MATERIALES_DATA[suc]||MATERIALES_DATA['Cerrillos'];MATERIALES=filtrarMaterialesPorSucursal(suc,allMats);CATS=[...new Set(MATERIALES.map(m=>m.categoria))];selCats.clear();buildCats();render();}
function finalizarConsulta(){const suc=document.getElementById('neg-suc').value,ejec=document.getElementById('neg-ejec').value.trim(),prov=document.getElementById('neg-prov').value.trim(),actives=getActives();if(!suc||!ejec||!prov||actives.length===0){if(!negOpen)toggleNeg();alert('Completa: sucursal, ejecutivo, proveedor y al menos 1 material');return;}showModal();}
function getNegData(){return{suc:document.getElementById('neg-suc').value,ejec:document.getElementById('neg-ejec').value.trim(),prov:document.getElementById('neg-prov').value.trim(),tipoEjec:document.getElementById('neg-tipo-ejec')?.value||'Administrador'};}
function showModal(){const neg=getNegData();const actives=getActives();const totalMC=actives.reduce((s,mat)=>{const st=states[mat.id]||{};return s+(getMC(parseFloat(st.kg)||0,parseFloat(st.ej)||0,mat)||0);},0);const totalKg=actives.reduce((s,mat)=>s+(parseFloat((states[mat.id]||{}).kg)||0),0);const today=new Date().toLocaleDateString('es-CL');document.getElementById('modal-title').textContent='Resumen de Negocio';document.getElementById('modal-sub').textContent='Revisa antes de enviar';let mats='';actives.forEach(mat=>{const s=states[mat.id]||{};const kg=parseFloat(s.kg)||0,ej=parseFloat(s.ej)||0;const sem=getSem(kg,mat);const mc=getMC(kg,ej,mat);mats+='<div style="background:#F8F8F8;border-radius:8px;padding:8px 10px;margin-bottom:6px"><div style="font-size:12px;font-weight:700;color:#1A2332">'+mat.material+'</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;font-size:11px;color:#555"><span>Kg: '+fmtNum(kg)+'</span><span>Ejec: '+fmt(ej)+'</span><span style="color:#1565C0">Comisión: '+(getComision(mc)!==null?'$'+getComision(mc).toLocaleString('es-CL'):'—')+'</span></div></div>';});document.getElementById('modal-body').innerHTML='<div style="margin-bottom:12px;font-size:12px"><b>Sucursal:</b> '+neg.suc+' | <b>Ejecutivo:</b> '+neg.ejec+' | <b>Proveedor:</b> '+neg.prov+'</div>'+mats+'<div style="background:#0D1B2A;border-radius:10px;padding:12px;margin:12px 0;display:flex;justify-content:space-between"><div style="color:#fff;font-size:13px;font-weight:700">'+fmtNum(totalKg)+' kg</div><div style="color:#4FC3F7;font-size:15px;font-weight:800">$'+(getComision(totalMC)||0).toLocaleString('es-CL')+' comisión</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button style="padding:12px;background:#25D366;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px" onclick="shareWA()">📱 WhatsApp</button><button style="padding:12px;background:#1565C0;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px" onclick="closeModal()">← Volver</button></div>';document.getElementById('modal').className='modal-overlay show';}
function closeModal(e){if(e&&e.target!==document.getElementById('modal'))return;document.getElementById('modal').className='modal-overlay';}
function shareWA(){const neg=getNegData();const actives=getActives();if(!actives.length){alert('Sin materiales');return;}let txt='*Resumen Consulta — Reciclean/Farex*\n📅 '+new Date().toLocaleDateString('es-CL')+'\n🏢 '+neg.suc+'\n👤 '+neg.ejec+'\n🧾 '+neg.prov+'\n\n*Materiales:*\n';actives.forEach(mat=>{const s=states[mat.id]||{};txt+='• '+mat.material+': '+fmtNum(parseFloat(s.kg)||0)+' kg | Ejec: '+fmt(parseFloat(s.ej)||0)+'\n';});txt+='\n_Precios referenciales — Reciclean·Farex_';window.open('https://wa.me/?text='+encodeURIComponent(txt));}
function limpiarMateriales(){if(confirm('¿Limpiar todos los materiales?')){document.querySelectorAll('input[type="number"]').forEach(i=>i.value='');Object.keys(states).forEach(k=>delete states[k]);render();updateTotals();}}
function mostrarTablaPrecios(){const neg=getNegData();const suc=neg.suc||'Cerrillos';const allMats=MATERIALES_DATA[suc]||MATERIALES_DATA['Cerrillos'];const mats=filtrarMaterialesPorSucursal(suc,allMats);let html='<table style="width:100%;border-collapse:collapse;font-size:11px"><tr style="background:#1F3864;color:#fff"><td style="padding:8px 10px;font-weight:700">MATERIAL</td><td style="padding:8px 10px;text-align:right;font-weight:700">P. LISTA</td></tr>';let prevCat='';mats.forEach((mat,i)=>{if(mat.categoria!==prevCat){html+='<tr><td colspan="2" style="padding:8px 10px 4px;background:#2E75B6;color:#fff;font-weight:700;font-size:10px">'+mat.categoria+'</td></tr>';prevCat=mat.categoria;}if(mat.precioLista===0&&mat.precioMaximo===0)return;html+='<tr style="background:'+(i%2===0?'#F8F9FA':'#fff')+';border-bottom:1px solid #eee"><td style="padding:6px 10px;color:#333">'+mat.material+'</td><td style="padding:6px 10px;text-align:right;font-family:monospace;font-weight:600;color:#1A7A3C">'+(mat.precioLista>0?'$'+mat.precioLista.toLocaleString('es-CL'):'—')+'</td></tr>';});html+='</table>';document.getElementById('modal-title').textContent='Tabla de Precios · '+suc;document.getElementById('modal-sub').textContent='Precios Lista CLP/kg · v${tag} · ${fecha}';document.getElementById('modal-body').innerHTML=html+'<button style="width:100%;margin-top:12px;padding:10px;background:#999;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700" onclick="closeModal()">Cerrar</button>';document.getElementById('modal').className='modal-overlay show';}
buildCats();render();
<\/script>

</body>
</html>`;
}


// ═══════════════════════════════════════════════════════════
// DIAGNÓSTICO DE DATOS
// ═══════════════════════════════════════════════════════════
let _diagTab = 'resumen';

function abrirDiagnostico(){
  document.getElementById('diag-modal').style.display='flex';
  _diagTab='resumen';
  document.querySelectorAll('.diag-tab').forEach(t=>t.classList.remove('active'));
  document.querySelector('#diag-tabs .diag-tab').classList.add('active');
  renderDiagnostico();
}
function cerrarDiagnostico(){
  document.getElementById('diag-modal').style.display='none';
}
function diagTab(tab, btn){
  _diagTab=tab;
  document.querySelectorAll('#diag-tabs .diag-tab').forEach(t=>t.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderDiagnostico();
}

function renderDiagnostico(){
  const body = document.getElementById('diag-body');
  if(_diagTab==='resumen') renderDiagResumen(body);
  else if(_diagTab==='aliases') renderDiagAliases(body);
  else if(_diagTab==='precios') renderDiagPrecios(body);
  else if(_diagTab==='ocultos') renderDiagOcultos(body);
  else if(_diagTab==='problemas') renderDiagProblemas(body);
}

function renderDiagResumen(body){
  const totalMats = MATS_LOCAL.length;
  const totalAliases = Object.values(ALIASES).reduce((s,a)=>s+a.length,0);
  const totalClientes = FUENTES.length;
  const matsConPrecio = MATS_LOCAL.filter(m=>Object.values(CLIENTES_PRECIOS).some(p=>p[m.id]>0)).length;
  const matsSinPrecio = totalMats - matsConPrecio;
  const matsConAlias = Object.keys(ALIASES).length;
  const matsSinAlias = totalMats - matsConAlias;
  
  // Detectar problemas
  const problemas = detectarProblemas();
  
  body.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:16px;">
      <div class="diag-stat"><div class="diag-stat-val">${totalMats}</div><div class="diag-stat-label">Materiales</div></div>
      <div class="diag-stat"><div class="diag-stat-val">${matsConPrecio}</div><div class="diag-stat-label">Con precio</div></div>
      <div class="diag-stat"><div class="diag-stat-val" style="color:var(--amber);">${matsSinPrecio}</div><div class="diag-stat-label">Sin precio</div></div>
      <div class="diag-stat"><div class="diag-stat-val">${totalAliases}</div><div class="diag-stat-label">Aliases</div></div>
      <div class="diag-stat"><div class="diag-stat-val">${totalClientes}</div><div class="diag-stat-label">Clientes</div></div>
      <div class="diag-stat"><div class="diag-stat-val" style="color:${problemas.length?'var(--red)':'var(--green)'};">${problemas.length}</div><div class="diag-stat-label">Problemas</div></div>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:8px;">Clientes cargados</div>
    <table class="diag-tbl"><thead><tr><th>Cliente</th><th>Precios</th><th>Aliases</th><th>Sucursales</th></tr></thead><tbody>
    ${FUENTES.sort().map(f=>{
      const nPrecios = Object.keys(CLIENTES_PRECIOS[f]||{}).length;
      const nAliases = Object.values(ALIASES).filter(als=>als.some(a=>a.fuente===f)).length;
      const sucs = SUCS.filter(s=>(Array.isArray(SUCURSAL_FUENTE[s])?SUCURSAL_FUENTE[s]:[]).includes(f));
      return `<tr>
        <td style="font-weight:700;">${f}</td>
        <td>${nPrecios>0?`<span style="color:var(--green);font-weight:600;">${nPrecios}</span>`:'<span style="color:var(--red);">0</span>'}</td>
        <td>${nAliases||'—'}</td>
        <td>${sucs.length?sucs.join(', '):'<span style="color:var(--text4);">ninguna</span>'}</td>
      </tr>`;
    }).join('')}
    </tbody></table>
    ${problemas.length?`<div style="margin-top:16px;padding:10px;background:var(--red-bg);border:1px solid var(--red-border);border-radius:var(--r2);">
      <div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:6px;">⚠ ${problemas.length} problema${problemas.length>1?'s':''} detectado${problemas.length>1?'s':''}</div>
      <div style="font-size:11px;color:var(--text2);">Ve a la pestaña "⚠ Problemas" para ver el detalle y corregirlos.</div>
    </div>`:'<div style="margin-top:16px;padding:10px;background:var(--green-bg);border:1px solid var(--green-border);border-radius:var(--r2);font-size:12px;color:var(--green);font-weight:600;">✓ Sin problemas detectados</div>'}`;
}

function renderDiagAliases(body){
  const allAliases = [];
  Object.entries(ALIASES).forEach(([matId, als])=>{
    const m = MATS_LOCAL.find(x=>x.id===parseInt(matId));
    als.forEach(a=>{
      allAliases.push({
        matId: parseInt(matId),
        matNombre: m?.nombre||'??? (ID '+matId+')',
        matCat: m?.cat||'—',
        fuente: a.fuente,
        alias: a.alias,
        tienePrecio: !!(CLIENTES_PRECIOS[a.fuente]?.[parseInt(matId)]),
        precio: CLIENTES_PRECIOS[a.fuente]?.[parseInt(matId)]||0,
        matExiste: !!m
      });
    });
  });
  
  // Sort by current column
  const sortCol = _diagAliasSort || 'fuente';
  const sortDir = _diagAliasSortDir || 'asc';
  const mul = sortDir==='asc'?1:-1;
  allAliases.sort((a,b)=>{
    if(sortCol==='fuente') return mul*a.fuente.localeCompare(b.fuente);
    if(sortCol==='alias') return mul*a.alias.localeCompare(b.alias,'es');
    if(sortCol==='material') return mul*a.matNombre.localeCompare(b.matNombre,'es');
    if(sortCol==='categoria') return mul*a.matCat.localeCompare(b.matCat,'es');
    if(sortCol==='precio') return mul*(a.precio-b.precio);
    return 0;
  });
  
  // Detect conflicts
  const aliasGroups = {};
  allAliases.forEach(a=>{
    const key = a.fuente+'|'+a.alias.toLowerCase();
    if(!aliasGroups[key]) aliasGroups[key]=[];
    aliasGroups[key].push(a);
  });
  const conflictos = new Set();
  Object.entries(aliasGroups).forEach(([key, group])=>{
    if([...new Set(group.map(a=>a.matId))].length>1) conflictos.add(key);
  });
  
  const nConflictos = conflictos.size;
  const filterVal = document.getElementById('diag-alias-filter')?.value||'';
  const filtered = allAliases.filter(a=>!filterVal || a.fuente===filterVal);
  
  // Sortable header helper
  function thSort(col, label){
    const isActive = sortCol===col;
    const arrow = isActive ? (sortDir==='asc'?'▲':'▼') : '⇅';
    const style = isActive ? 'color:var(--amber);' : '';
    return `<th style="cursor:pointer;user-select:none;${style}" onclick="diagAliasSortBy('${col}')">${label} <span style="font-size:8px;opacity:.6;">${arrow}</span></th>`;
  }
  
  // Build rows
  let tableRows = '';
  filtered.forEach(a=>{
    const key = a.fuente+'|'+a.alias.toLowerCase();
    const isConflict = conflictos.has(key);
    const rowBg = isConflict ? 'background:#FFF0E0;border-left:4px solid #F59E0B;' 
      : !a.matExiste ? 'background:var(--red-bg);border-left:4px solid var(--red);' 
      : '';
    
    tableRows += `<tr style="${rowBg}">
      <td><span class="badge bb" style="font-size:9px;">${a.fuente}</span></td>
      <td style="font-weight:600;">${a.alias}${isConflict?'<span style="margin-left:6px;font-size:9px;font-weight:700;color:#F59E0B;background:#FFF0E0;border:1px solid #F59E0B;padding:1px 5px;border-radius:3px;">⚠ CONFLICTO</span>':''}</td>
      <td>→</td>
      <td style="font-weight:600;${!a.matExiste?'color:var(--red);':''}">${a.matNombre} <span style="font-size:9px;color:var(--text4);">ID ${a.matId}</span></td>
      <td style="font-size:10px;color:var(--text3);">${a.matCat}</td>
      <td>${a.precio>0?`<span style="color:var(--green);font-family:'Roboto Mono',monospace;font-size:11px;">$${a.precio.toLocaleString('es-CL')}</span>`:'<span style="color:var(--text4);">—</span>'}</td>
      <td><button class="diag-del" onclick="diagEliminarAlias(${a.matId},'${a.fuente.replace(/'/g,"\'")}','${a.alias.replace(/'/g,"\'")}')">✕</button></td>
    </tr>`;
  });
  
  body.innerHTML = `
    <div style="margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:12px;font-weight:700;">${allAliases.length} aliases registrados</span>
      ${nConflictos>0?`<span style="font-size:11px;font-weight:700;color:#F59E0B;background:#FFF0E0;border:1px solid #F59E0B;padding:2px 8px;border-radius:var(--r);">⚠ ${nConflictos} conflicto${nConflictos>1?'s':''}</span>`
        :'<span style="font-size:11px;color:var(--green);font-weight:600;">✓ Sin conflictos</span>'}
      <select id="diag-alias-filter" onchange="renderDiagnostico()" class="ctrl" style="font-size:11px;padding:3px 8px;">
        <option value="">Todos los clientes</option>
        ${FUENTES.sort().map(f=>`<option value="${f}"${f===filterVal?' selected':''}>${f}</option>`).join('')}
      </select>
    </div>
    ${nConflictos>0?`<div style="padding:8px 12px;background:#FFF0E0;border:1px solid #F59E0B;border-radius:var(--r2);margin-bottom:10px;font-size:11px;color:#92400E;">
      <strong>Conflicto</strong> = el mismo alias está asignado a dos materiales distintos del mismo cliente. Elimina el incorrecto con ✕.
    </div>`:''}
    <table class="diag-tbl"><thead><tr>
      ${thSort('fuente','Cliente')}
      ${thSort('alias','Nombre en lista del cliente')}
      <th></th>
      ${thSort('material','Nuestro material (catálogo)')}
      ${thSort('categoria','Categoría')}
      ${thSort('precio','Precio')}
      <th></th>
    </tr></thead><tbody>
    ${tableRows}
    </tbody></table>`;
}

let _diagAliasSort = 'fuente';
let _diagAliasSortDir = 'asc';
function diagAliasSortBy(col){
  if(_diagAliasSort===col){
    _diagAliasSortDir = _diagAliasSortDir==='asc'?'desc':'asc';
  } else {
    _diagAliasSort = col;
    _diagAliasSortDir = 'asc';
  }
  renderDiagnostico();
}

function renderDiagPrecios(body){
  const rows = [];
  Object.entries(CLIENTES_PRECIOS).forEach(([cliente, precios])=>{
    Object.entries(precios).forEach(([matId, precio])=>{
      const m = MATS_LOCAL.find(x=>x.id===parseInt(matId));
      const tieneAlias = (ALIASES[parseInt(matId)]||[]).some(a=>a.fuente===cliente);
      rows.push({
        cliente, matId: parseInt(matId),
        matNombre: m?.nombre||'??? (ID '+matId+')',
        matCat: m?.cat||'—',
        precio, tieneAlias,
        matExiste: !!m
      });
    });
  });
  
  // Sort
  const col = _diagPreciosSort || 'cliente';
  const dir = _diagPreciosSortDir || 'asc';
  const mul = dir==='asc'?1:-1;
  rows.sort((a,b)=>{
    if(col==='cliente') return mul*a.cliente.localeCompare(b.cliente);
    if(col==='material') return mul*a.matNombre.localeCompare(b.matNombre,'es');
    if(col==='categoria') return mul*a.matCat.localeCompare(b.matCat,'es');
    if(col==='precio') return mul*(a.precio-b.precio);
    if(col==='alias') return mul*((a.tieneAlias?0:1)-(b.tieneAlias?0:1));
    return 0;
  });
  
  const filterVal = document.getElementById('diag-precio-filter')?.value||'';
  const filtered = rows.filter(r=>!filterVal || r.cliente===filterVal);
  
  function thSort(colName, label){
    const isActive = col===colName;
    const arrow = isActive ? (dir==='asc'?'▲':'▼') : '⇅';
    const style = isActive ? 'color:var(--amber);' : '';
    return `<th style="cursor:pointer;user-select:none;${style}" onclick="diagPreciosSortBy('${colName}')">${label} <span style="font-size:8px;opacity:.6;">${arrow}</span></th>`;
  }
  
  body.innerHTML = `
    <div style="margin-bottom:10px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:12px;font-weight:700;">${rows.length} precios registrados</span>
      <select id="diag-precio-filter" onchange="renderDiagnostico()" class="ctrl" style="font-size:11px;padding:3px 8px;">
        <option value="">Todos los clientes</option>
        ${FUENTES.sort().map(f=>`<option value="${f}"${f===filterVal?' selected':''}>${f}</option>`).join('')}
      </select>
    </div>
    <table class="diag-tbl"><thead><tr>
      ${thSort('cliente','Cliente')}
      ${thSort('material','Material')}
      ${thSort('categoria','Categoría')}
      ${thSort('precio','Precio')}
      ${thSort('alias','Alias')}
      <th></th>
    </tr></thead><tbody>
    ${filtered.map(r=>`<tr style="${!r.matExiste?'background:var(--red-bg);':''}">
      <td><span class="badge bb" style="font-size:9px;">${r.cliente}</span></td>
      <td style="font-weight:600;${!r.matExiste?'color:var(--red);':''}">${r.matNombre}</td>
      <td style="font-size:10px;color:var(--text3);">${r.matCat}</td>
      <td style="font-family:'Roboto Mono',monospace;font-weight:700;color:var(--green);">$${r.precio.toLocaleString('es-CL')}</td>
      <td>${r.tieneAlias?'<span style="color:var(--green);font-size:10px;">✓</span>':'<span style="color:var(--text4);font-size:10px;">—</span>'}</td>
      <td><button class="diag-del" onclick="diagEliminarPrecio('${r.cliente.replace(/'/g,"\\'")}',${r.matId})">✕</button></td>
    </tr>`).join('')}
    </tbody></table>`;
}

let _diagPreciosSort = 'cliente';
let _diagPreciosSortDir = 'asc';
function diagPreciosSortBy(col){
  if(_diagPreciosSort===col){
    _diagPreciosSortDir = _diagPreciosSortDir==='asc'?'desc':'asc';
  } else {
    _diagPreciosSort = col;
    _diagPreciosSortDir = 'asc';
  }
  renderDiagnostico();
}

function renderDiagOcultos(body){
  const ocultos = MATS_LOCAL.filter(m=>!Object.values(CLIENTES_PRECIOS).some(p=>p[m.id]>0));
  const porCat = {};
  ocultos.forEach(m=>{
    if(!porCat[m.cat]) porCat[m.cat]=[];
    porCat[m.cat].push(m);
  });
  
  body.innerHTML = `
    <div style="margin-bottom:10px;font-size:12px;font-weight:700;">${ocultos.length} materiales sin precio de ningún cliente</div>
    <div style="font-size:11px;color:var(--text3);margin-bottom:12px;">Estos materiales no aparecen en la tabla principal porque ningún cliente cargado tiene precio. Aparecen si activas 👁 Todos.</div>
    ${Object.entries(porCat).map(([cat, mats])=>`
      <div style="margin-bottom:12px;">
        <div style="font-family:'Roboto Mono',monospace;font-size:9px;font-weight:700;color:var(--amber);
          letter-spacing:1px;text-transform:uppercase;padding:4px 0;border-bottom:1px solid var(--border);">${cat} (${mats.length})</div>
        ${mats.map(m=>{
          const als = ALIASES[m.id]||[];
          const aliasInfo = als.length ? als.map(a=>a.fuente+': '+a.alias).join(', ') : '';
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;
            border-bottom:1px solid var(--bg4);font-size:12px;">
            <div>
              <span style="font-weight:600;">${m.nombre}</span>
              <span style="font-size:9px;color:var(--text4);margin-left:4px;">ID ${m.id}</span>
              ${als.length?`<span style="font-size:9px;color:var(--amber);margin-left:6px;">tiene ${als.length} alias: ${aliasInfo}</span>`:''}
            </div>
            <div style="font-family:'Roboto Mono',monospace;font-size:10px;color:var(--text3);">
              Base Excel: ${m.compra>0?'$'+m.compra.toLocaleString('es-CL'):'—'}
            </div>
          </div>`;
        }).join('')}
      </div>
    `).join('')}`;
}

function detectarProblemas(){
  const problemas = [];
  
  // 1. Aliases apuntando a materiales que no existen
  Object.entries(ALIASES).forEach(([matId, als])=>{
    const m = MATS_LOCAL.find(x=>x.id===parseInt(matId));
    if(!m){
      als.forEach(a=>{
        problemas.push({tipo:'alias_fantasma',desc:`Alias "${a.alias}" (${a.fuente}) apunta a material ID ${matId} que no existe`,
          matId:parseInt(matId),fuente:a.fuente,alias:a.alias});
      });
    }
  });
  
  // 2. Precios para materiales que no existen
  Object.entries(CLIENTES_PRECIOS).forEach(([cliente, precios])=>{
    Object.entries(precios).forEach(([matId, precio])=>{
      const m = MATS_LOCAL.find(x=>x.id===parseInt(matId));
      if(!m){
        problemas.push({tipo:'precio_fantasma',desc:`${cliente} tiene precio $${precio} para material ID ${matId} que no existe`,
          cliente,matId:parseInt(matId)});
      }
    });
  });
  
  // 3. Aliases duplicados: mismo alias+cliente apuntando a materiales distintos
  const aliasMap = {};
  Object.entries(ALIASES).forEach(([matId, als])=>{
    als.forEach(a=>{
      const key = `${a.fuente}|${a.alias.toLowerCase()}`;
      if(aliasMap[key] && aliasMap[key]!==parseInt(matId)){
        const m1 = MATS_LOCAL.find(x=>x.id===aliasMap[key]);
        const m2 = MATS_LOCAL.find(x=>x.id===parseInt(matId));
        problemas.push({tipo:'alias_duplicado',
          desc:`"${a.alias}" de ${a.fuente} apunta a DOS materiales: ${m1?.nombre||'ID '+aliasMap[key]} y ${m2?.nombre||'ID '+matId}`,
          matId1:aliasMap[key], matId2:parseInt(matId), fuente:a.fuente, alias:a.alias});
      }
      aliasMap[key] = parseInt(matId);
    });
  });
  
  // 4. Clientes sin precios (cargados como fuente pero sin datos)
  FUENTES.forEach(f=>{
    const n = Object.keys(CLIENTES_PRECIOS[f]||{}).length;
    if(n===0){
      problemas.push({tipo:'cliente_vacio',desc:`Cliente "${f}" no tiene ningún precio cargado`,fuente:f});
    }
  });
  
  // 5. Materiales con precio base del Excel pero sin ningún cliente que los compre
  MATS_LOCAL.forEach(m=>{
    if(m.compra>0 && !Object.values(CLIENTES_PRECIOS).some(p=>p[m.id]>0)){
      problemas.push({tipo:'precio_excel',
        desc: m.nombre+' tiene precio base $'+m.compra.toLocaleString('es-CL')+' del Excel pero ningún cliente lo compra',
        matId:m.id});
    }
  });

  // 6. Clientes con nombre "—" o vacío
  if(CLIENTES_PRECIOS['—'] || CLIENTES_PRECIOS['']){
    const n = Object.keys(CLIENTES_PRECIOS['—']||{}).length + Object.keys(CLIENTES_PRECIOS['']||{}).length;
    problemas.push({tipo:'cliente_sin_nombre',desc:`Hay ${n} precios asignados a cliente sin nombre ("—" o vacío)`});
  }
  
  return problemas;
}

function renderDiagProblemas(body){
  const problemas = detectarProblemas();
  
  if(!problemas.length){
    body.innerHTML = '<div style="text-align:center;padding:40px;"><div style="font-size:36px;margin-bottom:10px;">✅</div><div style="font-size:14px;font-weight:700;color:var(--green);">Sin problemas detectados</div><div style="font-size:11px;color:var(--text3);margin-top:4px;">Los datos están limpios.</div></div>';
    return;
  }
  
  // Agrupar por tipo
  const grupos = {};
  problemas.forEach(p=>{
    if(!grupos[p.tipo]) grupos[p.tipo]=[];
    grupos[p.tipo].push(p);
  });
  
  const tipoConfig = {
    alias_fantasma:   {icon:'🏷',label:'Aliases fantasma',color:'#E74C3C',desc:'Aliases que apuntan a materiales que ya no existen'},
    precio_fantasma:  {icon:'💰',label:'Precios fantasma',color:'#E74C3C',desc:'Precios asignados a IDs de material que no existen'},
    alias_duplicado:  {icon:'⚠',label:'Aliases duplicados',color:'#F39C12',desc:'Mismo alias de un cliente apuntando a 2 materiales distintos'},
    precio_excel:     {icon:'📋',label:'Precios base sin cliente',color:'#95A5A6',desc:'Materiales con precio del Excel original pero sin cliente comprador activo'},
    cliente_vacio:    {icon:'📭',label:'Clientes vacíos',color:'#F39C12',desc:'Clientes registrados sin ningún precio cargado'},
    cliente_sin_nombre:{icon:'❓',label:'Cliente sin nombre',color:'#E74C3C',desc:'Precios asignados a cliente "—" o vacío'},
  };
  
  const criticos = (grupos.alias_fantasma||[]).length + (grupos.precio_fantasma||[]).length + (grupos.cliente_sin_nombre||[]).length;
  const avisos = (grupos.alias_duplicado||[]).length + (grupos.cliente_vacio||[]).length;
  const info = (grupos.precio_excel||[]).length;
  
  let html = `<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
    ${criticos?`<div style="background:#FDECEC;border:1px solid #F5C6CB;border-radius:8px;padding:8px 14px;font-size:12px;">
      <span style="font-weight:700;color:#C0392B;">${criticos}</span> <span style="color:#C0392B;">crítico${criticos>1?'s':''}</span></div>`:''}
    ${avisos?`<div style="background:#FFF3CD;border:1px solid #FFEEBA;border-radius:8px;padding:8px 14px;font-size:12px;">
      <span style="font-weight:700;color:#856404;">${avisos}</span> <span style="color:#856404;">aviso${avisos>1?'s':''}</span></div>`:''}
    ${info?`<div style="background:#F0F0F0;border:1px solid #DDD;border-radius:8px;padding:8px 14px;font-size:12px;">
      <span style="font-weight:700;color:#666;">${info}</span> <span style="color:#666;">informativo${info>1?'s':''}</span></div>`:''}
    <button class="btn err" style="font-size:11px;margin-left:auto;" onclick="diagLimpiarTodo()">🧹 Limpiar todo (${problemas.length})</button>
  </div>`;
  
  Object.entries(grupos).forEach(([tipo, items])=>{
    const cfg = tipoConfig[tipo]||{icon:'?',label:tipo,color:'#666',desc:''};
    const esCritico = ['alias_fantasma','precio_fantasma','cliente_sin_nombre'].includes(tipo);
    const borderColor = esCritico ? '#F5C6CB' : tipo==='precio_excel' ? '#DDD' : '#FFEEBA';
    const bgColor = esCritico ? '#FDECEC' : tipo==='precio_excel' ? '#FAFAFA' : '#FFF8E1';
    
    html += `<div style="border:1px solid ${borderColor};border-radius:8px;margin-bottom:10px;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:${bgColor};cursor:pointer;"
        onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
        <div>
          <span style="font-size:14px;">${cfg.icon}</span>
          <span style="font-size:13px;font-weight:700;color:${cfg.color};margin-left:6px;">${items.length} ${cfg.label}</span>
          <span style="font-size:10px;color:#999;margin-left:8px;">${cfg.desc}</span>
        </div>
        <span style="font-size:10px;color:#999;">▼ ver detalle</span>
      </div>
      <div style="display:none;padding:8px 14px;max-height:200px;overflow-y:auto;background:#fff;">`;
    
    if(tipo==='precio_excel'){
      // Solo lista nombres, un botón para limpiar todos
      html += `<div style="font-size:11px;color:#666;margin-bottom:6px;">
        ${items.map(p=>{
          const m=MATS_LOCAL.find(x=>x.id===p.matId);
          return m?m.nombre:'ID '+p.matId;
        }).join(' · ')}
      </div>
      <button class="btn" style="font-size:10px;background:#95A5A6;border-color:#95A5A6;color:#fff;" 
        onclick="if(confirm('¿Limpiar precio base de ${items.length} materiales?')){${items.map(p=>`diagLimpiarPrecioExcel(${p.matId})`).join(';')};renderDiagnostico();}">
        Limpiar ${items.length} precios base</button>`;
    } else {
      items.forEach(p=>{
        let action = '';
        if(tipo==='alias_fantasma') action=`<button class="diag-del" onclick="diagEliminarAlias(${p.matId},'${(p.fuente||'').replace(/'/g,"\\'")}','${(p.alias||'').replace(/'/g,"\\'")}');renderDiagnostico();">×</button>`;
        else if(tipo==='precio_fantasma') action=`<button class="diag-del" onclick="diagEliminarPrecio('${(p.cliente||'').replace(/'/g,"\\'")}',${p.matId});renderDiagnostico();">×</button>`;
        else if(tipo==='cliente_vacio') action=`<button class="diag-del" onclick="eliminarCliente('${(p.fuente||'').replace(/'/g,"\\'")}');renderDiagnostico();">×</button>`;
        else if(tipo==='cliente_sin_nombre') action=`<button class="diag-del" onclick="diagLimpiarSinNombre();renderDiagnostico();">Limpiar</button>`;
        html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f0f0f0;font-size:11px;">
          <span>${p.desc}</span>${action}</div>`;
      });
    }
    html += `</div></div>`;
  });
  
  body.innerHTML = html;
}

async function diagEliminarAlias(matId, fuente, alias){
  if(!confirm('¿Eliminar alias "'+alias+'" de '+fuente+'?')) return;
  const als = ALIASES[matId]||[];
  const idx = als.findIndex(a=>a.fuente===fuente && a.alias===alias);
  if(idx>=0) als.splice(idx,1);
  if(!als.length) delete ALIASES[matId];
  if(_db) await idbDeleteAlias(matId, fuente, alias);
  updateAliasCnt();
  renderDiagnostico();
  toast('✓ Alias eliminado');
}

async function diagEliminarPrecio(cliente, matId){
  if(!confirm('¿Eliminar precio de '+cliente+' para material ID '+matId+'?')) return;
  if(CLIENTES_PRECIOS[cliente]) delete CLIENTES_PRECIOS[cliente][matId];
  if(_db) await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  renderDiagnostico();
  toast('✓ Precio eliminado');
}

async function diagLimpiarSinNombre(){
  if(!confirm('¿Eliminar todos los precios asignados a cliente "—" o vacío?')) return;
  delete CLIENTES_PRECIOS['—'];
  delete CLIENTES_PRECIOS[''];
  // También limpiar aliases
  Object.keys(ALIASES).forEach(matId=>{
    ALIASES[matId] = (ALIASES[matId]||[]).filter(a=>a.fuente && a.fuente!=='—');
    if(!ALIASES[matId].length) delete ALIASES[matId];
  });
  // Limpiar de FUENTES
  FUENTES.splice(FUENTES.indexOf('—'),1);
  FUENTES.splice(FUENTES.indexOf(''),1);
  if(_db){
    await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
    await dbClear('aliases');
    for(const[id,als] of Object.entries(ALIASES))
      for(const a of als) await idbSaveAlias(parseInt(id),a.fuente,a.alias);
  }
  safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  updateAliasCnt();
  renderDiagnostico();
  toast('✓ Datos sin nombre limpiados');
}


async function diagLimpiarPrecioExcel(matId){
  const m = mats.find(x=>x.id===matId);
  const mLocal = MATS_LOCAL.find(x=>x.id===matId);
  if(m) m.compra = 0;
  if(mLocal) mLocal.compra = 0;
  if(_db) await idbSaveMats(mats);
  safeLS('rf_mats_pub', JSON.stringify(mats));
  renderAlias();
  renderPrecios();
  renderPreview();
  toast('✓ Precio base limpiado para '+(m?.nombre||'ID '+matId));
}

async function diagLimpiarTodo(){
  const problemas = detectarProblemas();
  if(!problemas.length){toast('Sin problemas');return;}
  if(!confirm('¿Limpiar los '+problemas.length+' problemas detectados?\n\nEsto eliminará aliases fantasma, precios fantasma y clientes vacíos.')) return;
  
  let cleaned = 0;
  for(const p of problemas){
    if(p.tipo==='alias_fantasma'){
      const als = ALIASES[p.matId]||[];
      const idx = als.findIndex(a=>a.fuente===p.fuente && a.alias===p.alias);
      if(idx>=0){ als.splice(idx,1); cleaned++; }
      if(!als.length) delete ALIASES[p.matId];
    }
    else if(p.tipo==='precio_fantasma'){
      if(CLIENTES_PRECIOS[p.cliente]) delete CLIENTES_PRECIOS[p.cliente][p.matId];
      cleaned++;
    }
    else if(p.tipo==='precio_excel'){
      const m2 = mats.find(x=>x.id===p.matId);
      const mL2 = MATS_LOCAL.find(x=>x.id===p.matId);
      if(m2) m2.compra = 0;
      if(mL2) mL2.compra = 0;
      cleaned++;
    }
    else if(p.tipo==='cliente_sin_nombre'){
      delete CLIENTES_PRECIOS['—'];
      delete CLIENTES_PRECIOS[''];
      cleaned++;
    }
  }
  
  // Persist
  if(_db){
    await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
    await dbClear('aliases');
    for(const[id,als] of Object.entries(ALIASES))
      for(const a of als) await idbSaveAlias(parseInt(id),a.fuente,a.alias);
  }
  safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  
  updateAliasCnt();
  rebuildFuenteSelects();
  renderAlias();
  renderFuentes();
  renderPreview();
  renderDiagnostico();
  toast('✓ '+cleaned+' problemas limpiados','ok');
}


// ═══════════════════════════════════════════════════════════
// VERIFICAR PRECIOS — Panel vs Asistente (Supabase snapshot)
// ═══════════════════════════════════════════════════════════
async function verificarPrecios(){
  if(!_supabase){
    toast('⚠ Supabase no disponible — verifica conexión','err');
    return;
  }
  const btn = document.getElementById('btn-verificar');
  if(btn){ btn.disabled=true; btn.textContent='⏳ Verificando...'; }
  try {
    // Obtener AMBAS fuentes de datos (como hace el asistente)
    const [snapRes, vistaRes] = await Promise.all([
      _supabase.from('asistente_snapshot').select('datos,version_label,actualizado_en').eq('id',1).maybeSingle(),
      _supabase.from('v_precios_activos').select('*')
    ]);

    const snap = snapRes.data;
    const vista = vistaRes.data;

    // Determinar qué fuente usa el asistente (misma lógica que asistente.html)
    let asistData = null, fuente = '', fuenteLabel = '', fuenteFecha = '';

    if(snap && snap.datos && Object.keys(snap.datos).length > 0){
      asistData = snap.datos;
      fuente = 'snapshot';
      fuenteLabel = snap.version_label || '?';
      fuenteFecha = snap.actualizado_en ? new Date(snap.actualizado_en).toLocaleString('es-CL') : '?';
    } else if(vista && vista.length > 0){
      // Reconstruir estructura por sucursal (como hace el asistente)
      asistData = {};
      vista.forEach(row => {
        if(!asistData[row.sucursal]) asistData[row.sucursal] = [];
        asistData[row.sucursal].push({
          id: row.material_id, material: row.material, categoria: row.categoria,
          precioLista: parseFloat(row.precio_lista)||0,
          precioEjecutivo: parseFloat(row.precio_ejecutivo)||0,
          precioMaximo: parseFloat(row.precio_maximo)||0
        });
      });
      fuente = 'v_precios_activos';
      fuenteLabel = 'BD directa';
      fuenteFecha = vista[0]?.version_fecha ? new Date(vista[0].version_fecha).toLocaleString('es-CL') : '?';
    }

    if(!asistData){
      toast('⚠ Sin datos en Supabase — publica una versión primero','warn');
      return;
    }

    // Calcular precios actuales del panel usando calc()
    const SUCS_LIST = ['Cerrillos','Maipú','Talca','Puerto Montt'];
    const panelData = {};
    SUCS_LIST.forEach(suc=>{
      const f = SUC_FACTOR[suc]||1;
      panelData[suc] = mats.map(m=>{
        const c = calc(m, f, suc);
        return { id:m.id, nombre:m.nombre, categoria:m.cat,
          precioLista:c.lista, precioEjecutivo:c.ejec, precioMaximo:c.max };
      });
    });

    // Comparar panel vs lo que ve el asistente
    const diffs = [];
    SUCS_LIST.forEach(suc=>{
      const panelMats = panelData[suc] || [];
      const asistMats = asistData[suc] || [];
      const asistById = {};
      asistMats.forEach(m=>{ asistById[m.id] = m; });
      panelMats.forEach(pm=>{
        const am = asistById[pm.id];
        if(!am) return;
        const aLista = am.precioLista||0, aEjec = am.precioEjecutivo||0, aMax = am.precioMaximo||0;
        if(pm.precioLista===0 && aLista===0) return;
        if(pm.precioLista!==aLista || pm.precioEjecutivo!==aEjec || pm.precioMaximo!==aMax){
          diffs.push({ suc, id:pm.id, nombre:pm.nombre, categoria:pm.categoria,
            panel:{ lista:pm.precioLista, ejec:pm.precioEjecutivo, max:pm.precioMaximo },
            snap: { lista:aLista, ejec:aEjec, max:aMax }
          });
        }
      });
    });
    _mostrarResultadoVerificacion(diffs, fuenteLabel, fuenteFecha, fuente);
  } catch(err){
    console.error('verificarPrecios:', err);
    toast('⚠ Error al verificar: '+err.message,'err');
  } finally {
    if(btn){ btn.disabled=false; btn.textContent='🔍 Verificar vs Asistente'; }
  }
}

function _mostrarResultadoVerificacion(diffs, snapLabel, snapFecha, fuente){
  const existing = document.getElementById('modal-verificar');
  if(existing) existing.remove();
  const nDiff = diffs.length;
  const ok = nDiff === 0;

  // Agrupar por sucursal
  const bySuc = {};
  diffs.forEach(d=>{ if(!bySuc[d.suc]) bySuc[d.suc]=[]; bySuc[d.suc].push(d); });

  const bannerBg     = ok ? '#E8F5ED' : '#FDF5E4';
  const bannerBorder = ok ? '#B8DFC7' : '#F0D890';
  const bannerColor  = ok ? '#1A7A3C' : '#92650A';
  const bannerMsg    = ok
    ? 'Panel y Asistente están sincronizados'
    : `${nDiff} precio${nDiff>1?'s difieren':' difiere'} entre Panel y Asistente`;

  let body = `<div style="background:${bannerBg};border:1.5px solid ${bannerBorder};border-radius:8px;padding:12px 16px;margin-bottom:16px;">
    <div style="font-size:14px;font-weight:700;color:${bannerColor};">${ok?'✓':'⚠'} ${bannerMsg}</div>
    <div style="font-size:11px;color:#777;margin-top:4px;">Fuente: ${fuente==='snapshot'?'asistente_snapshot':'v_precios_activos (BD directa)'} · v${snapLabel} · ${snapFecha}</div>
  </div>`;

  if(ok){
    body += '<div style="text-align:center;padding:24px 20px;color:var(--text3);font-size:13px;">Los precios del panel coinciden exactamente con los que ve el Asistente.</div>';
  } else {
    Object.keys(bySuc).forEach(suc=>{
      const rows = bySuc[suc];
      body += `<div style="margin-bottom:16px;">
        <div style="font-family:'Roboto Mono',monospace;font-size:9px;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${suc} · ${rows.length} diferencia${rows.length>1?'s':''}</div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead><tr style="background:var(--bg3);">
            <th style="text-align:left;padding:5px 8px;font-weight:600;color:var(--text3);font-size:9px;">MATERIAL</th>
            <th style="text-align:right;padding:5px 6px;font-weight:600;color:var(--amber);font-size:9px;">PANEL Lista</th>
            <th style="text-align:right;padding:5px 6px;font-weight:600;color:var(--red);font-size:9px;">ASIST Lista</th>
            <th style="text-align:right;padding:5px 6px;font-weight:600;color:var(--amber);font-size:9px;">PANEL Ejec</th>
            <th style="text-align:right;padding:5px 6px;font-weight:600;color:var(--red);font-size:9px;">ASIST Ejec</th>
          </tr></thead><tbody>`;
      rows.forEach((d,i)=>{
        const rowBg = i%2===0?'#fff':'var(--bg3)';
        const lD = d.panel.lista!==d.snap.lista;
        const eD = d.panel.ejec!==d.snap.ejec;
        const fmtV = v => v>0?'$'+v.toLocaleString('es-CL'):'—';
        body += `<tr style="background:${rowBg};">
          <td style="padding:5px 8px;font-size:11px;">${d.nombre}<div style="font-size:9px;color:var(--text4);">${d.categoria}</div></td>
          <td style="padding:5px 6px;text-align:right;font-family:'Roboto Mono',monospace;color:var(--amber);font-weight:700;">${fmtV(d.panel.lista)}</td>
          <td style="padding:5px 6px;text-align:right;font-family:'Roboto Mono',monospace;color:${lD?'var(--red)':'var(--text3)'};${lD?'text-decoration:line-through;':''}">${fmtV(d.snap.lista)}</td>
          <td style="padding:5px 6px;text-align:right;font-family:'Roboto Mono',monospace;font-size:10px;color:var(--amber);font-weight:${eD?700:400};">${fmtV(d.panel.ejec)}</td>
          <td style="padding:5px 6px;text-align:right;font-family:'Roboto Mono',monospace;font-size:10px;color:${eD?'var(--red)':'var(--text3)'};${eD?'text-decoration:line-through;':''}">${fmtV(d.snap.ejec)}</td>
        </tr>`;
      });
      body += '</tbody></table></div>';
    });
    body += `<div style="background:var(--blue-bg);border:1px solid var(--blue-border);border-radius:6px;padding:10px 14px;font-size:11px;color:var(--blue);margin-top:4px;">
      💡 Para sincronizar: Tab C → acepta cambios → Publicar versión → el Asistente se actualiza automáticamente.
    </div>`;
  }

  const modal = document.createElement('div');
  modal.id = 'modal-verificar';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = `
    <div style="background:var(--bg2);border-radius:12px;width:100%;max-width:820px;max-height:82vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="padding:16px 20px;border-bottom:1.5px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div>
          <div style="font-size:14px;font-weight:700;">Verificación de Precios · Panel vs Asistente</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">Compara precios del panel con el snapshot publicado en Supabase</div>
        </div>
        <button onclick="document.getElementById('modal-verificar').remove()" style="background:var(--bg3);border:1px solid var(--border);color:var(--text2);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:13px;">✕</button>
      </div>
      <div style="padding:20px;overflow-y:auto;flex:1;">${body}</div>
      <div style="padding:12px 20px;border-top:1.5px solid var(--border);display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;">
        ${!ok?`<button class="btn p" onclick="document.getElementById('modal-verificar').remove();publicarVersion()">↑ Publicar ahora</button>`:''}
        <button class="btn" onclick="document.getElementById('modal-verificar').remove()">Cerrar</button>
      </div>
    </div>`;
  modal.addEventListener('click', e=>{ if(e.target===modal) modal.remove(); });
  document.body.appendChild(modal);
}

// INIT
// ═══════════════════════════════════════════════════════════
// Advertir si hay cambios sin publicar al cerrar/recargar
window.addEventListener('beforeunload', e => {
  if(Object.keys(cambios).length > 0){
    e.preventDefault();
    e.returnValue = '⚠ Tienes cambios sin publicar. ¿Seguro que quieres salir?';
  }
});

// ═══════════════════════════════════════════════════════════
// ROLES — Panel Admin
// ═══════════════════════════════════════════════════════════
function applyPanelRoles(){
  let rolPanel = 'admin';
  try {
    const sess = JSON.parse(localStorage.getItem('rf_session') || '{}');
    rolPanel = sess.rol || 'admin';
    // Mostrar nombre en nav
    const brand = document.querySelector('.nav-brand');
    if(brand && sess.nombre){
      const badge = document.createElement('div');
      badge.style.cssText = 'font-size:9px;color:rgba(255,255,255,.4);margin-top:1px;font-family:\'Roboto Mono\',monospace;';
      badge.textContent = sess.nombre + ' · ' + rolPanel;
      brand.appendChild(badge);
    }
  } catch(e){}

  if(rolPanel === 'editor'){
    // Editor: no puede cambiar config global (spread/IVA por sucursal)
    // Deshabilitar inputs de configuración
    document.querySelectorAll('[id^="cfg-spread-"],[id^="cfg-iva-"]').forEach(el=>{
      el.disabled = true;
      el.title = 'Solo el administrador puede cambiar esta configuración';
      el.style.opacity = '0.5';
      el.style.cursor = 'not-allowed';
    });
    // Agregar aviso visual en Tab C
    setTimeout(()=>{
      const tabC = document.getElementById('tab-precios');
      if(tabC){
        const aviso = document.createElement('div');
        aviso.style.cssText = 'background:#FDF5E4;border:1px solid #F0D890;border-radius:6px;padding:8px 12px;font-size:11px;color:#92650A;font-weight:600;margin:8px 16px 0;';
        aviso.textContent = '⚙ Configuración de spread/IVA — solo lectura (rol: editor)';
        tabC.insertAdjacentElement('afterbegin', aviso);
      }
    }, 500);
  }
}

window.addEventListener('load',async()=>{
  // Inicializar Supabase client
  if(window.supabase && SUPABASE_URL && SUPABASE_KEY){
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase cliente inicializado ✓');
  }
  applyPanelRoles();
  initSelects();
  // Cargar desde IndexedDB primero
  const dbOk = await loadFromDB();
  if(!dbOk){
    // Fallback: cargar aliases demo solo si no hay nada en DB
    initAliasesDemo();
  }
  rebuildFuenteSelects();
  renderAlias();
  renderPreview();
  renderPublico();
  renderHistorial();

  // Check API remota (opcional, no bloquea)
  const ping=await apiGet('ping');
  if(ping?.ok){
    toast('✓ API conectada — '+ping.materiales+' materiales en BD','ok');
    const als=await apiGet('aliases');
    if(als?.ok&&als.data.length){
      ALIASES={};
      als.data.forEach(a=>{
        if(!ALIASES[a.material_id])ALIASES[a.material_id]=[];
        ALIASES[a.material_id].push({fuente:a.fuente,alias:a.alias});
      });
      // Sync aliases to IndexedDB
      await dbClear('aliases');
      for(const [id,arr] of Object.entries(ALIASES))
        for(const a of arr) await idbSaveAlias(parseInt(id),a.fuente,a.alias);
      updateAliasCnt();
      renderAlias();
      // Reconstruir precios desde aliases recién cargados
      reconstruirClientesPrecios();
      renderFuentes();
    }
  } else {
    setApiStatus(false);
  }
});
