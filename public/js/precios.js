
// ═══════════════════════════════════════════════════════════
// A · PRECIOS & MÁRGENES
// ═══════════════════════════════════════════════════════════
// ── v84: Tab C siempre muestra 4 sucursales, con aprobacion integrada ──
// ── v85: Tab C con flete/margen/MC por sucursal, negativos, override con revert ──
// ── v86: Tab C solo materiales con precio seleccionado en Tab B ──
function renderPrecios(){
  var catF=document.getElementById('pc-cat').value;
  var q=document.getElementById('pc-q').value.toLowerCase();
  // v86: solo materiales que tienen PRECIO_SELECCIONADO en al menos 1 sucursal
  var list=mats.filter(function(m){
    if(catF && m.cat!==catF) return false;
    if(q && !m.nombre.toLowerCase().includes(q)) return false;
    var tiene=false;
    SUCS.forEach(function(s){ if(PRECIO_SELECCIONADO[m.id]&&PRECIO_SELECCIONADO[m.id][s]&&PRECIO_SELECCIONADO[m.id][s].precio) tiene=true; });
    return tiene;
  });
  var cr=detectarCambiosReales();
  var hayCambios=Object.keys(cr).length>0||Object.keys(cambios).length>0;

  // Header row 1
  var th='<tr><th style="width:16px;">#</th><th style="min-width:100px;">Material</th><th class="num" style="width:28px;">IVA</th>';
  SUCS.forEach(function(s){
    var label=s.replace('Puerto Montt','P.Montt');
    th+='<th colspan="9" style="text-align:center;border-left:2px solid var(--border2);font-size:10px;background:var(--bg3);">'+label+'</th>';
  });
  if(hayCambios) th+='<th style="width:55px;"></th>';
  th+='</tr>';
  // Header row 2: sub-columns per sucursal
  th+='<tr><th colspan="3"></th>';
  SUCS.forEach(function(){
    th+='<th class="num" style="font-size:7px;color:var(--green);border-left:2px solid var(--border2);width:50px;">Venta</th>';
    th+='<th class="num" style="font-size:7px;color:var(--text3);width:30px;">Flete</th>';
    th+='<th class="num" style="font-size:7px;color:var(--text3);width:32px;">Marg%</th>';
    th+='<th class="num" style="font-size:7px;color:var(--text3);width:28px;">%B</th>';
    th+='<th class="num" style="font-size:7px;color:var(--text3);width:28px;">%E</th>';
    th+='<th class="num" style="font-size:7px;color:var(--text4);width:42px;">Ant.</th>';
    th+='<th class="num" style="font-size:7px;color:var(--green);width:45px;">Lista</th>';
    th+='<th class="num" style="font-size:7px;color:var(--amber);width:40px;">Ejec</th>';
    th+='<th class="num" style="font-size:7px;color:var(--blue);width:40px;">Max</th>';
  });
  if(hayCambios) th+='<th style="font-size:7px;">Dec.</th>';
  th+='</tr>';
  document.getElementById('pc-thead').innerHTML=th;

  // Resumen
  var resEl=document.getElementById('cambios-resumen');
  var nCr=Object.keys(cr).length;
  if(list.length===0){
    resEl.innerHTML='<span style="color:var(--text3);">No hay materiales con precios seleccionados en Tab B. Selecciona precios primero.</span>';
    resEl.style.display='block';
    document.getElementById('pc-tbody').innerHTML='<tr><td colspan="40" style="text-align:center;padding:40px;color:var(--text3);font-size:13px;">Selecciona precios de clientes en <strong>Tab B (Precios / Alias)</strong> para verlos aqui.</td></tr>';
    updCambiosBadge();
    return;
  }
  if(nCr>0){
    var suben=0,bajan=0;
    Object.keys(cr).forEach(function(id){var s=Object.values(cr[id].sucs)[0];if(s&&s.delta>0)suben++;else if(s&&s.delta<0)bajan++;});
    var nAcep=Object.keys(cr).filter(function(id){return _aprobaciones[parseInt(id)]===true;}).length;
    var nRech=Object.keys(cr).filter(function(id){return _aprobaciones[parseInt(id)]===false;}).length;
    var txt='<strong>'+list.length+' material'+(list.length>1?'es':'')+' seleccionados</strong>';
    if(suben) txt+=' &#183; <span style="color:var(--green);font-weight:700;">&#8593;'+suben+'</span>';
    if(bajan) txt+=' &#183; <span style="color:var(--red);font-weight:700;">&#8595;'+bajan+'</span>';
    txt+=' &#183; &#10003;'+nAcep+' &#10007;'+nRech+' &#9675;'+(nCr-nAcep-nRech);
    resEl.innerHTML=txt; resEl.style.display='block';
  } else {
    resEl.innerHTML='<strong>'+list.length+' material'+(list.length>1?'es':'')+' seleccionados</strong> &#183; Sin cambios vs. publicado';
    resEl.style.display='block';
  }

  // Rows
  var html='';
  CAT_ORDER.forEach(function(cat){
    var catMats=list.filter(function(m){return m.cat===cat;});
    if(!catMats.length) return;
    var colSpan=3+SUCS.length*9+(hayCambios?1:0);
    html+='<tr class="cat-row-head" onclick="toggleBulkRow(\''+cat.replace(/[^a-zA-Z0-9]/g,'_')+'\')">';
    html+='<td colspan="'+colSpan+'">&#9656; '+cat+' ('+catMats.length+')</td></tr>';
    html+='<tr class="bulk-row" id="bulk_'+cat.replace(/[^a-zA-Z0-9]/g,'_')+'">';
    html+='<td colspan="'+colSpan+'" style="padding:8px 14px;">';
    html+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11px;">';
    html+='<span style="font-weight:600;color:var(--amber);">Editar categoria:</span>';
    html+='Margen% <input type="number" class="ctrl" id="bulk-mg-'+cat.replace(/[^a-zA-Z0-9]/g,'_')+'" step="0.5" placeholder="'+(catMats[0]?Math.round(catMats[0].margen*100):10)+'" style="width:60px;">';
    html+='<button class="btn amb" onclick="applyBulkMargen(\''+cat+'\')">Aplicar</button>';
    html+='</div></td></tr>';

    catMats.forEach(function(m){
      var orig=MATS_LOCAL.find(function(x){return x.id===m.id;})||m;
      var isChg=!!cr[m.id]||!!cambios[m.id];
      var estado=_aprobaciones[m.id];
      var mainDir='';
      if(cr[m.id]){var fs=Object.values(cr[m.id].sucs)[0];if(fs)mainDir=fs.delta>0?'up':fs.delta<0?'dn':'';}
      var rowBg='';var rowBrd='';
      if(isChg){rowBg=mainDir==='up'?'background:rgba(26,122,60,.04);':'background:rgba(192,57,43,.04);';rowBrd=mainDir==='up'?'border-left:3px solid var(--green);':'border-left:3px solid var(--red);';}
      if(estado===true){rowBg='background:rgba(26,122,60,.13);';rowBrd='border-left:5px solid #1A7A3C;'}
      if(estado===false){rowBg='background:rgba(192,57,43,.10);';rowBrd='border-left:5px solid #C0392B;'}

      html+='<tr style="'+rowBg+rowBrd+'">';
      html+='<td><span style="font-family:monospace;font-size:8px;color:var(--text4);">'+m.id+'</span></td>';
      html+='<td class="mat" style="font-size:11px;">'+m.nombre+'</td>';
      html+='<td class="num"><span class="badge '+(m.iva?'ba':'bn')+'" style="cursor:pointer;font-size:8px;" onclick="toggleIva('+m.id+')">'+(m.iva?'19%':'&#8212;')+'</span></td>';

      // Per-sucursal columns (9 each)
      SUCS.forEach(function(suc){
        var sel=PRECIO_SELECCIONADO[m.id]&&PRECIO_SELECCIONADO[m.id][suc];
        if(!sel||!sel.precio){
          // No hay precio seleccionado para esta sucursal → mostrar vacio
          html+='<td colspan="9" style="border-left:2px solid var(--border2);text-align:center;color:var(--text4);font-size:9px;">&#8212;</td>';
          return;
        }
        var f=SUC_FACTOR[suc]||1;
        var cNew=calc(m,f,suc);
        var cOld=calc(orig,f);
        var changed=cNew.lista!==cOld.lista;
        var dir=changed?(cNew.lista>cOld.lista?'up':'dn'):'';
        var pct=cOld.lista!==0?((cNew.lista-cOld.lista)/Math.abs(cOld.lista)*100).toFixed(1):'';
        var tieneOvr=PRECIO_OVERRIDE[m.id]&&PRECIO_OVERRIDE[m.id][suc]!==undefined;

        // Venta (precio del cliente, read-only con nombre)
        html+='<td class="num" style="border-left:2px solid var(--border2);background:rgba(26,122,60,.06);">';
        html+='<span style="font-weight:700;color:var(--green);font-size:10px;">$'+sel.precio.toLocaleString('es-CL')+'</span>';
        html+='<div style="font-size:7px;color:var(--text3);max-width:55px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+sel.cliente+'">'+sel.cliente+'</div>';
        html+='</td>';
        // Flete (editable per suc)
        html+='<td class="num"><span class="ed" onclick="startEdSuc('+m.id+',\'flete\',\''+suc+'\',this)" style="font-size:9px;">'+cNew.flete+'</span></td>';
        // Margen% (editable per suc)
        html+='<td class="num"><span class="ed" onclick="startEdSuc('+m.id+',\'margen\',\''+suc+'\',this)" style="font-size:9px;">'+(cNew.margen*100).toFixed(0)+'%</span></td>';
        // %B (editable per suc)
        html+='<td class="num"><span class="ed" onclick="startEdSuc('+m.id+',\'mc\',\''+suc+'\',this)" style="font-size:9px;">'+(cNew.mcSpread*100).toFixed(0)+'%</span></td>';
        // %E (editable per suc)
        var pctEVal=cNew.pctE;
        var comVal=cNew.comisionEjec;
        html+='<td class="num"><span class="ed" onclick="startEdSuc('+m.id+',\'ce\',\''+suc+'\',this)" style="font-size:9px;">'+(pctEVal*100).toFixed(2)+'%';
        if(comVal>0) html+='<div style="font-size:7px;color:var(--green);">$'+comVal+'</div>';
        html+='</span></td>';
        // Anterior
        html+='<td class="num" style="color:var(--text4);font-size:9px;'+(changed?'text-decoration:line-through;':'')+'">'+fmt(cOld.lista)+'</td>';
        // P.Lista (override + revert)
        var lCol=dir==='up'?'var(--green)':dir==='dn'?'var(--red)':'var(--text2)';
        html+='<td class="num" style="'+(changed?'background:rgba(240,208,96,.06);':'')+'">';
        if(tieneOvr){
          html+='<span style="cursor:pointer;font-weight:700;color:var(--blue);font-size:10px;" onclick="overridePrecio('+m.id+',\''+suc+'\',this)">&#9998;'+fmt(PRECIO_OVERRIDE[m.id][suc])+'</span>';
          html+='<div style="font-size:7px;color:var(--blue);cursor:pointer;" onclick="quitarOverride('+m.id+',\''+suc+'\')" title="Volver al propuesto">&#8634; propuesto</div>';
        } else {
          html+='<span style="cursor:pointer;font-weight:700;color:'+lCol+';font-size:10px;" onclick="overridePrecio('+m.id+',\''+suc+'\',this)">'+fmt(cNew.lista)+'</span>';
          if(changed&&pct) html+='<div style="font-size:7px;color:'+lCol+';">'+(cNew.lista>cOld.lista?'+':'')+pct+'%</div>';
        }
        html+='</td>';
        // P.Ejecutivo
        html+='<td class="num" style="font-size:9px;color:var(--text2);">'+fmt(cNew.ejec)+'</td>';
        // P.Maximo
        html+='<td class="num" style="font-size:9px;color:var(--text2);">'+fmt(cNew.max)+'</td>';
      });

      // Decision
      if(hayCambios){
        html+='<td style="text-align:center;white-space:nowrap;">';
        if(isChg){
          var acBg=estado===true?'var(--green)':'var(--bg3)';var acCol=estado===true?'#fff':'var(--text2)';
          var reBg=estado===false?'var(--red)':'var(--bg3)';var reCol=estado===false?'#fff':'var(--text2)';
          html+='<button onclick="aceptarCambioMat('+m.id+')" style="background:'+acBg+';border:1px solid '+(estado===true?'var(--green)':'var(--border)')+';color:'+acCol+';border-radius:3px;padding:1px 5px;font-size:9px;font-weight:700;cursor:pointer;">&#10003;</button>';
          html+='<button onclick="rechazarCambioMat('+m.id+')" style="background:'+reBg+';border:1px solid '+(estado===false?'var(--red)':'var(--border)')+';color:'+reCol+';border-radius:3px;padding:1px 5px;font-size:9px;font-weight:700;cursor:pointer;">&#10007;</button>';
        } else {
          html+='<span style="color:var(--text4);font-size:9px;">&#8212;</span>';
        }
        html+='</td>';
      }
      html+='</tr>';
    });
  });

  document.getElementById('pc-tbody').innerHTML=html;
  updCambiosBadge();
}
function toggleBulkRow(catId){
  const el=document.getElementById('bulk_'+catId);
  if(!el) return;
  const isOpen=el.classList.contains('open');
  document.querySelectorAll('.bulk-row.open').forEach(r=>r.classList.remove('open'));
  if(!isOpen) el.classList.add('open');
}

