# DIEGO v9 — Estándar Legal y Tributario 2026

> Investigación de los más altos estándares mundiales 2025-2026 para chatbots de asistencia legal y tributaria, aplicada al Grupo Reciclean-Farex-SERCOT (Chile).
>
> **Autor:** Legal Compliance Checker · **Fecha:** 23-may-2026 · **Versión:** 1.0 · **Para:** Diego v9
>
> **REGLA DE ORO grabada a fuego:** Diego NUNCA INVENTA. Si no sabe → "no sé, voy a consultar a Dyana" + escalar. Esta regla aplica en cada una de las 5 áreas de este documento.

---

## Resumen ejecutivo (5 puntos)

1. **SII Chile ya tiene API oficial + 4 proveedores comerciales** (BaseAPI, Floid, SimpleAPI, API Gateway) que permiten consultar carpeta tributaria, RUT, deudas Tesorería y DTEs con consentimiento del contribuyente. Diego v9 puede integrarse vía REST en 1-2 días sin tocar el SII directamente.
2. **Ley REP 20.920 entró en fase sancionatoria en 2025** vía sistema SISREP de la SMA. La SMA dejó de "acompañar" y comenzó a multar. Diego debe saber traducir un caso real (ej: "Pincore declaró 12 t de polietileno") a obligación REP (categoría, meta de valorización, plazo SISREP).
3. **Harvey AI y Spellbook fijaron el estándar 2026** para revisión de PDFs legales: extracción de cláusulas + comparación contra normativa vigente + flags de inconsistencia, todo con citación de fuente primaria. Harvey opera 25.000+ agentes custom; Spellbook revisó cientos de miles de contratos en 30 países.
4. **Los disclaimers ya NO protegen al chatbot** (Nippon Life v. OpenAI, marzo 2026, USD 10.3M). New York SB 7263 y otros 12 estados USA prohíben que un chatbot dé "respuesta sustantiva" que equivalga a práctica no autorizada de derecho. Diego debe rechazar interpretación legal vinculante con escalación obligatoria.
5. **Tasa de alucinación de IA legal especializada sigue siendo alta**: 33% en Westlaw AI, 17% en Lexis+ AI (Stanford RegLab). Más de 729 incidentes documentados en cortes USA, sanciones de USD 2.500 → USD 110.000 en un trimestre. Diego v9 debe forzar verificación humana de toda referencia legal antes de usarla operativamente.

---

## 1. Consultar situación tributaria SII

### Estado del arte 2026

Chile ya tiene infraestructura técnica madura para chatbots tributarios. El SII publicó **Resolución N° 168 (vigente 2-mar-2026)** que formaliza el proceso por el cual entidades pueden verificar que sus usuarios cumplen obligaciones tributarias. Cuatro proveedores comerciales chilenos ofrecen el wrapper REST sobre los servicios del SII: **BaseAPI, Floid, SimpleAPI, API Gateway**. Todos exigen consentimiento documentado del contribuyente.

El estándar internacional 2026 (Klippa, Docsumo, Parseur) para OCR de documentos tributarios combina extracción + validación contra base autoritativa + flag automático de inconsistencias (mismatch de RUT, montos, fechas). En Chile esto se traduce a: extraer PDF de Carpeta Tributaria → cruzar con `RUT + giro` en base SII → marcar si hay deuda o no.

### Comparativa de proveedores API SII (2026)

| Proveedor | Cobertura | Precio orientativo | Sandbox | Recomendación Reciclean |
|-----------|-----------|--------------------|---------|------------------------|
| **BaseAPI** | RCV, DTEs, Previred, TGR, honorarios, e-invoicing | Por consulta (volumen) | Sí, gratis | Más completo, mejor docs en español |
| **Floid** | Validación tributaria, fintech-friendly | Por consulta | Sí | Bueno si Reciclean abre subproducto fintech |
| **SimpleAPI** | Integración general SII | Plan mensual | Limitado | Económico para volúmenes bajos |
| **API Gateway** | Multi-fuente (SII + Previred + más) | Enterprise | Sí | Si se quiere centralizar todo el grupo en un solo contrato |

**Recomendación operativa Reciclean-Farex:** BaseAPI por documentación en español, sandbox gratuito y endpoint dedicado a Carpeta Tributaria que es el caso de uso #1 para evaluación de generador / valorizador / cliente nuevo.

### Protocolo Diego v9 — Autorización previa obligatoria

```
PASO 1 — Diego pide consentimiento explícito antes de cualquier consulta:
"Para consultar tu situación tributaria en SII necesito:
 (a) tu RUT, (b) autorización explícita escrita acá en el chat.
 Los datos se guardan cifrados, se borran a los 30 días, y solo Dyana puede verlos.
 ¿Autorizás? Respondé SÍ / NO."

PASO 2 — Si SÍ → Diego llama a BaseAPI o Floid con RUT.
PASO 3 — Diego presenta resultado SIN interpretar:
 "Estado SII (consultado HH:MM): [activo/no contribuyente/con deuda].
  Yo no interpreto. Para entender qué hacer con esto, te derivo a Dyana."
PASO 4 — Diego registra log de consentimiento en Supabase (audit trail GDPR/Ley 19.628).
```

### Aplicado a Reciclean

**Caso real:** Andrea (comercial) consulta a Diego "¿Pincore está al día con SII?" antes de cotizarles cobre. Diego responde: "Necesito autorización de Pincore o que esto sea para evaluación interna de riesgo crediticio (lo cual Dyana firmó como caso de uso válido el [fecha]). ¿Cuál es el caso?". Si Andrea confirma "evaluación interna", Diego consulta la API y devuelve estado bruto + cita Dyana para interpretación.

**Lo que Diego NO hace:** decir "Pincore tiene deuda fiscal de 12M, no les vendamos". Eso es interpretación crediticia vinculante. Diego pasa el dato, no la conclusión.

### Cumplimiento Ley 19.628 (Chile) + GDPR

Cualquier consulta SII desde Diego cae bajo Ley 19.628 (datos personales Chile, modernizada 2024) y GDPR si hay flujo de datos a UE (poco probable en Reciclean pero relevante si el contribuyente consultado es ciudadano UE). Requisitos mínimos:

- **Consentimiento informado, expreso y específico** por cada consulta (no consentimiento global). Doble opt-in si la consulta toca terceros.
- **Auditoría 100% de consentimientos.** Tabla `panel.diego_audit_log` con `rut_consultado`, `solicitante`, `timestamp`, `consentimiento_texto`, `consentimiento_evidencia_hash`.
- **Retención limitada.** Máximo 30 días el dato extraído. Después, hash anonimizado para trazabilidad sin re-identificación.
- **Derecho a borrado.** El contribuyente puede pedir borrado en cualquier momento. Diego debe tener endpoint `/forget?rut=...`.
- **Cifrado en tránsito (TLS 1.3+) y en reposo (AES-256).** Supabase ya provee ambos por defecto.

