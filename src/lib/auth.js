import { supabase } from './supabase.js';

/**
 * Verifica si hay una sesion activa guardada en localStorage
 */
export function getSession() {
  const session = localStorage.getItem('rf_session');
  if (!session) return null;
  try {
    const parsed = JSON.parse(session);
    // Verificar que no haya expirado (24 horas)
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('rf_session');
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

/**
 * Login por email + password para el Panel Admin
 */
export async function loginEmail(email, password) {
  try {
    const { data, error } = await supabase
      .from('usuarios_autorizados')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('activo', true)
      .eq('acceso_panel', true)
      .single();

    if (error || !data) {
      return { ok: false, error: 'Email no autorizado para el panel' };
    }

    // Verificar password (usamos el PIN como password para simplificar)
    if (data.pin !== password) {
      return { ok: false, error: 'Contraseña incorrecta' };
    }

    const session = {
      id: data.id,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      tipo: 'email',
      timestamp: Date.now()
    };
    localStorage.setItem('rf_session', JSON.stringify(session));
    return { ok: true, user: session };
  } catch (e) {
    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * Login por telefono + PIN para el Asistente
 */
export async function loginTelefono(telefono, pin) {
  try {
    // Normalizar telefono: remover espacios, asegurar formato +56
    let tel = telefono.replace(/\s/g, '').replace(/[^0-9+]/g, '');
    if (tel.startsWith('9') && tel.length === 9) tel = '+56' + tel;
    if (tel.startsWith('56') && !tel.startsWith('+')) tel = '+' + tel;

    const { data, error } = await supabase
      .from('usuarios_autorizados')
      .select('*')
      .eq('telefono', tel)
      .eq('activo', true)
      .eq('acceso_asistente', true)
      .single();

    if (error || !data) {
      return { ok: false, error: 'Numero no autorizado' };
    }

    if (data.pin !== pin) {
      return { ok: false, error: 'PIN incorrecto' };
    }

    const session = {
      id: data.id,
      nombre: data.nombre,
      telefono: data.telefono,
      rol: data.rol,
      tipo: 'telefono',
      timestamp: Date.now()
    };
    localStorage.setItem('rf_session', JSON.stringify(session));
    return { ok: true, user: session };
  } catch (e) {
    return { ok: false, error: 'Error de conexión' };
  }
}

/**
 * Cerrar sesion
 */
export function logout() {
  localStorage.removeItem('rf_session');
  window.location.reload();
}
