# Plantilla — Guia de Consulta SII

> Pasos exactos para realizar consulta de situacion tributaria de un proveedor.

## Datos a recopilar antes de la consulta

- **RUT del proveedor** (formato: 76.629.600-9)
- **Razon social**
- **Material entregado** (descripcion exacta)
- **Lista de facturas ya emitidas** (numeros, fechas, montos)

---

## Paso a paso

### 1. Acceso al portal SII

URL: **https://zeus.sii.cl/cvc_cgi/stc/getstc**

(Tambien accesible desde www.sii.cl → Servicios online → Situacion tributaria de terceros)

### 2. Ingresar RUT

- Formato: con puntos y guion (ej: 76.629.600-9)
- Resolver captcha si lo solicita

### 3. Capturar las siguientes secciones (TODAS)

#### A. Inicio de Actividades
- Fecha de inicio
- Estado: VIGENTE / NO VIGENTE
- Si NO VIGENTE → caso especial, consultar abogado

#### B. Actividades Economicas (Giros)
- **CRITICO**: capturar TODAS las actividades, no solo las primeras
- Si la tabla es larga, presionar "Ver mas" o expandir
- Formato esperado:
  ```
  1. [Codigo] [Nombre actividad]
  2. [Codigo] [Nombre actividad]
  ...
  ```

#### C. Documentos Autorizados
- Lista completa (puede tener 19+ items)
- Verificar especialmente:
  - Factura Electronica
  - **Factura de Compra Electronica** (CRITICO)
  - Boleta Electronica
  - Guia de Despacho Electronica
  - Notas de Credito/Debito

#### D. Direccion comercial
- Direccion registrada
- Comuna y ciudad

### 4. Verificacion de Agente Retenedor

URL alternativa: https://www.sii.cl/preguntas_frecuentes/iva/001_030_5838.htm

Buscar al RUT en la lista publicada por SII bajo Res. Ex. 42/2018 (scrap metal) o Res. Ex. 29/2005 (papel/carton).

### 5. Guardar evidencia

- Descargar/imprimir como PDF
- Nombre del archivo: `consulta-sii-[RUT]-[FECHA].pdf`
- Guardar en: `negocios/[caso]/_fuente/consulta-sii-[fecha].pdf`

---

## Tabla diagnostica resultante

Una vez completada la consulta, llenar:

| Pregunta | Respuesta SAMEX | Aplica al caso? |
|----------|-----------------|-----------------|
| Inicio Actividades vigente? | Si/No | |
| N° de giros registrados | [N] | |
| Algun giro de comercio del material? | Si/No | |
| Autorizado para FC? | Si/No | |
| Autorizado para Factura de Venta? | Si/No | |
| Es Agente Retenedor (42/2018)? | Si/No | |
| Es Agente Retenedor (29/2005)? | Si/No | |
| Material entregado | [tipo] | |
| Resolucion sujeto IVA aplicable? | [N°/Ninguna] | |

---

## Modelo colaborativo recomendado

Dado que el portal SII requiere captcha y autenticacion humana:

1. **Persona en Reciclean** (Dusan, Pablo, Andrea o Nicolas) ejecuta la consulta directamente en el navegador
2. **Captura** los PDFs y screenshots
3. **Pega los datos** en la conversacion con Claude Code
4. **Claude Code analiza** la informacion y produce la tabla diagnostica + recomendacion

Este metodo aprovecha lo mejor de cada parte:
- El humano resuelve captchas y autenticacion
- La IA estructura, analiza normativa y produce documentos
