# Metodo de Resolucion de Casos Tributarios — Reciclean-Farex

> Documento maestro para casos donde un proveedor de material reciclable presenta inconsistencias o discrepancias en la cadena documental tributaria (facturas de compra, factura de venta, cambio de sujeto IVA, giros incompatibles).

**Caso de referencia**: SAMEX SPA (Mayo 2026) — Stretch Film para Lavado, 5 entregas, FC emitidas por Reciclean.

---

## Indice

1. [Cuando aplicar este metodo](#1-cuando-aplicar-este-metodo)
2. [Las 7 fases del metodo](#2-las-7-fases-del-metodo)
3. [Marco normativo de referencia](#3-marco-normativo-de-referencia)
4. [Plantillas y prompts reutilizables](#4-plantillas-y-prompts-reutilizables)
5. [Estructura de carpetas por caso](#5-estructura-de-carpetas-por-caso)
6. [Caso ejemplo: SAMEX SPA (resuelto)](#6-caso-ejemplo-samex-spa-resuelto)

---

## 1. Cuando aplicar este metodo

Activa este metodo cuando se presente **alguno** de los siguientes escenarios:

- Proveedor reclama que la factura debe ser emitida por el (no por Reciclean)
- Existe duda sobre cambio de sujeto IVA (scrap metal, papel/carton, otros)
- Proveedor parece tener giro incompatible con la operacion
- Factura de compra emitida por Reciclean fue rechazada o cuestionada
- Auditoria interna detecta inconsistencias en facturacion historica
- Material entregado por intermediario/transportista (no propietario)

---

## 2. Las 7 fases del metodo

### Fase 1 — Recopilacion de antecedentes

**Objetivo**: Reunir TODA la documentacion del caso antes de analizar.

**Acciones**:
- Solicitar al equipo (Andrea, Nicolas, sucursales) toda la documentacion fisica/digital
- Capturar comunicaciones (WhatsApp, correos, llamadas) del proveedor
- Listar todas las entregas del proveedor (fechas, cantidades, materiales)
- Compilar facturas/guias ya emitidas (numero, monto, fecha)
- Guardar en `negocios/[nombre-caso]/_fuente/`

**Output esperado**: Carpeta organizada con TODOS los documentos originales.

**Checklist**:
- [ ] WhatsApp/correos del proveedor (transcritos o screenshots)
- [ ] Copia de facturas ya emitidas (FC o FV)
- [ ] Guias de despacho de las entregas
- [ ] Datos de contacto del proveedor (RUT, razon social, representante)
- [ ] Cronologia clara de la relacion comercial

---

### Fase 2 — Consulta SII portal

**Objetivo**: Verificar oficialmente la situacion tributaria del proveedor.

**Acciones**:
1. Ingresar a https://zeus.sii.cl/cvc_cgi/stc/getstc
2. Ingresar RUT del proveedor (sin puntos, con guion)
3. Resolver captcha
4. Capturar/imprimir las siguientes secciones:
   - **Inicio de Actividades** (vigencia y fecha)
   - **Actividades Economicas registradas (giros)** — TODAS, no solo las primeras
   - **Documentos Autorizados a emitir** (lista completa de los 19+ posibles)
   - **Direccion comercial registrada**

**Output esperado**: PDF de la consulta SII guardado como `negocios/[caso]/_fuente/consulta-sii-[fecha].pdf`.

**Tip**: Si el portal SII no muestra todas las actividades de inmediato, presionar "Ver mas" o desplegar la tabla completa.

---

### Fase 3 — Analisis de capacidades del proveedor

**Objetivo**: Determinar que puede y no puede hacer el proveedor tributariamente.

**Tabla diagnostica** (a completar para cada caso):

| Pregunta | Respuesta | Implicancia |
|----------|-----------|-------------|
| Tiene Inicio de Actividades vigente? | Si/No | Si NO: no es contribuyente |
| Cuantos giros registra? | N giros | Listar todos |
| Algun giro relacionado con comercio del material? | Si/No | Si NO: no puede emitir factura de venta del material |
| Esta autorizado para emitir Factura de Compra (FC)? | Si/No | Si NO: no es comprador habitual de usados |
| Esta autorizado para emitir Factura de Venta? | Si/No | Estandar: si |
| Aparece como Agente Retenedor (Res. Ex. 42/2018)? | Si/No | Si SI: aplica regimen especial scrap metal |
| Tipo de material que entrega | [tipo] | Define resolucion aplicable |

**Decision**: A partir de la tabla, identificar **el rol real del proveedor**:
- Vendedor habitual con giro compatible
- Vendedor habitual con giro incompatible (necesita ampliar)
- Transportista/intermediario (vendedor real es un tercero)
- Otro (consultar especialista)

---

### Fase 4 — Investigacion normativa

**Objetivo**: Identificar la(s) norma(s) tributaria(s) aplicables al material y operacion.

**Marco general**:
- **DL 825/1974 Art. 3°** — Define sujeto vendedor obligado a emitir factura
- **Codigo Tributario Art. 68** — Obligacion de declarar giros y modificarlos
- **Ley 19.034** — Modificaciones al objeto social

**Resoluciones de Cambio de Sujeto IVA** (CRITICO — dependen del material):

| Material | Resolucion Exenta SII | Aplica? |
|----------|-----------------------|---------|
| Papel y carton para reciclaje | N° 29/2005 | Si |
| Scrap metal / Chatarra | N° 42/2018 | Si |
| Construccion (ciertos casos) | N° 142/2005 | Solo construccion |
| Trigo, berries, legumbres, madera | Diversas (3338/1992 a 141/2019) | Caso por caso |
| **Plastico reciclado** | **NO EXISTE** | **Aplica regla normal DL 825** |
| **Otros materiales** | **NO EXISTE** | **Aplica regla normal DL 825** |

**Regla clave**:
- Si el material **SI tiene** Res. Ex. de cambio sujeto IVA → **comprador (Reciclean) emite factura de compra** y retiene IVA
- Si el material **NO tiene** Res. Ex. → aplica DL 825 → **vendedor emite factura de venta** (Reciclean solo emite FC si vendedor no puede)

---

### Fase 5 — Busqueda jurisprudencial

**Objetivo**: Encontrar precedentes que respalden la posicion (defensiva u ofensiva).

**Fuentes**:
- Tribunal Tributario y Aduanero — https://www.tta.cl/fallos_relevantes/
- Jurisprudencia SII — https://www.sii.cl/normativa_legislacion/jurisprudencia_judicial/
- Oficios SII Subdireccion Normativa — vinculantes para casos similares
- Anuarios de Derecho Tributario UDP

**Precedentes ya identificados (caso SAMEX)**:

| Caso | Tema | Aplicabilidad |
|------|------|---------------|
| jj4204 (Palma Guajardo) | Giro incompatible — facturas rechazadas | Analogico |
| jj4350 | Transportista sin documentacion | Tangencial |
| Res. Ex. 154/2025 | Correccion por error de emisor | Vinculante |
| Res. Ex. 45/2003 | Procedimiento Notas de Credito | Vinculante |

---

### Fase 6 — Identificacion de escenarios

**Objetivo**: Dado que el proveedor no siempre cae en una unica categoria, plantear los escenarios posibles y la accion para cada uno.

**Plantilla de escenarios (caso SAMEX)**:

| Escenario | Condicion | Accion |
|-----------|-----------|--------|
| **A** | Proveedor es propietario del material | Proveedor amplia giro via F4415 + emite FV. Reciclean valida el cambio. |
| **B** | Proveedor es transportista (vendedor = tercero) | NC para anular FC actuales + factura del vendedor real |
| **C** | Material cae bajo cambio sujeto IVA | Reciclean SIEMPRE emite FC (correcto) |
| **D** | Material no cae bajo cambio sujeto IVA + proveedor sin giro | Trabajar con asesor tributario externo |

**Output esperado**: Decision-tree clara — UNA pregunta clave que el proveedor debe responder para definir la ruta.

---

### Fase 7 — Resolucion y comunicacion

**Objetivo**: Cerrar el caso con documentacion firmada por Gerencia.

**Entregables obligatorios**:

1. **Memo diagnostico interno** (`negocios/[caso]/analisis/memo-diagnostico.md`)
   - Audiencia: equipo Reciclean + asesor tributario externo
   - Contenido: hallazgos, marco legal, escenarios, recomendacion

2. **Carta formal de Gerencia** (`negocios/[caso]/resolucion/carta-gerencia.pdf`)
   - 2 hojas maximo
   - Logos Reciclean + Farex
   - Firma: Dusan Arancibia, Gerente General
   - UNA pregunta clave al proveedor (no acusatorio)

3. **Presentacion ejecutiva** (`negocios/[caso]/resolucion/presentacion-ejecutiva.pdf`)
   - 3 paginas maximo
   - Audiencia: equipo interno + asesor
   - Linea de tiempo + analisis + accion

4. **Acciones internas registradas**:
   - Agendar reunion con asesor tributario externo
   - Auditoria de FC ultimos 12 meses (Nicolas Admin)
   - Documentacion preparada para eventual consulta SII

5. **Commit en repo** rama `claude/[caso]-tax-docs-XXX`:
   - Ramificar desde main
   - Commit todos los archivos del caso
   - PR para revision Gerencia antes de merge

---

## 3. Marco normativo de referencia

### Normas marco
- **DL 825/1974** — Ley sobre Impuesto a las Ventas y Servicios
- **DL 830/1974** — Codigo Tributario
- **Ley 19.034** — Modificaciones al objeto social

### Resoluciones Exentas SII relevantes (cambio sujeto IVA)
- N° 3338/1992
- N° 1341/2000, N° 3311/2000, N° 3722/2000, N° 4095/2000, N° 4916/2000, N° 5282/2000
- N° 29/2005 (papel y carton reciclable) — **clave para Reciclean**
- N° 55/2005 (berries — derogada)
- N° 58/2006
- N° 142/2005 (construccion)
- N° 189/2010, N° 192/2010
- N° 86/2016
- N° 42/2018 (scrap metal) — **clave para Reciclean/Farex**
- N° 141/2019
- N° 154/2025 (correccion por error de emisor en transporte)

### Resoluciones de procedimiento
- N° 45/2003 — Notas de Credito Electronicas (correccion errores)
- N° 117/2024 — FC obligatoria para vendedores habituales de usados

---

## 4. Plantillas y prompts reutilizables

Ver carpeta `negocios/_metodo/`:

- `plantilla-carta-gerencia.md` — Estructura editable de carta formal
- `plantilla-consulta-sii.md` — Prompt para guia de consulta SII
- `plantilla-memo-diagnostico.md` — Estructura de analisis interno
- `plantilla-presentacion-ejecutiva.md` — Slides 3 paginas
- `checklist-caso-tributario.md` — Checklist completa de 7 fases

---

## 5. Estructura de carpetas por caso

```
negocios/
├── _metodo/                                    ← plantillas reutilizables (NO editar caso por caso)
│   ├── plantilla-carta-gerencia.md
│   ├── plantilla-consulta-sii.md
│   ├── plantilla-memo-diagnostico.md
│   ├── plantilla-presentacion-ejecutiva.md
│   └── checklist-caso-tributario.md
│
└── [nombre-caso]/                              ← un directorio por caso (ej: samex/)
    ├── README.md                               ← resumen ejecutivo del caso
    ├── _fuente/                                ← documentos originales
    │   ├── whatsapp-conversaciones.txt
    │   ├── facturas-emitidas/
    │   ├── consulta-sii-[fecha].pdf
    │   └── correos-comunicaciones/
    ├── analisis/                               ← trabajo de analisis
    │   ├── memo-diagnostico.md
    │   ├── tabla-diagnostica.md
    │   └── escenarios.md
    └── resolucion/                             ← entregables firmados
        ├── carta-gerencia.pdf
        ├── carta-gerencia-editable.docx
        ├── presentacion-ejecutiva.pdf
        └── acciones-internas.md
```

---

## 6. Caso ejemplo: SAMEX SPA (resuelto)

**Resumen**:
- Proveedor: SAMEX SPA, RUT 76.629.600-9
- Material: Stretch Film para Lavado (plastico reciclado)
- Entregas: 5 (3 facturadas con FC por Reciclean, 2 pendientes)
- Conflicto: SAMEX argumenta que ellos deben emitir factura

**Hallazgos clave**:
1. SAMEX tiene 7 giros — TODOS de transporte/logistica (cero comercio)
2. SAMEX NO esta autorizado para emitir Factura de Compra (19 docs revisados)
3. SAMEX NO aparece como Agente Retenedor SII
4. Plastico reciclado NO tiene Res. Ex. de cambio sujeto IVA
5. Aplica regla normal DL 825 Art. 3° → vendedor emite factura

**Pregunta clave para SAMEX**:
> "Es SAMEX propietario del material o transportista por cuenta de un tercero?"

**Resolucion segun respuesta**:
- Si propietario → ampliar giro F4415
- Si transportista → identificar vendedor real + NC + factura del tercero

**Ver detalle completo**: `negocios/samex/`

---

**Documento mantenido por**: Gerencia Reciclean-Farex
**Ultima actualizacion**: Mayo 2026 (caso SAMEX)
**Proxima revision**: Cuando se presente nuevo caso o cambio normativo SII
