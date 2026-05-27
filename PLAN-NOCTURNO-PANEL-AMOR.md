# Plan nocturno · Panel RDO "del plumavit al verde amor"

> **Branch:** `claude/panel-amor-verde-26may`
> **Inicio:** 26-may-2026 ~21h CLT
> **Objetivo cierre:** 27-may-2026 9am CLT
> **Mandato Dusan:** mejorar estética + coherencia + contenido del panel RDO en Vercel · SIN ROMPER nada del sistema antiguo ni del nuevo.

---

## 🔍 Auditoría inicial (lo encontrado)

### Tabs del panel (22 islas)
🏠 Portada · ⚖️ Pesaje S1 · 🧾 Facturación S5 · 📎 Dieguito · 🎧 Comunicados · 📖 Manual · 🧠 Mi memoria · 📈 RDO Resumen · 💼 Negocios · 📋 Cotizador · 📅 Cierres · 💲 Precios · 📨 Bandeja Precios · 📑 OPERATIVOS · 🔗 Reconciliación · 👥 Cartera · 🎯 Oportunidades · 📤 Entregables · 📥 Bandeja Diego · 🌅 Operaciones Día · 💼 Comercial · ⚙️ Admin

### Tamaño actual
- `public/panel-rdo.html` · 9.712 líneas (gigante · sensible a regresiones)
- `public/MANUAL-OPERATIVO-EQUIPO.md` · 576 líneas

### Dolores detectados (mandato Dusan)
1. **6W en inglés** en Bandeja Diego (líneas 1927-1934): What · Who · Why · How → traducir
2. **Manual estilo "plumavit"** (texto plano Markdown sin color · sin presentación visual)
3. **Notificaciones acumuladas** con "esqueleto frío": tarea dice "hola" + esperar que humano complete 6W
4. **Sin sensación de cambio de isla** · contenido se repite entre tabs (riesgo desilusión)
5. **Sin elevador amor↔divorcio** por usuario · cada clic frustrante NO se captura
6. **Sin semáforo verde/amarillo/rojo** por feature
7. **Diego sin auto-reparación efectiva** (D-DIEGO-AUTO-REPAIR-001 firmado · sin UI ni hooks)
8. **Mayordomo no monitorea** la aguja Diego→amor por usuario

---

## 🎯 Plan de implementación · 6 capas (todas sin romper)

### CAPA 1 · Traducir 6W al español (rápido, alto impacto)
- En `panel-rdo.html` líneas 1927-1934: `What` → `Qué` · `Who` → `Quién` · `Why` → `Por qué` · `How` → `Cómo`
- Mantener IDs `bdDw_what`, `bdDw_who`, `bdDw_why`, `bdDw_how` (JS los usa · NO tocar)
- Cambiar también placeholder buscador "what/who" → "qué/quién"
- **Riesgo:** 0 · solo labels visibles

### CAPA 2 · CSS nuevo paleta amor-verde (estética sin romper)
- Crear `public/css/panel-amor.css` con paleta verde corporativa (alineada a logo Reciclean)
- Variables CSS para: 🟢 amor (verde), 🟡 tibieza (ámbar), 🔴 divorcio (rojo), 🩷 romántico (rosa accent)
- Importar en panel-rdo.html con `<link>` (ÚNICO cambio en HTML existente)
- Aplicar incrementalmente vía clases nuevas · NO sobrescribir clases tailwind existentes

### CAPA 3 · Sistema aguja amor-divorcio (componente nuevo · sticky bottom)
- Crear `public/js/amor-divorcio.js` autónomo
- Inserta barra horizontal sticky en bottom del topbar (NO interrumpe layout existente)
- Hooks:
  - `+1 amor` al cerrar tarea, guardar exitoso, clic en CTA correcto
  - `+1 divorcio` al error 500, timeout >5s, respuesta Diego sin contexto, "no entiendo" click 3 veces seguidas
- Estado por usuario en `localStorage.amor_divorcio_score` + persistencia en `panel.diego_aprendizaje`
- Pop-up romántico al alcanzar umbral divorcio (>70%): "Dame una oportunidad · te voy a demostrar"

### CAPA 4 · Semáforo de confianza por feature (badges sticky)
- Mapa de features con su estado: `public/js/semaforo-features.json`
- Cada tab/sección puede declarar `data-confianza="verde|amarillo|rojo"`
- Componente JS automático lee el atributo y pinta badge esquina superior derecha
- Tooltip al hover:
  - 🟢 "Usalo con seguridad · está probado"
  - 🟡 "Podés usarlo, pero parate si no te sentís seguro · estamos puliéndolo"
  - 🔴 "Esperá · te demostraré que de esto no te vas a arrepentir"

