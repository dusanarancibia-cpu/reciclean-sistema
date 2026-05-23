# Setup envío automático de correos — Diego → Gmail

> Habilita que Diego mande correos en nombre del grupo (a clientes, equipo, proveedores) sin que Dusan tenga que copiar/pegar borradores.
> **Quién debe hacerlo:** Dusan. **Tiempo estimado:** 45 minutos. **Costo:** $0.

---

## Resumen en 5 puntos

1. Hoy Diego SOLO redacta borradores y los deja en cola. **No envía nada solo.**
2. Para que envíe directo, Dusan tiene que crear un OAuth Client en Google Cloud y autorizar a Diego con scope `gmail.send`.
3. La autorización genera un `refresh_token` que se guarda como secreto en Supabase.
4. Sin esa autorización, Diego sigue funcionando — solo no envía, solo redacta.
5. **Recomendación de seguridad:** usar una cuenta dedicada `diego@gestionrepchile.cl` (no la cuenta personal de Dusan).

---

## Paso a paso

### 1. Crear cuenta de envío (recomendado)

- Crear `diego@gestionrepchile.cl` en Google Workspace del grupo.
- Si todavía no tenés Workspace, podés usar `dusan.arancibia@gmail.com` pero el destinatario verá tu correo personal — no ideal.
- Configurar firma "Enviado en nombre del Grupo Reciclean-Farex por Diego (asistente virtual)".

### 2. Habilitar Gmail API en Google Cloud

- URL: https://console.cloud.google.com (mismo proyecto que Google Maps si querés, sugerido: `reciclean-diego-prod`).
- "APIs & Services" → "Library" → buscar "Gmail API" → Enable.

### 3. Configurar OAuth consent screen

- Menú "APIs & Services" → "OAuth consent screen".
- User type: "External" (si no tenés Workspace) o "Internal" (si tenés).
- Datos a llenar:
  - App name: "Diego — Reciclean-Farex"
  - User support email: `dusan.arancibia@gmail.com`
  - Developer email: lo mismo.
  - Scopes: agregar `https://www.googleapis.com/auth/gmail.send` (solo este, no más).
  - Test users: `diego@gestionrepchile.cl` (o la cuenta que vas a usar).
- Guardar. Por ahora dejar en modo "Testing" — no hace falta verificar app públicamente.

### 4. Crear OAuth Client

- Menú "APIs & Services" → "Credentials" → "+ CREATE CREDENTIALS" → "OAuth client ID".
- Application type: "Desktop app".
- Name: "Diego Edge Function".
- Google te devuelve dos valores:
  - `CLIENT_ID` (algo como `123456-xxxx.apps.googleusercontent.com`)
  - `CLIENT_SECRET` (algo como `GOCSPX-xxxx`)
- Copialos a un lugar seguro (1Password o similar).

### 5. Autorizar con `gmail.send` y obtener `refresh_token`

Esto es el paso técnico. La forma más simple usando el browser:

1. Construir URL de autorización:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=<CLIENT_ID>&redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code&scope=https://www.googleapis.com/auth/gmail.send&access_type=offline&prompt=consent
   ```
2. Abrir en navegador, loguearte con la cuenta `diego@gestionrepchile.cl`.
3. Aceptar permisos.
4. Google te muestra un código `4/0AVHE...`. Copialo.
5. Cambiar ese código por un `refresh_token`:
   ```bash
   curl -X POST https://oauth2.googleapis.com/token \
     -d "code=<CODE>" \
     -d "client_id=<CLIENT_ID>" \
     -d "client_secret=<CLIENT_SECRET>" \
     -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob" \
     -d "grant_type=authorization_code"
   ```
6. La respuesta JSON trae `refresh_token` — copiarlo.

> **Tip:** si te cuesta el paso 5, pedile a Pablo que te lo haga en 5 min en su computadora.

### 6. Pasárselo a Pablo

Mandale a Pablo este mensaje:

```
Pablo, credenciales Gmail API:

GMAIL_CLIENT_ID = 123456-xxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET = GOCSPX-xxxx
GMAIL_REFRESH_TOKEN = 1//0g...xxxxx

Configuralas como Supabase Secrets del proyecto eknmtsrtfkzroxnovfqn:

supabase secrets set GMAIL_CLIENT_ID=...
supabase secrets set GMAIL_CLIENT_SECRET=...
supabase secrets set GMAIL_REFRESH_TOKEN=...

La EF v10.3 ya tiene la integración lista (función toolEnviarCorreo). Solo se activa cuando las 3 vars están seteadas.

Validá con Diego mandando un correo de prueba a vos mismo.
```

### 7. Validar con Diego

Una vez Pablo configure los 3 secretos, abrí Diego y pedí:

> "Enviá un correo a sistemas@gestionrepchile.cl con asunto 'Prueba Diego v10.3' y cuerpo 'Si recibís esto, Diego ya puede mandar mails.'"

Diego debe responder algo como: *"Listo, enviado. Message ID: 18f...XYZ"*

---

## Lo que Diego puede hacer cuando esté autorizado

| Pregunta tuya | Diego hace |
|---|---|
| "Mandale a HUAL la cotización de cartón" | Redacta + envía con formato profesional |
| "Recordale a Cony la rendición pendiente" | Mail interno con el detalle |
| "Avisale al equipo el cierre de mes" | Mail a varios destinatarios |
| "Pídele a RECICLA SUR LTDA que aclare el precio" | Mail formal con tono apropiado |

---

## Reglas absolutas que sigue Diego al enviar

- **R6 SIEMPRE pedir autorización antes de irreversibles.** Por eso Diego primero redacta + muestra + pide OK explícito. Solo manda si el usuario dice "sí, mandalo".
- **R8 Derivar.** Mails muy delicados (legales, despidos) NO los manda Diego — los pasa a Dyana o Dusan para que los firmen ellos.
- **Logueo total.** Cada mail enviado queda en `curated.diego_audit_log` con request_id, destinatario, asunto y message_id de Gmail.
- **Sin spam.** Diego no manda más de 5 mails en una hora al mismo destinatario sin que vos lo confirmes.

---

## Riesgos / consideraciones

- **Cuotas Gmail API:** 250 unidades de cuota por usuario por segundo. Cada envío = 100 unidades. Para nosotros es más que suficiente.
- **Refresh token expira si:**
  - No se usa por 6 meses → re-autorizar.
  - Dusan revoca acceso en https://myaccount.google.com/permissions.
  - Cambian password de la cuenta.
- **Bouncing:** si un destinatario no existe, Diego ve el error pero el message_id queda en Gmail. Revisar carpeta "No entregado" semanalmente.

---

**Decisión:** D-DIEGO-FIN-001 (firmada Dusan 2026-05-23). Tool en EF: `enviar_correo`. Fallback activo hasta que Dusan termine la autorización OAuth.
