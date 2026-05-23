# Bandeja Dusan — Auditoría 85 capacidades Diego (cierre 2026-05-23)

> 4 decisiones / acciones que dependen exclusivamente de vos. Ninguna requiere a Pablo ni a Claude.

---

## 1. GOOGLE_MAPS_API_KEY — desbloquea Cat 5 (rutas + verificar dirección)

**Por qué importa:** Diego hoy responde fallback exacto cuando le preguntan ruta. 3 de las 4 capacidades de logística están bloqueadas hasta tener esta key.

**Pasos (15 min, costo $0):**

1. Andá a https://console.cloud.google.com
2. Si no tenés proyecto: crear uno (nombre "reciclean-rdo" alcanza).
3. Habilitar **Directions API**, **Geocoding API**, **Distance Matrix API** desde "APIs & Services > Library".
4. Generar API key en "APIs & Services > Credentials > Create credentials > API Key".
5. Restringir la key: solo las 3 APIs anteriores, IP restriction al IP del Supabase Edge runtime (opcional pero recomendado).
6. Pasamela como mensaje en el chat (o cargala directo si querés vos en Supabase Dashboard > Edge Functions > Secrets).

Guía completa: `reciclean-sistema/public/GOOGLE-MAPS-SETUP.md`.

---

## 2. Credencial SII — desbloquea Cat 4.3 + Cat 11.2

**Por qué importa:** Hoy Diego no puede consultar SII por RUT. Te derive 2 capacidades a "preguntale a Dusan" porque no tiene acceso.

**Pasos (30 min, costo $0):**

1. Andá a https://homer.sii.cl o https://misiicl.sii.cl
2. Crear una sesión con el RUT del grupo (o uno individual con poder SII).
3. Pasarme: `usuario SII` + `clave SII`.

Guía: `reciclean-sistema/public/SII-SETUP.md`.

⚠️ **Alternativa rápida:** si no querés exponer credenciales, dale "no" a esta y dejá Cat 4.3 + Cat 11.2 como "feature deferida". Diego va a seguir derivando "preguntá a Dusan", que es lo correcto si no hay key.

---

## 3. Firmar PR #15 en `reciclean-rdo` — desbloquea Cat 3 + Cat 14.5

**PR:** https://github.com/dusanarancibia-cpu/reciclean-rdo/pulls
Branch: `fix/diego-precio-tildes-audit-log` → target `main`.

**Qué contiene:**
- Fix de búsqueda de materiales insensible a tildes (R-AUD-003).
- Fix de audit log (R-AUD-001).
- 8 reglas conversacionales nuevas en system prompt (R-AUD-006 a R-AUD-013).
- Reporte final de auditoría (`mayordomo/AUDITORIA-85-CAPACIDADES-23MAY.md`).

**Acción:**
1. Mergear PR #15 a `main`.
2. Avisar a Pablo para que ejecute `supabase functions deploy diego-chat-process`.

---

## 4. Completar `panel.dotacion` con datos reales

**Por qué importa:** Diego ahora consulta esa tabla antes de asignar tareas (R-AUD-007 + R-AUD-009). Hoy tiene 6 filas seed con datos mínimos. Necesita:

| Campo | Status |
|---|---|
| Email Pablo | falta |
| Email Andrea, Cony, Ingrid, Dyana | falta |
| Teléfono de cada uno | falta (algunos los tenés en el repo) |
| Trabajadores operativos (T01-T14) | faltan completos |

**Acción (15 min):** pasame el CSV o dictame los datos y los cargo. Alternativa: te genero un SQL precargado con los campos y vos completás placeholders.

---

**Estado bandeja:** abierta. Marcar como cerrada cuando 1, 2, 3 y 4 estén ✅.

**Firma:** PC Dusan bajo mandato Dusan Arancibia, 2026-05-23 PM.
