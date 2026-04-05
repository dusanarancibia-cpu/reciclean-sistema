/**
 * Asistente Bridge — Reemplaza MATERIALES_DATA hardcodeado con datos de Supabase
 * y cotizaciones de JSONBin.io con tabla cotizaciones de Supabase
 */
import { supabase } from './lib/supabase.js';
import { getSession, loginTelefono, logout } from './lib/auth.js';

window._supabase = supabase;

// ── LOGIN GATE (Telefono + PIN) ──
function showLoginGate() {
  const overlay = document.createElement('div');
  overlay.id = 'login-gate';
  overlay.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1A7A3C 0%,#0D4A22 100%);font-family:'Segoe UI',system-ui,sans-serif;padding:20px;">
      <div style="background:#fff;border-radius:20px;padding:32px 28px;width:100%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:32px;margin-bottom:4px;">♻️</div>
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;">Reciclean · Farex</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px;color:#1A1A14;">Asistente Comercial</div>
        </div>
        <div id="login-error" style="display:none;background:#FDECEA;border:1px solid #F5C6C0;color:#C0392B;padding:8px 12px;border-radius:10px;font-size:12px;margin-bottom:12px;text-align:center;"></div>
        <div style="font-size:12px;color:#666;margin-bottom:6px;font-weight:600;">Numero de WhatsApp</div>
        <input id="login-tel" type="tel" placeholder="+56 9 1234 5678" style="width:100%;padding:14px;border:1.5px solid #ddd;border-radius:12px;font-size:16px;margin-bottom:12px;outline:none;text-align:center;letter-spacing:1px;" />
        <div style="font-size:12px;color:#666;margin-bottom:6px;font-weight:600;">PIN de acceso</div>
        <input id="login-pin" type="password" inputmode="numeric" maxlength="6" placeholder="****" style="width:100%;padding:14px;border:1.5px solid #ddd;border-radius:12px;font-size:24px;margin-bottom:18px;outline:none;text-align:center;letter-spacing:8px;" />
        <button id="login-btn" style="width:100%;padding:14px;background:#1A7A3C;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">Ingresar</button>
        <div style="text-align:center;margin-top:14px;font-size:11px;color:#aaa;">Solo numeros autorizados</div>
      </div>
    </div>
  `;

  // Hide app content
  document.querySelectorAll('header, .container, .app-content, main').forEach(el => { el.style.display = 'none'; });
  document.body.prepend(overlay);
  document.body.style.maxWidth = 'none';

  document.getElementById('login-btn').addEventListener('click', handlePhoneLogin);
  document.getElementById('login-pin').addEventListener('keydown', e => { if (e.key === 'Enter') handlePhoneLogin(); });
}

async function handlePhoneLogin() {
  const btn = document.getElementById('login-btn');
  const errDiv = document.getElementById('login-error');
  const tel = document.getElementById('login-tel').value;
  const pin = document.getElementById('login-pin').value;

  if (!tel || !pin) { errDiv.textContent = 'Ingresa tu numero y PIN'; errDiv.style.display = 'block'; return; }

  btn.textContent = 'Verificando...';
  btn.disabled = true;

  const result = await loginTelefono(tel, pin);

  if (result.ok) {
    document.getElementById('login-gate').remove();
    document.body.style.maxWidth = '480px';
    document.querySelectorAll('header, .container, .app-content, main').forEach(el => { el.style.display = ''; });
    initSupabaseData();
  } else {
    errDiv.textContent = result.error;
    errDiv.style.display = 'block';
    btn.textContent = 'Ingresar';
    btn.disabled = false;
  }
}

window._logout = logout;

// ── Load precios activos desde Supabase ──
async function loadPreciosFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('v_precios_activos')
      .select('*');
    if (error) throw error;

    // Convertir a formato MATERIALES_DATA[sucursal] = [{nombre, precio, ...}]
    const result = {};
    const sucursales = ['Cerrillos', 'Maipú', 'Talca', 'Puerto Montt'];
    sucursales.forEach(s => { result[s] = []; });

    // Agrupar por sucursal
    data.forEach(row => {
      const suc = row.sucursal;
      if (!result[suc]) result[suc] = [];
      result[suc].push({
        nombre: row.material,
        categoria: row.categoria,
        precio: parseFloat(row.precio_lista),
        precioEjec: parseFloat(row.precio_ejecutivo),
        precioMax: parseFloat(row.precio_maximo),
        compra: parseFloat(row.precio_compra),
        iva: row.iva_aplicado,
        farex: row.farex,
        reciclean: row.reciclean
      });
    });

    // Ordenar por categoria y nombre
    Object.keys(result).forEach(suc => {
      result[suc].sort((a, b) => {
        if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
        return a.nombre.localeCompare(b.nombre);
      });
    });

    return result;
  } catch (e) {
    console.warn('Error cargando precios de Supabase:', e);
    return null;
  }
}

// ── Reemplazar cloudStorage con Supabase ──
const supabaseCloudStorage = {
  async getHistorial() {
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      // Convertir a formato compatible con el asistente
      return data.map(row => ({
        id: 'COT-' + row.id,
        timestamp: row.created_at,
        sucursal: row.sucursal_id,
        ejecutivo: row.ejecutivo,
        proveedor: row.proveedor,
        rut: row.rut,
        frecuencia: row.frecuencia,
        kgFactura: row.kg_factura,
        materiales: row.materiales,
        mcTotal: row.mc_total,
        estado: row.estado
      }));
    } catch (e) {
      console.warn('Error cargando historial:', e);
      return this._getFallback();
    }
  },

  async guardarCotizacion(cotizacion) {
    try {
      // Mapear sucursal nombre a ID
      const sucMap = { 'Cerrillos': 1, 'Maipú': 2, 'Talca': 3, 'Puerto Montt': 4 };

      const { error } = await supabase
        .from('cotizaciones')
        .insert({
          sucursal_id: sucMap[cotizacion.sucursal] || 1,
          ejecutivo: cotizacion.ejecutivo || '',
          proveedor: cotizacion.proveedor || '',
          rut: cotizacion.rut || '',
          frecuencia: cotizacion.frecuencia || '',
          kg_factura: cotizacion.kgFactura || 0,
          materiales: cotizacion.materiales || [],
          mc_total: cotizacion.mcTotal || 0,
          estado: 'pendiente'
        });
      if (error) throw error;
      console.log('✅ Cotización guardada en Supabase');
    } catch (e) {
      console.warn('Error guardando cotización:', e);
      // Fallback a localStorage
      const hist = JSON.parse(localStorage.getItem('cotizaciones_local') || '[]');
      cotizacion.id = 'COT-' + Date.now();
      cotizacion.timestamp = new Date().toISOString();
      hist.push(cotizacion);
      localStorage.setItem('cotizaciones_local', JSON.stringify(hist));
    }
  },

  _getFallback() {
    return JSON.parse(localStorage.getItem('cotizaciones_local') || '[]');
  }
};

// ── Init data from Supabase ──
async function initSupabaseData() {
  console.log('📡 Cargando datos de Supabase...');
  const precios = await loadPreciosFromSupabase();
  if (precios && Object.keys(precios).length > 0) {
    // Reemplazar los datos hardcodeados
    window.MATERIALES_DATA = precios;
    window.MATERIALES = precios['Cerrillos'] || [];
    console.log('✅ Precios cargados de Supabase en tiempo real');

    // Actualizar la vista si la sucursal ya está seleccionada
    const sucSelect = document.getElementById('sucursal');
    if (sucSelect) {
      const suc = sucSelect.value;
      window.MATERIALES = precios[suc] || precios['Cerrillos'] || [];
    }
  } else {
    console.log('⚠️ Usando precios locales (Supabase no disponible)');
  }

  // Reemplazar cloudStorage con Supabase
  window.cloudStorage = supabaseCloudStorage;
  console.log('☁️ Cloud storage conectado a Supabase');
}

// ── Auto-init ──
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🔌 Asistente Bridge cargando...');

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
  console.log(`👤 Sesión: ${session.nombre}`);
  initSupabaseData();
});
