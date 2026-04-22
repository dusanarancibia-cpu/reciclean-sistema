# Ficha Comparativa - Recycleye

> **URL**: https://recycleye.com
> **Pais**: UK (HQ Londres)
> **Categoria**: Vision por computador + IA para clasificacion en MRF
> **Estado**: Adquirido por CP Group (USA) en abril 2026
> **Fecha analisis**: 2026-04-22

---

## A. Identidad

| Campo | Valor |
|-------|-------|
| Empresa | Recycleye (ahora parte de CP Group) |
| Producto estrella | Recycleye Vision + Recycleye Robotics + Vivid-AI |
| Categoria | Hardware + software IA para MRF (Material Recovery Facility) |
| Segmento | Plantas de clasificacion industriales |

---

## B. Tabla B - Que hace Recycleye

| Producto | Funcion |
|----------|---------|
| Recycleye Vision | Camaras + IA deep learning clasifican material en tiempo real en cinta transportadora |
| Recycleye Robotics | Brazos roboticos que separan material identificado por Vision |
| Vivid-AI | Separacion por chorros de aire alta velocidad guiados por IA (alternativa a brazo robotico) |
| Analytics Platform | Caracterizacion en tiempo real de la composicion del flujo |

**Ventaja clave**: Distingue categorias que los sensores NIR convencionales NO pueden (plasticos negros, food-grade, metales no-ferrosos sub-tipos). Clasifica en **28 categorias**.

---

## C. Tabla C - Flujo operativo en MRF

| Paso | Actor | Herramienta | Salida |
|------|-------|-------------|--------|
| 1. Material cae a cinta | Planta | Cinta transportadora | Flujo mixto |
| 2. Camara escanea | Recycleye Vision | Deep learning inferencia | Etiqueta por objeto (28 clases) |
| 3. Decision de separacion | Algoritmo | Pipeline IA | Comando a actuador |
| 4. Separacion fisica | Robot o Vivid-AI | Brazo o chorro aire | Material separado por tipo |
| 5. Monitoreo calidad | Supervisor | Dashboard Recycleye | KPI de pureza |
| 6. Mejora continua | IA | Data flywheel | Reentrenamiento con data real |

---

## D. Tabla D - Tecnologias

| Capa | Tecnologia | Evidencia |
|------|-----------|-----------|
| Vision por computador | Deep learning (CNN, probablemente YOLO / transformers) | Declarado como "deep learning" |
| Entrenamiento | Dataset propietario de millones de imagenes | Declarado |
| Inferencia edge | **GPU on-premise en planta (deducido)** | Latencia real-time requiere edge |
| Actuacion | Brazos roboticos (terceros) o Vivid-AI (aire) | Declarado |
| Cloud | **AWS o GCP (deducido)** | Estandar en AI companies UK |
| Dashboard | **Grafana / custom React (deducido)** | |
| Iluminacion | LEDs especializados sobre cinta | Estandar industria |
| Camaras | **Industrial machine vision (Basler / FLIR) (deducido)** | Calidad requerida |

---

## E. Tabla E - Visualizacion

| Elemento UI | Como lo presentan |
|-------------|-------------------|
| Live feed camara + overlay IA | Bounding boxes con categoria y confianza |
| Composicion material en tiempo real | Graficos de torta/barra actualizados al minuto |
| Pureza por stream | KPI por linea |
| Ingreso vs egreso | Conciliacion de tonelaje |
| Alertas de contaminacion | Cuando un material aparece donde no deberia |

---

## F. Tabla F - Nosotros vs Recycleye

| Funcionalidad Recycleye | Reciclean-Farex hoy | Estado |
|-------------------------|---------------------|--------|
| Vision por computador en cinta | NO | Brecha de dominio (hardware + IA especializada) |
| Clasificacion automatica 28 categorias | NO | Brecha alta |
| Analytics composicion tiempo real | NO | Brecha |
| Robotica separacion | NO | Brecha (CAPEX muy alto) |
| Clasificacion manual humana | SI (patio) | Status actual |
| Precios 65 SKUs multi-sucursal | SI | Ventaja nuestra |
| Uso de IA (Claude) | SI - alias, NLP sobre datos | Distinto dominio |

---

## G. Tabla G - Brecha e implementacion

| Capacidad | Dificultad | Esfuerzo | Dependencias | Comentario |
|-----------|------------|----------|--------------|-----------|
| Camara con vision IA basica (MVP 5 categorias) | 5 | 12-24 sem | GPU + modelo + dataset + camara | CAPEX 10-50k USD |
| Analytics composicion con camara existente | 4 | 8-12 sem | Usar Claude Vision API sobre fotos terreno | Camino viable bajo |
| Clasificacion 28 categorias como Recycleye | 5 | 1+ ano | Dataset propio + GPU + expertise ML | No factible en-house |
| Separacion robotica | 5 | N/A | CAPEX muy alto | Partner con proveedor |
| App con foto + Claude Vision para verificar material | 2 | 2-3 sem | Claude API ya integrado | Quick win |

**Camino pragmatico**: Usar Claude Vision API para analizar fotos tomadas en balanza y verificar clasificacion humana, sin hardware.

---

## H. Fuentes

- https://recycleye.com/
- https://recycleye.com/revamping-mrfs-with-recycling-robots-using-ai-and-computer-vision/
- https://recycleye.com/ai-and-waste-recognition-why-it-works-so-well/
- https://recycleye.com/cp-group-acquires-recycleye/
- https://resource-recycling.com/recycling/2026/04/14/cp-group-buys-recycleye-to-build-out-ai-driven-mrf-platform/
- https://www.letsrecycle.com/news/recycleye-acquired-by-us-recycling-equipment-firm/
