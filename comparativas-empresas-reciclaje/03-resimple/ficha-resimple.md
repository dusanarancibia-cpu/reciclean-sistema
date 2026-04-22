# Ficha Comparativa - ReSimple

> **URL**: https://resimple.cl
> **Pais**: Chile
> **Fundacion**: 2019 (bajo AB-Chile), constituido como GRANSIC Nov 2022
> **Categoria**: Sistema Colectivo Ley REP (envases y embalajes domiciliario)
> **Fecha analisis**: 2026-04-22
> **Estado fuentes**: WebSearch + App Store + Play Store + prensa

---

## A. Identidad

| Campo | Valor |
|-------|-------|
| Empresa | ReSimple GRANSIC (sin fines de lucro) |
| Pais | Chile - alcance nacional |
| Socios fundadores | 25+ empresas de consumo masivo (70%+ del mercado de envases) |
| Equipo | 120+ profesionales en 11 areas |
| Meta | 354 puntos limpios instalados en primeros 4 anos |

---

## B. Tabla B - Que hace ReSimple

| Linea | Funcion |
|-------|---------|
| Cumplimiento Ley REP (GRANSIC) | Cumple metas de reciclaje de envases de sus empresas afiliadas |
| Red de recoleccion domiciliaria | Camiones pasan por domicilios con material separado |
| Red de puntos limpios | 354 puntos comprometidos |
| App Ciudadana ReSimple Reciclaje | Avisa paso del camion, reporta problemas, solicita bolsas |
| Portal Gestores | Registra transacciones de gestores asociados |
| Convenios con municipios | Integracion con sistemas municipales de recoleccion |

---

## C. Tabla C - Flujo operativo

| Paso | Actor | Herramienta | Salida |
|------|-------|-------------|--------|
| 1. Empresa afiliada reporta envases | Empresa | Portal empresas ReSimple | Declaracion anual al MMA |
| 2. Ciudadano registra direccion | Vecino | App Ciudadana | Domicilio geolocalizado |
| 3. Notificacion dia de recoleccion | Vecino | App (push semanal) | Alerta en celular |
| 4. Camion pasa | Operario | App operador GPS | Tracking en tiempo real |
| 5. Ciudadano reporta incidente | Vecino | App (foto + descripcion) | Ticket |
| 6. Gestor recibe material | Gestor asociado | Portal Gestores | Transaccion registrada |
| 7. Reporte al MMA | ReSimple | Sistema interno | Cumplimiento meta REP |

---

## D. Tabla D - Tecnologias

| Capa | Tecnologia (confirmada / **deducida**) | Evidencia |
|------|----------------------------------------|-----------|
| App ciudadana iOS | `com.maptech.Resimple` | App Store CL |
| App ciudadana Android | MapTech (dev) | Play Store |
| App gestores Android | `com.portalGestoresReSimpleApp` | Play Store |
| Portal gestores | https://gestores.resimple.cl | Dominio propio |
| Stack movil | **Desarrollado por MapTech (agencia Chile) (deducido)** | Package id contiene "maptech" |
| Framework | **Ionic o Flutter (deducido)** | Estilo del package id |
| Tracking en tiempo real | **Firebase Realtime / Google Maps (deducido)** | "trucks operating in real time" |
| Notificaciones push | FCM Android / APNs iOS | Estandar movil |
| Navegacion a puntos limpios | Integracion Waze + Google Maps + iOS Maps | Declarado |
| Campanas educativas | Animacion + IA + contenido (agencia Inbrax) | Prensa PRODU |
| Datos y reportes MMA | Sistema propio con integracion MMA (deducido) | Requisito regulatorio |

---

## E. Tabla E - Visualizacion

| Elemento UI | Como lo hacen | Herramienta probable |
|-------------|---------------|----------------------|
| Mapa de camiones en vivo | Mapa con pins moviles | Google Maps + websockets/Firebase |
| Ficha de comuna | Que dia pasa + materiales aceptados | Base de datos comunal |
| Reporte ciudadano | Upload foto + descripcion | Firebase Storage (deducido) |
| Calendario de recoleccion | Recordatorios semanales | Cron + FCM |
| Portal gestores | Dashboard transacciones | Web app custom |
| Web corporativa | Sitio institucional | WordPress (deducido) |

---

## F. Tabla F - Nosotros vs ReSimple

| Funcionalidad ReSimple | Reciclean-Farex hoy | Estado |
|------------------------|---------------------|--------|
| App ciudadana con push | NO (PWA comercial interna) | Brecha |
| Tracking camion en vivo | NO | Brecha alta |
| Reporte de incidentes con foto | NO | Brecha |
| Portal para gestores/clientes | NO | Brecha |
| Cumplimiento regulatorio REP | NO aplica directo (somos gestor, no GRANSIC) | N/A |
| Calendario recoleccion | NO | Brecha media |
| Campanas educativas con IA | Usamos Claude para alias/precios | Distinto uso |
| Widget publico precios | SI | Ventaja nuestra |
| Tabla de 65 materiales x sucursal | SI | Ventaja nuestra |

---

## G. Tabla G - Brecha e implementacion

| Capacidad | Dificultad | Esfuerzo | Dependencias | Comentario |
|-----------|------------|----------|--------------|------------|
| App ciudadana instalable | 2 | 1-2 sem | PWA ya existe, falta onboarding | Rapido |
| Push notifications | 3 | 2-3 sem | Web Push + Supabase Edge Functions | |
| Tracking camion en vivo | 4 | 4-6 sem | GPS en celular + Supabase Realtime | |
| Portal gestor/cliente proveedor | 3 | 3-5 sem | Auth + RLS + vistas | |
| Reporte incidente con foto | 2 | 2 sem | Supabase Storage + form | |
| Integracion MMA / REP | N/A | - | - | No aplica a nuestro modelo |

---

## H. Fuentes

- https://resimple.cl/nosotros/quienes-somos/
- https://resimple.cl/nosotros/app-ciudadana/
- https://apps.apple.com/cl/app/resimple-reciclaje/id6466302587
- https://play.google.com/store/apps/details?id=com.maptech.Resimple
- https://play.google.com/store/apps/details?id=com.portalGestoresReSimpleApp
- https://gestores.resimple.cl
- https://www.paiscircular.cl/economia-circular/javier-fuentes-de-resimple-entrega-balance-de-primer-ano-de-la-rep/
- https://www.df.cl/df-lab/sostenibilidad/ley-rep-resimple-se-convierte-en-el-primer-sistema-de-gestion-aprobado
