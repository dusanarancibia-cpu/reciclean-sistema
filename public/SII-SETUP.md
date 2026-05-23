# Setup acceso al SII — para Diego (consultar RUTs)

> Habilita que Diego consulte el SII chileno para verificar razón social, actividad, categoría, situación tributaria de cualquier RUT (generadores nuevos, competidores, proveedores).
> **Quién debe hacerlo:** Dusan. **Tiempo estimado:** 30 minutos. **Costo:** $0.

---

## Resumen en 5 puntos

1. Diego necesita un acceso a SII para consultar RUTs sin que vos tengas que entrar manualmente cada vez.
2. El SII NO tiene API pública oficial. Lo que se hace es scraping autenticado con un subusuario.
3. Dusan crea un subusuario en SII solo de lectura, asociado al RUT de Reciclean.
4. Las credenciales (`SII_USUARIO` + `SII_CLAVE`) se las pasa a Pablo, que las configura como secretos de Supabase.
5. Cuando estén configuradas, Diego responderá preguntas como "Consultá el RUT 76.123.456-7" con razón social y actividad económica reales.

---

## Paso a paso

### 1. Entrar a SII

- URL: https://www.sii.cl
- Iniciar sesión con el RUT de **Reciclean S.A.** + clave tributaria del representante legal (Dusan).
- Si no tenés clave tributaria, primero recuperala en sii.cl/PEP/asistencia.

### 2. Crear subusuario solo lectura

- Menú: "Mi Sii" → "Servicios online" → "Clave Tributaria y Representantes Electrónicos" → "Administración de usuarios autorizados".
- Crear nuevo usuario:
  - RUT del subusuario: si no tenés un RUT separado, podés usar el de Diego como persona "ficticia" o el RUT personal de Dusan (no ideal pero funciona).
  - Permisos: SOLO lectura. **Nunca** dar permiso de envío/declaración/pago.
  - Servicios permitidos: "Consulta Situación Tributaria de Terceros" (eso es lo único que Diego necesita).
- SII te devuelve un usuario+clave para el subusuario.

### 3. Probar el subusuario manualmente

- Cerrar sesión.
- Entrar de nuevo con el subusuario.
- Verificar que SOLO ve la consulta de situación tributaria (no debe poder declarar ni pagar).
- Si tiene más permisos: volver a paso 2 y restringir.

### 4. Pasarle las credenciales a Pablo

Mandale a Pablo este mensaje:

```
Pablo, credenciales SII subusuario lectura:

SII_USUARIO = <rut-subusuario>
SII_CLAVE = <clave>

Configuralas como Supabase Secrets:

supabase secrets set SII_USUARIO=<rut-subusuario>
supabase secrets set SII_CLAVE=<clave>

Después implementá la integración de scraping autenticado en la EF diego-chat-process (tool consultar_sii).
Recomiendo:
- Login SII vía POST a https://zeusr.sii.cl//cgi_AUT2000/CAutInicio.cgi
- Sesión cookie + scrape de la página "Consulta Situación Tributaria de Terceros"
- Caché de 24h en Supabase tabla panel.sii_cache para no spamear al SII

Validá con Diego:
  > Consultá el RUT 76.123.456-7
```

### 5. Validar con Diego

Una vez Pablo termine el scraping, abrí Diego y preguntá:

> "Consultá el RUT 76.543.210-K en el SII"

Diego debería responder con razón social, actividad económica, categoría tributaria y situación (vigente / no vigente).

---

## Lo que Diego puede hacer cuando esté configurado

| Pregunta tuya | Diego responde con |
|---|---|
| "Consultá el RUT 77.123.456-7" | Razón social + actividad + categoría + situación |
| "¿Esa empresa RECICLA SUR LTDA está vigente?" | Diego saca RUT del CRM o de inteligencia_competitiva → consulta SII |
| "Antes de cotizar, verificá RUT 99.111.222-3" | Validación previa a cualquier nueva relación comercial |
| "¿Cuál es la actividad económica de HUAL?" | Glosa SII (papel/cartón, ferretería, etc.) |

---

## Alternativas si no querés scraping SII

Algunas opciones pagas con API estable:

| Proveedor | Costo aprox | Pros |
|---|---|---|
| LibreDTE | $50 USD/mes | API REST limpia + DTE incluido |
| FactureChile / Khipu DTE | Variable | Para si después querés emitir DTE desde Diego |
| Scraping propio (gratis) | $0 | Más frágil, depende de que SII no cambie HTML |

**Recomendación:** empezar con scraping (gratis), migrar a API paga si volumen lo justifica.

---

## Riesgos / consideraciones

- **Privacidad:** SII tiene rate-limit no documentado. Si superamos ~100 consultas/hora, podrían bloquear el subusuario.
- **Términos:** scraping al SII está en zona gris legal. No está prohibido explícitamente pero tampoco está autorizado. Para uso interno (validar generadores) es razonable; para revender datos es problema.
- **Auditoría:** Diego loguea cada consulta SII en `curated.diego_audit_log` para trazabilidad.

---

**Decisión:** D-DIEGO-FIN-001 (firmada Dusan 2026-05-23). Tool en EF: `consultar_sii`. Bloqueado hasta que Dusan provea credenciales + Pablo implemente scraping.