Las 3 vulnerabilidades GDPR más frecuentes en chatbots (Crescendo AI 2026): (1) ausencia de consentimiento explícito (47% casos), (2) almacenamiento indefinido sin retención (39%), (3) ausencia de mecanismo right-to-erasure (31%). Diego v9 debe cubrir las tres en su diseño base.

### 5 casos operativos SII que Diego v9 debe manejar

1. **Validación de RUT de generador nuevo.** Andrea agrega "Juan Pérez SpA" como generador. Diego pide RUT, consulta BaseAPI, verifica que (a) exista, (b) tenga giro compatible (industrial, comercial, construcción), (c) no esté con inicio de actividades suspendido. Devuelve semáforo verde/amarillo/rojo + sugerencia: "Verde → proceder. Amarillo/rojo → derivar a Dyana antes de emitir guía."
2. **Verificación de DTE recibida de proveedor.** Cony sube factura electrónica de proveedor. Diego extrae folio + RUT emisor, consulta SII, valida (a) folio existe y no anulado, (b) RUT del emisor coincide, (c) fecha dentro del mes tributario. Sin esto, Reciclean podría tomar crédito IVA de factura inválida.
3. **Estado tributario para evaluación de crédito a cliente nuevo.** Andrea quiere abrir línea de crédito a Empresa X. Diego consulta carpeta tributaria (con consentimiento del cliente o caso de uso "evaluación interna" firmado por Dyana), reporta deuda fiscal/Tesorería sin interpretarla. Andrea + Dyana deciden monto.
4. **Renovación de timbraje electrónico.** Diego informa procedimiento (info pública SII), pero NO entra a sii.cl con clave de Reciclean (Dyana hace eso manual). Diego es asistente de información, no operador de cuentas SII.
5. **Cambio de régimen tributario (Pro-Pyme, semi-integrado).** Diego identifica la pregunta, NO responde, escalación amarilla a Dyana con SLA 2h. Acá es 100% interpretación con consecuencia económica grande.

---

## 2. Interpretar Ley REP 20.920

### Estado del arte 2026

La Ley 20.920 de Responsabilidad Extendida del Productor está en **fase sancionatoria** desde 2025. La SMA puso en marcha **SISREP** (Sistema de Reporte REP) el 1-ene-2025 con tres etapas: (1) registro de Sistemas de Gestión, (2) reporte de cantidades valorizadas, (3) consumidores industriales. Resolución Exenta 2084/2023 + 2279/2024 fijaron plazos de reporte mensual y contenido obligatorio.

En paralelo, la **EU PPWR (Reg. 2025/40)** entra en vigor 12-ago-2026 unificando reglas EPR en los 27 estados miembros. En USA, 7 estados tienen ley EPR (Maine, Oregon, California, Colorado, Minnesota, Maryland, Washington). El patrón global: gobiernos invirtiendo en sistemas de reporte automatizado con detección de anomalías e integración a aduana + IVA. No hay chatbot oficial REP en Chile; los productores resuelven dudas con consultoras (Carey, Prieto, Anvier, Zarey).

### Protocolo Diego v9 — Traducir caso a obligación

Diego debe saber traducir un caso a las **3 preguntas REP**:

```
¿Es productor según Ley 20.920?  → introduce producto prioritario al mercado nacional
¿Qué categoría es?               → envases/neumáticos/aceites/baterías/pilas/AEE
¿Meta de valorización vigente?  → mirar decreto específico (DS 12 envases, DS 8 neumáticos...)
```

**Cuando Diego NO sabe** (en >60% de casos REP la respuesta requiere abogado o consultora especializada), debe responder:

> "Esto cae en Ley REP 20.920. Hay 3 preguntas que no puedo responder sin consultar a Dyana o a [consultora REP del grupo]: (1) categoría exacta del producto, (2) meta vigente por decreto, (3) plazo SISREP del Sistema de Gestión al que estés adherido. Te derivo. ¿Necesitás respuesta urgente?"

### Aplicado a Reciclean

**Caso real:** un generador llama por WhatsApp diciendo "tengo 200 kg de envases plásticos PET, ¿me corresponde REP?". Diego responde con la **escalera de pregunta REP**:

1. ¿Vos los **introdujiste al mercado** (manufacturador/importador) o los **recibiste de consumo** (generador post-consumo)? → solo el primer caso es "productor REP".
2. Si sos productor → ¿estás adherido a un Sistema de Gestión (ej: ReSimple para envases)? Si SÍ → reporte va vía SISREP del SdG. Si NO → contingencia, derivar a Dyana.
3. Si sos generador post-consumo → tu rol es proveer a un valorizador (Reciclean). El reporte REP lo hace el SdG del productor original. Vos podés pedir certificado de valorización para tu trazabilidad.

Diego NO dice cuánto es la meta de valorización del PET en 2026 ni el plazo exacto. Eso lo deriva.

### Mapa rápido de productos prioritarios REP Chile (Diego debe saberlo de memoria)

| Categoría | Decreto Supremo | Meta vigente 2026 | Sistema de Gestión típico |
|-----------|-----------------|------------------|---------------------------|
| Envases y embalajes domiciliarios | DS 12/2020 | 28% (creciendo gradual a 60% en 2034) | ReSimple (multi-marca) |
| Envases y embalajes no domiciliarios | DS 12/2020 | 70% (creciendo) | ReSimple, Pro-REP |
| Neumáticos categoría A (livianos) | DS 8/2019 | 90% año 4 | Gestiona Neumáticos, etc. |
| Neumáticos categoría B (fuera de carretera) | DS 8/2019 | 25% año 4 | íd. |
| Aceites lubricantes | En decreto | Pendiente publicación final | Sistemas en formación |
| Baterías y pilas | En decreto | Pendiente | En formación |
| Aparatos eléctricos y electrónicos (AEE) | En decreto | Pendiente | En formación |

**Lo que Diego puede hacer con esta tabla:** identificar categoría + decreto, citar fuente (bcn.cl), nombrar SdG conocido. **Lo que NO puede hacer:** afirmar que "este productor cumple/incumple" sin acceso a SISREP.

### Diferencia internacional crítica

