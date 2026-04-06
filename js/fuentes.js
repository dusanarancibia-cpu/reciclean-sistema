
// ═══════════════════════════════════════════════════════════
// B · ALIAS
// ═══════════════════════════════════════════════════════════
function initAliasesDemo(){
  // No cargar datos demo — todo viene del backup/IndexedDB
  ALIASES={};
  updateAliasCnt();
}

// ── SISTEMA DE PUBLICACIÓN DE ALIASES ─────────────────────
let _aliasesPendientes = 0; // contador de aliases guardados sin publicar

function marcarAliasPendiente(delta=1){
  _aliasesPendientes += delta;
  const badge = document.getElementById('alias-pending-badge');
  const btn   = document.getElementById('btn-pub-alias');
  if(badge){
    badge.textContent = _aliasesPendientes+' alias pendiente'+(  _aliasesPendientes!==1?'s':'');
    badge.style.display = _aliasesPendientes>0?'inline-flex':'none';
  }
  if(btn) btn.style.display = _aliasesPendientes>0?'inline-flex':'none';
}

async function publicarAliases(){
  const n = _aliasesPendientes;
  // Guardar snapshot en historial
  const totalAls = Object.values(ALIASES).reduce((s,a)=>s+a.length,0);
  const label = new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'});
  if(_db){
    await idbSaveHistorial({
      fecha: new Date().toISOString().split('T')[0],
      label, autor:'Admin', tipo:'clientes',
      desc: `${n} alias nuevo${n!==1?'s':''} publicado${n!==1?'s':''} — total ${totalAls}`,
      items: []
    });
  }
  _aliasesPendientes = 0;
  marcarAliasPendiente(0);
  renderHistorial();
  toast(`✓ ${n} alias publicado${n!==1?'s':''} · Total: ${totalAls}`,'ok');
}

function updateAliasCnt(){
  const n = Object.values(ALIASES).reduce((s,a)=>s+a.length,0);
  document.getElementById('cnt-alias-nav').textContent=n;
  document.getElementById('alias-cnt-badge').textContent=n+' alias';
}

async function addFuente(){
  const n=prompt('Nombre del cliente comprador:');
  if(!n?.trim()) return;
  if(FUENTES.includes(n.trim())){toast('Ya existe','warn');return;}
  FUENTES.push(n.trim());
  if(_db) await idbSaveFuente(n.trim());
  rebuildFuenteSelects();
  renderFuentes();
  toast('✓ '+n.trim()+' agregado');
}


function toggleFuentesPanel(){
  const panel = document.getElementById('fuentes-panel');
  const arrow = document.getElementById('fuentes-arrow');
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
}

function updateFuentesResumen(){
  const el = document.getElementById('fuentes-resumen');
  if(!el) return;
  const asignados = SUCS.map(s=>{
    const f = Array.isArray(SUCURSAL_FUENTE[s]) ? SUCURSAL_FUENTE[s] : [];
    return f.length>0 ? `${s.replace('Puerto Montt','PM')}: ${f.length}` : null;
  }).filter(Boolean);
  el.textContent = asignados.length ? asignados.join(' · ') : 'Sin asignaciones';
}

