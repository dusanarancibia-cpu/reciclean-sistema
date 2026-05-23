# Setup Google Maps API — para Diego (rutas eficientes)

> Habilita la capacidad de Diego de calcular rutas óptimas (camiones recolección, visitas comerciales, retiros).
> **Quién debe hacerlo:** Dusan. **Tiempo estimado:** 15 minutos. **Costo estimado:** $0 USD/mes hasta 28.000 requests (free tier Google Maps).

---

## Resumen en 5 puntos

1. Diego necesita una API key de Google Maps para calcular rutas (Directions API + Geocoding API).
2. La key se genera GRATIS en Google Cloud Console.
3. Hay que restringirla por IP y por API para que nadie más la use.
4. Una vez generada, se la pasás a Pablo y él la configura como secreto de Supabase.
5. Cuando esté configurada, Diego responderá automáticamente preguntas como "¿Cuál es la ruta más corta de Cerrillos a HUAL?".

---

## Paso a paso

### 1. Entrar a Google Cloud Console

- URL: https://console.cloud.google.com
- Iniciar sesión con la cuenta Google del grupo (sugerido: `dusan.arancibia@gmail.com` o crear una `tech@gestionrepchile.cl`).
- Si pide crear proyecto: nombre sugerido `reciclean-diego-prod`.

### 2. Activar Billing (sin costo real)

- Sin billing activado, las APIs no funcionan ni siquiera en free tier.
- Menú "Billing" → "Link a billing account" → poner tarjeta crédito.
- **No te van a cobrar** mientras estés dentro del free tier (28.000 requests/mes de Directions).
- Sugerencia: poner una alerta de presupuesto a $10 USD/mes para tranquilidad.

### 3. Habilitar las APIs necesarias

En el buscador de Google Cloud Console, buscar y habilitar (botón "Enable") en este orden:

| API | Para qué |
|---|---|
| **Directions API** | Cálculo de rutas A→B con tiempo y distancia |
| **Geocoding API** | Convertir dirección texto a lat/lng |
| **Distance Matrix API** (opcional) | Múltiples orígenes/destinos en una sola query |

### 4. Crear la API Key

- Menú "APIs & Services" → "Credentials" → botón "+ CREATE CREDENTIALS" → "API key".
- Google muestra la key (algo así: `AIzaSy...XYZ`).
- **Cópiala YA** — no se vuelve a mostrar después.

### 5. Restringir la API Key (importante por seguridad)

Click "Edit API key":

- **Application restrictions:** "HTTP referrers" → agregar `https://eknmtsrtfkzroxnovfqn.supabase.co/*` y `https://reciclean-sistema.vercel.app/*`. (O elegir "IP addresses" + las IPs de Supabase si las conocés.)
- **API restrictions:** "Restrict key" → tildar solo Directions API, Geocoding API, Distance Matrix API.
- Guardar.

### 6. Pasársela a Pablo

Mandale a Pablo este mensaje:

```
Pablo, GOOGLE_MAPS_API_KEY = AIzaSy...XYZ
Configurala como Supabase Secret del proyecto eknmtsrtfkzroxnovfqn:

supabase secrets set GOOGLE_MAPS_API_KEY=AIzaSy...XYZ

Después validá con Diego:
  > ¿Cuál es la ruta más corta de Cerrillos a Maipú?
```

### 7. Validar con Diego

Una vez Pablo la configure, abrí Diego (FAB del panel) y preguntá:

> "¿Cuál es la ruta más corta de Cerrillos a Talca?"

Diego ahora debería responder con kilómetros, minutos estimados y resumen de ruta — sin el mensaje de fallback.

---

## Lo que Diego puede hacer cuando esté configurada

| Pregunta tuya | Tool Diego | Respuesta |
|---|---|---|
| "Ruta de Cerrillos a HUAL" | `calcular_ruta_optima` | Km, min, polyline + resumen |
| "Cuántos km hay de Maipú a Talca" | `calcular_ruta_optima` | Distancia directa |
| "Ordená mejor ruta visitando HUAL, RESIMEX y POLPLAST desde Cerrillos" | `calcular_ruta_optima` con paradas + optimize | Ruta optimizada con orden de paradas |
| "Verificá si la dirección 'Av. Pedro Aguirre Cerda 123, Maipú' existe" | `calcular_ruta_optima` (degrada a Geocoding) | Coordenadas + dirección formateada |

---

## Costos esperados (después del setup)

- Free tier Google: 28.000 requests/mes (Directions) + 40.000/mes (Geocoding).
- Asumiendo 100 rutas/día = 3.000/mes → **dentro de free tier, costo $0**.
- Si superás free tier: ~$5 USD por cada 1.000 requests adicionales. Para nuestro volumen, ni cerca.

---

## Si algo falla

- Diego sigue respondiendo "API no configurada" → Pablo no aplicó la key. Pedile screenshot de `supabase secrets list`.
- Diego responde "Google Maps respondió REQUEST_DENIED" → la key tiene restricciones mal puestas. Volver a paso 5.
- Diego responde "OVER_QUERY_LIMIT" → superamos el free tier. Subir billing alert.

---

**Decisión:** D-DIEGO-FIN-001 (firmada Dusan 2026-05-23). Tool en EF: `calcular_ruta_optima`.
