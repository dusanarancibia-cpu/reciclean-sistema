# Ficha Comparativa - Grinclic

> **URL**: https://grinclic.com
> **Pais**: Colombia (Bogota) - opera en LATAM
> **Fundado por**: EMLAZE Systems (socio con +30 anos en software)
> **Categoria**: SaaS de gestion de residuos + ERP + Facturacion electronica + App movil
> **Fecha analisis**: 2026-04-22
> **Estado fuentes**: WebFetch bloqueado (403) → deduccion desde snippets + App Store + LinkedIn

---

## A. Identidad

| Campo | Valor |
|-------|-------|
| Empresa | Grinclic (producto de Emlaze Systems) |
| Pais HQ | Colombia |
| Fundacion | Producto con ~5 anos (Emlaze con 30 anos) |
| Tamano | +30 empresas clientes declaradas |
| Clientes tipo | Gestores de residuos peligrosos, RAEE, escombreras, asociaciones de reciclaje, transformadores |

---

## B. Tabla B - Que hace Grinclic

| Linea de producto | Funcion principal |
|-------------------|-------------------|
| Grinclic Logistica | Planeacion de servicios, reporte de cantidades recolectadas, certificacion |
| Grinclic ERP | Compras de materias primas, stock de residuos, contratacion de servicios y proveedores |
| Grinclic Facturacion | Facturacion electronica DIAN (CUFE, CUDE, XML, QR, validacion previa) |
| Grinclic App (iOS + Android) | Operarios en terreno: chequeos preoperacionales, rutas, conciliaciones |
| Portal Cliente | Consulta de manifiestos, certificados, aprobacion de servicios, estadisticas |

**Propuesta de valor declarada**: Reducir 30% tiempos muertos, aumentar productividad hasta 200%, eliminar reprocesos y registros fisicos, pasar de 8 dias a 6 horas la facturacion masiva.

---

## C. Tabla C - Como lo hacen (flujo operativo)

| Paso | Actor | Herramienta | Salida |
|------|-------|-------------|--------|
| 1. Solicitud recoleccion | Cliente generador | Portal web / telefono | Orden de servicio |
| 2. Declaracion de residuos | Cliente generador | Portal cliente Grinclic | Manifiesto previo |
| 3. Asignacion equipo/personal | Planner | Modulo Logistica | Ruta + vehiculo |
| 4. Chequeo preoperacional | Conductor | App movil | Check list firmado |
| 5. Recoleccion en terreno | Operario | App movil (captura de cantidad) | Conciliacion servicio |
| 6. Entrega a planta | Conductor | App con GPS + QR | Ingreso a inventario |
| 7. Certificacion legal | Sistema | Backend + QR | Certificado con QR de validacion |
| 8. Facturacion | Area administrativa | Modulo DIAN | Factura electronica (CUFE) |
| 9. Indicadores | Gerencia | Portal BI | KPIs de operacion |

---

## D. Tabla D - Herramientas y tecnologias que ocupan

| Capa | Tecnologia usada (confirmada o **deducida**) | Evidencia |
|------|----------------------------------------------|-----------|
| Frontend web | PHP + HTML server-rendered (deducido) | URLs `.php` en toda la nav: `indexErp.php`, `indexFacturacion.php`, `login.php` |
| Framework app movil | **Cordova / Ionic (deducido)** | Package id Play Store: `io.cordova.grinclic` |
| Segunda app | **Ionic/Capacitor (deducido)** | Package id: `com.grinclic.app` (Grinclic 2.0) |
| Facturacion electronica | Integracion DIAN Colombia (CUFE, CUDE, XML) | Confirmado en landing |
| Trazabilidad | QR en certificados | Confirmado en landing |
| Base de datos | **Relacional (MySQL/Postgres) (deducido)** | Stack PHP clasico apunta a MySQL |
| Hosting | **VPS tradicional (deducido)** | No hay evidencia de CDN moderno |
| Autenticacion | Login propio `login.php` con token en URL | Visto en `login.php?lk=...` |
| Multi-tenant | Si - cada cliente con subdominio/token | Visto en URL con `lk=<token>` |

---

## E. Tabla E - Como se ve la informacion (UI / visualizacion)