- **EU PPWR (Reg. 2025/40, vigor 12-ago-2026):** unifica 27 estados miembros, sanciones automatizadas con detección de anomalías cruzando aduana + IVA.
- **USA (7 estados):** Maine, Oregon, California, Colorado, Minnesota, Maryland, Washington. SB 54 California es el más estricto, exige reporte producto-por-producto auditable.
- **Chile (Ley 20.920):** está en fase enforcement post-acompañamiento. SISREP es el equivalente local al sistema unificado europeo, pero todavía solo cubre envases y neumáticos plenamente.

Diego puede mencionar diferencias internacionales si Andrea exporta a UE/USA y consulta. Pero NO interpreta cumplimiento extranjero.

### 5 casos operativos REP que Diego v9 debe manejar

1. **Generador pregunta si debe declarar REP.** Diego aplica la escalera de 3 preguntas. Si la respuesta clara es "no eres productor" → resuelve auto. Si hay duda → escala a Dyana.
2. **Valorizador acreditado quiere emitir certificado a Reciclean.** Diego pide RUT valorizador, verifica acreditación MMA, fecha vigencia. Si todo OK → emite plantilla de certificado. Si falla algo → bloquea + alerta.
3. **Productor cliente de Reciclean pregunta qué meta de valorización aplica.** Diego identifica categoría (envases, neumáticos…), cita el DS correspondiente, da meta vigente nominal y aclara: "para tu producto específico requiere análisis del Sistema de Gestión al que estés adherido. Te paso contacto del SdG si querés."
4. **SMA notifica procedimiento sancionatorio.** Escalación roja inmediata. Diego NO redacta defensa, NO interpreta el cargo, NO opina sobre probabilidad de éxito. Solo: "recibí notificación de SMA, ya avisé a Dyana + Dusan, abogado externo viene en 48h."
5. **Pregunta sobre fronteras grises (ej: cascos de obra, EPP).** Diego responde "no sé si esto es categoría REP, hay debate. Te paso a consultora especializada." Estos casos NO son alucinables; preferir derivación.

---

## 3. Validar documentos legales

### Estado del arte 2026

OCR + cross-check con base pública es estándar industrial 2026 (Klippa, Docsumo, Innovatrics). La técnica: extraer campos del PDF → comparar con base autoritativa → flag de inconsistencia. Aplica a guías de despacho, certificados sanitarios SEREMI, autorizaciones SAG, RUT SII.

**Documentos relevantes en Reciclean:**

| Documento | Base de validación | Inconsistencia típica |
|-----------|-------------------|----------------------|
| Guía de despacho electrónica | SII (folio + RUT emisor) | folio anulado, RUT no contribuyente |
| Autorización transporte residuos | SEREMI Salud regional | vencimiento > fecha actual |
| Certificado destrucción (REP) | Sistema de Gestión (ReSimple, etc.) | RUT valorizador no acreditado |
| Permiso autorización sanitaria | ChileAtiende / SEREMI | rubro no incluye residuos |
| RUT contribuyente (cliente nuevo) | SII vía BaseAPI | RUT inexistente, giro inconsistente |

### Protocolo Diego v9 — Validar PDF

```
PASO 1 — Diego recibe PDF (drag & drop en panel o adjunto WhatsApp).
PASO 2 — OCR extrae campos clave (RUT emisor, folio, fecha, monto, firma).
PASO 3 — Diego cruza:
  - RUT emisor → API SII (vigente / no contribuyente)
  - Folio → SII timbraje electrónico (válido / anulado / inexistente)
  - Fecha → vigencia documento (vencido SÍ/NO)
PASO 4 — Diego presenta tabla de hallazgos SIN concluir:
  "Validación PDF (HH:MM):
   ✓ RUT emisor vigente · ✗ Folio NO encontrado en SII · ✓ Fecha vigente.
   Hay 1 inconsistencia. Antes de procesar, derivar a Dyana o a Cony (SERCOT)."
PASO 5 — Diego registra hash del PDF + resultado en Supabase para auditoría.
```

### Aplicado a Reciclean

**Caso real:** un valorizador entrega certificado de destrucción de plásticos a Reciclean. Cony (admin SERCOT) sube el PDF al panel. Diego extrae: RUT valorizador, número de certificado, toneladas, fecha. Cruza RUT contra base de valorizadores acreditados MMA. Si NO aparece → flag rojo + "este certificado no es válido para REP, derivar a Dyana". Sin esto, Reciclean podría reportar valorización inexistente y caer en sanción SMA.

**Lo que Diego NO hace:** decir "el certificado es falso". Diego dice "encontré 1 inconsistencia, no puedo concluir, derivá".

### Stack técnico recomendado para OCR + cross-check

| Capa | Opción | Comentario |
|------|--------|------------|
| OCR estructurado | Claude Vision (Anthropic) | Diego ya usa Claude. Mismo proveedor, mismo billing. Excelente con PDFs en español. |
| OCR alternativo | Google Document AI | Plantillas prediseñadas para facturas Chile. Costo por página bajo. |
| OCR tax-specific (mercado global) | Klippa, Docsumo, Parseur | Templates fiscales internacionales, útil si Reciclean exporta. |
| Cross-check RUT/folio | BaseAPI (Chile) | Endpoint específico timbraje electrónico. |
| Cross-check SEREMI | Web scraping monitoreado (sin API oficial) | Pablo debe hacer wrapper resiliente. |
| Audit trail | Supabase tabla `panel.diego_doc_audit` | Hash SHA-256 del PDF + log de validaciones. |
| Notificación Dyana | Webhook WhatsApp Business API | 1 mensaje por inconsistencia detectada. |

### Casos típicos en Reciclean (mes promedio)

- 80-120 guías de despacho electrónicas recibidas de generadores (verificación folio + RUT en SII).
- 15-25 certificados de destrucción emitidos a valorizadores aguas abajo (verificación RUT valorizador acreditado).
- 5-10 autorizaciones SEREMI nuevas o renovaciones de transportistas.
- 3-5 RUTs nuevos de clientes/proveedores que requieren validación inicial.

**Volumen total Diego v9 procesable:** ~150 documentos/mes. A 30 segundos OCR + 10 segundos cross-check = ~100 minutos/mes de procesamiento automático. Hoy Cony y Dyana hacen esto manual en ~12 horas/mes. **Ahorro estimado: 11 horas/mes.**

### Estructura de la tabla audit `panel.diego_doc_audit` (propuesta)

