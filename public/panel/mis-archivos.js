// ============================================================
// MIS ARCHIVOS (R-AUD-040) — extraído de panel-rdo.html (antifragilidad panel,
// bloque 12, ola de tabs sueltos)
// Ya venía como IIFE auto-contenida en su propio <script>. Se
// preserva tal cual. Cero dependencia con núcleo/Diego LLM/
// Precios/Herramientas Ext/Facturación Grupo/Andrea-Comex/CRM.
// ============================================================

(function () {
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }
  function tipoEmoji(tipo) {
    return ({pdf:'📄',docx:'📝',xlsx:'📊',pptx:'🎞️',png:'🖼️',jpg:'🖼️',svg:'✨',html:'🌐',md:'📑',csv:'📋',txt:'📄',audio:'🔊',video:'🎥',otro:'📦'})[tipo] || '📦';
  }
  function fmtSize(bytes) {
    if (bytes == null) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }); }
    catch { return iso; }
  }

  async function refrescar() {
    const lista = document.getElementById('misArchivosLista');
    const resumen = document.getElementById('misArchivosResumen');
    const tipo = document.getElementById('misArchivosTipo')?.value || null;
    const tema = document.getElementById('misArchivosTema')?.value?.trim() || null;
    const dias = parseInt(document.getElementById('misArchivosDias')?.value || '30', 10);

    try {
      const { data, error } = await sb.rpc('mis_archivos', {
        p_tipo: tipo, p_tema: tema, p_silo: null, p_dias_atras: dias
      });
      if (error) throw error;
      const rows = data || [];
      if (resumen) resumen.innerHTML = `<strong>${rows.length}</strong> archivos`;

      if (!rows.length) {
        lista.innerHTML = '<div class="bg-white rounded-md shadow-sm p-8 text-center text-stone-500">📭 No hay archivos con esos filtros. Ajustá filtros o esperá a que algún PC registre uno con <code>SELECT panel.registrar_archivo(...)</code>.</div>';
        return;
      }
      lista.innerHTML = rows.map(a => `
        <div class="bg-white rounded-md shadow-sm border border-stone-200 p-3 flex items-center gap-3">
          <div class="text-2xl">${tipoEmoji(a.tipo)}</div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-stone-800 truncate" title="${escapeHtml(a.nombre)}">${escapeHtml(a.nombre)}</div>
            <div class="text-xs text-stone-500 flex flex-wrap gap-2">
              <span>${escapeHtml(a.tipo)}</span>
              <span>· ${escapeHtml(a.autor)}</span>
              ${a.tema ? `<span>· ${escapeHtml(a.tema)}</span>` : ''}
              ${a.silo ? `<span>· silo ${escapeHtml(a.silo)}</span>` : '<span>· público</span>'}
              <span>· ${fmtSize(a.size_bytes)}</span>
              <span>· ${fmtDate(a.creado_en)}</span>
              ${a.descargas > 0 ? `<span>· ⬇ ${a.descargas}</span>` : ''}
            </div>
          </div>
          <div class="flex-shrink-0">
            <a href="${escapeHtml(a.path)}" target="_blank" rel="noopener" title="Abrir / descargar archivo" class="vo-bg-verde-rec text-white text-xs px-3 py-1.5 rounded font-medium hover:opacity-90 inline-block">↗ Abrir</a>
          </div>
        </div>
      `).join('');
    } catch (e) {
      console.error('[MisArchivos]', e);
      lista.innerHTML = `<div class="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 text-sm">Error cargando archivos: ${escapeHtml(e.message || e)}. Verificá tu sesión.</div>`;
    }
  }

  function init() {
    document.querySelector('button[data-tab="mis_archivos"]')?.addEventListener('click', () => setTimeout(refrescar, 100));
    document.querySelector('a[data-v4-tab="mis_archivos"]')?.addEventListener('click', () => setTimeout(refrescar, 100));
    document.getElementById('misArchivosRefreshBtn')?.addEventListener('click', refrescar);
    ['misArchivosTipo','misArchivosDias','misArchivosTema'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', refrescar);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
