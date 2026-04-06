
// ═══════════════════════════════════════════════════════════
// GRABAR — Guardar todo el estado actual (distinto de Publicar)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// HERRAMIENTA DE CORRECCIÓN — Tab B
// ═══════════════════════════════════════════════════════════
function toggleCorreccion(){
  const panel = document.getElementById('corr-panel');
  const arrow = document.getElementById('corr-arrow');
  const visible = panel.style.display !== 'none';
  panel.style.display = visible ? 'none' : 'block';
  arrow.style.transform = visible ? '' : 'rotate(90deg)';
  if(!visible){
    // Populate client selector
    const sel = document.getElementById('corr-cliente');
    const current = sel.value;
    sel.innerHTML = '<option value="">— Seleccionar cliente —</option>';
    FUENTES.forEach(f=>{
      const n = Object.keys(CLIENTES_PRECIOS[f]||{}).length;
      if(n>0){
        const opt = document.createElement('option');
        opt.value = f; opt.textContent = `${f} (${n} materiales)`;
        sel.appendChild(opt);
      }
    });
    if(current) sel.value = current;
    // Update resumen
    const total = Object.values(CLIENTES_PRECIOS).reduce((s,p)=>s+Object.keys(p).length, 0);
    document.getElementById('corr-resumen').textContent = `${total} precios en ${FUENTES.filter(f=>Object.keys(CLIENTES_PRECIOS[f]||{}).length>0).length} clientes`;
    renderCorreccion();
  }
}

function renderCorreccion(){
  const body = document.getElementById('corr-body');
  const cliente = document.getElementById('corr-cliente').value;
  const countEl = document.getElementById('corr-count');
  
  if(!cliente){
    body.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text3);font-size:13px;">Selecciona un cliente para ver y corregir sus precios</div>';
    countEl.textContent = '';
    return;
  }
  
  const precios = CLIENTES_PRECIOS[cliente]||{};
  const entries = Object.entries(precios).map(([matId, precio])=>{
    const m = MATS_LOCAL.find(x=>x.id===parseInt(matId));
    return { matId: parseInt(matId), precio, mat: m, nombre: m?.nombre||'ID '+matId, cat: m?.cat||'—' };
  }).sort((a,b)=>(a.cat+a.nombre).localeCompare(b.cat+b.nombre));
  
  countEl.textContent = `${entries.length} materiales`;
  
  if(!entries.length){
    body.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);">Sin precios para este cliente</div>';
    return;
  }
  
  // Build category options for dropdowns
  const catOpts = CAT_ORDER.map(c=>`<option value="${c}">${c.replace('PLÁSTICOS — ','')}</option>`).join('');
  
  // Build material options for reassignment
  const matOptsBycat = {};
  MATS_LOCAL.forEach(m=>{
    if(!matOptsBycat[m.cat]) matOptsBycat[m.cat]=[];
    matOptsBycat[m.cat].push(m);
  });
  const matOptsHtml = CAT_ORDER.map(cat=>{
    const ms = matOptsBycat[cat]||[];
    if(!ms.length) return '';
    return `<optgroup label="${cat.replace('PLÁSTICOS — ','')}">${ms.map(m=>`<option value="${m.id}">${m.nombre}</option>`).join('')}</optgroup>`;
  }).join('');
  
  let curCat = '';
  let html = '';
  
  entries.forEach((e, idx)=>{
    // Category separator
    if(e.cat !== curCat){
      curCat = e.cat;
      html += `<div style="font-family:'Roboto Mono',monospace;font-size:10px;font-weight:700;
        color:var(--amber);letter-spacing:1px;text-transform:uppercase;padding:8px 0 4px;
        border-bottom:2px solid var(--border);margin-top:${idx?'12px':'0'};">${curCat}</div>`;
    }
    
    const rowBg = idx%2===0 ? 'var(--bg2)' : 'var(--bg3)';
    html += `<div style="display:grid;grid-template-columns:1fr 100px 1fr 140px;gap:8px;
      align-items:center;padding:10px 8px;border-bottom:1px solid var(--border);background:${rowBg};"
      id="corr-row-${e.matId}">
      
      <!-- Material actual -->
      <div>
        <div style="font-size:14px;font-weight:700;color:var(--text);">${e.nombre}</div>
        <div style="font-size:10px;color:var(--text4);">ID ${e.matId} · ${e.cat}</div>
      </div>
      
      <!-- Precio -->
      <div>
        <input type="number" value="${e.precio}" min="0" step="1"
          style="width:90px;font-size:16px;font-weight:700;font-family:'Roboto Mono',monospace;
          text-align:right;padding:6px 8px;border:2px solid var(--border);border-radius:6px;
          background:var(--bg);color:var(--text);"
          onchange="corrEditarPrecio('${cliente}',${e.matId},this.value)">
        <div style="font-size:9px;color:var(--text4);text-align:right;">$/kg</div>
      </div>
      
      <!-- Reasignar material -->
      <div>
        <select style="width:100%;font-size:12px;padding:6px 8px;border:2px solid var(--border);
          border-radius:6px;background:var(--bg);color:var(--text);"
          onchange="corrReasignar('${cliente}',${e.matId},this.value)">
          <option value="${e.matId}" selected>${e.nombre}</option>
          <option value="" disabled>── Reasignar a ──</option>
          ${matOptsHtml}
        </select>
        <div style="font-size:9px;color:var(--text4);">Cambiar material</div>
      </div>
      
      <!-- Acciones -->
      <div style="display:flex;gap:6px;justify-content:flex-end;">
        <button onclick="corrEliminar('${cliente}',${e.matId})"
          style="font-size:12px;padding:6px 12px;background:#E74C3C;color:#fff;border:none;
          border-radius:6px;cursor:pointer;font-weight:700;">✕ Eliminar</button>
      </div>
    </div>`;
  });
  
  body.innerHTML = html;
}

