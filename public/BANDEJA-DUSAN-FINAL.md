# Bandeja Dusan FINAL — cierre 3 frentes (2026-05-23)

> Reemplaza `BANDEJA-DUSAN-AUDITORIA.md` con el set consolidado de pendientes que SOLO vos podés cerrar.

---

## Status global

| Frente | Estado | Detalle |
|---|---|---|
| F1 Chat spacing | ✅ **DEPLOYADO PROD** | PR #64 + #65 + #66 + #67 mergeados. Visual confirmado en `reciclean-sistema.vercel.app`. |
| F2 Reglas anti-invención y memoria | 🟡 **CÓDIGO LISTO + DDL APLICADA** | Mig 060/061/062/063/064 en prod. EF v10.9 en branch esperando deploy Pablo. |
| F3 Bandejas | ✅ **DOCUMENTADO** | Este archivo + `BANDEJA-PABLO-AUDITORIA.md`. |

---

## Pendientes solo tuyos (4 ítems)

### 1. Completar `panel.dotacion` con la lista real del equipo

**Estado:** tabla seedeada con 6 filas mínimas (mig 063):

| nombre | rol | area | sucursal | email |
|---|---|---|---|---|
| Dusan Arancibia | CEO | Gerencia | Transversal | dusan.arancibia@gmail.com |
| Pablo | Tech Lead | Tecnologia | Remoto | _falta_ |
| Andrea | Comercial | Comercial | Transversal | _falta_ |
| Cony | RRHH | Sercot | Cerrillos | _falta_ |
| Ingrid | Operaciones | Operaciones | Talca | _falta_ |
| Dyana | Contabilidad | Sercot | Cerrillos | _falta_ |

**Pendientes:**
- Email de Pablo, Andrea, Cony, Ingrid, Dyana.
- Teléfono de cada uno (algunos están en el repo, pero verificar).
- Trabajadores operativos T01-T14 completos (los tenés mapeados en el "Documento Maestro Diagnóstico Organizacional Grupo v2").

**Acción:**
- Pegame el listado (CSV o texto) y lo cargo en `panel.dotacion` en 5 min.
- Alternativa: te genero un SQL precargado para que vos completes en Supabase Dashboard.

**Tiempo estimado:** 15 min.

---

### 2. Generar `GOOGLE_MAPS_API_KEY` (desbloquea Cat 5 — rutas)

**Por qué importa:** 3 capacidades de logística de Diego bloqueadas hoy. `calcular_ruta_optima`, `verificar_direccion`, `restricciones_transito` devuelven fallback "no está configurada".

**Pasos (15 min, $0):**
1. https://console.cloud.google.com → crear proyecto "reciclean-rdo" (si no existe).
2. APIs & Services > Library → habilitar **Directions API** + **Geocoding API** + **Distance Matrix API**.
3. APIs & Services > Credentials > Create credentials > API Key.
4. Restringir la key: solo las 3 APIs anteriores (App restriction: HTTP referrer si vas a usar desde frontend; en este caso es server-side desde EF, así que IP restriction no aplica fácil — dejala unrestricted con monitoreo de cuota).
5. Pasamela como mensaje en este chat o cargala directo en Supabase Dashboard > Edge Functions > Secrets como `GOOGLE_MAPS_API_KEY`.

**Guía completa ya en repo:** `reciclean-sistema/public/GOOGLE-MAPS-SETUP.md`.

---

### 3. Conseguir credencial SII (desbloquea Cat 4.3 + Cat 11.2)

**Por qué importa:** Diego no puede consultar SII por RUT. Hoy deriva "preguntá a Dusan" cuando le piden investigar competidor o validar tributariamente.

**Pasos (30 min, $0):**
1. https://homer.sii.cl o https://misiicl.sii.cl
2. Crear sesión con el RUT del grupo (o uno individual con poder SII).
3. Pasame: `usuario SII` + `clave SII` para cargar en Supabase Secrets.

**Guía:** `reciclean-sistema/public/SII-SETUP.md`.

⚠️ **Alternativa rápida:** si no querés exponer credenciales, deferí esta y dejá Cat 4.3 + Cat 11.2 como "feature postponed". Diego sigue derivando "preguntá a Dusan", que es el comportamiento seguro.

---

### 4. Firmar PRs pendientes en GitHub

| PR | Repo | Título | Acción |
|---|---|---|---|
| #15 | `reciclean-rdo` | feat(diego-v10.7): 8 reglas R-AUD-006..013 + tablas dotacion | **Mergear a `main`** + avisar a Pablo |
| _nuevo_ | `reciclean-rdo` | _PR a crear_ desde branch `fix/diego-memoria-contexto` (EF v10.9 + mig 064) | **Crear PR + mergear** |
| #63 | `reciclean-sistema` | (ya mergeada — ignorar) | — |
| #64 | `reciclean-sistema` | ✅ mergeada | — |
| #65 | `reciclean-sistema` | ✅ mergeada main→prod | — |
| #66 | `reciclean-sistema` | ✅ mergeada (whitespace fix) | — |
| #67 | `reciclean-sistema` | ✅ mergeada main→prod | — |

**Críticos pendientes:** PR #15 + el PR nuevo de v10.9. **Sin merge, Pablo no puede deployar.**

Después de mergear:
- Avisar a Pablo: `cd reciclean-rdo && git checkout fix/diego-memoria-contexto && git pull && supabase functions deploy diego-chat-process --project-ref eknmtsrtfkzroxnovfqn`.

---

## Lo que NO necesita decisión tuya (auto-aplicable o ya hecho)

- ✅ Mig 060/061/062/063/064 aplicadas en prod Supabase.
- ✅ `panel.config_ui` actualizada con 15 reglas (R_AUD_006..020).
- ✅ 4 `CLAUDE-PC-*.md` actualizados con tablas extendidas.
- ✅ `mayordomo/APRENDIZAJE-AUDITORIA.md` con bloque CIERRE EXTREMO.
- ✅ Chat Diego visual deployado en prod con spacing limpio.
- 🟡 EF v10.9 con 17 reglas conversacionales (R-AUD-006..019) + memoria de sesión esperando deploy Pablo.

---

## Tiempo total para cerrar pendientes Dusan

| Ítem | Tiempo | Bloquea |
|---|---|---|
| 1. Completar `panel.dotacion` | 15 min | R-AUD-007/009 efectividad |
| 2. GOOGLE_MAPS_API_KEY | 15 min | Cat 5 (3 capacidades) |
| 3. Credencial SII | 30 min (opcional) | Cat 4.3 + 11.2 |
| 4. Firmar PRs pendientes | 5 min | Deploy Pablo |
| **TOTAL** | **35-65 min** | — |

---

**Firma:** PC Dusan bajo mandato Dusan Arancibia, 2026-05-23 PM (cierre 3 frentes).