function applyBulkMargen(cat){
  const key=cat.replace(/[^a-zA-Z0-9]/g,'_');
  const v=parseFloat(document.getElementById('bulk-mg-'+key).value);
  if(isNaN(v)||v<=0||v>100){toast('Ingresa un margen válido (1-100)','warn');return;}
  let count=0;
  mats.filter(m=>m.cat===cat).forEach(m=>{
    m.margen=v/100;
    if(!cambios[m.id])cambios[m.id]={};
    cambios[m.id].margen=v/100;
    count++;
  });
  document.getElementById('bulk_'+key).classList.remove('open');
  renderPrecios();
  idbSaveDraft();
  toast(`✓ Margen ${v}% aplicado a ${count} materiales de ${cat}`,'ok');
}

function startEd(id,field,el){
  const m=mats.find(x=>x.id===id);
  const val=field==='margen'?(m.margen*100).toFixed(1):m[field];
  const inp=document.createElement('input');
  inp.type='number';inp.className='ci';inp.value=val;
  inp.onblur=()=>commitEd(id,field,inp.value);
  inp.onkeydown=e=>{if(e.key==='Enter')commitEd(id,field,inp.value);if(e.key==='Escape')renderPrecios();};
  el.replaceWith(inp);inp.focus();inp.select();
}
function commitEd(id,field,raw){
  const v=parseFloat(raw);
  if(isNaN(v)){renderPrecios();return;}
  const m=mats.find(x=>x.id===id);
  if(field==='margen')m.margen=v/100; else m[field]=v;
  if(!cambios[id])cambios[id]={};
  cambios[id][field]=v;
  idbSaveDraft();
  renderPrecios();
}
// v85: Edicion inline por sucursal (flete, margen, mc)
function startEdSuc(matId, field, suc, el){
  var storage = field==='flete'?FLETE_POR_SUC:field==='margen'?MARGEN_POR_SUC:field==='ce'?COMISION_EJEC_POR_SUC:MC_EJEC_POR_SUC;
  var m = mats.find(function(x){return x.id===matId;});
  var current;
  if(field==='flete') current = (storage[matId]&&storage[matId][suc]!==undefined)?storage[matId][suc]:(m.flete||0);
  else if(field==='margen') current = (storage[matId]&&storage[matId][suc]!==undefined)?(storage[matId][suc]*100).toFixed(1):(m.margen*100).toFixed(1);
  else if(field==='ce') current = (storage[matId]&&storage[matId][suc]!==undefined)?(storage[matId][suc]*100).toFixed(2):'0.00';
  else current = (storage[matId]&&storage[matId][suc]!==undefined)?(storage[matId][suc]*100).toFixed(1):(parseFloat(document.getElementById('cfg-spread-'+Math.max(0,SUCS.indexOf(suc)))?.value||15)).toFixed(1);
  var inp = document.createElement('input');
  inp.type='number'; inp.className='ci'; inp.value=current;
  inp.style.cssText='width:45px;font-size:9px;padding:1px 3px;';
  inp.onblur=function(){commitEdSuc(matId,field,suc,inp.value);};
  inp.onkeydown=function(e){if(e.key==='Enter')commitEdSuc(matId,field,suc,inp.value);if(e.key==='Escape')renderPrecios();};
  el.replaceWith(inp); inp.focus(); inp.select();
}
async function commitEdSuc(matId, field, suc, raw){
  var v = parseFloat(raw);
  if(isNaN(v)){renderPrecios();return;}
  var storage,key;
  if(field==='flete'){storage=FLETE_POR_SUC;key='flete_por_suc';}
  else if(field==='margen'){v=v/100;storage=MARGEN_POR_SUC;key='margen_por_suc';}
  else if(field==='ce'){v=v/100;storage=COMISION_EJEC_POR_SUC;key='comision_ejec_por_suc';}
  else{v=v/100;storage=MC_EJEC_POR_SUC;key='mc_ejec_por_suc';}
  if(!storage[matId]) storage[matId]={};
  storage[matId][suc]=v;
  if(_db) await idbSaveConfig(key, JSON.stringify(storage));
  safeLS('rf_'+key, JSON.stringify(storage));
  if(!cambios[matId]) cambios[matId]={};
  cambios[matId][field+'_'+suc]=v;
  idbSaveDraft();
  renderPrecios();
}
function toggleActivo(id){
  const m = mats.find(x=>x.id===id);
  if(!m) return;
  m.activo = m.activo===false ? true : false; // default true if undefined
  if(!cambios[id]) cambios[id]={};
  cambios[id].activo = m.activo;
  idbSaveDraft();
  renderPrecios();
  renderPreview();
  renderPublico();
  toast(m.activo ? '✓ Activo en lista de precios' : '○ Oculto de lista de precios');
}