```sql
create table panel.diego_doc_audit (
  id              bigserial primary key,
  doc_hash        text not null,             -- SHA-256 del PDF
  doc_tipo        text not null,             -- 'guia_despacho' | 'cert_destruccion' | 'rut' | 'autorizacion_seremi' | 'otro'
  uploaded_by     text not null,             -- email del usuario (Cony, Dyana, Andrea…)
  uploaded_at     timestamptz default now(),
  ocr_result      jsonb,                     -- campos extraídos por OCR
  crosscheck      jsonb,                     -- resultados de validación contra base autoritativa
  hallazgos       text[],                    -- lista de inconsistencias detectadas
  escalacion      text,                      -- null | 'amarillo' | 'naranja' | 'rojo'
  retencion_until timestamptz,               -- now() + interval '30 days' por defecto
  borrado         boolean default false
);
-- RLS: lectura solo para Dusan + Dyana + auditor externo.
-- Trigger: si hallazgos != [] → notificar Dyana por webhook WhatsApp.
```

Esto cubre simultáneamente: (a) auditoría Ley 19.628 / GDPR, (b) retención limitada con borrado automático, (c) escalación trazable, (d) métrica de calidad de Diego (% docs validados auto vs. requirieron humano).

---

## 4. PDF cotejo con ley (contratos, acuerdos)

### Estado del arte 2026

**Harvey AI** ($11B valuation, mar-2026, 25.000+ agentes custom) y **Spellbook** (4.000+ equipos legales, GPT-5/Claude integrado en Word) son el estándar global 2026 para revisión de contratos con cotejo normativo. Capacidades núcleo:

- Extracción automática de cláusulas (objeto, plazo, precio, indemnidad, jurisdicción, fuerza mayor)
- Comparación contra normativa vigente con citación de fuente primaria
- Flag de cláusulas riesgosas o ausentes
- Benchmark contra mercado (Spellbook "Compare to Market" — ¿esta cláusula es estándar?)
- Edición directa en Microsoft Word con Track Changes

**EvenUp** (200+ firmas, USD 350M en demandas generadas) hace lo mismo para demanda judicial: extrae historial médico, genera carta de reclamo, insights de performance.

**Stanford RegLab (2025-2026):** hallucination rate 33% en Westlaw AI y 17% en Lexis+ AI. Conclusión: ningún sistema legal AI es confiable sin verificación humana de la fuente primaria. Por eso Harvey, Spellbook y EvenUp citan SIEMPRE la fuente con link al texto original.

### Protocolo Diego v9 — Cotejo PDF vs ley

```
PASO 1 — Usuario sube PDF de contrato (ej: contrato de compra-venta de chatarra con Pincore).
PASO 2 — Diego extrae cláusulas y muestra tabla:
  [Cláusula] [Texto resumido] [Referencia legal aplicable] [Riesgo]
PASO 3 — Diego compara con normativa Chile relevante:
  - Código Civil (compraventa, arts. 1793+)
  - Ley REP 20.920 (si hay producto prioritario)
  - Ley 19.628 (datos personales si hay)
  - Código Tributario (DTE, retención IVA)
PASO 4 — Diego marca inconsistencias con CITA:
  "Cláusula 7 (plazo de pago 90 días) → Ley 21.131 fija plazo máx 30 días pago a Pyme.
   Fuente: bcn.cl/leychile/Norma=1130352
   Esto NO es interpretación vinculante. Derivar a Dyana o abogado externo."
PASO 5 — Diego entrega informe + lista de fuentes + disclaimer obligatorio.
```

### Aplicado a Reciclean

**Caso real:** Andrea recibe contrato marco de un valorizador grande con 14 páginas. Lo sube a Diego. Diego identifica 22 cláusulas, marca 3 como riesgosas (plazo de pago 120 días, indemnidad ilimitada, jurisdicción Lima Perú), cita la norma chilena aplicable para cada una, y entrega informe en 90 segundos. Andrea pasa el informe a Dyana, Dyana confirma o ajusta, recién después se firma. Diego ahorró 4 horas de lectura pero NO firmó ni decidió.

**Lo que Diego NO hace:** decir "firmá este contrato" ni "no firmes". Diego dice "encontré 3 riesgos, acá las citas legales, decide humano".

### Normativa chilena de referencia obligatoria para cotejo

Diego v9 debe tener mapeadas (en KB interno) al menos estas normas con link a bcn.cl o fuente oficial:

| Tema | Norma | Aplicación Reciclean |
|------|-------|---------------------|
| Compraventa civil | Código Civil arts. 1793 y ss. | Cláusulas de objeto, precio, entrega, riesgo |
| Compraventa mercantil | Código de Comercio arts. 130 y ss. | Cuando ambas partes son comerciantes (mayoría casos) |
| Pago a Pyme (plazos) | Ley 21.131 | Máximo 30 días pago a Pyme. Crítico para Reciclean. |
| Datos personales | Ley 19.628 modernizada 2024 | Cláusulas sobre tratamiento de datos en contratos |
| REP | Ley 20.920 + DS 12 + DS 8 | Cuando hay producto prioritario |
| Trabajadores | Código del Trabajo | Contratos del equipo Reciclean (14 personas) |
| Tributario | Código Tributario + Ley sobre Impuesto a la Renta + Ley IVA | DTE, retenciones, créditos |
| Residuos peligrosos | DS 148/2003 | Si Reciclean toca aceites o ciertos AEE |
| Residuos no peligrosos almacenamiento | DS 6/2009 | Sucursales con bodega |
| Transporte residuos | DS 148 + autorizaciones SEREMI | Transportes 5R |

Diego puede CITAR cualquiera de estas normas linkeando a bcn.cl/leychile pero NO puede INTERPRETARLAS de forma vinculante. La cita es "lo que dice la ley". La interpretación es "lo que la ley significa en tu caso". Solo el segundo está prohibido para Diego.

### Diferencia crítica Harvey/Spellbook vs Diego

Harvey y Spellbook operan en jurisdicción USA/UK/UE con base de datos legal masiva (Westlaw/Lexis integrados). En Chile NO existe equivalente comercial accesible. Diego v9 debe construir su propia mini-KB legal chilena con las 10 normas de arriba + jurisprudencia clave. Esfuerzo estimado: 40-60 horas Dyana + abogado externo para validar primer corpus.

**Riesgo si no se hace bien:** Diego cae en hallucination rate alto (>30%) porque está inventando normas chilenas que no existen o citando artículos derogados. Mitigación: poblar KB primero con texto literal de bcn.cl y prohibir a Diego inventar números de artículo o ley.

### 5 casos operativos PDF cotejo que Diego v9 debe manejar

