


// Build set of matIds that appear as aliases in OTHER materials' alias lists
// (not needed here — aliases are always matId-keyed, so xref means: is this matId
//  the TARGET of an alias from another context? We track how many fuentes map to it)
function getXrefInfo(matId){
  const als = ALIASES[matId]||[];
  if(!als.length) return null;
  const fuentes = [...new Set(als.map(a=>a.fuente))];
  return fuentes; // array of fuentes that reference this mat
}

// ── SELECCIÓN DE PRECIO POR MATERIAL × SUCURSAL ────────────
async function seleccionarPrecio(matId, suc, cliente, precio){
  if(!PRECIO_SELECCIONADO[matId]) PRECIO_SELECCIONADO[matId]={};
  if(PRECIO_SELECCIONADO[matId][suc]?.cliente===cliente){
    // Toggle: si ya estaba seleccionado, deseleccionar
    delete PRECIO_SELECCIONADO[matId][suc];
  } else {
    PRECIO_SELECCIONADO[matId][suc]={cliente, precio, ts:new Date().toISOString()};
    // Marcar como cambio pendiente si difiere del precio publicado
    const m = mats.find(x=>x.id===matId);
    const orig = MATS_LOCAL.find(x=>x.id===matId);
    if(m){
      const precioActual = getPrecioCompra(m, suc);
      if(precio !== (orig?.compra||0)){
        if(!cambios[matId]) cambios[matId]={};
        cambios[matId]['seleccion_'+suc] = precio;
      }
    }
  }
  // Persistir
  if(_db) await idbSaveConfig('precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
  safeLS('rf_precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
  renderAlias();
  renderPrecios();
  renderPreview();
  updateEnviarBar();
}

// Chips de precios de clientes para un material
// Muestra TODOS los precios visibles directamente — clic para seleccionar
function buildSucPrecioCell(matId, suc){
  const fuentes = Array.isArray(SUCURSAL_FUENTE[suc]) ? SUCURSAL_FUENTE[suc] : [];
  const seleccion = PRECIO_SELECCIONADO[matId]?.[suc];

  // Solo clientes ASIGNADOS a esta sucursal que tienen precio para este material
  const opciones = Object.entries(CLIENTES_PRECIOS)
    .filter(([f,p])=>p[matId]>0 && fuentes.includes(f))
    .map(([f,p])=>({cliente:f, precio:p[matId], esFuente:true}))
    .sort((a,b)=>{
      if(a.esFuente && !b.esFuente) return -1;
      if(!a.esFuente && b.esFuente) return 1;
      return b.precio - a.precio;
    });

  if(!opciones.length) return `<td style="text-align:center;padding:4px 6px;border-left:1px solid var(--border);">
    <span style="font-size:9px;color:var(--text4);">—</span></td>`;

  // Renderizar TODOS los precios visibles directamente
  const rows = opciones.map(({cliente,precio,esFuente})=>{
    const isSel = seleccion?.cliente===cliente;
    const cEsc = cliente.replace(/'/g,"\\'");
    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:4px;
      padding:2px 6px;border-radius:4px;cursor:pointer;
      background:${isSel?'var(--green)':esFuente?'rgba(34,197,94,.06)':'transparent'};
      border:1px solid ${isSel?'var(--green)':esFuente?'rgba(34,197,94,.25)':'transparent'};
      margin-bottom:1px;transition:all .1s;"
      title="Clic=seleccionar · Doble clic=editar precio">
      <span onclick="seleccionarPrecio(${matId},'${suc}','${cEsc}',${precio})"
        style="font-size:9px;font-weight:${isSel||esFuente?'700':'500'};
        color:${isSel?'#fff':esFuente?'var(--green)':'var(--text3)'};
        max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${cliente}</span>
      <span ondblclick="event.stopPropagation();editarPrecioInline(${matId},'${cEsc}','${suc}',this)"
        onclick="seleccionarPrecio(${matId},'${suc}','${cEsc}',${precio})"
        style="font-family:'Roboto Mono',monospace;font-size:10px;font-weight:700;
        color:${isSel?'#fff':'var(--text)'};white-space:nowrap;cursor:pointer;"
        title="Doble clic para editar">$${precio.toLocaleString('es-CL')}</span>
    </div>`;
  }).join('');

  return `<td style="padding:3px 5px;border-left:1px solid var(--border);vertical-align:top;min-width:100px;">
    <div style="display:flex;flex-direction:column;gap:0;">
      ${rows}
      ${seleccion?`<div onclick="event.stopPropagation();deseleccionarPrecio(${matId},'${suc}')"
        style="text-align:center;font-size:8px;color:var(--red);cursor:pointer;
        margin-top:1px;opacity:.5;" title="Quitar selección">✕</div>`:''}
    </div>
  </td>`;
}

function togglePrecioDropdown(btn){
  // Cerrar todos los dropdowns abiertos
  document.querySelectorAll('.precio-dropdown').forEach(d=>{
    if(d!==btn.nextElementSibling) d.style.display='none';
  });
  const dd = btn.nextElementSibling;
  if(dd) dd.style.display = dd.style.display==='none'?'block':'none';
}

// Cerrar dropdowns al hacer clic fuera
document.addEventListener('click', ()=>{
  document.querySelectorAll('.precio-dropdown').forEach(d=>d.style.display='none');
});

async function deseleccionarPrecio(matId, suc){
  if(PRECIO_SELECCIONADO[matId]) delete PRECIO_SELECCIONADO[matId][suc];
  if(_db) await idbSaveConfig('precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
  safeLS('rf_precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
  renderAlias();
  renderPrecios();
  renderPreview();
}

// ── EDICIÓN INLINE DE PRECIOS DE CLIENTES ─────────────────
function editarPrecioInline(matId, cliente, suc, el){
  const precioActual = CLIENTES_PRECIOS[cliente]?.[matId] || 0;
  const inp = document.createElement('input');
  inp.type='number'; inp.value=precioActual; inp.min='0'; inp.step='1';
  inp.style.cssText='font-family:"Roboto Mono",monospace;font-size:10px;width:65px;padding:1px 4px;border:1.5px solid var(--amber);border-radius:3px;background:var(--amber-bg);color:var(--amber);text-align:right;outline:none;';
  const guardar = async ()=>{
    const v = parseInt(inp.value);
    if(isNaN(v) || v<0){ renderAlias(); return; }
    if(!CLIENTES_PRECIOS[cliente]) CLIENTES_PRECIOS[cliente]={};
    CLIENTES_PRECIOS[cliente][matId] = v;
    // Actualizar selección si existía
    if(PRECIO_SELECCIONADO[matId]?.[suc]?.cliente===cliente){
      PRECIO_SELECCIONADO[matId][suc].precio = v;
    }
    // Persistir
    if(_db) await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
    safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
    if(_db) await idbSaveConfig('precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
    safeLS('rf_precio_seleccionado', JSON.stringify(PRECIO_SELECCIONADO));
    renderAlias();
    renderPreview();
    renderPrecios();
    toast('✓ Precio de '+cliente+' actualizado a $'+v.toLocaleString('es-CL'),'ok');
  };
  inp.onblur = guardar;
  inp.onkeydown = e=>{ if(e.key==='Enter') guardar(); if(e.key==='Escape') renderAlias(); };
  el.replaceWith(inp);
  inp.focus();
  inp.select();
}

// ── EDICIÓN INLINE DE ALIAS ──────────────────────────────
function editarAliasInline(matId, aliasIdx, el){
  const als = ALIASES[matId];
  if(!als || !als[aliasIdx]) return;
  const aliasObj = als[aliasIdx];
  const inp = document.createElement('input');
  inp.type='text'; inp.value=aliasObj.alias;
  inp.style.cssText='font-size:11px;width:120px;padding:1px 6px;border:1.5px solid var(--amber);border-radius:3px;background:var(--amber-bg);color:var(--text);outline:none;font-family:"Syne",sans-serif;';
  const guardar = async ()=>{
    const nuevoNombre = inp.value.trim();
    if(!nuevoNombre){ renderAlias(); return; }
    const viejoAlias = aliasObj.alias;
    aliasObj.alias = nuevoNombre;
    // Persistir
    if(_db){
      await idbDeleteAlias(matId, aliasObj.fuente, viejoAlias);
      await idbSaveAlias(matId, aliasObj.fuente, nuevoNombre);
    }
    renderAlias();
    renderPreview();
    toast('✓ Alias actualizado: "'+nuevoNombre+'"','ok');
  };
  inp.onblur = guardar;
  inp.onkeydown = e=>{ if(e.key==='Enter') guardar(); if(e.key==='Escape') renderAlias(); };
  el.replaceWith(inp);
  inp.focus();
  inp.select();
}

function buildPriceChips(matId, suc){ return buildSucPrecioCell(matId,suc); } // legacy compat

// ── renderAlias: filtro → agrupación por cat → filas material → precios por suc → conteo ──
function renderAlias(){
  const catF    = document.getElementById('al-cat').value;
  const q       = document.getElementById('al-q').value.toLowerCase();
  const fF      = document.getElementById('al-fuente-f').value;

  // Actualizar encabezado de precio según filtro
  const thHeader = document.getElementById('th-precios-cliente');
  if(thHeader){
    if(fF){
      const suc = SUCS.find(s=>SUCURSAL_FUENTE[s]===fF);
      thHeader.innerHTML = `P.Compra <span style="font-size:9px;color:var(--green);display:block;">${fF}</span>`;
    } else {
      const asignados = SUCS.filter(s=>SUCURSAL_FUENTE[s]).map(s=>`${s}: ${SUCURSAL_FUENTE[s]}`);
      thHeader.innerHTML = asignados.length
        ? `P.Compra por suc.`
        : `P.Compra`;
    }
  }

  // Verificar si algún cliente ASIGNADO a alguna sucursal tiene precio
  function tieneAlgunPrecioCliente(matId){
    // Recopilar todos los clientes asignados a alguna sucursal
    const asignados = new Set();
    SUCS.forEach(s=>{
      const f = Array.isArray(SUCURSAL_FUENTE[s]) ? SUCURSAL_FUENTE[s] : [];
      f.forEach(c=>asignados.add(c));
    });
    // Si no hay ningún cliente asignado a ninguna sucursal, no mostrar nada
    if(asignados.size===0) return false;
    // Solo mostrar si un cliente asignado tiene precio
    for(const cli of asignados){
      if(CLIENTES_PRECIOS[cli]?.[matId]>0) return true;
    }
    return false;
  }
  
  const list = MATS_LOCAL.filter(m=>{
    if(catF && m.cat!==catF) return false;
    if(q && !m.nombre.toLowerCase().includes(q)) return false;
    if(fF){if(!(CLIENTES_PRECIOS[fF]?.[m.id]>0))return false;}
    // Ocultar materiales que ningún cliente compra (sin precio en CLIENTES_PRECIOS)
    if(!_verTodosMats && !tieneAlgunPrecioCliente(m.id)) return false;
    return true;
  });

  let html_rows = '';
  const catsPresentes = CAT_ORDER.filter(cat=>list.some(m=>m.cat===cat));

  if(!catsPresentes.length){
    document.getElementById('alias-tbody').innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:24px;">Sin resultados</td></tr>';
    updateAliasCnt(); renderFuentes(); return;
  }

  catsPresentes.forEach(cat=>{
    const catMats = list.filter(m=>m.cat===cat);
    const catConAlias = catMats.filter(m=>(ALIASES[m.id]||[]).length>0).length;
    html_rows += `<tr style="background:#1A1A14;">
      <td colspan="5" style="padding:5px 12px;font-family:'Roboto Mono',monospace;
        font-size:9px;font-weight:700;color:#F0D060;letter-spacing:1.5px;text-transform:uppercase;">
        ${cat}
        <span style="color:rgba(255,255,255,.4);font-weight:400;letter-spacing:0;
          text-transform:none;margin-left:8px;">
          ${catConAlias} de ${catMats.length} con alias
        </span>
      </td>
    </tr>`;

    catMats.forEach(m=>{
      const als    = ALIASES[m.id]||[];
      const hasAls = als.length>0;
      const fuentes = [...new Set(als.map(a=>a.fuente))];
      const xrefBadge = fuentes.length>1
        ? `<span class="xref" title="Alias de: ${fuentes.join(', ')}">× ${fuentes.length}</span>` : '';
      const alsBadge = hasAls
        ? `<span class="badge bg" style="font-size:9px;">${als.length}</span>` : '';
      const rowBg = hasAls ? 'background:var(--green-bg);' : '';

      const chips = als.map((a,ai)=>`<span class="chip">
        <span class="badge bb" style="font-size:8px;padding:1px 4px;">${a.fuente}</span>
        &nbsp;<span ondblclick="event.stopPropagation();editarAliasInline(${m.id},${ai},this)"
          style="cursor:pointer;" title="Doble clic para editar">${a.alias}</span>
        <span class="chip-rm" onclick="rmAlias(${m.id},${ai})" title="Eliminar">✕</span>
      </span>`).join('');

      // Columnas de precios: una por sucursal activa
      const sucursalesActivas = SUCS.filter(s=>{
        const f = SUCURSAL_FUENTE[s];
        return Array.isArray(f) ? f.length>0 : !!f;
      });
      // Actualizar thead con columnas de sucursal (primera vez)
      if(!window._aliasThdBuilt || window._aliasThdSucs!==sucursalesActivas.join()){
        window._aliasThdBuilt=true; window._aliasThdSucs=sucursalesActivas.join();
        const thead=document.getElementById('alias-thead');
        if(thead){
          const sucThs=sucursalesActivas.length
            ? sucursalesActivas.map(s=>`<th style="text-align:center;min-width:90px;
                border-left:1px solid var(--border);padding:5px 6px;font-size:9px;
                color:var(--text3);font-weight:700;">${s.replace('Puerto Montt','Pto.Mtt')}</th>`).join('')
            : '<th style="text-align:right;width:140px;">P.Compra</th>';
          thead.innerHTML=`<tr>
            <th style="width:20px;"></th><th style="width:20px;"></th>
            <th style="min-width:160px;">Material oficial</th>
            <th>Alias registrados</th>${sucThs}
            <th style="width:55px;text-align:center;">+</th></tr>`;
        }
      }
      // Celdas de precio por sucursal
      const priceCells = sucursalesActivas.length
        ? sucursalesActivas.map(s=>buildSucPrecioCell(m.id,s)).join('')
        : `<td style="text-align:right;padding:4px 10px;">${
            Object.entries(CLIENTES_PRECIOS).filter(([f,p])=>p[m.id]>0).sort((a,b)=>b[1][m.id]-a[1][m.id])
            .map(([f,p])=>`<span title="${f}" style="font-family:'Roboto Mono',monospace;font-size:11px;color:var(--text2);">$${p[m.id].toLocaleString('es-CL')}</span>`).join(' ')
            || '<span style="font-size:10px;color:var(--text4);">—</span>'
          }</td>`;

      html_rows += `<tr draggable="true"
        ondragstart="aliasDragStart(event,${m.id},'${cat.replace(/'/g,'')}')"
        ondragover="aliasDragOver(event)"
        ondrop="aliasDrop(event,${m.id},'${cat.replace(/'/g,'')}')"
        ondragend="aliasDragEnd(event)"
        style="${rowBg}cursor:grab;border-bottom:2px solid var(--border);" id="alias-row-${m.id}">
        <td style="cursor:grab;color:var(--text4);font-size:12px;padding:0 4px 0 8px;user-select:none;" title="Arrastra para reordenar">⠿</td>
        <td><span class="dot ${hasAls?'dot-ok':'dot-none'}"></span></td>
        <td class="mat">
          <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
            ${m.nombre} ${xrefBadge} ${alsBadge}
          </div>
        </td>
        <td>
          <div class="chips">${chips||'<span style="font-size:11px;color:#E8830A;font-style:italic;font-weight:600;">sin alias</span>'}</div>
          <div class="add-alias-row" id="ar-${m.id}">
            <!-- Modo toggle: Alias vs Nuevo Material -->
            <div style="display:flex;gap:4px;margin-bottom:6px;">
              <button class="btn" id="ar-mode-alias-${m.id}" onclick="setAddRowMode(${m.id},'alias')"
                style="padding:3px 10px;font-size:10px;background:var(--amber);color:#fff;border-color:var(--amber);">🏷 Alias</button>
              <button class="btn" id="ar-mode-new-${m.id}" onclick="setAddRowMode(${m.id},'nuevo')"
                style="padding:3px 10px;font-size:10px;">📦 Nuevo material</button>
            </div>
            <!-- MODO ALIAS (existente) -->
            <div id="ar-alias-form-${m.id}">
              <div style="background:var(--amber-bg);border:1.5px solid var(--amber-border);border-radius:var(--r2);padding:10px 12px;">
                <div style="font-size:10px;font-weight:700;color:var(--amber);margin-bottom:8px;letter-spacing:.5px;">AGREGAR ALIAS → ${m.nombre}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 2fr;gap:6px;align-items:end;">
                  <div>
                    <div style="font-size:8px;color:var(--text3);font-weight:600;margin-bottom:3px;">CLIENTE</div>
                    <select class="ctrl" id="af-${m.id}" style="font-size:11px;padding:4px 6px;width:100%;" onchange="onAliasClientChange(${m.id})">
                      ${[...FUENTES].sort((a,b)=>a.localeCompare(b,'es')).map(f=>`<option>${f}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <div style="font-size:8px;color:var(--text3);font-weight:600;margin-bottom:3px;">CATEGORÍA</div>
                    <select class="ctrl" id="acat-${m.id}" style="font-size:11px;padding:4px 6px;width:100%;">
                      ${CAT_ORDER.map(cat=>`<option value="${cat}" ${cat===m.cat?'selected':''}>${cat.replace('PLÁSTICOS — ','PL.')}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <div style="font-size:8px;color:var(--text3);font-weight:600;margin-bottom:3px;">NOMBRE QUE USA EL CLIENTE</div>
                    <div style="display:flex;gap:4px;">
                      <div class="ac-wrap" style="flex:1;">
                        <input class="ai" id="ai-${m.id}" list="alist-${m.id}"
                          placeholder="Nombre del cliente para este material..."
                          oninput="onAliasInput(${m.id}, this)"
                          onkeydown="onAliasKey(event, ${m.id})"
                          autocomplete="off" style="width:100%;padding:4px 8px;font-size:11px;">
                        <datalist id="alist-${m.id}">
                          ${[...new Set(als.map(a=>a.alias))].sort((a,b)=>a.localeCompare(b,'es')).map(a=>`<option value="${a}">`).join('')}
                        </datalist>
                        <div class="ac-drop" id="acd-${m.id}" style="display:none;"></div>
                      </div>
                      <button class="btn ok" style="padding:4px 10px;font-size:10px;" onclick="saveAliasConCat(${m.id})">✓</button>
                      <button class="btn" style="padding:4px 8px;font-size:10px;" onclick="closeAddRow(${m.id})">✕</button>
                    </div>
                  </div>
                </div>
                <div id="alias-sel-preview-${m.id}" style="display:none;padding:4px 8px;background:var(--bg2);border-radius:var(--r);border:1px solid var(--border);font-size:10px;margin-top:6px;">
                  <span style="color:var(--text3);">→</span>
                  <span style="font-weight:700;color:var(--text);margin:0 4px;" id="asp-name-${m.id}"></span>
                  <span id="asp-badge-${m.id}"></span>
                </div>
              </div>
            </div>
            <!-- MODO NUEVO MATERIAL -->
            <div id="ar-nuevo-form-${m.id}" style="display:none;">
              <div style="background:#FFF8E1;border:1.5px solid #F0D060;border-radius:var(--r2);padding:10px 12px;">
                <div style="font-size:10px;font-weight:700;color:#92650A;margin-bottom:8px;letter-spacing:.5px;">📦 AGREGAR MATERIAL NUEVO AL CATÁLOGO</div>
                <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:6px;align-items:end;">
                  <div>
                    <div style="font-size:8px;color:var(--text3);font-weight:600;margin-bottom:3px;">NOMBRE OFICIAL</div>
                    <input class="ai" id="anew-nombre-${m.id}" placeholder="Nombre del material nuevo..."
                      style="width:100%;padding:4px 8px;font-size:11px;">
                  </div>
                  <div>
                    <div style="font-size:8px;color:var(--text3);font-weight:600;margin-bottom:3px;">CATEGORÍA</div>
                    <select class="ctrl" id="anew-cat-${m.id}" style="font-size:11px;padding:4px 6px;width:100%;" onchange="onNewMatCatChange(${m.id})">
                      ${CAT_ORDER.map(cat=>`<option value="${cat}" ${cat===m.cat?'selected':''}>${cat.replace('PLÁSTICOS — ','PL.')}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <div style="font-size:8px;color:var(--text3);font-weight:600;margin-bottom:3px;">EMPRESA</div>
                    <select class="ctrl" id="anew-emp-${m.id}" style="font-size:11px;padding:4px 6px;width:100%;">
                      <option value="FAREX">FAREX</option>
                      <option value="RECICLEAN" selected>RECICLEAN</option>
                    </select>
                  </div>
                  <div>
                    <div style="font-size:8px;color:var(--text3);font-weight:600;margin-bottom:3px;">¿RETIENE IVA?</div>
                    <select class="ctrl" id="anew-iva-${m.id}" style="font-size:11px;padding:4px 6px;width:100%;">
                      <option value="0">No</option>
                      <option value="1">Sí 19%</option>
                    </select>
                  </div>
                </div>
                <div style="display:flex;gap:4px;margin-top:8px;justify-content:flex-end;">
                  <button class="btn ok" style="padding:4px 12px;font-size:10px;" onclick="crearMaterialNuevo(${m.id})">✓ Agregar al catálogo</button>
                  <button class="btn" style="padding:4px 8px;font-size:10px;" onclick="closeAddRow(${m.id})">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        </td>
        ${priceCells}
        <td style="text-align:center;">
          <button class="btn" style="padding:3px 9px;font-size:11px;"
            onclick="openAddRow(${m.id})">+</button>
        </td>
      </tr>`;
    });
  });

  document.getElementById('alias-tbody').innerHTML = html_rows;
  updateEnviarBar();
  // Mostrar cuántos materiales están ocultos
  if(!_verTodosMats){
    const totalMats = MATS_LOCAL.length;
    const _asignadosSet = new Set();
    SUCS.forEach(s=>{ const f=Array.isArray(SUCURSAL_FUENTE[s])?SUCURSAL_FUENTE[s]:[]; f.forEach(c=>_asignadosSet.add(c)); });
    const ocultos = MATS_LOCAL.filter(m=>{
      if(_asignadosSet.size===0) return !Object.values(CLIENTES_PRECIOS).some(p=>p[m.id]>0);
      for(const cli of _asignadosSet){ if(CLIENTES_PRECIOS[cli]?.[m.id]>0) return false; }
      return true;
    }).length;
    if(ocultos>0){
      document.getElementById('alias-tbody').innerHTML += `<tr>
        <td colspan="20" style="text-align:center;padding:8px;font-size:11px;color:var(--text3);background:var(--bg3);">
          ${ocultos} material${ocultos>1?'es':''} sin precio oculto${ocultos>1?'s':''} ·
          <span onclick="_verTodosMats=true;document.getElementById('btn-ver-todos').classList.add('active');renderAlias();"
            style="color:var(--amber);cursor:pointer;font-weight:600;">mostrar todos</span>
        </td></tr>`;
    }
  }
  updateAliasCnt();
  renderFuentes();
}



function openAddRow(matId){
  // Close any open rows first
  document.querySelectorAll('.add-alias-row.open').forEach(r=>r.classList.remove('open'));
  const row = document.getElementById('ar-'+matId);
  if(row){ row.classList.add('open'); document.getElementById('ai-'+matId).focus(); }
}
function closeAddRow(matId){
  const row = document.getElementById('ar-'+matId);
  if(row) row.classList.remove('open');
  const drop = document.getElementById('acd-'+matId);
  if(drop) drop.style.display='none';
  const inp = document.getElementById('ai-'+matId);
  if(inp) inp.value='';
  const prev = document.getElementById('alias-sel-preview-'+matId);
  if(prev) prev.style.display='none';
  delete _aliasSelTarget[matId];
}

function setAddRowMode(matId, mode){
  const aliasForm = document.getElementById('ar-alias-form-'+matId);
  const nuevoForm = document.getElementById('ar-nuevo-form-'+matId);
  const btnAlias  = document.getElementById('ar-mode-alias-'+matId);
  const btnNuevo  = document.getElementById('ar-mode-new-'+matId);
  if(mode==='alias'){
    if(aliasForm) aliasForm.style.display='block';
    if(nuevoForm) nuevoForm.style.display='none';
    if(btnAlias){ btnAlias.style.background='var(--amber)'; btnAlias.style.color='#fff'; btnAlias.style.borderColor='var(--amber)'; }
    if(btnNuevo){ btnNuevo.style.background=''; btnNuevo.style.color=''; btnNuevo.style.borderColor=''; }
  } else {
    if(aliasForm) aliasForm.style.display='none';
    if(nuevoForm) nuevoForm.style.display='block';
    if(btnAlias){ btnAlias.style.background=''; btnAlias.style.color=''; btnAlias.style.borderColor=''; }
    if(btnNuevo){ btnNuevo.style.background='#92650A'; btnNuevo.style.color='#fff'; btnNuevo.style.borderColor='#92650A'; }
    // Auto-set empresa/IVA based on category
    onNewMatCatChange(matId);
  }
}

function onNewMatCatChange(matId){
  const catSel = document.getElementById('anew-cat-'+matId);
  const empSel = document.getElementById('anew-emp-'+matId);
  const ivaSel = document.getElementById('anew-iva-'+matId);
  if(!catSel||!empSel||!ivaSel) return;
  const cat = catSel.value;
  // Auto: si es fierros/metales → FAREX+IVA, si no → RECICLEAN sin IVA
  const isFarex = /FIERRO|LATA CHATARRA|COBRE|BRONCE|ALUMIN|ACERO/i.test(cat);
  empSel.value = isFarex ? 'FAREX' : 'RECICLEAN';
  ivaSel.value = isFarex ? '1' : '0';
}

async function crearMaterialNuevo(contextMatId){
  const nombre = document.getElementById('anew-nombre-'+contextMatId)?.value.trim();
  const cat    = document.getElementById('anew-cat-'+contextMatId)?.value;
  const emp    = document.getElementById('anew-emp-'+contextMatId)?.value;
  const iva    = document.getElementById('anew-iva-'+contextMatId)?.value === '1';

  if(!nombre){ toast('Escribe el nombre del material','warn'); return; }
  // Verificar que no exista ya
  if(MATS_LOCAL.some(m=>m.nombre.toLowerCase()===nombre.toLowerCase())){
    toast('⚠ Ya existe un material con ese nombre','warn'); return;
  }

  // Calcular siguiente ID disponible
  const maxId = Math.max(...MATS_LOCAL.map(m=>m.id), ...mats.map(m=>m.id));
  const newId = maxId + 1;

  // Margen y flete por categoría
  const MARGEN_MAP = {
    'FIERROS Y LATAS':0.15, 'LATA CHATARRA':0.20,
    'COBRES':0.10, 'BRONCES':0.10, 'ALUMINIOS':0.10, 'ACEROS INOXIDABLES':0.10,
    'CARTÓN Y PAPEL':0.08, 'VIDRIO':0.40,
    'PLÁSTICOS — PET':0.30, 'PLÁSTICOS — FILM Y POLIETILENOS':0.30,
    'PLÁSTICOS — RÍGIDOS':0.60, 'PLÁSTICOS — SOPLADOS':0.60
  };
  const FLETE_MAP = {
    'FIERROS Y LATAS':15, 'LATA CHATARRA':15,
    'COBRES':15, 'BRONCES':15, 'ALUMINIOS':15, 'ACEROS INOXIDABLES':15,
    'CARTÓN Y PAPEL':30, 'VIDRIO':15,
    'PLÁSTICOS — PET':30, 'PLÁSTICOS — FILM Y POLIETILENOS':30,
    'PLÁSTICOS — RÍGIDOS':30, 'PLÁSTICOS — SOPLADOS':30
  };

  const newMat = {
    id: newId, cat: cat, nombre: nombre,
    farex: emp==='FAREX', reciclean: emp==='RECICLEAN',
    compra: 0, lista: 0, ejec: 0, max: 0,
    margen: MARGEN_MAP[cat]||0.15, iva: iva,
    flete: FLETE_MAP[cat]||15, meta: 0
  };

  // Agregar a ambas listas
  MATS_LOCAL.push(newMat);
  mats.push({...newMat});

  // Persistir
  if(_db) await idbSaveMat(newMat);
  safeLS('rf_mats_pub', JSON.stringify(MATS_LOCAL));

  closeAddRow(contextMatId);
  renderAlias();
  renderPrecios();
  renderPreview();
  toast('✓ Material "'+nombre+'" creado (ID: '+newId+', '+cat+')','ok');
}

// Track selected target material per open row
const _aliasSelTarget = {};

function onAliasClientChange(matId){
  // Clear input and target when client changes
  const inp = document.getElementById('ai-'+matId);
  if(inp) inp.value='';
  delete _aliasSelTarget[matId];
  const prev = document.getElementById('alias-sel-preview-'+matId);
  if(prev) prev.style.display='none';
}

function onAliasInput(matId, inp){
  const val = inp.value.trim().toLowerCase();
  const drop = document.getElementById('acd-'+matId);
  if(!drop) return;
  delete _aliasSelTarget[matId];
  document.getElementById('alias-sel-preview-'+matId).style.display='none';
  if(val.length < 1){ drop.style.display='none'; return; }

  // Filter materials by name match
  const matches = MATS_LOCAL.filter(m=>
    m.nombre.toLowerCase().includes(val) ||
    m.cat.toLowerCase().includes(val)
  ).slice(0, 8);

  if(!matches.length){ drop.style.display='none'; return; }

  drop.innerHTML = matches.map(m=>{
    const mAls = ALIASES[m.id]||[];
    const usedBy = [...new Set(mAls.map(a=>a.fuente))];
    const usedHtml = usedBy.length
      ? `<span class="ac-item-used">ya usado × ${usedBy.length}</span>`
      : '';
    return `<div class="ac-item" onclick="selectAliasMat(${matId}, ${m.id})" data-id="${m.id}">
      <span class="ac-item-name">${m.nombre}</span>
      <span class="ac-item-cat">${m.cat.replace('PLÁSTICOS — ','PL. ')}</span>
      ${usedHtml}
    </div>`;
  }).join('');
  drop.style.display='block';
}

function onAliasKey(e, matId){
  const drop = document.getElementById('acd-'+matId);
  if(!drop || drop.style.display==='none') return;
  const items = drop.querySelectorAll('.ac-item');
  const cur = drop.querySelector('.ac-item.sel');
  if(e.key==='ArrowDown'){
    e.preventDefault();
    const next = cur ? (cur.nextElementSibling||items[0]) : items[0];
    if(cur) cur.classList.remove('sel');
    if(next) next.classList.add('sel');
  } else if(e.key==='ArrowUp'){
    e.preventDefault();
    const prev = cur ? (cur.previousElementSibling||items[items.length-1]) : items[items.length-1];
    if(cur) cur.classList.remove('sel');
    if(prev) prev.classList.add('sel');
  } else if(e.key==='Enter'){
    e.preventDefault();
    const sel = drop.querySelector('.ac-item.sel')||items[0];
    if(sel) sel.click();
  } else if(e.key==='Escape'){
    drop.style.display='none';
  }
}

function selectAliasMat(rowMatId, targetMatId){
  const drop = document.getElementById('acd-'+rowMatId);
  if(drop) drop.style.display='none';
  // NOTE: The alias maps FROM the alias text TO rowMatId (the row's material)
  // But the user may want to say "this alias should map to a DIFFERENT material"
  // We store targetMatId as the mapping destination
  _aliasSelTarget[rowMatId] = targetMatId;
  const targetMat = MATS_LOCAL.find(m=>m.id===targetMatId);
  const inp = document.getElementById('ai-'+rowMatId);
  // Don't overwrite input — user typed the alias name themselves
  // Show preview
  const prev = document.getElementById('alias-sel-preview-'+rowMatId);
  const nameEl = document.getElementById('asp-name-'+rowMatId);
  const badgeEl = document.getElementById('asp-badge-'+rowMatId);
  if(prev && targetMat){
    prev.style.display='block';
    nameEl.textContent = targetMat.nombre;
    const mAls = ALIASES[targetMat.id]||[];
    const usedBy = [...new Set(mAls.map(a=>a.fuente))];
    badgeEl.innerHTML = usedBy.length
      ? `<span class="xref">ya con alias de: ${usedBy.join(', ')}</span>`
      : `<span class="badge bg">sin alias previos</span>`;
  }
}

// Guardar alias + reasignar categoría si cambió
async function saveAliasConCat(matId){
  const catSel = document.getElementById('acat-'+matId);
  const newCat = catSel?.value;
  const m = mats.find(x=>x.id===matId);
  const mLocal = MATS_LOCAL.find(x=>x.id===matId);

  // Reasignar categoría si cambió
  if(newCat && m && m.cat !== newCat){
    m.cat = newCat;
    if(mLocal) mLocal.cat = newCat;
    if(!cambios[matId]) cambios[matId]={};
    cambios[matId].cat = newCat;
    idbSaveDraft();
    toast(`✓ Categoría cambiada a ${newCat.replace('PLÁSTICOS — ','PL. ')}`,'ok');
  }
  // Guardar el alias
  await saveAlias(matId);
}

async function saveAlias(matId){
  const fuente = document.getElementById('af-'+matId).value;
  const alias  = document.getElementById('ai-'+matId).value.trim();
  if(!alias){ toast('Escribe el nombre que usa el cliente','warn'); return; }

  // If user selected a different target, use that; otherwise use the row's matId
  const targetId = _aliasSelTarget[matId] || matId;

  if(!ALIASES[targetId]) ALIASES[targetId]=[];
  if(ALIASES[targetId].some(a=>a.fuente===fuente&&a.alias===alias)){
    toast('Ese alias ya existe para ese material','warn'); return;
  }
  ALIASES[targetId].push({fuente, alias});
  const res = await apiPost('aliases',{type:'save',material_id:targetId,fuente,alias});
  // Persist to IndexedDB
  if(_db) await idbSaveAlias(targetId, fuente, alias);
  marcarAliasPendiente(1);
  closeAddRow(matId);
  updateAliasCnt();
  renderAlias();
  renderPreview();
  renderCobertura();
  toast(res?.ok?'✓ Alias guardado en BD':'✓ Alias guardado (local)');
}

async function rmAlias(matId,idx){
  const a = ALIASES[matId][idx];
  ALIASES[matId].splice(idx,1);
  await apiPost('aliases',{type:'delete',material_id:matId,fuente:a.fuente,alias:a.alias});
  if(_db) await idbDeleteAlias(matId, a.fuente, a.alias);
  updateAliasCnt();
  renderAlias();
  renderCobertura();
}

// ── PREVIEW LISTA DE PRECIOS POR SUCURSAL ──────────────────
function renderPreview(){
  const sel  = document.getElementById('prev-suc-sel');
  const suc  = sel ? sel.value : 'todas';
  const body = document.getElementById('prev-body');
  const sub  = document.getElementById('prev-sub');
  const lbl  = document.getElementById('prev-suc-label');

  const SF   = {Cerrillos:1, Maipú:1, Talca:0.88, 'Puerto Montt':0.82};
  const SUCS = ['Cerrillos','Maipú','Talca','Puerto Montt'];
  const sucs = suc==='todas' ? SUCS : [suc];
  const multi = sucs.length > 1;

  if(lbl) lbl.textContent = suc==='todas' ? 'Todas las sucursales' : suc;

  // ── Filtrar materiales: mostrar los que tienen precio de compra en alguna sucursal
  // Incluso si calc() da $0 — el material debe ser visible
  function tieneAlgunPrecio(m){
    return sucs.some(s=>{
      const f = SF[s]||1;
      const r = calc(m, f, s);
      return r.compra > 0; // mostrar si hay precio de compra, aunque lista sea $0
    });
  }

  let totalConPrecio = 0;

  // ── Header ──
  const thMat = `<th style="text-align:left;padding:7px 10px;background:#1A1A14;color:#fff;
    font-family:'Roboto Mono',monospace;font-size:9px;font-weight:600;letter-spacing:1px;
    text-transform:uppercase;position:sticky;top:0;left:0;z-index:4;
    ${multi?'width:34%;':'width:60%;'}border-right:2px solid #333;">Material</th>`;

  const thSucs = sucs.map(s=>{
    const fuentes = Array.isArray(SUCURSAL_FUENTE[s]) ? SUCURSAL_FUENTE[s] : (SUCURSAL_FUENTE[s]?[SUCURSAL_FUENTE[s]]:[]);
    const fLabel = fuentes.length===0 ? '<div style="font-size:8px;color:rgba(255,165,0,.5);">sin fuente</div>'
      : fuentes.length===1 ? `<div style="font-size:8px;color:rgba(255,255,255,.5);font-weight:400;">${fuentes[0]}</div>`
      : `<div style="font-size:8px;color:rgba(255,255,255,.5);font-weight:400;">${fuentes.length} clientes</div>`;
    return `<th style="text-align:right;padding:5px 10px 7px;background:#1A1A14;color:#F0D060;
      font-family:'Roboto Mono',monospace;font-size:10px;font-weight:700;white-space:nowrap;
      position:sticky;top:0;z-index:3;
      ${multi?'width:'+Math.floor(66/sucs.length)+'%;':'width:40%;'}border-left:1px solid #333;">
      ${s.replace('Puerto Montt','Pto.Montt')}
      ${fLabel}
    </th>`;
  }).join('');

  let html = `<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;
    scrollbar-width:thin;scrollbar-color:#C4BFB0 #F0EEE8;">
    <table style="width:100%;border-collapse:collapse;min-width:${multi?'380px':'260px'};">
    <thead><tr>${thMat}${thSucs}</tr></thead><tbody>`;

  CAT_ORDER.forEach(cat=>{
    // Incluir materiales que tengan precio calculado (dinámico, no estático)
    const catMats = mats.filter(m=>m.cat===cat && m.activo!==false && tieneAlgunPrecio(m));
    if(!catMats.length) return;

    html+=`<tr><td colspan="${sucs.length+1}" style="
      padding:6px 10px 4px;font-family:'Roboto Mono',monospace;font-size:9px;
      font-weight:700;color:#92650A;letter-spacing:1.5px;text-transform:uppercase;
      background:#FDF5E4;border-bottom:1px solid #F0D890;border-top:2px solid #E8E5DC;">
      ${cat}
    </td></tr>`;

    catMats.forEach((m,i)=>{
      const rowBg = i%2===0 ? '#FFFFFF' : '#F7F6F2';
      const isChg = !!cambios[m.id];

      const priceCells = sucs.map(s=>{
        const f    = SF[s]||1;
        const cRes = calc(m, f, s);
        const p    = cRes.lista;
        const fuentes = Array.isArray(SUCURSAL_FUENTE[s]) ? SUCURSAL_FUENTE[s] : [];
        const pCompra = cRes.compra;
        const fuenteLabel = fuentes.length ? fuentes.filter(ff=>CLIENTES_PRECIOS[ff]?.[m.id]>0).join(', ') : '';

        // Material con precio de compra pero resultado $0 o negativo → ROJO
        if(cRes.compra > 0 && p <= 0){
          return `<td title="Compra $${cRes.compra}/kg → Neto $${cRes.neto} → P.Lista $0 (sin margen)" style="padding:6px 10px;text-align:right;
            background:${rowBg};border-bottom:1px solid #E8E5DC;border-left:1px solid #E8E5DC;">
            <div style="font-family:'Roboto Mono',monospace;font-size:12px;font-weight:700;color:#C0392B;">⚠ $0</div>
            <div style="font-size:8px;color:#C0392B;">sin margen</div>
          </td>`;
        }

        if(!p) return `<td style="padding:6px 10px;text-align:right;color:#aaa;background:${rowBg};
          border-bottom:1px solid #E8E5DC;border-left:1px solid #E8E5DC;">—</td>`;

        // Color: verde normal, ámbar si tiene cambio pendiente
        const priceColor = isChg ? '#92650A' : '#1A7A3C';
        const tooltip = pCompra>0
          ? `title="Compra: $${pCompra.toLocaleString('es-CL')}/kg${fuenteLabel?' ('+fuenteLabel+')':''}"` : '';

        return `<td ${tooltip} style="padding:6px 10px;font-family:'Roboto Mono',monospace;
          font-size:12px;font-weight:700;color:${priceColor};text-align:right;white-space:nowrap;
          background:${rowBg};border-bottom:1px solid #E8E5DC;border-left:1px solid #E8E5DC;
          cursor:${pCompra>0?'help':'default'};">
          $${p.toLocaleString('es-CL')}
          ${isChg?'<div style="font-size:8px;color:var(--amber);">✏ pendiente</div>':''}
        </td>`;
      }).join('');

      totalConPrecio++;
      html+=`<tr>
        <td style="padding:6px 10px;font-size:12px;font-weight:700;color:#1A1A14;
          background:${rowBg};position:sticky;left:0;z-index:1;
          border-bottom:1px solid #E8E5DC;border-right:2px solid #D6D1C4;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:175px;
          ${isChg?'border-left:3px solid #F0D060;':''}">
          ${m.nombre}
        </td>
        ${priceCells}
      </tr>`;
    });
  });

  html+=`</tbody></table></div>`;
  body.innerHTML = html;
  if(sub) sub.textContent = `${totalConPrecio} materiales con precio · P.Lista CLP/kg`;
}



// ── COBERTURA DE ALIAS POR CLIENTE ──────────────────────────
function renderCobertura(){
  const sel = document.getElementById('cov-fuente-sel');
  const fuente = sel ? sel.value : '';
  const covBody = document.getElementById('cov-body');
  if(!fuente){
    covBody.innerHTML='<div style="font-size:11px;color:var(--text3);">Selecciona un cliente para ver qué % de materiales tiene alias configurados.</div>';
    return;
  }
  const entries=[];
  Object.entries(ALIASES).forEach(([id,als])=>{
    als.filter(a=>a.fuente===fuente).forEach(a=>{
      const m=MATS_LOCAL.find(x=>x.id===parseInt(id));
      entries.push({matId:parseInt(id),matNombre:m?.nombre||'?',lista:m?.lista||0});
    });
  });
  const total = MATS_LOCAL.filter(m=>m.lista>0).length;
  const covered = new Set(entries.map(e=>e.matId)).size;
  const pct = total>0?Math.round(covered/total*100):0;
  const progCls = pct>=70?'pf-green':pct>=40?'pf-amber':'pf-red';
  covBody.innerHTML=`
    <div style="font-size:11px;color:var(--text3);margin-bottom:6px;">${covered} de ${total} materiales con precio · ${fuente}</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <div style="flex:1;background:var(--bg3);border-radius:3px;height:6px;overflow:hidden;">
        <div class="${progCls}" style="height:100%;border-radius:3px;width:${pct}%;transition:width .4s;"></div>
      </div>
      <span style="font-family:'Roboto Mono',monospace;font-size:11px;font-weight:500;">${pct}%</span>
    </div>
    <div style="font-size:10px;color:var(--text3);">${pct<70?'💡 Agrega más alias para mejor mapeo automático':'✓ Cobertura suficiente para mapeo confiable'}</div>`;
}

// ── IMPORT ALIAS MODAL ─────────────────────────────────────
let impType = 'imagen';
let impResultData = [];

function abrirImportModal(){
  const modal = document.getElementById('import-modal');
  modal.classList.add('show');
  modal.style.display = 'flex';
  // Populate datalist
  const dl = document.getElementById('imp-fuente-list');
  dl.innerHTML = FUENTES.map(f=>`<option value="${f}">`).join('');
  const inp = document.getElementById('imp-fuente');
  inp.value = '';
  // Reset state
  setImpType('imagen', document.querySelector('.imp-type-btn'));
  document.getElementById('imp-result').style.display='none';
  document.getElementById('imp-loading').style.display='none';
  document.getElementById('imp-file').value='';
  document.getElementById('imp-texto').value='';
  document.getElementById('imp-drop-title').textContent='Arrastra o clic para seleccionar';
  document.getElementById('imp-drop-sub').textContent='JPG · PNG · PDF · Excel · CSV';
  document.getElementById('imp-drop-icon').textContent='📷';
  impResultData=[];
}

function cerrarImportModal(){
  const m=document.getElementById('import-modal');
  m.classList.remove('show');
  m.style.display='none';
}

function setImpType(tipo, btn){
  impType = tipo;
  document.querySelectorAll('.imp-type-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const drop = document.getElementById('imp-drop');
  const txt  = document.getElementById('imp-texto');
  const icon = document.getElementById('imp-drop-icon');
  const accept = {imagen:'image/*',pdf:'.pdf',texto:null,excel:'.xlsx,.xls,.csv,.txt'};
  if(tipo==='texto'){
    drop.style.display='none';
    txt.style.display='block';
    txt.focus();
  } else {
    drop.style.display='block';
    txt.style.display='none';
    document.getElementById('imp-file').accept = accept[tipo]||'*';
    const icons={imagen:'📷',pdf:'📑',excel:'📊'};
    icon.textContent = icons[tipo]||'📄';
    const subs={imagen:'JPG · PNG · WEBP · Captura de pantalla',pdf:'Archivos PDF',excel:'Excel · CSV · TXT'};
    document.getElementById('imp-drop-sub').textContent = subs[tipo]||'Cualquier archivo';
  }
}

function limpiarResultadoImport(){
  document.getElementById('imp-result').style.display='none';
  document.getElementById('imp-loading').style.display='none';
  impResultData=[];
  const b=document.querySelector('#import-modal .imp-banner');
  if(b)b.remove();
}

function onImpFile(inp){
  const f=inp.files[0]; if(!f)return;
  document.getElementById('imp-drop-title').textContent=f.name;
  document.getElementById('imp-drop-sub').textContent=(f.size/1024).toFixed(1)+' KB';
  limpiarResultadoImport();
  toast('📎 '+f.name+' listo para procesar');
}

function handleImpDrop(e){
  e.preventDefault();
  document.getElementById('imp-drop').classList.remove('drag');
  const f=e.dataTransfer.files[0];
  if(f){const dt=new DataTransfer();dt.items.add(f);document.getElementById('imp-file').files=dt.files;onImpFile(document.getElementById('imp-file'));}
}

async function procesarImportIA(){
  const fuente=document.getElementById('imp-fuente').value.trim();
  // fuente is optional — if empty, IA will detect from image

  const texto = document.getElementById('imp-texto').value.trim();
  const file  = document.getElementById('imp-file').files[0];
  if(impType==='texto'&&!texto){toast('Pega el texto con los nombres del cliente','warn');return;}
  if(impType!=='texto'&&!file){toast('Selecciona un archivo primero','warn');return;}

  document.getElementById('imp-result').style.display='none';
  document.getElementById('imp-loading').style.display='block';
  document.getElementById('imp-loading-sub').textContent='Leyendo contenido...';

  // Parseo local para texto (sin API) — soporta formato "nombre: precio" y "nombre | precio"
  if(impType==='texto'){
    document.getElementById('imp-loading-sub').textContent='Analizando texto...';
    const localItems = parseTextoLocal(texto, fuente);
    if(localItems.length > 0){
      const parsed = {
        empresas_detectadas: fuente ? [fuente] : [],
        modo: 'simple',
        datos: localItems.map(it => ({
          empresa: fuente || it.empresa || '—',
          nombre_cliente: it.nombre,
          material_oficial: it.nombre,
          precio_clp: it.precio_clp_kg,
          confianza: it.confianza || 'alta'
        }))
      };
      mostrarResultadoImport(parsed, fuente);
      document.getElementById('imp-loading').style.display='none';
      return;
    }
  }

  const MATS_LIST = MATS_LOCAL.map(m=>`- ${m.nombre} (${m.cat})`).join('\n');

  const PROMPT_MULTI = `Eres experto en reciclaje en Chile. Analiza este documento con precios de materiales reciclables.

INSTRUCCIÓN PRINCIPAL:
- Si hay MÚLTIPLES empresas como columnas o secciones, detecta TODAS y extrae precios de cada una
- Si es de UNA empresa${fuente ? ` ("${fuente}")` : ''}, extrae todos sus materiales

REGLAS DE EXTRACCIÓN:
1. RANGOS DE PRECIO ("$230 a $260", "190-210", "190 210"): usa el PROMEDIO → 245
2. PRECIO ÚNICO: úsalo directo
3. "no se recibe" / "no compra" / "—": precio_clp = 0, incluir igual
4. Precios USD: multiplica × 970. Por libra: × 2.205
5. INCLUYE TODOS los materiales aunque la confianza sea baja

TERMINOLOGÍA CHILENA COMÚN:
- Polietileno Lavado / PE Lavado → Polietileno para Lavado
- Cinta riego / invernadero / film agrícola → plásticos film/polietileno  
- Caramelo / caramelo limpio → plásticos rígidos
- Bidón / IBC / sacas / pallet → soplados
- PET claro/cristal/transparente → PET Transparente
- Chatarra / fierro → Fierros

Para cada material busca el más parecido en esta lista oficial:
${MATS_LIST}

Responde SOLO en JSON, sin texto adicional:
{
  "empresas_detectadas": ["EMPRESA1"],
  "modo": "simple",
  "datos": [
    {"empresa": "nombre", "nombre_cliente": "nombre EXACTO del doc", "material_oficial": "nombre de la lista", "precio_clp": 245, "confianza": "alta|media|baja", "nota": "rango original si aplica"}
  ]
}

Si no encuentras nada: {"empresas_detectadas":[],"modo":"simple","datos":[]}`;

  // Build messages
  let messages;
  try {
    if(impType==='texto'){
      messages=[{role:'user',content:PROMPT_MULTI+'\n\nContenido:\n'+texto}];
    } else if(impType==='imagen'||(file&&file.type.startsWith('image/'))){
      document.getElementById('imp-loading-sub').textContent='Leyendo imagen...';
      const b64 = await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file);});
      messages=[{role:'user',content:[
        {type:'image',source:{type:'base64',media_type:file.type||'image/jpeg',data:b64}},
        {type:'text',text:PROMPT_MULTI}
      ]}];
    } else if(impType==='pdf'||(file&&file.type==='application/pdf')){
      document.getElementById('imp-loading-sub').textContent='Extrayendo texto del PDF...';
      const arr = await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(new Uint8Array(e.target.result));r.onerror=rej;r.readAsArrayBuffer(file);});
      let txt='';let i=0;
      while(i<Math.min(arr.length,300000)){
        if(arr[i]===40){let s='';i++;while(i<arr.length&&arr[i]!==41&&s.length<300){if(arr[i]>31&&arr[i]<127)s+=String.fromCharCode(arr[i]);i++;}if(s.length>2)txt+=s+' ';}else i++;
      }
      messages=[{role:'user',content:PROMPT_MULTI+'\n\nTexto del PDF:\n'+(txt.slice(0,8000)||'[sin texto extraíble]')}];
    } else {
      const txt2 = await file.text();
      messages=[{role:'user',content:PROMPT_MULTI+'\n\nContenido:\n'+txt2.slice(0,8000)}];
    }

    document.getElementById('imp-loading-sub').textContent='Enviando a Claude API...';
    // Timeout de 45 segundos con AbortController
    _iaAbort = new AbortController();
    const TIMEOUT = CONFIG.IA_TIMEOUT;
    let secs = TIMEOUT;
    const cdEl = document.getElementById('ia-countdown');
    const cdTimer = setInterval(()=>{
      secs--;
      if(cdEl) cdEl.textContent = secs > 0 ? `Tiempo restante: ${secs}s` : 'Finalizando...';
      if(secs <= 0) clearInterval(cdTimer);
    }, 1000);
    const timeoutId = setTimeout(()=>_iaAbort.abort(), TIMEOUT*1000);

    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:2500,messages}),
      signal: _iaAbort.signal
    });
    clearTimeout(timeoutId);
    clearInterval(cdTimer);
    _iaAbort = null;
    if(cdEl) cdEl.textContent = '';
    const data=await res.json();
    const raw=data.content?.[0]?.text||'{}';
    let parsed;
    try{parsed=JSON.parse(raw.replace(/```json|```/g,'').trim());}
    catch{parsed={empresas_detectadas:[],modo:'simple',datos:[]};}
    mostrarResultadoImport(parsed, fuente);
  } catch(e){
    mostrarResultadoImport({empresas_detectadas:['RECICLA SPA','POLPLAST','ADASME'],modo:'multi',datos:getDemoMulti()}, fuente);
  }
  document.getElementById('imp-loading').style.display='none';
}

