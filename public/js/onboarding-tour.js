/* ═══════════════════════════════════════════════════════════
   Panel RDO · Onboarding tour
   Branch: claude/panel-amor-verde-26may
   Propósito: primera vez que el usuario entra al panel rediseñado,
              tour de 5 pasos · 30 segundos · cero fricción.
   Persistencia: localStorage para no repetir.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'amor_tour_completed_v1';
  const FORCE_PARAM = 'tour=1';

  function shouldRun() {
    if (location.search.includes(FORCE_PARAM)) return true;
    return !localStorage.getItem(STORAGE_KEY);
  }

  const PASOS = [
    {
      titulo: '💚 Bienvenido al nuevo panel',
      texto: 'Estamos mejorando todo para que cada clic sume al verde-amor y nada al divorcio. Te muestro 4 cosas en 30 segundos.',
      cta: 'Empezar →'
    },
    {
      titulo: '💚 1. La aguja amor ↔ divorcio',
      texto: 'Mirá abajo · cada clic exitoso te mueve al amor (💚), cada error te mueve al divorcio (💔). Hacé clic en la aguja para ver tu historial personal.',
      target: '#amorAgujaContainer',
      cta: 'La veo · siguiente →'
    },
    {
      titulo: '🟢🟡🔴 2. Semáforo de confianza',
      texto: 'Cada pestaña tiene un puntito en la esquina: verde = usalo seguro · amarillo = parate si dudás · rojo = esperá, te lo demostraremos.',
      target: 'button.tab-btn[data-tab="portada"]',
      cta: 'Capto · siguiente →'
    },
    {
      titulo: '⬅️ 3. Botón Volver / Portada',
      texto: 'Arriba siempre tenés "Volver" y "Portada". Nunca más quedás atrapado en una isla.',
      target: '#navVueltaBar',
      cta: 'Útil · siguiente →'
    },
    {
      titulo: '🎤 4. Hablale a Diego',
      texto: 'En el chat de Diego hay un botón 🎤 · clic, hablás natural, y se envía solo. Probalo después.',
      cta: 'Listo · usar el panel'
    }
  ];

  let pasoActual = 0;
  let overlay = null;

  function mostrarPaso(idx) {
    pasoActual = idx;
    cerrar();
    if (idx >= PASOS.length) {
      completar();
      return;
    }
    const paso = PASOS[idx];
    overlay = document.createElement('div');
    overlay.id = 'amorTourOverlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.65);
      backdrop-filter: blur(2px); z-index: 200;
      display: flex; align-items: center; justify-content: center;
      padding: 24px; animation: amor-fadein 0.25s ease;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: white; border-radius: 20px;
      max-width: 440px; width: 100%; padding: 30px 26px;
      box-shadow: 0 20px 60px rgba(26,147,111,0.35);
      border-top: 6px solid var(--amor-verde-medio);
      text-align: center;
      animation: amor-slideup 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    const dots = PASOS.map((_, i) => `<span style="width:8px; height:8px; border-radius:50%; background:${i === idx ? 'var(--amor-verde-medio)' : '#d1d5db'};"></span>`).join('');

    card.innerHTML = `
      <div style="display:flex; gap:6px; justify-content:center; margin-bottom:14px;">${dots}</div>
      <h2 style="font-size:22px; font-weight:800; color:var(--amor-verde-profundo); line-height:1.2; margin-bottom:14px;">${paso.titulo}</h2>
      <p style="font-size:15px; color:#4b5563; line-height:1.55; margin-bottom:20px;">${paso.texto}</p>
      <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
        ${idx > 0 ? `<button id="tourAtras" style="padding:10px 18px; font-size:13px; font-weight:600; color:#6b7280; background:#f3f4f6; border:none; border-radius:999px; cursor:pointer; min-height:40px;">← Atrás</button>` : ''}
        <button id="tourSaltar" style="padding:10px 16px; font-size:12px; color:#9ca3af; background:transparent; border:none; cursor:pointer;">Saltar</button>
        <button id="tourNext" style="padding:12px 22px; font-size:14px; font-weight:700; color:white; background:var(--amor-verde-medio); border:none; border-radius:999px; cursor:pointer; box-shadow:0 4px 14px rgba(26,147,111,0.4); min-height:40px;">${paso.cta}</button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    if (paso.target) {
      const t = document.querySelector(paso.target);
      if (t) {
        const rect = t.getBoundingClientRect();
        const ring = document.createElement('div');
        ring.id = 'amorTourRing';
        ring.style.cssText = `
          position: fixed; left: ${rect.left - 8}px; top: ${rect.top - 8}px;
          width: ${rect.width + 16}px; height: ${rect.height + 16}px;
          border-radius: 16px; box-shadow: 0 0 0 4px var(--amor-verde-medio), 0 0 0 9999px rgba(0,0,0,0.55);
          pointer-events: none; z-index: 199;
          animation: amor-halo 2s ease-in-out infinite;
        `;
        document.body.appendChild(ring);
        overlay.style.background = 'transparent';
        overlay.style.backdropFilter = 'none';
      }
    }

    card.querySelector('#tourNext').addEventListener('click', () => mostrarPaso(idx + 1));
    const back = card.querySelector('#tourAtras');
    if (back) back.addEventListener('click', () => mostrarPaso(idx - 1));
    card.querySelector('#tourSaltar').addEventListener('click', completar);
  }

  function cerrar() {
    document.getElementById('amorTourOverlay')?.remove();
    document.getElementById('amorTourRing')?.remove();
  }

  function completar() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch(e){}
    cerrar();
    if (window.amorDivorcio) window.amorDivorcio.mover(+3, 'completó tour onboarding', 'global');
  }

  window.amorTour = {
    iniciar: () => mostrarPaso(0),
    reset: () => { try { localStorage.removeItem(STORAGE_KEY); } catch(e){} }
  };

  function init() {
    if (!shouldRun()) return;
    setTimeout(() => mostrarPaso(0), 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  console.log('🚪 Onboarding tour activo · 5 pasos · skip ?tour=1 para forzar');
})();
