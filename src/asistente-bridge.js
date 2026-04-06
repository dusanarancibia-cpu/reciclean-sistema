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

  // Show login, hide app content
  document.documentElement.style.visibility = 'visible';
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

// ── Global phone login (called from inline form) ──
window._doPhoneLogin = async function() {
  const btn = document.getElementById('login-btn');
  const errDiv = document.getElementById('login-error');
  const tel = document.getElementById('login-tel').value;
  const pin = document.getElementById('login-pin').value;
  if (!tel || !pin) { errDiv.textContent = 'Ingresa tu numero y PIN'; errDiv.style.display = 'block'; return; }
  btn.textContent = 'Verificando...'; btn.disabled = true;
  const result = await loginTelefono(tel, pin);
  if (result.ok) {
    window.location.reload();
  } else {
    errDiv.textContent = result.error; errDiv.style.display = 'block';
    btn.textContent = 'Ingresar'; btn.disabled = false;
  }
};

// ── Load precios activos desde Supabase ──
async function loadPreciosFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('v_precios_activos')
      .select('*');
    if (error) throw error;

    // Convertir a formato MATERIALES_DATA[sucursal] = [{id, material, precio, ...}]
    const result = {};
    const sucursales = ['Cerrillos', 'Maipú', 'Talca', 'Puerto Montt'];
    sucursales.forEach(s => { result[s] = []; });

    // Agrupar por sucursal
    data.forEach(row => {
      const suc = row.sucursal;
      if (!result[suc]) result[suc] = [];
      result[suc].push({
        id:              row.material_id,
        material:        row.material,
        categoria:       row.categoria,
        reciclean:       row.reciclean,
        farex:           row.farex,
        precioCompra:    parseFloat(row.precio_compra)    || 0,
        precioLista:     parseFloat(row.precio_lista)     || 0,
        precioEjecutivo: parseFloat(row.precio_ejecutivo) || 0,
        precioMaximo:    parseFloat(row.precio_maximo)    || 0,
        metaKgTotal:     row.meta_kg                      || 0,
        metaCategoriaTotal: 0,
        ivaTret:         row.iva_aplicado,
        flete:           parseFloat(row.flete_aplicado ?? row.flete_default) || 15,
        margen:          parseFloat(row.margen_aplicado ?? row.margen_default) || 0.15
      });
    });

    // Calcular metaCategoriaTotal: suma de metaKgTotal por categoría
    Object.keys(result).forEach(suc => {
      const catMeta = {};
      result[suc].forEach(m => {
        if (!catMeta[m.categoria]) catMeta[m.categoria] = 0;
        catMeta[m.categoria] += (m.metaKgTotal || 0);
      });
      result[suc].forEach(m => {
        m.metaCategoriaTotal = catMeta[m.categoria] || 0;
      });
    });

    // Ordenar por categoría y nombre
    Object.keys(result).forEach(suc => {
      result[suc].sort((a, b) => {
        if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
        return a.material.localeCompare(b.material);
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

    // Actualizar la vista con los precios nuevos
    const sucSelect = document.getElementById('neg-suc');
    const suc = sucSelect ? sucSelect.value : 'Cerrillos';
    window.MATERIALES = precios[suc] || precios['Cerrillos'] || [];

    // Re-renderizar la lista de materiales
    if (typeof window.updateSucursalMateriales === 'function') window.updateSucursalMateriales();
    if (typeof window.render === 'function') window.render();

    // Actualizar footer con info de Supabase
    const totalMats = precios['Cerrillos'] ? precios['Cerrillos'].length : 0;
    const footerEl = document.querySelector('.footer');
    if (footerEl) {
      const hoy = new Date().toLocaleDateString('es-CL');
      footerEl.textContent = 'v25 · Supabase · ' + totalMats + ' Materiales · ' + hoy + ' · *Precios sujetos a cambios según mercado';
    }
  } else {
    console.log('⚠️ Usando precios locales (Supabase no disponible)');
  }

  // Reemplazar cloudStorage con Supabase
  window.cloudStorage = supabaseCloudStorage;
  console.log('☁️ Cloud storage conectado a Supabase');

  // Suscribirse a cambios de precios en tiempo real
  supabase.channel('precios-updates')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'precios_version' }, payload => {
      console.log('🔔 Nueva versión de precios detectada:', payload.new);
      // Mostrar banner de actualización
      showPriceUpdateBanner(payload.new.label || 'nueva versión');
    })
    .subscribe();
}

function showPriceUpdateBanner(label) {
  // Remover banner anterior si existe
  var old = document.getElementById('price-update-banner');
  if (old) old.remove();

  var banner = document.createElement('div');
  banner.id = 'price-update-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#1A7A3C,#27AE60);color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 20px rgba(0,0,0,.3);font-family:system-ui,sans-serif;animation:slideDown .3s ease;';
  banner.innerHTML = '<div style="display:flex;align-items:center;gap:10px;">'
    + '<div style="font-size:20px;">🔔</div>'
    + '<div><div style="font-weight:700;font-size:13px;">Precios actualizados</div>'
    + '<div style="font-size:11px;opacity:.8;">Versión ' + label + ' — toca para recargar</div></div></div>'
    + '<button onclick="location.reload()" style="background:#fff;color:#1A7A3C;border:none;padding:6px 14px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;">Actualizar</button>';
  document.body.prepend(banner);

  // Vibrar si el dispositivo lo soporta
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

  // Auto-ocultar después de 30 segundos
  setTimeout(function() {
    if (banner.parentNode) banner.style.opacity = '0.7';
  }, 30000);
} // fin showPriceUpdateBanner

// ── Auto-init ──
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🔌 Asistente Bridge cargando...');

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(e => console.log('SW:', e));
  }

  // Check login — inline script handles login form if no session
  const session = getSession();
  if (!session) {
    console.log('🔒 Sin sesión — login activo');
    return;
  }
  console.log(`👤 Sesión: ${session.nombre}`);
  initSupabaseData();
});
