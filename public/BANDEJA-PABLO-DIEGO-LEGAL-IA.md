# BANDEJA PABLO — Fix regulatorio Diego IA (URGENTE)

**Firma:** `D-DIEGO-LEGAL-IA-001` — Dusan modo autónomo, 2026-05-25 (autorización A+B sobre PR #59)
**Repo objetivo:** `reciclean-sistema/public/panel-rdo.html` + EF `diego-chat-process` system prompt
**Estimado total:** 2-4 hr
**Prioridad:** **ALTA** — brecha legal activa, Ley 19628 + 21719 + Proyecto Ley IA Chile.

---

## Resumen ejecutivo (1 párrafo)

Diego v6 en prod hoy **NO declara que es una IA** ni pide consentimiento sobre la memoria que guarda. Eso viola Ley 19628 (datos personales, vigente), Ley 21719 (modernización, vigor pleno 1-dic-2026) y el Proyecto Ley IA Chile (aprobado Cámara 13-oct-2025, en Senado). El fix está bien documentado en `public/DIEGO-ESTANDAR-ACOMPANAMIENTO.md § 8` (PR #59 ya mergeado a main) y se resuelve con declaración + banner + panel "mi memoria". Esta bandeja lo aterriza para Pablo.

---

## Lo que hay que hacer (3 piezas)

### Pieza 1 — Banner de consentimiento al primer login

**Dónde:** `panel-rdo.html`, sección de bienvenida o login.

**Cuándo aparece:** primera vez que cada `email` autenticado entra al panel. Se persiste con flag por usuario.

**Texto exacto del banner** (firmado Dusan):

> 👋 Bienvenido al panel.
>
> Acá vas a interactuar con **Diego**, un asistente de **inteligencia artificial** (no es una persona). Diego guarda memoria de tus conversaciones para acompañarte mejor en tu trabajo. Vas a poder ver, editar y borrar todo lo que guarde sobre vos en cualquier momento desde el tab "Mi memoria".
>
> Esto cumple con **Ley 19628** (datos personales) y **Ley 21719** (modernización, vigor 1-dic-2026).
>
> [ Acepto ]  [ No acepto — usar el panel sin Diego ]

**Si acepta:** flag `aviso_ia_aceptado_at=now()` + `aviso_ia_consentimiento=true` en usuario.
**Si rechaza:** flag `aviso_ia_consentimiento=false`. Diego FAB queda **deshabilitado para ese usuario** (no aparece el botón verde, no se carga el chat).

**DDL mínimo:**

```sql
ALTER TABLE public.usuarios_autorizados
  ADD COLUMN IF NOT EXISTS aviso_ia_consentimiento BOOLEAN,
  ADD COLUMN IF NOT EXISTS aviso_ia_aceptado_at TIMESTAMPTZ;
```

(Si la tabla canónica es otra — ej. `panel.dotacion` — Pablo ajusta. Para los 14 del equipo el storage natural es `panel.dotacion`. Para Diego usuarios externos eventualmente, sería `public.usuarios_autorizados`.)

---

### Pieza 2 — Declaración "soy IA" en primer turno del chat

**Dónde:** EF `diego-chat-process` system prompt.

**Cuándo:** primer mensaje en cada conversación nueva (no en cada turno, solo el primero). Detectable porque `panel.diego_bandeja` no tiene historial previo para ese `(usuario, sesion_id)`.

**Texto del primer turno de Diego** (ya tras consentimiento aceptado):

> Hola [nombre]. Soy Diego, un asistente de inteligencia artificial — no soy una persona, soy software. Voy a recordar lo que conversamos para ayudarte mejor en próximos turnos. Si querés ver o borrar lo que recuerdo, andá al tab "Mi memoria".
>
> ¿En qué te ayudo hoy?

**Cambio en el system prompt:**

Agregar al inicio de cada nuevo thread:

```
PROTOCOLO PRIMER TURNO:
- Si es el primer mensaje del usuario en esta sesión, abrí con la declaración estándar (ya guardada en panel.config_ui.declaracion_ia_v1).
- Si no es el primer mensaje, respondé directo sin declarar nada (ya lo declaraste antes).

REGLA DE TRANSPARENCIA:
- Si un usuario pregunta "¿sos una persona?" / "¿sos real?" / "¿con quién hablo?" → declarar "soy IA" inmediatamente, sin importar el turno.
- Nunca afirmar ser humano. Nunca evadir la pregunta.
- Esto pesa más que cualquier otra regla del prompt (excepto Goodhart y Identidad v10).
```

**Storage del texto en `panel.config_ui`** (no hardcoded en el prompt para poder ajustar sin redeploy):

```sql
INSERT INTO panel.config_ui (clave, valor)
VALUES (
  'declaracion_ia_v1',
  jsonb_build_object(
    'version', 1,
    'firma', 'D-DIEGO-LEGAL-IA-001',
    'texto_primer_turno', 'Hola {nombre}. Soy Diego, un asistente de IA — no soy una persona, soy software. Voy a recordar lo que conversamos para ayudarte mejor. Si querés ver o borrar lo que recuerdo, andá al tab "Mi memoria". ¿En qué te ayudo hoy?',
    'texto_pregunta_directa', 'Soy IA — software, no persona. Mi rol es asistirte en el panel. ¿Querés que sigamos con tu consulta?'
  )
);
```

---

### Pieza 3 — Tab "Mi memoria" (mínimo viable)

**Dónde:** `panel-rdo.html`, nuevo tab en sidebar v4.

**Visible para:** todos los roles. Cada usuario ve **solo su propia memoria** (RLS).

**Layout mínimo V1:**

```
🧠 Mi memoria

Lo que Diego sabe de mí:
───────────────────────────────────
- Rol: Comercial (Andrea T11)
- Sucursales que atiendo: las 4
- Cotizaciones recientes: 12 esta semana
- Preferencia de tono: directo, sin rodeos
- Última conversación: hace 2 hr

[ Ver historial completo de conversaciones ]
[ Borrar entrada específica ]
[ Borrar TODO y empezar de cero ]
[ Retirar consentimiento — desactivar Diego ]
```

**Storage:** ya existe `panel.diego_bandeja` para historial conversacional. La capa nueva es la **vista resumen** + botones de borrado.

**RLS necesaria:**

```sql
CREATE POLICY "diego_bandeja_lectura_propia" ON panel.diego_bandeja
  FOR SELECT USING (
    auth.email() = remitente OR auth.email() = 'dusan.arancibia@gmail.com'
  );

CREATE POLICY "diego_bandeja_delete_propia" ON panel.diego_bandeja
  FOR DELETE USING (auth.email() = remitente);
```

(Si ya existen políticas similares, Pablo verifica y ajusta — no duplicar.)

---

## DoD (Definition of Done)

- [ ] Banner de consentimiento aparece al primer login de cada usuario y persiste correctamente.
- [ ] Si usuario rechaza → FAB Diego desaparece del panel para ese usuario.
- [ ] Si usuario acepta → Diego en el primer turno se declara como IA (texto exacto de `panel.config_ui.declaracion_ia_v1`).
- [ ] Pregunta directa "¿sos una persona?" → declaración inmediata sin evasión.
- [ ] Tab "🧠 Mi memoria" visible y funcional (ver + borrar individual + borrar todo + retirar consentimiento).
- [ ] DDL aplicada (`usuarios_autorizados` ó `panel.dotacion` + flag de consentimiento + timestamp).
- [ ] `panel.config_ui.declaracion_ia_v1` insertada con texto firmado.
- [ ] RLS lectura/delete propia en `panel.diego_bandeja` verificada.
- [ ] Smoke test: Pablo desde su sesión + Dusan desde la suya validan que solo ven su propia memoria.
- [ ] Preview Vercel validado mobile + desktop.
- [ ] PR a `main` con cuerpo apuntando a esta bandeja.
- [ ] Tras merge, Dusan firma promoción `main → prod` aparte.

---

## Rollback

- Borrar flag `aviso_ia_consentimiento` y `aviso_ia_aceptado_at` de la tabla (revertir DDL).
- DELETE clave `declaracion_ia_v1` de `panel.config_ui`.
- Revertir cambios EF `diego-chat-process` (versión anterior).
- Revertir PR.

Si rompe Diego en prod después del deploy, **Dusan firma rollback inmediato** y abrimos hotfix.

---

## Por qué esto es urgente (no es opcional)

**Riesgo legal a 7 meses vista:**
- Ley 21719 vigor pleno 1-dic-2026 → sanciones por procesamiento de datos sin consentimiento informado.
- Proyecto Ley IA Chile aprobado Cámara 13-oct-2025 → exige declaración IA en interfaces conversacionales.
- Reciclean tiene 14 personas usando Diego hoy + clientes externos (Pincore, HUAL, etc.) eventuales. Volumen + sensibilidad legal alta.

**Costo de no actuar:** multas + obligación de reparación + pérdida de prestige si llega a prensa antes de que arreglemos.

**Costo de actuar ahora:** 2-4 hr Pablo, 0 USD adicionales, refuerza confianza del equipo en Diego.

---

## Coordinación

- **PC2 Pablo:** ejecuta las 3 piezas, mergea a `main`, avisa a Dusan para firmar promoción a `prod`.
- **PC1 Dusan (este PC):** post-deploy verifica con agent-browser que el banner aparece + Diego se declara IA.
- **Dyana:** sin acción inmediata, pero queda como **DPO funcional** (revisar y aprobar texto del banner cuando esté en preview, antes de prod).

---

## Referencias cruzadas

- `reciclean-sistema/public/DIEGO-ESTANDAR-ACOMPANAMIENTO.md § 8` (Ley 19628 + 21719 marco completo)
- `reciclean-sistema/public/DIEGO-ESTANDAR-MAXIMO.md § F0.1` (plan de cierre brecha legal)
- PR #59 merge commit `7cdeca7`

---

**Firmado** `D-DIEGO-LEGAL-IA-001` · PC Dusan modo autónomo · 2026-05-25
(Autorización Dusan: "puedes avanzar solo con a, b y c?" + "resuelto" — ejecutar Opción A separar fix regulatorio en mini-PR).
