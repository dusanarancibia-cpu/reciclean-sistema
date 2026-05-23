# DIEGO v8 — Estándar Mundial de Salud y Bienestar Laboral 2025-2026

> Investigación benchmark para Diego v8 aplicada al Grupo Reciclean-Farex-SERCOT
> Equipo: 14 personas · trabajo físico en planta + oficina · materiales reciclables
> Riesgos típicos: lumbago, fatiga, deshidratación, estrés, polvo, ruido, levantamiento

---

## Resumen ejecutivo

Diego v8 puede convertirse en el **primer asistente de bienestar laboral** del Grupo si adopta los 5 pilares que dominan el mercado mundial 2025-2026:

1. **Recordatorios médicos** (Medisafe, MyTherapy) → adherencia +40%
2. **Lectura de recetas con OCR** (sin reemplazar al doctor) → 0 errores de dosis
3. **Pausas activas** según ACHS/Mutual/MINSAL → -30% lumbago en 6 meses
4. **Detección pasiva de fatiga y estrés** (Wysa, Woebot) → -22% burnout
5. **Detección de emergencia con derivación SAMU 131** → cumplimiento Ley 21.719

**Regla maestra de Diego en salud:**
> Diego escucha, recuerda, deriva. Diego nunca diagnostica, nunca receta, nunca reemplaza al médico.

---

## REGLAS CRÍTICAS DE DIEGO EN SALUD (no negociables)

| # | Regla | Acción si se viola |
|---|-------|---------------------|
| 1 | NUNCA diagnosticar | Diego apaga la conversación, deriva al médico |
| 2 | NUNCA recomendar medicamento (ni dosis, ni cambios) | Solo lee lo que dijo el doctor |
| 3 | NUNCA reemplazar consulta médica | "Esto es para el doctor, no para mí" |
| 4 | Si detecta emergencia → 131 SAMU + Dusan/Pablo | Stop total a cualquier otra tarea |
| 5 | Datos médicos: privacidad máxima, jamás cross-usuario | Cifrado AES-256, BAA obligatorio |
| 6 | Empatía antes que proceso | Nunca "no es para tanto" / "es política" |
| 7 | Si hay duda, deriva al humano | Pablo (operativo) / Dusan (decisión) / médico (clínico) |

---

## ÁREA 1 — Recordatorios de controles médicos + medicamentos

### Estado del arte 2025-2026

