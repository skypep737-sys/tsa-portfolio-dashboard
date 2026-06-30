const cfg = window.TSA_CONFIG || {};
const masterUrl = "data/master_locations.json";
let portfolio = [];
let greenSurveys = [];
let map, portfolioLayer, surveyLayer;

const norm = s => String(s ?? "").trim();
const lower = s => norm(s).toLowerCase();
const money = v => v ? `$${Number(v).toLocaleString()}` : "";
const esc = s => norm(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

function pick(row, names) {
  const keys = Object.keys(row || {});
  for (const n of names) {
    const hit = keys.find(k => lower(k) === lower(n));
    if (hit) return row[hit];
  }
  const fuzzy = keys.find(k => names.some(n => lower(k).includes(lower(n))));
  return fuzzy ? row[fuzzy] : undefined;
}

function lat(row){ return Number(pick(row, ["Latitude", "Lat", "Y"])); }
function lng(row){ return Number(pick(row, ["Longitude", "Lng", "Lon", "Long", "X"])); }
function hasCoords(row){ return Number.isFinite(lat(row)) && Number.isFinite(lng(row)); }
function city(row){ return pick(row, ["City", "Market", "Municipality"]) || ""; }
function address(row){
  const addr = pick(row, ["Full Address", "Address", "Property Address", "Site Address"]) || "";
  const c = city(row);
  return addr && c && !lower(addr).includes(lower(c)) ? `${addr}, ${c}` : addr;
}
function title(row){ return pick(row, ["Store Name", "Site Name", "Property Name", "Name"]) || address(row) || "Untitled Site"; }
function rank(row){ return pick(row, ["Rank", "Site Rank", "Survey Rank"]); }
function photos(row){
  const p = pick(row, ["Photo Link", "Photos", "Photo", "Photo URL", "Image", "Image URL"]);
  let urls = [];
  if (Array.isArray(row.attachments)) urls.push(...row.attachments.map(a => a.url || a.downloadUrl || a.previewUrl).filter(Boolean));
  if (p) urls.push(...String(p).split(/[\n,;]/).map(x => x.trim()).filter(Boolean));
  return urls;
}

async function loadPortfolio(){
  portfolio = await fetch(masterUrl).then(r => r.json());
  renderPortfolio();
  renderDeals();
  drawMap();
}

async function loadSurveys(){
  if (!cfg.SMARTSHEET_PROXY_URL) {
    document.getElementById("surveyCards").innerHTML = `<div class="empty">Add your secure Smartsheet proxy URL in config.js to load live survey cards.</div>`;
    return;
  }
  const params = new URLSearchParams({ sheetId: cfg.SMARTSHEET_SHEET_ID || "" });
  if (cfg.SMARTSHEET_FILTER_ID) params.set("filterId", cfg.SMARTSHEET_FILTER_ID);
  const url = `${cfg.SMARTSHEET_PROXY_URL}?${params.toString()}`;
  const data = await fetch(url).then(r => {
    if (!r.ok) throw new Error(`Smartsheet proxy returned ${r.status}`);
    return r.json();
  });
  const rows = Array.isArray(data) ? data : (data.rows || []);
  greenSurveys = rows.map(normalizeSmartsheetRow).filter(r => lower(rank(r)) === "green");
  renderSurveyCards();
  drawMap();
}

function normalizeSmartsheetRow(row){
  if (!row.cells) return row;
  const obj = { id: row.id, attachments: row.attachments || [] };
  for (const cell of row.cells) {
    const name = cell.columnName || cell.title || cell.columnTitle || cell.columnId;
    obj[name] = cell.displayValue ?? cell.value ?? "";
  }
  return obj;
}

function drawMap(){
  if (!map) {
    map = L.map('map').setView(cfg.MAP_CENTER || [34.0522, -118.2437], cfg.MAP_ZOOM || 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    portfolioLayer = L.layerGroup().addTo(map);
    surveyLayer = L.layerGroup().addTo(map);
    L.control.layers(null, {"Portfolio": portfolioLayer, "Green Surveys": surveyLayer}).addTo(map);
  }
  portfolioLayer.clearLayers(); surveyLayer.clearLayers();
  const bounds = [];
  portfolio.filter(hasCoords).forEach(r => {
    const m = L.circleMarker([lat(r), lng(r)], {radius:6}).bindPopup(`<b>${esc(title(r))}</b><br>${esc(address(r))}<br>${esc(pick(r,["Deal Status"])||"")}`);
    portfolioLayer.addLayer(m); bounds.push([lat(r), lng(r)]);
  });
  greenSurveys.filter(hasCoords).forEach(r => {
    const m = L.marker([lat(r), lng(r)]).bindPopup(`<b>${esc(title(r))}</b><br>${esc(address(r))}<br>${esc(pick(r,["Available SQFT","Available SF","SQFT","SF"])||"")} SF<br>Rank: Green`);
    surveyLayer.addLayer(m); bounds.push([lat(r), lng(r)]);
  });
  if (bounds.length) map.fitBounds(bounds, {padding:[30,30]});
}

function renderPortfolio(){
  const html = portfolio.map(r => `<article class="rowcard"><b>${esc(title(r))}</b><span>${esc(address(r))}</span><small>${esc(pick(r,["Deal Type"])||"")} · ${esc(pick(r,["Deal Status"])||"")}</small></article>`).join('');
  document.getElementById('portfolioList').innerHTML = html;
}

function renderSurveyCards(){
  const html = greenSurveys.map(r => {
    const imgs = photos(r);
    const img = imgs[0] ? `<img src="${esc(imgs[0])}" loading="lazy" />` : `<div class="noimg">No photo</div>`;
    const flyer = pick(r,["Flyer Link", "Flyer", "Marketing Flyer"]);
    const mapsUrl = address(r) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address(r))}` : "";
    return `<article class="sitecard">${img}<div class="sitebody"><h3>${esc(title(r))}</h3><p>${esc(address(r))}</p><dl>
      <dt>City</dt><dd>${esc(city(r))}</dd>
      <dt>SF</dt><dd>${esc(pick(r,["Available SQFT","Available SF","SQFT","SF"])||"")}</dd>
      <dt>Base Rent</dt><dd>${esc(pick(r,["Base Rent","Rent","Asking Rent"])||"")}</dd>
      <dt>OpEx</dt><dd>${esc(pick(r,["Opx","OpEx","Operating Expenses", "NNN"])||"")}</dd>
    </dl><p class="notes">${esc(pick(r,["Site Notes","Notes","Comments","Survey Notes"])||"")}</p>
    <div class="cardlinks">${flyer ? `<a href="${esc(flyer)}" target="_blank" rel="noopener">Flyer</a>` : ""}${mapsUrl ? `<a href="${esc(mapsUrl)}" target="_blank" rel="noopener">Google Maps</a>` : ""}</div></div></article>`;
  }).join('') || `<div class="empty">No Green-ranked survey rows returned.</div>`;
  document.getElementById('surveyCards').innerHTML = html;
}

function renderDeals(){
  const cols = ["SITE ID","Store Name","Full Address","Deal Type","Deal Status","SQFT","Base Rent","Latest Comment"];
  document.querySelector('#dealTable thead').innerHTML = `<tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr>`;
  document.querySelector('#dealTable tbody').innerHTML = portfolio.map(r => `<tr>${cols.map(c=>`<td>${esc(r[c])}</td>`).join('')}</tr>`).join('');
}

document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab,.panel').forEach(x => x.classList.remove('active'));
  btn.classList.add('active'); document.getElementById(btn.dataset.tab).classList.add('active'); setTimeout(()=>map?.invalidateSize(),100);
}));
document.getElementById('refreshSurveys').addEventListener('click', loadSurveys);
document.getElementById('search').addEventListener('input', e => {
  const q = lower(e.target.value);
  document.querySelectorAll('.rowcard,.sitecard').forEach(card => card.style.display = lower(card.textContent).includes(q) ? '' : 'none');
});

loadPortfolio();
loadSurveys().catch(err => document.getElementById('surveyCards').innerHTML = `<div class="empty">${esc(err.message)}</div>`);
