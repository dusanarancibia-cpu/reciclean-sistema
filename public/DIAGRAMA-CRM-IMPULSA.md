# DIAGRAMA — CRM Impulsa en el Panel RDO

> Generado por PC3 Cámaras · 2026-05-22  
> Para el equipo: Dusan, Andrea, Cony, Dyana, Pablo

---

## 1. Qué es el CRM Impulsa y por qué está aquí

El sistema CRM Impulsa CRECE del grupo venció el 21-may-2026. Antes de perder el acceso, PC3 rescató:

| Entidad | Filas rescatadas | Tabla staging |
|---|---|---|
| Clientes | 1.971 | `staging.crm_impulsa_clientes` |
| Oportunidades | 10.214 | `staging.crm_impulsa_oportunidades` |
| Contactos | 1.516 | `staging.crm_impulsa_contactos` |
| Cotizaciones | 1.195 | `staging.crm_impulsa_cotizaciones` |
| Productos/Servicios | 184 | `staging.crm_impulsa_productos` |
| Prospectos (web) | 26 | `staging.crm_impulsa_prospectos` |
| **Total** | **15.106** | — |

**Estado acceso:** MUERTO permanentemente. Lo que está en Supabase es todo lo recuperable.

---

## 2. Flujo de datos: CRM → Panel RDO

```
CRM Impulsa (Excel export + scraping)
         │
         ▼
staging.crm_impulsa_*          ← datos crudos, preservados tal como venían
         │
         │  ETL (mig 042-046, M6/M8/M9)
         ▼
curated.clientes                ← 1.975 clientes (1.971 CRM + 4 nativos RDO)
curated.oportunidades           ← 10.250 oportunidades (10.214 CRM + 36 RDO)
curated.contactos_clientes      ← 1.542 contactos + prospectos
curated.cotizaciones_historico  ← 1.195 cotizaciones
curated.vw_oportunidades_crm    ← vista para reconciliación
         │
         ▼
Panel RDO → Tab "💼 Comercial"  ← Andrea / Dusan lo usan aquí
```

---

## 3. Cómo usar el Tab "💼 Comercial" en el Panel

**Acceso:** `https://reciclean-sistema.vercel.app/panel-rdo.html` → click tab "💼 Comercial"

### Qué ves en el tab

| Columna | Qué es | Fuente |
|---|---|---|
| RAZÓN SOCIAL | Nombre del cliente | `staging.crm_impulsa_clientes.data['NOMBRE']` |
| RUT | RUT del cliente | `staging.crm_impulsa_clientes.data['RUT']` |
| SEGMENTO | Categoría de cliente | `staging.crm_impulsa_clientes.data['Segmento']` |
| CONTACTO | Nombre contacto principal | `staging.crm_impulsa_clientes.data['CONTACTO NOMBRE']` |
| TELÉFONO | Teléfono | `staging.crm_impulsa_clientes.data['TELEFONO']` |
| EMAIL | Email contacto | `staging.crm_impulsa_clientes.data['CONTACTO EMAIL']` |
| ESTADO | Activo/Inactivo | `curated.clientes.activo` |

### KPIs en el tab

- **1.971 clientes** = base maestra Impulsa en staging
- **1.071 oportunidades abiertas** = estado distinto de `ganada` o `perdida`
- **1.195 cotizaciones** = histórico completo
- **26 prospectos** = leads del formulario `farex.cl/conversemos/`

### Filtro de estado

- `todos` → muestra los 1.971
- `activo` → clientes con `activo = true` en curated
- `inactivo` → clientes con `activo = false`

---

## 4. Estado de la clasificación (SEGMENTO)

El campo SEGMENTO viene del CRM original y está incompleto:

