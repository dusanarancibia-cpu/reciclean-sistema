# Patrones de Busqueda - Investigacion Comparativas

> **Uso**: Registro vivo de los patrones, queries y fuentes que funcionan (o no) al investigar empresas de reciclaje y sus tecnologias. Se actualiza cada vez que Claude detecta un patron util.
> **Fecha inicio**: 2026-04-22
> **Responsable**: Claude Code (trabajando para Dusan / Pablo)

---

## Tabla 1 - Patrones de busqueda que funcionan

| # | Objetivo | Patron query | Fuente que responde mejor | Resultado esperado | Notas |
|---|----------|--------------|---------------------------|--------------------|----|
| 1 | Identificar que hace una empresa | `<empresa> servicios tecnologia <pais>` | Web corporativo + LinkedIn | Descripcion general + sector | Agregar pais para desambiguar |
| 2 | Modulos de un software | `<empresa> modulos <palabra-clave>` | Landing pages de producto | Lista de modulos / funcionalidades | Buscar pagina tipo "/productos" o "/features" |
| 3 | App movil y funciones | `<empresa> app movil <rol-usuario> caracteristicas` | App Store / Play Store | Pantallas, descripcion, requisitos OS | App Store descripcion es la mas completa |
| 4 | Tecnologia subyacente | `<empresa> stack tecnologico framework` | LinkedIn jobs / StackShare / GitHub | Lenguajes, cloud, frameworks | LinkedIn de desarrolladores revela stack |
| 5 | Integraciones | `<empresa> integra con <erp/contable>` | Blog corporativo / partners | API, webhooks, conectores | |
| 6 | Publico objetivo | `<empresa> clientes sector <rubro>` | Casos de exito, testimonios | Tipos de empresa y tamano | |
| 7 | Modelo comercial | `<empresa> precio plan suscripcion demo` | Pagina pricing | SaaS mensual/anual, modulos | Muchas no publican, buscar reseñas |
| 8 | Presencia en Chile | `<empresa> Chile sucursal implementacion` | LinkedIn + noticias | Si operan localmente | Diferencia clave vs intl |

---

## Tabla 2 - Fuentes de datos por prioridad

| Prioridad | Fuente | Que entrega | Cuando usar | Limitacion observada |
|-----------|--------|-------------|-------------|----------------------|
| 1 | Sitio web oficial via WebFetch | Datos fidedignos, modulos, pricing | Siempre primero | Muchos bloquean crawlers (403) |
| 2 | Google via WebSearch | Snippets + links | Cuando WebFetch falla | Puede dar version outdated |
| 3 | App Store / Play Store | Descripcion app, capturas, updates | Apps moviles, trazabilidad terreno | Requiere que la empresa tenga app |
| 4 | LinkedIn empresa | Tamano, ubicacion, posts | Validar escala y presencia | Requiere cuenta para ver todo |
| 5 | YouTube canal oficial | Demos, tutoriales, casos | Ver como luce la UI real | Agrega mucho tiempo |
| 6 | Repositorios tesis (dspace, scielo) | Analisis academico | Deep dive | Rara vez aplicable |
| 7 | Prensa especializada | Rondas de inversion, partnerships | Tamano del jugador | Sesgo de PR |

---

## Tabla 3 - Bloqueos detectados y workaround

| Dominio | Bloqueo | Workaround que funciono |
|---------|---------|--------------------------|
| `grinclic.com` | 403 Forbidden a WebFetch | WebSearch con snippets + deduccion desde App Store + LinkedIn |
| `apps.apple.com` | 403 a WebFetch | WebSearch `<app-name> app store` |
| `linkedin.com/company/*` | 403 a WebFetch | WebSearch `<empresa> LinkedIn sector tamano` |

---

## Tabla 4 - Criterios de deduccion cuando falta dato directo

> Si una busqueda no entrega el dato, se deduce desde evidencia indirecta y se marca como **(deducido)** en la ficha.

| Dato buscado | Evidencia indirecta valida | Confianza |
|--------------|-----------------------------|-----------|
| Stack frontend | Tecnologias en ofertas de empleo LinkedIn | Alta |
| Base de datos | Frases tipo "datos en tiempo real" + tamano → PostgreSQL/Supabase probable | Media |
| App hibrida vs nativa | URL esquema `io.cordova.*` o `com.ionic.*` en Play Store | Alta |
| Facturacion electronica | Pais + sector regulado → usan SII/DIAN/SUNAT oficial | Alta |
| Hosting | Dominio apunta a CloudFront/Vercel/Heroku segun DNS | Alta |
| Dashboards | Capturas en landing con graficos → probable Chart.js/Highcharts | Media |
| Chatbot | Widget visible en esquina → Intercom/Drift/Tidio/WhatsApp Business | Alta |
| Mapas | Fonts y tiles → Google Maps vs Mapbox vs Leaflet | Alta |

---

## Tabla 5 - Empresas investigadas (registro cronologico)

| Orden | Empresa | Pais | Categoria | Fecha investigacion | Ficha en carpeta |
|-------|---------|------|-----------|---------------------|------------------|
| 01 | Grinclic | Colombia | Software gestion residuos (SaaS) | 2026-04-22 | `01-grinclic/` |
| 02 | TriCiclos | Chile / LATAM | Operador + consultoria economia circular | 2026-04-22 | `02-triciclos/` |
| 03 | ReSimple | Chile | Sistema Colectivo REP (Ley REP) | 2026-04-22 | `03-resimple/` |
| 04 | Rubicon | USA | SaaS gestion residuos + marketplace | 2026-04-22 | `04-rubicon/` |
| 05 | Recycleye | UK | Vision por computador + IA en MRF | 2026-04-22 | `05-recycleye/` |
| 06 | AMP Robotics | USA | Robotica IA para clasificacion | 2026-04-22 | `06-amp-robotics/` |

---

## Tabla 6 - Dimensiones de analisis estandar (plantilla ficha)

> Toda ficha en `NN-empresa/` sigue este esquema para permitir la tabla ejecutiva final.

| Bloque | Campo | Formato |
|--------|-------|--------|
| A. Identidad | Empresa, pais, URL, ano fundacion, tamano | Texto corto |
| B. Que hacen | Propuesta valor, segmento cliente, modelo negocio | Parrafo + bullets |
| C. Como lo hacen | Procesos visibles, flujos, canales | Tabla pasos |
| D. Herramientas (stack) | Frontend, backend, BD, cloud, IA, hardware | Tabla |
| E. Herramientas de visualizacion | Dashboards, widgets, mapas, apps, chatbots | Tabla |
| F. Que tenemos nosotros | Equivalencia en Reciclean-Farex | Tabla comparada |
| G. Brecha e implementacion | Dificultad, esfuerzo, dependencias | Tabla con score 1-5 |
| H. Fuentes | URLs citadas | Lista |
