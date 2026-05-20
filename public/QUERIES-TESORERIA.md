# QUERIES-TESORERIA — Plantillas SQL para `panel.tesoreria_kpis`

> **Autor:** PC4-Desocupado
> **Fecha:** 2026-05-20
> **Para:** Dyana / Dusan / Andrea (cualquiera con permiso `authenticated` en Supabase).
> **Bloqueo cerrado:** B08 — esta plantilla destraba la carga manual hasta que haya integración bancaria automática.

---

## Schema del registro

Cada snapshot semanal/mensual carga 4 KPIs financieros del grupo en una fila:

| Campo | Tipo | Obligatorio | Ejemplo |
|---|---|---|---|
| `fecha_snapshot` | DATE | sí (PK lógica, UNIQUE) | `'2026-05-20'` |
| `saldo_banco_clp` | NUMERIC | sí | `89200000` |
| `por_cobrar_clp` | NUMERIC | sí | `34700000` |
| `pagos_programados_clp` | NUMERIC | sí | `22100000` |
| `inventario_clp` | NUMERIC | sí | `156300000` |
| `fuente` | TEXT | sí | `'manual_dyana'` / `'banco_api'` / `'sercot_excel'` |
| `notas` | TEXT | no | texto libre (cambios vs snapshot anterior, etc.) |
| `cargado_por` | TEXT | sí | email del que cargó |

Campos auto-llenados: `id` (SERIAL), `created_at` (now()).

> **Nota numérica:** los montos van en **pesos chilenos enteros** (sin decimales, sin separadores). `$89.200.000` se escribe `89200000`.

---

## ✅ Query 1 — Cargar snapshot nuevo (uso semanal)

Reemplazar los valores `<...>` con los números reales. El `ON CONFLICT` permite re-ejecutar la misma fecha sin error (sobrescribe).

```sql
INSERT INTO panel.tesoreria_kpis (
  fecha_snapshot,
  saldo_banco_clp,
  por_cobrar_clp,
  pagos_programados_clp,
  inventario_clp,
  fuente,
  notas,
  cargado_por
) VALUES (
  CURRENT_DATE,            -- ← o '2026-05-20'::date si cargás un día específico
  <SALDO_BANCO>,           -- ← ej: 89200000
  <POR_COBRAR>,            -- ← ej: 34700000
  <PAGOS_PROGRAMADOS>,     -- ← ej: 22100000
  <INVENTARIO>,            -- ← ej: 156300000
  'manual_dyana',          -- ← o 'manual_dusan', 'sercot_excel', etc.
  'Snapshot semana XX',    -- ← opcional, texto libre
  'dyana@gestionrepchile.cl'
)
ON CONFLICT (fecha_snapshot) DO UPDATE SET
  saldo_banco_clp       = EXCLUDED.saldo_banco_clp,
  por_cobrar_clp        = EXCLUDED.por_cobrar_clp,
  pagos_programados_clp = EXCLUDED.pagos_programados_clp,
  inventario_clp        = EXCLUDED.inventario_clp,
  fuente                = EXCLUDED.fuente,
  notas                 = EXCLUDED.notas,
  cargado_por           = EXCLUDED.cargado_por;
```

---

## ✅ Query 2 — Corregir un snapshot existente

Si te equivocaste en un número de un snapshot pasado, podés corregirlo:

```sql
UPDATE panel.tesoreria_kpis
SET saldo_banco_clp = <NUEVO_VALOR>,
    notas           = COALESCE(notas, '') || ' [corrección 2026-05-XX: motivo]'
WHERE fecha_snapshot = '2026-05-13';
```

---

## ✅ Query 3 — Ver el último snapshot disponible (lo que muestra el panel v4)

```sql
SELECT * FROM panel.v_tesoreria_ultimo;
```

Devuelve también `dias_desfase` (cuántos días pasaron desde el snapshot). Si `dias_desfase > 14` → el panel mostrará warning ámbar.

---

## ✅ Query 4 — Histórico (para gráfico de evolución, opcional)

```sql
SELECT
  fecha_snapshot,
  saldo_banco_clp,
  por_cobrar_clp,
  pagos_programados_clp,
  inventario_clp,
  (saldo_banco_clp - pagos_programados_clp) AS caja_neta_30d
FROM panel.tesoreria_kpis
ORDER BY fecha_snapshot DESC
LIMIT 12;  -- ← últimas 12 cargas
```

---

## ✅ Query 5 — Validar antes de cargar (si Dyana quiere chequear)

Antes de ejecutar Query 1, mirar el último snapshot para comparar:

```sql
SELECT fecha_snapshot,
       saldo_banco_clp / 1e6   AS saldo_M,
       por_cobrar_clp / 1e6    AS por_cobrar_M,
       pagos_programados_clp / 1e6 AS pagos_M,
       inventario_clp / 1e6    AS inventario_M,
       cargado_por
FROM panel.tesoreria_kpis
ORDER BY fecha_snapshot DESC LIMIT 3;
```

(divide por 1e6 para mostrar en millones legibles.)

---

## ✅ Query 6 — Borrar un snapshot (uso restringido)

Solo si se cargó por error y querés que **NO** quede en histórico. Mejor usar Query 2 si solo querés corregir.

```sql
DELETE FROM panel.tesoreria_kpis WHERE fecha_snapshot = '2026-05-XX';
```

---

## Cómo cargarlo desde Supabase Dashboard (sin SQL)

1. Entrar a https://supabase.com/dashboard/project/eknmtsrtfkzroxnovfqn
2. Side panel → "Table editor".
3. Schema dropdown → seleccionar `panel`.
4. Tabla `tesoreria_kpis`.
5. Botón "+ Insert" → completar los 8 campos del formulario.
6. Save.

(equivale a Query 1 sin escribir SQL.)

---

## Cadencia recomendada (a confirmar con Dyana)

| Frecuencia | Pro | Contra |
|---|---|---|
| **Semanal (lunes)** | Datos siempre frescos para reunión semanal | 4 cargas/mes (15 min cada una) |
| Quincenal | Carga liviana | Datos pueden tener 14 días al cierre de mes |
| Mensual (día 1) | Mínimo trabajo | Panel desactualizado durante el mes |

**Recomendación PC4:** semanal mientras NO haya integración bancaria. Una vez se integre vía API, frecuencia diaria automática.

---

## Recordatorio automático (futuro, vía Diego)

Cuando el bot Diego esté operativo con la bandeja 6W, se puede agendar:

```sql
-- Trigger pendiente — Diego inserta cada lunes 10 AM:
INSERT INTO panel.diego_bandeja (mensaje, remitente, what, who, where_, when_, why, how_, responsable)
VALUES (
  'Recordatorio: cargar snapshot tesorería de esta semana',
  'Diego (auto)',
  'carga semanal tesoreria',
  'Dyana / Dusan',
  'Supabase panel.tesoreria_kpis',
  'lunes 10am cada semana',
  'panel v4 desactualizado >7 días',
  'ejecutar Query 1 de QUERIES-TESORERIA.md',
  'PC4-Desocupado'
);
```

(esto queda como hand-off cuando se cierre P5 — Planificador Diario.)

---

## Próximo paso

1. Dyana ejecuta Query 1 la primera vez con los 4 valores reales al 20-may.
2. PC4 verifica que `panel.v_tesoreria_ultimo` devuelva esos valores.
3. PC4 modifica las 4 tarjetas amarillas "pendiente integración" del panel v4 para leer de `v_tesoreria_ultimo` y mostrar los valores reales.
4. Bloqueo B08 queda cerrado.
