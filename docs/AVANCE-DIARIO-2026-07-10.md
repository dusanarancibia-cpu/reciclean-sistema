# Avance del dia — 10 de julio 2026

> Resumen en palabras sencillas de lo que se hizo hoy.
> 8 PRs mergeados a main (= 8 deploys a produccion via Vercel).

---

## Que se logro hoy (en simple)

Hoy se cerro el ciclo completo del **widget chatbot** que vive en reciclean.cl y farex.cl: ahora muestra solo precios verificados, captura datos del cliente dentro del chat, y cuando un caso necesita atencion humana, llega directo al panel de Andrea con toda la info. Ademas se tapo un agujero de seguridad.

---

## Tareas de Dusan (direccion + definicion + revision)

Dusan dirigio la sesion PRECIOS-VIVOS-2026, definiendo las reglas de negocio y aprobando cada PR antes del merge.

### 1. Seguridad — Parche XSS (00:04h)
- **PR #628**: Se detecto que el nombre y telefono del visitante no se escapaban correctamente — un atacante podia inyectar codigo malicioso. Corregido.
- **Impacto**: Protege a Andrea y al equipo que abre los datos en el panel.

### 2. Widget: WhatsApp ya no es obligatorio (00:04h - 00:54h)
- **PR #628**: El chatbot antes obligaba al cliente a salir a WhatsApp para cerrar. Ahora captura nombre + telefono DENTRO del chat y crea el caso comercial automaticamente. WhatsApp queda como opcion secundaria.
- **PR #629**: Se activo el "motor de resolucion" — el sistema clasifica automaticamente cada caso como `automatico`, `semi-automatico` o `excepcion`. Si es excepcion, el visitante ve un mensaje de que un ejecutivo lo revisara personalmente.

### 3. Curaduria base-cero de precios (07:14h - 07:57h)
- **PR #630**: Los metales de Farex mostraban 44 materiales sin filtro, incluyendo precios estimados nunca validados. Ahora solo muestra los 3 materiales que Dusan ratifico: Cobre 1 Tubo, Acero Inox 304 y Fierro Corto (Cerrillos + Maipu).
- **PR #631**: Lo mismo para la seccion principal de Reciclean — se elimino el banner "precio de respaldo" y el codigo muerto asociado. Solo se muestran materiales con precio real curado.

### 4. Panel: datos reales del chatbot en Oportunidades (10:08h - 10:47h)
- **PR #632**: El drawer de Oportunidades (lo que ve Andrea al abrir un caso) ahora muestra: telefono del cliente, que queria vender, modo de entrega, precio que le informaron en el chat, certificado REP y nivel de autonomia. Antes no se veia nada de esto.
- **PR #633**: La Bandeja de Diego ahora tiene boton "Abrir oportunidad" — conecta directo la notificacion con el caso comercial de origen.

### 5. Widget: cerrar el flujo comercial completo (12:25h - 12:50h)
- **PR #634**: Cuando la seccion principal no tiene materiales confirmados, el cliente ya no queda en un callejon sin salida — se le ofrecen 3 opciones claras (metales Farex, otros materiales, volver al menu).
- **PR #635**: La ruta de metales (Cobre/Inox/Fierro) ahora muestra direccion de la sucursal, horarios, forma de pago y nota de IVA ANTES de pasar a logistica. Antes se saltaba directo y el cliente no sabia donde ir.

---

## Tareas de Pablo (infraestructura + backend + deploy)

Pablo trabajo el backend en Supabase (repo reciclean-rdo) creando las migraciones y Edge Functions que el frontend de Dusan consume.

### 1. Migraciones Supabase (mig 369 a 375)
- **mig 369**: `public.v_precio_cache` ahora lee de `curated.materiales_sucursal_precios` (la fuente unica de verdad para precios).
- **mig 370**: Motor de resolucion — columnas `nivel_autonomia` y `motivo_excepcion` en oportunidades + vistas para el panel.
- **mig 371**: Vista `public.v_widget_materiales_curados` — la canasta curada que el widget consume (deny-by-default).
- **mig 372**: Filtro `seccion_widget` para separar seccion principal vs metales.
- **mig 374**: Vista `panel.v_oportunidades_kanban_v2` con 6 columnas nuevas del chatbot (telefono, intent, modo entrega, precio, certificado REP, nivel autonomia).
- **mig 375**: Notificacion operativa — `panel.diego_bandeja` con `referencia_tabla`/`referencia_id` para enlazar a oportunidades.

### 2. Edge Functions desplegadas
- `intake-comercial-web`: Crea oportunidades desde el widget con clasificacion automatica.
- `procesar-notificacion-intake-web`: Encola y envia correo a comercial@gestionrepchile.cl via Resend.
- Secrets configurados: `RESEND_API_KEY`, `COMERCIAL_EMAIL_NOTIFICACIONES`, `NOTIFICACIONES_FROM`.

### 3. Smoke testing
- Verificacion real de los 2 endpoints REST que el widget consume.
- Dry-run remoto del intake: Reciclean y Farex enviaron correo real con `resend_id` confirmado.

---

## Nivel de avance por frente

| Frente | Antes de hoy | Despues de hoy | Cambio |
|--------|-------------|----------------|--------|
| Widget chatbot — precios curados | 40% | 85% | +45% |
| Widget chatbot — captura de datos in-widget | 0% | 90% | +90% |
| Motor de resolucion (auto/semi/excepcion) | 20% | 80% | +60% |
| Panel — datos chatbot en Oportunidades | 10% | 85% | +75% |
| Panel — Bandeja Diego ↔ Oportunidades | 0% | 90% | +90% |
| Seguridad widget (XSS) | 0% | 100% | Cerrado |
| Cierre comercial completo (direccion/horario/IVA) | 0% | 90% | +90% |

---

## Que falta (proximo paso de cada frente)

1. **Widget curado**: Faltan Talca y Puerto Montt — hoy muestran "sin materiales confirmados" (correcto, base-cero). Se activan cuando Dusan ratifique precios para esas sucursales.
2. **Captura in-widget**: Smoke visual en navegador real (Playwright no estuvo disponible hoy).
3. **Motor de resolucion**: Ajustar reglas de clasificacion segun feedback de Andrea con casos reales.
4. **Panel Oportunidades**: Validacion visual logueado como Andrea.
5. **Bandeja Diego**: Mismo — smoke visual logueado.

---

## Archivos tocados hoy

| Archivo | PRs | Tipo de cambio |
|---------|-----|----------------|
| `public/chatbot-v2.html` | #628 #629 #630 #631 #634 #635 | Widget chatbot (logica + copy + seguridad) |
| `public/panel-rdo.html` | #629 #632 #633 | Panel RDO (oportunidades + bandeja) |

---

> Generado automaticamente el 10-jul-2026 desde la actividad de git del dia.
