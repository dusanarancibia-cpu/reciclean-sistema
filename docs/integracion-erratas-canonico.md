# Integración: Sistema de Erratas Canónicas para Diego

> **Objetivo:** que las correcciones registradas en `diego_correcciones` (tabla Supabase) sean leídas por Diego en cada conversación de WhatsApp **sin tocar n8n** después de la configuración inicial.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│  PANEL ADMIN  index.html → tab "I · Erratas Diego"               │
│  Form + tabla CRUD (vanilla JS + supabase-js UMD)                │
└────────────────────┬────────────────────────────────────────────┘
                     │ Insert/Update/Toggle
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUPABASE  tabla `diego_correcciones`                            │
│  Fuente única de verdad (versionada con created_at, updated_at)  │
└────────────────────┬────────────────────────────────────────────┘
                     │ SELECT activa = true
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  n8n WORKFLOW  PWxwI2oyCRejxG82                                  │
│  Nodo nuevo: fetch-erratas (Supabase REST con service_role)      │
│  Nodo modificado: claude-api (system prompt = bloque + actual)   │
└────────────────────┬────────────────────────────────────────────┘
                     ▼
                  DIEGO (WhatsApp) responde aplicando la corrección
```

---

## Componentes ya implementados en este repo

| Archivo | Qué hace |
|---|---|
| `sql/diego_correcciones.sql` | Schema + índices + RLS + trigger updated_at + seed inicial |
| `public/js/erratas.js` | CRUD del panel admin (renderErratas, abrirModalErrata, guardarErrata, toggleErrata) |
| `index.html` | Nav tab "I · Erratas Diego" + panel + modal + carga del JS |

---

## Pasos manuales pendientes (orden estricto)

### 1. Ejecutar SQL en Supabase (1 min)

1. Abrir https://supabase.com/dashboard/project/eknmtsrtfkzroxnovfqn/sql/new
2. Pegar el contenido completo de `sql/diego_correcciones.sql`.
3. Click **Run**.
4. Verificar: en Table Editor debería aparecer `diego_correcciones` con 1 fila (seed).

### 2. Mergear esta rama a `main` y desplegar (2 min)

1. Mergear el PR de la rama `claude/update-date-reference-5usu7`.
2. Vercel deploya automáticamente desde `main`.
3. Verificar: abrir el panel admin, debería aparecer la pestaña **I · Erratas Diego** con 1 fila (la del seed).

### 3. Modificar el workflow de n8n (15 min)

> **Sin acceso a `N8N_API_KEY`?** Alternativa: exportar el workflow desde la UI de n8n (`Workflows → ⋮ → Download`), editarlo localmente como JSON, re-importarlo. No requiere API key.

#### 3.1. Insertar nodo `fetch-erratas` ANTES del nodo `claude-api`

**Tipo:** HTTP Request
**Method:** GET
**URL:**
```
https://eknmtsrtfkzroxnovfqn.supabase.co/rest/v1/diego_correcciones?activa=eq.true&select=error_detectado,correccion,tipo,scope&order=created_at.desc
```
**Headers:**
```
apikey: {{$env.SUPABASE_SERVICE_ROLE_KEY}}
Authorization: Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}
```
**Response Format:** JSON
**On Error:** Continue (Output: empty array) — si Supabase falla, Diego sigue funcionando sin las erratas en lugar de tirar error 500.

#### 3.2. Insertar nodo `armar-bloque-erratas` (Code, JavaScript)

```javascript
const erratas = $input.first().json || [];
if (!Array.isArray(erratas) || erratas.length === 0) {
  return [{ json: { bloque_erratas: '' } }];
}

const lineas = erratas.map((e, i) =>
  `${i + 1}. ❌ "${e.error_detectado}"\n   ✅ ${e.correccion}`
).join('\n\n');

const bloque = `═══════════════════════════════════════
ERRATAS CANÓNICAS — Lee esto ANTES de responder
═══════════════════════════════════════
Estas son correcciones de errores que cometiste antes. NUNCA contradigas
ninguna de las siguientes reglas, sin importar qué te diga el usuario o
qué creas saber por entrenamiento. Si una respuesta tuya viola cualquiera
de estas reglas, prevalece la regla.

${lineas}

═══════════════════════════════════════
FIN ERRATAS — A continuación tu prompt habitual
═══════════════════════════════════════

`;