| Valor | Cantidad | % |
|---|---|---|
| NULL (vacío en CRM) | 736 | 37% |
| "POR DEFINIR (ingresar Comentarios)" | 674 | 34% |
| "OTROS POR DEFINIR" | 383 | 19% |
| **Total sin clasificar** | **1.793** | **91%** |
| COLEGIOS | 55 | 3% |
| MAESTRANZAS | 35 | 2% |
| HOGARES PREOCUPADOS POR EL MEDIO AMBIENTE | 14 | 1% |
| ALMACENES | 11 | 1% |
| MINI MARKETS | 10 | 0.5% |
| MUNICIPALIDADES | 7 | 0.4% |
| Otros segmentos definidos | 36 | 2% |

**Pendiente para Andrea/Dusan:** clasificar los 1.793 clientes sin segmento.  
Ver `mayordomo/PLAN-2026/queries-propuestas/2026-05-22-clasificacion-segmento-crm.sql` para SQL propuesta.

---

## 5. Estado de oportunidades

| Origen | Estado | Cantidad |
|---|---|---|
| crm_impulsa | ganada | 8.414 |
| crm_impulsa | perdida | 850 |
| crm_impulsa | monitoreo | 301 |
| crm_impulsa | recibida | 250 |
| crm_impulsa | activada | 222 |
| crm_impulsa | en_evaluacion | 140 |
| crm_impulsa | respondida | 37 |
| Excel Negocios 3 | en_evaluacion / recibida / perdida | 30 |
| Contrato activo | ganada | 6 |

**Oportunidades activas para trabajar:** 950 (estado distinto de ganada/perdida)

### Gaps en oportunidades

| Gap | Cantidad | Causa | Solución |
|---|---|---|---|
| Sin `cliente_id` | 986 (9.6%) | RUT no normalizable del CRM | Revisión manual Andrea + heurística |
| Sin `sucursal_id` | 10.232 (99.8%) | CRM no tenía sucursal | Asignar según sucursal del cliente vinculado |

---

## 6. Tablas clave para consultas

### Para buscar un cliente

```sql
-- Por RUT
SELECT * FROM staging.crm_impulsa_clientes WHERE data->>'RUT' = '76057889-4';

-- En curated (vista limpia)
SELECT cliente_id, razon_social, rut, sucursal_principal, activo 
FROM curated.clientes WHERE rut = '76057889-4';
```

### Para ver oportunidades de un cliente

```sql
SELECT o.titulo, o.estado, o.valor_estimado_uf, o.fecha_recepcion
FROM curated.oportunidades o
JOIN curated.clientes c ON o.cliente_id = c.cliente_id
WHERE c.rut = '76057889-4'
ORDER BY o.fecha_recepcion DESC;
```

### Para ver cotizaciones

```sql
SELECT * FROM curated.cotizaciones_historico
WHERE cliente_id = '<id>' 
ORDER BY created_at DESC;
```

### Reconciliación CRM ↔ RDO

```sql
SELECT * FROM curated.vw_oportunidades_crm
WHERE estado NOT IN ('ganada','perdida')
LIMIT 100;
```

---

## 7. Qué NO se pudo recuperar del CRM

Al vencer el plan el 21-may-2026, se perdieron permanentemente:

- Workflows y automatizaciones configuradas en Impulsa
- Plantillas de emails
- Configuración de accesos y roles de usuarios
- Historial de actividad interna (notas de vendedor, logs de llamadas)
- Adjuntos / documentos subidos al CRM
- Items `cola_construccion` `129341cf` y `1472a774` → estado `blocked` permanente

---

## 8. Próximos pasos recomendados

| Prioridad | Acción | Responsable | ETA |
|---|---|---|---|
| ALTA | Clasificar 1.793 clientes sin segmento | Andrea + Dusan | 1 semana |
| ALTA | Asignar sucursal a 986 oportunidades sin cliente | Andrea | 2-3 días |
| MEDIA | Mapear 184 productos Impulsa vs materiales RDO | Dusan/Andrea | pendiente firma |
| MEDIA | Reconciliar 36 oportunidades RDO vs 10.214 CRM | PC Desocupado | post-firma |
| BAJA | Limpiar clientes duplicados (ej: "Acenor" + "ACENOR ACEROS DEL NORTE SPA") | Andrea | sprint 3 |

---

*Pauta `visual_standard_v1` aplicada (documento).*
