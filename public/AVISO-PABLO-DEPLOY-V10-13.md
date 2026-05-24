# 🚨 Pablo — deploy EF Diego v10.13 (5 min CLI local)

> Firmado por Dusan 2026-05-24 madrugada. Reemplaza BANDEJA-PABLO-AUDITORIA item 1 (que pedía v10.7 — ya quedó obsoleto, ahora vamos directo a v10.13 que incluye todo lo de v10.7..v10.12 más cumplimiento legal).

---

## Lo que tenés que hacer

```bash
cd reciclean-rdo
git checkout main
git pull origin main
supabase functions deploy diego-chat-process --project-ref eknmtsrtfkzroxnovfqn
```

Eso es todo. La EF en GitHub `reciclean-rdo/main` ya tiene v10.13 (commit `12c973d` mergeado vía PR #22).

---

## Por qué este deploy es importante

EF actualmente en prod: **`version=16` (Diego v10.6)** — desactualizada en 7 versiones.

EF v10.13 incluye:

| Versión | Aporte | Migración asociada |
|---|---|---|
| v10.7 | R-AUD-006..013 (8 reglas conversacionales: discreción, no inventar, no perder hilo, no bucles, brevedad) | 060/061/062 |
| v10.8 | Memoria de sesión: lee 72h previas + escribe resumen cada 5 turnos | 064 |
| v10.9 | R-AUD-014..017 (anti-invención, anti-contradicción, no repetir pregunta) | — |
| v10.10 | RBAC dinámico precios (`panel.permisos` — Pablo ya lo tenía) | 065/066 |
| v10.11 | R-AUD-027/028 canales WhatsApp (T08/T09/T10/T14 WhatsApp directo, ofrecer "WhatsApp o correo") | — |
| v10.13 | R-AUD-029 cumplimiento legal: Diego es vocero de las 5 leyes (REP, Datos, Tránsito, SII, Laboral) | 067 |

---

## Verificación post-deploy (3 pruebas mínimas)

Abrí el FAB Diego en `https://reciclean-sistema.vercel.app/panel-rdo.html` y tipea:

1. **`precio cartón Maipú`** → debe devolver precio real (no "Parece que hubo un problema").
2. **`okey`** después de cualquier conversación → debe continuar tema previo, no saludar de cero.
3. **`¿qué dice la Ley REP sobre RDO mensual?`** → debe responder con Art. 22 (MERR/RDO) + sanción + autoridad SMA (sin inventar).

Si las 3 pasan, deploy OK.

---

## Si algo falla

- **OpenAI key:** asegurate de que `OPENAI_API_KEY` siga seteada en Edge Function secrets.
- **GOOGLE_MAPS_API_KEY:** sigue pendiente Dusan generarla. La tool `calcular_ruta_optima` devuelve fallback si no está.
- **SII_USUARIO / SII_CLAVE:** sigue pendiente. Tool `consultar_sii` devuelve fallback.
- **Tabla `panel.dotacion`:** está DEPRECATED (R-AUD-025). Si Diego v10.13 te pide tool `consultar_dotacion` y no existe, usá `panel.v_dotacion_completa` como fuente (mig 067 ya creó la view).

---

## Pendientes próxima iteración tuya (NO bloquean este deploy)

Documentados en `BANDEJA-PABLO-AUDITORIA.md` + en `CLAUDE-PC-PABLO.md`:

1. Tool `consultar_dotacion(query)` sobre `panel.v_dotacion_completa` (R-AUD-007/009/022).
2. Tool `consultar_tareas_pendientes(user_email)` sobre `panel.diego_tareas` (R-AUD-015 anti-contradicción).
3. Tool `enviar_whatsapp(telefono, mensaje)` para canal preferente (R-AUD-028).
4. Tool `consultar_articulos_ley(ley_id, query)` sobre `panel.articulos_ley` (R-AUD-029).
5. Integración UI: `data-source-footer` (F6), tab "Ecosistema" usando `ecosistema-360.html` (F5), botón "Generar PDF" en ficha 360 cliente usando `cotizacion-print.html` (F7).

---

**Canal preferente Pablo (R-AUD-028):** WhatsApp +56923962018.
Backup: `recepcion01@gestionrepchile.cl`.

**Firma:** Dusan Arancibia · 2026-05-24 madrugada.
