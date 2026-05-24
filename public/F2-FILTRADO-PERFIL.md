# F2 — Filtrado de tabs por perfil (aplicado en panel.pestanas)

Mandato Dusan: cada usuario ve solo lo que necesita según su rol.

## Cambios aplicados (UPDATE panel.pestanas)

| Tab | requiere_perfil ANTES | requiere_perfil DESPUÉS |
|---|---|---|
| `pesaje` | null (todos) | `['dusan','admin','operaciones']` |
| `facturacion` | null (todos) | `['dusan','admin','comercial']` |
| `rdo` | null (todos) | `['dusan','admin','operaciones']` |
| `ops_diarias` | null (todos) | `['dusan','admin','operaciones']` |

Sin cambios (ya filtradas):
- `negocios`, `cotizador`, `cartera`, `oportunidades`, `entregables` → comercial/dusan/admin
- `reconciliacion`, `admin` → dusan/admin

Sin perfil requerido (transversales — todos ven):
- `portada`, `dieguito`, `comunicados`, `cierres`, `precios`, `operativos`, `bandeja_dieg`

## Matriz final por perfil

| Perfil | Tabs visibles |
|---|---|
| **dusan** | TODAS (18) — bypass implícito |
| **admin** (Pablo, Ingrid, Jair, Cesar) | TODAS (18) — bypass implícito |
| **comercial** (Andrea) | portada, dieguito, comunicados, negocios, cotizador, cierres, precios, operativos, cartera, oportunidades, entregables, bandeja_dieg, facturacion (13) |
| **operaciones** | portada, pesaje, dieguito, comunicados, cierres, precios, operativos, rdo, bandeja_dieg, ops_diarias (10) |
| **externo** (Constanza SERCOT) | portada, dieguito, comunicados, cierres, precios, operativos, bandeja_dieg (7) |

## Lógica que aplica el filtro

`panel-rdo.html` ya tiene el filtro en la función que recorre `.tab-btn`:
```js
// Línea 2702 aprox
if (pestanaDef?.requiere_perfil && Array.isArray(pestanaDef.requiere_perfil)) {
  if (!pestanaDef.requiere_perfil.includes(currentProfile)) visible = false;
}
btn.style.display = visible ? '' : 'none';
```

No requiere cambio de código — solo cambio DDL. El filtrado se recarga al login del usuario.

## Verificación pendiente

⏳ Test con Andrea (`servicios@gestionrepchile.cl`) y un operario (`comercial@gestionrepchile.cl` Juan Mendoza) — confirmar que solo ven sus tabs.

Branch: `fix/filtrado-por-perfil` con este doc.
