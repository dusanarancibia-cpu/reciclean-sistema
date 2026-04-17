// ==========================================================================
// Lista Supermercado — comparador Líder vs Alvi
// Diseñado para uso en terreno: iPhone + Android, PDF compartible, print A4
// ==========================================================================

const SUPERMARKETS = {
  A: {
    name: "Líder Central",
    brand: "Líder",
    web: "https://www.lider.cl",
    maps: "https://maps.app.goo.gl/J44M36SSkTkxr1Wb7",
    searchUrl: (q) => `https://www.lider.cl/supermercado/search?Ntt=${encodeURIComponent(q)}`,
    color: "#0071CE"
  },
  B: {
    name: "Alvi Plaza Maipú",
    brand: "Alvi",
    web: "https://www.alvi.cl",
    maps: "https://maps.app.goo.gl/NthcsN8jEDmBucdDA",
    searchUrl: (q) => `https://www.alvi.cl/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
    color: "#E30613"
  }
};

// Precios referenciales CLP — EDITABLES
const DEFAULT_ITEMS = [
  { nombre: "Papel higiénico Nova 12 rollos doble hoja", query: "papel higienico nova 12 rollos", qty: 1, priceA: 5990, priceB: 5490 },
  { nombre: "Papel higiénico Confort 12 rollos", query: "papel higienico confort 12 rollos", qty: 1, priceA: 7490, priceB: 6990 },
  { nombre: "Servilletas paquete 100u", query: "servilletas papel", qty: 1, priceA: 990, priceB: 890 },
  { nombre: "Toallas de papel cocina (para manos)", query: "toalla nova absorbente cocina", qty: 1, priceA: 2290, priceB: 1990 },
  { nombre: "Aceite maravilla 1L", query: "aceite maravilla 1 litro", qty: 2, priceA: 2290, priceB: 1990 },
  { nombre: "Azúcar Iansa 1 kg", query: "azucar iansa 1 kg", qty: 2, priceA: 1490, priceB: 1290 },
  { nombre: "Café Nescafé 170 g", query: "cafe nescafe tradicion 170", qty: 1, priceA: 4990, priceB: 4490 },
  { nombre: "Pañuelos desechables Confort", query: "panuelos desechables confort", qty: 1, priceA: 2490, priceB: 2190 },
  { nombre: "Aromatizante Glade enchufe", query: "aromatizante glade enchufe", qty: 1, priceA: 3990, priceB: 3690 },
  { nombre: "Paños esponja Scotch Brite 3u", query: "pano esponja scotch brite", qty: 1, priceA: 1990, priceB: 1790 },
  { nombre: "Toallitas húmedas desinfectantes con cloro", query: "toallitas humedas desinfectantes", qty: 1, priceA: 2990, priceB: 2690 },
  { nombre: "Lavaloza Quix 500 ml", query: "lavaloza quix 500", qty: 1, priceA: 1790, priceB: 1590 }
];

const STORAGE_KEY = "supermercado_v2";

let state = load() || {
  items: DEFAULT_ITEMS.map(it => ({ ...it, enCarro: false }))
};

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

const clp = (n) => isFinite(n) && n > 0 ? "$" + Math.round(n).toLocaleString("es-CL") : "—";
const $ = (s) => document.querySelector(s);

// ---------- Render ----------
function renderHeader() {
  const d = new Date();
  $("#dateSub").textContent = d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  $("#supAName").textContent = SUPERMARKETS.A.name;
  $("#supBName").textContent = SUPERMARKETS.B.name;
  $("#mapA").href = SUPERMARKETS.A.maps;
  $("#mapB").href = SUPERMARKETS.B.maps;
  $("#webA").href = SUPERMARKETS.A.web;
  $("#webB").href = SUPERMARKETS.B.web;
}

function renderItems() {
  const box = $("#items");
  box.innerHTML = "";
  state.items.forEach((it, idx) => {
    const cheapA = it.priceA > 0 && (!it.priceB || it.priceA <= it.priceB);
    const cheapB = it.priceB > 0 && (!it.priceA || it.priceB < it.priceA);
    const cheapest = Math.min(it.priceA || Infinity, it.priceB || Infinity);
    const sub = (cheapest === Infinity ? 0 : cheapest) * it.qty;

    const row = document.createElement("div");
    row.className = "item" + (it.enCarro ? " done" : "");
    row.innerHTML = `
      <div class="item-check ${it.enCarro ? "checked" : ""}" data-toggle="${idx}" role="checkbox" aria-checked="${it.enCarro}"></div>
      <div class="item-body">
        <div class="item-name">
          <input type="text" data-field="nombre" data-idx="${idx}" value="${esc(it.nombre)}">
        </div>
        <div class="item-meta">
          <div class="qty-ctrl">
            <button class="qty-btn" data-qty="${idx}" data-d="-1" aria-label="menos">−</button>
            <span class="qty-value" data-qty-val="${idx}">${it.qty}</span>
            <button class="qty-btn" data-qty="${idx}" data-d="1" aria-label="más">+</button>
          </div>
          <div class="search-btns">
            <a href="${SUPERMARKETS.A.searchUrl(it.query)}" target="_blank" rel="noopener" class="lider">🔍 Líder</a>
            <a href="${SUPERMARKETS.B.searchUrl(it.query)}" target="_blank" rel="noopener" class="alvi">🔍 Alvi</a>
          </div>
        </div>
        <div class="prices">
          <div class="price lider ${cheapA ? "cheapest" : ""}">
            <span class="price-label">${cheapA ? '<span class="star">★</span>' : ""}Líder</span>
            <input type="number" data-field="priceA" data-idx="${idx}" value="${it.priceA}" step="10" inputmode="numeric">
          </div>
          <div class="price alvi ${cheapB ? "cheapest" : ""}">
            <span class="price-label">${cheapB ? '<span class="star">★</span>' : ""}Alvi</span>
            <input type="number" data-field="priceB" data-idx="${idx}" value="${it.priceB}" step="10" inputmode="numeric">
          </div>
        </div>
      </div>
      <div class="item-right">
        <div class="subtotal">${clp(sub)}</div>
        <button class="delete-btn" data-del="${idx}" aria-label="eliminar">✕</button>
      </div>
    `;
    box.appendChild(row);
  });
  attachHandlers();
  renderTotals();
}

function esc(s) { return String(s).replace(/"/g, "&quot;"); }

function renderTotals() {
  const totalA = state.items.reduce((s, it) => s + it.priceA * it.qty, 0);
  const totalB = state.items.reduce((s, it) => s + it.priceB * it.qty, 0);
  const totalOpt = state.items.reduce((s, it) => s + Math.min(it.priceA || Infinity, it.priceB || Infinity) * it.qty, 0);
  const winner = totalA <= totalB ? "A" : "B";

  $("#totals").innerHTML = `
    <div class="total-card lider ${winner === "A" ? "winner" : ""}">
      <div class="total-label">Líder ${winner === "A" ? "🏆" : ""}</div>
      <div class="total-value">${clp(totalA)}</div>
    </div>
    <div class="total-card alvi ${winner === "B" ? "winner" : ""}">
      <div class="total-label">Alvi ${winner === "B" ? "🏆" : ""}</div>
      <div class="total-value">${clp(totalB)}</div>
    </div>
    <div class="total-card winner" style="grid-column:1/-1">
      <div class="total-label">💡 Compra mixta óptima</div>
      <div class="total-value">${clp(totalOpt)}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:2px">
        Ahorrás ${clp(Math.max(totalA, totalB) - totalOpt)} comprando lo más barato en cada uno
      </div>
    </div>
  `;

  const done = state.items.filter(it => it.enCarro).length;
  const pct = state.items.length ? Math.round(done / state.items.length * 100) : 0;
  $("#progressBar").style.width = pct + "%";
  $("#progressLabel").textContent = `${done} de ${state.items.length} en el carro (${pct}%)`;
}

function attachHandlers() {
  document.querySelectorAll("[data-toggle]").forEach(el => {
    el.onclick = () => {
      const idx = +el.dataset.toggle;
      state.items[idx].enCarro = !state.items[idx].enCarro;
      save(); renderItems();
    };
  });
  document.querySelectorAll("[data-qty]").forEach(el => {
    el.onclick = () => {
      const idx = +el.dataset.qty, d = +el.dataset.d;
      state.items[idx].qty = Math.max(1, state.items[idx].qty + d);
      save(); renderItems();
    };
  });
  document.querySelectorAll("[data-field]").forEach(el => {
    el.oninput = () => {
      const idx = +el.dataset.idx, f = el.dataset.field;
      state.items[idx][f] = el.type === "number" ? (+el.value || 0) : el.value;
      save(); renderTotals();
    };
    el.onblur = renderItems; // re-render al salir para actualizar estrella "más barato"
  });
  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = () => {
      if (!confirm("¿Eliminar este producto?")) return;
      state.items.splice(+btn.dataset.del, 1);
      save(); renderItems();
    };
  });
}

// ---------- Toolbar ----------
$("#btnAdd").onclick = () => {
  state.items.push({ nombre: "Nuevo producto", query: "", qty: 1, priceA: 0, priceB: 0, enCarro: false });
  save(); renderItems();
};
$("#btnClearCart").onclick = () => {
  state.items.forEach(it => it.enCarro = false);
  save(); renderItems();
};
$("#btnReset").onclick = () => {
  if (!confirm("¿Resetear todo? (volver a los productos y precios iniciales)")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
};
$("#btnPrint").onclick = () => window.print();

// ---------- PDF (jsPDF + autotable) ----------
function buildPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 15;

  const today = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Encabezado
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Lista de Supermercado", pageW / 2, 13, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(today, pageW / 2, 21, { align: "center" });

  // Totales
  const totalA = state.items.reduce((s, it) => s + it.priceA * it.qty, 0);
  const totalB = state.items.reduce((s, it) => s + it.priceB * it.qty, 0);
  const totalOpt = state.items.reduce((s, it) => s + Math.min(it.priceA || Infinity, it.priceB || Infinity) * it.qty, 0);
  const winner = totalA <= totalB ? SUPERMARKETS.A.name : SUPERMARKETS.B.name;

  let y = 38;
  const cardW = (pageW - marginX * 2 - 8) / 3;
  const cardH = 22;

  drawCard(doc, marginX, y, cardW, cardH, "Líder Central", clp(totalA), totalA <= totalB, [0, 113, 206]);
  drawCard(doc, marginX + cardW + 4, y, cardW, cardH, "Alvi Plaza Maipú", clp(totalB), totalB < totalA, [227, 6, 19]);
  drawCard(doc, marginX + (cardW + 4) * 2, y, cardW, cardH, "Compra óptima", clp(totalOpt), true, [22, 163, 74]);
  y += cardH + 6;

  doc.setTextColor(22, 163, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Ganador: ${winner}  (diferencia: ${clp(Math.abs(totalA - totalB))})`, pageW / 2, y, { align: "center" });
  y += 8;

  // Tabla comparativa
  const body = state.items.map(it => {
    const cheapA = it.priceA > 0 && (!it.priceB || it.priceA <= it.priceB);
    const cheapB = it.priceB > 0 && (!it.priceA || it.priceB < it.priceA);
    const min = Math.min(it.priceA || Infinity, it.priceB || Infinity);
    return [
      it.enCarro ? "■" : "☐",
      it.nombre,
      String(it.qty),
      { content: (cheapA ? "★ " : "") + clp(it.priceA), styles: { halign: "right", textColor: cheapA ? [22, 163, 74] : [30, 41, 59], fontStyle: cheapA ? "bold" : "normal", fillColor: cheapA ? [220, 252, 231] : [255, 255, 255] } },
      { content: (cheapB ? "★ " : "") + clp(it.priceB), styles: { halign: "right", textColor: cheapB ? [22, 163, 74] : [30, 41, 59], fontStyle: cheapB ? "bold" : "normal", fillColor: cheapB ? [220, 252, 231] : [255, 255, 255] } },
      { content: clp(min === Infinity ? 0 : min * it.qty), styles: { halign: "right", fontStyle: "bold" } }
    ];
  });

  body.push([
    "", { content: "TOTAL", styles: { fontStyle: "bold" } }, "",
    { content: clp(totalA), styles: { halign: "right", fontStyle: "bold", fillColor: [224, 242, 254] } },
    { content: clp(totalB), styles: { halign: "right", fontStyle: "bold", fillColor: [254, 226, 226] } },
    { content: clp(totalOpt), styles: { halign: "right", fontStyle: "bold", fillColor: [220, 252, 231], textColor: [22, 163, 74] } }
  ]);

  doc.autoTable({
    startY: y,
    head: [["✓", "Producto", "Cant", "Líder", "Alvi", "Subtotal"]],
    body,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", halign: "center" },
    styles: { fontSize: 9, cellPadding: 2.5, valign: "middle" },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 14 },
      3: { halign: "right", cellWidth: 26 },
      4: { halign: "right", cellWidth: 26 },
      5: { halign: "right", cellWidth: 28 }
    },
    margin: { left: marginX, right: marginX },
    tableWidth: pageW - marginX * 2
  });

  // Página 2: lista por supermercado (para ir al super)
  ["A", "B"].forEach(key => {
    doc.addPage();
    const s = SUPERMARKETS[key];
    const priceKey = key === "A" ? "priceA" : "priceB";
    const color = key === "A" ? [0, 113, 206] : [227, 6, 19];

    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Lista para ${s.name}`, pageW / 2, 14, { align: "center" });

    let total = 0;
    const rows = state.items.map(it => {
      const sub = it[priceKey] * it.qty;
      total += sub;
      return [
        "☐",
        it.nombre,
        String(it.qty),
        { content: clp(it[priceKey]), styles: { halign: "right" } },
        { content: clp(sub), styles: { halign: "right", fontStyle: "bold" } }
      ];
    });
    rows.push([
      "", { content: "TOTAL", styles: { fontStyle: "bold", fontSize: 11 } }, "", "",
      { content: clp(total), styles: { halign: "right", fontStyle: "bold", fontSize: 11, fillColor: [220, 252, 231], textColor: [22, 163, 74] } }
    ]);

    doc.autoTable({
      startY: 30,
      head: [["✓", "Producto", "Cant", "Precio", "Subtotal"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: color, textColor: 255, fontStyle: "bold", halign: "center" },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { cellWidth: "auto" },
        2: { halign: "center", cellWidth: 16 },
        3: { halign: "right", cellWidth: 28 },
        4: { halign: "right", cellWidth: 30 }
      },
      margin: { left: marginX, right: marginX },
      tableWidth: pageW - marginX * 2
    });

    // Pie
    doc.setTextColor(100);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Marcá con un lápiz al subir cada producto al carro.", pageW / 2, pageH - 10, { align: "center" });
  });

  return doc;
}

function drawCard(doc, x, y, w, h, label, value, highlight, rgb) {
  doc.setDrawColor(highlight ? rgb[0] : 226, highlight ? rgb[1] : 232, highlight ? rgb[2] : 240);
  doc.setLineWidth(highlight ? 0.8 : 0.3);
  doc.setFillColor(highlight ? 240 : 248, highlight ? 253 : 250, highlight ? 244 : 252);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  doc.setTextColor(100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(label, x + 3, y + 6);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.setFontSize(16);
  doc.text(value, x + w / 2, y + h - 5, { align: "center" });
}

$("#btnPdf").onclick = () => {
  const doc = buildPdf();
  doc.save(`lista-supermercado-${new Date().toISOString().slice(0, 10)}.pdf`);
};

$("#btnShare").onclick = async () => {
  const doc = buildPdf();
  const fileName = `lista-supermercado-${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Lista de supermercado", text: "Lista de compras" });
    } catch (e) {
      if (e.name !== "AbortError") alert("No se pudo compartir: " + e.message);
    }
  } else {
    doc.save(fileName);
    alert("Tu navegador no soporta compartir archivos. El PDF se descargó — lo podés adjuntar al WhatsApp.");
  }
};

