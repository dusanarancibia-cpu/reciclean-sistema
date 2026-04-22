# 01 — Identidad: Quien es Dusan

> Equivalente al bloque "Personalidad y tono" del spec Diego v4.2.
> Aqui describimos a Dusan como persona — no como rol.

---

## Datos duros

| Campo                  | Valor                                             |
|------------------------|---------------------------------------------------|
| Nombre                 | Dusan Arancibia                                   |
| Rol                    | Gerente General, Grupo Reciclean-Farex            |
| Pais / zona horaria    | Chile, America/Santiago                           |
| WhatsApp personal      | +56 9 6192 6365                                   |
| Email                  | comercial@gestionrepchile.cl (unificado empresa)  |
| Idioma de trabajo      | Espanol (siempre)                                 |
| Base de operaciones    | Chile — opera 4 sucursales en paralelo            |

---

## Como se define

**En una frase:**
> Gerente general operativo que construye sistemas que combinan tecnologia + equipo humano + procesos documentados para escalar un negocio de reciclaje industrial sin perder el control fino.

**En 3 palabras:** **Constructor. Meticuloso. Pragmatico.**

---

## Valores y principios operativos

1. **La operacion real manda** — un sistema que no funciona en terreno (camion, sucursal, cliente) no sirve, por muy elegante que sea el codigo.
2. **El equipo primero** — 14 personas son mas importantes que cualquier bot. Herramientas que frustran al equipo se revierten.
3. **Validacion antes de automatizar** — cualquier contenido generado por IA pasa por el antes de ser publicado (patron Diego-Curador).
4. **Backup antes de tocar** — nunca modificar algo critico sin respaldo previo (aplica a codigo, workflows, BD y mensajes).
5. **Honestidad operativa** — si algo no esta listo (Puerto Montt, una feature, un bot), se dice. No se pinta de verde lo amarillo.
6. **Rollback siempre disponible** — todo despliegue tiene plan de reversion documentado.
7. **Comunicacion directa, sin rodeos** — mensajes cortos, claros, con proximo paso explicito.

---

## Estilo de trabajo

- **Horario pico operativo:** 08:00 - 20:00 hrs Chile, con ventanas de foco 08:00-10:00 y 18:00-22:00 (esta ultima para implementaciones tecnicas, como la del 21-abr).
- **Canal principal:** WhatsApp (equipo + clientes + proveedores + Claude Code via movil).
- **Canal tecnico:** Claude Code (CLI + web) sobre el repo `dusanarancibia-cpu/reciclean-sistema`.
- **Documenta todo:** TAREAS.md, PENDIENTES.md, docs/*.md, casos-diego/, mensajes-equipo/.
- **Toma decisiones rapidas pero las etiqueta LOCK** — una vez decidido, no se re-abre sin razon fuerte.

---

## Como prefiere que le hablen (humanos y IAs)

- **En espanol.** Sin excepcion.
- **Sin emojis innecesarios.** Solo cuando aportan claridad (checklists, status).
- **Respuestas cortas primero, detalle despues** si lo pide.
- **Accionable >= explicativo.** Prefiere "haz X, luego Y" antes que "una opcion seria..."
- **Sin sobre-promesas.** Si algo tiene riesgo, se dice (patron "Riesgo: alto" de la guia 21-abr).
- **Etiquetas claras:** `[LOCK]`, `[PENDIENTE]`, `[BLOQUEO]`, `[APROBADO]`, `[ROLLBACK]`.

---

## Fortalezas

- Vision de sistema completo (tecnologia + operacion + comercial + equipo) — no se pierde en el detalle tecnico ni en la mera gestion.
- Capacidad de mantener contexto entre sesiones via documentacion (BRIEFs, specs, PENDIENTES.md).
- Disposicion a aprender herramientas nuevas (Claude Code, n8n, Make, Supabase) sin ser desarrollador de profesion.
- Piensa en riesgos y rollback desde el diseno.

---

## Limites auto-impuestos (auto-conciencia)

- No es desarrollador full-time — por eso Pablo existe.
- No va a hacer cambios criticos en horario laboral sin aviso previo al equipo (regla del 21-abr: aviso al grupo 08:00-10:00).
- No delega la validacion de contenido publico — Palabras prohibidas + Puerto Montt estado = responsabilidad personal.
- No firma decisiones irreversibles de negocio sin dormir una noche primero (excepcion: urgencias).

---

## Frase ancla

> "Sin backup no se toca. Sin aviso al equipo no se despliega. Sin Dusan validando no se publica."

Esa es la regla operativa. Si una IA / asistente / persona nueva la viola, esta fuera de contrato.
