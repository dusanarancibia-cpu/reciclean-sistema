# PAUTA VISUAL PANEL RDO — v1.0

---

## ⚠️ REGLA UNIVERSAL — Comunicación clara (grabada a fuego 2026-05-23)

Vale para TODOS los PCs (1/2/3/4) en cualquier mensaje, documento, informe o explicación:

1. **Cero términos técnicos.** Si Andrea, Cony o Dyana no lo entienden, no se usa.
2. **Máximo 3 párrafos cortos** por explicación.
3. **Íconos, dibujos o gráficos** que reemplacen palabras cada vez que se pueda.
4. **Ejemplos reales de Reciclean** (Cerrillos / Maipú / Talca · Pincore / HUAL / Resimex · Andrea / Cony / Dyana · toneladas / facturación / UF).
5. **Resumen de 5 puntos al inicio** de cualquier doc, una frase cada uno.
6. **Test 5 minutos:** persona nueva entiende todo en 5 minutos de lectura.

**Aplica al output visual** también: KPIs nombrados con datos reales del grupo, no genéricos. Charts con etiquetas que digan algo (no "Series 1 / Series 2"). Diagramas con personas y sucursales nombradas. **No aplica al código fuente** — el código va técnico, los textos visibles cumplen.

**Fuentes canónicas:** `mayordomo/COMO-TRABAJAR.md § Comunicación clara` · este archivo · Supabase `panel.config_ui.regla_comunicacion_clara_v1` · `INFORME-EJECUTIVO-VISUAL.html § 11`. **Firmada por Dusan 2026-05-23.**

---

## ⚠️ REGLA DE AUTORIZACIÓN — GRABADA A FUEGO POR DUSAN (2026-05-20 20:15)

**Antes de pedir autorización para pushear o deployar cualquier cambio visual o funcional** sobre `panel-rdo-v4.html`, `panel-rdo.html`, o cualquier archivo que afecte la interfaz:

1. Hacé el cambio en local (rama feature propia).
2. Levantá el dev server: `npm run dev` (si no está corriendo) → suele ser `localhost:5173`.
3. **Mostrale a Dusan la URL `localhost:5173/panel-rdo.html`** (o el archivo que sea) para que lo pruebe en su navegador.
4. **Recién después de que Dusan confirme** que lo vio y funciona, pedí autorización para `git push` y abrir PR contra `main`.

**Aplica a:** cualquier `.html`, `.css`, `.js` de UI, componentes, assets en `public/`.
**No aplica a:** docs `.md`, migrations SQL, Edge Functions sin UI.
**Excepción explícita:** si Dusan dice "pusheá directo" o "abrí el PR sin probar" en el mismo turno, se respeta la orden directa (pero se anota que se saltó localhost).

**Razón:** preview de Vercel tarda 1-2 min y queda público. Localhost es instantáneo y privado. Permite iterar 5 veces antes del primer push y evita PRs con churn visible.

---



## Colores corporativos
- Principal: #059669 (verde Reciclean)
- Alternativos: #2563eb (azul), #ea580c (naranja), #9333ea (púrpura)
- Fondos: blanco #ffffff, gris claro #f8fafc, gris medio #f1f5f9
- Texto: #0f172a (títulos), #475569 (cuerpo), #94a3b8 (notas)
- Alertas: #dc2626 (rojo), #d97706 (ámbar)

## Gráficos (Chart.js)
- Sin leyenda cuadrada recargada. Leyenda abajo centrada con círculos.
- Líneas curvas (tension: 0.4), con área sombreada debajo al 20% de opacidad.
- Sin grid vertical. Solo líneas horizontales gris claro (#e2e8f0).
- Tipografía: Inter, 11px.
- Bordes redondeados en barras (borderRadius: 6).
- Donut con agujero al 65%, sin borde entre segmentos.

## Tarjetas KPI
- Números grandes (2.5rem), peso bold, color #0f172a.
- Etiqueta arriba en mayúsculas, 10px, tracking-wider, color #64748b.
- Sparkline abajo en SVG o canvas, altura 40px, del color de la tarjeta.
- Variación con badge: fondo al 15% del color, texto del color.

## Mapa (Leaflet)
- Tema claro (CartoDB Positron).
- Marcadores circulares con borde blanco y relleno del color corporativo.
- Sin popups invasivos: solo nombre al pasar el mouse.

## Top 5
- Tarjetas con ícono grande, nombre, valor destacado en verde.
- Barra de progreso fina (4px) abajo.
- Hover: sombra suave y leve levantamiento.

## Secciones
- Bordes redondeados (16px).
- Padding generoso (24px).
- Separación entre secciones: 24px.
- Títulos de sección: 1rem, semibold, #0f172a.

## Animaciones
- Fade-in al cargar (0.3s).
- Hover en tarjetas: subir 2px con sombra (transición 0.15s).
- Sin animaciones exageradas ni rebotes.

---

# Modo autónomo continuo v1.0

> Instrucción permanente firmada por Dusan 2026-05-19 PM. Resguardada acá para que no se pierda entre sesiones.

## Horario
- Trabajo en modo autónomo 8:30 am → 7:30 am día siguiente (23 horas).
- No hago preguntas en ese rango.
- Loop: avanzar → verificar → documentar → avanzar.

## Reglas durante el loop
- Si algo me bloquea: anotarlo en `public/BLOQUEOS.md` + seguir con la siguiente tarea.
- Si falta un dato Supabase: renderizar placeholder visible ("—" o "pendiente") + anotar en `public/PENDIENTES-DATOS.md`.
- Si no estoy seguro si algo rompe funcionalidad: conservar (no borrar).

## Restricciones absolutas durante el loop
- NO tocar funciones que conectan con Supabase del panel original.
- NO modificar lógica de autenticación.
- NO hacer commit ni push sin autorización explícita.
- NO tocar `package.json`, `vercel.json`, `vite.config.js`.
- NO duplicar archivos críticos sin avisar.

## Tarea prioritaria activa
- **Camino B**: aplicar estética visual de `Panel-rdo-deepseek-v4.html` sobre lógica real de `panel-rdo.html` mediante archivo sidecar `panel-rdo-v4.html` (no se toca el original hasta merge PR #30/#31).

## Cuando termine tarea prioritaria
- Optimizar responsive (360/768/1024/1440px).
- Validar accesibilidad (labels, ARIA, contraste).
- Completar `PENDIENTES-DATOS.md` con SQL propuesto.
- Cualquier mejora visual que no rompa nada.