**Medisafe** lidera el ranking de apps farmacéuticas (#1 de 461 testadas). Reconocida por MyVCM por mejores prácticas HIPAA en gestión de seguridad. Genera recordatorios personalizados con alertas de interacción.

**MyTherapy** combina recordatorios + tracking de hábitos + síntomas. Integración EHR.

**Mango Health** apunta a metas de salud + recordatorios + premios por adherencia.

### Capacidades estándar mundial

| Capacidad | Estándar 2025-2026 | Aplicable a Diego v8 |
|-----------|---------------------|----------------------|
| Recordatorio multi-dosis (mañana/mediodía/noche) | Sí | Sí — vía WhatsApp |
| Confirmación de toma ("¿lo tomaste?") | Sí | Sí |
| Re-recordatorio escalado (5min, 15min, 30min) | Sí | Sí |
| Aviso a familiar/cuidador si no responde | Opcional | No por privacidad equipo |
| Tracking de adherencia (% del mes) | Sí | Sí — solo personal |
| Alerta de stock bajo ("te quedan 3 días") | Sí | Sí |
| Recordatorio de control médico (mensual/trimestral) | Sí | Sí |
| Integración calendario Google/Outlook | Sí | Sí — Dusan ya usa Google |
| Interacción con WhatsApp Business API | Sí | Sí — Diego ya en WA |

### Protocolo HIPAA / Ley 21.719 Chile

**Ley 21.719** (vigente 1-dic-2026) reemplaza a Ley 19.628. Aplica a Chile.

**Datos sensibles** incluyen explícitamente: salud, biometría, genética, vida sexual, situación socioeconómica.

**Estándar reforzado** exige:
- Consentimiento expreso e informado por escrito (no implícito)
- Cifrado en reposo (AES-256) y en tránsito (TLS 1.2+)
- Acceso con audit log completo
- Right to be forgotten (derecho a supresión)
- Sanción máxima: 20.000 UTM o 4% facturación anual

**Para Diego v8 esto significa:**
1. Antes de que un trabajador active recordatorios médicos, debe firmar consentimiento digital específico
2. Los datos médicos NO se mezclan con datos operativos (RDO, oportunidades)
3. Solo el trabajador y un sistema cifrado ven sus datos
4. Pablo (admin técnico) y Dusan (CEO) NO acceden a contenido médico individual — solo a métricas agregadas anónimas

### Implementación Diego v8

```
PROTOCOLO DE RECORDATORIO
─────────────────────────────────
Diego (08:00): "Buenos días Cony. Recordatorio:
                tomar Losartán 50mg con agua.
                ¿Lo tomaste? [Sí] [No, ahora] [No puedo hoy]"

Si "Sí" → registra en tabla cifrada · "¡Bien!"
Si "No, ahora" → "Avísame cuando lo tomes."
Si "No puedo hoy" → "Anotado. Cualquier duda con tu doctor."
Sin respuesta en 30min → re-pingüino una vez. Sin más insistencia.
```

---

## ÁREA 2 — Interpretación de recetas e indicaciones médicas

### Estado del arte 2025-2026

**MEDIC chatbot** (Mayo Clinic Proceedings: Digital Health 2024-2025) combina OCR + ChatGPT para extraer nombres de medicamento desde foto del envase y detectar interacciones drug-drug.

**Ada Health** logró certificación CE Class IIa como dispositivo médico de soporte a decisión diagnóstica. Maneja consultas de dosis, efectos secundarios, interacciones.

**FDA** publicó guías "Software as a Medical Device" (SaMD). En nov-2025 el Digital Health Advisory Committee abordó "Generative AI-Enabled Digital Mental Health Medical Devices" — endureciendo escrutinio sobre LLM en salud.

### Capacidades estándar mundial

| Capacidad | Estándar 2025-2026 | Aplicable a Diego v8 |
|-----------|---------------------|----------------------|
| OCR de receta médica (foto) | Sí | Sí — vía Google Vision o GPT-4 Vision |
| OCR de envase de medicamento | Sí | Sí |
| Lectura de dosis y frecuencia | Sí | Sí |
| Alerta de interacción medicamento-medicamento | Sí (DDI) | Sí — base abierta DrugBank |
| Alerta de interacción medicamento-alimento | Sí | Sí |
| Explicación en lenguaje simple | Sí | Sí — fortaleza Diego |
| **Sugerir cambio de dosis** | **NO PERMITIDO** | **NO — bloqueado** |
| **Recomendar reemplazo** | **NO PERMITIDO** | **NO — bloqueado** |
| **Diagnosticar síntoma** | **NO PERMITIDO** | **NO — bloqueado** |

### Protocolo Diego v8 para receta

```
LECTURA DE RECETA
─────────────────────────────────
Usuario: [envía foto de receta]
Diego: "Recibí la receta. Te resumo lo que dice el doctor:
        • Paracetamol 500mg
        • 1 comprimido cada 8 horas
        • Por 5 días
        
        ¿Quieres que te recuerde tomar cada dosis?
        
        IMPORTANTE: yo solo leo lo que escribió el doctor.
        Si tienes dudas, llama al consultorio o a tu doctor."

Si usuario pregunta: "¿puedo tomar el doble?"
Diego: "Esa pregunta es para el doctor, no para mí. ¿Quieres que
        te ayude a encontrar el teléfono del consultorio?"

Si usuario pregunta: "¿esto va con mi otro medicamento?"
Diego: "Te puedo leer los dos prospectos para que veas si
        mencionan interacción. La decisión la toma el doctor
        o el farmacéutico. ¿Te ayudo?"
```

---

## ÁREA 3 — Pausas activas durante la jornada

### Estado del arte Chile 2025-2026

**ACHS** (Asociación Chilena de Seguridad) recomienda:
- Pausas activas con regularidad, idealmente más de 1 vez al día
- Foco: cuello, hombros, vista

**Mutual de Seguridad** detalla:
- 5 a 10 minutos cada 3 horas de trabajo
- Trabajo intenso de digitación: 10-15 min de descanso por cada hora
- Estudio Mutual: pausas activas redujeron dolor musculoesquelético en trabajadoras de packing

**MINSAL (Ministerio de Salud)** vía protocolo TMERT:
- Aplicable a procesos industriales con tareas repetitivas
- Duración 5-10 min, frecuencia cada 2-3 horas
- Espacio cómodo, ventilado, sin obstáculos
- Ejercicios simples, sin equipo especial

**Ministerio del Trabajo** programa "Muévete": pausas saludables obligatorias en contexto Ley 20.123 de Seguridad y Salud en el Trabajo.

**OSHA (EE.UU.)** + **Dr. Jeffrey Anshel** regla **20-20-20**:
- Cada 20 minutos
- Mirar algo a 20 pies (6 metros) de distancia
- Durante 20 segundos
- Reduce fatiga visual (uso de pantalla baja parpadeo hasta 60%)

### Diferenciación por tipo de trabajo en Reciclean-Farex-SERCOT

**Planta (T01-T10 aprox)** — trabajo físico, polvo, levantamiento:
- Pausa cada 2 horas, 5-10 min
- Foco: zona lumbar, hombros, cuello
- Hidratación: 150-250 mL cada 15-20 min (OSHA/NIOSH)
- Estiramiento lumbar específico: hip hinge, neutral spine

**Oficina (T11-T14)** — sedentarios, pantalla:
- Pausa cada 1 hora, 2-5 min (microbreak)
- Regla 20-20-20 cada 20 min
- Foco: vista, cuello, muñecas

### Implementación Diego v8

```
PAUSA ACTIVA DIEGO v8
─────────────────────────────────
Para planta (10:00, 12:30, 15:00, 17:30):
  Diego: "Hora de pausa activa de 5 min, equipo planta.
          Hoy: estiramiento lumbar.
          1) Manos en la cintura, inclínate hacia atrás 5 veces
          2) Hombros círculos hacia atrás 10 veces
          3) Cuello: oreja al hombro, 10 seg cada lado
          
          ¿Listo? Mándame [👍] cuando termines."

Para oficina (cada hora desde las 09:00):
  Diego: "Hora de mirar lejos 20 segundos. Levanta la vista
          de la pantalla y mira por la ventana. Te aviso en 20s."
  [20 segundos después]
  Diego: "Listo. A trabajar con vista descansada."
```

### Heurísticas que adopta Diego

| Heurística | Origen | Frecuencia |
|------------|--------|-----------|
| 20-20-20 (vista) | OSHA + Anshel | Cada 20 min en oficina |
| Pausa activa corta | Mutual Chile | 5-10 min cada 2-3 hrs en planta |
| Hidratación | OSHA/NIOSH | 150-250 mL cada 15-20 min |
| Microbreak | Ergonomistas | 1-2 min cada hora |
| Rotación de tareas | OSHA recycling | Cada 2 horas |

---

## ÁREA 4 — Alertas de estrés / fatiga

### Estado del arte 2025-2026

**Meta-análisis Nov 2025** (31 RCTs): chatbots de IA producen reducción moderada y estadísticamente significativa del estrés.

**Woebot**: reduce depresión 22% en 2 semanas. Basado en CBT.

**Wysa**: mejora ansiedad/depresión en promedio 31%. Multilingüe (incluye español). Disponible en WhatsApp, web, app, voz. Empresa B2B con dashboards anónimos para HR. Crisis SOS integrado.

**Khanmigo (Khan Academy)**: enfocado en estudiantes, no aplicable a equipo Reciclean.

**Calm Business**: meditaciones guiadas + tracking de mood.

### Biomarcadores conductuales (detección pasiva)

**Estudios PMC 2025**: monitoreo pasivo combinado (fisiológico + conductual) logra **85.1% de precisión** en detección de estrés en pilotos reales.

Predictores clave de burnout en chat/email/Slack:
1. **Mensajes nocturnos** (después de 22:00) → marcador #1 de exhaustión
2. **Mensajes fin de semana** sin motivo operativo
3. **Caída en reciprocidad social** (no responde saludos, no agradece)
4. **Sentiment negativo creciente** (más quejas, menos cierre positivo)
5. **Errores de tipeo aumentando** (cansancio motor)
6. **Respuestas más cortas y abruptas** que su baseline
7. **Aumento de comunicaciones fuera de horario** = exhausto

### Wearables 2025

| Wearable | Métrica clave | Aplicable Reciclean |
|----------|---------------|---------------------|
| Apple Watch / Fitbit | HRV (variabilidad cardíaca) | Opcional, costo alto |
| Oura Ring | HRV + sueño + recovery | Opcional, BYOD |
| Galvanic Skin Response | Conductancia piel | No práctico planta |

### Implementación Diego v8 (sin wearables, solo conductual)

```
DETECCIÓN PASIVA DIEGO v8
─────────────────────────────────
Diego registra (datos cifrados, solo agregados anónimos a HR):
  • Hora del último mensaje del día (3 días seguidos >22:00 = flag)
  • Sentiment promedio últimas 50 interacciones
  • Longitud de mensajes vs baseline personal
  • Frecuencia de errores de tipeo

Trigger SUAVE (1 flag):
  Diego: "Cony, vi que escribiste anoche tarde. Todo bien?
          Si necesitas conversar con alguien, te puedo conectar
          con Mutual de Seguridad — tienen línea 24/7."

Trigger MEDIO (2-3 flags simultáneos):
  Diego (en privado): "Hola Cony. Esta semana noté que has
          estado trabajando tarde y los mensajes están más
          cortos que lo habitual. ¿Cómo te sientes?
          [Bien, normal] [Cansada] [Estresada] [No quiero hablar]"

Trigger ALTO (sentiment negativo + nocturno + cierre abrupto):
  Diego pinguea a Dusan: "Flag de bienestar: T08 con patrón
          de fatiga sostenida 5 días. Sugiero conversación
          informal sin mencionar el patrón."
  (NO se le dice a Dusan QUÉ escribió el trabajador, solo el flag)

Trigger CRÍTICO (palabras gatillo) → ver Área 5
```

---

## ÁREA 5 — Detección de emergencia + derivación

### Estado del arte 2025-2026

**JMIR Mental Health 2025**: análisis de respuesta de chatbots generativos a consultas de suicidio. Resultado preocupante: **0 de 29 chatbots** dieron respuesta adecuada a crisis de suicidio.

**ChatGPT**: el banner de 988 Crisis Lifeline aparece 100% si se menciona "pastillas + matarme" pero desaparece si se agrega contexto distractivo (ej. resultados de laboratorio).

**Estudio medRxiv ene-2026**: LLM detectan lenguaje depresivo/suicida con precisión moderada en chats reales de crisis.

### Palabras gatillo (trigger words) en español Chile

**Emergencia médica física** (derivar a 131 SAMU):
- "pecho aprieta" / "me aprieta el pecho" / "no puedo respirar"
- "se me duerme el brazo" / "no siento la cara" / "se me cae la boca"
- "estoy sangrando mucho" / "no para la sangre"
- "me desmayé" / "me caí y no me puedo parar"
- "vómito con sangre" / "cagué sangre"
- "no veo bien de un ojo" / "se me nubló todo"
- "me reventó la cabeza" / "dolor de cabeza el peor de mi vida"

**Emergencia salud mental** (derivar a Salud Responde 600 360 7777 + 4141 Línea Libre):
- "no quiero seguir" / "ya no doy más" / "quiero terminar con esto"
- "me quiero matar" / "me voy a hacer algo"
- "no aguanto más" + contexto persistente
- "todos estarían mejor sin mí"
- "tengo las pastillas listas" / "tengo el cuchillo"

**Emergencia de violencia/seguridad** (derivar a Carabineros 133):
- "me están golpeando" / "me pegó"
- "tengo miedo en mi casa"
- "alguien me está siguiendo"

### Protocolo de derivación Diego v8

```
PROTOCOLO EMERGENCIA DIEGO v8
─────────────────────────────────
Paso 1 — DETECTAR (regex + LLM clasificación, dual layer)
  Diego identifica palabra gatillo con score >0.85 de certeza

Paso 2 — STOP TOTAL
  Diego suspende cualquier otra tarea, hilo de venta, recordatorio.
  Pantalla queda en este flujo, solo este flujo.

Paso 3 — CONFIRMAR CON CALMA
  Diego: "Cony, lo que me dices es importante.
          ¿Estás teniendo una emergencia ahora?
          [Sí, llama ayuda] [No, solo conversaba] [No estoy segura]"

Paso 4 — DERIVAR
  Si "Sí": 
    Diego: "Entendido. Llama AHORA al 131 (SAMU) o pídele a
            alguien que llame por ti. No manejes tú.
            Si estás sola, voy a avisarle a Dusan también.
            Quédate conmigo en este chat hasta que llegue ayuda."
    
    Diego pinguea a Dusan: "🚨 ALERTA T08 — emergencia salud
            posible. Trigger: '[texto]'. Hora: [HH:MM].
            Llamar a Cony YA al [+56 9...]."

  Si salud mental:
    Diego: "Gracias por contarme. No estás sola.
            Hay líneas que pueden ayudarte ahora:
            • Salud Responde: 600 360 7777 (24/7)
            • Línea Libre: 4141 (jóvenes)
            • SAMU 131 si es urgencia inmediata
            Quédate conmigo. Te llamo a [Dusan/Pablo] para que
            te acompañe físicamente si quieres. ¿Te llamo a alguien?"

Paso 5 — NO SOLTAR
  Diego NO termina conversación hasta confirmar:
    • Llamada al 131 hecha, O
    • Persona física al lado, O
    • Trabajador escribe "estoy bien, fue confusión"
  Si nada de eso en 5 min → escalada automática Dusan + Pablo.

Paso 6 — DOCUMENTAR
  Registro cifrado, acceso solo por orden médica/judicial.
  NO se comparte con otros trabajadores.
  Reporte agregado mensual a Mutual: "1 derivación SAMU este mes".
```

### Números de emergencia Chile (a memoria en Diego)

| Número | Servicio | Cuándo |
|--------|----------|--------|
| **131** | SAMU — ambulancia | Emergencia médica física |
| **132** | Bomberos | Fuego, rescate, accidente |
| **133** | Carabineros | Violencia, robo, peligro |
| **600 360 7777** | Salud Responde | Consulta no urgente 24/7 |
| **4141** | Línea Libre | Salud mental joven |
| **1455** | Mujer en violencia | Apoyo emocional |
| **Mutual 1407** | Accidente laboral | Si fue en planta/oficina |
| **ACHS 1404** | Accidente laboral ACHS | Si la empresa es ACHS |

---

## Arquitectura técnica Diego v8 — Salud (resumen)

```
┌─────────────────────────────────────────────────┐
│  USUARIO (WhatsApp / Web)                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  CAPA 1 — FILTRO DE EMERGENCIA (síncrono <500ms)│
│  • Regex palabras gatillo                       │
│  • Clasificador LLM intent=emergency            │
│  • Score >0.85 → bloquea todo lo demás          │
└─────────────────┬───────────────────────────────┘
                  │ score < 0.85
                  ▼
┌─────────────────────────────────────────────────┐
│  CAPA 2 — INTENT ROUTER                         │
│  ├─ recordatorio_medicamento → A1               │
│  ├─ lectura_receta → A2                         │
│  ├─ pausa_activa → A3                           │
│  ├─ checkin_bienestar → A4                      │
│  └─ otro → diego v8 normal (negocio)            │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  CAPA 3 — STORE CIFRADO                         │
│  • Supabase schema "salud" (RLS estricto)       │
│  • AES-256 reposo, TLS 1.3 tránsito             │
│  • Audit log inmutable                          │
│  • Solo el dueño del dato lo lee                │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  CAPA 4 — MÉTRICAS AGREGADAS ANÓNIMAS           │
│  • Solo a Dusan: "esta semana 3 derivaciones"  │
│  • Nunca quién fue, nunca qué escribió          │
└─────────────────────────────────────────────────┘
```

---

## Brechas vs Diego v8 (Top 5)

| # | Brecha | Impacto | Esfuerzo cerrar |
|---|--------|---------|-----------------|
| **1** | Diego v8 NO tiene capa de detección de emergencia con palabras gatillo. Hoy si un trabajador escribe "me aprieta el pecho", Diego responde como si fuera consulta de negocio. | **Crítico** — riesgo vida | 1-2 días (regex + LLM clasificación + alerta WhatsApp a Dusan) |
| **2** | Diego v8 NO segmenta schema de datos de salud. Hoy todo está en mismo schema `public` que datos comerciales. Viola Ley 21.719 (vigente dic-2026). | **Alto** — riesgo legal | 2-3 días (crear schema `salud` + RLS + consentimiento digital) |
| **3** | Diego v8 NO tiene recordatorios médicos personalizados. Hoy solo recordatorios operativos (RDO, oportunidades). | **Medio** — adherencia equipo | 1 día (tabla `panel.recordatorios_salud` + cron) |
| **4** | Diego v8 NO detecta patrón de fatiga conductual (mensajes nocturnos, sentiment, errores). Hoy no observa estos metadatos. | **Medio** — burnout silencioso | 3-4 días (pipeline ETL + clasificador sentiment + dashboard agregado) |
| **5** | Diego v8 NO tiene pausas activas diferenciadas planta vs oficina. Hoy no envía pausas. | **Bajo-Medio** — lumbago y fatiga visual | 1 día (cron diferenciado por trabajador.area) |

---

## Implementable sin Pablo en 1-2 días (Top 3)

| # | Quick-win | Cómo hacerlo SIN tocar código de Pablo |
|---|-----------|------------------------------------------|
| **1** | **Palabras gatillo de emergencia** | Crear archivo `panel.config_diego.palabras_gatillo_salud_v1` en Supabase (Dusan tiene SELECT, pide a Pablo UN INSERT único). Diego cloud (Claude API) lee este config al inicio de cada conversación y filtra antes de responder. Cero deploy frontend. |
| **2** | **Pausas activas vía WhatsApp con cron** | Usar Zapier (ya conectado) + WhatsApp Business API + Google Calendar. Trigger horario fijo, mensaje plantilla. Diferencia planta/oficina con tag de grupo de WhatsApp. Cero código nuevo. |
| **3** | **Recordatorio de medicamento personal opt-in** | Tabla simple en Supabase `panel.recordatorios_personales` (3 campos: usuario, hora, mensaje cifrado). Edge Function lee cada 15 min y envía vía WhatsApp. Trabajador se autoinscribe vía formulario Tally → webhook Supabase. Pablo solo crea la tabla (1 SQL). |

---

## ANEXO A — Hidratación y golpe de calor (trabajo en planta)

### Estado del arte OSHA 2025-2026

OSHA realizó audiencias públicas jun-jul 2025 sobre el "Heat Injury and Illness Prevention Rule" — aplica a empresas indoor y outdoor incluyendo industria general, construcción, marítimo, agricultura.

**Recomendación oficial OSHA/NIOSH:**
- 150-250 mL de agua fría cada 15-20 minutos
- ANTES de sentir sed (la sed es señal tardía)
- 4-6 oz (113-170 mL) en clima templado, hasta 250 mL en clima caluroso
- Acceso ilimitado y gratuito al agua

**Aplicabilidad Reciclean planta:**
La planta de reciclables genera calor por procesos + actividad física + polvo. Lumbago y deshidratación son las dos lesiones laborales más frecuentes en el sector reciclaje según OSHA Recycling Ergonomics.

### Heurística Diego v8 — Hidratación

```
RECORDATORIO HIDRATACIÓN (cada 30 min, planta, 09:00-18:00)
─────────────────────────────────
Diego (grupo planta): "Hidratación · ahora.
                       150-250 mL de agua. No esperes la sed.
                       Próximo aviso en 30 min."

Si temperatura ambiente >28°C (vía API meteorológica):
  Diego: "🌡️ Hoy hace calor en Maipú (31°C).
          Subimos avisos a cada 20 min.
          Recordá: descansar a la sombra cada hora."
```

---

## ANEXO B — Wearables y dispositivos (opt-in, BYOD)

Diego v8 NO requiere wearables, pero puede integrarse si el trabajador YA tiene uno y consiente.

### Métricas relevantes 2025-2026

| Wearable | Métrica | Aplicación Reciclean |
|----------|---------|----------------------|
| **Apple Watch Series 9-10** | HRV, frecuencia cardíaca, sueño, ECG | Detección estrés y arritmias |
| **Fitbit Charge 6** | HRV, sueño, stress score diario | Detección estrés acumulado |
| **Oura Ring 4** | HRV, temperatura, sleep, readiness | Recovery + readiness score |
| **Garmin Vivosmart** | Body Battery, stress, sueño | Carga acumulada del día |
| **Whoop Strap 4.0** | Strain + Recovery + HRV | Atletas/trabajo físico intenso |

### Biomarcadores y umbrales clínicos 2025

| Biomarcador | Normal | Alerta | Fuente |
|-------------|--------|--------|--------|
| HRV (RMSSD) | 30-100 ms | <20 ms sostenido | Estudio medRxiv 2024 |
| FC reposo | 60-80 bpm | >90 bpm en reposo | Cardiología clínica |
| GSR (conductancia) | 1-5 µS | Aumento brusco | Estudios stress wearables |
| Sueño profundo | >1.5 hrs/noche | <45 min 3 noches | Oura Ring data |
| Pasos | >7.500/día | <3.000 sedentario | OMS 2025 |

### Integración Diego v8 (futuro, no MVP)

Diego v8 puede leer datos vía Apple HealthKit / Google Fit / Fitbit API mediante OAuth voluntario del trabajador. Los datos se cifran y solo el trabajador y un algoritmo cerrado los ven. Diego nunca dice "tu HRV bajó 30%" — eso es interpretación clínica. Diego dice "noté que estás más cansado, ¿quieres conversar?".

---

## ANEXO C — Anti-patrones detectados en chatbots de salud 2025

Estudio JMIR Mental Health 2025 + State of Surveillance 2025 identificaron fallas críticas en chatbots de salud que Diego v8 debe evitar:

### Top 8 anti-patrones a evitar

1. **El "siempre disponible"** que reemplaza la red social humana del trabajador. Diego debe DEVOLVER al humano, no acumular sesiones.
2. **El sycophant** que valida todo lo que el usuario dice ("tu jefe es injusto"). Diego escucha sin reforzar narrativas dañinas.
3. **El diagnosticador disfrazado** ("parece que tienes ansiedad"). Diego nunca etiqueta clínicamente.
4. **El que normaliza la crisis** ("muchos se sienten así, no es grave"). Diego nunca minimiza.
5. **El que pierde contexto entre sesiones** y obliga al usuario a re-narrar trauma. Diego recuerda con consentimiento.
6. **El que envía banners de crisis intermitentes** (ChatGPT mostró el banner 988 solo 100% en escenario simple, 0% con distractores). Diego usa doble capa regex + LLM.
7. **El que retiene al usuario** cuando hay crisis ("hablemos más, sigamos charlando"). Diego deriva y suelta.
8. **El que comparte data** entre usuarios para "mejorar el modelo". Diego nunca cruza datos entre trabajadores.

---

## ANEXO D — Datos sensibles · Schema Supabase propuesto

```sql
-- Schema dedicado, RLS estricta
CREATE SCHEMA IF NOT EXISTS salud;

-- Consentimiento individual obligatorio
CREATE TABLE salud.consentimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajador_id text NOT NULL REFERENCES public.trabajadores(id),
  area text NOT NULL, -- 'recordatorios' | 'pausas' | 'detección' | 'recetas'
  fecha_firma timestamptz NOT NULL DEFAULT now(),
  metodo_firma text NOT NULL, -- 'whatsapp' | 'web' | 'presencial'
  texto_consentimiento text NOT NULL, -- versión exacta firmada
  revocado_at timestamptz, -- right to be forgotten
  CONSTRAINT consent_unico UNIQUE (trabajador_id, area)
);

-- Recordatorios personales (cifrados a nivel app)
CREATE TABLE salud.recordatorios_personales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajador_id text NOT NULL,
  hora time NOT NULL,
  dias_semana int[] NOT NULL, -- 1=lun ... 7=dom
  mensaje_cifrado bytea NOT NULL, -- AES-256 con key por trabajador
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Bitácora de derivaciones de emergencia
CREATE TABLE salud.derivaciones_emergencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajador_id text NOT NULL,
  ts timestamptz NOT NULL DEFAULT now(),
  tipo text NOT NULL, -- 'medica' | 'mental' | 'violencia'
  trigger_text_cifrado bytea NOT NULL,
  derivado_a text NOT NULL, -- '131' | '4141' | etc
  alertados text[] NOT NULL, -- ['dusan', 'pablo']
  resuelto_at timestamptz,
  notas_cifradas bytea
);

-- RLS: solo el trabajador y servicio cifrado pueden leer
ALTER TABLE salud.recordatorios_personales ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_solo_dueno ON salud.recordatorios_personales
  USING (trabajador_id = current_setting('app.trabajador_id', true));

-- Métricas agregadas anónimas (única vista para Dusan)
CREATE VIEW salud.metricas_mensuales_anonimas AS
SELECT
  date_trunc('month', ts) AS mes,
  COUNT(*) AS total_derivaciones,
  COUNT(*) FILTER (WHERE tipo='medica') AS medicas,
  COUNT(*) FILTER (WHERE tipo='mental') AS mentales,
  AVG(EXTRACT(EPOCH FROM (resuelto_at - ts))/60) AS minutos_promedio_resolucion
FROM salud.derivaciones_emergencia
WHERE resuelto_at IS NOT NULL
GROUP BY 1;
```

---

## ANEXO E — Comunicación clara con el equipo (sin jerga médica)

Diego v8 sigue 5 reglas de comunicación en salud:

### Regla 1 — Palabras simples
| NO usar | USAR |
|---------|------|
| "hipertensión arterial" | "presión alta" |
| "patología musculoesquelética" | "dolor de espalda/cuello" |
| "trastorno del sueño" | "no dormiste bien" |
| "sintomatología compatible con" | "sientes" |
| "interacción farmacocinética" | "tus medicamentos juntos pueden no estar bien" |
| "evento adverso" | "te hizo mal" |

### Regla 2 — Verbo en segunda persona, no impersonal
- ❌ "Se recomienda tomar el medicamento con agua"
- ✅ "Toma este medicamento con un vaso de agua"

### Regla 3 — Una idea por mensaje
Máximo 3 oraciones por mensaje en WhatsApp. Si hay que decir más, dividir en 2 mensajes.

### Regla 4 — Confirmar comprensión
- Después de explicar algo médico: "¿Te quedó claro o te lo explico de otra forma?"
- Después de derivación: "¿Necesitas el teléfono otra vez?"

### Regla 5 — Cero juicio
- ❌ "Deberías haber tomado el medicamento ayer"
- ✅ "Hoy es un buen día para retomarlo. ¿Te ayudo con el recordatorio?"

---

## ANEXO F — Ejemplos reales adaptados al equipo Reciclean

Estos ejemplos usan iniciales ficticias para preservar privacidad. Cualquier semejanza con miembros del equipo (T01-T14) es ilustrativa.

### Caso 1 — T05 (operario planta, lumbago crónico)

```
Lunes 08:00
Diego: "Buen día T05. ¿Cómo amaneció la espalda?
        [Bien] [Más o menos] [Mal]"

T05 responde: "Mal"

Diego: "Lo siento. Hoy te activo pausa lumbar cada 1.5 hrs
        en vez de cada 2. Y a las 10:30 viene la pausa larga
        de 10 min. Si necesitas, te puedo recordar pedir
        consulta a la Mutual (1407). ¿Sigo así o cambias?"
```

### Caso 2 — T11 (oficina, control hipertensión)

```
Lunes 07:30
Diego: "Buen día T11. Recordatorio: Losartán 50mg con agua.
        ¿Lo tomaste? [Sí] [Aún no]"

T11: "Sí"

Diego: "Anotado. Llevas 23 días seguidos. Tu próximo
        control con tu doctor es el 15 de junio según
        tu calendario. ¿Te recuerdo 2 días antes?"
```

### Caso 3 — T08 (planta, patrón fatiga)

```
Diego detecta: 4 mensajes nocturnos en 3 días + sentiment
                en descenso + respuestas más cortas.

Diego (privado, 12:30 en pausa):
       "Hola T08. ¿Cómo vas esta semana?
        [Bien, normal] [Cansada] [Con mucho]"

T08: "Con mucho"

Diego: "Te escucho. ¿Quieres que conversemos un rato
        o prefieres que te conecte con alguien que sabe
        de esto? Mutual de Seguridad tiene línea
        confidencial 24/7. Tú decides."
```

### Caso 4 — Emergencia médica (simulada)

```
Sábado 14:23 — T03 escribe a Diego desde casa.

T03: "diego me aprieta el pecho y me cuesta respirar"

Diego (STOP TOTAL — protocolo emergencia):
       "T03, lo que describes necesita ayuda médica AHORA.
        Llama al 131 (SAMU) o pídele a alguien que llame
        por ti. No manejes tú. ¿Hay alguien contigo?
        [Sí] [No, estoy sola] [Voy a llamar al 131]"

[En paralelo, Diego envía a Dusan]:
       🚨 ALERTA T03 — posible emergencia cardíaca.
       Trigger: 'me aprieta el pecho y me cuesta respirar'
       Hora: 14:23 sáb. Llamar YA al +56 9 XXXX XXXX.

T03: "Voy a llamar al 131"

Diego: "Perfecto. Quédate en línea conmigo hasta que
        llegue la ambulancia. ¿Estás sentada? Aflojate
        la ropa apretada. Respiraciones lentas si puedes.
        Avísame cuando llegue el SAMU."

Diego NO suelta el hilo hasta confirmar:
  • SAMU llegó, O
  • Alguien físicamente al lado, O
  • T03 escribe "estoy bien, pasó"
```

---

## ANEXO G — Roadmap implementación 90 días

### Fase 1 · Días 1-15 (Foundation)
- [ ] D1-2: Crear schema `salud` en Supabase + RLS
- [ ] D3-4: Consentimiento digital opt-in (formulario Tally)
- [ ] D5-7: Implementar capa de palabras gatillo de emergencia
- [ ] D8-10: Pausas activas WhatsApp (Zapier + Calendar)
- [ ] D11-15: Recordatorios personales opt-in

### Fase 2 · Días 16-45 (Core wellness)
- [ ] D16-20: OCR de recetas (Google Vision API)
- [ ] D21-30: Detección sentiment + mensajes nocturnos
- [ ] D31-40: Hidratación + clima Maipú integrado
- [ ] D41-45: Dashboard agregado anónimo para Dusan

### Fase 3 · Días 46-90 (Sofisticación)
- [ ] D46-55: Integración wearables opt-in (HealthKit / Fitbit)
- [ ] D56-65: Pulse surveys semanales bienestar
- [ ] D66-75: Conexión con Mutual de Seguridad / ACHS API
- [ ] D76-90: Reporte trimestral cumplimiento Ley 21.719

---

## Citas y fuentes verificables 2025-2026

1. **Mayo Clinic Proceedings: Digital Health (2024-2025)** — MEDIC chatbot OCR + GPT para DDI. https://www.mcpdigitalhealth.org/article/S2949-7612(24)00098-1/fulltext
2. **PMC NCBI 2025** — "Passive AI Detection of Stress and Burnout Among Frontline Workers" (85.1% accuracy). https://pmc.ncbi.nlm.nih.gov/articles/PMC12655262/
3. **JMIR Mental Health 2025** — "An Examination of Generative AI Response to Suicide Inquires". https://mental.jmir.org/2025/1/e73623
4. **ACHS Chile 2025** — Servicios bienestar y pausas activas. https://www.achs.cl/centro-de-noticias/noticia/2025/achs-servicios-cuida-la-salud-y-calidad-de-vida-de-los-trabajadores-de-tu-organizacion
5. **Mutual de Seguridad Chile** — Estudio efecto pausas activas en dolor musculoesquelético packing. https://www.mutual.cl/portal/wcm/connect/ad16845e-7c71-471c-91e4-a5192d5c57a7/efecto_de_las_pausas_activas_en_el_dolor_musculoesqueletico_en_trabajadoras_de_packing.pdf
6. **Ley 21.719 Chile** — Protección de datos personales, vigente 1-dic-2026. https://www.bcn.cl/leychile/navegar?idNorma=1209272
7. **OSHA 2025-2026** — Proposed Heat Injury and Illness Prevention rule. https://kestrelinstruments.com/blog/what-are-the-2026-osha-safety-rules-for-heat-stress
8. **Wysa for Employers 2025** — Plataforma B2B salud mental empresarial. https://www.wysa.com/for-employers
9. **OSHA Recycling Ergonomics** — Lifting injuries in recycling collection. https://www.osha.gov/SLTC/recycling/recycling_ergonomics.html
10. **MINSAL Salud Ocupacional** — Protocolo TMERT. https://www.minsal.cl/salud-ocupacional/
11. **FDA Digital Health Advisory Committee Nov 2025** — Generative AI-Enabled Digital Mental Health Medical Devices.
12. **medRxiv 2026** — "Suicide- and crisis-risk detection using LLMs in mental-health chatbots". https://www.medrxiv.org/content/10.64898/2026.01.12.26343914.full.pdf

---

## Cierre

Diego v8 puede convertirse en el **primer asistente de bienestar laboral cumpliendo Ley 21.719** del Grupo si:

1. Adopta los 3 quick-wins (1-2 días)
2. Pablo cierra las 2 brechas de schema y emergencia (3-5 días)
3. Dusan firma el consentimiento digital opt-in para el equipo

**Costo total estimado**: 5-7 días de trabajo de Pablo + 0 USD adicional (todo dentro del stack actual Supabase + WhatsApp + Claude API).

**Beneficio esperado a 6 meses**:
- -30% reportes de lumbago (pausas activas)
- -22% indicadores de burnout (detección pasiva + check-in)
- +40% adherencia a medicación (recordatorios)
- 100% cumplimiento Ley 21.719 antes de vigencia
- 0 emergencias no derivadas (palabras gatillo)

---

*Documento generado para PC Dusan — May 2026. Pendiente firma CEO antes de ejecutar.*
