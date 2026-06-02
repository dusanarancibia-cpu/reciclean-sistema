// Reciclean Widget · Chat Diego para sitios web
// Sub-PR D.1 + D.2 D-DIEGO-50X-V4 Ola D · Pablo 02-jun-2026
//
// Uso (en cualquier página):
//   <script src="https://reciclean-sistema.vercel.app/widget/widget.js" defer></script>
//
// Cuando reciclean.cl tenga repo propio, se mueve. Mientras tanto vive acá.
// Source de tracking: widget_web

(function () {
  'use strict';
  if (window.__reciclean_widget_init) return;
  window.__reciclean_widget_init = true;

  var SUPABASE_URL = 'https://eknmtsrtfkzroxnovfqn.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_y-ivpVdiL141kz4ZASje5g_SYG7do5z';

  // D.4: detectar idioma del visitante (es/en/zh/pt). Override con window.__reciclean_widget_lang
  var IDIOMAS_SOPORTADOS = ['es', 'en', 'zh', 'pt'];
  function detectarIdioma() {
    var override = window.__reciclean_widget_lang;
    if (override && IDIOMAS_SOPORTADOS.indexOf(String(override).slice(0,2)) !== -1) return String(override).slice(0,2);
    var nav = (navigator.language || navigator.userLanguage || 'es').toLowerCase().slice(0, 2);
    return IDIOMAS_SOPORTADOS.indexOf(nav) !== -1 ? nav : 'es';
  }
  var idioma = detectarIdioma();

  // Strings UI por idioma
  var I18N = {
    es: {fab_aria:'Abrir chat con Diego', name:'Diego', sub:'Respondo al toque', tag:'Asistente Reciclean', close:'Cerrar', placeholder:'Escribí tu pregunta…', greeting:'Hola 👋 Soy Diego, asistente comercial de Reciclean. ¿En qué te ayudo? Precios, retiros, consultas, lo que necesites.', consent_title:'Antes de chatear con Diego', consent_body:'Necesitamos tu autorización para tratar tus mensajes (Ley 21.719 Chile).', consent_label:'Acepto el tratamiento de mis datos conforme a Ley 21.719.', consent_required:'Marcá la casilla de consentimiento arriba ☝️', consent_thanks:'¡Gracias! Ya podés escribirme.', thinking:'Diego está pensando…', error_conn:'Sin conexión. Probá de nuevo.'},
    en: {fab_aria:'Open chat with Diego', name:'Diego', sub:'Quick replies', tag:'Reciclean Assistant', close:'Close', placeholder:'Type your question…', greeting:"Hi 👋 I'm Diego, Reciclean's commercial assistant. How can I help? Prices, pickups, info, anything you need.", consent_title:'Before chatting with Diego', consent_body:'We need your authorization to process your messages (Chile Law 21.719).', consent_label:'I accept the processing of my data under Law 21.719.', consent_required:'Check the consent box above ☝️', consent_thanks:'Thanks! You can write to me now.', thinking:'Diego is thinking…', error_conn:'No connection. Try again.'},
    zh: {fab_aria:'与 Diego 开始聊天', name:'Diego', sub:'快速回复', tag:'Reciclean 助手', close:'关闭', placeholder:'输入您的问题…', greeting:'您好 👋 我是 Diego，Reciclean 的商业助理。有什么可以帮您？价格、取货、咨询，应有尽有。', consent_title:'与 Diego 聊天前', consent_body:'我们需要您的授权来处理您的消息（智利 21.719 法）。', consent_label:'我接受按照 21.719 法处理我的数据。', consent_required:'请勾选上方同意框 ☝️', consent_thanks:'谢谢！现在您可以给我留言了。', thinking:'Diego 正在思考…', error_conn:'无连接。请重试。'},
    pt: {fab_aria:'Abrir chat com o Diego', name:'Diego', sub:'Respondo na hora', tag:'Assistente Reciclean', close:'Fechar', placeholder:'Escreva sua pergunta…', greeting:'Olá 👋 Sou o Diego, assistente comercial da Reciclean. Como posso ajudar? Preços, retiradas, consultas, o que precisar.', consent_title:'Antes de conversar com o Diego', consent_body:'Precisamos da sua autorização para tratar suas mensagens (Lei 21.719 Chile).', consent_label:'Aceito o tratamento dos meus dados conforme a Lei 21.719.', consent_required:'Marque a caixa de consentimento acima ☝️', consent_thanks:'Obrigado! Já pode me escrever.', thinking:'Diego está pensando…', error_conn:'Sem conexão. Tente de novo.'},
  };
  var T = I18N[idioma];

  // Identidad anónima por visitante (D.3): localStorage key con UUID
  var WIDGET_VISITOR_KEY = 'reciclean_widget_visitor_id';
  var visitorId = (function () {
    try {
      var v = localStorage.getItem(WIDGET_VISITOR_KEY);
      if (v) return v;
      var n = 'wid_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(WIDGET_VISITOR_KEY, n);
      return n;
    } catch (e) { return 'wid_anon'; }
  })();

  // Inyectar estilos
  var styles = '\
  #reciclean-widget-fab{position:fixed;bottom:20px;right:20px;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 36% 32%,rgba(255,255,255,0.55) 0%,transparent 52%),radial-gradient(circle at 66% 72%,rgba(0,220,130,0.35) 0%,transparent 50%),linear-gradient(145deg,#1E90FF 0%,#00C853 100%);box-shadow:0 14px 40px rgba(0,180,90,0.45),0 4px 12px rgba(30,144,255,0.3),inset 0 1px 1px rgba(255,255,255,0.45),inset 0 -10px 24px rgba(0,0,0,0.16);cursor:pointer;z-index:2147483647;display:flex;align-items:center;justify-content:center;border:none;animation:rwFloat 3s ease-in-out infinite;transition:transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s ease;overflow:visible}\
  #reciclean-widget-fab::before{content:"";position:absolute;top:9px;left:13px;width:28px;height:15px;background:radial-gradient(ellipse,rgba(255,255,255,0.65) 0%,transparent 70%);border-radius:50%;pointer-events:none}\
  @keyframes rwFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}\
  #reciclean-widget-fab:hover{transform:scale(1.08) translateY(-3px)!important;box-shadow:0 18px 48px rgba(0,180,90,0.55),0 6px 16px rgba(30,144,255,0.35),inset 0 1px 1px rgba(255,255,255,0.5),inset 0 -10px 24px rgba(0,0,0,0.16)}\
  #reciclean-widget-fab.hidden{display:none}\
  #reciclean-widget-panel{position:fixed;bottom:90px;right:20px;width:360px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.25);z-index:2147483647;display:none;flex-direction:column;overflow:hidden;font-family:"Segoe UI",system-ui,sans-serif}\
  #reciclean-widget-panel.open{display:flex}\
  .rwp-header{background:linear-gradient(135deg,#0D1B2A,#1A2D3E);padding:14px 16px;display:flex;align-items:center;gap:10px;color:#fff}\
  .rwp-header .icon{width:36px;height:36px;border-radius:50%;background:radial-gradient(circle at 38% 34%,rgba(255,255,255,0.45) 0%,transparent 55%),linear-gradient(145deg,#1E90FF 0%,#00C853 100%);box-shadow:0 4px 12px rgba(0,180,90,0.4),inset 0 1px 0 rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}\
  .rwp-header .info{flex:1;min-width:0}\
  .rwp-header .tag{color:#4FC3F7;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase}\
  .rwp-header .name{font-size:14px;font-weight:700;color:#fff;line-height:1.2}\
  .rwp-header .sub{font-size:11px;color:#6B8FA8}\
  .rwp-header .close{background:rgba(255,255,255,0.1);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;flex-shrink:0}\
  .rwp-chat{flex:1;overflow-y:auto;padding:14px;background:#F0F2F5;display:flex;flex-direction:column;gap:8px}\
  .rwp-bubble{max-width:85%;padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.45;word-wrap:break-word;white-space:pre-wrap}\
  .rwp-bubble.user{background:linear-gradient(135deg,#1565C0,#0D47A1);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}\
  .rwp-bubble.diego{background:#fff;color:#1A2332;align-self:flex-start;border:1px solid #E5EAF0;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,0.04)}\
  .rwp-bubble.diego::before{content:"Diego";display:block;color:#1A7A3C;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px}\
  .rwp-bubble.thinking{background:#F0F2F5;color:#7A8C9E;align-self:flex-start;font-style:italic;font-size:12px;padding:6px 12px}\
  .rwp-bubble.error{background:#FEE7E7;border:1px solid #F5B5B5;color:#A02A2A;align-self:center;max-width:90%;text-align:center;font-size:12px}\
  .rwp-consent{background:#FFF8E1;border:1px solid #FFD54F;border-radius:10px;padding:12px;margin-bottom:8px;font-size:12px;line-height:1.5;color:#5D4037}\
  .rwp-consent label{display:flex;align-items:flex-start;gap:8px;cursor:pointer}\
  .rwp-consent input{margin-top:1px;accent-color:#1A7A3C;flex-shrink:0;cursor:pointer}\
  .rwp-consent a{color:#1A7A3C}\
  .rwp-input-row{padding:10px 12px;background:#fff;border-top:1px solid #E5EAF0;display:flex;gap:8px;align-items:flex-end}\
  .rwp-input{flex:1;background:#F4F6F8;border:1px solid transparent;border-radius:12px;padding:9px 12px;color:#1A2332;font-size:14px;font-family:inherit;resize:none;max-height:100px;min-height:36px;outline:none}\
  .rwp-input:focus{border-color:#1A7A3C;background:#fff}\
  .rwp-send{background:linear-gradient(135deg,#1A7A3C,#0F5A2C);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:16px;cursor:pointer;flex-shrink:0}\
  .rwp-send:disabled{opacity:.4;cursor:not-allowed}\
  ';

  var styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // Estado consent (localStorage)
  var CONSENT_KEY = 'reciclean_widget_consent_granted';
  function hasConsent() { try { return localStorage.getItem(CONSENT_KEY) === 'true'; } catch (e) { return false; } }
  function setConsent() { try { localStorage.setItem(CONSENT_KEY, 'true'); } catch (e) {} }

  // FAB
  var fab = document.createElement('button');
  fab.id = 'reciclean-widget-fab';
  fab.setAttribute('aria-label', T.fab_aria);
  fab.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.25))"><path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="rgba(255,255,255,0.92)"/></svg>';
  document.body.appendChild(fab);

  // Panel
  var panel = document.createElement('div');
  panel.id = 'reciclean-widget-panel';
  panel.innerHTML =
    '<div class="rwp-header">' +
      '<div class="icon">🤖</div>' +
      '<div class="info">' +
        '<div class="tag">' + T.tag + '</div>' +
        '<div class="name">' + T.name + '</div>' +
        '<div class="sub">' + T.sub + '</div>' +
      '</div>' +
      '<button class="close" id="rwp-close" type="button" aria-label="' + T.close + '">×</button>' +
    '</div>' +
    '<div class="rwp-chat" id="rwp-chat"></div>' +
    '<div class="rwp-input-row">' +
      '<textarea class="rwp-input" id="rwp-input" placeholder="' + T.placeholder + '" rows="1" maxlength="2000"></textarea>' +
      '<button class="rwp-send" id="rwp-send" type="button" aria-label="Send">→</button>' +
    '</div>';
  document.body.appendChild(panel);

  var chatEl = panel.querySelector('#rwp-chat');
  var inputEl = panel.querySelector('#rwp-input');
  var sendBtn = panel.querySelector('#rwp-send');

  function bubble(texto, clase) {
    var div = document.createElement('div');
    div.className = 'rwp-bubble ' + clase;
    div.textContent = texto;
    chatEl.appendChild(div);
    chatEl.scrollTop = chatEl.scrollHeight;
    return div;
  }

  function showConsent() {
    var box = document.createElement('div');
    box.className = 'rwp-consent';
    box.innerHTML =
      '<strong>' + T.consent_title + '</strong><br>' +
      T.consent_body + '<br><br>' +
      '<label><input type="checkbox" id="rwp-consent-cb"> ' + T.consent_label + ' <a href="https://www.bcn.cl/leychile/navegar?idNorma=1217150" target="_blank">Ley 21.719</a></label>';
    chatEl.appendChild(box);
    chatEl.scrollTop = chatEl.scrollHeight;
    var cb = box.querySelector('#rwp-consent-cb');
    cb.addEventListener('change', function () {
      if (cb.checked) {
        setConsent();
        box.remove();
        bubble(T.consent_thanks, 'diego');
        inputEl.focus();
      }
    });
  }

  function abrirPanel() {
    panel.classList.add('open');
    fab.classList.add('hidden');
    if (chatEl.children.length === 0) {
      bubble(T.greeting, 'diego');
      if (!hasConsent()) showConsent();
    }
  }
  function cerrarPanel() {
    panel.classList.remove('open');
    fab.classList.remove('hidden');
  }

  fab.addEventListener('click', abrirPanel);
  panel.querySelector('#rwp-close').addEventListener('click', cerrarPanel);

  inputEl.addEventListener('input', function () {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  });

  async function enviar() {
    var texto = inputEl.value.trim();
    if (!texto) return;
    if (!hasConsent()) { bubble(T.consent_required, 'error'); return; }
    sendBtn.disabled = true;
    bubble(texto, 'user');
    inputEl.value = '';
    inputEl.style.height = 'auto';
    var thinking = bubble(T.thinking, 'thinking');
    try {
      var resp = await fetch(SUPABASE_URL + '/functions/v1/diego-chat-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({
          widget_visitor_id: visitorId,
          idioma: idioma,
          mensaje: texto,
          request_id: 'wid-' + Date.now(),
        }),
      });
      var data = await resp.json();
      thinking.remove();
      if (!resp.ok || data.error) {
        bubble('Error: ' + (data?.error || ('HTTP ' + resp.status)), 'error');
      } else {
        bubble(data.reply || data.message || '...', 'diego');
      }
    } catch (e) {
      thinking.remove();
      bubble(T.error_conn, 'error');
    } finally {
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener('click', enviar);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  });

  console.log('[Reciclean Widget] cargado · visitor=' + visitorId);
})();
