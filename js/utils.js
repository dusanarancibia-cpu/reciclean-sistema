function buildMatOptions(selectedId=null){
  return [...mats]
    .sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'))
    .map(m=>`<option value="${m.id}"${m.id===selectedId?' selected':''}>${m.nombre}</option>`)
    .join('');
}
const getSuc = () => document.getElementById('nav-suc').value;


function toggleToolsMenu(){
  const m = document.getElementById('tools-menu');
  m.style.display = m.style.display==='none'?'block':'none';
}
// Close tools menu when clicking outside
document.addEventListener('click', e=>{
  const wrap = document.getElementById('tools-menu-wrap');
  if(wrap && !wrap.contains(e.target)){
    document.getElementById('tools-menu').style.display='none';
  }
});
// ── TAB ────────────────────────────────────────────────────
function goTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  btn.classList.add('active');
  if(id==='alias')     { renderAlias(); renderFuentes(); }
  if(id==='precios')   renderPrecios();
  if(id==='historial') renderHistorial();
  if(id==='publico')   renderPublico();
  if(id==='usuarios')  renderUsuarios();
}


// ── Normalizar nombre de material (sin tildes, sin paréntesis, minúsculas) ──
function normName(s){
  return (s||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\([^)]*\)/g,'')
    .replace(/[°º\-\/]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
// ── FÓRMULA — usa precio del cliente asignado a la sucursal ──
function getPrecioCompra(m, suc){
  // 1. Precio explícitamente seleccionado para este material x sucursal
  if(PRECIO_SELECCIONADO[m.id]?.[suc]?.precio){
    return PRECIO_SELECCIONADO[m.id][suc].precio;
  }
  // 2. Mejor precio entre los clientes asignados a la sucursal
  const fuentes = SUCURSAL_FUENTE[suc];
  if(fuentes && fuentes.length){
    let mejor = 0;
    fuentes.forEach(f=>{
      const p = CLIENTES_PRECIOS[f]?.[m.id] || 0;
      if(p > mejor) mejor = p;
    });
    if(mejor > 0) return mejor;
  }
  return m.compra || 0;
}

function calc(m, factor=1, suc=null) {
  var si  = suc ? Math.max(0, SUCS.indexOf(suc)) : 0;
  var sp  = parseFloat(document.getElementById('cfg-spread-'+si)?.value||15)/100;
  var iva = parseFloat(document.getElementById('cfg-iva-'+si)?.value||19)/100;
  var compra = suc ? getPrecioCompra(m, suc) : (m.compra||0);
  // v85: flete/margen/mc por sucursal con fallback a base
  var flete = (suc && FLETE_POR_SUC[m.id] && FLETE_POR_SUC[m.id][suc]!==undefined) ? FLETE_POR_SUC[m.id][suc] : (m.flete||0);
  var margen = (suc && MARGEN_POR_SUC[m.id] && MARGEN_POR_SUC[m.id][suc]!==undefined) ? MARGEN_POR_SUC[m.id][suc] : m.margen;
  var mcSpread = (suc && MC_EJEC_POR_SUC[m.id] && MC_EJEC_POR_SUC[m.id][suc]!==undefined) ? MC_EJEC_POR_SUC[m.id][suc] : sp;
  var neto = compra - flete;
  // v85: permitir negativos (cobro por recibir)
  var maxR = neto*(1-margen)*(m.iva?1-iva:1)*factor;
  var pmax = Math.floor(maxR/10)*10;
  var plista = Math.floor(pmax*(1-mcSpread)/10)*10;
  var pejec = Math.floor((plista+pmax)/2/10)*10;
  var sinMargen = compra>0 && pmax<=0;
  // Override manual de P.Lista
  if(suc && PRECIO_OVERRIDE[m.id] && PRECIO_OVERRIDE[m.id][suc]!==undefined){
    plista = PRECIO_OVERRIDE[m.id][suc];
    if(pmax<plista) pmax=plista;
    pejec = Math.floor((plista+pmax)/2/10)*10;
  }
  var pctE = (suc && COMISION_EJEC_POR_SUC[m.id] && COMISION_EJEC_POR_SUC[m.id][suc]!==undefined) ? COMISION_EJEC_POR_SUC[m.id][suc] : 0;
  var utilidadLista = plista>0 ? plista - compra : 0;
  var comisionEjec = Math.round(utilidadLista * pctE);
  return {lista:plista, ejec:pejec, max:pmax, compra:compra, neto:neto, sinMargen:sinMargen, flete:flete, margen:margen, mcSpread:mcSpread, pctE:pctE, comisionEjec:comisionEjec};
}

// ── INIT SELECTS ────────────────────────────────────────────
function initSelects() {
  ['al-cat','pc-cat','pub-cat-f'].forEach(id=>{
    const sel = document.getElementById(id);
    if(!sel) return;
    CAT_ORDER.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;sel.appendChild(o);});
  });
  // Init alias fuente filter + carga fuente
  rebuildFuenteSelects();
  // Events
  document.getElementById('al-cat').addEventListener('change', renderAlias);
  document.getElementById('pc-cat').addEventListener('change', renderPrecios);
}

function rebuildFuenteSelects() {
  // ia-fuente is now a datalist input, not a select
  const iaList = document.getElementById('ia-fuente-list');
  if(iaList){
    iaList.innerHTML = FUENTES.map(f=>`<option value="${f}">`).join('');
  }
  ['al-fuente-f','cov-fuente-sel'].forEach(id=>{
    const sel = document.getElementById(id);
    if(!sel) return;
    const prev = sel.value;
    sel.innerHTML = id==='al-fuente-f' ? '<option value="">Todos los clientes</option>'
      : '<option value="">— Ver por cliente —</option>';
    FUENTES.forEach(f=>{const o=document.createElement('option');o.value=f;o.textContent=f;sel.appendChild(o);});
    if(prev) sel.value=prev;
  });
}