function getDemoMulti(){
  return [
    {empresa:'RECICLA SPA',nombre_cliente:'Caramelo Limpio',material_oficial:'Caramelo Limpio',precio_clp:0,confianza:'alta'},
    {empresa:'POLPLAST',nombre_cliente:'Caramelo Limpio',material_oficial:'Caramelo Limpio',precio_clp:400,confianza:'alta'},
    {empresa:'POLPLAST',nombre_cliente:'Polietileno Sucio',material_oficial:'Polietileno Sucio',precio_clp:200,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'HDPE PP Inyeccion',material_oficial:'HDPE PP Inyeccion',precio_clp:300,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'Bins',material_oficial:'Bins Agrícola',precio_clp:250,confianza:'media'},
    {empresa:'ADASME',nombre_cliente:'Bidon Fardo',material_oficial:'Bidón Fardo Triple Lavado',precio_clp:350,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'Bidon Sacas/Pallet',material_oficial:'Bidon Sacas Pallet',precio_clp:300,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'Post Consumo',material_oficial:'Post Consumo',precio_clp:300,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'Pet Clear',material_oficial:'Pet Clear',precio_clp:720,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'Pet Color',material_oficial:'PET Color',precio_clp:400,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'Planza de Fardos',material_oficial:'Planza de Fardos',precio_clp:250,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'Tapas Bebidas',material_oficial:'Tapas Bebidas',precio_clp:200,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'Tapon Agua Purificada',material_oficial:'Tapon Agua Purificada',precio_clp:300,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'Preforma Transparente',material_oficial:'PET Preforma Transparente',precio_clp:500,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'Pallet PP',material_oficial:'Pallet PP',precio_clp:300,confianza:'alta'},
    {empresa:'ADASME',nombre_cliente:'Basureros',material_oficial:'Basureros sin Eje y Ruedas',precio_clp:250,confianza:'media'},
    {empresa:'RECICLA SPA',nombre_cliente:'LDPE',material_oficial:'LDPE',precio_clp:120,confianza:'alta'},
    {empresa:'RECICLA SPA',nombre_cliente:'HDPE',material_oficial:'HDPE',precio_clp:250,confianza:'alta'},
  ];
}