// ---------- PPTX (secundario) ----------
$("#btnPptx").onclick = () => {
  if (typeof PptxGenJS === "undefined") { alert("No se cargó PptxGenJS"); return; }
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  const totalA = state.items.reduce((s, it) => s + it.priceA * it.qty, 0);
  const totalB = state.items.reduce((s, it) => s + it.priceB * it.qty, 0);
  const totalOpt = state.items.reduce((s, it) => s + Math.min(it.priceA || Infinity, it.priceB || Infinity) * it.qty, 0);
  const today = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });

  const s = pptx.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Lista de Supermercado", { x: 0.5, y: 0.3, w: 12.3, h: 0.6, fontSize: 28, bold: true, color: "16A34A" });
  s.addText(today, { x: 0.5, y: 0.9, w: 12.3, h: 0.3, fontSize: 13, color: "64748B" });

  const rows = [[
    { text: "✓", options: { bold: true, color: "FFFFFF", fill: { color: "0F172A" }, align: "center" } },
    { text: "Producto", options: { bold: true, color: "FFFFFF", fill: { color: "0F172A" } } },
    { text: "Cant", options: { bold: true, color: "FFFFFF", fill: { color: "0F172A" }, align: "center" } },
    { text: "Líder", options: { bold: true, color: "FFFFFF", fill: { color: "0071CE" }, align: "right" } },
    { text: "Alvi", options: { bold: true, color: "FFFFFF", fill: { color: "E30613" }, align: "right" } },
    { text: "Subtotal", options: { bold: true, color: "FFFFFF", fill: { color: "0F172A" }, align: "right" } }
  ]];
  state.items.forEach(it => {
    const cheapA = it.priceA > 0 && (!it.priceB || it.priceA <= it.priceB);
    const cheapB = it.priceB > 0 && (!it.priceA || it.priceB < it.priceA);
    const min = Math.min(it.priceA || Infinity, it.priceB || Infinity);
    rows.push([
      { text: it.enCarro ? "✅" : "☐", options: { align: "center" } },
      { text: it.nombre, options: {} },
      { text: String(it.qty), options: { align: "center" } },
      { text: (cheapA ? "★ " : "") + clp(it.priceA), options: { align: "right", bold: cheapA, color: cheapA ? "16A34A" : "0F172A", fill: cheapA ? { color: "DCFCE7" } : undefined } },
      { text: (cheapB ? "★ " : "") + clp(it.priceB), options: { align: "right", bold: cheapB, color: cheapB ? "16A34A" : "0F172A", fill: cheapB ? { color: "DCFCE7" } : undefined } },
      { text: clp((min === Infinity ? 0 : min) * it.qty), options: { align: "right", bold: true } }
    ]);
  });
  rows.push([
    { text: "", options: {} },
    { text: "TOTAL", options: { bold: true, fill: { color: "F1F5F9" } } },
    { text: "", options: { fill: { color: "F1F5F9" } } },
    { text: clp(totalA), options: { align: "right", bold: true, fill: { color: "E0F2FE" } } },
    { text: clp(totalB), options: { align: "right", bold: true, fill: { color: "FEE2E2" } } },
    { text: clp(totalOpt), options: { align: "right", bold: true, color: "16A34A", fill: { color: "DCFCE7" } } }
  ]);
  s.addTable(rows, {
    x: 0.5, y: 1.4, w: 12.3, colW: [0.5, 5.3, 0.8, 1.8, 1.8, 2.1],
    fontSize: 11, fontFace: "Calibri", color: "0F172A",
    border: { type: "solid", color: "E2E8F0", pt: 0.5 }, rowH: 0.35, valign: "middle"
  });

  pptx.writeFile({ fileName: `lista-supermercado-${new Date().toISOString().slice(0, 10)}.pptx` });
};

// ---------- Init ----------
renderHeader();
renderItems();
