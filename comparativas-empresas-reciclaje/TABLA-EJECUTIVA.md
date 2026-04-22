# Tabla Ejecutiva - Comparativa Empresas de Reciclaje vs Reciclean-Farex

> **Preparado para**: Dusan Arancibia (Gerente General Reciclean-Farex)
> **Preparado por**: Claude Code (trabajando con Pablo)
> **Fecha**: 2026-04-22
> **Alcance**: 6 empresas - 2 Chile, 1 Colombia, 3 internacionales (USA/UK)
> **Ubicacion maestra**: `/home/user/reciclean-sistema/comparativas-empresas-reciclaje/`

---

## Tabla 1 - RESUMEN EJECUTIVO (una linea por empresa)

| # | Empresa | Pais | Que hacen | Herramienta estrella | Brecha vs nosotros | Oportunidad concreta |
|---|---------|------|-----------|----------------------|---------------------|----------------------|
| 01 | **Grinclic** | Colombia | SaaS ERP + logistica + facturacion para gestores | Portal cliente + app operario + QR certificados | Modulo logistica y trazabilidad | QR de certificados + dashboards KPI |
| 02 | **TriCiclos** | Chile | Puntos limpios + app ciudadana + consultoria | App "Re" + software IR | App ciudadana + trazabilidad lote | App ciudadana en PWA existente |
| 03 | **ReSimple** | Chile | Sistema Colectivo Ley REP | App ciudadana + tracking camion + portal gestor | Tracking en vivo + portal cliente | Portal proveedor/cliente B2B |
| 04 | **Rubicon** | USA | Marketplace + SaaS flota + smart city | RUBICONPro + Pro/Premier/Connect | Optimizacion rutas + telemetria + IoT | Reporte ESG (CO2 evitada) |
| 05 | **Recycleye** | UK | Vision IA para MRF | Recycleye Vision (28 clases) + Vivid-AI | Vision por computador industrial | Claude Vision en foto de balanza |
| 06 | **AMP Robotics** | USA | Robotica IA clasificacion | AMP Neuron + Cortex (80 items/min) | Robotica hardware | Caracterizacion via Claude Vision |

---

## Tabla 2 - QUE USAN ELLOS (herramientas clave)

| Capa | Grinclic | TriCiclos | ReSimple | Rubicon | Recycleye | AMP |
|------|----------|-----------|----------|---------|-----------|-----|
| Frontend web | PHP server | WordPress + web | Web custom | Web + mobile | Web + live feed | Web + live feed |
| App movil | Cordova / Ionic | Nativa (React Native) | Ionic/Flutter (MapTech) | Hauler app smartphone | N/A | N/A |
| Backend | PHP + MySQL (ded) | API REST custom | API custom | AWS microservicios | Edge GPU + cloud | Edge GPU + cloud |
| Cloud | VPS tradicional (ded) | Cloud moderno (ded) | Firebase probable (ded) | **AWS (confirmado)** | AWS/GCP (ded) | AWS/GCP (ded) |
| Mapas | No evidente | Google Maps SDK | Google + Waze + Apple | ArcGIS + Google | N/A | N/A |
| IA | No declarada | No declarada | En campanas educativas | ML ruteo | **Deep learning vision** | **AMP Neuron CNN** |
| Hardware | Balanzas + GPS celular | Balanzas punto limpio | GPS camion | OBD II + IoT bins | Camaras industriales + brazo | Camaras + brazo Cortex |
| Trazabilidad | QR certificados + CUFE | 100% por lote | Reporte MMA | ESG dashboard | Composicion por stream | Composicion + flywheel data |
| IoT | No | No | GPS vehiculos | Samsara + sensores bin | Camaras edge | Camaras edge |

---

## Tabla 3 - QUE TENEMOS NOSOTROS vs CADA UNA

> 0 = no lo tenemos, 1 = parcial, 2 = equivalente, 3 = superior

