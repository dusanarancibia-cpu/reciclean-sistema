/* ═══════════════════════════════════════════════════════════
   Panel RDO · Diego con voz (Web Speech API)
   Branch: claude/panel-amor-verde-26may
   Propósito: poder hablarle a Diego en lugar de escribir.
              Botón 🎤 en el FAB · push-to-talk.
   Falla con elegancia si el navegador no soporta SpeechRecognition.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const Recog = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supportSTT = !!Recog;
  const supportTTS = 'speechSynthesis' in window;

  let recog = null;
  let escuchando = false;
  let btnVoz = null;

  function buscarInputDiego() {
    const ids = ['diegoInput', 'diegoMessageInput', 'fabInput', 'dieguito-input', 'chat-input'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    const fab = document.querySelector('[id*="diego" i], [class*="diego" i]');
    if (fab) {
      const tx = fab.querySelector('textarea, input[type="text"]');
      if (tx) return tx;
    }
    return null;
  }

  function buscarBotonEnviar() {
    const ids = ['diegoSend', 'diegoEnviar', 'fabSend', 'diego-send', 'chat-send'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    const fab = document.querySelector('[id*="diego" i], [class*="diego" i]');
    if (fab) {
      const btn = fab.querySelector('button[type="submit"], button[title*="enviar" i], button[aria-label*="enviar" i]');
      if (btn) return btn;
    }
    return null;
  }

  function crearBotonVoz() {
    if (!supportSTT) return;
    if (document.getElementById('diegoBtnVoz')) return;
    const input = buscarInputDiego();
    if (!input) {
      setTimeout(crearBotonVoz, 3000);
      return;
    }
    const btn = document.createElement('button');
    btn.id = 'diegoBtnVoz';
    btn.type = 'button';
    btn.title = 'Hablale a Diego · clic para grabar · clic de nuevo para enviar';
    btn.innerHTML = '🎤';
    btn.style.cssText = `
      width: 38px; height: 38px; border-radius: 50%;
      border: 2px solid var(--amor-verde-medio); background: white;
      color: var(--amor-verde-profundo); font-size: 18px; cursor: pointer;
      margin-left: 6px; transition: all 0.2s; flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    `;
    btn.addEventListener('click', toggleEscucha);
    if (input.parentNode) input.parentNode.insertBefore(btn, input.nextSibling);
    btnVoz = btn;
  }

  function toggleEscucha() {
    if (!supportSTT) {
      alert('Tu navegador no soporta dictado por voz. Usá Chrome o Edge.');
      return;
    }
    if (escuchando) detener(); else iniciar();
  }

  function iniciar() {
    recog = new Recog();
    recog.lang = 'es-CL';
    recog.continuous = false;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    escuchando = true;
    btnVoz.innerHTML = '🔴';
    btnVoz.style.background = 'var(--divorcio-rojo)';
    btnVoz.style.color = 'white';
    btnVoz.style.animation = 'amor-pulse-verde 1.2s ease-in-out infinite';
    btnVoz.title = 'Grabando · clic para parar';
    mostrarToast('🎤 Escuchando · hablá tranquilo…');

    recog.onresult = (ev) => {
      const input = buscarInputDiego();
      if (!input) return;
      const transcript = Array.from(ev.results).map(r => r[0].transcript).join('');
      input.value = transcript;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    recog.onerror = (ev) => {
      escuchando = false;
      resetearBoton();
      mostrarToast('⚠️ ' + (ev.error === 'no-speech' ? 'No te escuché. Probá de nuevo.' :
                   ev.error === 'not-allowed' ? 'Permitime usar el micrófono en tu navegador.' :
                   'Error voz: ' + ev.error));
    };

    recog.onend = () => {
      escuchando = false;
      resetearBoton();
      const input = buscarInputDiego();
      if (input && input.value.trim()) {
        const btnEnviar = buscarBotonEnviar();
        if (btnEnviar) {
          setTimeout(() => btnEnviar.click(), 200);
          if (window.amorDivorcio) window.amorDivorcio.mover(+2, 'habló a Diego por voz', 'diego_chat');
        }
      }
    };

    try { recog.start(); } catch (e) {
      escuchando = false;
      resetearBoton();
      mostrarToast('⚠️ No pude arrancar el micrófono');
    }
  }

  function detener() {
    if (recog) { try { recog.stop(); } catch (e) {} }
    escuchando = false;
    resetearBoton();
  }

  function resetearBoton() {
    if (!btnVoz) return;
    btnVoz.innerHTML = '🎤';
    btnVoz.style.background = 'white';
    btnVoz.style.color = 'var(--amor-verde-profundo)';
    btnVoz.style.animation = '';
    btnVoz.title = 'Hablale a Diego · clic para grabar';
  }

  function mostrarToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = `
      position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
      background: white; padding: 10px 18px; border-radius: 999px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15); font-size: 13px; z-index: 95;
      border-left: 4px solid var(--amor-verde-medio);
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  window.diegoVoz = {
    leer(texto) {
      if (!supportTTS || !texto) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'es-CL'; u.rate = 1.05; u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    },
    detener() { if (supportTTS) window.speechSynthesis.cancel(); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', crearBotonVoz);
  } else {
    setTimeout(crearBotonVoz, 1500);
  }
  console.log('🎤 Diego voz · STT:' + supportSTT + ' TTS:' + supportTTS);
})();