function renderFuentes(){
  // ── 1. Grid sucursal → fuente ──────────────────────────────
  const sucGrid = document.getElementById('suc-fuente-grid');
  if(sucGrid){
    sucGrid.innerHTML = SUCS.map(suc=>{
      const asignados = Array.isArray(SUCURSAL_FUENTE[suc]) ? SUCURSAL_FUENTE[suc] : (SUCURSAL_FUENTE[suc]?[SUCURSAL_FUENTE[suc]]:[]);
      const totalMats = [...new Set(asignados.flatMap(f=>Object.keys(CLIENTES_PRECIOS[f]||{})))].length;
      const conPrecios = FUENTES.filter(f=>CLIENTES_PRECIOS[f]&&Object.keys(CLIENTES_PRECIOS[f]).length>0);
      const sinPrecios = FUENTES.filter(f=>!CLIENTES_PRECIOS[f]||Object.keys(CLIENTES_PRECIOS[f]).length===0);
      return `<div style="background:var(--bg2);border:1.5px solid ${asignados.length?'var(--green-border)':'var(--border)'};
        border-radius:var(--r2);padding:10px 12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:11px;font-weight:700;color:var(--text);">${suc}</span>
          ${asignados.length?`<span class="badge bg" style="font-size:9px;">${totalMats} mat.</span>`:''}
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto;margin-bottom:6px;">
          ${[...conPrecios,...sinPrecios].map(f=>{
            const checked = asignados.includes(f);
            const n = Object.keys(CLIENTES_PRECIOS[f]||{}).length;
            return `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;
              color:${n>0?'var(--text)':'var(--text3)'};">
              <input type="checkbox" value="${f}" ${checked?'checked':''}
                onchange="toggleFuenteSucursal('${suc}','${f}',this.checked)"
                style="cursor:pointer;accent-color:var(--green);">
              ${f} ${n>0?`<span style="font-size:9px;color:var(--text3);">(${n})</span>`:'<span style="font-size:9px;color:var(--text4);">(sin precios)</span>'}
            </label>`;
          }).join('')}
        </div>
        ${asignados.length?`<div style="font-size:9px;color:var(--text3);">✓ ${asignados.join(', ')}</div>`:'<div style="font-size:9px;color:var(--text4);">Sin clientes asignados</div>'}
      </div>`;
    }).join('');
  }

  // ── 2. Chips de clientes con detalle ──────────────────────
  const wrap = document.getElementById('fuentes-wrap');
  if(!wrap) return;
  const fuenteFiltro = document.getElementById('al-fuente-f')?.value||'';

  updateFuentesResumen();
  wrap.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;">` +
  FUENTES.map(f=>{
    const mats_con_alias = Object.entries(ALIASES).filter(([id,als])=>als.some(a=>a.fuente===f)).length;
    const mats_con_precio = Object.keys(CLIENTES_PRECIOS[f]||{}).length;
    const suc_asignadas = SUCS.filter(s=>Array.isArray(SUCURSAL_FUENTE[s])?SUCURSAL_FUENTE[s].includes(f):SUCURSAL_FUENTE[s]===f);
    const activo = f===fuenteFiltro;
    const tienePrecio = mats_con_precio>0;

    return `<div style="
      background:${activo?'var(--ink)':'var(--bg3)'};
      border:1.5px solid ${activo?'var(--ink)':tienePrecio?'var(--green-border)':'var(--border)'};
      border-radius:var(--r2);padding:8px 12px;cursor:pointer;
      transition:all .15s;min-width:110px;position:relative;">
      <div onclick="filtrarPorCliente('${f}')" style="font-size:12px;font-weight:700;color:${activo?'#fff':'var(--text)'};">${f}</div>
      <div onclick="filtrarPorCliente('${f}')" style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">
        ${tienePrecio?`<span class="badge bg" style="font-size:9px;">${mats_con_precio} precios</span>`:'<span class="badge bn" style="font-size:9px;">sin precios</span>'}
        ${mats_con_alias>0?`<span class="badge bb" style="font-size:9px;">${mats_con_alias} alias</span>`:''}
        ${suc_asignadas.length>0?`<span class="badge ba" style="font-size:9px;">${suc_asignadas.join(', ')}</span>`:''}
      </div>
      <button onclick="event.stopPropagation();eliminarCliente('${f}')"
        style="position:absolute;top:3px;right:4px;background:none;border:none;
        cursor:pointer;font-size:11px;color:${activo?'rgba(255,255,255,.4)':'var(--text4)'};
        padding:0 2px;line-height:1;" title="Eliminar cliente ${f}">✕</button>
    </div>`;
  }).join('') + `</div>`;
}

