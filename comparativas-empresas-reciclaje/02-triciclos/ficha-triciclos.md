# Ficha Comparativa - TriCiclos

> **URL**: https://www.triciclos.cl
> **Pais**: Chile (opera LATAM - Brasil, Colombia, Mexico, Peru)
> **Fundacion**: 2009 (14+ anos)
> **Categoria**: Operador de Puntos Limpios + Consultoria economia circular + Software trazabilidad
> **Fecha analisis**: 2026-04-22
> **Estado fuentes**: WebSearch + Play Store + prensa chilena

---

## A. Identidad

| Campo | Valor |
|-------|-------|
| Empresa | TriCiclos S.A. (empresa B certificada) |
| Pais HQ | Chile |
| Impacto declarado | 1.000 ton/ano recuperadas; 50% gracias a la app |
| Clientes tipo | Ciudadano final + empresas de consumo masivo + municipios |
| Producto estrella | Red de Puntos Limpios + App Re + Software IR TriCiclos |

---

## B. Tabla B - Que hace TriCiclos

| Linea de producto | Funcion principal |
|-------------------|-------------------|
| Puntos Limpios | Estaciones fisicas que reciben decenas de tipos de residuos |
| App "Re - Economia Circular" | Ciudadano agenda visita, evalua reciclabilidad, localiza punto mas cercano |
| Software IR TriCiclos | Auditoria de reciclabilidad para marcas de consumo masivo |
| Consultoria economia circular | Diagnostico, estrategia y rediseno de envases |
| Trazabilidad 100% | Cada persona puede saber que paso con el residuo que deposito |

**Propuesta de valor**: Cerrar el ciclo con **confianza** - trazabilidad punto-a-destino y datos para las marcas.

---

## C. Tabla C - Como lo hacen (flujo operativo)

| Paso | Actor | Herramienta | Salida |
|------|-------|-------------|--------|
| 1. Ciudadano revisa que reciclar | Usuario | App Re (catalogo + foto producto) | Confirmacion reciclabilidad |
| 2. Agendar visita | Usuario | App Re | Turno en punto limpio |
| 3. Entrega en punto limpio | Usuario + operario TriCiclos | Balanza + terminal operario | Registro de peso por material |
| 4. Consolidacion | TriCiclos | Software trazabilidad | Lote trazable |
| 5. Envio a reciclador | TriCiclos | Software trazabilidad + transporte | Guia con destino |
| 6. Reporte al ciudadano | Ciudadano | App Re | Historial personal "mi huella" |
| 7. Reporte a marca | Marca cliente | Software IR / BI | Tasa de reciclabilidad de sus envases |

---

## D. Tabla D - Herramientas y tecnologias

| Capa | Tecnologia (confirmada / **deducida**) | Evidencia |
|------|----------------------------------------|-----------|
| App movil ciudadana | Nativa Android/iOS, nombre `com.Triciclos.ReApp` | Play Store |
| Framework app | **React Native o Flutter (deducido)** | Estilo moderno + multi-OS rapido |
| Mapas | **Google Maps API (deducido)** | Integracion con Waze/Google Maps |
| Backend | **API REST custom (deducido)** | Sin stack publico revelado |
| Software IR TriCiclos | Plataforma web SaaS B2B | Prensa 2019 |
| BI / reporteria | **Looker / Power BI (deducido)** | Tamano B2B con clientes consumo masivo |
| Balanzas | Integracion probable con basculas certificadas | Operacion de punto limpio |
| Trazabilidad | Sistema propio de lotes con geolocalizacion | Declarado 100% trazable |

---

## E. Tabla E - Como se ve la informacion

| Elemento UI | Como lo presentan | Herramienta probable |
|-------------|-------------------|----------------------|
| Mapa de puntos limpios | Mapa en app + web con filtros | Google Maps SDK |
| Ficha de producto/envase | Foto + desglose material + icono reciclable | CMS propio |
| Historial personal | Gamificacion "toneladas salvadas" | React Native con charts |
| Dashboard marca | KPI de reciclabilidad por SKU | BI embebido |
| Blog y contenido | Sitio WordPress (triciclos.cl) | WordPress (confirmado por URL `?page_id=776`) |

---

## F. Tabla F - Nosotros vs TriCiclos

| Funcionalidad TriCiclos | Reciclean-Farex hoy | Estado |
|-------------------------|---------------------|--------|
| App ciudadana con mapa | NO | Brecha media |
| Trazabilidad 100% | NO | Brecha alta |
| Red de puntos limpios | NO (nuestro modelo es B2B comprador, no punto limpio) | N/A modelo distinto |
| Software de reciclabilidad para marcas | NO | Brecha |
| Dashboard para cliente B2B | NO | Brecha |
| Catalogo publico con calculadora | Widget de precios publicos | Ventaja nuestra (precio en tiempo real) |
| Multi-sucursal con precios dinamicos | SI | Ventaja nuestra |
| Integracion Claude IA | SI (alias, correcciones) | Ventaja nuestra |

---

## G. Tabla G - Brecha e implementacion

| Capacidad | Dificultad | Esfuerzo | Dependencias | Comentario |
|-----------|------------|----------|--------------|------------|
| App ciudadana con mapa de sucursales | 2 | 2-3 sem | Extender PWA + Google Maps | Factible rapido |
| Historial "mi huella" | 3 | 3-4 sem | Auth ciudadano + tabla `depositos` | Requiere registro cliente |
| Trazabilidad lote a lote | 4 | 5-8 sem | Tabla `lotes`, `movimientos`, `destinos` + QR | Alto valor regulatorio |
| Dashboard cliente B2B | 3 | 3-5 sem | RLS Supabase + vistas agregadas | |
| Modelo operativo puntos limpios | 5 | N/A | Cambio de modelo negocio | No aplica directo |

---

## H. Fuentes

- https://www.triciclos.cl
- https://play.google.com/store/apps/details?id=com.Triciclos.ReApp
- https://apps.apple.com/ve/developer/triciclos-s-a/id1529547695
- https://www.paiscircular.cl/industria/triciclos-anuncia-lanzamiento-de-software-que-ayuda-a-perfeccionar-la-reciclabilidad-de-los-productos-de-consumo-masivo/
- https://www.latercera.com/piensa-digital/noticia/las-innovadoras-tecnologias-que-se-estan-utilizando-para-fomentar-el-reciclaje/
- https://emmamobility.cl/blog/puntos-limpios-de-triciclos-que-estan-funcionando/
