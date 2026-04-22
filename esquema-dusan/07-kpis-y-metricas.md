# 07 — KPIs y Metricas

> El tablero personal de Dusan. Que quiere monitorear al abrir la sesion de trabajo.
> Espejo del "Resumen estadistico" del Diego-Curador (Seccion 3 del spec).

---

## Principios de medicion

1. **Pocas metricas, accionables.** Prefiere 5 numeros utiles a 50 decorativos.
2. **Cada metrica debe tener un umbral.** Si no hay rojo / amarillo / verde, no sirve.
3. **Cada metrica debe tener un dueno.** Quien la revisa y quien responde.
4. **Todo lo que se mide debe llegar por WA o dashboard.** No emails perdidos.

---

## Tablero Fase 1 (YA — vive en Diego-Curador WA 02:00)

Entregado por el mensaje WA diario del Curador (ver spec Diego v4.2, Seccion 4):

| KPI                                            | Umbral verde | Umbral amarillo | Umbral rojo  |
|------------------------------------------------|--------------|-----------------|--------------|
| Mensajes inbound sin respuesta de Diego        | 0            | 1-2             | 3+           |
| Contactos fuera de whitelist                   | 0            | 1-3             | 4+           |
| Errores HTTP / workflow                        | 0            | 1               | 2+           |
| Tiempos respuesta > 30s                        | 0            | 1-3             | 4+           |
| Audios/PDFs/imagenes con parsing fallido       | 0            | 1-2             | 3+           |
| Casos de frustracion (3+ msgs sin respuesta)   | 0            | 1               | 2+           |
| Feedbacks recibidos (tag `[FEEDBACK]`)         | cualquiera   | —               | —            |
| Mensajes totales procesados (in + out)         | tendencia    | —               | caida 50% d-1|
| Tiempo respuesta promedio                      | < 5s         | 5-15s           | > 15s        |
| % respondidos < 5s                             | > 80%        | 60-80%          | < 60%        |
| Entrevistas iniciadas / completadas / pausadas | tracking     | —               | —            |

---

## Tablero Fase 2 (POR CONSTRUIR — Dashboard KPIs, mayo/junio 2026)

### Operativos (diarios)

- **Toneladas pesadas hoy por sucursal** — Cerrillos / Maipu / Talca.
- **Fardos despachados hoy** — cuantos y a que cliente.
- **Camiones en ruta** — en vivo (requiere integracion con logistica).

### Comerciales (semanales)

- **Ventas cerradas semana** — $CLP y toneladas.
- **Compras a proveedores semana** — $CLP pagados.
- **Margen bruto semana por material top-10**.
- **Deudas > 30 dias** — cliente y monto.

### Estrategicos (mensuales)

- **Toneladas mensuales vs mes anterior** — por sucursal, por material.
- **Numero de clientes activos** — que compraron en los ultimos 30 dias.
- **Numero de proveedores activos** — que entregaron en los ultimos 30 dias.
- **% volumen por cliente top-3** — alerta de concentracion si > 60%.

### Diego Alonso

- **Procesos en `procesos_empresa`** — volumen total.
- **% preguntas respondidas sin "no se"** — debe subir de ~10% dia 1 a > 80% dia 90.
- **Entrevistas completadas acumuladas** — por contacto.
- **Borradores pendientes de validacion Dusan** — idealmente 0 al final del dia.

---

## Alertas criticas (quiero saberlo YA)

| Evento                                                 | Canal  | Accion                        |
|--------------------------------------------------------|--------|-------------------------------|
| Diego LIVE caido                                       | WA     | Rollback inmediato            |
| Mas de 5 mensajes inbound sin respuesta > 30 min       | WA     | Revisar Diego                 |
| Error HTTP en workflow                                 | WA     | Revisar n8n logs              |
| Palabra prohibida detectada en respuesta de Diego      | WA     | Intervencion manual           |
| Puerto Montt mencionada como activa en sitio publico   | WA     | Correccion inmediata          |
| Entrevista pausada > 72h sin retomar                   | WA     | Dusan evalua si la cierra     |

---

## Metricas personales (autoreflexion)

No son metricas de negocio pero son de Dusan para si mismo:

- **Decisiones irreversibles tomadas sin dormir:** objetivo 0/mes.
- **Despliegues en horario laboral sin aviso:** objetivo 0/mes.
- **Casos documentados en `casos-diego/` o `casos-dusan/`:** meta 4/mes (aprendizaje continuo).
- **Decisiones agregadas a `08-decisiones-lock.md`:** tracking — cuantas decisiones se consolidan vs se re-abren.

---

## Donde viven las metricas

- **Fase 1 (ya):** tabla `conversaciones` + query del Curador → WA 02:00.
- **Fase 2 (por construir):** Dashboard web en Panel Admin, nuevo tab o seccion aparte.
- **Fase 3+:** extendible a Google Data Studio / Looker Studio si escala el volumen.