function toggleIva(id){
  const m=mats.find(x=>x.id===id);
  m.iva=!m.iva;
  if(!cambios[id])cambios[id]={};
  cambios[id].iva=m.iva;
  renderPrecios();
}

// ═══════════════════════════════════════════════════════════
// ETAPA 5-6-7: DETECCIÓN DE CAMBIOS REALES + APROBACIÓN
// ═══════════════════════════════════════════════════════════

// Detecta qué materiales tienen precios provisionales distintos a los publicados
// Un "cambio real" es cuando calc(m, factor, suc) con PRECIO_SELECCIONADO
// genera un precio lista diferente al publicado en MATS_LOCAL
function detectarCambiosReales(){
  const cambiosReales = {}; // matId → {sucs: {suc: {anterior, nuevo, delta, pct, cliente}}}
  SUCS.forEach(suc=>{
    const factor = SUC_FACTOR[suc]||1;
    mats.forEach(m=>{
      const orig = MATS_LOCAL.find(x=>x.id===m.id);
      if(!orig) return;
      // Precio publicado (usa datos de MATS_LOCAL sin selección)
      const cPub = calc(orig, factor);
      // Precio provisional (usa PRECIO_SELECCIONADO + cambios de margen/flete)
      const cProv = calc(m, factor, suc);
      if(cProv.lista !== cPub.lista || cProv.max !== cPub.max){
        if(!cambiosReales[m.id]){
          cambiosReales[m.id] = {
            nombre: m.nombre, cat: m.cat, matId: m.id,
            sucs: {}, aceptado: null // null=pendiente, true=aceptado, false=rechazado
          };
        }
        const pct = cPub.lista>0 ? ((cProv.lista-cPub.lista)/cPub.lista*100).toFixed(1) : 'nuevo';
        const cliente = PRECIO_SELECCIONADO[m.id]?.[suc]?.cliente || '';
        cambiosReales[m.id].sucs[suc] = {
          anterior: cPub.lista, anteriorMax: cPub.max,
          nuevo: cProv.lista, nuevoMax: cProv.max,
          delta: cProv.lista - cPub.lista, pct, cliente,
          compraAnterior: orig.compra, compraNuevo: cProv.compra
        };
      }
    });
  });
  return cambiosReales;
}

