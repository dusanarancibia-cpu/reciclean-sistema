/**
 * Asistente Bridge — Reemplaza MATERIALES_DATA hardcodeado con datos de Supabase
 * y cotizaciones de JSONBin.io con tabla cotizaciones de Supabase
 */
import { supabase } from './lib/supabase.js';

window._supabase = supabase;

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

// ── Auto-init ──
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🔌 Asistente Bridge cargando...');

  // Cargar precios vivos desde Supabase
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
});
