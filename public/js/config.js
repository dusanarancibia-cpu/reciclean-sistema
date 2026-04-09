// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════
const API_BASE  = 'https://plataforma-virtual.com/reciclean/api.php';
const API_TOKEN = 'rf_2026_admin';
let apiOnline = false;

// ── Supabase — publicar precios al Asistente online ──
const SUPABASE_URL = 'https://eknmtsrtfkzroxnovfqn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_y-ivpVdiL141kz4ZASje5g_SYG7do5z';
let _supabase = null;

// ── Constantes globales ──
const CONFIG = {
  API_TIMEOUT_SHORT: 5000,
  API_TIMEOUT_LONG: 8000,
  IA_TIMEOUT: 45,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  DEFAULT_SPREAD: 15,
  DEFAULT_IVA: 19
};
// ── Safe localStorage wrapper ──
function safeLS(key, val){ try{ localStorage.setItem(key, val); }catch(e){ console.warn("localStorage quota:",e); toast("Error guardando datos locales","warn"); } }


// ═══════════════════════════════════════════════════════════
// API MODULE — fetch con fallback silencioso
// ═══════════════════════════════════════════════════════════
async function apiGet(action, params = {}) {
  try {
    const url = new URL(API_BASE);
    url.searchParams.set('action', action);
    url.searchParams.set('token', API_TOKEN);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const res = await fetch(url, { signal: AbortSignal.timeout(CONFIG.API_TIMEOUT_SHORT) });
    if (!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    setApiStatus(true);
    return json;
  } catch (e) {
    setApiStatus(false);
    return null;
  }
}
async function apiPost(action, data) {
  try {
    const res = await fetch(`${API_BASE}?action=${action}&token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(CONFIG.API_TIMEOUT_LONG)
    });
    if (!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    setApiStatus(true);
    return json;
  } catch (e) {
    setApiStatus(false);
    return { ok: false, error: e.message };
  }
}
function setApiStatus(ok) {
  apiOnline = ok;
  const dot = document.getElementById('api-dot');
  const bar = document.getElementById('api-bar-precios');
  dot.className = 'api-dot ' + (ok ? 'ok' : 'err');
  dot.title = ok ? 'API conectada ✓' : 'API no disponible — modo local';
  if (bar) bar.style.display = ok ? 'none' : 'flex';
}

// ═══════════════════════════════════════════════════════════
// DATOS BASE (fallback local)
// ═══════════════════════════════════════════════════════════
const MATS_LOCAL = [{"id":1,"cat":"FIERROS Y LATAS","nombre":"Fierro Corto","farex":true,"reciclean":false,"compra":210,"lista":110,"ejec":120,"max":130,"margen":0.15,"iva":true,"flete":15,"meta":10000},{"id":2,"cat":"FIERROS Y LATAS","nombre":"Fierro Largo","farex":true,"reciclean":false,"compra":195,"lista":100,"ejec":110,"max":120,"margen":0.15,"iva":true,"flete":15,"meta":15000},{"id":3,"cat":"LATA CHATARRA","nombre":"Lata Chatarra","farex":true,"reciclean":true,"compra":195,"lista":100,"ejec":110,"max":120,"margen":0.2,"iva":true,"flete":15,"meta":10000},{"id":4,"cat":"FIERROS Y LATAS","nombre":"Fierro Mixto","farex":true,"reciclean":false,"compra":185,"lista":100,"ejec":110,"max":120,"margen":0.15,"iva":true,"flete":15,"meta":0},{"id":5,"cat":"FIERROS Y LATAS","nombre":"Oxicorte","farex":true,"reciclean":false,"compra":195,"lista":100,"ejec":110,"max":120,"margen":0.15,"iva":true,"flete":15,"meta":0},{"id":6,"cat":"FIERROS Y LATAS","nombre":"Viruta","farex":true,"reciclean":false,"compra":60,"lista":30,"ejec":30,"max":30,"margen":0.15,"iva":true,"flete":15,"meta":0},{"id":7,"cat":"FIERROS Y LATAS","nombre":"Fierro Fundido","farex":true,"reciclean":false,"compra":100,"lista":50,"ejec":60,"max":60,"margen":0.15,"iva":true,"flete":15,"meta":0},{"id":8,"cat":"FIERROS Y LATAS","nombre":"Manganeso","farex":true,"reciclean":false,"compra":220,"lista":120,"ejec":130,"max":140,"margen":0.15,"iva":true,"flete":15,"meta":0},{"id":9,"cat":"COBRES","nombre":"Cobre 1 Tubo","farex":true,"reciclean":false,"compra":9700,"lista":6000,"ejec":6530,"max":7060,"margen":0.1,"iva":true,"flete":15,"meta":1000},{"id":10,"cat":"COBRES","nombre":"Cobre 1° Pelillo","farex":true,"reciclean":false,"compra":0,"lista":0,"ejec":0,"max":0,"margen":0.1,"iva":true,"flete":15,"meta":0},{"id":11,"cat":"COBRES","nombre":"Cobre 3ra","farex":true,"reciclean":false,"compra":9600,"lista":5940,"ejec":6460,"max":6990,"margen":0.1,"iva":true,"flete":15,"meta":5000},{"id":12,"cat":"COBRES","nombre":"Cobre Esmaltado","farex":true,"reciclean":false,"compra":9000,"lista":5570,"ejec":6060,"max":6550,"margen":0.1,"iva":true,"flete":15,"meta":5000},{"id":13,"cat":"COBRES","nombre":"Cobre Calefón","farex":true,"reciclean":false,"compra":8100,"lista":5010,"ejec":5450,"max":5890,"margen":0.1,"iva":true,"flete":15,"meta":1000},{"id":14,"cat":"COBRES","nombre":"Cobre Radiador","farex":true,"reciclean":false,"compra":5700,"lista":3520,"ejec":3830,"max":4140,"margen":0.1,"iva":true,"flete":15,"meta":500},{"id":15,"cat":"COBRES","nombre":"Cobre Radiador Chico","farex":true,"reciclean":false,"compra":5680,"lista":3510,"ejec":3820,"max":4130,"margen":0.1,"iva":true,"flete":15,"meta":300},{"id":16,"cat":"COBRES","nombre":"Cobre Niquel","farex":true,"reciclean":false,"compra":2600,"lista":1600,"ejec":1740,"max":1880,"margen":0.1,"iva":true,"flete":15,"meta":0},{"id":17,"cat":"BRONCES","nombre":"Bronce Amarillo","farex":true,"reciclean":false,"compra":6350,"lista":3930,"ejec":4280,"max":4620,"margen":0.1,"iva":true,"flete":15,"meta":3000},{"id":18,"cat":"BRONCES","nombre":"Bronce Colorado","farex":true,"reciclean":false,"compra":8100,"lista":5010,"ejec":5450,"max":5890,"margen":0.1,"iva":true,"flete":15,"meta":1000},{"id":19,"cat":"BRONCES","nombre":"Bronce Contaminado","farex":true,"reciclean":false,"compra":4500,"lista":2780,"ejec":3020,"max":3270,"margen":0.1,"iva":true,"flete":15,"meta":500},{"id":20,"cat":"BRONCES","nombre":"Bronce Aserrín Limpio","farex":true,"reciclean":false,"compra":0,"lista":0,"ejec":0,"max":0,"margen":0.1,"iva":true,"flete":15,"meta":100},{"id":21,"cat":"BRONCES","nombre":"Bronce Magnético","farex":true,"reciclean":false,"compra":4500,"lista":2780,"ejec":3020,"max":3270,"margen":0.1,"iva":true,"flete":15,"meta":0},{"id":22,"cat":"ALUMINIOS","nombre":"Aluminio Off Set","farex":true,"reciclean":false,"compra":2200,"lista":1350,"ejec":1470,"max":1590,"margen":0.1,"iva":true,"flete":15,"meta":0},{"id":23,"cat":"ALUMINIOS","nombre":"Aluminio Perfil A","farex":true,"reciclean":false,"compra":2150,"lista":1330,"ejec":1440,"max":1560,"margen":0.1,"iva":true,"flete":15,"meta":0},{"id":24,"cat":"ALUMINIOS","nombre":"Aluminio Perfil B","farex":true,"reciclean":false,"compra":2100,"lista":1290,"ejec":1400,"max":1520,"margen":0.1,"iva":true,"flete":15,"meta":3000},{"id":25,"cat":"ALUMINIOS","nombre":"Aluminio Duro","farex":true,"reciclean":false,"compra":1820,"lista":1120,"ejec":1220,"max":1320,"margen":0.1,"iva":true,"flete":15,"meta":5000},{"id":26,"cat":"ALUMINIOS","nombre":"Aluminio Duro Lata","farex":true,"reciclean":false,"compra":1820,"lista":1120,"ejec":1220,"max":1320,"margen":0.1,"iva":true,"flete":15,"meta":3000},{"id":27,"cat":"ALUMINIOS","nombre":"Aluminio Blando","farex":true,"reciclean":false,"compra":1300,"lista":800,"ejec":870,"max":940,"margen":0.1,"iva":true,"flete":15,"meta":0},{"id":28,"cat":"ALUMINIOS","nombre":"Aluminio UBC","farex":true,"reciclean":true,"compra":1830,"lista":1120,"ejec":1220,"max":1320,"margen":0.1,"iva":true,"flete":15,"meta":2000},{"id":29,"cat":"ALUMINIOS","nombre":"Aluminio Pomos","farex":true,"reciclean":false,"compra":1000,"lista":610,"ejec":660,"max":720,"margen":0.1,"iva":true,"flete":15,"meta":0},{"id":30,"cat":"ALUMINIOS","nombre":"Aluminio Radiador","farex":true,"reciclean":false,"compra":1200,"lista":730,"ejec":800,"max":860,"margen":0.1,"iva":true,"flete":15,"meta":500},{"id":31,"cat":"ALUMINIOS","nombre":"Aluminio Radiador Mixto","farex":true,"reciclean":false,"compra":4700,"lista":2910,"ejec":3160,"max":3420,"margen":0.1,"iva":true,"flete":15,"meta":100},{"id":32,"cat":"ALUMINIOS","nombre":"Aluminio FOIL","farex":true,"reciclean":false,"compra":600,"lista":370,"ejec":400,"max":430,"margen":0.1,"iva":true,"flete":15,"meta":0},{"id":35,"cat":"ACEROS INOXIDABLES","nombre":"Acero Inoxidable 304","farex":true,"reciclean":false,"compra":810,"lista":490,"ejec":540,"max":580,"margen":0.1,"iva":true,"flete":15,"meta":5000},{"id":36,"cat":"ACEROS INOXIDABLES","nombre":"Acero Inoxidable 316","farex":true,"reciclean":false,"compra":1300,"lista":800,"ejec":870,"max":940,"margen":0.1,"iva":true,"flete":15,"meta":0},{"id":38,"cat":"ACEROS INOXIDABLES","nombre":"Zinc Anodos","farex":true,"reciclean":false,"compra":350,"lista":200,"ejec":220,"max":240,"margen":0.1,"iva":true,"flete":15,"meta":0},{"id":39,"cat":"ACEROS INOXIDABLES","nombre":"Plomo","farex":true,"reciclean":false,"compra":500,"lista":300,"ejec":320,"max":350,"margen":0.1,"iva":true,"flete":15,"meta":0},{"id":40,"cat":"CARTÓN Y PAPEL","nombre":"Carton","farex":false,"reciclean":true,"compra":40,"lista":10,"ejec":10,"max":10,"margen":0.08,"iva":false,"flete":30,"meta":10000},{"id":42,"cat":"CARTÓN Y PAPEL","nombre":"Blanco 2","farex":false,"reciclean":true,"compra":140,"lista":80,"ejec":90,"max":100,"margen":0.08,"iva":false,"flete":30,"meta":5000},{"id":47,"cat":"VIDRIO","nombre":"Vidrio","farex":false,"reciclean":true,"compra":60,"lista":30,"ejec":30,"max":30,"margen":0.4,"iva":false,"flete":15,"meta":5000},{"id":48,"cat":"PLÁSTICOS — PET","nombre":"PET Transparente","farex":false,"reciclean":true,"compra":720,"lista":410,"ejec":440,"max":480,"margen":0.3,"iva":false,"flete":30,"meta":2000},{"id":49,"cat":"PLÁSTICOS — PET","nombre":"PET Color","farex":false,"reciclean":true,"compra":400,"lista":220,"ejec":240,"max":260,"margen":0.3,"iva":false,"flete":30,"meta":0},{"id":55,"cat":"PLÁSTICOS — FILM Y POLIETILENOS","nombre":"Polietileno Lavado","farex":false,"reciclean":true,"compra":260,"lista":140,"ejec":150,"max":160,"margen":0.3,"iva":false,"flete":30,"meta":1000},{"id":56,"cat":"PLÁSTICOS — FILM Y POLIETILENOS","nombre":"Polietileno Limpio","farex":false,"reciclean":true,"compra":400,"lista":220,"ejec":240,"max":260,"margen":0.3,"iva":false,"flete":30,"meta":0},{"id":64,"cat":"PLÁSTICOS — RÍGIDOS","nombre":"Tapas Bebidas","farex":false,"reciclean":true,"compra":200,"lista":60,"ejec":60,"max":70,"margen":0.6,"iva":false,"flete":30,"meta":2000},{"id":65,"cat":"PLÁSTICOS — RÍGIDOS","nombre":"Tapon Agua Purificada","farex":false,"reciclean":true,"compra":300,"lista":90,"ejec":100,"max":110,"margen":0.6,"iva":false,"flete":30,"meta":0},{"id":75,"cat":"PLÁSTICOS — SOPLADOS","nombre":"Bidon Sacas Pallet","farex":false,"reciclean":true,"compra":300,"lista":90,"ejec":100,"max":110,"margen":0.6,"iva":false,"flete":30,"meta":0},{"id": 37, "cat": "ACEROS INOXIDABLES", "nombre": "Acero Inox. SS 201", "farex": true, "reciclean": false, "compra": 210, "lista": 120, "ejec": 130, "max": 140, "margen": 0.1, "iva": true, "flete": 15, "meta": 0},{"id": 43, "cat": "CARTÓN Y PAPEL", "nombre": "Papel Blanco 3", "farex": false, "reciclean": true, "compra": 0, "lista": 10, "ejec": 10, "max": 10, "margen": 0.08, "iva": false, "flete": 30, "meta": 0},{"id": 82, "cat": "PLÁSTICOS — PET", "nombre": "Pet Mezclado", "farex": false, "reciclean": true, "compra": 0, "lista": 0, "ejec": 0, "max": 0, "margen": 0.3, "iva": false, "flete": 30, "meta": 0},{"id": 70, "cat": "PLÁSTICOS — RÍGIDOS", "nombre": "HDPE PP Inyección", "farex": false, "reciclean": true, "compra": 300, "lista": 90, "ejec": 100, "max": 110, "margen": 0.6, "iva": false, "flete": 30, "meta": 0},{"id": 71, "cat": "PLÁSTICOS — RÍGIDOS", "nombre": "Post Consumo", "farex": false, "reciclean": true, "compra": 300, "lista": 90, "ejec": 100, "max": 110, "margen": 0.6, "iva": false, "flete": 30, "meta": 0},{"id": 51, "cat": "PLÁSTICOS — PET", "nombre": "PET Preforma Transparente", "farex": false, "reciclean": true, "compra": 500, "lista": 280, "ejec": 300, "max": 330, "margen": 0.3, "iva": false, "flete": 30, "meta": 0},{"id": 67, "cat": "PLÁSTICOS — SOPLADOS", "nombre": "Pallet PP", "farex": false, "reciclean": true, "compra": 300, "lista": 90, "ejec": 100, "max": 110, "margen": 0.6, "iva": false, "flete": 30, "meta": 0},{"id": 68, "cat": "PLÁSTICOS — RÍGIDOS", "nombre": "Basureros sin Eje y Ruedas", "farex": false, "reciclean": true, "compra": 250, "lista": 80, "ejec": 80, "max": 90, "margen": 0.6, "iva": false, "flete": 30, "meta": 0},{"id": 88, "cat": "PLÁSTICOS — FILM Y POLIETILENOS", "nombre": "Planza de Fardos", "farex": false, "reciclean": true, "compra": 0, "lista": 0, "ejec": 0, "max": 0, "margen": 0.3, "iva": false, "flete": 30, "meta": 0},{"id": 89, "cat": "CARTÓN Y PAPEL", "nombre": "Tetrapack", "farex": false, "reciclean": true, "compra": 0, "lista": 0, "ejec": 0, "max": 0, "margen": 0.08, "iva": false, "flete": 30, "meta": 0},{"id": 41, "cat": "CARTÓN Y PAPEL", "nombre": "Cartón Dúplex", "farex": false, "reciclean": true, "compra": 0, "lista": 10, "ejec": 10, "max": 10, "margen": 0.08, "iva": false, "flete": 30, "meta": 0},{"id": 44, "cat": "CARTÓN Y PAPEL", "nombre": "Papel Tissue/Kraft", "farex": false, "reciclean": true, "compra": 0, "lista": 10, "ejec": 10, "max": 10, "margen": 0.08, "iva": false, "flete": 30, "meta": 0},{"id": 92, "cat": "ALUMINIOS", "nombre": "Aluminio Zn Luminarias", "farex": true, "reciclean": false, "compra": 0, "lista": 0, "ejec": 0, "max": 0, "margen": 0.1, "iva": true, "flete": 15, "meta": 0},{"id":45,"cat":"CARTÓN Y PAPEL","nombre":"Papel Diario","farex":false,"reciclean":true,"compra":0,"lista":10,"ejec":10,"max":10,"margen":0.08,"iva":false,"flete":30,"meta":0},{"id":46,"cat":"CARTÓN Y PAPEL","nombre":"Semimixto","farex":false,"reciclean":true,"compra":0,"lista":10,"ejec":10,"max":10,"margen":0.08,"iva":false,"flete":30,"meta":0},{"id":53,"cat":"PLÁSTICOS — FILM Y POLIETILENOS","nombre":"Stretch Film s/Etiqueta","farex":false,"reciclean":true,"compra":160,"lista":80,"ejec":80,"max":90,"margen":0.3,"iva":false,"flete":30,"meta":0},{"id":57,"cat":"PLÁSTICOS — FILM Y POLIETILENOS","nombre":"Techo Invernadero","farex":false,"reciclean":true,"compra":210,"lista":110,"ejec":120,"max":130,"margen":0.3,"iva":false,"flete":30,"meta":0},{"id":58,"cat":"PLÁSTICOS — FILM Y POLIETILENOS","nombre":"Pesquero (sin Residuos)","farex":false,"reciclean":true,"compra":200,"lista":100,"ejec":110,"max":120,"margen":0.3,"iva":false,"flete":30,"meta":0},{"id":59,"cat":"PLÁSTICOS — FILM Y POLIETILENOS","nombre":"Cinta de Riego","farex":false,"reciclean":true,"compra":210,"lista":110,"ejec":120,"max":130,"margen":0.3,"iva":false,"flete":30,"meta":0},{"id":60,"cat":"PLÁSTICOS — FILM Y POLIETILENOS","nombre":"Caramelo Limpio","farex":false,"reciclean":true,"compra":400,"lista":220,"ejec":240,"max":260,"margen":0.3,"iva":false,"flete":30,"meta":0},{"id":61,"cat":"PLÁSTICOS — FILM Y POLIETILENOS","nombre":"Polietileno Sucio","farex":false,"reciclean":true,"compra":200,"lista":100,"ejec":110,"max":120,"margen":0.3,"iva":false,"flete":30,"meta":0},{"id":62,"cat":"PLÁSTICOS — FILM Y POLIETILENOS","nombre":"LDPE","farex":false,"reciclean":true,"compra":120,"lista":50,"ejec":60,"max":60,"margen":0.3,"iva":false,"flete":30,"meta":0},{"id":63,"cat":"PLÁSTICOS — RÍGIDOS","nombre":"HDPE","farex":false,"reciclean":true,"compra":250,"lista":130,"ejec":140,"max":150,"margen":0.6,"iva":false,"flete":30,"meta":0},{"id":72,"cat":"PLÁSTICOS — PET","nombre":"Pet Clear","farex":false,"reciclean":true,"compra":720,"lista":240,"ejec":260,"max":280,"margen":0.3,"iva":false,"flete":30,"meta":0}];

const CAT_ORDER = ["FIERROS Y LATAS","LATA CHATARRA","COBRES","BRONCES","ALUMINIOS","ACEROS INOXIDABLES","CARTÓN Y PAPEL","VIDRIO","PLÁSTICOS — PET","PLÁSTICOS — FILM Y POLIETILENOS","PLÁSTICOS — RÍGIDOS","PLÁSTICOS — SOPLADOS"];
const SUC_FACTOR = {Cerrillos:1, Maipú:1, Talca:1, 'Puerto Montt':1};
const SUCS = ['Cerrillos','Maipú','Talca','Puerto Montt'];
const CLIENTES_DEFAULT = []; // Los clientes se cargan desde backup/IndexedDB — no hardcodear

let mats = MATS_LOCAL.map(m=>({...m}));
let cambios = {};
let ALIASES = {}; // v81: desactivado — solo para compatibilidad
let FUENTES = [...CLIENTES_DEFAULT];
let HISTORIAL = []; // Historial se carga desde backup/IndexedDB
let vistaPrecios = 'suc';
let _verTodosMats = false;
let pubSuc = 'todas';
let htab = 'propios';
let iaData = [];
let _iaAbort = null;

// ── NUEVAS ESTRUCTURAS: precios por cliente y fuente por sucursal ──
// CLIENTES_PRECIOS[cliente][matId] = precio_compra
let CLIENTES_PRECIOS = {};
// PRECIO_SELECCIONADO[matId][suc] = {cliente, precio, ts}
// Es la selección explícita de precio por material x sucursal
let PRECIO_SELECCIONADO = {};
// PRECIO_OVERRIDE[matId][suc] = precio — override manual que anula calc()
let PRECIO_OVERRIDE = {};
// v85: Flete, Margen y MC Ejecutivo por material por sucursal
let FLETE_POR_SUC = {};     // FLETE_POR_SUC[matId][suc] = numero
// MARGEN_POR_SUC[matId][suc] = decimal (ej: 0.15)
// Defaults: compensan los factores 0.88 (Talca) y 0.82 (P.Montt) eliminados de SUC_FACTOR
// Fórmula: margen_nuevo = 1 - (1 - margen_base) * factor_viejo
// Al restaurar desde IDB/LS, se hace deep-merge: ediciones manuales ganan sobre estos defaults.
let MARGEN_POR_SUC = {};
MATS_LOCAL.forEach(function(m){
  MARGEN_POR_SUC[m.id] = {
    Talca:          1 - (1 - m.margen) * 0.88,
    'Puerto Montt': 1 - (1 - m.margen) * 0.82
  };
});
let MC_EJEC_POR_SUC = {};   // MC_EJEC_POR_SUC[matId][suc] = decimal (spread override)
let COMISION_EJEC_POR_SUC = {}; // COMISION_EJEC_POR_SUC[matId][suc] = decimal (ej: 0.0025 = 0.25%)
// SUCURSAL_FUENTE[sucursal] = nombre_cliente (o null)
let SUCURSAL_FUENTE = {Cerrillos:[], Maipú:[], Talca:[], 'Puerto Montt':[]};

const fmt = v => v===0?'$0':v>0?'$'+v.toLocaleString('es-CL'):v<0?'-$'+Math.abs(v).toLocaleString('es-CL'):'&#8212;';