// Estado de aprobación por material
let _aprobaciones = {}; // matId → true (aceptado) | false (rechazado) | undefined (pendiente)
let _filtroAprobacion = 'todos'; // 'todos' | 'cambios' | 'aceptados' | 'rechazados'

function aceptarCambioMat(matId){
  _aprobaciones[matId] = true;
  renderBannerAprobacion();
}
function rechazarCambioMat(matId){
  _aprobaciones[matId] = false;
  renderBannerAprobacion();
}
function pendienteCambioMat(matId){
  delete _aprobaciones[matId];
  renderBannerAprobacion();
}
function aceptarTodos(){
  const cr = detectarCambiosReales();
  Object.keys(cr).forEach(id=>{ _aprobaciones[parseInt(id)] = true; });
  renderBannerAprobacion();
}
function rechazarTodos(){
  const cr = detectarCambiosReales();
  Object.keys(cr).forEach(id=>{ _aprobaciones[parseInt(id)] = false; });
  renderBannerAprobacion();
}
function setFiltroAprobacion(f){
  _filtroAprobacion = f;
  renderBannerAprobacion();
}

// ── OVERRIDE MANUAL DE PRECIOS ────────────────────────────
async function overridePrecio(matId, suc, el){
  const actual = PRECIO_OVERRIDE[matId]?.[suc];
  const m = mats.find(x=>x.id===matId);
  const nombre = m?.nombre || 'ID '+matId;
  const inp = document.createElement('input');
  inp.type='number'; inp.value = actual !== undefined ? actual : 0;
  inp.style.cssText='font-family:"Roboto Mono",monospace;font-size:11px;width:70px;padding:2px 4px;border:1.5px solid var(--blue);border-radius:3px;background:var(--blue-bg);color:var(--blue);text-align:right;outline:none;';
  inp.placeholder='$0';
  const guardar = async ()=>{
    const v = parseInt(inp.value);
    if(isNaN(v)){ renderBannerAprobacion(); return; }
    if(!PRECIO_OVERRIDE[matId]) PRECIO_OVERRIDE[matId]={};
    PRECIO_OVERRIDE[matId][suc] = v;
    // Persistir
    if(_db) await idbSaveConfig('precio_override', JSON.stringify(PRECIO_OVERRIDE));
    safeLS('rf_precio_override', JSON.stringify(PRECIO_OVERRIDE));
    renderBannerAprobacion();
    renderPreview();
    renderPrecios();
    toast(`✏ Override: ${nombre} en ${suc} → $${v.toLocaleString('es-CL')}`,'ok');
  };
  inp.onblur = guardar;
  inp.onkeydown = e=>{ if(e.key==='Enter') guardar(); if(e.key==='Escape') renderBannerAprobacion(); };
  el.replaceWith(inp);
  inp.focus();
  inp.select();
}

