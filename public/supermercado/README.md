# Lista Supermercado — Comparador Líder vs Alvi

App simple, responsive y táctil para comparar precios entre Líder Central y Alvi Plaza Maipú,
marcar productos en el carro y compartir la lista como PDF.

## Cómo usarlo (iPhone / Android)

1. Abrir `supermercado/index.html` en el navegador.
2. Tocá el **cuadrado grande** a la izquierda de cada producto para marcarlo al carro.
3. Usá **− / +** para cambiar la cantidad.
4. Tocá 🔍 **Líder** o 🔍 **Alvi** para ir a la web y verificar el precio. Si cambió,
   editá el número directamente en la card.
5. **"📤 Compartir PDF por WhatsApp"** abre el diálogo nativo de iOS/Android para mandarlo
   a quien quieras (asistente, pareja, etc.).

## Formatos de salida

- **PDF** (`📄 Descargar PDF`): A4 centrado con 3 páginas — comparativa + lista Líder + lista Alvi.
- **Imprimir** (`🖨️`): abre el diálogo del sistema con estilos optimizados.
- **PPTX** (`📊`): para presentaciones.

## Persistencia

Todo se guarda en `localStorage` bajo la clave `supermercado_v2`.
Botón **⟲ Resetear** limpia todo y vuelve a los valores iniciales.

## Dependencias (CDN)

- `jsPDF` 2.5.1 + `jspdf-autotable` 3.8.2 (PDF)
- `PptxGenJS` 3.12 (PPTX)

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
