# Ficha Comparativa - AMP Robotics

> **URL**: https://ampsortation.com (antes amprobotics.com)
> **Pais**: USA (HQ Denver, Colorado)
> **Categoria**: Robotica + IA + plantas de clasificacion completas
> **Fecha analisis**: 2026-04-22

---

## A. Identidad

| Campo | Valor |
|-------|-------|
| Empresa | AMP (AMP Robotics Corp.) |
| Pais HQ | USA |
| Fundacion | 2014 por Dr. Matanya Horowitz |
| Financiamiento | 200+ MUSD levantados |
| Modelo negocio | Venta/leasing de equipos + operacion de plantas (vertical) |

---

## B. Tabla B - Que hace AMP

| Producto | Funcion |
|----------|---------|
| AMP Vision | Sistema de camaras sobre cinta que alimenta AMP Neuron con video |
| AMP Neuron | Plataforma IA - reconoce 100+ materiales (papel, metal, plasticos) con hasta 99% precision |
| AMP Cortex | Sistema robotico alta velocidad - 80 items/min |
| AMP Cortex-C | Version compacta para espacios reducidos |
| AMP ONE (Integrated Facility) | Oferta llave en mano de planta completa automatizada |
| AMP Material Characterization | Analisis en tiempo real de composicion del flujo (sin separar) |

**Propuesta valor**: Hacer que el reciclaje sea **rentable** via automatizacion. Reducir costos de mano de obra y aumentar tasas de recuperacion.

---

## C. Tabla C - Flujo operativo

| Paso | Actor | Herramienta | Salida |
|------|-------|-------------|--------|
| 1. Material en cinta | Planta MRF | Conveyor estandar | Flujo mixto |
| 2. Vision escanea | AMP Vision (camaras) | Video | Imagenes con metadatos |
| 3. IA clasifica | AMP Neuron | Deep learning | Label + posicion + tiempo |
| 4. Robot ejecuta | AMP Cortex (brazo) | Succion / pinza neumatica | Item en contenedor correcto |
| 5. Data loop | Sistema | Cloud + reentrenamiento | Modelo mejora continua |
| 6. Dashboard operador | Supervisor | UI web | Pureza, throughput, downtime |

---

## D. Tabla D - Tecnologias

| Capa | Tecnologia | Evidencia |
|------|-----------|-----------|
| Vision | AMP Vision - camaras industriales sobre cinta | Declarado |
| IA deep learning | AMP Neuron - CNN propias con 100+ clases | Declarado |
| Actuacion | Brazos roboticos de succion a 80 items/min | Declarado |
| Edge inference | **GPU industrial en planta (deducido)** | Latencia requerida |
| Cloud / data | **AWS o GCP (deducido)** + data lake propio | Data flywheel declarado |
| Integracion MRF | Retrofit sobre cintas existentes | Declarado |
| Planta integral (AMP ONE) | Diseno + ingenieria + operacion | Producto vertical |

---

## E. Tabla E - Visualizacion

| Elemento UI | Como lo presentan |
|-------------|-------------------|
| Live camera feed + overlays | Bounding boxes por item + clase |
| Throughput robot | Items/min, uptime |
| Pureza por fraccion | KPI en tiempo real |
| Material mix dashboard | Composicion historica y tiempo real |
| Market intelligence | Datos agregados de composicion para la industria |

---

## F. Tabla F - Nosotros vs AMP

| Funcionalidad AMP | Reciclean-Farex hoy | Estado |
|-------------------|---------------------|--------|
| Robotica de clasificacion | NO | Brecha (CAPEX) |
| Vision IA 100+ materiales | NO | Brecha |
| Operacion de planta integral | NO (somos compradores, no MRF) | Modelo distinto |
| Data agregada composicion | NO | Brecha |
| Clasificacion humana | SI | Status actual |
| IA texto (Claude) | SI | Distinto dominio |

---

## G. Tabla G - Brecha e implementacion

| Capacidad | Dificultad | Esfuerzo | Dependencias | Comentario |
|-----------|------------|----------|--------------|-----------|
| Vision IA basica sobre foto balanza | 3 | 3-4 sem | Claude Vision API sobre imagenes | Quick win |
| Pipeline analitico composicion | 4 | 8-10 sem | Tabla `ingresos`, `clasificacion`, BI | Alto valor |
| Robotica de clasificacion | 5 | N/A | CAPEX 100k+ USD por linea | Via partner equipment |
| Data flywheel propio | 5 | 1+ ano | ML team + storage + compute | No factible in-house |

**Camino pragmatico para nosotros**: Replicar el valor de "caracterizacion" (NO de separacion) usando Claude Vision sobre fotos que los operarios ya toman en terreno.

---

## H. Fuentes

- https://ampsortation.com/
- https://ampsortation.com/articles/new-compact-version-of-companys-industry-leading-r
- https://ampsortation.com/articles/amp-robotics-achieves-data-milestones-and-recycling-automation-breakthrough
- https://ampsortation.com/articles/company-introduces-next-gen-data-application-to-tr
- https://research.contrary.com/company/amp-robotics
- https://www.ellenmacarthurfoundation.org/circular-examples/artificial-intelligence-for-recycling-amp-robotics
- https://fortune.com/2025/06/26/ai-recycling-trash-amp-robotics/