1. **Contrato marco con valorizador grande (Reciclean → comprador final).** Diego identifica cláusulas estándar, marca riesgosas (indemnidad ilimitada, jurisdicción extranjera, plazo pago >30 días, exclusividad sin contraprestación), cita norma chilena, entrega a Dyana.
2. **Contrato laboral nuevo (equipo Reciclean).** Diego compara contra plantilla estándar Reciclean (firmada por abogado laboral) + Código del Trabajo, marca desviaciones. NO redacta finiquitos ni interpreta despidos.
3. **NDA con cliente o proveedor.** Cláusulas críticas: duración, alcance de información confidencial, jurisdicción, penalidad. Diego marca si la cláusula es asimétrica (más obligaciones para una parte).
4. **Acuerdo de gestión REP con SdG (ReSimple, etc.).** Diego verifica que (a) cubra la categoría correcta, (b) tenga claridad sobre quién reporta a SISREP, (c) defina honorarios, (d) tenga cláusula de auditoría. Derivar a Dyana.
5. **Carta documento o requerimiento legal recibido.** Escalación roja inmediata. Diego solo: "recibí carta documento de [emisor], fecha [fecha], asunto [breve], avisé a Dusan + Dyana, abogado externo en 48h." NO interpreta el contenido ni propone respuesta.

### Anti-patrones (lo que Diego NO debe hacer aunque parezca útil)

- **NO redactar contratos desde cero**, aunque sean simples. Riesgo de práctica no autorizada de derecho.
- **NO sugerir cláusulas alternativas** sin que Dyana las haya pre-aprobado. Diego puede usar cláusulas de un repositorio firmado; nunca crear nuevas.
- **NO firmar por nadie**, ni siquiera en plantillas de borrador. Diego entrega texto, humano firma.
- **NO comparar precios de proveedores legales**. Es decisión gerencial, no técnica.
- **NO predecir resultado de litigio**. Probabilidad de éxito = interpretación pura.

---

## 5. Escalación a contador humano

### Estado del arte 2026

**Nippon Life v. OpenAI (marzo 2026, USD 10.3M):** corte USA sentó precedente — los disclaimers NO protegen al chatbot. Si el sistema responde sustantivamente a una pregunta legal/tributaria, hay responsabilidad por producto defectuoso.

**New York SB 7263 (abr-2026)** y otros 12 estados USA: prohibido que chatbot dé "respuesta sustantiva" que equivalga a práctica no autorizada de profesión licenciada (derecho, medicina, contabilidad). Notice "esto es IA" requerido pero no exime.

**Stanford / Bloomberg Law (Q1 2026):** 729+ casos de cortes USA involucran alucinaciones AI; sanciones de USD 2.500 → USD 110.000 en un trimestre, llamados a inhabilitación de abogados. La pauta: **el humano debe verificar la fuente primaria, NO confiar en que la IA verifique a otra IA.**

**Best practice handoff (2026):** 80% de usuarios solo usan chatbots si saben que hay opción humana. Keywords críticas disparan handoff instantáneo. Escalación dentro de la misma sesión, no derivación diferida.

### Protocolo Diego v9 — Escalación a Dyana / SERCOT

Diego debe disparar escalación AUTOMÁTICA en estos triggers:

```
TRIGGER 1 — Keywords legales/tributarias vinculantes:
  "¿puedo facturar...?" / "¿es legal...?" / "¿me multan si...?"
  "¿qué dice la ley...?" / "interpretación de [norma]"
  → Diego responde: "No puedo dar respuesta vinculante. Te conecto con Dyana ahora."

TRIGGER 2 — Documento ambiguo o con riesgo detectado:
  PDF con >2 inconsistencias / cláusula no estándar / monto > $5M
  → Diego notifica a Dyana por WhatsApp + deja log en panel.

TRIGGER 3 — Pregunta sobre liquidación, AFP, SII, SMA, REP con plazo legal:
  → Escalación inmediata. Diego NO intenta responder.

TRIGGER 4 — Diego con confianza <70% en su propia respuesta:
  → "No estoy seguro. Voy a consultar a Dyana. Te respondo en X minutos."
```

### Cuándo Diego NO opina NUNCA (lista absoluta)

| Tema | Por qué |
|------|---------|
| Interpretación vinculante de ley vigente | Práctica no autorizada de derecho (Nippon precedent) |
| Cálculo de impuesto adeudado | Responsabilidad civil contador certificado |
| Validez de contrato | Solo abogado firma esto |
| Defensa ante sanción SMA / SII | Procedimiento administrativo con plazos |
| Conflicto laboral / despido | Dirección del Trabajo o abogado laboral |
| Datos personales de terceros sin consentimiento | Ley 19.628 + GDPR si hay UE |
| Diagnóstico de incumplimiento REP de un competidor | Diego no puede acusar |

### Aplicado a Reciclean

**Caso real:** Dyana usa Diego para preguntar "¿cómo calculo el PPM de mayo para SERCOT?". Diego responde: "Yo no calculo impuesto. Te paso fórmula general F29 y el link a sii.cl. Vos validás. Si necesitás cálculo firmado, ese sos vos misma, yo no firmo." En cambio, si Cony pregunta "¿qué documentos pide SII para timbraje electrónico?", Diego SÍ responde — es información pública procedimental, no interpretación.

**Línea divisoria:** **información pública = OK**, **interpretación con consecuencia legal = escalación**.

### Flujo de escalación en 4 carriles

Diego v9 debe operar con cuatro carriles de escalación claramente diferenciados, cada uno con SLA distinto:

| Carril | Destinatario | SLA respuesta | Trigger |
|--------|-------------|----------------|---------|
| 🟢 Verde | Auto-respuesta Diego | Inmediato | Información pública procedimental (cómo timbrar, dónde está SISREP, qué decreto rige…) |
| 🟡 Amarillo | Dyana (notificación WhatsApp) | <2 horas | Pregunta tributaria con cálculo o documento con inconsistencia menor |
| 🟠 Naranja | Dyana + Cony cc Dusan | <8 horas | Documento con 2+ inconsistencias, contrato con cláusula riesgosa, monto >$5M |
| 🔴 Rojo | Abogado externo (consultora) | Cita en 48h | Sanción SMA/SII recibida, conflicto laboral, defensa administrativa, contrato sobre $50M |

Diego v9 debe poder etiquetar cada escalación con su carril y notificar al humano correcto. El log debe quedar visible en el panel Reciclean para Dusan (auditoría diaria de calidad de escalación).

### Plantillas canónicas de mensaje

**Plantilla escalación amarilla (Dyana):**
> "Dyana, Diego derivó: [usuario] preguntó [pregunta]. Mi confianza es baja. Conversación adjunta. ¿Me pasás respuesta para reenviar o respondés vos?"

**Plantilla rechazo respetuoso a usuario:**
> "Te entiendo. Esto cae en interpretación legal/tributaria vinculante. Por seguridad tuya y de Reciclean, no puedo responder yo. Acabo de avisar a Dyana, te debería contactar en menos de [SLA]. Si es urgente decime."

**Plantilla cuando Diego no sabe (regla de oro):**
> "No sé. Voy a consultar a Dyana / abogado externo y te respondo. ¿Querés que te avise por WhatsApp o seguimos acá?"