async function eliminarCliente(f){
  if(!confirm(`¿Eliminar el cliente "${f}"?\n\nSe eliminarán sus precios, aliases y asignaciones de sucursal.`)) return;

  // Encontrar TODAS las variantes del nombre (case-insensitive)
  const fLower = f.toLowerCase();
  const variantes = FUENTES.filter(x=>x.toLowerCase()===fLower);

  variantes.forEach(v=>{
    // 1. Quitar de FUENTES
    const idx=FUENTES.indexOf(v);
    if(idx>=0) FUENTES.splice(idx,1);
    // 2. Quitar de CLIENTES_PRECIOS
    delete CLIENTES_PRECIOS[v];
    // 4. Quitar de asignaciones de sucursal
    SUCS.forEach(s=>{
      if(Array.isArray(SUCURSAL_FUENTE[s])){
        SUCURSAL_FUENTE[s]=SUCURSAL_FUENTE[s].filter(x=>x.toLowerCase()!==fLower);
      } else if((SUCURSAL_FUENTE[s]||'').toLowerCase()===fLower){
        SUCURSAL_FUENTE[s]=[];
      }
    });
  });

  // 5. Persistir todo
  if(_db){
    await dbClear('fuentes');
    for(const fn of FUENTES) await idbSaveFuente(fn);
    await idbSaveConfig('clientes_precios',JSON.stringify(CLIENTES_PRECIOS));
    await idbSaveConfig('sucursal_fuente',JSON.stringify(SUCURSAL_FUENTE));
  }
  try{
    safeLS('rf_clientes_precios',JSON.stringify(CLIENTES_PRECIOS));
    safeLS('rf_sucursal_fuente',JSON.stringify(SUCURSAL_FUENTE));
  }catch(e){}

  rebuildFuenteSelects();
  renderFuentes();
  renderAlias();
  renderPreview();
  updateAliasCnt();
  toast(`✓ Cliente "${f}" eliminado (${variantes.length} variante${variantes.length>1?'s':''} encontrada${variantes.length>1?'s':''})`, 'ok');
}

function filtrarPorCliente(f){
  const sel = document.getElementById('al-fuente-f');
  if(sel){
    sel.value = sel.value===f?'':f;
    renderAlias();
    renderFuentes();
  }
}

async function toggleFuenteSucursal(suc, fuente, checked){
  if(!Array.isArray(SUCURSAL_FUENTE[suc])) SUCURSAL_FUENTE[suc]=[];
  if(checked){
    if(!SUCURSAL_FUENTE[suc].includes(fuente)) SUCURSAL_FUENTE[suc].push(fuente);
  } else {
    SUCURSAL_FUENTE[suc] = SUCURSAL_FUENTE[suc].filter(f=>f!==fuente);
  }
  if(_db) await idbSaveConfig('sucursal_fuente', JSON.stringify(SUCURSAL_FUENTE));
  safeLS('rf_sucursal_fuente', JSON.stringify(SUCURSAL_FUENTE));
  // Actualizar precio compra base con mejor precio disponible
  mats.forEach(m=>{
    const mejor = getPrecioCompra(m, suc);
    if(mejor > 0 && mejor !== m.compra){
      m.compra = mejor;
      if(!cambios[m.id]) cambios[m.id]={};
      cambios[m.id].compra = mejor;
    }
  });
  const asignados = SUCURSAL_FUENTE[suc];
  const totalMats = [...new Set(asignados.flatMap(f=>Object.keys(CLIENTES_PRECIOS[f]||{})))].length;
  toast(`✓ ${suc}: ${asignados.length} cliente${asignados.length!==1?'s':''} · ${totalMats} materiales`,'ok');
  renderFuentes();
  renderPreview();
  renderPrecios();
}

async function asignarFuenteSucursal(suc, fuente){
  // Compatibilidad con código legacy (selector simple)
  await toggleFuenteSucursal(suc, fuente, !!fuente);
}
