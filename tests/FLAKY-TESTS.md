# Tests flaky · registro

Cada vez que un test pase en local pero falle en CI (o viceversa), registrar acá:

```
## YYYY-MM-DD test/<archivo>.spec.ts
- Síntoma: "..."
- Frecuencia: N falsos positivos en M ejecuciones
- Hipótesis: timeout, race condition, datos cambiantes
- Acción: agregar retry, esperar selector específico, normalizar datos seed
```

---

(sin entradas todavía — agregar al detectar primer flaky)
