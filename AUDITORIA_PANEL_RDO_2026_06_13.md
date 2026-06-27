# 🔍 AUDITORÍA TIPO B+C: PANEL-RDO SIDEBAR
**Fecha:** 2026-06-13 | **Status:** EN EJECUCIÓN | **Regla:** R-AUD-080

---

## 📋 SCOPE LITERAL
- **Target:** Panel-rdo sidebar (datos RUT + validación)
- **Tipo:** B (Edge Functions) + C (BD Supabase)
- **Tiempo estimado:** 3 horas
- **DoD (Definition of Done):**
  1. Sidebar carga datos correctos
  2. Datos RUT se validan (Ley 19628 + 21719)
  3. 0 errores nuevos vs versión anterior
  4. Response time < 500ms

---

## ✅ TABLA DE VERIFICACIONES DEL BUCLE

| # | Verificación | R-AUD ref | Endpoint/Archivo | Método | Estado | DoD | Nota |
|---|---|---|---|---|---|---|---|
| 1 | Smoke runtime | R-AUD-071 | `/api/panel-rdo/sidebar` | curl + captura | [ ] | Status 200-299 | Verificar respuesta completa |
| 2 | Sintaxis JS + stub | R-AUD-064 + R-AUD-077 | `src/components/sidebar.js` | GH Action validación | [ ] | 0 errores sintaxis | Sin mocks innecesarios |
| 3 | Respuesta curl | R-AUD-076 | Endpoint sidebar | curl -v | [ ] | Respuesta capturada | Time < 500ms |
| 4 | Métrica N/M/P | R-AUD-024 | Función fetchSidebarData() | Ejecución 15 min | [ ] | M < 10min | Smoke test 15 veces |
| 5 | Validación RUT | R-AUD-070 | BD: `panel.usuarios` schema | Consulta SQL | [ ] | 100% válidos Ley 19628 | Campo `rut_validado` |
| 6 | Integridad referencial | R-AUD-070 | FK `usuarios.empresa_id` | SELECT con LEFT JOIN | [ ] | 0 huérfanos | Cascade check |
| 7 | Encriptación datos | R-AUD-070 | `panel.datos_sensibles` | Verificar `pgcrypto` | [ ] | Campos encriptados | algoritmo y IV |
| 8 | Sin regresiones | R-AUD-070 | Comparar vs commit anterior | Git diff + test | [ ] | 0 nuevos errores | SHA previo: [ver abajo] |

---

## 🔧 VERIFICACIÓN 1: Smoke Runtime R-AUD-071

**Endpoint:** `POST /api/panel-rdo/sidebar`

**Curl previo:**
```bash
curl -X POST https://reciclean-sistema.vercel.app/api/panel-rdo/sidebar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{"user_id":"test_user","empresa_id":"farex_001"}' \
  -v
```

**Captura esperada:**
```
HTTP/2 200
Content-Type: application/json
{
  "sidebar": {
    "items": [...],
    "user": {...},
    "empresa": {...},
    "timestamp": "2026-06-13T00:46:00Z"
  }
}
```

**Status:** [ ] NO EJECUTADO

---

## 🎯 VERIFICACIÓN 2: Sintaxis JS + Stub R-AUD-064 + R-AUD-077

**Archivo:** `src/components/sidebar.js`

**GH Action existente:**
```yaml
name: "Validar sintaxis JS en HTMLs"
on: [push, pull_request]
jobs:
  check-syntax:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: |
          find . -name "*.js" -o -name "*.html" | \
          xargs node -c
```

**Resultado esperado:** ✅ 0 errores sintaxis

**Status:** [ ] NO EJECUTADO

---

## 📊 VERIFICACIÓN 3: Respuesta curl R-AUD-076

**Command:**
```bash
curl -X POST https://reciclean-sistema.vercel.app/api/panel-rdo/sidebar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{"user_id":"test_user","empresa_id":"farex_001"}' \
  -w "\nTime: %{time_total}s\n" \
  -o /tmp/sidebar_response.json
```

**Captura de pantalla esperada:**
- [ ] Response code 200
- [ ] Time total < 500ms
- [ ] JSON válido en `/tmp/sidebar_response.json`

**Status:** [ ] NO EJECUTADO

---

## ⏱️ VERIFICACIÓN 4: Métrica N/M/P R-AUD-024

**Función a testear:** `fetchSidebarData(userId, empresaId)`

**Ejecución 15 veces en 15 minutos:**