async function quitarOverride(matId, suc){
  if(PRECIO_OVERRIDE[matId]) delete PRECIO_OVERRIDE[matId][suc];
  if(PRECIO_OVERRIDE[matId] && !Object.keys(PRECIO_OVERRIDE[matId]).length) delete PRECIO_OVERRIDE[matId];
  if(_db) await idbSaveConfig('precio_override', JSON.stringify(PRECIO_OVERRIDE));
  safeLS('rf_precio_override', JSON.stringify(PRECIO_OVERRIDE));
  renderBannerAprobacion();
  renderPreview();
  toast('↺ Override removido','warn');
}

// ═══════════════════════════════════════════════════════════
// FICHA DE DESPACHO A CLIENTES
// ═══════════════════════════════════════════════════════════
const DESTINATARIOS_DESPACHO = {
  Cerrillos:    {nombre:'Dusan Nicolas Arancibia Guerrero', cargo:'Administrador Cerrillos', tel:'+56995342437'},
  Maipú:        {nombre:'Juan Mendoza', cargo:'Administrador Maipú', tel:''},
  Talca:        {nombre:'Ingrid Cancino Peñailillo', cargo:'Administrador Talca', tel:''},
  'Puerto Montt':{nombre:'(Vacante)', cargo:'Administrador Puerto Montt', tel:''},
};
const LOGISTICA_GLOBAL = {nombre:'Andrea Rivera Contreras', cargo:'Encargada Logística (Todas)', tel:''};

