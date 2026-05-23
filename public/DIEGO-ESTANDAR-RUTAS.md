# DIEGO v9 — Estándar Mundial 2025-2026: Rutas y Navegación para Flota de Retiro

> **Documento técnico-estratégico**
> Investigación de estándares globales 2025-2026 aplicada al chatbot Diego (Reciclean-Farex Chile)
> **Estado actual:** Diego v8 ACTIVE · Backend Supabase EF `diego-chat-process`
> **Habilitador presente:** EF `google-maps-distance` v3 ACTIVE con `GOOGLE_MAPS_API_KEY` configurada
> **Sucursales operativas:** Cerrillos, Maipú, Talca (Pto Montt bloqueada SEREMI)
> **Fecha:** mayo 2026

---

## TL;DR — Resumen Ejecutivo en 5 puntos

1. **El estándar 2025-2026 para cálculo multi-parada NO es "Distance Matrix + lógica propia"**. Es **Google Routes API v2 (`computeRoutes` con `optimizeWaypointOrder=true`)** para hasta 25 paradas (con place IDs) o 98 (sólo coordenadas), o **Google Route Optimization API** (VRP solver) cuando hay múltiples camiones / ventanas horarias / capacidades. Diego v8 hoy sólo hace tiempo punto-a-punto. **Brecha crítica.**

2. **Ya no se pide ruta a un chatbot, se conversa con él**. El estándar es: el dispatcher escribe en lenguaje natural ("retiro Pincore en Maipú a las 10, luego HUAL Cerrillos") → el bot extrae direcciones, geocodifica, valida, optimiza, devuelve secuencia + ETA + link a Maps. **Onfleet, Routific y Circuit for Teams** son los benchmarks operativos; Diego debe igualar su capacidad de planificación pero con costo cero porque vive sobre infraestructura propia (Supabase + Google Maps directo).

3. **Verificación de direcciones es obligatoria en Chile**. Las direcciones de generadores valorizadores chilenos tienen ambigüedades severas (numeración no oficial, comunas con nombres repetidos, calles homónimas). El estándar es **Google Address Validation API** (ahora soporta Chile) o **fallback con `match_code` + `confidence` de Mapbox Geocoding v6**. Diego v8 hoy no valida — confía en lo que le tipean. **Riesgo de despachar camión a dirección inexistente.**

4. **Restricción vehicular Santiago 2026 obliga a lógica de filtrado por patente**. Período activo 4-mayo al 31-agosto, 07:30-21:00 lun-vie. Vehículos de carga sin sello verde restringidos por dígitos 2-3-4-5 (rotativo) y **prohibidos dentro del anillo Américo Vespucio**. Cualquier optimización de ruta que ignore esto manda al camión a una multa de ~$100.000 CLP. **Diego debe consultar tabla `panel.restriccion_vehicular` antes de despachar.**

5. **Patrón arquitectónico recomendado**: `diego-chat-process` (orquestador conversacional) → llama vía `fetch` interno a `google-maps-distance` v3 (ya activa) y a una nueva EF `route-optimize` (a crear) → ambas consultan cache en `panel.maps_cache` (TTL 24h por ruta) → si miss, llaman Google Maps Routes API. Esto reduce 60-80% el costo de API ($5 USD / 1000 calls Compute Routes Essentials, sube a Pro con optimización).

---

## Tabla de contenidos

