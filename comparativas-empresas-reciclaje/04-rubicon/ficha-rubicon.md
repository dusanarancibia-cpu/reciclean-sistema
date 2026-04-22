# Ficha Comparativa - Rubicon

> **URL**: https://www.rubicon.com
> **Pais**: USA (HQ Atlanta)
> **Categoria**: SaaS gestion residuos + marketplace + smart city + flota
> **Fecha analisis**: 2026-04-22
> **Estado fuentes**: Web + Crunchbase + Samsara + AWS Marketplace

---

## A. Identidad

| Campo | Valor |
|-------|-------|
| Empresa | Rubicon Technologies (NYSE: RBT hasta 2024) |
| Pais HQ | USA, Atlanta |
| Modelo | Asset-light marketplace: conecta generadores con transportistas independientes |
| Presencia | Global (USA, Japon, partnerships multi-pais) |
| Productos | RUBICONPro, RUBICONConnect, RUBICONPremier, RUBICONSmartCity |

---

## B. Tabla B - Que hace Rubicon

| Producto | Cliente | Funcion |
|----------|---------|---------|
| RUBICONPro | Transportistas pequenos/medianos | Suite completa para operar la flota (optimizacion, ERP, facturacion) |
| RUBICONConnect | Transportistas | Acceso al marketplace de clientes |
| RUBICONPremier | Clientes corporativos (Walmart, Starbucks, etc.) | Gestion centralizada de todos sus sitios |
| RUBICONSmartCity | Municipios | IoT + ruteo + reportes para recoleccion municipal |
| Marketplace | Ambos lados | Match entre generadores y transportistas |

---

## C. Tabla C - Flujo operativo

| Paso | Actor | Herramienta | Salida |
|------|-------|-------------|--------|
| 1. Cliente corporativo pide retiro | Walmart (ej.) | RUBICONPremier | Orden |
| 2. Marketplace asigna transportista local | Algoritmo Rubicon | RUBICONConnect | Asignacion |
| 3. Driver recibe ruta | Conductor | App hauler Rubicon (smartphone + plug OBD II) | Turn-by-turn |
| 4. Ruta optimizada | Sistema | RUBICONPro (AVL + optimizacion) | Secuencia eficiente |
| 5. Servicio ejecutado | Driver | App con foto y sello digital | Prueba de servicio |
| 6. Facturacion y pago | Sistema | RUBICONPro | Factura al cliente, pago al hauler |
| 7. Reporte sostenibilidad | Cliente corp | Dashboard | Diversion rate, ton CO2 evitadas |

---

## D. Tabla D - Tecnologias

| Capa | Tecnologia | Evidencia |
|------|-----------|-----------|
| Telemetria vehiculo | Plug-in OBD II + Samsara | Samsara marketplace confirmado |
| App hauler | Smartphone-native app | Declarado |
| GPS / AVL | Automatic Vehicle Location | Declarado |
| IoT sensores bins | Ultrasonico / infrarrojo con alertas 80% capacidad | Blog Rubicon |
| Cloud | **AWS (confirmado)** | Listado en AWS Marketplace |
| Ruteo | Algoritmo propio + ML | Declarado "real-time route optimization" |
| Mapas | ArcGIS (caso Columbus) + Google | Caso real |
| Integracion 311 | API hacia sistemas municipales | Caso Columbus |
| Stack back | **Java/Python microservicios en AWS (deducido)** | Escala + marketplace |
| App frontend | **React Native (deducido)** | Multi-plataforma |

---

## E. Tabla E - Visualizacion

| Elemento UI | Como lo presentan |
|-------------|-------------------|
| Dashboard cliente corporativo | KPIs de diversion, gasto, sostenibilidad, multi-sitio |
| Mapa flota en vivo | AVL con vehiculos y bins IoT |
| Alertas de mantenimiento | Por OBD II + ML |
| Reportes ESG | Exportables para reportes corporativos |
| Turn-by-turn driver | Similar a Waze/Google para camion |
| Service history | Foto + geotag + timestamp por cada parada |

---

## F. Tabla F - Nosotros vs Rubicon

| Funcionalidad Rubicon | Reciclean-Farex hoy | Estado |
|------------------------|---------------------|--------|
| Marketplace haulers | NO (no aplica directo) | N/A |
| Optimizacion rutas | NO | Brecha |
| Telemetria vehiculos | NO | Brecha |
| IoT bins con sensores | NO | Brecha (CAPEX) |
| Dashboard cliente multi-sitio | NO | Brecha |
| Reporte ESG / sostenibilidad | NO | Brecha con alto valor comercial |
| App driver turn-by-turn | NO | Brecha |
| Precios publicos en tiempo real | SI | Ventaja nuestra |
| Multi-sucursal con reglas empresa | SI | Ventaja nuestra |

---

## G. Tabla G - Brecha e implementacion

| Capacidad | Dificultad | Esfuerzo | Dependencias | Comentario |
|-----------|------------|----------|--------------|-----------|
| Dashboard multi-sitio cliente | 3 | 3-5 sem | Auth + RLS + vistas Supabase | Alto valor comercial |
| Reporte ESG / ton CO2 evitadas | 2 | 2-3 sem | Factor emisiones por material | Facil y vendible |
| Optimizacion rutas basica | 4 | 6-8 sem | Google Maps Directions + TSP | |
| Telemetria vehiculo | 5 | 12+ sem | Hardware OBD II + integracion | Alto CAPEX |
| IoT bins con sensores | 5 | 16+ sem | Hardware sensor + backend IoT | Alto CAPEX |
| App driver con foto y geo | 3 | 4-5 sem | Extender Asistente PWA + storage | |

---

## H. Fuentes

- https://www.rubicon.com/
- https://www.rubicon.com/news/smart-waste-solution/
- https://www.rubicon.com/news/getting-smart/
- https://www.samsara.com/resources/marketplace/rubiconsmartcity
- https://aws.amazon.com/marketplace/pp/prodview-2qvivcmv2jp7e
- https://www.wastedive.com/spons/how-to-optimize-your-hauling-fleet-with-rubicons-technology-suite/698664/
- https://www.wastetodaymagazine.com/article/expand-your-hauling-business-with-rubiconpro-sponsored-content-rubicon/
- https://www.crunchbase.com/organization/rubicon-technologies
