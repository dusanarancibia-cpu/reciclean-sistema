// public/diego/diego-stt-correcciones.js
// Diccionario de corrección de nombres propios mal transcritos por el STT
// nativo — PR2a del camino "modo voz conversacional" (D-DIEGO-VOZ-CONVERSACIONAL-001).
//
// Nace de un hallazgo real: en la prueba humana del PR1 (14-jul-2026),
// "Maipú" se transcribió como "maippo" y "baipú" en 2 intentos distintos.
// "Cerrillos" salió bien las 2 veces. Alcance acotado a propósito: solo
// sucursales (las 4 activas reales, consultadas en curated.sucursales —
// cerrillos/maipu/puerto_montt/talca), no materiales ni números. Si en el
// uso real aparecen más patrones de error, se agregan acá, no se inventan
// de antemano.
//
// Corrección SIEMPRE visible — este módulo no reemplaza el texto en
// silencio. Devuelve qué cambió para que el consumidor lo muestre.
(function () {
  // Cada entrada: nombre correcto + variantes mal transcritas conocidas
  // (case-insensitive, match por palabra completa para no comerse texto
  // de alrededor). "maipu" sin tilde NO se lista como variante — eso es
  // el nombre correcto sin acento, no un error de transcripción real.
  const DICCIONARIO = [
    { correcto: 'Maipú', variantes: ['maippo', 'baipú', 'baipu', 'maipù', 'mai pu'] },
    { correcto: 'Cerrillos', variantes: ['cerríos', 'cerrillo', 'serrillos', 'cerriyos'] },
    { correcto: 'Puerto Montt', variantes: ['puerto mont', 'puertomontt', 'puerto mon', 'puerto mott'] },
    { correcto: 'Talca', variantes: ['talka', 'talga'] },
  ];

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Aplica el diccionario sobre un texto. Devuelve el texto corregido +
  // la lista de reemplazos hechos (para mostrar visible, nunca en silencio).
  //
  // BUG real encontrado en la prueba humana (14-jul-2026): \b (word boundary)
  // de JS considera \w = [A-Za-z0-9_] SOLAMENTE — una tilde como "baipú" queda
  // afuera de \w, así que \bbaipú\b nunca matcheaba y la corrección real que
  // motivó este módulo (Maipú) no se aplicaba. Fix: lookaround Unicode-aware
  // con \p{L}/\p{N} (flag /u) en vez de \b.
  function corregir(texto) {
    let resultado = String(texto || '');
    const cambios = [];
    DICCIONARIO.forEach(({ correcto, variantes }) => {
      variantes.forEach((variante) => {
        const re = new RegExp('(?<![\\p{L}\\p{N}])' + escapeRegex(variante) + '(?![\\p{L}\\p{N}])', 'giu');
        if (re.test(resultado)) {
          const original = resultado.match(re)[0];
          resultado = resultado.replace(re, correcto);
          cambios.push({ original, corregido: correcto });
        }
      });
    });
    return { textoCorregido: resultado, huboCorreccion: cambios.length > 0, cambios };
  }

  window.DIEGO_STT_CORRECCIONES = {
    corregir,
    // Expuesto para el registro de aprendizaje y para que sea auditable
    // desde consola sin tener que leer el archivo.
    listarDiccionario: () => DICCIONARIO.map((d) => ({ ...d })),
  };
})();