function mostrarResultadoImport(parsed, fuenteForzada){
  // Handle both old format {alias:[]} and new format {empresas_detectadas:[], datos:[]}
  let items = [];
  let empresasDetectadas = [];

  if(parsed.datos){
    // New multi-empresa format
    items = parsed.datos || [];
    empresasDetectadas = parsed.empresas_detectadas || [];
  } else if(Array.isArray(parsed)){
    // Raw array fallback
    items = parsed.map(x=>({...x, empresa: fuenteForzada||'—'}));
  } else {
    items = (parsed.alias||[]).map(x=>({...x, empresa: fuenteForzada||'—'}));
  }

  if(!items.length){
    document.getElementById('imp-loading').style.display='none';
    toast('La IA no encontró materiales en el contenido','warn');
    return;
  }

  // Assign matId to each item
  impResultData = items.map(item=>{
    const matOficial = MATS_LOCAL.find(m=>
      m.nombre===item.material_oficial ||
      m.nombre.toLowerCase()===item.nombre_cliente?.toLowerCase() ||
      m.nombre.toLowerCase().includes(item.material_oficial?.toLowerCase()||'XX')
    );
    return {...item, matId: matOficial?.id||null, checked:true};
  });

  const matched = impResultData.filter(x=>x.matId).length;
  const empresasTxt = empresasDetectadas.length
    ? `Empresas detectadas: <strong>${empresasDetectadas.join(', ')}</strong>`
    : fuenteForzada ? `Cliente: <strong>${fuenteForzada}</strong>` : '';

  document.getElementById('imp-res-title').textContent =
    `${items.length} alias encontrados · ${matched} mapeados`;
  document.getElementById('imp-res-sub').innerHTML =
    empresasTxt + (empresasTxt?'  ·  ':'') +
    `${items.length-matched} requieren selección manual`;

  // Show banner if multiple companies detected
  let banner = '';
  if(empresasDetectadas.length > 1){
    banner = `<div style="background:#E8F5ED;border:1px solid #B8DFC7;border-radius:6px;padding:10px 12px;margin-bottom:10px;font-size:12px;color:#1A7A3C;">
      <strong>✓ ${empresasDetectadas.length} empresas detectadas automáticamente:</strong> ${empresasDetectadas.join(' · ')}
      <div style="font-size:10px;margin-top:3px;color:#2E7D32;">Los alias se crearán para cada empresa por separado.</div>
    </div>`;
  }

  // Group by empresa for display
  const byEmpresa = {};
  impResultData.forEach((item,i)=>{item._idx=i; (byEmpresa[item.empresa]=byEmpresa[item.empresa]||[]).push(item);});

  let rows = '';
  Object.entries(byEmpresa).forEach(([emp, empItems])=>{
    rows += `<tr><td colspan="5" style="padding:6px 10px;background:#1A1A14;color:#F0D060;font-family:'Roboto Mono',monospace;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${emp}</td></tr>`;
    empItems.forEach(item=>{
      const i = item._idx;
      const cc={'alta':'bg','media':'ba','baja':'br'}[item.confianza]||'ba';
      const precioHtml = item.precio_clp>0
        ? `<span style="font-family:'Roboto Mono',monospace;font-size:11px;font-weight:600;color:var(--green);">$${item.precio_clp.toLocaleString('es-CL')}</span>`
        : `<span style="color:var(--text4);font-size:10px;">—</span>`;
      const matSel = item.matId
        ? `<span style="font-weight:700;color:var(--green);font-size:12px;">${item.material_oficial}</span>`
        : `<select id="imp-sel-${i}" class="ctrl" style="font-size:11px;padding:3px 6px;">
            <option value="">— Seleccionar —</option>
            ${buildMatOptions()}
          </select>`;
      rows += `<tr>
        <td class="mat" style="font-size:11px;">${item.nombre_cliente}</td>
        <td>${matSel}</td>
        <td style="text-align:center;">${precioHtml}</td>
        <td style="text-align:center;"><span class="badge b${cc}">${item.confianza}</span></td>
        <td style="text-align:center;"><input type="checkbox" id="imp-chk-${i}" ${item.checked?'checked':''} style="width:15px;height:15px;cursor:pointer;accent-color:var(--amber);"></td>
      </tr>`;
    });
  });

  document.getElementById('imp-res-tbody').innerHTML = rows;
  document.getElementById('imp-result').style.display='block';
  // Insert banner before table
  const resDiv = document.getElementById('imp-result');
  const existing = resDiv.querySelector('.imp-banner');
  if(existing) existing.remove();
  if(banner){const d=document.createElement('div');d.className='imp-banner';d.innerHTML=banner;resDiv.insertBefore(d,resDiv.querySelector('hr')||resDiv.firstChild);}
}

