
// ═══════════════════════════════════════════════════════════
// C · CARGA CON IA (imagen/PDF real)
// ═══════════════════════════════════════════════════════════
function limpiarDrop(){
  document.getElementById('ia-file').value='';
  document.getElementById('drop-title').textContent='Arrastra o clic para seleccionar';
  document.getElementById('drop-sub').textContent='Imagen JPG/PNG · PDF · Excel · CSV · TXT';
  document.getElementById('drop-icon').textContent='📄';
  document.getElementById('btn-clear-drop').style.display='none';
  document.getElementById('drop-ia').style.borderColor='';
  // Limpiar resultado anterior para evitar mostrar datos obsoletos
  iaData=[];
  document.getElementById('ia-result').style.display='none';
  document.getElementById('ia-empty').style.display='block';
}

function onFileSelect(inp){
  const f=inp.files[0];if(!f)return;
  if(f.size > CONFIG.MAX_FILE_SIZE){ toast("Archivo muy grande (max 10MB)","warn"); inp.value=""; return; }
  document.getElementById('drop-title').textContent=f.name;
  document.getElementById('drop-sub').textContent=(f.size/1024).toFixed(1)+' KB · '+f.type;
  document.getElementById('drop-icon').textContent=f.type.startsWith('image/')?'🖼️':f.type.includes('pdf')?'📑':'📄';
  document.getElementById('btn-clear-drop').style.display='block';
  document.getElementById('drop-ia').style.borderColor='var(--green)';
  toast('📎 '+f.name+' listo');
}
function handleDrop(e){
  e.preventDefault();
  document.getElementById('drop-ia').classList.remove('drag');
  const f=e.dataTransfer.files[0];
  if(f){
    const dt=new DataTransfer();dt.items.add(f);
    document.getElementById('ia-file').files=dt.files;
    onFileSelect(document.getElementById('ia-file'));
  }
}

async function fileToContent(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    if(file.type.startsWith('image/')){
      reader.onload=e=>resolve({type:'image',mediaType:file.type,data:e.target.result.split(',')[1]});
      reader.readAsDataURL(file);
    } else if(file.type==='application/pdf'){
      // Try text extraction from PDF bytes
      reader.onload=e=>{
        const arr=new Uint8Array(e.target.result);
        let txt='';
        // Extract ASCII text spans from PDF
        let i=0;
        while(i<Math.min(arr.length,200000)){
          if(arr[i]===40){ // '('
            let s='';i++;
            while(i<arr.length&&arr[i]!==41&&s.length<200){
              if(arr[i]>31&&arr[i]<127)s+=String.fromCharCode(arr[i]);
              i++;
            }
            if(s.length>2)txt+=s+' ';
          }else i++;
        }
        resolve({type:'text',content:txt.slice(0,8000)||'[PDF sin texto extraíble — intenta pegar el texto manualmente]'});
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload=e=>resolve({type:'text',content:e.target.result.slice(0,10000)});
      reader.readAsText(file,'utf-8');
    }
    reader.onerror=reject;
  });
}

