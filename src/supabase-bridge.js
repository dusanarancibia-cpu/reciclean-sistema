/**
 * Supabase Bridge — Conecta el admin panel v86 con Supabase
 * Se inyecta al final del HTML y sobrescribe las funciones de API/storage
 */
import { supabase } from './lib/supabase.js';
import { getSession, loginEmail, logout } from './lib/auth.js';

// Exponer globalmente para que el panel pueda usarlo
window._supabase = supabase;
window._supabaseReady = false;

// ── LOGIN GATE ──
function showLoginGate() {
  const overlay = document.createElement('div');
  overlay.id = 'login-gate';
  overlay.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1A1A14;font-family:'Syne',system-ui,sans-serif;">
      <div style="background:#fff;border-radius:16px;padding:40px;width:90%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#9C9484;text-transform:uppercase;">Reciclean · Farex</div>
          <div style="font-size:22px;font-weight:700;margin-top:6px;color:#1A1A14;">Admin Panel</div>
        </div>
        <div id="login-error" style="display:none;background:#FDECEA;border:1px solid #F5C6C0;color:#C0392B;padding:8px 12px;border-radius:8px;font-size:12px;margin-bottom:12px;text-align:center;"></div>
        <input id="login-email" type="email" placeholder="Email corporativo" style="width:100%;padding:12px 14px;border:1.5px solid #D6D1C4;border-radius:8px;font-size:14px;margin-bottom:10px;font-family:inherit;outline:none;" />
        <input id="login-pass" type="password" placeholder="Contraseña" style="width:100%;padding:12px 14px;border:1.5px solid #D6D1C4;border-radius:8px;font-size:14px;margin-bottom:16px;font-family:inherit;outline:none;" />
        <button id="login-btn" style="width:100%;padding:12px;background:#1A1A14;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Ingresar</button>
        <div style="text-align:center;margin-top:16px;font-size:11px;color:#9C9484;">Acceso solo para usuarios autorizados</div>
      </div>
    </div>
  `;
  document.body.prepend(overlay);

  // Hide all panels and show login
  document.documentElement.style.visibility = 'visible';
  document.querySelectorAll('.nav, .panel, .scroll').forEach(el => { el.style.display = 'none'; });

  // Login handler
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
}

async function handleLogin() {
  const btn = document.getElementById('login-btn');
  const errDiv = document.getElementById('login-error');
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;

  if (!email || !pass) { errDiv.textContent = 'Completa ambos campos'; errDiv.style.display = 'block'; return; }

  btn.textContent = 'Verificando...';
  btn.disabled = true;

  const result = await loginEmail(email, pass);

  if (result.ok) {
    document.getElementById('login-gate').remove();
    document.querySelectorAll('.nav, .panel, .scroll').forEach(el => { el.style.display = ''; });
    // Re-trigger panel init
    document.querySelector('.panel')?.classList.add('active');
  } else {
    errDiv.textContent = result.error;
    errDiv.style.display = 'block';
    btn.textContent = 'Ingresar';
    btn.disabled = false;
  }
}

window._logout = logout;

// ── Override API status ──
function setSupabaseStatus(ok) {
  window.apiOnline = ok;
  const dot = document.getElementById('api-dot');
  const bar = document.getElementById('api-bar-precios');
  if (dot) {
    dot.className = 'api-dot ' + (ok ? 'ok' : 'err');
    dot.title = ok ? 'Supabase conectado ✓' : 'Supabase no disponible — modo local';
  }
  if (bar) bar.style.display = ok ? 'none' : 'flex';
}

// ── Test connection ──
async function testConnection() {
  try {
    const { data, error } = await supabase.from('sucursales').select('count');
    if (error) throw error;
    setSupabaseStatus(true);
    console.log('✅ Supabase conectado');
    return true;
  } catch (e) {
    setSupabaseStatus(false);
    console.warn('❌ Supabase no disponible:', e.message);
    return false;
  }
}

// ── Load materiales from Supabase ──
async function loadMaterialesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('materiales')
      .select('*, categorias(nombre)')
      .eq('activo', true)
      .order('id');
    if (error) throw error;

    // Convert to panel format
    return data.map(m => ({
      id: m.id,
      cat: m.categorias.nombre,
      nombre: m.nombre,
      farex: m.farex,
      reciclean: m.reciclean,
      compra: 0, // Will be filled from precios
      lista: 0,
      ejec: 0,
      max: 0,
      margen: parseFloat(m.margen_default),
      iva: m.iva,
      flete: parseFloat(m.flete_default),
      meta: m.meta_kg
    }));
  } catch (e) {
    console.warn('Error cargando materiales de Supabase:', e);
    return null;
  }
}

// ── Load config from Supabase ──
async function loadConfigFromSupabase() {
  try {
    const { data, error } = await supabase.from('config').select('*');
    if (error) throw error;
    const cfg = {};
    data.forEach(row => { cfg[row.clave] = row.valor; });
    return cfg;
  } catch (e) {
    console.warn('Error cargando config:', e);
    return null;
  }
}

// ── Save config to Supabase ──
async function saveConfigToSupabase(clave, valor) {
  try {
    const { error } = await supabase
      .from('config')
      .upsert({ clave, valor: String(valor) }, { onConflict: 'clave' });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Error guardando config:', e);
    return false;
  }
}

// ── Load clientes compradores ──
async function loadClientesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('clientes_compradores')
      .select('*')
      .eq('activo', true)
      .order('nombre');
    if (error) throw error;
    return data.map(c => c.nombre);
  } catch (e) {
    console.warn('Error cargando clientes:', e);
    return null;
  }
}

// ── Load precios_cliente (CLIENTES_PRECIOS) ──
async function loadPreciosClienteFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('precios_cliente')
      .select('*, clientes_compradores(nombre)');
    if (error) throw error;

    // Convert to panel format: {cliente: {matId: precio}}
    const result = {};
    data.forEach(row => {
      const clienteName = row.clientes_compradores.nombre;
      if (!result[clienteName]) result[clienteName] = {};
      result[clienteName][row.material_id] = parseFloat(row.precio_compra);
    });
    return result;
  } catch (e) {
    console.warn('Error cargando precios cliente:', e);
    return null;
  }
}

// ── Load aliases ──
async function loadAliasesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('material_aliases')
      .select('*');
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Error cargando aliases:', e);
    return null;
  }
}

// ── Save alias ──
async function saveAliasToSupabase(materialId, fuente, alias) {
  try {
    const { error } = await supabase
      .from('material_aliases')
      .upsert({ material_id: materialId, fuente, alias },
               { onConflict: 'material_id,fuente,alias' });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Error guardando alias:', e);
    return false;
  }
}

// ── Delete alias ──
async function deleteAliasFromSupabase(materialId, fuente, alias) {
  try {
    const { error } = await supabase
      .from('material_aliases')
      .delete()
      .match({ material_id: materialId, fuente, alias });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Error eliminando alias:', e);
    return false;
  }
}

// ── Save precios_cliente ──
async function savePreciosClienteToSupabase(clienteName, materialesPrecios) {
  try {
    // Get or create cliente
    let { data: cliente } = await supabase
      .from('clientes_compradores')
      .select('id')
      .eq('nombre', clienteName)
      .single();

    if (!cliente) {
      const { data: newCliente, error: insertErr } = await supabase
        .from('clientes_compradores')
        .insert({ nombre: clienteName })
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      cliente = newCliente;
    }

    // Upsert all precios
    const rows = Object.entries(materialesPrecios).map(([matId, precio]) => ({
      cliente_id: cliente.id,
      material_id: parseInt(matId),
      precio_compra: precio,
      fecha_actualizacion: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('precios_cliente')
      .upsert(rows, { onConflict: 'cliente_id,material_id' });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Error guardando precios cliente:', e);
    return false;
  }
}

// ── Expose functions globally ──
window._sb = {
  supabase,
  testConnection,
  loadMaterialesFromSupabase,
  loadConfigFromSupabase,
  saveConfigToSupabase,
  loadClientesFromSupabase,
  loadPreciosClienteFromSupabase,
  loadAliasesFromSupabase,
  saveAliasToSupabase,
  deleteAliasFromSupabase,
  savePreciosClienteToSupabase,
  setSupabaseStatus
};

// ── Auto-init on load ──
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🔌 Supabase Bridge cargando...');

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(e => console.log('SW:', e));
  }

  // Check login
  const session = getSession();
  if (!session) {
    showLoginGate();
    return;
  }
  console.log(`👤 Sesión activa: ${session.nombre} (${session.rol})`);
  document.documentElement.style.visibility = 'visible';

  const connected = await testConnection();

  if (connected) {
    // Load materiales from Supabase
    const sbMats = await loadMaterialesFromSupabase();
    if (sbMats && sbMats.length > 0) {
      window.mats = sbMats;
      console.log(`📦 ${sbMats.length} materiales cargados de Supabase`);
    }

    // Load config
    const cfg = await loadConfigFromSupabase();
    if (cfg) {
      if (cfg.default_spread) {
        const el = document.getElementById('cfg-spread');
        if (el) el.value = cfg.default_spread;
      }
      if (cfg.default_iva) {
        const el = document.getElementById('cfg-iva');
        if (el) el.value = cfg.default_iva;
      }
      console.log('⚙️ Config cargada de Supabase');
    }

    // Load clientes (FUENTES)
    const clientes = await loadClientesFromSupabase();
    if (clientes && clientes.length > 0) {
      window.FUENTES = clientes;
      console.log(`👥 ${clientes.length} clientes cargados de Supabase`);
    }

    // Load precios por cliente
    const cp = await loadPreciosClienteFromSupabase();
    if (cp) {
      window.CLIENTES_PRECIOS = cp;
      console.log('💰 Precios por cliente cargados de Supabase');
    }

    window._supabaseReady = true;
    console.log('✅ Supabase Bridge listo — datos en la nube');

    // Re-render si las funciones existen
    if (typeof window.renderPrecios === 'function') window.renderPrecios();
    if (typeof window.rebuildFuenteSelects === 'function') window.rebuildFuenteSelects();
  } else {
    console.log('⚠️ Modo local — usando datos del navegador');
  }
});
