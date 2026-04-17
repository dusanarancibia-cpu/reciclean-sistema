// ==========================================================================
// Lista Supermercado — comparador Líder vs Alvi con export PPTX inteligente
// ==========================================================================

const SUPERMARKETS = {
  A: {
    name: "Líder Central",
    brand: "Líder",
    web: "https://www.lider.cl",
    maps: "https://maps.app.goo.gl/J44M36SSkTkxr1Wb7",
    searchUrl: (q) => `https://www.lider.cl/supermercado/search?Ntt=${encodeURIComponent(q)}`,
    color: "0071CE"
  },
  B: {
    name: "Alvi Plaza Maipú",
    brand: "Alvi",
    web: "https://www.alvi.cl",
    maps: "https://maps.app.goo.gl/NthcsN8jEDmBucdDA",
    searchUrl: (q) => `https://www.alvi.cl/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
    color: "E30613"
  }
};

// Precios referenciales Chile abril 2026 (CLP) — EDITABLES EN UI
// Fuente: estimación mercado / a verificar en web oficial
const DEFAULT_ITEMS = [
  { nombre: "Papel higiénico Nova 12 rollos doble hoja", query: "papel higienico nova 12 rollos", qty: 1, priceA: 5990, priceB: 5490 },
  { nombre: "Papel higiénico Confort 12 rollos", query: "papel higienico confort 12 rollos", qty: 1, priceA: 7490, priceB: 6990 },
  { nombre: "Servilletas paquete 100u", query: "servilletas de papel", qty: 1, priceA: 990, priceB: 890 },
  { nombre: "Toallas de papel para manos (rollo cocina)", query: "toalla nova absorbente cocina", qty: 1, priceA: 2290, priceB: 1990 },
  { nombre: "Aceite maravilla 1L", query: "aceite maravilla 1 litro", qty: 2, priceA: 2290, priceB: 1990 },
  { nombre: "Azúcar Iansa 1 kg", query: "azucar iansa 1 kg", qty: 2, priceA: 1490, priceB: 1290 },
  { nombre: "Café Nescafé 170 g", query: "cafe nescafe tradicion 170", qty: 1, priceA: 4990, priceB: 4490 },
  { nombre: "Pañuelos desechables Confort pack", query: "panuelos desechables confort", qty: 1, priceA: 2490, priceB: 2190 },
  { nombre: "Aromatizante de enchufe Glade", query: "aromatizante glade enchufe", qty: 1, priceA: 3990, priceB: 3690 },
  { nombre: "Paños esponja Scotch Brite 3u", query: "pano esponja scotch brite", qty: 1, priceA: 1990, priceB: 1790 },
  { nombre: "Toallitas húmedas desinfectantes con cloro", query: "toallitas humedas desinfectantes cloro", qty: 1, priceA: 2990, priceB: 2690 },
  { nombre: "Lavalosa Quix 500 ml", query: "lavaloza quix 500", qty: 1, priceA: 1790, priceB: 1590 }
];

const STORAGE_KEY = "supermercado_v1";

// ---------- Estado ----------
let state = load() || {
  supA: SUPERMARKETS.A.name,
  supB: SUPERMARKETS.B.name,
  items: DEFAULT_ITEMS.map(it => ({ ...it, enCarro: false, preferido: "A" }))
};

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// ---------- Utilidades ----------
const clp = (n) => isFinite(n) ? "$" + Math.round(n).toLocaleString("es-CL") : "—";
const $ = (sel) => document.querySelector(sel);

// ---------- Render ----------
function render() {
  $("#supA").value = state.supA;
  $("#supB").value = state.supB;
  $("#mapA").href = SUPERMARKETS.A.maps;
  $("#mapB").href = SUPERMARKETS.B.maps;
  $("#webA").href = SUPERMARKETS.A.web;
  $("#webB").href = SUPERMARKETS.B.web;
  $("#thA").textContent = "Precio " + state.supA;
  $("#thB").textContent = "Precio " + state.supB;

  const tb = $("#tbody");
  tb.innerHTML = "";
  state.items.forEach((it, idx) => {
    const tr = document.createElement("tr");
    if (it.enCarro) tr.classList.add("done");

    const cheaperA = it.priceA > 0 && (!it.priceB || it.priceA <= it.priceB);
    const cheaperB = it.priceB > 0 && (!it.priceA || it.priceB < it.priceA);
    const selected = it.preferido === "A" ? it.priceA : it.priceB;
    const subtotal = selected * it.qty;

    tr.innerHTML = `
      <td class="check-cell">
        <input type="checkbox" data-idx="${idx}" data-k="enCarro" ${it.enCarro ? "checked" : ""}>
      </td>
      <td>
        <input type="text" class="name-input" data-idx="${idx}" data-k="nombre" value="${escapeAttr(it.nombre)}">
        <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">
          <a class="url-btn" href="${SUPERMARKETS.A.searchUrl(it.query)}" target="_blank" rel="noopener">🔍 ${SUPERMARKETS.A.brand}</a>
          <a class="url-btn" href="${SUPERMARKETS.B.searchUrl(it.query)}" target="_blank" rel="noopener">🔍 ${SUPERMARKETS.B.brand}</a>
          <input type="text" class="url-btn" style="width:140px;padding:2px 6px;color:var(--muted)" data-idx="${idx}" data-k="query" value="${escapeAttr(it.query)}" placeholder="búsqueda">
        </div>
      </td>
      <td>
        <input type="number" class="qty-input" data-idx="${idx}" data-k="qty" value="${it.qty}" min="1" step="1">
      </td>
      <td class="price-cell ${cheaperA ? "cheapest" : ""}">
        <input type="number" class="price-input" data-idx="${idx}" data-k="priceA" value="${it.priceA}" step="10">
      </td>
      <td class="price-cell ${cheaperB ? "cheapest" : ""}">
        <input type="number" class="price-input" data-idx="${idx}" data-k="priceB" value="${it.priceB}" step="10">
      </td>
      <td>
        <select data-idx="${idx}" data-k="preferido">
          <option value="A" ${it.preferido === "A" ? "selected" : ""}>${state.supA}</option>
          <option value="B" ${it.preferido === "B" ? "selected" : ""}>${state.supB}</option>
        </select>
      </td>
      <td style="font-variant-numeric:tabular-nums;font-weight:600">${clp(subtotal)}</td>
      <td><button class="delete-btn" data-del="${idx}" title="Eliminar">✕</button></td>
    `;
    tb.appendChild(tr);
  });

  renderSummary();
  attachRowHandlers();
}

function escapeAttr(s) { return String(s).replace(/"/g, "&quot;"); }

function renderSummary() {
  const totalA = state.items.reduce((s, it) => s + it.priceA * it.qty, 0);
  const totalB = state.items.reduce((s, it) => s + it.priceB * it.qty, 0);
  const totalOptimo = state.items.reduce((s, it) => s + Math.min(it.priceA, it.priceB) * it.qty, 0);
  const winner = totalA <= totalB ? "A" : "B";
  const savings = Math.abs(totalA - totalB);
  const savingsOptimo = Math.max(totalA, totalB) - totalOptimo;

  const done = state.items.filter(it => it.enCarro).length;
  const pct = state.items.length ? Math.round(done / state.items.length * 100) : 0;
  $("#progressBar").style.width = pct + "%";
  $("#progressLabel").textContent = `${done} de ${state.items.length} productos en el carro (${pct}%)`;

  $("#summary").innerHTML = `
    <div class="card ${winner === "A" ? "winner" : ""}">
      <div class="label">Total en ${state.supA} ${winner === "A" ? "🏆" : ""}</div>
      <div class="value">${clp(totalA)}</div>
    </div>
    <div class="card ${winner === "B" ? "winner" : ""}">
      <div class="label">Total en ${state.supB} ${winner === "B" ? "🏆" : ""}</div>
      <div class="value">${clp(totalB)}</div>
    </div>
    <div class="card">
      <div class="label">💡 Compra mixta óptima</div>
      <div class="value">${clp(totalOptimo)}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px">Ahorrás ${clp(savingsOptimo)} vs el peor</div>
    </div>
  `;
}

function attachRowHandlers() {
  document.querySelectorAll("[data-idx]").forEach(el => {
    el.addEventListener("change", (e) => {
      const idx = +el.dataset.idx, k = el.dataset.k;
      let v = el.type === "checkbox" ? el.checked : (el.type === "number" ? +el.value : el.value);
      state.items[idx][k] = v;
      save(); render();
    });
    if (el.tagName === "INPUT" && el.type !== "checkbox") {
      el.addEventListener("input", () => {
        const idx = +el.dataset.idx, k = el.dataset.k;
        let v = el.type === "number" ? +el.value : el.value;
        state.items[idx][k] = v;
        save();
      });
    }
  });
  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.items.splice(+btn.dataset.del, 1);
      save(); render();
    });
  });
}

// ---------- Toolbar ----------
$("#supA").addEventListener("input", (e) => { state.supA = e.target.value; save(); render(); });
$("#supB").addEventListener("input", (e) => { state.supB = e.target.value; save(); render(); });

$("#btnAdd").addEventListener("click", () => {
  state.items.push({ nombre: "Nuevo producto", query: "", qty: 1, priceA: 0, priceB: 0, enCarro: false, preferido: "A" });
  save(); render();
});

$("#btnResetPrices").addEventListener("click", () => {
  if (!confirm("¿Restaurar precios referenciales? Se perderán tus ediciones.")) return;
  DEFAULT_ITEMS.forEach((d, i) => {
    if (state.items[i]) {
      state.items[i].priceA = d.priceA;
      state.items[i].priceB = d.priceB;
    }
  });
  save(); render();
});

$("#btnClearCart").addEventListener("click", () => {
  state.items.forEach(it => it.enCarro = false);
  save(); render();
});

$("#btnReset").addEventListener("click", () => {
  if (!confirm("¿Resetear TODO? (Lista, precios, supermercados)")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

$("#btnPrint").addEventListener("click", () => window.print());

// ---------- Export PPTX inteligente ----------
$("#btnPptx").addEventListener("click", exportPptx);

function exportPptx() {
  if (typeof PptxGenJS === "undefined") {
    alert("No se cargó PptxGenJS. Verificá tu conexión a internet."); return;
  }
  const pptx = new PptxGenJS();
  pptx.title = "Lista de supermercado";
  pptx.author = "Reciclean-Farex";
  pptx.layout = "LAYOUT_WIDE"; // 13.3 x 7.5"

  const totalA = state.items.reduce((s, it) => s + it.priceA * it.qty, 0);
  const totalB = state.items.reduce((s, it) => s + it.priceB * it.qty, 0);
  const totalOptimo = state.items.reduce((s, it) => s + Math.min(it.priceA, it.priceB) * it.qty, 0);
  const winner = totalA <= totalB ? state.supA : state.supB;
  const today = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });

  // --- Slide 1: portada ---
  const s1 = pptx.addSlide();
  s1.background = { color: "0F1419" };
  s1.addText("🛒 Lista de Supermercado", {
    x: 0.5, y: 0.5, w: 12.3, h: 0.8, fontSize: 36, bold: true, color: "4ADE80", fontFace: "Calibri"
  });
  s1.addText(today, { x: 0.5, y: 1.3, w: 12.3, h: 0.4, fontSize: 16, color: "8A98A8" });

  s1.addText([
    { text: "Comparación de precios entre ", options: { color: "E6EDF3" } },
    { text: state.supA, options: { color: "7DD3FC", bold: true } },
    { text: " y ", options: { color: "E6EDF3" } },
    { text: state.supB, options: { color: "FCA5A5", bold: true } }
  ], { x: 0.5, y: 1.8, w: 12.3, h: 0.5, fontSize: 20 });

  // tarjetas totales
  const cardY = 3.0, cardH = 1.6;
  s1.addShape("roundRect", {
    x: 0.5, y: cardY, w: 4, h: cardH, fill: { color: "1A2028" },
    line: { color: totalA <= totalB ? "4ADE80" : "2D3845", width: totalA <= totalB ? 3 : 1 }, rectRadius: 0.1
  });
  s1.addText(state.supA, { x: 0.7, y: cardY + 0.15, w: 3.6, h: 0.35, fontSize: 12, color: "8A98A8", bold: true });
  s1.addText(clp(totalA), { x: 0.7, y: cardY + 0.5, w: 3.6, h: 0.7, fontSize: 32, bold: true, color: totalA <= totalB ? "4ADE80" : "E6EDF3" });
  if (totalA <= totalB) s1.addText("🏆 Más barato", { x: 0.7, y: cardY + 1.2, w: 3.6, h: 0.3, fontSize: 12, color: "4ADE80" });

  s1.addShape("roundRect", {
    x: 4.7, y: cardY, w: 4, h: cardH, fill: { color: "1A2028" },
    line: { color: totalB < totalA ? "4ADE80" : "2D3845", width: totalB < totalA ? 3 : 1 }, rectRadius: 0.1
  });
  s1.addText(state.supB, { x: 4.9, y: cardY + 0.15, w: 3.6, h: 0.35, fontSize: 12, color: "8A98A8", bold: true });
  s1.addText(clp(totalB), { x: 4.9, y: cardY + 0.5, w: 3.6, h: 0.7, fontSize: 32, bold: true, color: totalB < totalA ? "4ADE80" : "E6EDF3" });
  if (totalB < totalA) s1.addText("🏆 Más barato", { x: 4.9, y: cardY + 1.2, w: 3.6, h: 0.3, fontSize: 12, color: "4ADE80" });

  s1.addShape("roundRect", {
    x: 8.9, y: cardY, w: 4, h: cardH, fill: { color: "14532D" },
    line: { color: "4ADE80", width: 2 }, rectRadius: 0.1
  });
  s1.addText("💡 Compra mixta óptima", { x: 9.1, y: cardY + 0.15, w: 3.6, h: 0.35, fontSize: 12, color: "BBF7D0", bold: true });
  s1.addText(clp(totalOptimo), { x: 9.1, y: cardY + 0.5, w: 3.6, h: 0.7, fontSize: 32, bold: true, color: "4ADE80" });
  s1.addText(`Ahorrás ${clp(Math.max(totalA, totalB) - totalOptimo)}`, { x: 9.1, y: cardY + 1.2, w: 3.6, h: 0.3, fontSize: 12, color: "BBF7D0" });

  s1.addText(`🏆 Ganador global: ${winner}`, {
    x: 0.5, y: 5.0, w: 12.3, h: 0.6, fontSize: 22, bold: true, color: "4ADE80", align: "center"
  });
  s1.addText(`Diferencia: ${clp(Math.abs(totalA - totalB))}`, {
    x: 0.5, y: 5.6, w: 12.3, h: 0.4, fontSize: 14, color: "8A98A8", align: "center"
  });

  s1.addText("Los precios son referenciales — verificar en tienda o web oficial", {
    x: 0.5, y: 7.0, w: 12.3, h: 0.3, fontSize: 10, color: "6B7280", italic: true, align: "center"
  });

  // --- Slide 2: tabla comparativa ---
  const s2 = pptx.addSlide();
  s2.background = { color: "0F1419" };
  s2.addText("Comparación producto por producto", { x: 0.5, y: 0.3, w: 12.3, h: 0.5, fontSize: 22, bold: true, color: "E6EDF3" });
  s2.addText("★ = más barato entre los dos supermercados", { x: 0.5, y: 0.8, w: 12.3, h: 0.3, fontSize: 11, color: "8A98A8" });

  const rows = [[
    { text: "✓", options: { bold: true, color: "FFFFFF", fill: { color: "222A34" }, align: "center" } },
    { text: "Producto", options: { bold: true, color: "FFFFFF", fill: { color: "222A34" } } },
    { text: "Cant", options: { bold: true, color: "FFFFFF", fill: { color: "222A34" }, align: "center" } },
    { text: state.supA, options: { bold: true, color: "FFFFFF", fill: { color: "0071CE" }, align: "center" } },
    { text: state.supB, options: { bold: true, color: "FFFFFF", fill: { color: "E30613" }, align: "center" } },
    { text: "Preferido", options: { bold: true, color: "FFFFFF", fill: { color: "222A34" }, align: "center" } },
    { text: "Subtotal", options: { bold: true, color: "FFFFFF", fill: { color: "222A34" }, align: "right" } }
  ]];

  state.items.forEach(it => {
    const A = it.priceA, B = it.priceB;
    const cheapA = A > 0 && (!B || A <= B);
    const cheapB = B > 0 && (!A || B < A);
    const selected = it.preferido === "A" ? A : B;
    const sub = selected * it.qty;
    const rowColor = it.enCarro ? "6B7280" : "E6EDF3";
    rows.push([
      { text: it.enCarro ? "✅" : "☐", options: { align: "center", color: rowColor } },
      { text: it.nombre, options: { color: rowColor, italic: it.enCarro } },
      { text: String(it.qty), options: { align: "center", color: rowColor } },
      { text: (cheapA ? "★ " : "") + clp(A), options: { align: "right", color: cheapA ? "4ADE80" : rowColor, bold: cheapA, fill: cheapA ? { color: "14532D" } : undefined } },
      { text: (cheapB ? "★ " : "") + clp(B), options: { align: "right", color: cheapB ? "4ADE80" : rowColor, bold: cheapB, fill: cheapB ? { color: "14532D" } : undefined } },
      { text: it.preferido === "A" ? state.supA : state.supB, options: { align: "center", color: rowColor, fontSize: 10 } },
      { text: clp(sub), options: { align: "right", bold: true, color: rowColor } }
    ]);
  });

  rows.push([
    { text: "", options: { fill: { color: "1A2028" } } },
    { text: "TOTAL", options: { bold: true, color: "4ADE80", fill: { color: "1A2028" } } },
    { text: "", options: { fill: { color: "1A2028" } } },
    { text: clp(totalA), options: { align: "right", bold: true, color: "FFFFFF", fill: { color: "0071CE" } } },
    { text: clp(totalB), options: { align: "right", bold: true, color: "FFFFFF", fill: { color: "E30613" } } },
    { text: "Óptimo:", options: { align: "right", bold: true, color: "4ADE80", fill: { color: "1A2028" } } },
    { text: clp(totalOptimo), options: { align: "right", bold: true, color: "4ADE80", fill: { color: "14532D" } } }
  ]);

  s2.addTable(rows, {
    x: 0.3, y: 1.2, w: 12.7, colW: [0.5, 4.5, 0.7, 1.6, 1.6, 1.9, 1.9],
    fontSize: 10, fontFace: "Calibri", color: "E6EDF3", border: { type: "solid", color: "2D3845", pt: 0.5 },
    rowH: 0.35, valign: "middle"
  });

  // --- Slide 3: lista solo Líder ---
  addShoppingSlide(pptx, state.supA, "A", "0071CE");
  addShoppingSlide(pptx, state.supB, "B", "E30613");

  // --- Slide 4: combo mixto óptimo ---
  addOptimoSlide(pptx, totalOptimo);

  const fecha = new Date().toISOString().slice(0, 10);
  pptx.writeFile({ fileName: `lista-supermercado-${fecha}.pptx` });
}

function addShoppingSlide(pptx, supName, key, color) {
  const s = pptx.addSlide();
  s.background = { color: "0F1419" };
  s.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color } });
  s.addText(`🛒 Lista para ${supName}`, { x: 0.5, y: 0.15, w: 12.3, h: 0.6, fontSize: 26, bold: true, color: "FFFFFF" });

  const priceKey = key === "A" ? "priceA" : "priceB";
  const rows = [[
    { text: "✓", options: { bold: true, color: "FFFFFF", fill: { color: "222A34" }, align: "center" } },
    { text: "Producto", options: { bold: true, color: "FFFFFF", fill: { color: "222A34" } } },
    { text: "Cant", options: { bold: true, color: "FFFFFF", fill: { color: "222A34" }, align: "center" } },
    { text: "P. unit.", options: { bold: true, color: "FFFFFF", fill: { color: "222A34" }, align: "right" } },
    { text: "Subtotal", options: { bold: true, color: "FFFFFF", fill: { color: "222A34" }, align: "right" } }
  ]];
  let total = 0;
  state.items.forEach(it => {
    const p = it[priceKey];
    const sub = p * it.qty;
    total += sub;
    rows.push([
      { text: "☐", options: { align: "center", fontSize: 16 } },
      { text: it.nombre, options: {} },
      { text: String(it.qty), options: { align: "center" } },
      { text: clp(p), options: { align: "right" } },
      { text: clp(sub), options: { align: "right", bold: true } }
    ]);
  });
  rows.push([
    { text: "", options: { fill: { color: "1A2028" } } },
    { text: "TOTAL", options: { bold: true, color: "4ADE80", fill: { color: "1A2028" } } },
    { text: "", options: { fill: { color: "1A2028" } } },
    { text: "", options: { fill: { color: "1A2028" } } },
    { text: clp(total), options: { align: "right", bold: true, color: "4ADE80", fontSize: 14, fill: { color: "14532D" } } }
  ]);

  s.addTable(rows, {
    x: 0.3, y: 1.1, w: 12.7, colW: [0.6, 7.5, 1.0, 1.8, 1.8],
    fontSize: 11, fontFace: "Calibri", color: "E6EDF3",
    border: { type: "solid", color: "2D3845", pt: 0.5 },
    rowH: 0.32, valign: "middle"
  });

  s.addText("☐ Marcá con un lápiz al subir cada producto al carro", {
    x: 0.3, y: 7.0, w: 12.7, h: 0.3, fontSize: 10, color: "8A98A8", italic: true
  });
}

function addOptimoSlide(pptx, totalOptimo) {
  const s = pptx.addSlide();
  s.background = { color: "0F1419" };
  s.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: "14532D" } });
  s.addText("💡 Compra mixta óptima — dónde comprar cada cosa", {
    x: 0.5, y: 0.15, w: 12.3, h: 0.6, fontSize: 24, bold: true, color: "FFFFFF"
  });

  // Separar por supermercado más barato
  const porA = state.items.filter(it => it.priceA > 0 && (!it.priceB || it.priceA <= it.priceB));
  const porB = state.items.filter(it => it.priceB > 0 && it.priceA > it.priceB);

  let y = 1.2;
  s.addText(`En ${state.supA} (${porA.length} productos):`, {
    x: 0.5, y, w: 12.3, h: 0.4, fontSize: 16, bold: true, color: "7DD3FC"
  });
  y += 0.5;
  const listA = porA.map(it => `  • ${it.nombre} × ${it.qty}  —  ${clp(it.priceA * it.qty)}`).join("\n");
  s.addText(listA || "  (sin productos)", {
    x: 0.8, y, w: 11.5, h: Math.max(0.4, porA.length * 0.28),
    fontSize: 12, color: "E6EDF3", fontFace: "Calibri"
  });
  y += Math.max(0.5, porA.length * 0.28) + 0.3;

  s.addText(`En ${state.supB} (${porB.length} productos):`, {
    x: 0.5, y, w: 12.3, h: 0.4, fontSize: 16, bold: true, color: "FCA5A5"
  });
  y += 0.5;
  const listB = porB.map(it => `  • ${it.nombre} × ${it.qty}  —  ${clp(it.priceB * it.qty)}`).join("\n");
  s.addText(listB || "  (sin productos)", {
    x: 0.8, y, w: 11.5, h: Math.max(0.4, porB.length * 0.28),
    fontSize: 12, color: "E6EDF3", fontFace: "Calibri"
  });

  s.addText(`Total compra mixta: ${clp(totalOptimo)}`, {
    x: 0.5, y: 6.9, w: 12.3, h: 0.4, fontSize: 18, bold: true, color: "4ADE80", align: "center"
  });
}

// ---------- Init ----------
render();