// ── PARSER LOCAL (sin API) ─────────────────────────────────
// Extrae precios desde texto con formato limpio: "Material: precio"
function parseTextoLocal(texto, fuente){
  const lineas = texto.split('\n').map(l=>l.trim()).filter(l=>l.length>2);
  const resultados = [];
  // Regex: captura "nombre: $precio", "nombre | precio" o "nombre: precio"
  const RE = /^(.{2,60}?)[:|]\s*\$?\s*(\d[\d.,]*)\s*(?:a\s*\$?\s*(\d[\d.,]*))?/i;
  const NO_RECIBE = /no se recibe|no compra|no aplica|sin precio/i;

  lineas.forEach(linea => {
    // Ignorar líneas de encabezado/separador
    if(/^[-=*#]{3,}/.test(linea)) return;
    if(/^(cliente|dirección|direccion|comuna|informado|fecha|observ)/i.test(linea)) return;
    if(/^(CARTON|PLASTICO|VIDRIO|PAPEL|FIERRO|METAL|ALUMIN|COBRE)/i.test(linea) && !linea.includes(':') && !linea.includes('|')) return;

    // No se recibe
    if(NO_RECIBE.test(linea)){
      const nom = linea.split(':')[0].trim();
      if(nom.length>2) resultados.push({empresa:fuente||'—',nombre:nom,precio_clp_kg:0,confianza:'baja',nota:'no se recibe'});
      return;
    }

    const m = RE.exec(linea);
    if(!m) return;
    const nombre = m[1].trim().replace(/^\*+|\*+$/g,'').trim();
    if(nombre.length < 2) return;
    const p1 = parseFloat(m[2].replace(/\./g,'').replace(',','.'));
    const p2 = m[3] ? parseFloat(m[3].replace(/\./g,'').replace(',','.')) : null;
    // Usar el mínimo si hay rango
    const precio = p2 ? Math.min(p1,p2) : p1;
    const nota   = p2 ? `$${Math.round(p1)} a $${Math.round(p2)}` : '';
    if(!isNaN(precio) && precio >= 0){
      resultados.push({empresa:fuente||'—',nombre,precio_clp_kg:Math.round(precio),confianza:'alta',nota});
    }
  });
  return resultados;
}

// ── CARGA MASIVA: múltiples TXT de una vez ────────────────
async function procesarBatch(input){
  if(window._procesando) return; window._procesando=true;
  const files = [...input.files];
  if(!files.length){ window._procesando=false; return; }

  let totalMats=0, totalClientes=0, errores=[];

  // Mostrar progreso
  const progEl = document.getElementById('ia-empty');
  progEl.style.display='block';
  progEl.innerHTML=`<div style="font-size:13px;font-weight:600;color:var(--text2);">⏳ Procesando ${files.length} archivo${files.length>1?'s':''}...</div>`;

  for(const file of files){
    try{
      const texto = await file.text();
      // Extraer nombre del cliente desde primera línea "CLIENTE: xxx"
      const primeraLinea = texto.split('\n')[0].trim();
      const matchCliente = primeraLinea.match(/^CLIENTE:\s*(.+)/i);
      const fuente = matchCliente ? matchCliente[1].trim() : file.name.replace('precios_','').replace(/_\d+.*\.txt$/i,'').replace(/_/g,' ').trim();

      if(!fuente){
        errores.push(`${file.name}: sin nombre de cliente`);
        continue;
      }

      // Agregar fuente si no existe
      if(!FUENTES.includes(fuente)){
        FUENTES.push(fuente);
        if(_db) await idbSaveFuente(fuente);
      }

      // Parsear precios
      const items = parseTextoLocal(texto, fuente);
      if(!items.length){
        errores.push(`${fuente}: 0 materiales reconocidos`);
        continue;
      }

      // Aplicar precios — mapeo directo por nombre (sin aliases, sin KMAP)
      let count=0, sinMapeo=[], conflictos=[];
      items.forEach(item=>{
        let matId=null;
        const qn = normName(item.nombre||'');
        if(!qn) return;
        // 1. Match exacto por nombre normalizado
        const exact = mats.find(m=>normName(m.nombre)===qn);
        if(exact){ matId=exact.id; }
        // 2. Match con expansión de abreviaciones comunes
        if(!matId){
          const expanded = qn
            // Patrones específicos ANTES de expandir prefijos
            .replace(/^cu tubo$/,'cobre 1 tubo')
            .replace(/^cu tercera$/,'cobre 3ra').replace(/^cu 3ra$/,'cobre 3ra')
            .replace(/^cu calefonts$/,'cobre calefon').replace(/^cu calefones$/,'cobre calefon')
            .replace(/^cu radiador chico$/,'cobre radiador chico')
            .replace(/^cu radiador$/,'cobre radiador')
            .replace(/^cu ni$/,'cobre niquel')
            .replace(/^cu esmaltado$/,'cobre esmaltado')
            .replace(/^br amarillo$/,'bronce amarillo').replace(/^br colorado$/,'bronce colorado')
            .replace(/^br contaminado$/,'bronce contaminado')
            .replace(/^al off set$/,'aluminio off set').replace(/^al offset$/,'aluminio off set')
            .replace(/^al perfil a$/,'aluminio perfil a').replace(/^al perfil b$/,'aluminio perfil b')
            .replace(/^al ubc$/,'aluminio ubc').replace(/^al duro lata$/,'aluminio duro lata')
            .replace(/^al duro$/,'aluminio duro').replace(/^al blando$/,'aluminio blando')
            .replace(/^al radiador$/,'aluminio radiador')
            .replace(/^al cu radiador$/,'aluminio radiador mixto')
            .replace(/^al foil$/,'aluminio foil').replace(/^al pomo$/,'aluminio pomos')
            .replace(/^al zn luminarias$/,'aluminio zn luminarias')
            .replace(/^magnetico$/,'bronce magnetico')
            .replace(/^acero 316$/,'acero inoxidable 316').replace(/^acero 304$/,'acero inoxidable 304')
            .replace(/^calefont$/,'cobre calefon')
            // Expansión de prefijos (fallback para formas no listadas arriba)
            .replace(/^cu /,'cobre ').replace(/^br /,'bronce ').replace(/^al /,'aluminio ')
            .replace(/^ss /,'acero inoxidable ')
            // Sustituciones de nombres
            .replace('zink','zinc').replace('tercera','3ra')
            .replace('lata de fierro','lata chatarra').replace('lata de bebida','aluminio ubc')
            .replace('radiador de cobre','cobre radiador').replace('radiador aluminio','aluminio radiador')
            .replace('pet clear','pet transparente').replace('fierro lata chatarra','lata chatarra')
            .replace('pet todo tipo','pet mezclado').replace('otros pet','pet mezclado')
            .replace('hdpe color','hdpe pp inyeccion').replace('hdpe cajas','hdpe pp inyeccion')
            .replace('caramelo limpio','polietileno limpio').replace('polietileno sucio','polietileno lavado')
            .replace('semimixto','carton').replace('carton y papeles mezclado','carton')
            .replace('bidon fardo','bidon sacas pallet').replace(/^bins$/,'bidon sacas pallet')
            .replace('ldpe strech film','polietileno limpio')
            .replace(/^alu /,'aluminio ').replace(/^bid /,'bidon ')
            .replace(/^inox /,'acero inoxidable ').replace(/^ac inox/,'acero inoxidable')
            .replace(/^fierro chico$/,'fierro corto').replace(/^fierro grande$/,'fierro largo')
            .replace(/^pp inyeccion$/,'hdpe pp inyeccion').replace(/^papel mixto$/,'carton')
            .replace(/^cobre tubo$/,'cobre 1 tubo').replace(/^zinc anodo$/,'zinc anodos')
            // Fallback final
            .replace(/^bronce$/,'bronce amarillo')
            .replace(/^acero inoxidable$/,'acero inoxidable 304');
          const exp = mats.find(m=>normName(m.nombre)===expanded);
          if(exp){ matId=exp.id; }
        }
        // 3. Match parcial: nombre del material empieza con el texto del TXT
        if(!matId){
          const partial = mats.filter(m=>normName(m.nombre).startsWith(qn) && qn.length>=4);
          if(partial.length===1) matId=partial[0].id;
        }
        // 4. Match inverso: texto del TXT empieza con nombre del material
        if(!matId){
          const inv = mats.filter(m=>qn.startsWith(normName(m.nombre)) && normName(m.nombre).length>=4);
          if(inv.length===1) matId=inv[0].id;
        }
        if(!matId){ sinMapeo.push(item.nombre+': $'+item.precio_clp_kg); return; }
        const m=mats.find(x=>x.id===matId);
        if(m&&item.precio_clp_kg>0){
          if(!CLIENTES_PRECIOS[fuente]) CLIENTES_PRECIOS[fuente]={};
          // PRIMER precio gana — si ya hay precio para este matId, NO sobreescribir
          if(CLIENTES_PRECIOS[fuente][matId] !== undefined){
            conflictos.push(`${item.nombre} $${item.precio_clp_kg} → ${m.nombre} (ya tiene $${CLIENTES_PRECIOS[fuente][matId]}, se mantiene el primero)`);
            return;
          }
          CLIENTES_PRECIOS[fuente][matId]=item.precio_clp_kg;
          m.compra=item.precio_clp_kg;
          if(!cambios[matId]) cambios[matId]={};
          cambios[matId].compra=item.precio_clp_kg;
          count++;
        }
      });
      if(sinMapeo.length) errores.push(`${fuente}: ${sinMapeo.length} sin mapeo → ${sinMapeo.join(', ')}`);
      if(conflictos.length) errores.push(`${fuente}: ${conflictos.length} duplicado${conflictos.length>1?'s':''} ignorado${conflictos.length>1?'s':''} → ${conflictos.join(' | ')}`);
      totalMats+=count;
      totalClientes++;
      progEl.innerHTML=`<div style="font-size:12px;color:var(--text2);">✓ ${fuente}: ${count} materiales<br><span style="color:var(--text3);font-size:10px;">${totalClientes}/${files.length} archivos procesados</span></div>`;
    }catch(err){
      errores.push(`${file.name}: ${err.message}`);
    }
  }

  // Guardar todo
  await idbSaveDraft();
  if(_db) await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  rebuildFuenteSelects();
  renderFuentes();
  renderPreview();

  // Mostrar resultado final
  const errHtml = errores.length ? `<div style="font-size:10px;color:var(--red);margin-top:8px;">${errores.join('<br>')}</div>` : '';
  progEl.innerHTML=`
    <div style="font-size:15px;margin-bottom:8px;">✅</div>
    <div style="font-size:13px;font-weight:700;color:var(--text);">${totalClientes} clientes · ${totalMats} precios cargados</div>
    <div style="font-size:11px;color:var(--text3);margin-top:4px;">Revisa el banner en Precios & Márgenes y publica cuando estés listo</div>
    ${errHtml}`;
  toast(`✓ Carga masiva: ${totalClientes} clientes, ${totalMats} materiales`,'ok');
  input.value=''; // reset file input
  window._procesando=false;
}

async function procesarIA(){
  if(window._procesandoIA) return; window._procesandoIA=true;
  const fuente=document.getElementById('ia-fuente').value;
  const texto=document.getElementById('ia-text').value.trim();
  const file=document.getElementById('ia-file').files[0];
  if(!texto&&!file){toast('Sube un archivo o pega texto','warn');window._procesandoIA=false;return;}

  document.getElementById('ia-empty').style.display='none';
  document.getElementById('ia-result').style.display='none';
  document.getElementById('ia-loading').style.display='block';
  document.getElementById('ia-load-sub').textContent='Procesando archivo...';

  // Si es texto pegado, intentar parser local primero (funciona sin internet)
  if(texto && !file){
    document.getElementById('ia-load-sub').textContent='Analizando texto...';
    const local = parseTextoLocal(texto, fuente);
    if(local.length > 0){
      document.getElementById('ia-loading').style.display='none';
      document.getElementById('ia-empty').style.display='none';
      mostrarResultadoIA(local, fuente);
      return;
    }
  }

  // Si es un archivo TXT o CSV → leer contenido y usar parser local directamente
  if(file && (file.type==='text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv'))){
    document.getElementById('ia-load-sub').textContent='Leyendo archivo de texto...';
    try{
      const txtContent = await new Promise((res,rej)=>{
        const r=new FileReader();
        r.onload=e=>res(e.target.result);
        r.onerror=rej;
        r.readAsText(file,'utf-8');
      });
      const local = parseTextoLocal(txtContent, fuente);
      if(local.length > 0){
        document.getElementById('ia-loading').style.display='none';
        document.getElementById('ia-empty').style.display='none';
        mostrarResultadoIA(local, fuente);
        return;
      }
      // Si el parser no encontró nada, continuar con API
    }catch(e){ console.warn('Error leyendo TXT:', e); }
  }

  let content={type:'text',content:texto};
  if(!texto&&file){
    try{content=await fileToContent(file);}
    catch(e){toast('Error leyendo archivo: '+e.message,'err');document.getElementById('ia-loading').style.display='none';document.getElementById('ia-empty').style.display='block';return;}
  }

  document.getElementById('ia-load-sub').textContent='Enviando a Claude API...';
  // Limpiar aviso anterior si existe
  const oldWarn=document.getElementById('ia-api-warn');
  if(oldWarn) oldWarn.remove();
  document.getElementById('ia-load-sub').insertAdjacentHTML('afterend','<div id="ia-api-warn" style="font-size:9px;color:rgba(255,165,0,.8);margin-top:4px;">(requiere internet — si falla, usa el texto en el área de texto)</div>');

  // Si el usuario especificó clientes, usarlos; si no, pedir detección automática
  const fuentesHint = fuente
    ? `El documento es del cliente "${fuente}". Si ves múltiples empresas en columnas, extrae todas de todos modos.`
    : `DETECTA AUTOMÁTICAMENTE los nombres de empresas/clientes que aparecen como columnas o encabezados.`;

  const PROMPT=`Eres experto en reciclaje de materiales en Chile. Analiza este documento de precios.

${fuentesHint}

FORMATO DE TABLA — MUY IMPORTANTE:
Si el documento tiene una tabla con empresas en columnas y materiales en filas:
- Cada columna = una empresa compradora
- Cada fila = un material
- Celda vacía = esa empresa no compra ese material (NO incluir)
- Solo incluye filas donde hay precio real

CÓMO INTERPRETAR PRECIOS:
- Rango con "a":   "$160 a $200"  → usar el MÍNIMO = 160
- Rango sin "a":   "$190 $210"    → usar el MÍNIMO = 190
- Rango con guión: "$150-$160"    → usar el MÍNIMO = 150
- Precio único:    "$300" o "$ 300" o "300" → usar directo
- Notas entre paréntesis "(Solo papel Bond)", "(Sin Tapas)" → guardar en campo "nota"
- Celda vacía / en blanco → NO incluir ese par empresa-material

MATERIALES CHILENOS — EQUIVALENCIAS:
- Cartón / Cartón Corrugado / OCC → "Cartón Corrugado"
- Blanco 2 / Papel Blanco → "Papel Blanco 2"
- PET transparente / PET claro / PET cristal → "PET Transparente"
- PET Todo tipo / PET mixto → incluir tal cual
- Vidrio / Botellas vidrio → "Vidrio de Botellas"
- Pesquero / PE Lavado / Polietileno Lavado → "Polietileno para Lavado"
- Semimixto / Papel mezclado / Cartón mezclado → incluir tal cual
- Caramelo → plásticos rígidos
- Bidón / IBC / sacas → soplados

REGLA: Incluye TODOS los pares empresa-material que tengan precio. Mejor incluir con confianza "baja" que omitir.

Responde SOLO en JSON sin texto adicional ni markdown:
{
  "empresas_detectadas": ["EMPRESA1", "EMPRESA2"],
  "materiales": [
    {"empresa": "EMPRESA1", "nombre": "Cartón", "precio_clp_kg": 120, "confianza": "alta", "nota": ""}
  ]
}

Si no hay precios: {"empresas_detectadas":[], "materiales":[]}`;

  try{
    let messages;
    if(content.type==='image'){
      messages=[{role:'user',content:[{type:'image',source:{type:'base64',media_type:content.mediaType,data:content.data}},{type:'text',text:PROMPT}]}];
    }else{
      messages=[{role:'user',content:PROMPT+'\n\nLista a analizar:\n'+content.content}];
    }
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
    if(!res.ok){
      const errData = await res.json().catch(()=>({}));
      const errMsg = errData?.error?.message || 'HTTP '+res.status;
      throw new Error(errMsg);
    }
    const data=await res.json();
    const raw=data.content?.[0]?.text||'{}';
    let parsed;
    try{parsed=JSON.parse(raw.replace(/```json|```/g,'').trim());}
    catch(pe){
      console.warn('JSON parse error:', pe, 'raw:', raw.slice(0,200));
      parsed={materiales:[]};
    }
    // Handle both old format {materiales:[{nombre,precio_clp_kg}]}
    // and new format {empresas_detectadas:[], materiales:[{empresa,nombre,precio_clp_kg}]}
    const items = parsed.materiales||[];
    // If no empresa field, assign the fuente entered by user
    const normalized = items.map(it=>({
      ...it,
      empresa: it.empresa || fuente || '—'
    }));
    mostrarResultadoIA(normalized, fuente);
  }catch(e){
    console.warn('API error:', e);
    _iaAbort = null;
    const cdEl2=document.getElementById('ia-countdown');
    if(cdEl2) cdEl2.textContent='';

    // Para imágenes: intentar OCR local con Tesseract.js (se carga dinámicamente)
    if(content.type==='image'){
      document.getElementById('ia-load-sub').textContent='Cargando OCR local...';
      try{
        // Cargar Tesseract solo si no está cargado
        if(typeof Tesseract === 'undefined'){
          await new Promise((res,rej)=>{
            const s=document.createElement('script');
            s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            s.onload=res; s.onerror=rej;
            document.head.appendChild(s);
          });
        }
        if(typeof Tesseract === 'undefined') throw new Error('sin internet');
        const loadSub = document.getElementById('ia-load-sub');
        const worker = await Tesseract.createWorker('spa+eng', 1, {
          logger: m => {
            if(loadSub && m.progress){
              loadSub.textContent = `OCR local: ${Math.round(m.progress*100)}%`;
            }
          }
        });
        // Convertir base64 a blob para Tesseract
        const byteStr = atob(content.data);
        const ab = new ArrayBuffer(byteStr.length);
        const ia = new Uint8Array(ab);
        for(let i=0;i<byteStr.length;i++) ia[i]=byteStr.charCodeAt(i);
        const blob = new Blob([ab],{type:content.mediaType});
        const url  = URL.createObjectURL(blob);
        const { data: { text } } = await worker.recognize(url);
        await worker.terminate();
        URL.revokeObjectURL(url);
        // Pasar texto extraído al parser local
        const ocrResult = parseTextoLocal(text, fuente);
        document.getElementById('ia-loading').style.display='none';
        document.getElementById('ia-load-sub').textContent='Enviando a Claude API';
        if(ocrResult.length > 0){
          mostrarResultadoIA(ocrResult, fuente);
          toast(`📸 OCR extrajo ${ocrResult.length} materiales localmente`,'ok');
        } else {
          // OCR no encontró precios — mostrar texto crudo para que el usuario lo revise
          document.getElementById('ia-text').value = text.slice(0,3000);
          document.getElementById('ia-empty').style.display='block';
          toast('📸 OCR completado — revisa el texto extraído y presiona Procesar','warn');
        }
        return;
      }catch(ocrErr){
        console.warn('OCR error:', ocrErr);
        document.getElementById('ia-loading').style.display='none';
        document.getElementById('ia-load-sub').textContent='Enviando a Claude API';
        document.getElementById('ia-empty').style.display='block';
        document.getElementById('ia-empty').innerHTML=`
          <div style="font-size:28px;margin-bottom:12px;">📡</div>
          <div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:6px;">Sin conexión a internet</div>
          <div style="font-size:11px;color:var(--text3);line-height:1.6;max-width:280px;margin:0 auto;">
            Para procesar imágenes se necesita internet.<br><br>
            <strong>Alternativa:</strong> Usa el TXT generado para este cliente — funciona sin internet.
          </div>`;
        toast('⚠ Sin internet — usa el TXT del cliente','warn');
        return;
      }
    }

    document.getElementById('ia-loading').style.display='none';
    document.getElementById('ia-load-sub').textContent='Enviando a Claude API';

    // Para texto: usar demo solo si hay fuente conocida
    if(fuente && getDemoIA(fuente).length > 1){
      toast('⚠ Sin conexión — mostrando datos de ejemplo para '+fuente,'warn');
      mostrarResultadoIA(getDemoIA(fuente), fuente);
    } else {
      document.getElementById('ia-empty').style.display='block';
      toast('⚠ Sin conexión — pega el texto del cliente para usar el parser local','warn');
    }
    return;
  } // fin catch
} // fin procesarIA

function getDemoIA(fuente){
  if(!fuente){
    // Demo: imagen multi-empresa (RECICLA SPA / RECICLADOS INDUSTRIALES / RIO ACONCAGUA)
    return [
      {empresa:'RECICLA SPA',nombre:'Carton',precio_clp_kg:120,confianza:'alta',nota:''},
      {empresa:'RECICLA SPA',nombre:'Carton y Papeles Mezclado',precio_clp_kg:120,confianza:'alta',nota:''},
      {empresa:'RECICLA SPA',nombre:'PET transparente',precio_clp_kg:550,confianza:'alta',nota:''},
      {empresa:'RECICLA SPA',nombre:'Vidrio',precio_clp_kg:60,confianza:'alta',nota:''},
      {empresa:'RECICLA SPA',nombre:'Semimixto',precio_clp_kg:80,confianza:'media',nota:''},
      {empresa:'RECICLADOS INDUSTRIALES',nombre:'Carton',precio_clp_kg:40,confianza:'alta',nota:''},
      {empresa:'RECICLADOS INDUSTRIALES',nombre:'Blanco 2',precio_clp_kg:140,confianza:'alta',nota:''},
      {empresa:'RECICLADOS INDUSTRIALES',nombre:'Blanco 3',precio_clp_kg:80,confianza:'alta',nota:'Solo papel Bond'},
      {empresa:'RECICLADOS INDUSTRIALES',nombre:'Duplex',precio_clp_kg:30,confianza:'alta',nota:''},
      {empresa:'RECICLADOS INDUSTRIALES',nombre:'PET Todo tipo',precio_clp_kg:630,confianza:'alta',nota:'Sin Tapas'},
      {empresa:'RECICLADOS INDUSTRIALES',nombre:'Tissue',precio_clp_kg:50,confianza:'alta',nota:''},
      {empresa:'RIO ACONCAGUA',nombre:'Carton',precio_clp_kg:80,confianza:'alta',nota:''},
    ];
  }
  const demos={
    HUAL:[{empresa:'HUAL',nombre:'Copper No.1 Bare Bright',precio_clp_kg:9700,confianza:'alta',nota:''},{empresa:'HUAL',nombre:'Copper No.2 Scrap',precio_clp_kg:9600,confianza:'alta',nota:''},{empresa:'HUAL',nombre:'Yellow Brass',precio_clp_kg:6350,confianza:'alta',nota:''},{empresa:'HUAL',nombre:'Red Brass',precio_clp_kg:8100,confianza:'alta',nota:''}],
    PECH:[{empresa:'PECH',nombre:'Acero Corto 80cm',precio_clp_kg:210,confianza:'alta',nota:''},{empresa:'PECH',nombre:'Acero Largo 3m',precio_clp_kg:195,confianza:'alta',nota:''},{empresa:'PECH',nombre:'Lata Chatarra Industrial',precio_clp_kg:195,confianza:'alta',nota:''}],
    FPC:[{empresa:'FPC',nombre:'Cartón OCC',precio_clp_kg:120,confianza:'alta',nota:''},{empresa:'FPC',nombre:'ONP/Blanco',precio_clp_kg:140,confianza:'media',nota:''},{empresa:'FPC',nombre:'Vidrio Botellas',precio_clp_kg:60,confianza:'alta',nota:''}],
    MAMUT:[{empresa:'MAMUT',nombre:'Pesquero',precio_clp_kg:160,confianza:'alta',nota:'$160 a $200'},{empresa:'MAMUT',nombre:'Film de bolo',precio_clp_kg:150,confianza:'alta',nota:'$150 a $160'},{empresa:'MAMUT',nombre:'Film',precio_clp_kg:0,confianza:'baja',nota:'no se recibe'},{empresa:'MAMUT',nombre:'Polietileno Lavado',precio_clp_kg:230,confianza:'alta',nota:'$230 a $260'},{empresa:'MAMUT',nombre:'Cinta riego',precio_clp_kg:190,confianza:'alta',nota:'$190 a $210'},{empresa:'MAMUT',nombre:'Invernadero',precio_clp_kg:190,confianza:'alta',nota:'$190 $210'}],
    ADASME:[{empresa:'ADASME',nombre:'Pet Clear',precio_clp_kg:720,confianza:'alta',nota:''},{empresa:'ADASME',nombre:'Pet Color',precio_clp_kg:400,confianza:'alta',nota:''},{empresa:'ADASME',nombre:'Tapas Bebidas',precio_clp_kg:200,confianza:'alta',nota:''},{empresa:'ADASME',nombre:'Bidón Fardo',precio_clp_kg:350,confianza:'alta',nota:''}],
  };
  const k=fuente.toUpperCase();
  const match=Object.keys(demos).find(d=>k.includes(d)||d.includes(k));
  return match?demos[match]:[{empresa:fuente,nombre:'Material A',precio_clp_kg:200,confianza:'media',nota:'demo'}];
}

function mostrarResultadoIA(items, fuente){
  window._procesandoIA=false;
  // Ocultar estado vacío y loading
  document.getElementById('ia-empty').style.display='none';
  document.getElementById('ia-loading').style.display='none';

  if(!items.length){
    document.getElementById('ia-empty').style.display='block';
    toast('Sin precios encontrados — revisa el texto','warn');
    return;
  }

  // ── Mapear cada item al catálogo (por nombre directo, sin KMAP) ──
  iaData = items.map(item=>{
    let matId=null, matNom=null;
    const qn = normName(item.nombre||'');
    // 1. Match exacto normalizado
    const exact = mats.find(m=>normName(m.nombre)===qn);
    if(exact) matId=exact.id;
    // 2. Expansión de abreviaciones
    if(!matId){
      const expanded = qn
            // Patrones específicos ANTES de expandir prefijos
            .replace(/^cu tubo$/,'cobre 1 tubo')
            .replace(/^cu tercera$/,'cobre 3ra').replace(/^cu 3ra$/,'cobre 3ra')
            .replace(/^cu calefonts$/,'cobre calefon').replace(/^cu calefones$/,'cobre calefon')
            .replace(/^cu radiador chico$/,'cobre radiador chico')
            .replace(/^cu radiador$/,'cobre radiador')
            .replace(/^cu ni$/,'cobre niquel')
            .replace(/^cu esmaltado$/,'cobre esmaltado')
            .replace(/^br amarillo$/,'bronce amarillo').replace(/^br colorado$/,'bronce colorado')
            .replace(/^br contaminado$/,'bronce contaminado')
            .replace(/^al off set$/,'aluminio off set').replace(/^al offset$/,'aluminio off set')
            .replace(/^al perfil a$/,'aluminio perfil a').replace(/^al perfil b$/,'aluminio perfil b')
            .replace(/^al ubc$/,'aluminio ubc').replace(/^al duro lata$/,'aluminio duro lata')
            .replace(/^al duro$/,'aluminio duro').replace(/^al blando$/,'aluminio blando')
            .replace(/^al radiador$/,'aluminio radiador')
            .replace(/^al cu radiador$/,'aluminio radiador mixto')
            .replace(/^al foil$/,'aluminio foil').replace(/^al pomo$/,'aluminio pomos')
            .replace(/^al zn luminarias$/,'aluminio zn luminarias')
            .replace(/^magnetico$/,'bronce magnetico')
            .replace(/^acero 316$/,'acero inoxidable 316').replace(/^acero 304$/,'acero inoxidable 304')
            .replace(/^calefont$/,'cobre calefon')
            // Expansión de prefijos (fallback para formas no listadas arriba)
            .replace(/^cu /,'cobre ').replace(/^br /,'bronce ').replace(/^al /,'aluminio ')
            .replace(/^ss /,'acero inoxidable ')
            // Sustituciones de nombres
            .replace('zink','zinc').replace('tercera','3ra')
            .replace('lata de fierro','lata chatarra').replace('lata de bebida','aluminio ubc')
            .replace('radiador de cobre','cobre radiador').replace('radiador aluminio','aluminio radiador')
            .replace('pet clear','pet transparente').replace('fierro lata chatarra','lata chatarra')
            .replace('pet todo tipo','pet mezclado').replace('otros pet','pet mezclado')
            .replace('hdpe color','hdpe pp inyeccion').replace('hdpe cajas','hdpe pp inyeccion')
            .replace('caramelo limpio','polietileno limpio').replace('polietileno sucio','polietileno lavado')
            .replace('semimixto','carton').replace('carton y papeles mezclado','carton')
            .replace('bidon fardo','bidon sacas pallet').replace(/^bins$/,'bidon sacas pallet')
            .replace('ldpe strech film','polietileno limpio')
            // Fallback final
            .replace(/^bronce$/,'bronce amarillo')
            .replace(/^acero inoxidable$/,'acero inoxidable 304');
      const exp = mats.find(m=>normName(m.nombre)===expanded);
      if(exp) matId=exp.id;
    }
    // 3. Match parcial
    if(!matId){
      const partial = mats.filter(m=>normName(m.nombre).startsWith(qn) && qn.length>=4);
      if(partial.length===1) matId=partial[0].id;
    }
    // 4. Match inverso
    if(!matId){
      const inv = mats.filter(m=>qn.startsWith(normName(m.nombre)) && normName(m.nombre).length>=4);
      if(inv.length===1) matId=inv[0].id;
    }
    if(matId){matNom=MATS_LOCAL.find(x=>x.id===matId)?.nombre||null;}
    return{...item, empresa:item.empresa||fuente||'—', matId, matNom};
  });

  // ── Estadísticas ──────────────────────────────────────────
  const matched   = iaData.filter(x=>x.matId).length;
  const sinPrecio = iaData.filter(x=>x.precio_clp_kg===0).length;
  const conPrecio = iaData.length - sinPrecio;
  const empresas  = [...new Set(iaData.map(x=>x.empresa))];
  const multiEmp  = empresas.length > 1;

  document.getElementById('ia-res-title').textContent =
    `${iaData.length} materiales · ${matched} mapeados`;
  document.getElementById('ia-res-sub').innerHTML = multiEmp
    ? `<strong>${empresas.join(' · ')}</strong> · ${conPrecio} con precio`
    : `${conPrecio} con precio · ${sinPrecio} sin precio · ${empresas[0]}`;

  // ── Construir filas ────────────────────────────────────────
  let rows = '';
  empresas.forEach(emp=>{
    const empItems = iaData.filter(x=>x.empresa===emp);
    if(multiEmp){
      rows += `<div style="background:rgba(255,255,255,.08);padding:5px 10px;
        font-size:10px;font-weight:700;color:#F0D060;letter-spacing:1px;
        text-transform:uppercase;border-top:1px solid rgba(255,255,255,.1);">
        ${emp} <span style="font-size:9px;color:rgba(255,255,255,.4);font-weight:400;
        text-transform:none;">${empItems.length} materiales</span></div>`;
    }
    empItems.forEach(item=>{
      const i       = iaData.indexOf(item);
      const cc      = {alta:'c-hi',media:'c-md',baja:'c-lo'}[item.confianza]||'c-md';
      const noRec   = item.precio_clp_kg===0;
      const bColor  = item.matId?'#22C55E':'rgba(255,255,255,.25)';
      const tColor  = item.matId?'#22C55E':'#fff';
      const tWeight = item.matId?'700':'400';

      const precioHtml = noRec
        ? `<span style="color:rgba(239,68,68,.7);font-size:10px;font-style:italic;">no se recibe</span>`
        : `<div style="display:flex;flex-direction:column;align-items:flex-end;">
             <span class="ai-p">${fmt(item.precio_clp_kg)}/kg</span>
             ${item.nota?`<span style="font-size:9px;color:rgba(255,255,255,.35);">${item.nota}</span>`:''}
           </div>`;

      const selHtml = `<div style="display:flex;flex-direction:column;gap:3px;">
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
          <select id="ia-sel-${i}" onchange="iaSelChange(${i})"
            style="background:#1C2640;border:1px solid ${bColor};color:${tColor};
            font-size:11px;padding:4px 7px;border-radius:4px;outline:none;
            min-width:150px;max-width:185px;font-weight:${tWeight};">
            <option value="">— Seleccionar material —</option>
            ${buildMatOptions(item.matId)}
          </select>
          <button onclick="copiarTextoSel(${i})"
            style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);
            color:rgba(255,255,255,.6);font-size:10px;padding:3px 7px;border-radius:4px;
            cursor:pointer;flex-shrink:0;" title="Copiar nombre del material seleccionado">
            📋
          </button>
          <button onclick="toggleAddForm(${i})"
            style="background:rgba(240,208,96,.15);border:1px solid rgba(240,208,96,.4);
            color:#F0D060;font-size:10px;padding:3px 8px;border-radius:4px;cursor:pointer;
            white-space:nowrap;flex-shrink:0;" title="Agregar como material nuevo al catálogo">
            + Nuevo
          </button>
        </div>
        
        <!-- Mini formulario nuevo material -->
        <div id="ia-add-${i}" style="display:none;background:rgba(240,208,96,.08);
          border:1px solid rgba(240,208,96,.3);border-radius:6px;padding:10px;margin-top:4px;">
          <div style="font-size:10px;color:#F0D060;font-weight:700;margin-bottom:8px;">
            ✦ Agregar "${item.nombre}" como material nuevo
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
            <div>
              <div style="font-size:9px;color:rgba(255,255,255,.5);margin-bottom:3px;">Nombre oficial</div>
              <input id="ia-new-nom-${i}" value="${item.nombre}"
                style="width:100%;background:#1C2640;border:1px solid rgba(255,255,255,.2);
                color:#fff;font-size:11px;padding:4px 7px;border-radius:4px;outline:none;">
            </div>
            <div>
              <div style="font-size:9px;color:rgba(255,255,255,.5);margin-bottom:3px;">Categoría</div>
              <select id="ia-new-cat-${i}"
                onchange="autoSetEmpIva(${i})"
                style="width:100%;background:#1C2640;border:1px solid rgba(255,255,255,.2);
                color:#fff;font-size:11px;padding:4px 7px;border-radius:4px;outline:none;">
                ${CAT_ORDER.map(c=>`<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div>
              <div style="font-size:9px;color:rgba(255,255,255,.5);margin-bottom:3px;">Empresa</div>
              <select id="ia-new-emp-${i}"
                style="width:100%;background:#1C2640;border:1px solid rgba(255,255,255,.2);
                color:#fff;font-size:11px;padding:4px 7px;border-radius:4px;outline:none;">
                <option value="reciclean">Solo RECICLEAN</option>
                <option value="farex">Solo FAREX</option>
                <option value="ambas">Ambas</option>
              </select>
            </div>
            <div>
              <div style="font-size:9px;color:rgba(255,255,255,.5);margin-bottom:3px;">¿Retiene IVA?</div>
              <select id="ia-new-iva-${i}"
                style="width:100%;background:#1C2640;border:1px solid rgba(255,255,255,.2);
                color:#fff;font-size:11px;padding:4px 7px;border-radius:4px;outline:none;">
                <option value="no">No (plásticos, cartón, vidrio)</option>
                <option value="si">Sí 19% (fierros, metales)</option>
              </select>
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            <button onclick="addToCatalog(${i})"
              style="background:#F0D060;border:none;color:#1A1A14;font-size:11px;
              font-weight:700;padding:5px 12px;border-radius:4px;cursor:pointer;flex:1;">
              ✓ Agregar al catálogo
            </button>
            <button onclick="toggleAddForm(${i})"
              style="background:none;border:1px solid rgba(255,255,255,.2);
              color:rgba(255,255,255,.5);font-size:11px;padding:5px 10px;
              border-radius:4px;cursor:pointer;">
              Cancelar
            </button>
          </div>
        </div>
      </div>`;
      rows += `<div class="ai-row" id="ia-row-${i}" style="opacity:${noRec?.6:1};">
        <div class="ai-src" style="text-decoration:${noRec?'line-through':''};min-width:90px;font-size:11px;">${item.nombre}</div>
        <span style="color:rgba(255,255,255,.2);">→</span>
        <div style="flex:2;display:flex;flex-direction:column;gap:3px;">${selHtml}</div>
        ${precioHtml}
        <span class="badge ${cc}" style="font-size:9px;">${item.confianza}</span>
      </div>`;
    });
  });

  document.getElementById('ia-res-rows').innerHTML = rows;
  document.getElementById('ia-result').style.display = 'block';
  const empTxt = multiEmp?`${empresas.length} empresas`:(empresas[0]||fuente);
  toast(`✦ ${conPrecio} precios de ${empTxt} — ${matched} mapeados`,'ok');
}


// Auto-asignar empresa e IVA según categoría
function autoSetEmpIva(i){
  const cat = document.getElementById('ia-new-cat-'+i)?.value||'';
  const empSel = document.getElementById('ia-new-emp-'+i);
  const ivaSel = document.getElementById('ia-new-iva-'+i);
  if(!empSel || !ivaSel) return;

  // Reglas del negocio Reciclean-Farex
  const esFarex = cat.includes('FIERRO') || cat.includes('LATA') ||
                  cat.includes('COBRE') || cat.includes('BRONCE') ||
                  cat.includes('ALUMIN') || cat.includes('INOX') ||
                  cat.includes('METAL');
  const esReciclean = cat.includes('CARTÓN') || cat.includes('CARTON') ||
                      cat.includes('VIDRIO') || cat.includes('PLÁSTICO') ||
                      cat.includes('PLASTICO') || cat.includes('PET') ||
                      cat.includes('FILM') || cat.includes('POLIET');

  if(esFarex && esReciclean){
    empSel.value = 'ambas'; ivaSel.value = 'si';
  } else if(esFarex){
    empSel.value = 'farex'; ivaSel.value = 'si';
  } else if(esReciclean){
    empSel.value = 'reciclean'; ivaSel.value = 'no';
  }
  // Visual feedback
  empSel.style.borderColor = '#22C55E';
  ivaSel.style.borderColor = '#22C55E';
  setTimeout(()=>{
    empSel.style.borderColor = ''; ivaSel.style.borderColor = '';
  }, 1000);
}

function copiarTextoSel(i){
  const sel = document.getElementById('ia-sel-'+i);
  if(!sel) return;
  const txt = sel.options[sel.selectedIndex]?.text || '';
  if(!txt || txt.startsWith('—')) { toast('Selecciona un material primero','warn'); return; }
  navigator.clipboard.writeText(txt).then(()=>{
    toast(`📋 Copiado: "${txt}"`, 'ok');
  }).catch(()=>{
    // Fallback si clipboard no disponible
    const inp = document.createElement('input');
    inp.value = txt;
    document.body.appendChild(inp);
    inp.select();
    document.execCommand('copy');
    document.body.removeChild(inp);
    toast(`📋 Copiado: "${txt}"`, 'ok');
  });
}

function toggleAddForm(i){
  const f = document.getElementById('ia-add-'+i);
  if(!f) return;
  const isOpen = f.style.display !== 'none';
  f.style.display = isOpen ? 'none' : 'block';
  if(!isOpen){
    const sel    = document.getElementById('ia-sel-'+i);
    const nomInp = document.getElementById('ia-new-nom-'+i);
    const catSel = document.getElementById('ia-new-cat-'+i);

    // Pre-rellenar nombre con el texto del selector si hay uno seleccionado
    if(sel && nomInp && sel.value){
      const selTxt = sel.options[sel.selectedIndex]?.text||'';
      if(selTxt && !selTxt.startsWith('—')) nomInp.value = selTxt;
    }

    // Inferir categoría desde el material seleccionado en el dropdown
    if(catSel){
      let catInferida = null;
      // 1. Si hay material seleccionado, usar su categoría
      if(sel && sel.value){
        const matSel = mats.find(x=>x.id===parseInt(sel.value));
        if(matSel) catInferida = matSel.cat;
      }
      // 2. Si no, inferir desde el nombre del item (iaData[i])
      if(!catInferida && iaData[i]){
        const nom = (iaData[i].nombre||'').toLowerCase();
        if(/^cu |^cobre|radiador de cobre|calefon|cu\/ni|cupronickel/i.test(nom)) catInferida='COBRES';
        else if(/^br |^bronce|magnetico|magnético/i.test(nom)) catInferida='BRONCES';
        else if(/^al |^aluminio|^al\./i.test(nom)) catInferida='ALUMINIOS';
        else if(/ss 304|ss 316|acero inox|304|316/i.test(nom)) catInferida='ACEROS INOXIDABLES';
        else if(/fierro|corto|largo|mixto|oxicorte|viruta|fundido|manganeso/i.test(nom)) catInferida='FIERROS Y LATAS';
        else if(/lata chatarra|lata fierro|lata de fierro/i.test(nom)) catInferida='LATA CHATARRA';
        else if(/cartón|carton|blanco|duplex|tissue|occ/i.test(nom)) catInferida='CARTÓN Y PAPEL';
        else if(/vidrio/i.test(nom)) catInferida='VIDRIO';
        else if(/pet/i.test(nom)) catInferida='PLÁSTICOS — PET';
        else if(/film|polietileno|pesquero|cinta riego|invernadero|ldpe/i.test(nom)) catInferida='PLÁSTICOS — FILM Y POLIETILENOS';
        else if(/bidon|bidón|sacas|bins|pallet|planza/i.test(nom)) catInferida='PLÁSTICOS — SOPLADOS';
        else if(/tapas|tapón|tapon|preforma|hdpe|caramelo/i.test(nom)) catInferida='PLÁSTICOS — RÍGIDOS';
        else if(/zinc|zink|plomo|anodo|ánodo/i.test(nom)) catInferida='ACEROS INOXIDABLES';
      }
      if(catInferida){
        // Seleccionar la opción correcta
        for(const opt of catSel.options){
          if(opt.value===catInferida){ catSel.value=catInferida; break; }
        }
      }
    }

    // Auto-asignar empresa e IVA según categoría final
    autoSetEmpIva(i);
    nomInp?.focus();
  }
}

async function addToCatalog(i){
  const item  = iaData[i];
  const nom   = document.getElementById('ia-new-nom-'+i)?.value.trim();
  const cat   = document.getElementById('ia-new-cat-'+i)?.value;
  const emp   = document.getElementById('ia-new-emp-'+i)?.value;
  const iva   = document.getElementById('ia-new-iva-'+i)?.value==='si';
  if(!nom){toast('Escribe el nombre del material','warn');return;}

  // Get default margen for category
  const margenPorCat={
    'FIERROS Y LATAS':0.15,'LATA CHATARRA':0.20,
    'COBRES':0.10,'BRONCES':0.10,'ALUMINIOS':0.10,'ACEROS INOXIDABLES':0.10,
    'CARTÓN Y PAPEL':0.08,'VIDRIO':0.40,
    'PLÁSTICOS — PET':0.30,'PLÁSTICOS — FILM Y POLIETILENOS':0.30,
    'PLÁSTICOS — RÍGIDOS':0.60,'PLÁSTICOS — SOPLADOS':0.60,
  };
  const margen = margenPorCat[cat]||0.30;
  const flete  = cat.includes('CART')||cat.includes('PLÁST')||cat.includes('VIDR')?30:15;

  // New ID: max existing + 1
  const newId = Math.max(...MATS_LOCAL.map(m=>m.id)) + 1;

  const newMat = {
    id: newId, cat, nombre: nom,
    farex:  emp==='farex'||emp==='ambas',
    reciclean: emp==='reciclean'||emp==='ambas',
    compra: item.precio_clp_kg||0,
    lista:0, ejec:0, max:0,
    margen, iva, flete, meta:0
  };

  // Recalculate prices
  const c = calc(newMat);
  newMat.lista = c.lista; newMat.ejec = c.ejec; newMat.max = c.max;

  // Add to live data
  MATS_LOCAL.push(newMat);
  mats.push({...newMat});

  // Save to IndexedDB
  if(_db) await idbSaveMat(newMat);

  // Mark as changed so it appears in the banner
  cambios[newId] = {compra: newMat.compra, margen, iva};

  // Update iaData so this row now maps to the new material
  iaData[i].matId  = newId;
  iaData[i].matNom = nom;

  // Update the selector in this row
  const sel=document.getElementById('ia-sel-'+i);
  if(sel){
    const opt=document.createElement('option');
    opt.value=newId; opt.textContent=nom; opt.selected=true;
    sel.appendChild(opt);
    sel.style.borderColor='#22C55E';
    sel.style.color='#22C55E';
    sel.style.fontWeight='700';
  }

  // Hide the form
  document.getElementById('ia-add-'+i).style.display='none';

  // Rebuild category selects everywhere
  ['al-cat','pc-cat','pub-cat-f'].forEach(id=>{
    const s=document.getElementById(id);
    if(s&&![...s.options].some(o=>o.value===cat)){
      const o=document.createElement('option');o.value=cat;o.textContent=cat;s.appendChild(o);
    }
  });

  toast(`✓ "${nom}" agregado al catálogo (id ${newId}) · ${cat}`,'ok');
}

function iaSelChange(i){
  const sel=document.getElementById('ia-sel-'+i);
  if(!sel)return;
  const hasVal=!!sel.value;
  sel.style.borderColor=hasVal?'#22C55E':'rgba(255,255,255,.2)';
  sel.style.color=hasVal?'#22C55E':'#fff';
  sel.style.fontWeight=hasVal?'700':'400';
  // Update iaData
  if(iaData[i]){
    iaData[i].matId=hasVal?parseInt(sel.value):null;
    const m=hasVal?MATS_LOCAL.find(x=>x.id===parseInt(sel.value)):null;
    iaData[i].matNom=m?.nombre||null;
  }
}

async function aprobarIA(){
  const fuente=document.getElementById('ia-fuente').value.trim();
  if(!fuente || fuente==='—'){
    toast('⚠ Escribe el nombre del cliente antes de aprobar','warn');
    document.getElementById('ia-fuente').focus();
    document.getElementById('ia-fuente').style.borderColor='var(--red)';
    setTimeout(()=>document.getElementById('ia-fuente').style.borderColor='',2000);
    return;
  }

  // Agregar el cliente a FUENTES si es nuevo
  const todasEmpresas = new Set([fuente]);
  iaData.forEach(item=>{ if(item.empresa && item.empresa!=='—') todasEmpresas.add(item.empresa); });
  let fuentesNuevas = [];
  for(const emp of todasEmpresas){
    if(!FUENTES.some(x=>x.toLowerCase()===emp.toLowerCase())){
      FUENTES.push(emp);
      fuentesNuevas.push(emp);
      if(_db) await idbSaveFuente(emp);
    }
  }
  if(fuentesNuevas.length) rebuildFuenteSelects();

  let count=0;
  const newAliases=[];

  iaData.forEach((item,i)=>{
    let matId=item.matId;
    if(!matId){const sel=document.getElementById('ia-sel-'+i);if(sel?.value)matId=parseInt(sel.value);}
    if(!matId)return;
    const m=mats.find(x=>x.id===matId);
    if(m&&item.precio_clp_kg>0){
      // Guardar SOLO en CLIENTES_PRECIOS — NO tocar m.compra ni cambios
      // Los precios se transfieren a Precios & Márgenes desde Módulo B
      const empresaNom = item.empresa||fuente||'—';
      if(empresaNom && empresaNom!=='—'){
        if(!CLIENTES_PRECIOS[empresaNom]) CLIENTES_PRECIOS[empresaNom]={};
        CLIENTES_PRECIOS[empresaNom][matId] = item.precio_clp_kg;
      }
      // Guardar alias SIEMPRE que nombre cliente != nombre oficial
      const _aliasNom = (item.nombre||'').trim();
      const _matNom   = (m.nombre||'').trim();
      const _fAlias   = item.empresa||fuente||'—';
      if(_aliasNom && _aliasNom.toLowerCase()!==_matNom.toLowerCase()){
        if(!ALIASES[matId])ALIASES[matId]=[];
        if(!ALIASES[matId].some(a=>a.fuente===_fAlias&&a.alias.toLowerCase()===_aliasNom.toLowerCase())){
          ALIASES[matId].push({fuente:_fAlias,alias:_aliasNom});
          newAliases.push({material_id:matId,fuente:_fAlias,alias:_aliasNom});
        }
      }
      count++;
    }
  });
  if(newAliases.length) await apiPost('aliases',{type:'bulk',items:newAliases});
  if(count>0){
    await idbSaveDraft();
    // Guardar CLIENTES_PRECIOS en IndexedDB y localStorage
    if(_db) await idbSaveConfig('clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
    safeLS('rf_clientes_precios', JSON.stringify(CLIENTES_PRECIOS));
  }
  updateAliasCnt();
  document.getElementById('ia-result').style.display='none';
  document.getElementById('ia-empty').style.display='block';
  document.getElementById('ia-text').value='';
  document.getElementById('ia-file').value='';
  limpiarDrop();
  if(count>0){
    renderFuentes();
    renderPreview();
    renderAlias();
    // Ir a Precios Clientes / Alias para revisar y seleccionar precios por sucursal
    setTimeout(()=>{
      const tab=document.querySelector('.nav-tab[onclick*="alias"]');
      if(tab) goTab('alias', tab);
    }, 400);
    toast(`✓ ${count} precios de ${[...todasEmpresas].join(', ')} cargados → Revisa y selecciona en Precios Clientes / Alias`,'ok');
    // Mostrar aviso en Módulo B
    _preciosCargadosPendientes = count;
    mostrarAvisoPreciosCargados();
  }
}

// ═══════════════════════════════════════════════════════════
// FLUJO: Módulo B → Precios & Márgenes
// ═══════════════════════════════════════════════════════════
let _preciosCargadosPendientes = 0;

function mostrarAvisoPreciosCargados(){
  const el = document.getElementById('aviso-precios-cargados');
  if(el){
    el.style.display = 'block';
    document.getElementById('aviso-precios-title').textContent = 
      _preciosCargadosPendientes + ' precios cargados — selecciona por sucursal';
  }
}

// Cuenta cuántos precios están seleccionados y actualiza la barra
function updateEnviarBar(){
  const bar = document.getElementById('enviar-pm-bar');
  if(!bar) return;
  
  // Contar selecciones explícitas en PRECIO_SELECCIONADO
  let nSeleccionados = 0;
  Object.entries(PRECIO_SELECCIONADO).forEach(([matId, sucs])=>{
    Object.keys(sucs).forEach(suc=>{
      if(sucs[suc]?.precio > 0) nSeleccionados++;
    });
  });
  
  // También contar materiales con precio de clientes asignados (auto-selección)
  let nAuto = 0;
  const clientesAsignados = new Set();
  SUCS.forEach(s=>{
    const f = Array.isArray(SUCURSAL_FUENTE[s]) ? SUCURSAL_FUENTE[s] : [];
    f.forEach(cl=>clientesAsignados.add(cl));
  });
  
  if(clientesAsignados.size > 0){
    mats.forEach(m=>{
      SUCS.forEach(suc=>{
        if(PRECIO_SELECCIONADO[m.id]?.[suc]) return; // ya contado
        const fuentes = Array.isArray(SUCURSAL_FUENTE[suc]) ? SUCURSAL_FUENTE[suc] : [];
        const tieneAuto = fuentes.some(f=>CLIENTES_PRECIOS[f]?.[m.id]>0);
        if(tieneAuto) nAuto++;
      });
    });
  }
  
  const total = nSeleccionados + nAuto;
  
  bar.style.display = total > 0 ? 'flex' : 'none';
  const title = document.getElementById('enviar-pm-title');
  if(title){
    title.textContent = nSeleccionados > 0 
      ? nSeleccionados + ' seleccionado' + (nSeleccionados>1?'s':'') + ' + ' + nAuto + ' automático' + (nAuto>1?'s':'')
      : nAuto + ' precio' + (nAuto>1?'s':'') + ' por asignación automática';
  }
}

async function enviarAPrecios(){
  // Transferir precios seleccionados/asignados a m.compra y generar cambios
  let count = 0;
  
  SUCS.forEach(suc=>{
    const factor = SUC_FACTOR[suc]||1;
    mats.forEach(m=>{
      const precioNuevo = getPrecioCompra(m, suc);
      if(precioNuevo > 0 && precioNuevo !== m.compra){
        // Usar el mejor precio entre sucursales como precio base
        if(precioNuevo > m.compra){
          m.compra = precioNuevo;
          if(!cambios[m.id]) cambios[m.id] = {};
          cambios[m.id].compra = precioNuevo;
          count++;
        }
      }
    });
  });
  
  if(count > 0){
    await idbSaveDraft();
  }
  
  // Ocultar aviso y barra
  const aviso = document.getElementById('aviso-precios-cargados');
  if(aviso) aviso.style.display = 'none';
  
  // Ir a Precios & Márgenes
  const tab = document.querySelector('.nav-tab[onclick*="precios"]');
  if(tab) goTab('precios', tab);
  renderPrecios();
  
  setTimeout(()=>{
    const banner = document.getElementById('cambios-resumen');
    if(banner) banner.scrollIntoView({behavior:'smooth', block:'start'});
  }, 300);
  
  toast(`✓ ${count} precios transferidos → Revisa y publica en Precios & Márgenes`, 'ok');
}

// ── DRAG & DROP REORDER EN TABLA DE ALIAS ────────────────
let _dragMatId = null;
let _dragCat   = null;
let _dragEl    = null;

function aliasDragStart(e, matId, cat){
  _dragMatId = matId;
  _dragCat   = cat;
  _dragEl    = document.getElementById('alias-row-'+matId);
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(()=>{ if(_dragEl) _dragEl.style.opacity='0.4'; }, 0);
}
function aliasDragOver(e){
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const row = e.currentTarget;
  row.style.borderTop = '2px solid var(--amber)';
}
function aliasDrop(e, targetMatId, targetCat){
  e.preventDefault();
  e.currentTarget.style.borderTop = '';
  if(_dragMatId===targetMatId || _dragCat!==targetCat) return;
  // Find indices in MATS_LOCAL for this category
  const catMats = MATS_LOCAL.filter(m=>m.cat===_dragCat);
  const fromIdx = catMats.findIndex(m=>m.id===_dragMatId);
  const toIdx   = catMats.findIndex(m=>m.id===targetMatId);
  if(fromIdx<0||toIdx<0) return;
  // Reorder in MATS_LOCAL
  const draggedMat = catMats.splice(fromIdx, 1)[0];
  catMats.splice(toIdx, 0, draggedMat);
  // Rebuild MATS_LOCAL preserving other cats
  const otherMats = MATS_LOCAL.filter(m=>m.cat!==_dragCat);
  MATS_LOCAL.length = 0;
  [...otherMats,...catMats].sort((a,b)=>a.id-b.id>0?1:-1).forEach(m=>MATS_LOCAL.push(m));
  // Also reorder in mats
  mats.sort((a,b)=>{
    const ai=MATS_LOCAL.findIndex(x=>x.id===a.id);
    const bi=MATS_LOCAL.findIndex(x=>x.id===b.id);
    return ai-bi;
  });
  renderAlias();
}
function aliasDragEnd(e){
  if(_dragEl) _dragEl.style.opacity='1';
  // Clean up any border highlights
  document.querySelectorAll('#alias-tbody tr').forEach(r=>r.style.borderTop='');
  _dragMatId=null; _dragCat=null; _dragEl=null;
}

function cancelarCargaIA(){
  if(_iaAbort){ _iaAbort.abort(); _iaAbort=null; }
  document.getElementById('ia-loading').style.display='none';
  document.getElementById('ia-empty').style.display='block';
  const cdEl=document.getElementById('ia-countdown');
  if(cdEl) cdEl.textContent='';
  document.getElementById('ia-load-sub').textContent='Enviando a Claude API';
  toast('Carga cancelada','warn');
}
function cancelarIA(){iaData=[];document.getElementById('ia-result').style.display='none';document.getElementById('ia-empty').style.display='block';limpiarDrop();}