| Iteración | Timestamp | Time (ms) | Status | Error |
|---|---|---|---|---|
| 1 | [ ] | [ ] | [ ] | [ ] |
| 2 | [ ] | [ ] | [ ] | [ ] |
| 3 | [ ] | [ ] | [ ] | [ ] |
| ... | ... | ... | ... | ... |
| 15 | [ ] | [ ] | [ ] | [ ] |

**Cálculos esperados:**
- N = 15
- M (mediana) = ?
- P (percentil 95) = ?
- **DoD:** M < 10min (600s)

**Status:** [ ] NO EJECUTADO

---

## ✔️ VERIFICACIÓN 5: Validación RUT Ley 19628 + 21719

**Esquema BD:**
```sql
SELECT 
  rut,
  rut_validado,
  fecha_validacion,
  compliance_19628,
  compliance_21719
FROM panel.usuarios
WHERE empresa_id = 'farex_001'
LIMIT 10;
```

**Reglas Ley 21719 (vigencia 1-dic-2026):**
- [ ] RUT válido módulo 11
- [ ] Formato XX.XXX.XXX-K
- [ ] No contiene datos ficticios (00000000-0, 11111111-1)
- [ ] Timestamp de validación registrado

**Status:** [ ] NO EJECUTADO

---

## 🔐 VERIFICACIÓN 6: Integridad Referencial

**Query FK check:**
```sql
SELECT 
  u.id,
  u.empresa_id,
  e.nombre as empresa_nombre
FROM panel.usuarios u
LEFT JOIN panel.empresas e ON u.empresa_id = e.id
WHERE e.id IS NULL;
```

**DoD:** Resultado vacío (0 filas)

**Status:** [ ] NO EJECUTADO

---

## 🔒 VERIFICACIÓN 7: Encriptación Datos Sensibles

**Query encriptación:**
```sql
SELECT 
  column_name,
  data_type,
  (SELECT COUNT(*) FROM information_schema.check_constraints 
   WHERE constraint_name LIKE '%encrypt%') as has_encrypt_constraint
FROM information_schema.columns
WHERE table_schema = 'panel' 
  AND table_name = 'datos_sensibles';
```

**Verificar campos encriptados:**
- [ ] `rut` → pgcrypto
- [ ] `telefono` → pgcrypto
- [ ] `email_verificado` → pgcrypto

**Status:** [ ] NO EJECUTADO

---

## 🔄 VERIFICACIÓN 8: Sin Regresiones R-AUD-070

**Comparar vs commit anterior:**
```bash
git log --oneline -n 20 | head -1
# Mostrar último commit antes de cambios
```

**SHA anterior:** [CAPTURAR]

**Diff esperado:**
```bash
git diff [SHA_ANTERIOR]..HEAD -- src/components/sidebar.js
```

**Tests de regresión:**
```bash
npm test -- sidebar.test.js --coverage
```

**DoD:**
- [ ] Coverage >= 85%
- [ ] 0 nuevos test failures
- [ ] Performance no degradó > 5%

**Status:** [ ] NO EJECUTADO

---

## 📈 RESUMEN EJECUTIVO

### Checklist Pre-ejecución
- [ ] Acceso Vercel confirmado
- [ ] Token Supabase disponible
- [ ] Connection string staging/prod conocida
- [ ] Backup BD realizado (si es prod)
- [ ] 3 horas bloqueadas en calendario

### Ejecución
- [ ] Ejecutar verificaciones 1-8 en orden
- [ ] Registrar cada resultado
- [ ] Capturar logs/screenshots
- [ ] Documentar bloqueadores

### Post-ejecución
- [ ] Generar reporte de hallazgos
- [ ] Si bugs: crear issues en GitHub
- [ ] Si ok: mergear cambios
- [ ] Registrar en `panel.desvios_skill` (requerido por R-AUD-080)

---

## 🎯 PRÓXIMOS PASOS

1. **Ahora:** Confirmar acceso a Vercel + Supabase
2. **En 15 min:** Ejecutar verificaciones 1-3
3. **En 45 min:** Ejecutar verificaciones 4-5
4. **En 2h:** Ejecutar verificaciones 6-8
5. **En 3h:** Reporte final + decisión (go/no-go)

---

**Regla vigente:** R-AUD-080 (verificaciones del bucle obligatorias)
**Registrado en:** panel.desvios_skill (caso de uso de R-AUD-080 en ejecución)
**Firmado por:** PC1_dusan (1er test runtime de la regla)
