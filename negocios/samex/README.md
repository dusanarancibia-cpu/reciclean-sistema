# Caso SAMEX SPA — Resumen Ejecutivo

**Estado**: En curso (Mayo 2026)
**Responsable Reciclean**: Dusan Arancibia (Gerencia)
**Apoyo tecnico**: Pablo + Claude Code
**Apoyo contable**: Dyana
**Apoyo comercial**: Andrea

---

## Datos del proveedor

- **Razon social**: SAMEX SPA
- **RUT**: 76.629.600-9
- **Giro principal**: Recoleccion de Residuos No Peligrosos
- **Direccion**: Ruiz Tagle 202, Estacion Central, Santiago

---

## El caso en 1 parrafo

SAMEX entrego 5 cargas de **Stretch Film para Lavado** (plastico reciclado) a planta Reciclean. Las primeras 3 entregas se documentaron con Factura de Compra emitida por Reciclean. SAMEX argumenta que las 2 ultimas entregas deberian ser facturadas por ellos. Reciclean analizo y determino que el plastico reciclado **no tiene Resolucion Exenta SII de cambio de sujeto IVA**, por lo que aplica DL 825 Art. 3° (vendedor emite factura). Sin embargo, SAMEX tiene 7 giros, todos de transporte/logistica, y no esta autorizado para emitir Factura de Compra. La pregunta abierta es si SAMEX es propietario del material o transportista de un tercero.

---

## Hallazgos clave

| Item | Valor |
|------|-------|
| N° entregas total | 5 |
| Entregas facturadas (FC Reciclean) | 3 |
| Entregas pendientes | 2 |
| Material entregado | Stretch Film para Lavado (plastico reciclado) |
| Cantidad total facturada | 1.098 kg (449 + 330 + 319) |
| Monto total facturado neto | $71.890 |
| N° giros SAMEX en SII | 7 (todos transporte/logistica) |
| FC autorizada para SAMEX | NO |
| Agente Retenedor SII | NO |
| Res. Ex. cambio sujeto IVA aplicable | NO existe para plastico |

---

## Estructura de carpetas

```
samex/
├── README.md                        ← este archivo
├── _fuente/                         ← documentos originales
│   ├── facturas-emitidas/           ← 3 FC ya emitidas
│   ├── consulta-sii-15abr2026.pdf   ← consulta tributaria SAMEX
│   ├── whatsapp-pablo-andrea.txt    ← comunicacion interna
│   └── texto-respuesta-andrea.pdf   ← borrador inicial
├── analisis/                        ← memo diagnostico + tabla
│   ├── memo-diagnostico.md
│   └── tabla-diagnostica.md
└── resolucion/                      ← entregables firmados
    ├── carta-gerencia.pdf
    ├── presentacion-ejecutiva.pdf
    └── acciones-internas.md
```

---

## Cronologia

| Fecha | Evento |
|-------|--------|
| [Abr 2026] | Entrega 1: 449 kg @ $80 = $35.920 — FC emitida por Reciclean |
| [Abr 2026] | Entrega 2: 330 kg @ $80 = $26.400 — FC emitida por Reciclean |
| [Abr 2026] | Entrega 3: 319 kg @ $30 = $9.570 — FC emitida por Reciclean |
| [Abr 2026] | Entrega 4: pendiente — SAMEX dice "deberian emitir ellos" |
| [Abr 2026] | Entrega 5: pendiente |
| 15-Abr-2026 | Consulta SII situacion tributaria SAMEX |
| 04-May-2026 | Borrador respuesta Andrea |
| 05-May-2026 | Memo diagnostico Claude Code + analisis normativo |
| [Pendiente] | Llamada informal Andrea a SAMEX (pregunta clave) |
| [Pendiente] | Carta formal Gerencia a SAMEX |
| [Pendiente] | Reunion asesor tributario externo |

---

## Proximos pasos

1. **Andrea**: Llamada informal a SAMEX → "Es propietario del material o transportista por cuenta de un tercero?"
2. **Gerencia**: Enviar carta formal segun resultado
3. **Si A**: Coordinar ampliacion giro F4415 con SAMEX
4. **Si B**: Emitir 3 NC + solicitar facturacion del vendedor real
5. **Nicolas**: Auditar FC ultimos 12 meses para detectar otros casos similares
6. **Dusan**: Reunion con asesor tributario externo (esta semana)

---

## Documentacion del metodo

Este caso sigue el metodo descrito en:
- `docs/metodo-resolucion-casos-tributarios.md`

Plantillas reutilizables:
- `negocios/_metodo/`