async function corrEditarPrecio(cliente, matId, valor){
  const v = parseInt(valor);
  if(isNaN(v) || v < 0){ toast('Precio inválido','err'); return; }
  if(!CLIENTES_PRECIOS[cliente]) return;
  CLIENTES_PRECIOS[cliente][matId] = v;
  if(_db) await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  // Update material compra
  const m = mats.find(x=>x.id===matId);
  if(m){ m.compra = v; if(!cambios[matId]) cambios[matId]={}; cambios[matId].compra=v; }
  renderPreview();
  toast(`✓ ${MATS_LOCAL.find(x=>x.id===matId)?.nombre||'ID '+matId}: $${v.toLocaleString('es-CL')}`);
}

async function corrReasignar(cliente, matIdViejo, matIdNuevo){
  matIdNuevo = parseInt(matIdNuevo);
  if(!matIdNuevo || matIdNuevo === matIdViejo) return;
  const precio = CLIENTES_PRECIOS[cliente]?.[matIdViejo];
  if(precio === undefined) return;
  
  const matViejo = MATS_LOCAL.find(x=>x.id===matIdViejo);
  const matNuevo = MATS_LOCAL.find(x=>x.id===matIdNuevo);
  if(!matNuevo) return;
  
  if(!confirm(`¿Reasignar precio $${precio.toLocaleString('es-CL')} de "${matViejo?.nombre||'ID '+matIdViejo}" a "${matNuevo.nombre}"?`)) {
    renderCorreccion(); return;
  }
  
  // Move price
  delete CLIENTES_PRECIOS[cliente][matIdViejo];
  CLIENTES_PRECIOS[cliente][matIdNuevo] = precio;
  
  // Update material compra
  if(matViejo){ matViejo.compra = 0; }
  const mNew = mats.find(x=>x.id===matIdNuevo);
  if(mNew){ mNew.compra = precio; if(!cambios[matIdNuevo]) cambios[matIdNuevo]={}; cambios[matIdNuevo].compra=precio; }
  
  // Persist
  if(_db) await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  
  renderCorreccion();
  renderAlias();
  renderPreview();
  toast(`✓ Reasignado: ${matViejo?.nombre} → ${matNuevo.nombre} ($${precio.toLocaleString('es-CL')})`);
}

async function corrEliminar(cliente, matId){
  const mat = MATS_LOCAL.find(x=>x.id===matId);
  const precio = CLIENTES_PRECIOS[cliente]?.[matId];
  if(!confirm(`¿Eliminar precio $${(precio||0).toLocaleString('es-CL')} de ${mat?.nombre||'ID '+matId} (${cliente})?`)) return;
  
  delete CLIENTES_PRECIOS[cliente][matId];
  if(!Object.keys(CLIENTES_PRECIOS[cliente]).length) delete CLIENTES_PRECIOS[cliente];
  
  if(_db) await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  
  renderCorreccion();
  renderAlias();
  renderPreview();
  toast(`✓ Eliminado: ${mat?.nombre} de ${cliente}`);
}