1. [Cálculo de ruta multi-parada (TSP/VRP)](#1-cálculo-de-ruta-multi-parada-tspvrp)
2. [Optimización ruta diaria del equipo](#2-optimización-ruta-diaria-del-equipo)
3. [Verificación coherencia de direcciones](#3-verificación-coherencia-de-direcciones)
4. [Integración Google Maps + Supabase Edge Function](#4-integración-google-maps--supabase-edge-function)
5. [Sugerencia de mejor ruta según horario](#5-sugerencia-de-mejor-ruta-según-horario)
6. [Spec técnica tool `calcular_ruta_eficiente`](#6-spec-técnica-tool-calcular_ruta_eficiente)
7. [Spec técnica tool `verificar_direccion`](#7-spec-técnica-tool-verificar_direccion)
8. [Brechas Diego v8 vs estándar 2025-2026](#8-brechas-diego-v8-vs-estándar-2025-2026)
9. [Fuentes citadas](#9-fuentes-citadas)

---

## 1. Cálculo de ruta multi-parada (TSP/VRP)

### 1.1 Diferencia entre Distance Matrix y Routes Optimize

La confusión más común — y la que tiene atrapada a Diego v8 — es pensar que **Distance Matrix** y **Route Optimization** son lo mismo. No lo son.

| Aspecto | Distance Matrix (legacy) / Compute Route Matrix | Routes API `computeRoutes` con optimización | Route Optimization API (VRP solver) |
|---|---|---|---|
| **Para qué sirve** | Devuelve tiempos/distancias entre N orígenes × M destinos en formato matriz | Calcula UNA ruta óptima visitando N paradas en orden ideal | Asigna N tareas a M vehículos con restricciones complejas |
| **Algoritmo** | No optimiza — sólo calcula par a par | TSP (Traveling Salesman) simple en backend | VRP / CVRPTW (Capacitated VRP with Time Windows) |
| **Límite de paradas** | Hasta 25×25 elementos típicos | 25 waypoints con place IDs, 98 con sólo lat/lng | Miles de tareas en una sola request |
| **Capacidad de camión** | No considerada | No considerada | Sí (load demands + capacity limits) |
| **Ventanas horarias** | No | No (sólo `departureTime`) | Sí (time windows por shipment) |
| **Múltiples vehículos** | No | No (un solo recorrido) | Sí (heterogenous fleet) |
| **Billing 2026** | $5/1000 calls (Essentials) | **Compute Routes Pro** (más caro, con optimización) | Tier Enterprise (cap free 1.000/mes) |
| **Cuándo usar en Reciclean** | Pre-cálculo para cachear distancias sucursal → cliente | Ruta diaria de 1 camión con 5-15 paradas | Si algún día Reciclean tiene 3+ camiones simultáneos |

**Veredicto para Diego v9:**
Hoy Reciclean opera con un camión por sucursal (Cerrillos, Maipú, Talca). El estándar correcto es **`computeRoutes` con `optimizeWaypointOrder=true`**. Saltar a Route Optimization API (VRP) sería sobre-ingeniería hasta que aparezca el 3er camión simultáneo.

### 1.2 Cómo funciona `computeRoutes` con optimización

El endpoint es `POST https://routes.googleapis.com/directions/v2:computeRoutes`. Request mínima:

```json
{
  "origin":      { "address": "Sucursal Reciclean Cerrillos, Camino a Lonquén 9001" },
  "destination": { "address": "Sucursal Reciclean Cerrillos, Camino a Lonquén 9001" },
  "intermediates": [
    { "address": "Pincore, Av. El Salto 4001, Maipú" },
    { "address": "HUAL, Av. Pdte. Salvador Allende 1500, Cerrillos" },
    { "address": "Cliente C, El Olivo 220, Quilicura" },
    { "address": "Cliente D, Vicuña Mackenna 7300, La Florida" }
  ],
  "travelMode": "DRIVE",
  "routingPreference": "TRAFFIC_AWARE",
  "optimizeWaypointOrder": true,
  "departureTime": "2026-05-23T13:00:00Z"
}
```

Headers obligatorios:

```
Content-Type: application/json
X-Goog-Api-Key: <GOOGLE_MAPS_API_KEY>
X-Goog-FieldMask: routes.optimizedIntermediateWaypointIndex,routes.duration,routes.distanceMeters,routes.legs.duration,routes.polyline.encodedPolyline
X-Server-Timeout: 10
```

Respuesta clave:

```json
{
  "routes": [{
    "distanceMeters": 87420,
    "duration": "5840s",
    "optimizedIntermediateWaypointIndex": [2, 0, 3, 1],
    "legs": [...],
    "polyline": { "encodedPolyline": "..." }
  }]
}
```

`optimizedIntermediateWaypointIndex: [2, 0, 3, 1]` significa: ir primero a `intermediates[2]` (Quilicura), luego `intermediates[0]` (Pincore), `intermediates[3]` (La Florida), `intermediates[1]` (HUAL Cerrillos).

**Reglas no negociables del API:**
- Ningún waypoint puede ser `type: "via"` — todos deben ser `stopover` (default).
- No usar `routingPreference: "TRAFFIC_AWARE_OPTIMAL"` con `optimizeWaypointOrder` (incompatible).
- Field mask es obligatorio en Routes API (a diferencia del Directions legacy).
- `X-Server-Timeout: 10` recomendado por Google porque la optimización demora más que un cálculo simple.

### 1.3 Alternativas evaluadas (no recomendadas hoy)

**Mapbox Optimization v2** — soporta time windows, vehicle capacity, pickup/dropoff. API asíncrona (POST → recibí `id` → GET status). Buena para problemas grandes pero **cobertura de mapas en Chile inferior a Google**, y Reciclean ya tiene clave Google activa. Sin razón para cambiar.

**HERE Tour Planning** — el más potente del mercado para flotas heterogéneas (fleets mixtas con distintos tipos de camión). Permite multi-depot, pickup-and-delivery, time windows duros. **Sobredimensionado para Reciclean hoy** (3 sucursales, 1 camión c/u). Tener en backlog para 2027 si la operación crece.

**Google OR-Tools** — librería open-source en Python/C++ para resolver VRP/CVRPTW localmente. Cero costo de API pero requiere infraestructura propia para correr el solver. **Útil si en algún momento Reciclean quiere hacer simulaciones masivas offline** (ej. "qué pasa si abro 4ta sucursal en Rancagua"). No para producción conversacional con Diego.

### 1.4 Recomendación para Diego v9

Empezar con **Routes API `computeRoutes` + `optimizeWaypointOrder=true`** llamado desde una nueva EF `route-optimize`. Cache resultados 24h por hash (origen + destino + intermediates ordenados). Si en 12 meses aparece necesidad de planificar 2+ camiones simultáneamente desde Cerrillos, migrar la EF a Route Optimization API.

---

## 2. Optimización ruta diaria del equipo

### 2.1 El benchmark: Routific, Onfleet, Circuit for Teams

Tres plataformas comerciales dominan el segmento "fleet de retiro chico-mediano" 2025-2026. Lo relevante para Diego no es competir con ellas — es **igualar las capacidades que el dispatcher de Reciclean esperaría tener**.

| Plataforma | Fortaleza | Pricing | Aplicabilidad a Reciclean |
|---|---|---|---|
| **Routific** | Mejor algoritmo de optimización del segmento, AI propietaria | Free hasta 100 órdenes/mes, $150/mes hasta 1.000, escala a $0.03/orden sobre 20.000 | Standard a igualar para ruta diaria de la flota |
| **Onfleet** | Mejor en dispatch on-demand + tracking driver en vivo + proof of delivery | $599/mes Launch (2.500 tasks), escala a $2.999+/mes Enterprise | Caro. Mejor que sus features (POD, ETA al cliente) los replique Diego |
| **Circuit for Teams** | Mejor multi-depot — un dispatcher gestiona Cerrillos+Maipú+Talca en un panel | 20% reducción costos según casos de uso publicados | El caso de uso más parecido a Reciclean (multi-depot) |

### 2.2 Capacidades estándar 2025-2026 que un sistema debe tener

Combinando lo común a los 3 benchmarks:

1. **Ingestar N paradas** con: dirección, ventana horaria, duración estimada del retiro (carga ≠ descarga), volumen/peso esperado, prioridad (1-5), nota interna.
2. **Asignar a vehículo correcto** según capacidad y compatibilidad (ej. residuo peligroso solo en camión X).
3. **Devolver secuencia óptima** + ETA por parada + distancia total + duración total + share-link a Google Maps con la ruta cargada.
4. **Re-optimizar en caliente** si surge una parada urgente a mitad del día.
5. **Notificar al cliente** ("tu retiro Pincore llega entre 10:15 y 10:45") — Onfleet lo hace por SMS, Diego puede hacerlo por WhatsApp vía la integración existente.
6. **Cerrar ruta con evidencia** (foto del residuo retirado, firma del valorizador, geo-stamp).

### 2.3 Caso real con clientes Reciclean

**Escenario típico** (lunes RM Santiago):
- Salida 08:30 desde Sucursal Cerrillos (Camino a Lonquén 9001).
- Retiros pendientes:
  - **Pincore** — Av. El Salto 4001, Maipú — ventana 09:00-12:00 — 1 carga (~800 kg cartón).
  - **HUAL** — Av. Pdte. Salvador Allende 1500, Cerrillos — ventana 10:00-13:00 — 1 carga (~600 kg chatarra).
  - **Cliente C** — El Olivo 220, Quilicura — ventana 11:00-15:00 — 1 carga (~400 kg PET).
  - **Cliente D** — Vicuña Mackenna 7300, La Florida — ventana 14:00-17:00 — 1 carga (~200 kg vidrio).
- Regreso a Cerrillos antes de 18:30 para descarga.

**Diego v8 hoy** responde: "El tiempo de Cerrillos a Maipú es 22 min. Cerrillos a La Florida es 48 min." — datos sueltos sin secuencia.

**Diego v9 debería responder**:
> Ruta optimizada para 23-may-2026 desde Cerrillos:
> 1. **09:10** HUAL (Cerrillos) — 12 min
> 2. **10:05** Pincore (Maipú) — 25 min con tráfico actual
> 3. **11:30** Quilicura (Cliente C) — 38 min
> 4. **13:45** La Florida (Cliente D) — 41 min
> 5. **15:30** Regreso Cerrillos — 38 min
>
> Total: 154 km · 5h 20min en ruta · combustible estimado $32.000.
> Patente camión RJ-22-XY no tiene restricción hoy (lunes, dígito 2 restringe).
> Link Google Maps: [abrir ruta](https://goo.gl/maps/...)

Eso es el estándar. Y se construye con `computeRoutes` + `optimizeWaypointOrder` + cache + tabla `restriccion_vehicular`.

### 2.4 KPI a medir post-implementación

| KPI | Baseline Diego v8 (estimado) | Target Diego v9 |
|---|---|---|
| Tiempo dispatcher arma ruta del día | 15-30 min manual | < 30 segundos |
| % rutas con error de orden (vuelta innecesaria) | ~20% | < 5% |
| Combustible mensual por camión | $X | -15% (referencia Casella Waste: -21% miles) |
| Retiros completados en ventana horaria | ~75% | > 90% |
| Multas por restricción vehicular | 1-2 al año | 0 |

---

## 3. Verificación coherencia de direcciones

### 3.1 Por qué importa en Chile

Las direcciones que tipean clientes y comerciales en formularios Reciclean tienen tres patologías frecuentes:

1. **Numeración inexistente** — "Av. Providencia 9999" cuando la calle llega hasta el 2500.
2. **Comuna ambigua** — "Av. Las Condes" existe en Las Condes, Vitacura, Lo Barnechea con numeraciones distintas.
3. **Calles homónimas** — "O'Higgins" hay en 80% de las comunas de Chile.

Mandar un camión a una dirección no validada cuesta: combustible perdido + tiempo del chofer + cliente cabreado + reagendamiento. **El estándar 2025-2026 es validar antes de aceptar la dirección en la base.**

### 3.2 Google Geocoding API (entry-level)

Llamada simple:

```
GET https://maps.googleapis.com/maps/api/geocode/json?
    address=Av+El+Salto+4001+Maipu+Chile&
    key=GOOGLE_MAPS_API_KEY
```

Respuesta clave:

```json
{
  "results": [{
    "formatted_address": "Av. El Salto 4001, Maipú, Región Metropolitana, Chile",
    "geometry": {
      "location": { "lat": -33.5061, "lng": -70.7531 },
      "location_type": "ROOFTOP"
    },
    "place_id": "ChIJ...",
    "types": ["street_address"]
  }],
  "status": "OK"
}
```

**Niveles de precisión `location_type`** (de mejor a peor):

| Nivel | Significado | Acción recomendada |
|---|---|---|
| `ROOFTOP` | Direcciones exactas, coordenada del techo | Aceptar |
| `RANGE_INTERPOLATED` | Interpolada entre 2 puntos conocidos | Aceptar con flag warning |
| `GEOMETRIC_CENTER` | Centro geométrico (calle, no número) | Pedir confirmación |
| `APPROXIMATE` | Comuna o región | **Rechazar** y pedir nueva dirección |

Diego v9 debería **rechazar todo `APPROXIMATE`** y pedir más datos al usuario.

### 3.3 Google Address Validation API (premium)

Mucho más potente. Endpoint `POST https://addressvalidation.googleapis.com/v1:validateAddress`. Soporta Chile desde 2024 (residential/commercial metadata).

Respuesta incluye:
- `verdict.addressComplete: true|false` — ¿la dirección tiene todos los componentes?
- `verdict.hasUnconfirmedComponents` — ¿hay alguna parte que Google no pudo confirmar?
- `verdict.hasInferredComponents` — ¿Google adivinó algo (ej. completó "Av." faltante)?
- `address.addressComponents[].confirmationLevel` — confirmado por componente.

**Pricing 2026**: $17 USD / 1.000 calls (Address Validation Pro), free cap 5.000/mes. Para Reciclean — que probablemente valida 50-150 direcciones nuevas al mes — el costo es cero.

Recomendación: usar **Address Validation API solo en el alta de un cliente nuevo** (no en cada consulta de Diego), persistir el resultado en `crm.cliente.direccion_validada_at` + `direccion_lat` + `direccion_lng` + `direccion_match_code`, y reusar en todas las rutas posteriores. Re-validar si el cliente reporta error.

### 3.4 Mapbox Geocoding v6 (alternativa para fallback)

Mapbox v6 introdujo `match_code` y `confidence` (0-1) que son más granulares que Google. **Pero**: cobertura Chile es inferior a Google (los benchmarks 2025 muestran que Mapbox es óptimo en US/EU/Japón). No vale la pena agregar como dependencia si Google ya está activo.

### 3.5 Geocoding inverso (lat/lng → dirección)

Necesario cuando el chofer reporta "estoy aquí" con GPS pero no sabe la dirección oficial. O cuando un cliente comparte ubicación por WhatsApp en lugar de tipear dirección.

```
GET https://maps.googleapis.com/maps/api/geocode/json?
    latlng=-33.5061,-70.7531&
    key=GOOGLE_MAPS_API_KEY&
    result_type=street_address
```

Reverse geocoding **siempre devuelve múltiples resultados** de menor a mayor granularidad (street_address → neighborhood → locality → administrative_area). Tomar el primer `street_address`.

### 3.6 Detección de duplicados

Antes de validar una dirección nueva, Diego v9 debe consultar:

```sql
SELECT id, nombre, direccion, direccion_lat, direccion_lng
FROM curated.clientes
WHERE
  ST_DWithin(
    geography(ST_MakePoint(direccion_lng, direccion_lat)),
    geography(ST_MakePoint($1, $2)),
    50  -- metros
  )
LIMIT 5;
```

Si hay un cliente a < 50m con nombre similar (fuzzy match con `similarity()` de `pg_trgm`), **alerta de probable duplicado** y pide confirmación al dispatcher.

---

## 4. Integración Google Maps + Supabase Edge Function

### 4.1 Arquitectura actual + propuesta

**Hoy (Diego v8)**:
```
WhatsApp/Web → diego-chat-process (EF) → Claude API
                       ↓
                  google-maps-distance v3 (EF) ←  Llamada eventual
                       ↓
              Google Maps Distance Matrix API
```

**Propuesta Diego v9**:
```
WhatsApp/Web → diego-chat-process (EF) → Claude API + Tool calls
                       ↓
       ┌───────────────┼─────────────────────┐
       ↓               ↓                     ↓
google-maps-distance  route-optimize    verify-address
   (v3, EXISTE)        (NUEVA)           (NUEVA)
       ↓               ↓                     ↓
       └───────→ panel.maps_cache ←──────────┘
                       ↓ (miss)
              Google Maps Platform APIs
              (Routes / Geocoding / Address Validation)
```

### 4.2 Cache en Postgres — diseño de tabla

```sql
CREATE TABLE panel.maps_cache (
  cache_key       TEXT PRIMARY KEY,           -- hash(tipo + params)
  cache_type      TEXT NOT NULL,              -- 'distance' | 'route' | 'geocode' | 'validate'
  request_params  JSONB NOT NULL,
  response_body   JSONB NOT NULL,
  hit_count       INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  CHECK (expires_at > created_at)
);

CREATE INDEX idx_maps_cache_expires ON panel.maps_cache(expires_at);
CREATE INDEX idx_maps_cache_type ON panel.maps_cache(cache_type);

-- TTL por tipo
COMMENT ON TABLE panel.maps_cache IS
  'TTL recomendado: distance=24h, route=2h (depende tráfico), geocode=180d, validate=365d';
```

### 4.3 Patrón Deno típico para Edge Function

Estructura mínima de `route-optimize/index.ts`:

```typescript
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  const { origin, destination, stops, departure_time } = await req.json();

  // 1. Build cache key
  const cacheKey = await hashRoute(origin, destination, stops, departure_time);

  // 2. Check cache
  const { data: cached } = await supabase
    .from("maps_cache")
    .select("response_body, expires_at")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (cached) {
    await supabase.rpc("increment_cache_hit", { p_key: cacheKey });
    return new Response(JSON.stringify(cached.response_body), { status: 200 });
  }

  // 3. Cache miss → call Google
  const googleRes = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask": "routes.optimizedIntermediateWaypointIndex,routes.duration,routes.distanceMeters,routes.legs,routes.polyline.encodedPolyline",
        "X-Server-Timeout": "10",
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        intermediates: stops.map((s: string) => ({ address: s })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        optimizeWaypointOrder: true,
        departureTime: departure_time,
      }),
    }
  );

  const body = await googleRes.json();

  // 4. Write cache
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h
  await supabase.from("maps_cache").insert({
    cache_key: cacheKey,
    cache_type: "route",
    request_params: { origin, destination, stops, departure_time },
    response_body: body,
    expires_at: expires.toISOString(),
  });

  return new Response(JSON.stringify(body), { status: 200 });
});

async function hashRoute(...args: unknown[]): Promise<string> {
  const str = JSON.stringify(args);
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
```

### 4.4 Llamada interna desde `diego-chat-process`

Cuando Claude (dentro de `diego-chat-process`) decide invocar el tool `calcular_ruta_eficiente`, el handler hace:

```typescript
async function callRouteOptimize(params: RouteParams) {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/route-optimize`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );
  return await res.json();
}
```

EF llamando EF — patrón soportado oficialmente, pero **OJO**: cada hop consume cuota de invocaciones Supabase. Para reducir latencia y cuota, considerar mover la lógica a un módulo TS compartido (`_shared/routes.ts`) que ambas EFs importen, pero esto sólo aplica si no querés la separación arquitectónica.

### 4.5 Costos estimados Reciclean (proyección 12 meses)

Asumiendo: 3 sucursales × 5 rutas/día × 22 días/mes = 330 rutas/mes que requieren optimización.

| API | Calls/mes | Free cap | Calls facturados | Costo USD/mes |
|---|---|---|---|---|
| Compute Routes Pro (con optimización) | 330 | 5.000 | 0 | $0 |
| Compute Route Matrix Essentials (pre-cálculo) | ~500 | 10.000 | 0 | $0 |
| Geocoding (validación direcciones nuevas) | ~150 | 10.000 | 0 | $0 |
| Address Validation Pro | ~50 | 5.000 | 0 | $0 |
| **Total proyectado** | | | | **$0 USD/mes** |

Con cache 60% hit rate (conservador), los números bajan a 132 calls/mes para Routes. **Estamos cómodos dentro del free tier durante todo 2026.** El primer alerta de billing aparece sólo si Reciclean escala a 6+ camiones simultáneos.

---

## 5. Sugerencia de mejor ruta según horario

### 5.1 Tráfico en tiempo real con `trafficModel`

Routes API soporta 3 modelos de tráfico (solo con `routingPreference: TRAFFIC_AWARE_OPTIMAL`):

| Modelo | Comportamiento | Cuándo usarlo en Reciclean |
|---|---|---|
| `BEST_GUESS` (default) | Mezcla histórico + live, balance | **Default para todas las rutas** |
| `PESSIMISTIC` | Asume días de mal tráfico | Lluvia + viernes tarde + retiros con multa por atraso |
| `OPTIMISTIC` | Asume tráfico fluido | Estimaciones de costo para cotización inicial (no operativas) |

**Restricción importante**: `trafficModel` solo funciona si seteás `routingPreference: TRAFFIC_AWARE_OPTIMAL`, **que es incompatible con `optimizeWaypointOrder: true`**. Solución: hacer la optimización primero con `TRAFFIC_AWARE` (no optimal), y luego un segundo call con el orden ya fijado pidiendo `TRAFFIC_AWARE_OPTIMAL + PESSIMISTIC` para ETAs realistas.

### 5.2 Hora pico Santiago — heurística operativa

Santiago tiene 2 picos durísimos en RM:

- **07:00 - 09:30** (mañana, entrada al trabajo)
- **17:30 - 20:30** (tarde, salida)
- **Adicional**: 12:30-14:00 (almuerzo, suave pero notable en ejes principales).

Recomendación para Diego v9: **agregar 25% al tiempo `BEST_GUESS`** si el `departureTime` o `arrivalTime` cae dentro de pico. Esto es heurística — Google ya lo refleja en `BEST_GUESS`, pero es una capa adicional de seguridad para ventanas horarias estrechas.

### 5.3 Restricción vehicular 2026 — lógica obligatoria

**Período**: 4-mayo-2026 → 31-agosto-2026 (4 meses).
**Días/horas**: lunes a viernes, 07:30 → 21:00 (excepto festivos).
**Zona**: Provincia de Santiago + San Bernardo + Puente Alto.
**Camiones sin sello verde**: restricción por último dígito patente según día (rotativo 2-3-4-5).
**Anillo Américo Vespucio**: vehículos sin sello verde **prohibidos siempre** (no rotativo).

Tabla nueva en Supabase:

```sql
CREATE TABLE panel.flota_vehiculos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patente         TEXT UNIQUE NOT NULL,
  sucursal_base   TEXT NOT NULL,           -- 'cerrillos' | 'maipu' | 'talca'
  tiene_sello_verde BOOLEAN NOT NULL,
  ultimo_digito   INT GENERATED ALWAYS AS (
                    (regexp_replace(patente, '[^0-9]', '', 'g'))::TEXT
                    -- tomar último char numérico
                  ) STORED,
  -- ... otros campos
);

CREATE TABLE panel.restriccion_vehicular_calendario (
  fecha           DATE PRIMARY KEY,
  digitos_restringidos INT[] NOT NULL,     -- {2,3,4} = patente termina en 2,3 o 4
  es_preemergencia BOOLEAN DEFAULT FALSE,
  fuente          TEXT DEFAULT 'mtt.gob.cl'
);
```

Función helper:

```sql
CREATE OR REPLACE FUNCTION panel.camion_puede_circular(
  p_patente TEXT,
  p_fecha   DATE,
  p_dentro_anillo BOOLEAN DEFAULT FALSE
) RETURNS BOOLEAN AS $$
DECLARE
  v_sello_verde BOOLEAN;
  v_ultimo INT;
  v_restringidos INT[];
BEGIN
  -- Si fecha fuera del período 4-may → 31-ago, libre
  IF p_fecha NOT BETWEEN '2026-05-04' AND '2026-08-31' THEN
    RETURN TRUE;
  END IF;

  SELECT tiene_sello_verde, ultimo_digito::INT
    INTO v_sello_verde, v_ultimo
  FROM panel.flota_vehiculos WHERE patente = p_patente;

  IF v_sello_verde THEN RETURN TRUE; END IF;

  -- Sin sello verde + dentro de Vespucio → SIEMPRE restringido
  IF p_dentro_anillo THEN RETURN FALSE; END IF;

  SELECT digitos_restringidos INTO v_restringidos
  FROM panel.restriccion_vehicular_calendario WHERE fecha = p_fecha;

  RETURN NOT (v_ultimo = ANY(v_restringidos));
END;
$$ LANGUAGE plpgsql STABLE;
```

Diego v9 debe llamar a `camion_puede_circular()` **antes** de devolver la ruta. Si la respuesta es `FALSE`, alertar al dispatcher: "Atención: patente RJ-22-XY tiene restricción hoy. Sugerencias: (a) usar camión RK-44-AB de la sucursal Maipú, (b) reagendar paradas a fin de semana, (c) si el cliente está fuera de Vespucio y dígito permite, reagendar antes de 07:30 o después de 21:00."

### 5.4 `departureTime` vs `arrivalTime`

Routes API permite ambos:
- `departureTime`: "salgo a las X, dame ruta y ETA".
- `arrivalTime`: "necesito llegar a las X, dime a qué hora salir" (sólo para transit, no driving).

Para Reciclean usar **siempre `departureTime`**. Si el cliente exige llegar 10:00 exacto, Diego debe **calcular hacia atrás manualmente**: pide ruta con `departureTime` = ahora, ve `duration`, resta de 10:00 → da hora de salida.

---

## 6. Spec técnica tool `calcular_ruta_eficiente`

Tool que Diego v9 puede invocar via Claude API tool calling. Esta sección es para Pablo (PC Pablo) cuando implemente la EF.

### 6.1 Definición del tool (para tools array de Anthropic Messages API)

```json
{
  "name": "calcular_ruta_eficiente",
  "description": "Calcula la ruta óptima multi-parada para un camión Reciclean considerando tráfico, restricción vehicular Santiago, y ventanas horarias. Devuelve secuencia ordenada, ETAs, distancia total, alertas. Usar cuando el dispatcher solicite planificar la jornada de un camión o consulte 'mejor ruta para X paradas'.",
  "input_schema": {
    "type": "object",
    "required": ["origen", "destino", "paradas", "fecha_salida"],
    "properties": {
      "origen": {
        "type": "string",
        "description": "Dirección de salida. Por defecto sucursal Reciclean. Ej: 'Sucursal Cerrillos'"
      },
      "destino": {
        "type": "string",
        "description": "Dirección de regreso. Generalmente igual a origen para rutas de retiro."
      },
      "paradas": {
        "type": "array",
        "minItems": 1,
        "maxItems": 23,
        "items": {
          "type": "object",
          "required": ["direccion"],
          "properties": {
            "direccion": { "type": "string" },
            "cliente_id": { "type": "string", "description": "UUID del cliente si existe" },
            "ventana_inicio": { "type": "string", "format": "time", "description": "HH:MM hora local Chile" },
            "ventana_fin": { "type": "string", "format": "time" },
            "duracion_minutos": { "type": "integer", "default": 20, "description": "Tiempo de carga estimado en parada" },
            "prioridad": { "type": "integer", "minimum": 1, "maximum": 5, "default": 3 }
          }
        }
      },
      "fecha_salida": {
        "type": "string",
        "format": "date-time",
        "description": "ISO 8601 con timezone, ej: '2026-05-23T08:30:00-04:00'"
      },
      "patente_camion": {
        "type": "string",
        "description": "Patente del camión asignado. Diego validará restricción vehicular."
      },
      "modelo_trafico": {
        "type": "string",
        "enum": ["best_guess", "pessimistic", "optimistic"],
        "default": "best_guess"
      }
    }
  }
}
```

### 6.2 Flow interno (lo que ejecuta `diego-chat-process`)

```
1. Recibir tool_use de Claude con params.
2. Validar params (todos los campos required presentes).
3. Para cada parada:
   a. Si `cliente_id` provisto → leer `curated.clientes.direccion_lat/lng` (ya validada).
   b. Si solo `direccion` provista → llamar `verify-address` EF primero.
   c. Si validación falla → devolver error al Claude para que pida aclaración al usuario.
4. Si `patente_camion` provisto:
   a. Llamar `panel.camion_puede_circular(patente, fecha, dentro_anillo=TRUE)`.
   b. Si FALSE → preparar alerta + sugerencias alternativas.
5. Llamar EF `route-optimize` con body:
   {
     "origin": <dirección origen>,
     "destination": <dirección destino>,
     "stops": [<direcciones validadas en orden de input>],
     "departure_time": <ISO>,
     "traffic_model": "best_guess"
   }
6. La EF `route-optimize` hace cache check + llamada Google Routes API.
7. Recibir `optimizedIntermediateWaypointIndex` + `duration` + `distanceMeters` + `legs[]`.
8. Reordenar paradas según índice optimizado.
9. Calcular ETA por parada acumulando legs[].duration + duracion_minutos de cada parada.
10. Validar ventanas horarias contra ETAs:
    - Si alguna parada queda fuera de ventana → flag warning con sugerencia (reordenar manualmente / contactar cliente / dividir ruta).
11. Generar URL Google Maps share-link con orden optimizado:
    https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...&travelmode=driving
12. Devolver respuesta estructurada a Claude.
```

### 6.3 Estructura de respuesta del tool

```json
{
  "success": true,
  "ruta_optimizada": [
    {
      "orden": 1,
      "tipo": "salida",
      "direccion": "Sucursal Cerrillos, Camino a Lonquén 9001",
      "hora_estimada": "08:30",
      "lat": -33.5215, "lng": -70.7245
    },
    {
      "orden": 2,
      "tipo": "parada",
      "cliente_id": "uuid-...",
      "cliente_nombre": "HUAL",
      "direccion": "Av. Pdte. Salvador Allende 1500, Cerrillos",
      "hora_estimada_llegada": "08:42",
      "hora_estimada_salida": "09:05",
      "duracion_tramo_minutos": 12,
      "duracion_carga_minutos": 23,
      "dentro_ventana": true,
      "alertas": []
    },
    /* ... más paradas ... */
    {
      "orden": 6,
      "tipo": "regreso",
      "direccion": "Sucursal Cerrillos, Camino a Lonquén 9001",
      "hora_estimada": "16:42"
    }
  ],
  "resumen": {
    "distancia_km": 154.2,
    "duracion_total_minutos": 492,
    "duracion_en_ruta_minutos": 320,
    "duracion_en_paradas_minutos": 172,
    "combustible_estimado_clp": 32000,
    "tarifa_modelo_trafico": "best_guess"
  },
  "restriccion_vehicular": {
    "patente": "RJ-22-XY",
    "fecha": "2026-05-23",
    "puede_circular": true,
    "comentario": "Patente no tiene restricción hoy (sábado, restricción vehicular sólo lun-vie)"
  },
  "alertas": [
    {
      "tipo": "info",
      "mensaje": "Cliente HUAL queda en ventana 10:00-13:00 pero ETA llegada 08:42. Considerar contactar para anticipar."
    }
  ],
  "share_url_maps": "https://www.google.com/maps/dir/?api=1&origin=...",
  "polyline": "encoded_polyline_for_map_render"
}
```

### 6.4 Ejemplo curl

```bash
curl -X POST 'https://eknmtsrtfkzroxnovfqn.functions.supabase.co/diego-chat-process' \
  -H 'Authorization: Bearer eyJ...' \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "uuid-...",
    "user_message": "Armame la ruta de mañana desde Cerrillos: HUAL, Pincore, Quilicura y La Florida. Patente RJ22XY.",
    "user_id": "uuid-dusan"
  }'
```

Internamente Claude decide invocar `calcular_ruta_eficiente` con los params extraídos del mensaje, ejecuta el flow descrito arriba, y devuelve a Dusan/Pablo la respuesta humanizada con tabla + alertas + link.

### 6.5 Manejo de errores

| Código error | Causa | Acción |
|---|---|---|
| `ADDRESS_NOT_FOUND` | Una parada no se pudo geocodificar | Devolver a usuario: "No puedo ubicar la dirección X, ¿podés darme más detalle?" |
| `TOO_MANY_STOPS` | > 23 paradas (límite Routes API menos origen+destino) | Sugerir dividir en 2 rutas |
| `RESTRICCION_VEHICULAR` | Camión bloqueado por restricción | Devolver con sugerencias: cambiar patente / fuera de Vespucio / reagendar |
| `VENTANA_IMPOSIBLE` | Ninguna optimización respeta todas las ventanas horarias | Devolver mejor esfuerzo + lista de ventanas violadas |
| `GOOGLE_API_ERROR` | Falla Google Maps (rate limit, API down) | Usar cache si existe, sino devolver mensaje técnico al dispatcher |

---

## 7. Spec técnica tool `verificar_direccion`

### 7.1 Definición del tool

```json
{
  "name": "verificar_direccion",
  "description": "Verifica que una dirección sea válida, deliverable y no duplicada en la base Reciclean. Usar al alta de un cliente nuevo, antes de aceptar dirección de retiro, o cuando el dispatcher dude de una dirección tipeada.",
  "input_schema": {
    "type": "object",
    "required": ["direccion"],
    "properties": {
      "direccion": {
        "type": "string",
        "description": "Dirección completa en lenguaje natural. Ej: 'Av. El Salto 4001, Maipú, Santiago'"
      },
      "pais": {
        "type": "string",
        "default": "CL",
        "enum": ["CL"]
      },
      "buscar_duplicados": {
        "type": "boolean",
        "default": true,
        "description": "Si true, busca clientes existentes a <50m con nombre similar"
      },
      "cliente_id_excluir": {
        "type": "string",
        "description": "UUID a excluir del check de duplicados (caso edición)"
      }
    }
  }
}
```

### 7.2 Flow interno

```
1. Normalizar input (trim, uppercase país, agregar ", Chile" si no presente).
2. Cache check en panel.maps_cache (cache_type='geocode', TTL 180d):
   - Si HIT → saltar al paso 5 con resultado cacheado.
3. Llamar Google Geocoding API:
   GET https://maps.googleapis.com/maps/api/geocode/json
       ?address={direccion}&components=country:CL&key={GOOGLE_KEY}
4. Si status = OK, evaluar:
   a. `location_type` ≥ RANGE_INTERPOLATED → continuar.
   b. `location_type` = APPROXIMATE → flag warning, no rechazar todavía.
   c. status = ZERO_RESULTS → return { valid: false, motivo: 'no_existe' }.
5. (Opcional, premium) Llamar Address Validation API si el caller pidió validación dura:
   POST https://addressvalidation.googleapis.com/v1:validateAddress
6. Si buscar_duplicados=true → query SQL PostGIS:
   SELECT id, nombre, similarity(nombre, $1) AS sim
   FROM curated.clientes
   WHERE ST_DWithin(geog_punto, ST_MakePoint($lng, $lat)::geography, 50)
     AND id != COALESCE($cliente_excluir, '00000000-0000-0000-0000-000000000000')
   ORDER BY sim DESC LIMIT 5;
7. Persistir en cache.
8. Devolver respuesta estructurada.
```

### 7.3 Estructura de respuesta

```json
{
  "valid": true,
  "confianza": "alta",
  "direccion_normalizada": "Av. El Salto 4001, Maipú, Región Metropolitana, Chile",
  "lat": -33.5061,
  "lng": -70.7531,
  "place_id": "ChIJ...",
  "location_type": "ROOFTOP",
  "componentes": {
    "calle": "Av. El Salto",
    "numero": "4001",
    "comuna": "Maipú",
    "region": "Región Metropolitana",
    "pais": "Chile",
    "codigo_postal": "9250000"
  },
  "dentro_anillo_vespucio": false,
  "validation_pro": {
    "address_complete": true,
    "has_unconfirmed_components": false,
    "has_inferred_components": false
  },
  "duplicados_potenciales": [
    {
      "cliente_id": "uuid-...",
      "nombre": "Pincore SpA",
      "distancia_metros": 12,
      "similitud_nombre": 0.0,
      "comentario": "Mismo edificio pero nombre distinto — probablemente otro arrendatario"
    }
  ],
  "alertas": []
}
```

### 7.4 Ejemplo curl

```bash
curl -X POST 'https://eknmtsrtfkzroxnovfqn.functions.supabase.co/diego-chat-process' \
  -H 'Authorization: Bearer eyJ...' \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "uuid-...",
    "user_message": "Validame esta dirección antes de cargarla: Av El Salto 4001 Maipu",
    "user_id": "uuid-dusan"
  }'
```

### 7.5 Reglas de aceptación

| Condición | Resultado |
|---|---|
| `location_type` = ROOFTOP + sin duplicados | **Aceptar** automático |
| `location_type` = ROOFTOP + duplicado < 50m con sim > 0.8 | **Aceptar pero alertar** posible duplicado |
| `location_type` = RANGE_INTERPOLATED | **Aceptar con warning**: "dirección interpolada, verificar visualmente" |
| `location_type` = GEOMETRIC_CENTER | **Pedir confirmación** al usuario con mapa |
| `location_type` = APPROXIMATE | **Rechazar** — pedir más datos |
| ZERO_RESULTS | **Rechazar** — pedir corrección |

---

## 8. Brechas Diego v8 vs estándar 2025-2026

### 8.1 Brechas críticas (P0)

| # | Brecha | Impacto | Esfuerzo |
|---|---|---|---|
| 1 | No hay TSP — sólo distancia punto-a-punto vía Distance Matrix | Dispatcher arma ruta manual → 15-30 min/día/sucursal, 20% rutas con error de orden | M (1 sprint) |
| 2 | No valida direcciones al alta de cliente | Camión despachado a dirección inexistente → combustible + tiempo perdido | S (3-5 días) |
| 3 | No considera restricción vehicular Santiago | Multa $100k por incidente · operativo riesgo legal | M (1 sprint, incluye carga tabla calendario) |

### 8.2 Brechas operativas (P1)

| # | Brecha | Impacto | Esfuerzo |
|---|---|---|---|
| 4 | No cachea resultados Maps API | Posible costo en escala + latencia | S |
| 5 | No genera share-link Google Maps al chofer | Chofer copia direcciones manualmente al GPS | S |
| 6 | No respeta ventanas horarias en optimización | Retiros fuera de horario acordado con cliente | M |
| 7 | No detecta duplicados en base clientes | Bases sucias, registros repetidos | S |

### 8.3 Quick-wins recomendados (orden de implementación)

1. **Semana 1**: Crear EF `verify-address` + tabla `panel.maps_cache` + integrar a `diego-chat-process` como tool. Migrar todas las altas de cliente a usar el tool. **Costo cero, valor alto.**
2. **Semana 2**: Crear EF `route-optimize` con `computeRoutes` + `optimizeWaypointOrder`. Sin restricción vehicular todavía. Probar con ruta real Cerrillos lunes.
3. **Semana 3**: Cargar tabla `panel.restriccion_vehicular_calendario` 2026 + tabla `panel.flota_vehiculos`. Agregar validación `camion_puede_circular()` al flow de `route-optimize`.
4. **Semana 4**: Agregar ventanas horarias + ETAs por parada + alertas. Generar share-link Google Maps. Documentar para el dispatcher.

Total estimado: **4 sprints de PC Pablo** para llegar a paridad con Routific/Onfleet en las features que importan para Reciclean.

---

## 9. Fuentes citadas

Investigación basada en documentación oficial 2025-2026 y benchmarks comerciales actuales.

### Google Maps Platform
- [Routes API — Optimize the order of stops on your route](https://developers.google.com/maps/documentation/routes/opt-way)
- [Routes API — Method: computeRoutes](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes)
- [Routes API — TrafficModel](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TrafficModel)
- [Routes API — Usage and Billing](https://developers.google.com/maps/documentation/routes/usage-and-billing)
- [Route Optimization API (VRP solver)](https://developers.google.com/maps/documentation/route-optimization)
- [Geocoding API — Reverse geocoding](https://developers.google.com/maps/documentation/geocoding/reverse-geocoding)
- [Address Validation API — Overview](https://developers.google.com/maps/documentation/address-validation/overview)
- [Google Maps Platform Core Services Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)

### Alternativas comerciales evaluadas
- [Mapbox Optimization API v2 (Beta)](https://docs.mapbox.com/api/navigation/optimization/)
- [Mapbox Geocoding v6 — Generally Available](https://www.mapbox.com/blog/mapbox-geocoding-v6-now-generally-available)
- [HERE Tour Planning API — Developer Guide](https://developer.here.com/documentation/tour-planning/3.1/dev_guide/index.html)
- [Google OR-Tools — Vehicle Routing Problem with Time Windows](https://developers.google.com/optimization/routing/vrptw)

### Benchmarks fleet management
- [Routific vs Onfleet vs Circuit — Comparison 2026 (Locus)](https://locus.sh/blogs/routific-vs-onfleet-vs-locus/)
- [Routific vs Onfleet vs Circuit (Circuit Teams blog)](https://getcircuit.com/teams/blog/routific-vs-onfleet-vs-circuit)
- [Onfleet Route Optimization — Operating](https://support.onfleet.com/hc/en-us/articles/360023910351-Route-Optimization-Operating)
- [Waste Collection Route Optimization Guide 2025 (NextBillion.ai)](https://nextbillion.ai/blog/waste-collection-route-optimization)
- [FleetRabbit Waste Fleet Case Study — $1.4M Saved, 30% Fewer Miles](https://fleetrabbit.com/case-study/post/waste-management-fleet-garbage-collection)

### Restricción vehicular Chile
- [MTT — Restricción vehicular 2026 Región Metropolitana](https://mtt.gob.cl/restriccion-vehicular-2026/)
- [MTT — Inicia Período de Restricción Vehicular 2026](https://mtt.gob.cl/inicia-periodo-de-restriccion-vehicular-2026-region-metropolitana/)
- [Gob.cl — ¿Qué patentes tienen restricción vehicular hoy?](https://www.gob.cl/noticias/que-patentes-tienen-restriccion-vehicular-hoy/)

### Supabase + Deno
- [Supabase Edge Functions — Overview](https://supabase.com/docs/guides/functions)
- [Supabase Functions on Deno Deploy](https://deno.com/blog/supabase-functions-on-deno-deploy)
- [Edge Functions Architecture](https://supabase.com/docs/guides/functions/architecture)

### Chatbots logística
- [Conversational AI in Logistics — Use Cases 2025 (Murf)](https://murf.ai/conversational-ai/industries/logistics)
- [AI Chatbots in Logistics Industry (Sisgain)](https://sisgain.com/blogs/ai-chatbots-in-logistics)
- [Top 15 Logistics AI Use Cases & Examples (AIMultiple)](https://aimultiple.com/logistics-ai)

---

**Documento elaborado por:** Backend Architect agent
**Para implementación:** PC Pablo (Tech Lead)
**Validación final:** Dusan Arancibia (CEO · firma decisión arquitectónica)
**Próxima revisión:** Tras quick-win #1 implementado (≈ 4-jun-2026)