### CAPA 5 · Manual visual con 6W español (rediseño tab manual sin romper backend)
- Mantener `tabManual` con su carga de MANUAL-OPERATIVO-EQUIPO.md
- Agregar landing colorida ARRIBA del contenido actual:
  - 6 cards grandes con íconos (Qué · Quién · Cuándo · Dónde · Por qué · Cómo)
  - Cada card te lleva a la sección correspondiente con scroll suave
  - Estilo similar a las PPT que generamos (verde corporativo · semáforo)
- Sub-menú con 6 silos por color (alineado con SPEC-MANUAL-PANEL-V2.md ya firmado)

### CAPA 6 · Diego procesa notificaciones (UX bandeja diego sin romper SQL)
- En `tabBandejaDiego` (línea 1841): rediseñar tarjeta de mensaje
- Estado actual: "esqueleto frío" con datos vacíos
- Estado nuevo: cada notificación viene PRE-llenada con 6W (Diego completó lo que pudo)
- 4 acciones visibles: ✅ Resolver · 🤝 Asignar a · 🔍 Pedir contexto · ↩️ Devolver
- Si el usuario no responde en 5s con duda → Diego sugiere asignación automática

### CAPA 7 · Mayordomo monitorea Diego (lógica nueva en JS · backend ya existe)
- Hook en `localStorage.diego_response_quality` por cada respuesta
- Tabular: ¿respondió con contexto? ¿propuso destino? ¿pidió aclaración válida?
- Si baja a <60% en últimas 10 interacciones → notificar a Mayordomo (PC1) vía `panel.diego_errores`
- D-DIEGO-AUTO-REPAIR-001 trigger: Diego analiza el patrón + propone fix automático (regenerar prompt, sumar contexto, escalar)

---

## 📋 Orden de ejecución (12 horas)

| Hora | Tarea | Riesgo | Validación |
|---|---|---|---|
| 21-22h | Auditoría + plan (este doc) | 0 | Doc en branch |
| 22-23h | Capa 1 · 6W al español | mínimo | Tests visuales en preview |
| 23-00h | Capa 2 · CSS paleta amor-verde | bajo | No clases conflictivas |
| 00-02h | Capa 3 · Aguja amor-divorcio | medio | Componente aislado en su .js |
| 02-03h | Capa 4 · Semáforo features | bajo | Atributos data-* opcionales |
| 03-05h | Capa 5 · Manual visual rediseño | medio | tabManual extendido, no reemplazado |
| 05-07h | Capa 6 · Diego procesa notificaciones | medio | Cambios incrementales bandeja_dieg |
| 07-08h | Capa 7 · Mayordomo monitorea Diego | bajo | JS nuevo · sin tocar EF |
| 08-09h | Test integral + commit + push branch + abrir preview | 0 | Vercel preview URL |

---

## 🛡️ Reglas de seguridad (autoimpuestas)

1. **NUNCA tocar `main` ni `prod`.** Solo branch `claude/panel-amor-verde-26may`.
2. **NUNCA cambiar IDs HTML existentes** (`bdDw_what`, `manualReload`, etc.). El JS los usa.
3. **NUNCA borrar clases tailwind existentes.** Solo agregar nuevas.
4. **Cambios incrementales:** un cambio por commit con mensaje claro. Si hay regresión, revert atomic.
5. **Cada hora · INSERT en `panel.afirmaciones_pc`** con avance verificable (R-AUD-024).
6. **Si encuentro algo que NO PUEDO arreglar sin romper** → documentar en `BLOQUEOS-NOCTURNO.md` y dejar para Dusan al despertar.
7. **NO deploy a Vercel manual.** Push a branch nueva → Vercel auto-deploya preview · Dusan revisa antes de promover.

---

## ✅ Verificación al despertar (8-9 am)

Dusan podrá comprobar:
1. URL preview Vercel con el panel nuevo (`reciclean-sistema-git-claude-panel-amor-verde-26may.vercel.app` o similar)
2. Lista de cambios en `BITACORA-NOCTURNO-26MAY.md` con timestamps
3. Tabla de afirmaciones en `panel.afirmaciones_pc` con avance real verificable
4. Decisión Dusan: promover preview a main (apruebo) · pedir ajustes · descartar (mantener prod intacto)