### Análisis de riesgo: qué pasa si Diego falla

| Tipo de fallo | Probabilidad si Diego v9 bien implementado | Consecuencia legal | Consecuencia económica |
|---------------|--------------------------------------------|---------------------|------------------------|
| Hallucination en cita de norma | <5% | Bajo si Diego siempre linkea fuente original | Bajo |
| Procesar dato personal sin consentimiento | <1% (con UI consent obligatoria) | Sanción Ley 19.628 hasta 5.000 UTM | $300M+ |
| Interpretar contrato y sugerir firmar | <2% (escalación amarilla bien calibrada) | Práctica no autorizada de derecho (riesgo civil + reputacional) | $$$ + reputacional |
| Validar guía/certificado falso como bueno | <3% (con cross-check SII) | Indirecto vía Reciclean (uso de doc falso) | Multa SII + bloqueo crédito IVA |
| No escalar cuando debió | <5% (con triggers automáticos) | Variable según caso | Variable |
| Filtrar datos a terceros vía respuesta | <0.5% (con prompt blindado) | Sanción Ley 19.628 | $$$ |

**Estrategia de mitigación combinada:** (1) escalación temprana antes que respuesta arriesgada, (2) citación obligatoria de fuente primaria, (3) audit log 100%, (4) revisión periódica por Dyana de los logs (10% sampling semanal), (5) actualización trimestral del prompt según hallazgos.

---

## Brechas vs Diego v9

| # | Brecha | Severidad | Esfuerzo |
|---|--------|-----------|----------|
| 1 | Diego v8 NO tiene integración con API SII / BaseAPI / Floid. No puede validar RUT ni consultar carpeta tributaria. | **Alta** | 2-3 días Pablo (REST + token + UI consentimiento) |
| 2 | Diego v8 NO tiene OCR de PDF + cross-check con base SII/SEREMI. Validación de guías y certificados es 100% manual. | **Alta** | 3-5 días (Edge Function + Tesseract o Claude Vision + cross-check) |
| 3 | Diego v8 NO tiene base de conocimiento REP estructurada (categorías, decretos, metas, plazos SISREP). Responde genérico. | **Alta** | 1-2 días Dusan/Dyana (poblar tabla `panel.kb_rep`) + 1 día Pablo (RAG simple) |
| 4 | Diego v8 NO tiene triggers automáticos de escalación a Dyana. Hoy depende de que el usuario pida humano. | **Media** | 1 día Pablo (regex keywords + webhook WhatsApp Dyana) |
| 5 | Diego v8 NO registra log de consentimiento ni hash de PDFs procesados. Sin audit trail no es defendible ante Ley 19.628 / GDPR. | **Media** | 1-2 días Pablo (tabla `panel.diego_audit_log` + retención 30 días) |

---

## Implementable sin Pablo en 1-2 días

| # | Quick win | Cómo | Quién |
|---|-----------|------|-------|
| 1 | **Base de conocimiento REP estructurada en Markdown** — categorías, decretos vigentes, metas 2026, plazos SISREP, contacto SdG por categoría. Diego lee y cita. | Dusan + Dyana redactan archivo `public/DIEGO-KB-REP.md` (~200 líneas). Diego v8 ya lee MD del repo en su contexto. | Dusan (3h) + Dyana (2h validación) |
| 2 | **Lista de triggers de escalación + mensaje canónico** — 20 keywords que disparan "te derivo a Dyana" + WhatsApp template listo. Sin código: solo prompt update en `diego-chat-process`. | Editar prompt sistema de Diego v8 agregando bloque "TRIGGERS DE ESCALACIÓN". Probar con 10 mensajes de Andrea. | Dusan solo (2h) |
| 3 | **Protocolo de consentimiento previo en lenguaje natural** — Diego pide SÍ/NO antes de procesar dato sensible. Hoy no lo pide. Solución: 3 líneas en el prompt + log manual en planilla. | Editar prompt + agregar `INSTRUCCIÓN: antes de procesar RUT, sueldo, deuda, contrato, pedir consentimiento explícito SÍ/NO`. | Dusan solo (1h) |

---

## Fuentes verificables 2025-2026

1. **Carey** (estudio jurídico Chile) — Ley REP aplicación 2025-2026 — https://leyrep.carey.cl/en/home/
2. **SMA Chile (Superintendencia del Medio Ambiente)** — Plataforma SISREP comunicado oficial — https://portal.sma.gob.cl/index.php/sma-pone-a-disposicion-plataforma-de-reporte-para-dar-cumplimiento-a-la-ley-rep/
3. **Harvey AI** — Plataforma legal AI, features 2026, SOC2/ISO27001 — https://www.harvey.ai/platform
4. **Spellbook** — Best Legal AI Contract Review Software 2026 — https://spellbook.com/learn/ai-legal-contract-review-faster-analysis
5. **Stanford Law CodeX** — Nippon Life v. OpenAI análisis precedente product liability — https://law.stanford.edu/2026/03/07/designed-to-cross-why-nippon-life-v-openai-is-a-product-liability-case/
6. **Orrick Herrington & Sutcliffe** — 2026 State Chatbot Laws review — https://www.orrick.com/en/Insights/2026/04/2026-State-Chatbot-Laws-Key-Provisions-and-Regulatory-Trends
7. **BaseAPI Chile** — Automatizar Carpeta Tributaria SII 2026 — https://baseapi.cl/blog/automatizar-carpeta-tributaria-api
8. **KPMG** — Chile Resolución SII N° 168 (verificación tributaria plataformas) — https://kpmg.com/us/en/taxnewsflash/news/2025/12/chile-tax-compliance-platforms-payment-service-providers.html
9. **Reconomy** — EPR in 2026 Key Dates, EU PPWR Reg 2025/40 — https://www.reconomy.com/2026/01/21/extended-producer-responsibility-in-2026/
10. **NexLaw / ComplianceHub** — 729+ casos AI hallucination en cortes USA, escalada de sanciones Q1 2026 — https://compliancehub.wiki/legal-ai-hallucination-reckoning-2026/

---

## Roadmap Diego v9 — 30/60/90 días

### Días 0-30 (quick-wins + KB)
- [ ] Crear `public/DIEGO-KB-REP.md` (Dusan + Dyana, 5h).
- [ ] Editar prompt sistema con 20 keywords escalación + plantillas canónicas (Dusan, 2h).
- [ ] Implementar consentimiento previo en lenguaje natural (Dusan, 1h prompt + manual log).
- [ ] Crear `public/DIEGO-KB-NORMAS-CHILE.md` con las 10 normas + link bcn.cl (Dusan + Dyana, 8h).
- [ ] Definir 4 carriles de escalación + contactos WhatsApp (Dusan, 1h).
- [ ] Diseñar mockup de UI consentimiento en panel-rdo.html (sin push, solo localhost).