| Capacidad | Grinclic | TriCiclos | ReSimple | Rubicon | Recycleye | AMP | **Nosotros (Reciclean-Farex)** |
|-----------|:--------:|:---------:|:--------:|:-------:|:---------:|:---:|:------------------------------:|
| Multi-sucursal con reglas por empresa | - | - | - | Parcial | - | - | **3 Ventaja** |
| Precios publicos tiempo real + widgets | - | Parcial | - | - | - | - | **3 Ventaja** |
| Sync Realtime Panel → Asistente → Web | Parcial | - | Parcial | Si | - | - | **3 Ventaja** (Supabase Realtime) |
| Integracion IA (Claude) en NLP de datos | - | - | Parcial | - | - | - | **3 Ventaja** |
| Stack moderno (Vite + Supabase + PWA) | - | Parcial | Si | Si | Si | Si | **2 Igual** |
| Portal cliente (generador/proveedor) | Si | - | Si | Si | - | - | **0 Brecha** |
| App operario terreno con GPS | Si | Parcial | Si | Si | - | - | **1 Parcial** (PWA comercial) |
| Trazabilidad residuo lote-a-lote | Si | Si | Parcial | Si | - | - | **0 Brecha** |
| Dashboards KPI operacion | Si | Si | - | Si | Si | Si | **0 Brecha** (solo Tab G revisor) |
| Facturacion electronica SII | Si (DIAN) | - | - | Si | - | - | **0 Brecha** |
| Optimizacion rutas | - | - | Si | Si | - | - | **0 Brecha** |
| Vision IA material | - | - | - | - | Si | Si | **0 Brecha** (potencial con Claude Vision) |
| Reporte ESG / CO2 evitada | - | Si | - | Si | Parcial | Parcial | **0 Brecha** (alto valor comercial) |
| QR certificados validables | Si | - | - | - | - | - | **0 Brecha** |

---

## Tabla 4 - PRIORIZACION DE IMPLEMENTACION (roadmap accionable)

> Ordenado por **valor/esfuerzo**. Semanas de un desarrollador.

| Prio | Capacidad a implementar | Inspirado en | Dificultad (1-5) | Esfuerzo (sem) | Valor negocio | Dependencias |
|:----:|--------------------------|--------------|:----------------:|:--------------:|:-------------:|--------------|
| 1 | Dashboard KPI operacion (Tab nuevo) | Grinclic, Rubicon | 2 | 2-3 | Alto | Vistas Supabase + Chart.js |
| 2 | QR certificados de entrega validables | Grinclic | 2 | 1-2 | Alto (confianza) | qrcode lib + ruta publica |
| 3 | Reporte ESG / CO2 evitada por cliente | Rubicon, TriCiclos | 2 | 2-3 | Alto (comercial) | Factor emisiones por material |
| 4 | Portal Cliente B2B (proveedor o comprador) | Grinclic, ReSimple, Rubicon | 3 | 3-5 | Alto | Auth + RLS Supabase |
| 5 | App ciudadana con mapa de sucursales | TriCiclos, ReSimple | 2 | 2-3 | Medio | Extender PWA + Google Maps |
| 6 | Historial "mi huella" por cliente | TriCiclos | 3 | 3-4 | Medio | Auth + tabla depositos |
| 7 | Trazabilidad lote a lote | Grinclic, TriCiclos | 4 | 5-8 | Alto (regulatorio) | Tablas nuevas + QR |
| 8 | App terreno con foto + Claude Vision | Recycleye, AMP (pragmatico) | 3 | 3-4 | Medio-alto | Claude API ya integrado |
| 9 | Push notifications web | ReSimple | 3 | 2-3 | Medio | Web Push + Edge Functions |
| 10 | Tracking vehiculo en vivo | ReSimple, Rubicon | 4 | 4-6 | Medio | GPS celular + Supabase Realtime |
| 11 | Optimizacion rutas basica | Rubicon | 4 | 6-8 | Medio | Google Maps Directions + TSP |
| 12 | Facturacion electronica SII | Grinclic | 5 | 8-12 | Bajo (ya externo) | Integrador OpenFactura/Haulmer |
| 13 | Telemetria vehiculo (OBD II) | Rubicon | 5 | 12+ | Bajo | Hardware CAPEX |
| 14 | IoT bins con sensores | Rubicon | 5 | 16+ | Bajo | Hardware CAPEX |
| 15 | Vision IA industrial en cinta | Recycleye, AMP | 5 | 1+ ano | Bajo | No aplica a nuestro modelo B2B compra |

**Tres quick-wins recomendados (primer trimestre)**: #1 Dashboards KPI + #2 QR certificados + #3 Reporte ESG. Juntos 5-8 semanas con alto impacto comercial.

---

## Tabla 5 - NUESTRAS DIFICULTADES PARA IMPLEMENTAR

