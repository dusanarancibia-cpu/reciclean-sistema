# 06 — Stakeholders

> Con quien se relaciona Dusan diariamente. Espejo del contexto de usuario en `CLAUDE.md`.

---

## Circulo interno (decision)

| Nombre              | Rol                                  | Canal             | Frecuencia       |
|---------------------|--------------------------------------|-------------------|------------------|
| **Dusan Arancibia** | Gerente General (el mismo)           | —                 | —                |
| **Pablo**           | Desarrollador / socio tecnico        | WA + GitHub       | Diaria / semanal |
| **Andrea Rivera**   | Comercial + coordinacion camiones    | WA +56 9 9534 2437| Diaria           |

---

## Equipo en terreno (14 personas total)

### 8 contactos activos (prioridad 1 para Diego v4.2)

Estos son los contactos que mueven el dia a dia en las sucursales. Son los primeros a quienes Diego les pide entrevistas (R.DIE arrancque P3).

Algunos identificados en casos documentados:

| Nombre            | Sucursal / Rol                       | Identificado en caso |
|-------------------|--------------------------------------|---------------------|
| **Ingrid Cancino**| Admin Talca, nivel 2                 | `casos-diego/20260420-ingrid.md` |
| **Jair**          | Terreno (sucursal por confirmar)     | `casos-diego/20260420-jair.md`   |
| **Nicolas**       | Terreno (sucursal por confirmar)     | `casos-diego/20260420-nicolas.md`|
| Andrea Rivera     | Comercial / coordinacion transporte  | (circulo interno arriba)         |
| 4 contactos mas   | Completar cuando se arranque ola 1   | —                   |

### Ola 2 — resto del equipo (6 personas)

Se les habilita Diego despues que los 8 activos hayan hecho al menos 3 entrevistas cada uno.

---

## Sucursales

| Sucursal       | Empresas activas     | Estado                              |
|----------------|----------------------|-------------------------------------|
| Cerrillos      | Reciclean + Farex    | Operativa                           |
| Maipu          | Reciclean + Farex    | Operativa                           |
| Talca          | Reciclean            | Operativa                           |
| Puerto Montt   | Reciclean            | **EN ESPERA** (permisos finales)    |

---

## Clientes compradores (12)

Nombres confirmados del contexto: **HUAL, RESIMEX, FPC, ADASME, POLPLAST, Sorepa, CMPC** (Cordillera CMPC Puente Alto).
Faltan 5 por listar cuando Dusan los complete en una iteracion futura.

Tabla relacional: `precios_cliente` (cliente × material).

---

## Proveedores / generadores de material

Pendiente de estructurar en Fase 2 — **CRM Proveedores** es un objetivo O6 (ver `03-objetivos-y-vision.md`).
Por ahora la relacion vive en WA + memoria del equipo. Ese es exactamente el gap que el CRM viene a cerrar.

---

## Partners tecnicos / herramientas

| Partner        | Rol                                      | Criticidad |
|----------------|------------------------------------------|------------|
| **Supabase**   | BD + Auth + Realtime (proyecto Sao Paulo)| Critica    |
| **Vercel**     | Hosting del frontend                     | Critica    |
| **GitHub**     | Repo publico + CI (push → Vercel)        | Critica    |
| **n8n**        | Workflows Diego (PWxwI2oyCRejxG82)       | Critica    |
| **Anthropic (Claude)** | IA de Diego (Haiku) + Curador (Sonnet) + dev con Claude Code | Critica |
| **Meta Cloud API** | WhatsApp Business API                | Critica    |
| **Make.com**   | Automatizacion RRSS (Fase 4)             | Alta       |
| **Canva**      | Generacion visual (Fase 4)               | Alta       |
| **Buffer**     | Publicacion RRSS (Fase 4)                | Alta       |
| **Google Workspace** | Email + docs (Fase 2)              | Media      |

---

## Stakeholders externos

- **Autoridades / permisos Puerto Montt** — bloqueante para que PM opere.
- **Grupo del equipo en WhatsApp** — canal maestro de anuncios de Dusan.

---

## IAs / asistentes digitales

| Agente                | Rol                                      | Donde vive                       |
|-----------------------|------------------------------------------|----------------------------------|
| **Diego Alonso v4.2** | Asistente WA del equipo                  | n8n workflow `PWxwI2oyCRejxG82`  |
| **Diego-Curador**     | Cron 02:00 — curaduria + auditoria       | n8n workflow aparte              |
| **Claude Code**       | Dev assistant para Dusan (CLI + web + movil) | `dusanarancibia-cpu/reciclean-sistema` |
| **Asistente Comercial** | Frontend en terreno (`/asistente.html`)| Vercel                           |

---

## Mapa rapido de "a quien llamo si..."

| Situacion                                   | Contacto                              |
|---------------------------------------------|---------------------------------------|
| Diego LIVE caido > 30 min                   | Pablo (ultimo recurso)                |
| Coordinar camion                            | Andrea Rivera                         |
| Caso escalado desde sucursal                | Admin de la sucursal → Dusan          |
| Decision comercial grande                   | Dusan solo (dormir 1 noche)           |
| Palabras prohibidas / Puerto Montt          | Dusan solo                            |
| Bug en `/asistente.html` en terreno         | Pablo + Dusan                         |
| Cron Diego-Curador no llego 02:00           | Revisar n8n execution log → Pablo     |