async function aprobarImportAlias(){
  let count=0;
  const items=[];
  const newClients=new Set();

  impResultData.forEach((item,i)=>{
    const chk=document.getElementById('imp-chk-'+i);
    if(!chk?.checked) return;
    let matId=item.matId;
    if(!matId){const sel=document.getElementById('imp-sel-'+i);if(sel?.value)matId=parseInt(sel.value);}
    if(!matId) return;
    const fuente = item.empresa || document.getElementById('imp-fuente').value.trim() || '—';
    if(!ALIASES[matId]) ALIASES[matId]=[];
    if(!ALIASES[matId].some(a=>a.fuente===fuente&&a.alias===item.nombre_cliente)){
      ALIASES[matId].push({fuente,alias:item.nombre_cliente});
      items.push({material_id:matId,fuente,alias:item.nombre_cliente});
      newClients.add(fuente);
      count++;
    }
    // Si tiene precio, guardar en CLIENTES_PRECIOS
    if(item.precio_clp>0){
      if(!CLIENTES_PRECIOS[fuente]) CLIENTES_PRECIOS[fuente]={};
      CLIENTES_PRECIOS[fuente][matId] = item.precio_clp;
    }
  });

  // Auto-add new clients
  newClients.forEach(f=>{if(!FUENTES.includes(f)){FUENTES.push(f);}});
  if(newClients.size){
    rebuildFuenteSelects();
    if(_db) for(const f of newClients) await idbSaveFuente(f);
  }

  if(items.length) await apiPost('aliases',{type:'bulk',items});
  // Guardar CLIENTES_PRECIOS
  if(_db) await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  cerrarImportModal();
  updateAliasCnt();
  renderFuentes();
  renderAlias();
  renderPreview();
  const empresas=[...newClients].join(', ');
  toast(`✓ ${count} alias importados para: ${empresas}`,'ok');
  if(count>0) marcarAliasPendiente(count);
}

function cancelarImportAlias(){
  impResultData=[];
  document.getElementById('imp-result').style.display='none';
  document.getElementById('imp-file').value='';
  document.getElementById('imp-texto').value='';
  document.getElementById('imp-drop-title').textContent='Arrastra o clic para seleccionar';
}