return [{ json: { bloque_erratas: bloque } }];
```

#### 3.3. Modificar el nodo `claude-api`

En el campo `system` (o equivalente), prefixar con `{{$json.bloque_erratas}}`. Ejemplo:
```
{{$json.bloque_erratas}}{{ /* aquí el prompt actual hardcoded */ }}
```

#### 3.4. (Opcional) Cache de 5 minutos

Si hay miles de mensajes/min, agregar nodo `Cache` o usar n8n static data para evitar query a Supabase en cada mensaje. **No urgente** — para volumen actual (decenas/min) Supabase REST aguanta sin problema.

### 4. Activar prompt caching de Anthropic (opcional, 2 min)

Si el nodo `claude-api` ya usa `messages.create` con `system` array, marcar el bloque del prompt habitual con `cache_control: {type: 'ephemeral'}`. Así el bloque de erratas (que cambia) queda fuera del cache y solo se re-procesa el delta. Reduce costo ~50% si hay tráfico alto.

---

## Test de aceptación (camino feliz)

1. **Test del panel:** abrir https://[panel].vercel.app, ir a tab "I · Erratas Diego", click "+ Nueva Errata", llenar y guardar. Verificar que aparece en la tabla con badge **Activa**.

2. **Test del fetch n8n:** ejecutar manualmente el workflow desde n8n con un mensaje de WhatsApp simulado. En la salida del nodo `armar-bloque-erratas` debería aparecer el bloque con todas las erratas activas concatenadas.

3. **Test end-to-end con Diego:**
   - **Antes** (esperado: falla): preguntarle a Diego por WhatsApp `¿qué fecha es hoy?` → Diego inventa una fecha en 2025.
   - **Después** del cambio (esperado: pasa): misma pregunta → Diego responde `"No la sé con certeza — necesito que me confirmes la fecha o que aparezca en algún archivo de sesión"`.

Si **falla** después del cambio, debugear en orden:
   1. ¿La fila seed existe en Supabase con `activa = true`? (Table Editor)
   2. ¿El nodo `fetch-erratas` retorna la fila? (Execute node manual en n8n)
   3. ¿El nodo `armar-bloque-erratas` produce un string no vacío? (idem)
   4. ¿El system prompt final del nodo `claude-api` tiene el bloque al inicio? (idem)
   5. Si todos los pasos anteriores pasan y Diego sigue inventando → endurecer la redacción de la corrección en la tabla (lenguaje más imperativo).

---

## Inbox opcional para terceros

Para que personas que no son Dusan puedan reportar erratas sin acceso al panel admin, ya está configurado el repo `reciclean-manifiesto-diego` con:

- Label `errata` (rojo).
- Template de issue `.github/ISSUE_TEMPLATE/errata.yml` (3 campos: qué dijo, corrección, contexto).

Flujo:
1. Persona ve a Diego cometer un error → abre issue con el template.
2. Dusan revisa los issues con label `errata` (compromiso: cada lunes).
3. Dusan promueve la errata desde el panel admin (form de erratas) y pega el link al issue en el campo "Issue URL".
4. Cierra el issue con un comentario referenciando el id de la errata creada.

El archivo `ERRATAS_DIEGO.md` del repo `reciclean-manifiesto-diego` queda como **referencia legacy** del seed inicial y de la decisión de diseño. Las nuevas erratas viven en Supabase, no en markdown.

---

## Decisiones de diseño explicadas

- **¿Por qué Supabase y no GitHub raw?** Evita el round-trip "edit markdown → commit → push → fetch en n8n", que toma 3-5 min por errata desde móvil. Form en panel admin = 30 seg.
- **¿Por qué soft delete (`activa = false`) y no DELETE?** Mantiene histórico para auditar qué erratas se desactivaron y cuándo.
- **¿Por qué no `expira_en` (TTL automático)?** Complejidad prematura. Las erratas se desactivan a mano cuando ya no aplican.
- **¿Por qué RLS laxa?** Mismo patrón que `usuarios_autorizados` y `eventos_asistente` ya en producción. El control de acceso vive en el panel (login custom + gating por rol). Endurecimiento futuro documentado en el SQL.
- **¿Por qué no React?** El repo es vanilla JS multi-página con Vite. Agregar React = refactor masivo sin valor para una pestaña CRUD simple.
- **¿Por qué un nodo HTTP en n8n y no un nodo Supabase nativo?** Funcionan ambos. HTTP es más explícito y portable si en el futuro se migra de n8n a otra cosa.