// ── Ficha de Despacho — formato tarjetas por cliente ──
function generarFichaDespacho(){
  var fecha=new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'});
  var hora=new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});
  var CAT_BADGE={"FIERROS Y LATAS":"FE","LATA CHATARRA":"LATA","COBRES":"CU","BRONCES":"BR","ALUMINIOS":"AL","ACEROS INOXIDABLES":"INOX","CARTON Y PAPEL":"PAPEL","CARTÓN Y PAPEL":"PAPEL","VIDRIO":"VID","PLASTICOS — PET":"PET","PLÁSTICOS — PET":"PET","PLASTICOS — FILM Y POLIETILENOS":"FILM","PLÁSTICOS — FILM Y POLIETILENOS":"FILM","PLASTICOS — RÍGIDOS":"RIG","PLÁSTICOS — RÍGIDOS":"RIG","PLASTICOS — SOPLADOS":"SOPL","PLÁSTICOS — SOPLADOS":"SOPL"};
  var CAT_COLOR={"FE":"#37474F","LATA":"#37474F","CU":"#BF360C","BR":"#E65100","AL":"#1565C0","INOX":"#4A148C","PAPEL":"#33691E","VID":"#006064","PET":"#880E4F","FILM":"#4527A0","RIG":"#1A237E","SOPL":"#01579B"};
  function badge(cat){var b=CAT_BADGE[cat]||cat.slice(0,4).toUpperCase();var c=CAT_COLOR[b]||'#555';return '<span style="display:inline-block;background:'+c+';color:#fff;font-size:8px;font-weight:700;padding:2px 5px;border-radius:3px;min-width:28px;text-align:center;letter-spacing:.5px;">'+b+'</span>';}

  // Recopilar datos
  var fichas={};var clientesSet={};
  SUCS.forEach(function(suc){
    fichas[suc]=[];clientesSet[suc]=new Set();
    mats.forEach(function(m){
      var sel=PRECIO_SELECCIONADO[m.id]&&PRECIO_SELECCIONADO[m.id][suc];
      if(sel&&sel.precio>0){
        fichas[suc].push({material:m.nombre,cliente:sel.cliente,precio:sel.precio,cat:m.cat,matId:m.id});
        clientesSet[suc].add(sel.cliente);
      }
    });
    fichas[suc].sort(function(a,b){var ca=CAT_ORDER.indexOf(a.cat),cb=CAT_ORDER.indexOf(b.cat);return ca-cb||a.material.localeCompare(b.material,'es');});
  });

  // WA messages
  window._fichaMessages={};
  var globalMsg='*FICHA DE DESPACHO*\n_'+fecha+' '+hora+'_\n';
  SUCS.forEach(function(suc){
    var items=fichas[suc];if(!items.length)return;
    var msg='*DESPACHO '+suc.toUpperCase()+'*\n_'+fecha+'_\n\n';
    var prevCat='';
    items.forEach(function(it){if(it.cat!==prevCat){prevCat=it.cat;msg+='*'+it.cat+'*\n';}msg+='  '+it.material+' → '+it.cliente+' ($'+it.precio.toLocaleString('es-CL')+'/kg)\n';});
    msg+='\n_Total: '+items.length+' materiales_';
    window._fichaMessages[suc]=msg;
    globalMsg+='\n*'+suc+'* ('+items.length+' mat.)\n';
    var clientes=[...clientesSet[suc]];
    clientes.forEach(function(c){var mc=items.filter(function(i){return i.cliente===c;});globalMsg+='  -> '+c+': '+mc.length+' mat.\n';});
  });
  window._fichaMessages['global']=globalMsg;

  // Build card HTML
  var allBadges=Object.values(CAT_BADGE).filter(function(v,i,a){return a.indexOf(v)===i;});
  var fichaHtml='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;">'+allBadges.map(function(b){return '<span style="display:inline-block;background:'+(CAT_COLOR[b]||'#555')+';color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;">'+b+'</span>';}).join('')+'</div>';

  SUCS.forEach(function(suc){
    var items=fichas[suc];if(!items.length)return;
    var clientes=[...clientesSet[suc]];
    var dest=DESTINATARIOS_DESPACHO[suc]||{nombre:'—'};
    var sucLabel=suc.replace('Puerto Montt','P.MONTT').toUpperCase();

    // Sucursal header
    fichaHtml+='<div style="margin-bottom:20px;">';
    fichaHtml+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">';
    fichaHtml+='<div style="display:flex;align-items:center;gap:8px;"><span style="background:var(--green);color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:6px;">'+sucLabel+'</span><span style="font-size:12px;color:var(--text3);">'+items.length+' materiales &rarr; '+clientes.length+' clientes</span></div>';
    fichaHtml+='<div style="display:flex;gap:6px;">';
    fichaHtml+='<button class="btn" onclick="copiarFichaWA(\''+suc+'\')" style="font-size:10px;padding:3px 8px;">Copiar WA</button>';
    if(dest.tel) fichaHtml+='<a href="https://wa.me/'+dest.tel.replace(/[^0-9]/g,'')+'" target="_blank" class="btn ok" style="font-size:10px;padding:3px 8px;text-decoration:none;">'+dest.nombre.split(' ')[0]+'</a>';
    fichaHtml+='</div></div>';

    // Cards per client (horizontal wrap)
    fichaHtml+='<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;">';
    clientes.forEach(function(cli){
      var matsCli=items.filter(function(i){return i.cliente===cli;});
      fichaHtml+='<div style="border:1.5px solid var(--border);border-radius:var(--r2);overflow:hidden;min-width:200px;max-width:280px;flex:1;">';
      // Card header
      fichaHtml+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--border);background:var(--bg3);">';
      fichaHtml+='<div style="font-size:12px;font-weight:800;color:var(--ink);letter-spacing:.3px;">'+cli+'</div>';
      fichaHtml+='<span style="font-size:9px;color:var(--text3);background:var(--bg);padding:2px 6px;border-radius:4px;font-weight:600;">'+matsCli.length+' mat.</span>';
      fichaHtml+='</div>';
      // Card body — rows
      fichaHtml+='<div style="padding:4px 0;">';
      matsCli.forEach(function(it){
        fichaHtml+='<div style="display:flex;align-items:center;gap:6px;padding:3px 10px;font-size:11px;">';
        fichaHtml+=badge(it.cat);
        fichaHtml+='<span style="flex:1;color:var(--text);">'+it.material+'</span>';
        fichaHtml+='<span style="font-family:\'Roboto Mono\',monospace;font-size:10px;font-weight:700;color:var(--green);white-space:nowrap;">$'+it.precio.toLocaleString('es-CL')+'</span>';
        fichaHtml+='</div>';
      });
      fichaHtml+='</div></div>';
    });
    fichaHtml+='</div></div>';
  });

  if(!fichaHtml||!SUCS.some(function(s){return fichas[s].length>0;})){
    fichaHtml='<div style="text-align:center;padding:40px;color:var(--text3);">No hay precios seleccionados en Tab B.</div>';
  }

  var modal=document.createElement('div');
  modal.id='ficha-modal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:700;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML='<div style="background:#fff;border-radius:var(--r3);width:100%;max-width:1200px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.3);">'
    +'<div style="background:#1A1A14;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">'
    +'<div><div style="font-size:14px;font-weight:700;color:#fff;">FICHA DE DESPACHO</div>'
    +'<div style="font-size:11px;color:rgba(255,255,255,.4);">Reciclean + Farex &middot; '+fecha+' '+hora+' &middot; Basado en precios seleccionados</div></div>'
    +'<div style="display:flex;gap:6px;align-items:center;">'
    +'<button class="btn ok" onclick="copiarFichaWA(\'global\')" style="font-size:10px;">Copiar todo WA</button>'
    +'<button class="btn" onclick="descargarFichaPDF()" style="font-size:10px;background:#C0392B;border-color:#C0392B;color:#fff;">PDF</button>'
    +'<button onclick="cerrarFichaDespacho()" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:20px;cursor:pointer;padding:0 4px;">&#10005;</button>'
    +'</div></div>'
    +'<div style="padding:16px;overflow-y:auto;flex:1;">'+fichaHtml+'</div>'
    +'</div>';
  document.body.appendChild(modal);
  modal.onclick=function(e){if(e.target===modal)cerrarFichaDespacho();};
}
function fichaTab(key){
  ['global'].concat(SUCS).forEach(function(k){
    var btn=document.getElementById('ficha-tab-'+k);
    var content=document.getElementById('ficha-content-'+k);
    if(btn){btn.style.background=k===key?'var(--ink)':'';btn.style.color=k===key?'#fff':'';btn.style.borderColor=k===key?'var(--ink)':'';}
    if(content) content.style.display=k===key?'block':'none';
  });
}
function copiarFichaWA(key){
  var msg=window._fichaMessages&&window._fichaMessages[key]||'';
  navigator.clipboard.writeText(msg).then(function(){toast('Mensaje copiado al portapapeles','ok');});
}
function descargarFichaPDF(){
  var content=document.querySelector('#ficha-modal > div > div:last-child');
  if(!content) return;
  var fecha=new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'});
  var hora=new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});
  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ficha de Despacho '+fecha+'</title><style>'
    +'@import url("https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Roboto+Mono:wght@400;500;700&display=swap");'
    +'*{box-sizing:border-box;margin:0;padding:0;}'
    +'body{font-family:"Syne",sans-serif;padding:24px;color:#1A1A14;}'
    +'h1{font-size:18px;font-weight:800;margin-bottom:2px;}'
    +'.sub{font-size:11px;color:#888;margin-bottom:16px;}'
    +'.note{font-size:10px;color:#999;text-align:right;margin-bottom:12px;}'
    +'@media print{body{padding:12px;} .no-print{display:none!important;}}'
    +'</style></head><body>'
    +'<h1>FICHA DE DESPACHO</h1>'
    +'<div class="sub">Reciclean + Farex &middot; '+fecha+' '+hora+'</div>'
    +'<div class="note">Basado en precios seleccionados</div>'
    +content.innerHTML
    +'<script>setTimeout(function(){window.print();},400);<\/script>'
    +'</body></html>');
  w.document.close();
}
function cerrarFichaDespacho(){
  var modal=document.getElementById('ficha-modal');
  if(modal) modal.remove();
}


