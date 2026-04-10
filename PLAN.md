# Plan de Avance — Reciclean-Farex Sistema

## Resumen Ejecutivo

Sistema web (PWA) de asistente comercial para Grupo Reciclean y Farex.
Permite a los trabajadores consultar precios de materiales reciclables,
generar cotizaciones en PDF y compartirlas por WhatsApp.
Incluye un panel de administracion con monitoreo de uso.

---

## Avance del 10 de abril de 2026

### Que se hizo hoy (en palabras sencillas)

1. **Se creo un boton PDF en el panel de monitoreo** que permite descargar
   un informe completo del uso que cada trabajador le da al asistente comercial.
   El PDF incluye: datos del trabajador, semaforo de avance (completo, parcial,
   solo mira precios), resumen con 8 metricas clave y el detalle sesion por
   sesion con linea de tiempo de cada accion realizada.

2. **Se construyo el sistema completo de monitoreo de uso** (Tab I del panel admin)
   que lee los eventos desde Supabase y muestra: KPIs generales, tabla de
   trabajadores, embudo de conversion y timeline en tiempo real.

3. **Se corrigieron los precios para las sucursales de Talca y Puerto Montt**,
   eliminando factores de ajuste incorrectos y reemplazandolos por margenes
   compensados que reflejan mejor la realidad comercial de cada sucursal.

4. **Se rediseno visualmente el chatbot** con un nuevo concepto grafico
   ("Kraft Eco": fondo crema, textura papel reciclado), nuevo launcher
   (circulo verde con icono Reciclean), avatares mejorados y burbujas
   de chat mas amplias.

---

### Detalle por persona

#### Dusan Arancibia

| # | Commit | Descripcion | Fecha/Hora |
|---|--------|-------------|------------|
| 1 | `c3d0b11` | Boton PDF por trabajador en Tab I Monitoreo — genera informe descargable con header, datos trabajador, semaforo, resumen numerico (8 metricas) y detalle sesion por sesion | 10-abr 09:47 |
| 2 | `3146a55` | Fix: tracking dashboard usa nombre correcto del cliente Supabase en admin panel | 09-abr 17:02 |
| 3 | `baae6ae` | Sistema de monitoreo de uso del Asistente Comercial completo (KPIs, tabla, embudo, timeline) | 09-abr 16:36 |
| 4 | `0a93f77` | Margenes compensados para Talca/Puerto Montt reemplazan SUC_FACTOR | 09-abr 14:17 |
| 5 | `3912eed` | Factores de ajuste Talca y Puerto Montt corregidos a 1.0 | 09-abr 12:20 |
| 6 | `ef5f3a0` | Avatar fondo blanco nitido + burbujas mas anchas hasta la derecha | 09-abr 00:26 |
| 7 | `789318b` | Avatar sin fondo verde + texto desplazado a la derecha | 09-abr 00:22 |
| 8 | `ba76db2` | Launcher rediseñado como componente CSS puro | 09-abr 00:17 |
| 9 | `9192fd8` | Nuevo launcher — circulo verde con burbuja chat + Reciclean icon | 09-abr 00:13 |

**Total: 9 commits** — Cubren 3 areas: monitoreo/reportes, precios por sucursal, rediseno visual chatbot.

#### Pablo

> No se encontraron commits de Pablo en el repositorio durante este periodo.
> Si Pablo realizo tareas no registradas en git (diseno, pruebas, coordinacion,
> documentacion, configuracion Supabase, etc.), agregar el detalle aqui manualmente.

| # | Tarea | Descripcion | Estado |
|---|-------|-------------|--------|
| 1 | _(por completar)_ | | |

---

## Nivel de Avance por Modulo

| Modulo | Descripcion | Avance | Estado |
|--------|-------------|--------|--------|
| Panel Admin (index.html) | Dashboard de administracion con tabs de configuracion | 90% | Avanzado |
| Asistente Comercial (asistente.html) | Chatbot para trabajadores con consulta de precios | 85% | Avanzado |
| Chatbot Publico (chatbot-v2.html) | Version cliente final con selector de materiales y carrito | 80% | Avanzado |
| Login / Autenticacion | Sistema de login con Supabase Auth | 95% | Casi completo |
| Monitoreo de Uso (Tab I) | Dashboard de tracking con KPIs, tabla, embudo, timeline y PDF | 95% | Casi completo |
| Precios por Sucursal | Logica de precios diferenciados Talca / Puerto Montt / Santiago | 90% | Avanzado |
| Generacion PDF / WhatsApp | Crear cotizacion PDF y compartir por WhatsApp | 90% | Avanzado |
| Carrito Multi-material | Seleccion de multiples materiales con tramo por suma total | 85% | Avanzado |
| Diseno Visual Chatbot v3 | Concepto Kraft Eco, launcher, avatares, burbujas | 90% | Avanzado |
| Sistema de Alias | Mapeo de nombres coloquiales a materiales oficiales | 85% | Avanzado |
| Tracking de Eventos (Supabase) | Registro de eventos del asistente en base de datos | 95% | Casi completo |
| PWA / Service Worker | Funcionalidad offline y manifest | 70% | En progreso |

**Avance general estimado: ~87%**

---

## Proximos pasos sugeridos

- [ ] Completar pruebas de usuario con trabajadores reales
- [ ] Revisar rendimiento en dispositivos moviles
- [ ] Validar precios de todas las sucursales con datos actualizados
- [ ] Documentar flujo de uso para capacitacion
- [ ] Revisar y optimizar consultas Supabase (performance)

---

_Ultima actualizacion: 10 de abril de 2026_
