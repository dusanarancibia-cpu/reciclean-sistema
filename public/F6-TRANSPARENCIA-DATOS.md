# F6 — Transparencia de datos: ¿Cómo se actualiza esto?

> Cada tab del panel ahora tiene metadata accesible sobre origen, frecuencia, responsable y frescura.

## DDL aplicado en prod (Mig 068)

**`panel.fuentes_datos_tab`** (PK `codigo_tab` → FK `panel.pestanas.codigo`):
- `fuente_origen` — qué tabla/EF/scraping provee los datos
- `frecuencia_actualizacion` — tiempo real, diario, mensual, manual, ETL nocturno
- `responsable` — quién mantiene los datos al día
- `como_se_actualiza` — explicación en lenguaje humano
- `ultima_actualizacion` — timestamp de la última escritura
- `query_frescura` — opcional, SQL para auto-derivar `ultima_actualizacion`

**Vista `panel.v_frescura_datos`** — agrega indicador semáforo:
- 🟢 **verde**: dentro del SLA de frecuencia (tiempo real <15min, diario <1día, mensual <40días)
- 🟡 **ámbar**: fuera del SLA pero <7días sin actualizar
- 🔴 **rojo**: >7 días sin actualizar (o nunca)

## Seed inicial (18 tabs cubiertas)

Las 18 tabs activas en `panel.pestanas` tienen entrada en `panel.fuentes_datos_tab`. Hoy todas están en `verde` porque acabamos de seed con `NOW()`. En producción real, el job `cron-actualizar-frescura` (próxima iter) sobrescribirá con timestamps reales.

## Integración UI (pendiente Pablo)

Snippet sugerido para inyectar al pie de cada tab:

```html
<div class="data-source-footer flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3 mt-3">
  <span id="freshness-indicator" class="w-2 h-2 rounded-full bg-emerald-500" title="Datos frescos"></span>
  <span>Datos: <span id="ds-fuente">—</span></span>
  <span>·</span>
  <span>Actualiza: <span id="ds-frecuencia">—</span></span>
  <span>·</span>
  <span>Responsable: <span id="ds-responsable">—</span></span>
  <span>·</span>
  <span>Hace <span id="ds-hace">—</span></span>
  <button type="button" id="ds-tooltip-btn" class="ml-auto text-blue-600 hover:underline">¿Cómo se actualiza?</button>
</div>
```

```js
// En cada cambio de tab (TAB_ACTIVO setter):
async function actualizarFooterFuente(tabCodigo) {
  const { data } = await sb.schema('panel')
    .from('v_frescura_datos')
    .select('*')
    .eq('codigo_tab', tabCodigo)
    .maybeSingle();
  if (!data) return;
  document.getElementById('ds-fuente').textContent = data.fuente_origen;
  document.getElementById('ds-frecuencia').textContent = data.frecuencia_actualizacion;
  document.getElementById('ds-responsable').textContent = data.responsable;
  document.getElementById('ds-hace').textContent = `${Math.round(data.minutos_desde_actualizacion)} min`;
  const color = { verde: 'bg-emerald-500', ambar: 'bg-amber-500', rojo: 'bg-red-500' }[data.indicador_frescura];
  document.getElementById('freshness-indicator').className = `w-2 h-2 rounded-full ${color}`;
}
```

## Branch + status

- Mig 068 ✅ aplicada en prod.
- Doc: este archivo.
- Branch: `feat/transparencia-datos`.
- Pendiente Pablo: inyectar `data-source-footer` en `panel-rdo.html` (5 min trabajo — un componente reutilizable + hook al setter de tab activo).

**Firmado:** PC Dusan, 2026-05-23 noche.
