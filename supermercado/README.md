# Lista Supermercado — Comparador Líder vs Alvi

App standalone para comparar precios de una lista de compra entre dos supermercados
(Líder Central y Alvi Plaza Maipú) y exportar a PPTX inteligente.

## Cómo usarlo

1. Abrir `supermercado/index.html` en el navegador (no requiere servidor).
2. **Verificar precios**: cada producto tiene botones `🔍 Líder` y `🔍 Alvi` que abren
   la búsqueda en la web oficial. Ajustá el precio inline según lo que veas.
3. **Marcar productos al carro**: checkbox al inicio de cada fila. Progreso en tiempo real.
4. **Exportar PPTX**: genera 4 slides:
   - Portada con totales comparativos y ganador global
   - Tabla comparativa producto por producto con ★ en el más barato
   - Lista de compra para Líder (para imprimir)
   - Lista de compra para Alvi (para imprimir)
   - Compra mixta óptima (dónde comprar cada cosa para mínimo costo)

## Persistencia

Todo se guarda en `localStorage` bajo la clave `supermercado_v1`.
Botón "⟲ Resetear todo" limpia el storage.

## Dependencias

- `PptxGenJS` 3.12 vía CDN (jsdelivr)

## Notas

- **Precios referenciales**: los valores iniciales son estimaciones abril 2026
  para el mercado chileno. Verificá y corregí en el app antes de exportar.
- No hay backend; todo corre client-side. No hay scraping en vivo por CORS.
- Los links a Google Maps apuntan a las sucursales provistas originalmente.

## Migrar a repo propio

Para sacar esta app del repo de Reciclean y dejarla standalone:

```bash
cp -r supermercado/ /ruta/nuevo-repo/
cd /ruta/nuevo-repo
git init && git add . && git commit -m "Initial commit"
```