function updCambiosBadge(){
  var cr = detectarCambiosReales();
  var n = Object.keys(cr).length;
  var nManual = Object.keys(cambios).length;
  var totalCambios = Math.max(n, nManual);
  var badge = document.getElementById('cambios-badge');
  var btnPub = document.getElementById('btn-pub');
  var btnDes = document.getElementById('btn-desc');
  var btnAc = document.getElementById('btn-aceptar-todos');
  var btnRe = document.getElementById('btn-rechazar-todos');
  if(badge) badge.textContent = totalCambios+' cambio'+(totalCambios!==1?'s':'')+' pendiente'+(totalCambios!==1?'s':'');
  if(badge) badge.style.display = totalCambios>0 ? 'inline-flex' : 'none';
  if(btnPub) btnPub.style.display = totalCambios>0 ? 'inline-flex' : 'none';
  if(btnDes) btnDes.style.display = totalCambios>0 ? 'inline-flex' : 'none';
  if(btnAc) btnAc.style.display = totalCambios>0 ? 'inline-flex' : 'none';
  if(btnRe) btnRe.style.display = totalCambios>0 ? 'inline-flex' : 'none';
  if(!totalCambios){ _aprobaciones={}; }
}
function renderBannerAprobacion(){
  // v84: aprobacion integrada en renderPrecios, solo re-render
  renderPrecios();
}
function undoMat(id){
  const orig=MATS_LOCAL.find(x=>x.id===id);
  if(!orig) return;
  const idx=mats.findIndex(x=>x.id===id);
  if(idx>=0) mats[idx]={...orig};
  delete cambios[id];
  renderPrecios();
  toast('↺ Cambios en "'+orig.nombre+'" descartados');
}
function descartarCambios(){
  if(!confirm('¿Descartar todos los cambios?'))return;
  mats=MATS_LOCAL.map(m=>({...m}));cambios={};
  renderPrecios();toast('Cambios descartados');
}
async function publicarVersion(){
  // ETAPA 5: Aplicar solo los cambios aceptados
  const cr = detectarCambiosReales();
  const aceptados = Object.keys(cr).filter(id=>_aprobaciones[parseInt(id)]===true);
  const nManual = Object.keys(cambios).length;
  
  if(!aceptados.length && !nManual){
    toast('⚠ Acepta al menos un cambio antes de publicar','warn');
    return;
  }
  
  // Aplicar cambios aceptados a mats y MATS_LOCAL
  aceptados.forEach(id=>{
    const matId = parseInt(id);
    const m = mats.find(x=>x.id===matId);
    if(!m) return;
    // Consolidar el mejor precio de compra desde PRECIO_SELECCIONADO
    let mejorCompra = m.compra;
    SUCS.forEach(suc=>{
      const ps = PRECIO_SELECCIONADO[matId]?.[suc];
      if(ps?.precio && ps.precio > mejorCompra) mejorCompra = ps.precio;
    });
    if(mejorCompra !== m.compra) m.compra = mejorCompra;
    // Siempre marcar como cambio publicable si estaba en cr (diferencia vs MATS_LOCAL)
    if(cr[matId]){
      if(!cambios[matId]) cambios[matId] = {};
      cambios[matId].compra = m.compra;
    }
  });

  // Revertir cambios rechazados
  Object.keys(cr).filter(id=>_aprobaciones[parseInt(id)]===false).forEach(id=>{
    const matId = parseInt(id);
    const orig = MATS_LOCAL.find(x=>x.id===matId);
    if(!orig) return;
    const idx = mats.findIndex(x=>x.id===matId);
    if(idx>=0) mats[idx] = {...orig};
    delete cambios[matId];
  });

  const n = Object.keys(cambios).length;
  if(!n){
    toast('⚠ Sin cambios detectados vs. versión publicada','warn');
    return;
  }

  try{
    const label=new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'});

    // Build historial items — con guards para materiales no encontrados
    const items=Object.keys(cambios).map(id=>{
      const m    = mats.find(x=>x.id===parseInt(id));
      const orig = MATS_LOCAL.find(x=>x.id===parseInt(id)) || m; // fallback a m si no está en MATS_LOCAL
      if(!m) return null;
      const cv=calc(m), cvo=calc(orig||m);
      return{id:parseInt(id),nombre:m.nombre,precio:cv.lista,anterior:cvo.lista};
    }).filter(Boolean);

    const histItem={id:HISTORIAL.length+1,fecha:new Date().toISOString().split('T')[0],
      label,autor:'Admin',tipo:'propios',desc:`${n} materiales actualizados`,items};

    // Sync MATS_LOCAL con mats
    mats.forEach(m=>{
      const idx=MATS_LOCAL.findIndex(x=>x.id===m.id);
      if(idx>=0) MATS_LOCAL[idx]={...m};
      else MATS_LOCAL.push({...m}); // agregar si es material nuevo
    });
    HISTORIAL.push(histItem);

    // Intentar servidor remoto (no bloquea si falla)
    const payload=[];
    const sucIds={Cerrillos:1,Maipú:2,Talca:3,'Puerto Montt':4};
    mats.forEach(m=>{
      SUCS.forEach(suc=>{
        const f=SUC_FACTOR[suc]||1;
        const cv=calc(m,f,suc);
        payload.push({material_id:m.id,sucursal_id:sucIds[suc],precio_compra:m.compra,
          precio_lista:cv.lista,precio_ejecutivo:cv.ejec,precio_maximo:cv.max,
          flete:m.flete,margen:m.margen,iva:m.iva?1:0});
      });
    });
    const res=await apiPost('save_precios',{label,autor:'Admin',
      descripcion:`${n} material${n>1?'es':''} actualizado${n>1?'s':''}`,precios:payload});

    // Guardar en IndexedDB
    let savedOk=false;
    if(_db){
      try{
        await idbSaveMats(mats);
        await idbSaveHistorial(histItem);
        await idbSaveConfig('version_label', label);
        await idbSaveConfig('spread_por_suc', JSON.stringify(SUCS.map((_,i)=>document.getElementById('cfg-spread-'+i)?.value||'15')));
        await idbSaveConfig('iva_por_suc',    JSON.stringify(SUCS.map((_,i)=>document.getElementById('cfg-iva-'+i)?.value||'19')));
        await idbClearDraft();
        savedOk=true;
      }catch(e){ console.error('IDB save error:', e); }
    }

    // Siempre guardar en localStorage como respaldo
    try{
      safeLS('rf_mats_pub', JSON.stringify(mats));
      safeLS('rf_historial_last', JSON.stringify(histItem));
      safeLS('rf_version_label', label);
      safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
      safeLS('rf_draft_cambios', '{}');
    }catch(e){}

    document.getElementById('ver-label').textContent=label;
    document.getElementById('ver-sub').textContent='✓ Publicado — listo para GRABAR';
    document.getElementById('ver-sub').style.cssText='color:#1A7A3C;font-weight:700;font-size:11px;';
    const verBox = document.getElementById('ver-label').closest('div[style*="border"]') || document.getElementById('ver-label').parentElement?.parentElement;
    if(verBox) verBox.style.borderColor='#1A7A3C';
    if(!res?.ok) toast('Servidor no disponible. Cambios guardados localmente.','warn');
    cambios={};
    _aprobaciones={};

    // Limpiar overrides de materiales aceptados (ya absorbidos en precio publicado)
    aceptados.forEach(id=>{
      const matId = parseInt(id);
      if(PRECIO_OVERRIDE[matId]) delete PRECIO_OVERRIDE[matId];
    });
    // Persistir overrides limpiados
    if(_db) try{ await idbSaveConfig('precio_override', JSON.stringify(PRECIO_OVERRIDE)); }catch(e){}
    safeLS('rf_precio_override', JSON.stringify(PRECIO_OVERRIDE));

    renderPrecios();
    renderHistorial();
    renderPreview();
    toast(res?.ok
      ? `✓ Versión "${label}" publicada en BD`
      : `✓ Versión "${label}" guardada localmente (${items.length} materiales)`,'ok');

    // Auto-generar ficha de despacho al publicar
    setTimeout(()=> generarFichaDespacho(), 500);
    // v84: auto-alimentar Tab E y generar Asistente Comercial
    renderPublico();
    setTimeout(function(){ generarAsistente(true); }, 1000);

  }catch(err){
    console.error('Error en publicarVersion:', err);
    toast(`⚠ Error al publicar: ${err.message} — intenta de nuevo`,'err');
  }
}
function onSucChange(){
  // Sync preview selector with nav sucursal
  const suc = getSuc();
  const prevSel = document.getElementById('prev-suc-sel');
  if(prevSel && suc !== 'todas') prevSel.value = suc;
  else if(prevSel && suc === 'todas') prevSel.value = 'todas';
  renderPreview();
  renderPrecios();
  renderPublico();
}
