# Bandeja Pablo — Auditoría 85 capacidades Diego (cierre 2026-05-23)

> Ítems concretos, ordenados por bloqueo. Cada uno con qué hacer, cómo testear, y dónde quedó.

---

## 1. Deploy EF v10.7 — desbloquea Cat 3 (precios) + Cat 14.5 (audit log) + R-AUD-014 (bandeja)

**Branch:** `fix/diego-precio-tildes-audit-log` en `reciclean-rdo`.
**Última versión EF deployada:** `version=16` (Diego v10.5/v10.6 mezclados).
**Versión nueva:** Diego v10.7.

**Cambios incluidos en este branch:**

1. `toolConsultarPrecio` ahora usa `sb.rpc('diego_buscar_material', ...)` (mig 061) → resuelve búsqueda insensible a tildes + 4 niveles match.
2. `auditLog` ahora usa `sb.rpc('diego_audit_log_insert', ...)` (mig 060) → resuelve escritura silenciosa a `curated.diego_audit_log`.
3. System prompt extendido con bloque **CONVERSACIÓN DE EXCELENCIA** (R-AUD-006 a R-AUD-013), 8 reglas conversacionales nuevas.
4. Versión bumpeada a `v10.7`.

**Falta agregar antes de deploy (tarea tuya — 10 min):**

5. `toolRegistrarBandeja` y `auditLog`'s sibling para `panel.diego_bandeja`: cambiar `sb.schema('panel').from('diego_bandeja').insert(...)` por `sb.rpc('diego_bandeja_insert', {...})`. Mig 062 ya creó el RPC `public.diego_bandeja_insert` con SECURITY DEFINER.

**Comando de deploy:**

```bash
cd reciclean-rdo
git checkout fix/diego-precio-tildes-audit-log
git pull
supabase functions deploy diego-chat-process --project-ref eknmtsrtfkzroxnovfqn
```

**Verificación post-deploy (mandala tú, después yo reverifico Cat 3 + Cat 14.5):**

- Test 1: en el FAB, escribir "precio cartón Maipú" → debe responder con precio real, no "sin materiales encontrados".
- Test 2: `SELECT COUNT(*) FROM curated.diego_audit_log WHERE creado_en > NOW() - INTERVAL '5 minutes'` → debe ≥ 1.
- Test 3: `SELECT COUNT(*) FROM panel.diego_bandeja WHERE creado_en > NOW() - INTERVAL '5 minutes'` → debe ≥ 1 si pediste tarea/duda al FAB.

---

## 2. Crear tool `consultar_dotacion` en próxima iteración (R-AUD-007 + R-AUD-009)

**Tabla seedeada (mig 063):** `panel.dotacion` (6 filas) + `panel.responsables_sucursal` (4 filas) + view `panel.activos`.

**Tool a agregar:**

```typescript
{ type: 'function', function: { name: 'consultar_dotacion',
  description: 'Consulta panel.dotacion por nombre, área o sucursal. Devuelve rol y sucursal del miembro del equipo.',
  parameters: { type: 'object', properties: {
    nombre: { type: 'string' }, area: { type: 'string' }, sucursal: { type: 'string' }
  } } } }
```

**RPC puente recomendada:**
```sql
CREATE OR REPLACE FUNCTION public.diego_consultar_dotacion(p_query TEXT)
RETURNS TABLE (nombre TEXT, rol TEXT, area TEXT, sucursal TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, panel AS $$
BEGIN
  RETURN QUERY SELECT d.nombre, d.rol, d.area, d.sucursal
  FROM panel.dotacion d
  WHERE d.activo = TRUE
    AND (p_query IS NULL OR public.unaccent_lower(d.nombre) LIKE '%' || public.unaccent_lower(p_query) || '%');
END $$;
```

---

## 3. Renderizar Markdown → HTML en el FAB

**Bug abierto:** Diego devuelve tablas Markdown (R7) pero el chat las muestra como texto plano con `|` y `-`. El usuario las debe leer "en bruto".

**Fix sugerido:** integrar `marked` o `markdown-it` mínimo en `panel-rdo.html` para parsear la respuesta `reply` antes de inyectarla al DOM. Sanitizar con DOMPurify.

---

## 4. Cambiar label "v6" → "v10.7" en el FAB

Cuando deployes la v10.7, ajustar el header del chat para que muestre "Diego v10.7" en lugar de "Diego v6".

---

## 5. GOOGLE_MAPS_API_KEY — esperar a Dusan

No hay nada técnico que hacer; cuando Dusan provea la key (bandeja Dusan #1), agregala como secret de Supabase:

```bash
supabase secrets set GOOGLE_MAPS_API_KEY=... --project-ref eknmtsrtfkzroxnovfqn
```

Eso desbloquea las 3 capacidades de Cat 5.

---

**Estado bandeja:** abierta. Cerrar cuando ítems 1-4 estén ✅ y haya screenshots de Cat 3 + Cat 14.5 funcionando.

**Firma:** PC Dusan bajo mandato Dusan Arancibia, 2026-05-23 PM.