### Días 31-60 (integración técnica con Pablo)
- [ ] Integrar BaseAPI Carpeta Tributaria con consentimiento UI (Pablo, 2-3 días).
- [ ] Tabla `panel.diego_audit_log` + tabla `panel.diego_doc_audit` con políticas RLS (Pablo, 1 día).
- [ ] Edge Function `diego-validate-doc` con Claude Vision + cross-check SII (Pablo, 3-5 días).
- [ ] Triggers automáticos de escalación: regex + webhook WhatsApp Business (Pablo, 1 día).
- [ ] Endpoint `/forget?rut=...` para right-to-erasure GDPR/Ley 19.628 (Pablo, 0.5 día).

### Días 61-90 (validación legal + producción)
- [ ] Revisión legal externa del prompt y de la KB normativa (abogado externo, 8-12h).
- [ ] Pruebas de stress con 100 mensajes históricos reales (Dusan + Andrea + Cony, 1 semana).
- [ ] Medir tasa de hallucination interna contra fuente primaria. Target: <5%.
- [ ] Medir tasa de escalación correcta. Target: >95% de casos amarillo/naranja/rojo bien clasificados.
- [ ] Documento "Diego v9 produccionizado" firmado por Dusan + Dyana.
- [ ] Comunicación interna al equipo + entrenamiento de Andrea, Cony y Dyana en uso correcto.

---

## Matriz de cumplimiento normativo

| Regulación | Aplicable | Cubre Diego v8 | Cubre Diego v9 (target) |
|------------|-----------|----------------|-------------------------|
| Ley 19.628 (datos personales Chile, mod. 2024) | Sí | Parcial | Total con consentimiento + retención + erasure |
| GDPR (UE) | Sí (si toca ciudadanos UE) | No | Parcial vía Supabase + log + erasure |
| Ley 20.920 (REP) | Sí | No | Sí, KB estructurada |
| Resolución SII N° 168/2026 | Sí | No | Sí, vía BaseAPI con consentimiento |
| Código Tributario (DTE) | Sí | No | Parcial, validación folio |
| Ley 21.131 (pago Pyme 30 días) | Sí | No | Sí, cotejo contratos |
| Código del Trabajo | Sí | No | Solo escalación, NO interpretación |
| DS 148/2003 (residuos peligrosos) | Sí (transporte) | No | Sí, validación autorizaciones |
| EU AI Act (transparencia chatbot) | Aplicable a estándar 2026 | No | Sí, notice "soy AI" + log |
| NY SB 7263 / state chatbot laws (USA) | No directamente, sí como benchmark | No | Sí, prohibido practice of profession |

**Cumplimiento global Diego v8:** ~10%. **Cumplimiento global Diego v9 target:** ~85%. La diferencia se cierra con 30-60 días de trabajo focalizado.

---

## Matriz RACI — Gobernanza Diego v9

| Actividad | Dusan (CEO) | Dyana (Tributario/legal) | Pablo (Tech) | Cony (Admin SERCOT) | Andrea (Comercial) | Abogado externo |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|
| Aprobar prompt sistema Diego | **A** | C | R | I | I | C |
| Mantener KB REP y normas Chile | A | **R** | C | I | I | C |
| Implementar integración BaseAPI SII | I | C | **R/A** | I | I | – |
| Validar respuestas legales del log diario | A | **R** | I | I | I | C |
| Responder escalaciones amarillas/naranjas | I | **R** | I | C | I | C |
| Responder escalaciones rojas | A | C | I | I | I | **R** |
| Subir/validar PDFs de generador | I | C | I | **R** | C | I |
| Cotizar a clientes nuevos con datos Diego | I | C | I | I | **R** | – |
| Aprobar cambios a triggers de escalación | **A** | R | C | I | I | C |
| Auditoría trimestral compliance | **A** | R | C | I | I | C |

**Leyenda:** R = Responsable de ejecutar · A = Aprobador final · C = Consultado · I = Informado.

**Lectura clave:** Diego v9 NO es propiedad de Pablo (técnico). Es propiedad de Dyana (calidad legal/tributaria) con aprobación final de Dusan (riesgo de negocio). Pablo es soporte de infraestructura. Esta separación previene que Diego se convierta en "el chatbot técnico" desentendido de su responsabilidad legal.

---

## Anexo A — Bloque a agregar al prompt sistema de Diego v9

```
=== BLOQUE LEGAL / TRIBUTARIO ===

Sos Diego, asistente del Grupo Reciclean-Farex-SERCOT. Tu rol respecto a temas
legales y tributarios está estrictamente limitado:

1. PUEDES dar información pública procedimental (cómo timbrar, dónde está SISREP,
   qué decreto rige una categoría REP, contactos públicos de SII/SMA, etc.).

2. NO PUEDES dar interpretación legal vinculante. Si la respuesta puede generar
   consecuencia legal/tributaria para Reciclean o terceros, escalá.

3. Antes de procesar dato personal (RUT, monto, sueldo, contrato), PEDÍ
   consentimiento explícito SÍ/NO. Registralo en el log.

4. Si tu confianza en la respuesta es <70% → no la des. Escalá a Dyana
   (carril amarillo).

5. Citá SIEMPRE la fuente primaria cuando menciones una norma (link bcn.cl).
   Nunca inventes números de artículo ni cifras de meta REP.

6. Triggers automáticos de escalación (regex):
   "¿puedo facturar...?" → amarillo
   "¿es legal...?" → amarillo
   "¿me multan si...?" → naranja
   "interpretación de la ley..." → naranja
   "carta documento" / "requerimiento" / "demanda" → ROJO inmediato
   "despido" / "finiquito" / "sumario" → ROJO inmediato

7. Plantilla obligatoria cuando no sabés:
   "No sé. Voy a consultar a Dyana y te respondo. ¿Te aviso por WhatsApp?"

8. NUNCA digás "según mi interpretación de la ley...". Es vetado.
   Decí en cambio "según el texto del [norma art X] disponible en bcn.cl/[link]
   pero esto NO es interpretación vinculante, derivá a Dyana."

9. Si te piden redactar contrato/cláusula desde cero → declinar.
   Si te piden modificar contrato existente → marcar cláusulas riesgosas con
   cita, NO sugerir alternativas no aprobadas por Dyana.

10. Logueá toda consulta con consecuencia legal/tributaria a la tabla
    panel.diego_audit_log con: usuario, pregunta, respuesta, escalacion,
    fuentes_citadas, confianza_estimada.
```