| Elemento UI | Como lo hacen | Herramienta probable (deducida) |
|-------------|---------------|--------------------------------|
| Landing corporativa | Paginas PHP estaticas con secciones scrolleables | Bootstrap + jQuery (deducido) |
| Portal cliente | Tablas HTML con filtros + descarga PDF | DataTables.js + TCPDF (deducido) |
| Dashboards KPI | Graficos embebidos por modulo | Chart.js o Highcharts (deducido) |
| App operario | Pantallas form-based nativo-hibrido | Cordova con plugins GPS/Camara |
| Certificados | PDF con QR de validacion publica | TCPDF / DomPDF + QR lib (deducido) |
| Mapas de ruta | No evidente en landing publica | **Probable Google Maps API** si existe |
| Videos demo | Canal YouTube @grinclicsoftware6373 | YouTube embed |

---

## F. Tabla F - Que tenemos nosotros (Reciclean-Farex) vs Grinclic

| Funcionalidad Grinclic | Nuestro equivalente hoy | Estado |
|------------------------|-------------------------|--------|
| Software SaaS multi-cliente | Panel Admin interno | Solo uso interno, no vendido |
| Modulo logistica (rutas) | NO existe | Brecha |
| App movil operarios | Asistente Comercial PWA (comercial, no logistica) | Parcial |
| Trazabilidad residuo punto a punto | NO existe | Brecha |
| Facturacion electronica SII | NO existe (gestionado fuera) | Brecha |
| QR certificados | NO existe | Brecha |
| Dashboards KPI operacion | NO existe (solo Tab G revisor) | Brecha |
| Portal Cliente (generador) | NO existe | Brecha |
| Sincronizacion tiempo real | SI - `asistente_snapshot` + Supabase Realtime | Ventaja nuestra |
| Widgets publicos de precios | SI - reciclean.cl + farex.cl | Ventaja nuestra |
| Gestion precios 65 SKUs x 4 sucursales | SI | Ventaja nuestra |
| Stack moderno (Vite + Supabase) | SI | Ventaja nuestra |
| Integracion Claude IA (alias, correcciones) | SI | Ventaja nuestra |

---

## G. Tabla G - Brecha e implementacion

> Score dificultad 1 (facil) a 5 (alto esfuerzo).

| Capacidad que falta | Dificultad | Esfuerzo (semanas) | Dependencias | Comentario |
|---------------------|------------|--------------------|--------------|-----------|
| Modulo Logistica con rutas | 4 | 4-6 | Google Maps API + tabla `rutas` en Supabase | Requiere definir vehiculos y conductores |
| Trazabilidad residuo | 3 | 3-4 | QR lib + tabla `movimientos` | Mas simple sin integracion SII |
| App movil operarios (ingreso de tonelaje) | 3 | 3-4 | Extender Asistente PWA con formularios | Ya tenemos base PWA |
| Facturacion electronica SII Chile | 5 | 8-12 | Integrador SII (API OpenFactura/Haulmer) | Regulatorio, alta barrera |
| Portal Cliente generador | 4 | 5-7 | Nuevo subdominio + auth + RLS Supabase | Requiere rediseno comercial |
| QR certificados validables | 2 | 1-2 | `qrcode` lib + ruta publica validacion | Baja complejidad |
| Dashboards KPI | 2 | 2-3 | Chart.js sobre Supabase views | Rapido, alto valor |
| Chatbot WhatsApp IA | 3 | 3-5 | Ya en Fase 4 del roadmap | En curso |

---

## H. Fuentes consultadas

- https://www.grinclic.com/index.php/
- https://grinclic.com/indexErp.php
- https://www.grinclic.com/indexFacturacion.php
- https://apps.apple.com/us/app/grinclic/id6502453200
- https://play.google.com/store/apps/details?id=com.grinclic.app
- https://play.google.com/store/apps/details?id=io.cordova.grinclic
- https://co.linkedin.com/company/grinclic
- https://www.youtube.com/@grinclicsoftware6373
- https://dspace.tdea.edu.co/entities/publication/eb52fa98-cb8f-4d01-aebd-762a4f0c440c (tesis M&V Ambiental)