| Dificultad | Afecta a | Magnitud | Como mitigarla |
|------------|----------|----------|----------------|
| **Equipo pequeno de desarrollo** (Pablo + Claude) | Todas | Alta | Priorizar quick-wins, no emprender proyectos >8 sem sin planificacion |
| **CAPEX hardware** (robotica, IoT, camaras industriales) | AMP, Recycleye, Rubicon IoT | Alta | Descartar hardware propio; evaluar partners |
| **Regulatorio SII Chile** (facturacion electronica) | Grinclic (DIAN) | Media | Usar integrador (OpenFactura, Haulmer, Toku) |
| **Dataset propio para vision IA** | Recycleye, AMP | Alta | Usar Claude Vision (zero-shot) en lugar de modelos propios |
| **Modelo negocio B2B compra vs B2B2C** | TriCiclos, ReSimple | Media | No replicar modelo, tomar solo capas digitales |
| **Geografia dispersa (4 sucursales)** | Todas las de logistica | Media | Empezar por 1 sucursal piloto (Cerrillos) |
| **Repo publico - sin secretos en codigo** | Integraciones con APIs pagadas | Baja | Variables entorno Vercel/Supabase (ya resuelto) |
| **Puerto Montt no operativa** | Despliegue nacional | Baja | Mantener oculta hasta permisos |

---

## Tabla 6 - UBICACION DE TODO EL MATERIAL

| # | Que contiene | Nombre archivo | Ruta absoluta |
|---|--------------|----------------|---------------|
| 0 | **Indice y tabla ejecutiva (este archivo)** | `TABLA-EJECUTIVA.md` | `/home/user/reciclean-sistema/comparativas-empresas-reciclaje/TABLA-EJECUTIVA.md` |
| 1 | Patrones de busqueda, metodologia, plantilla | `patrones-de-busqueda.md` | `.../comparativas-empresas-reciclaje/metodologia/patrones-de-busqueda.md` |
| 2 | Ficha Grinclic (8 tablas A-H) | `ficha-grinclic.md` | `.../comparativas-empresas-reciclaje/01-grinclic/ficha-grinclic.md` |
| 3 | Ficha TriCiclos (8 tablas A-H) | `ficha-triciclos.md` | `.../comparativas-empresas-reciclaje/02-triciclos/ficha-triciclos.md` |
| 4 | Ficha ReSimple (8 tablas A-H) | `ficha-resimple.md` | `.../comparativas-empresas-reciclaje/03-resimple/ficha-resimple.md` |
| 5 | Ficha Rubicon (8 tablas A-H) | `ficha-rubicon.md` | `.../comparativas-empresas-reciclaje/04-rubicon/ficha-rubicon.md` |
| 6 | Ficha Recycleye (8 tablas A-H) | `ficha-recycleye.md` | `.../comparativas-empresas-reciclaje/05-recycleye/ficha-recycleye.md` |
| 7 | Ficha AMP Robotics (8 tablas A-H) | `ficha-amp-robotics.md` | `.../comparativas-empresas-reciclaje/06-amp-robotics/ficha-amp-robotics.md` |
| 8 | README con indice e instrucciones | `README.md` | `.../comparativas-empresas-reciclaje/README.md` |

**Carpeta raiz**: `comparativas-empresas-reciclaje/`
**Nomenclatura carpetas**: `NN-empresa/` (numeradas por orden de investigacion)
**Formato fichas**: Markdown con 8 tablas estandar (A. Identidad, B. Que hacen, C. Como lo hacen, D. Herramientas, E. Visualizacion, F. Que tenemos, G. Brecha, H. Fuentes)

---

## Conclusion para Dusan

**Los 3 movimientos con mayor retorno para Reciclean-Farex en los proximos 90 dias** son:

1. **Dashboard de KPIs operacionales** (2-3 sem) - Tomado de lo que hacen Grinclic y Rubicon. Nos da visibilidad gerencial que hoy no existe.
2. **QR en certificados de entrega** (1-2 sem) - Copiar directo de Grinclic. Aumenta confianza en clientes compradores.
3. **Reporte ESG con CO2 evitada** (2-3 sem) - Como Rubicon y TriCiclos. Abre conversacion comercial con empresas grandes (Walmart Chile, retail, mineras).

**Lo que NO recomendamos perseguir ahora**: robotica (AMP), vision industrial en cinta (Recycleye), telemetria vehicular y IoT bins (Rubicon). Todas requieren CAPEX alto y equipo especializado que no tenemos. Podemos capturar 80% del valor de la IA visual usando Claude Vision API sobre fotos que los operarios ya toman.

**Nuestras ventajas genuinas** que ninguna otra tiene combinadas: precios publicos en tiempo real con widget en 2 sitios, Supabase Realtime para sincronizacion instantanea Panel → Asistente → Web, y Claude IA integrada para alias y correccion de datos.