---

## Anexo B — JSON schema de respuesta Diego en temas legales

Toda respuesta de Diego sobre tema legal/tributario debe ajustarse a este esquema:

```json
{
  "tipo": "info_publica | interpretacion_evitada | escalacion",
  "carril_escalacion": "verde | amarillo | naranja | rojo",
  "respuesta_usuario": "texto en lenguaje natural",
  "fuentes_citadas": [
    {
      "titulo": "Ley 21.131 (Pago a Pyme)",
      "url": "https://www.bcn.cl/leychile/navegar?idNorma=1130352",
      "articulo_relevante": "Art. 2",
      "vigencia": "vigente al 2026-05-23"
    }
  ],
  "confianza_estimada": 0.85,
  "requiere_consentimiento": true,
  "consentimiento_obtenido": true,
  "consentimiento_evidencia_id": "ulid-...",
  "humano_notificado": {
    "destinatario": "dyana@gestionrepchile.cl",
    "via": "whatsapp",
    "sla_esperado_horas": 2
  },
  "auditoria_id": "ulid-..."
}
```

Este schema permite: (a) auditoría programática por Dyana del 10% de respuestas semanales, (b) métricas automáticas de tasa de escalación, (c) reproducibilidad ante eventual reclamo legal de un usuario.

---

## Métricas de éxito Diego v9 (KPIs 90 días post-deploy)

| KPI | Baseline Diego v8 | Target Diego v9 |
|-----|-------------------|------------------|
| Tasa hallucination en respuestas legales/tributarias | Desconocida (sin medición) | <5% verificado contra fuente primaria |
| % escalaciones correctas (amarillo/naranja/rojo bien clasificado) | N/A | >95% |
| Tiempo promedio respuesta consulta tributaria | Manual = 2-4 horas | Automático = <60 segundos para info pública; <2h para escalación amarilla |
| Documentos OCR + cross-check por mes | 0 (todo manual) | 150+ |
| Horas/mes ahorradas a Cony + Dyana | 0 | 11+ |
| Incidentes de privacidad (Ley 19.628) | Desconocido | 0 |
| Consentimientos registrados con audit trail | 0% | 100% |

---

---

## Anexo C — Comparativa Harvey AI / Spellbook / EvenUp / Diego v9

| Capacidad | Harvey AI | Spellbook | EvenUp | Diego v9 (target) |
|-----------|-----------|-----------|--------|---------------------|
| Mercado objetivo | Big Law + corporate legal | In-house counsel, drafters | Personal injury firms | Reciclean (PyME industrial) |
| Stack | Custom agents, propietario | Word add-in, GPT-5+Claude | Plataforma claims | Claude API + Supabase + WhatsApp |
| Citación obligatoria de fuente | Sí, con link | Sí, benchmark contra mercado | Limitado | Sí, link bcn.cl obligatorio |
| Hallucination rate publicado | ~8% (estimado) | <10% en review | n/d | <5% target |
| Compliance SOC2 / ISO27001 | Sí | Sí | Parcial | Hereda de Supabase + auditoría manual |
| Jurisdicción cubierta | USA, UK, UE | USA, 30 países | USA | Chile (foco) |
| Costo orientativo | USD 200-500/usuario/mes | USD 100-200/usuario/mes | Por caso | Costo Claude API + dev interno |
| Idioma español Chile | Limitado | Limitado | No | Nativo |

**Conclusión:** Diego v9 NO compite con Harvey/Spellbook en sofisticación general. Compite por ser el chatbot legal/tributario **mejor adaptado a contexto chileno + REP + tamaño Reciclean**, con una fracción del costo y con dueño legal interno (Dyana). El valor diferencial no es la IA, es la KB chilena bien hecha + la disciplina de escalación.

---

## Anexo D — Glosario operativo

| Término | Definición operativa para Reciclean |
|---------|--------------------------------------|
| SISREP | Sistema de Reporte REP de la SMA (sistema oficial chileno desde 1-ene-2025) |
| SdG | Sistema de Gestión (organización sin fines de lucro que agrupa a productores para cumplir REP) |
| Productor REP | Quien introduce producto prioritario al mercado nacional (manufacturador o importador) |
| Valorizador | Empresa que transforma residuo en producto / energía. Reciclean opera acá. |
| Generador | Quien genera residuo (post-consumo). Reciclean los recibe. |
| DTE | Documento Tributario Electrónico (factura, guía de despacho, etc.) |
| Carpeta Tributaria | Documento SII con resumen de situación tributaria de un RUT |
| RUT | Rol Único Tributario (identificador fiscal Chile) |
| BaseAPI | Proveedor chileno de wrapper REST sobre servicios SII/Previred/TGR |
| Carril amarillo/naranja/rojo | Niveles de escalación Diego según urgencia y consecuencia |
| Audit trail | Registro completo y verificable de toda decisión/acción de Diego |
| Right-to-erasure | Derecho del titular de datos a pedir borrado (Ley 19.628 mod. 2024 + GDPR) |
| Hallucination | IA inventando información que parece correcta pero es falsa |
| Práctica no autorizada (UPL) | Que un no-abogado dé respuesta legal vinculante. Prohibido en Chile, USA, UE. |

---

## Anexo E — Reglas de oro condensadas (1 página para impresión)

> **REGLA 0:** Diego NUNCA INVENTA. Si no sabe → "no sé, voy a consultar a Dyana".
>
> **REGLA 1:** Antes de procesar dato sensible → consentimiento SÍ/NO explícito.
>
> **REGLA 2:** Toda cita legal requiere link a fuente primaria (bcn.cl o equivalente).
>
> **REGLA 3:** Si confianza <70% → escalar, no responder.
>
> **REGLA 4:** Información pública procedimental = OK responder. Interpretación con consecuencia = escalar.
>
> **REGLA 5:** Diego no firma, no decide, no opina sobre validez de contratos.
>
> **REGLA 6:** Triggers de escalación son automáticos (regex + confianza). No depende de que el usuario lo pida.
>
> **REGLA 7:** Logueo total. Sin log no hay respuesta legal.
>
> **REGLA 8:** Retención 30 días. Pasado ese plazo, datos personales se anonimizan o borran.
>
> **REGLA 9:** Dyana es dueña de la calidad legal de Diego. Pablo es soporte técnico. Dusan aprueba.
>
> **REGLA 10:** Revisión trimestral del prompt y de la KB. Sin actualización = degradación.

---

**Legal Compliance Checker · Diego v9 · 23-may-2026**
**Próxima revisión:** trimestral (siguiente: 23-ago-2026) o ante cambio normativo material (PPWR ago-2026, nuevo decreto REP).
