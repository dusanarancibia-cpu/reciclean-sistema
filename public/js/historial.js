
// ═══════════════════════════════════════════════════════════
// D · HISTORIAL
// ═══════════════════════════════════════════════════════════
function setHTab(t,btn){
  htab=t;
  document.querySelectorAll('#panel-historial .btn-grp .btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderHistorial();
}
function renderHistorial(){
  const lista=HISTORIAL.filter(h=>h.tipo===htab);
  document.getElementById('tl-list').innerHTML=lista.map((v,i)=>{
    const isLast=i===lista.length-1;
    const chgs=v.items.filter(x=>x.anterior!==null&&x.precio!==x.anterior);
    return`<li class="tl-item">
      <div class="tl-dot ${isLast?'act':''}">${isLast?'★':'✓'}</div>
      <div class="tl-body">
        <div class="tl-date">${v.fecha} · ${v.autor}</div>
        <div class="tl-name">${v.label} <span class="badge ${isLast?'ba':'bn'}">${isLast?'ACTIVA':'archivada'}</span></div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:5px;">${v.desc}</div>
        <div class="tl-chips">
          ${chgs.slice(0,5).map(c=>`<span class="badge ${c.precio>c.anterior?'bg':'br'}" style="cursor:pointer;" onclick="showHD(${v.id})">${c.nombre.split(' ').slice(0,2).join(' ')}: ${fmt(c.precio)}</span>`).join('')}
          ${chgs.length>5?`<span class="badge bn" style="cursor:pointer;" onclick="showHD(${v.id})">+${chgs.length-5}</span>`:''}
          ${chgs.length===0?'<span style="font-size:11px;color:var(--text3);">Sin cambios</span>':''}
        </div>
      </div>
    </li>`;
  }).reverse().join('');
  if(lista.length>0)showHD(lista[lista.length-1].id);
}
function showHD(vid){
  const v=HISTORIAL.find(x=>x.id===vid);if(!v)return;
  document.getElementById('hd-title').textContent=v.label;
  document.getElementById('hd-sub').textContent=v.desc+' · '+v.autor;
  document.getElementById('hd-tbody').innerHTML=v.items.map(it=>{
    const chg=it.anterior!==null&&it.precio!==it.anterior;
    const cls=chg?(it.precio>it.anterior?'up':'dn'):'';
    const pct=it.anterior&&it.anterior>0?((it.precio-it.anterior)/it.anterior*100).toFixed(1):'—';
    return`<tr><td class="mat">${it.nombre}</td><td class="num ${cls}">${fmt(it.precio)}</td><td class="num" style="color:var(--text3)">${it.anterior!==null?fmt(it.anterior):'—'}</td><td class="num ${cls}">${it.anterior&&it.anterior>0?(it.precio>it.anterior?'↑ +':'↓ ')+pct+'%':'—'}</td></tr>`;
  }).join('')||'<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:20px;">Sin detalle</td></tr>';
}

// ═══════════════════════════════════════════════════════════
// E · TABLAS PÚBLICAS
// ═══════════════════════════════════════════════════════════
function setPubSuc(s,btn){
  pubSuc=s;
  document.querySelectorAll('#pub-suc-grp .btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderPublico();
}
function renderPublico(){
  const catF=document.getElementById('pub-cat-f').value;
  const fecha=new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'});
  const sucs=pubSuc==='todas'?SUCS:[pubSuc];

  let html=`<table class="pub-t" style="width:100%;border-collapse:collapse;">
    <thead><tr><th>Material</th>${sucs.map(s=>`<th style="text-align:right;">${s}</th>`).join('')}</tr></thead><tbody>`;

  const cats=catF?[catF]:CAT_ORDER;
  cats.forEach(cat=>{
    // Usar mats (dinámico) en lugar de MATS_LOCAL (estático)
    const cm=mats.filter(m=>m.cat===cat&&m.activo!==false&&sucs.some(s=>calc(m,SUC_FACTOR[s]||1,s).lista>0));
    if(!cm.length)return;
    html+=`<tr class="pub-cat"><td colspan="${sucs.length+1}">${cat}</td></tr>`;
    cm.forEach(m=>{
      html+=`<tr><td>${m.nombre}</td>${sucs.map(s=>{
        const f=SUC_FACTOR[s]||1;
        const p=calc(m,f,s).lista||0;
        return`<td style="text-align:right;font-family:'Roboto Mono',monospace;font-size:12px;font-weight:500;">${p>0?'$'+p.toLocaleString('es-CL'):'—'}</td>`;
      }).join('')}</tr>`;
    });
  });
  html+=`</tbody></table>`;

  const full=`<!-- Precios Reciclean-Farex · ${pubSuc==='todas'?'Todas las sucursales':pubSuc} · ${fecha} -->\n<p style="font-size:11px;color:#888;margin-bottom:10px;">Precios referenciales CLP/kg · ${fecha} · *Sujetos a cambio</p>\n${html}\n<p style="font-size:10px;color:#aaa;margin-top:8px;">+56 9 9534 2437 · comercial@gestionrepchile.cl</p>`;
  document.getElementById('pub-preview').innerHTML=full;
  document.getElementById('pub-code').value=full;
}
function copiarHTML(){
  navigator.clipboard.writeText(document.getElementById('pub-code').value)
    .then(()=>toast('✓ HTML copiado','ok'));
}
function descargarHTML(){
  const fecha=new Date().toISOString().split('T')[0].replace(/-/g,'');
  const suc=(pubSuc==='todas'?'todas':pubSuc).replace(/\s/g,'-');
  const blob=new Blob([`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Precios ${pubSuc}</title><style>body{font-family:sans-serif;max-width:900px;margin:40px auto;padding:0 20px;}h1{font-size:20px;margin-bottom:4px;}p.s{font-size:11px;color:#888;margin-bottom:16px;}</style></head><body><h1>Lista de Precios · ${pubSuc}</h1><p class="s">Grupo Reciclean-Farex · Precios referenciales CLP/kg</p>${document.getElementById('pub-preview').innerHTML}
</body></html>`],{type:'text/html;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nombreDescarga('html');a.click();
  toast('✓ HTML descargado','ok');
  driveUpload(blob, nombreDescarga('html'), 'Historial');
}
function descargarCSV(){
  var suc = pubSuc;
  var fecha = new Date().toISOString().split("T")[0].replace(/-/g,"");
  var sucLabel = (suc==="todas"?"todas":suc).replace(/\s/g,"-");
  var rows = ["Material,Categoria,P.Lista,P.Ejecutivo,P.Maximo"];
  var catF = document.getElementById("pub-cat-f")?.value||"";
  mats.filter(function(m){return m.activo!==false;}).forEach(function(m){
    if(catF && m.cat!==catF) return;
    var factor = suc!=="todas" ? (SUC_FACTOR[suc]||1) : 1;
    var cv = calc(m, factor, suc!=="todas"?suc:null);
    if(cv.lista <= 0) return;
    var nombre = m.nombre.replace(/,/g," ");
    var cat = m.cat.replace(/,/g," ");
    rows.push(nombre+","+cat+","+cv.lista+","+cv.ejec+","+cv.max);
  });
  var csvContent = rows.join(String.fromCharCode(10));
  var blob = new Blob([csvContent], {type:"text/csv;charset=utf-8;"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombreDescarga('csv');
  a.click();
  toast("CSV descargado","ok");
  driveUpload(blob, nombreDescarga('csv'), 'Historial');
}

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════
function toast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='toast '+type+' show';
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3500);
}
