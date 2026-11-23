(() => {
"use strict";
const { CATS, CAT_BY_ID, ACC_TYPES, LIB, LIB_BY_ID, COLORS, icon, accIcon, glyphIcon, suggest, setCustom } = window.PF_ICONS;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const WEB = !!window.PF_WEB; // nettversjonen med innlogging (Firebase)
// Språk: bokmål som standard, nynorsk om telefonen/nettlesaren er sett til nynorsk.
const defaultLang = () => ((navigator.languages || [navigator.language || ""]).some(l => /^nn/i.test(l)) ? "nn" : "nb");
const Ln = s => (S && S.lang === "nb" && window.PF_I18N ? window.PF_I18N.tr(s) : s);

/* ================= Datoar */
const pad = n => String(n).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
let TODAY = todayISO();
const P = s => { const [y, m, d] = s.split("-").map(Number); return { y, m, d }; };
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const dim = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const addDays = (s, n) => { const { y, m, d } = P(s); const t = new Date(Date.UTC(y, m - 1, d + n)); return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); };
const addMonths = (s, n, day) => { const { y, m, d } = P(s); let mm = m - 1 + n; const yy = y + Math.floor(mm / 12); mm = ((mm % 12) + 12) % 12; return iso(yy, mm + 1, Math.min(day ?? d, dim(yy, mm + 1))); };
const diffDays = (a, b) => { const A = P(a), B = P(b); return Math.round((Date.UTC(B.y, B.m - 1, B.d) - Date.UTC(A.y, A.m - 1, A.d)) / 864e5); };
const MONTHS = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
const MON_S = ["jan.", "feb.", "mars", "apr.", "mai", "juni", "juli", "aug.", "sep.", "okt.", "nov.", "des."];
const DOW = ["måndag", "tysdag", "onsdag", "torsdag", "fredag", "laurdag", "sundag"];
const dow = s => { const { y, m, d } = P(s); return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; };
const fmtDate = (s, yr) => { const { y, m, d } = P(s); return `${d}. ${MON_S[m - 1]}${(yr || y !== P(TODAY).y) ? " " + y : ""}`; };
const relDate = s => { const n = diffDays(TODAY, s); if (n === 0) return "i dag"; if (n === 1) return "i morgon"; if (n === -1) return "i går"; if (n > 1 && n < 7) return DOW[dow(s)]; return fmtDate(s); };
const monthStart = s => s.slice(0, 7) + "-01";

/* ================= Pengar */
const kr = (n, sign) => { const r = Math.round(n); const s = Math.abs(r).toLocaleString("nb-NO").replace(/[   ]/g, " "); return (r < 0 ? "−" : (sign && r > 0 ? "+" : "")) + s + " kr"; };
const parseAmt = v => { const n = Number(String(v).replace(/[\s ]/g, "").replace(",", ".")); return isFinite(n) ? n : NaN; };

const FREQ = {
  once: { n: "Éin gong" },
  w1: { n: "Kvar veke", days: 7, per: 52 / 12 },
  w2: { n: "Annakvar veke", days: 14, per: 26 / 12 },
  m1: { n: "Kvar månad", months: 1, per: 1 },
  m3: { n: "4 gonger i året", months: 3, per: 1 / 3 },
  m6: { n: "2 gonger i året", months: 6, per: 1 / 6 },
  y1: { n: "Kvart år", months: 12, per: 1 / 12 },
};
const KIND = { out: "Utgift", in: "Inntekt", move: "Overføring" };
const ACC_COLORS = ["#2f43f5", "#e0559a", "#1f9a60", "#6b6f86", "#e2683c", "#8b4fd8", "#1b9aa0", "#d99a00"];

/* ================= Tilstand */
let S = null;          // all data
let ALL = [];          // førekomstar (utrekna)
let BAL = {};          // saldo per konto i dag
const UI = { view: "oversikt", months: 12, hidden: {}, calMonth: TODAY.slice(0, 7), calDay: null };
let touched = false;

function demoState() {
  const since = monthStart(TODAY);
  const back = (n, day) => addMonths(since, -n, day);
  const A = { bruk: "a_bruk", spar: "a_spar", cash: "a_cash", kred: "a_kred" };
  const e = (o) => ({ id: uid(), until: "", note: "", ...o });
  const entries = [
    e({ kind: "in", name: "Løn", amount: 48500, cat: "lon", acc: A.bruk, date: back(2, 20), freq: "m1", mode: "auto" }),
    e({ kind: "in", name: "Barnetrygd", amount: 1766, cat: "trygd", acc: A.bruk, date: back(2, 25), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Boliglån", amount: 14250, cat: "heim", acc: A.bruk, date: back(2, 15), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Kommunale avgifter", amount: 4380, cat: "kommunalt", acc: A.bruk, date: back(12, 20), freq: "m3", mode: "manual" }),
    e({ kind: "out", name: "Straum", amount: 1290, cat: "straum", acc: A.bruk, date: back(2, 10), freq: "m1", mode: "manual" }),
    e({ kind: "out", name: "Barnehage", amount: 3315, cat: "barn", acc: A.bruk, date: back(2, 20), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Billån", amount: 4150, cat: "bil", acc: A.bruk, date: back(2, 15), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Drivstoff og bompengar", amount: 1600, cat: "bil", acc: A.kred, date: back(2, 8), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Studielån", amount: 1720, cat: "gjeld", acc: A.bruk, date: back(2, 15), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Fellesutgifter", amount: 3240, cat: "heim", acc: A.bruk, date: back(2, 1), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Kafé og takeaway", amount: 1400, cat: "ute", acc: A.kred, date: back(2, 18), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Daglegvarer", amount: 1300, cat: "mat", acc: A.bruk, date: addDays(since, (7 - dow(since) + 4) % 7), freq: "w1", mode: "auto" }),
    e({ kind: "out", name: "Innbu- og reiseforsikring", amount: 1120, cat: "forsikring", acc: A.bruk, date: back(2, 28), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Mobil og fiber", amount: 1049, cat: "mobil", acc: A.bruk, date: back(2, 1), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Netflix", amount: 199, cat: "abonnement", acc: A.kred, date: back(2, 3), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Treningssenter", amount: 549, cat: "trening", acc: A.kred, date: back(2, 5), freq: "m1", mode: "auto" }),
    e({ kind: "move", name: "Sparing buffer", amount: 3000, cat: "sparing", acc: A.bruk, to: A.spar, date: back(2, 21), freq: "m1", mode: "auto" }),
    e({ kind: "move", name: "Betale kredittkort", amount: 3500, cat: "nedbetaling", acc: A.bruk, to: A.kred, date: back(2, 12), freq: "m1", mode: "manual" }),
    e({ kind: "out", name: "Straum og vedlikehald", amount: 950, cat: "u_hytte", acc: A.bruk, date: back(2, 18), freq: "m1", mode: "auto" }),
    e({ kind: "out", name: "Julegåver", amount: 5000, cat: "gaver", acc: A.kred, date: iso(P(TODAY).y, 12, 10), freq: "once", mode: "manual" }),
    e({ kind: "out", name: "Flybillettar påskeferie", amount: 6400, cat: "reise", acc: A.kred, date: addMonths(since, 3, 14), freq: "once", mode: "manual" }),
    e({ kind: "out", name: "Bilforsikring", amount: 6840, cat: "bil", acc: A.bruk, date: addMonths(since, 2, 2), freq: "y1", mode: "manual" }),
  ];
  const s = {
    v: 1, demo: true, since, lang: defaultLang(),
    accounts: [
      { id: A.bruk, name: "Brukskonto", type: "bank", start: 18450, open: since, color: ACC_COLORS[0] },
      { id: A.spar, name: "Bufferkonto", type: "saving", start: 62300, open: since, color: ACC_COLORS[1] },
      { id: A.cash, name: "Kontantar", type: "cash", start: 850, open: since, color: ACC_COLORS[2] },
      { id: A.kred, name: "Kredittkort", type: "credit", start: -4120, open: since, color: ACC_COLORS[3] },
    ],
    cats: [{ id: "u_hytte", name: "Hytta", kind: "out", color: "#2a9a8b", glyph: "g_hytte" }],
    budgets: { mat: 6500, ute: 1400, bil: 5800, klede: 500 },
    quick: [{ id: "q_smatt", label: "Smått", kind: "out", cat: "mat", acc: A.bruk, name: "Daglegvarer" }, { id: "q_kaffe", label: "Kaffe", kind: "out", cat: "ute", acc: A.kred, name: "Kaffe" }],
    entries, conf: {},
  };
  const qd = n => { const d = addDays(since, n); return d > TODAY ? TODAY : d; };
  for (const [n, name, cat, acc, amt] of [[2, "Daglegvarer", "mat", A.bruk, 189], [6, "Kaffe", "ute", A.kred, 52], [11, "Daglegvarer", "mat", A.bruk, 74], [16, "Kaffe", "ute", A.kred, 49]])
    entries.push(e({ kind: "out", name, amount: amt, cat, acc, date: qd(n), freq: "once", mode: "auto", quick: true }));
  const kort = entries.find(x => x.cat === "nedbetaling");
  const d12 = iso(P(since).y, P(since).m, 12);
  if (d12 <= TODAY) s.conf[kort.id + "|" + d12] = { s: "paid", d: d12 };
  return s;
}
const defaultQuick = () => [{ id: "q_" + uid(), label: "Smått", kind: "out", cat: "mat", acc: "", name: "" }];
const emptyState = () => ({ v: 1, demo: false, lang: S?.lang || defaultLang(), since: monthStart(TODAY), accounts: [], cats: [], quick: defaultQuick(), budgets: {}, entries: [], conf: {} });
function migrate(s) {
  if (!s || typeof s !== "object" || !Array.isArray(s.accounts)) return null;
  s.entries = Array.isArray(s.entries) ? s.entries : []; s.conf = s.conf && typeof s.conf === "object" ? s.conf : {};
  s.since = s.since || monthStart(TODAY);
  s.cats = Array.isArray(s.cats) ? s.cats : [];
  s.lang = s.lang === "nb" || s.lang === "nn" ? s.lang : "nn";
  s.recent = Array.isArray(s.recent) ? s.recent : [];
  s.quick = Array.isArray(s.quick) ? s.quick : defaultQuick();
  s.budgets = s.budgets && typeof s.budgets === "object" ? s.budgets : {};
  return s;
}

/* ================= Førekomstar og saldo */
function occDates(e, from, to) {
  const out = []; const end = e.until && e.until < to ? e.until : to;
  if (e.freq === "once") { if (e.date >= from && e.date <= end) out.push(e.date); return out; }
  const f = FREQ[e.freq] || FREQ.m1;
  if (f.days) {
    let k = from > e.date ? Math.ceil(diffDays(e.date, from) / f.days) : 0;
    for (let i = 0; i < 1000; i++) { const s = addDays(e.date, (k + i) * f.days); if (s > end) break; out.push(s); }
  } else {
    const day = P(e.date).d;
    for (let i = 0; i < 1000; i++) { const s = addMonths(e.date, i * f.months, day); if (s > end) break; if (s >= from) out.push(s); }
  }
  return out;
}
const keyOf = (id, d) => id + "|" + d;
function buildOcc(from, to) {
  const list = [];
  for (const e of S.entries) for (const date of occDates(e, from, to)) {
    const k = keyOf(e.id, date), c = S.conf[k];
    let status;
    if (c && (c.s === "paid" || c.s === "skipped")) status = c.s;
    else if (date <= TODAY) status = e.mode === "auto" ? "auto" : "pending";
    else status = "planned";
    list.push({ e, date, key: k, c, status, eff: (c && c.s === "paid" && c.d) || date, amt: c && c.a != null ? c.a : e.amount, acc: (c && c.acc) || e.acc, done: status === "paid" || status === "auto" });
  }
  return list.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.e.kind === "in" ? -1 : 1);
}
function impacts(o) {
  if (o.e.kind === "out") return [[o.acc, -o.amt]];
  if (o.e.kind === "in") return [[o.acc, o.amt]];
  return [[o.acc, -o.amt], [o.e.to, o.amt]];
}
function balances() {
  const bal = {}, open = {};
  for (const a of S.accounts) { bal[a.id] = a.start; open[a.id] = a.open; }
  for (const o of ALL) if (o.done && o.eff <= TODAY) for (const [acc, d] of impacts(o)) if (acc in bal && o.eff >= open[acc]) bal[acc] += d;
  return bal;
}
function forecast(months) {
  const end = addMonths(TODAY, months);
  const inc = id => !UI.hidden[id] && S.accounts.some(a => a.id === id);
  let total = S.accounts.filter(a => inc(a.id)).reduce((s, a) => s + (BAL[a.id] || 0), 0);
  const delta = {};
  for (const o of ALL) {
    if (o.status === "skipped") continue;
    let when;
    if (o.done) { if (o.eff > TODAY) when = o.eff; else continue; }
    else if (o.status === "pending") when = TODAY;
    else when = o.date;
    if (when > end) continue;
    for (const [acc, d] of impacts(o)) if (inc(acc)) delta[when] = (delta[when] || 0) + d;
  }
  const pts = [];
  for (let d = TODAY, i = 0; d <= end && i < 800; d = addDays(d, 1), i++) { total += delta[d] || 0; pts.push({ d, v: total }); }
  return pts;
}
const accById = id => S.accounts.find(a => a.id === id);
const accName = id => accById(id)?.name || "Sletta konto";

/* ================= Lagring */
const LS = "pengeflyt.v1";
let ref = null, saveT = null, writing = false, again = false, saveState = "local";
function setSave(st) {
  saveState = st; const el = $("#save"); if (!el) return;
  const t = { ok: "Lagra på kontoen din", busy: "Lagrar …", local: window.PF_NATIVE ? "Lagra på telefonen" : "Lagra i denne nettlesaren", err: "Fekk ikkje lagra. Prøver igjen ved neste endring.", wait: "Hentar data …" }[st];
  el.className = "save-state " + (st === "ok" ? "" : st === "busy" || st === "wait" ? "busy" : "local"); el.innerHTML = `<i></i>${t}`;
}
function commit() {
  touched = true;
  if (!WEB) try { localStorage.setItem(LS, JSON.stringify(S)); } catch (_) { }
  render();
  if (!ref) { setSave("local"); return; }
  setSave("busy"); clearTimeout(saveT); saveT = setTimeout(flush, 700);
}
async function flush(retried) {
  if (writing) { again = true; return; }
  writing = true;
  try { await ref.set({ v: 1, state: JSON.parse(JSON.stringify(S)) }); setSave("ok"); }
  catch (e) {
    if (e && e.code === "unavailable" && !retried) { writing = false; setTimeout(() => flush(true), 800 + Math.random() * 800); return; }
    setSave("err");
  }
  writing = false;
  if (again) { again = false; flush(); }
}
async function connect() {
  const c = window.claude;
  if (!c || typeof c.use !== "function") { setSave("local"); return; }
  setSave("wait");
  const timer = setTimeout(() => setSave("local"), 10000);
  try {
    const [db, user] = await Promise.all([c.use("db"), c.use("user")]);
    if (!db || !user) { clearTimeout(timer); setSave("local"); return; }
    const id = await user.id();
    if (!id) { clearTimeout(timer); setSave("local"); return; }
    const r = db.collection("data/users/" + id).doc("budsjett");
    const snap = await r.get();
    clearTimeout(timer);
    ref = r;
    if (snap.exists) {
      const st = migrate(JSON.parse(JSON.stringify(snap.data()?.state || null)));
      if (st && !touched) { S = st; try { localStorage.setItem(LS, JSON.stringify(S)); } catch (_) { } render(); setSave("ok"); return; }
    }
    if (touched || (S && !S.demo)) { setSave("busy"); flush(); } else setSave("ok");
  } catch (e) { clearTimeout(timer); ref = null; setSave("local"); }
}

/* ================= Små byggjeklossar */
function statusPill(o) {
  const k = o.e.kind;
  switch (o.status) {
    case "paid": return `<span class="pill paid">${k === "in" ? "Motteke" : k === "move" ? "Overført" : "Betalt"}</span>`;
    case "auto": return `<span class="pill paid">${k === "in" ? "Kom inn" : k === "move" ? "Overført" : "Trekt"}</span>`;
    case "pending": return `<span class="pill pending">Ventar på deg</span>`;
    case "skipped": return `<span class="pill skipped">Hoppa over</span>`;
    default: return o.e.mode === "auto" ? `<span class="pill auto">Automatisk</span>` : `<span class="pill manual">Godkjenn sjølv</span>`;
  }
}
function amtHtml(kind, a) {
  if (kind === "move") return `<div class="amt num move">${kr(a)}</div>`;
  return `<div class="amt num ${kind === "in" ? "in" : ""}">${kr(kind === "in" ? a : -a, true)}</div>`;
}
function accLine(o) { return o.e.kind === "move" ? `${esc(accName(o.acc))} → ${esc(accName(o.e.to))}` : esc(accName(o.acc)); }
function occRow(o, opt = {}) {
  const pend = o.status === "pending" && opt.pay;
  return `<div class="row click ${o.status === "skipped" ? "is-skipped" : ""} ${pend ? "pending-row" : ""}" role="button" tabindex="0" data-a="occ" data-k="${esc(o.key)}">
    ${icon(o.e.cat, "sm")}
    <div style="min-width:0"><div class="t">${esc(o.e.name)}</div>
      <div class="s">${opt.date === false ? "" : `<span>${relDate(o.date)}</span><span>·</span>`}<span>${accLine(o)}</span>${statusPill(o)}${o.c && o.c.a != null && o.c.a !== o.e.amount ? `<span>planlagt ${kr(o.e.amount)}</span>` : ""}</div></div>
    <div class="right">${amtHtml(o.e.kind, o.amt)}${pend ? `<div class="acts"><button class="btn sm" data-a="occ-amt" data-k="${esc(o.key)}">Endre sum</button><button class="btn sm good" data-a="pay" data-k="${esc(o.key)}">${o.e.kind === "in" ? "Motteke" : "Betalt"}</button></div>` : ""}</div>
  </div>`;
}
const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="var(--accent)"/><path d="M8 27c5 0 6-11 12-11s6 7 12 4" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><circle cx="32" cy="20" r="3" fill="#fff"/></svg>`;

/* ================= Budsjettperiode: kalendermånad eller lønningsperiode */
const cyc = () => S.cycle || { type: "month" };
function payDate(y, m) {
  const c = cyc(); let d = iso(y, m, Math.min(c.day || 1, dim(y, m)));
  if (c.weekend) { const w = dow(d); if (w === 5) d = addDays(d, -1); else if (w === 6) d = addDays(d, -2); }
  return d;
}
function periodFor(date) {
  const { y, m } = P(date);
  if (cyc().type !== "pay") { const s0 = iso(y, m, 1); return { start: s0, end: iso(y, m, dim(y, m)) }; }
  const prev = addMonths(iso(y, m, 1), -1), next = addMonths(iso(y, m, 1), 1);
  const here = payDate(y, m);
  if (date >= here) { const n = payDate(P(next).y, P(next).m); return { start: here, end: addDays(n, -1) }; }
  return { start: payDate(P(prev).y, P(prev).m), end: addDays(here, -1) };
}
function periodTitle(p) {
  if (cyc().type !== "pay") { const n = MONTHS[P(p.start).m - 1]; return n[0].toUpperCase() + n.slice(1); }
  return `${fmtDate(p.start)} – ${fmtDate(p.end)}`;
}
// Forslag til lønnsdag: den største månadlege inntekta.
function guessPayday() {
  const e = S.entries.filter(x => x.kind === "in" && x.freq === "m1").sort((a, b) => b.amount - a.amount)[0];
  return e ? { day: P(e.date).d, name: e.name } : null;
}
let CY = null;
function openCycle() {
  CY = { ...{ type: "month", day: 20, weekend: true }, ...cyc() };
  if (!CY.day) CY.day = guessPayday()?.day || 20;
  const g = guessPayday();
  openSheet(`${head("Budsjettperiode")}
  <div class="sheet-body">
    <p class="hint" style="margin:0">Vel om oversikta skal følgje kalendermånaden eller lønna di. Med lønningsperiode går «månaden» frå lønnsdag til dagen før neste lønnsdag.</p>
    <div class="seg" id="cy-type">${[["month", "Kalendermånad"], ["pay", "Lønningsperiode"]].map(([k, n]) => `<button data-a="cy-type" data-v="${k}" aria-pressed="${CY.type === k}">${n}</button>`).join("")}</div>
    <div id="cy-pay" ${CY.type === "pay" ? "" : "hidden"} style="display:grid;gap:14px">
      <div class="field"><label for="cy-day">Lønnsdag (dag i månaden)</label>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input class="input num" id="cy-day" inputmode="numeric" value="${CY.day}" style="max-width:90px">
        ${g ? `<button class="chip" data-a="cy-guess" data-v="${g.day}">Bruk «${esc(g.name)}»: den ${g.day}.</button>` : ""}</div></div>
      <label class="check"><input type="checkbox" id="cy-weekend" ${CY.weekend ? "checked" : ""}> Lønna kjem fredagen før om lønnsdagen er laurdag eller sundag</label>
    </div>
    <div class="preview" id="cy-prev"></div>
    <div class="err" id="cy-err" role="alert"></div>
  </div>
  <div class="sheet-foot"><span class="grow"></span><button class="btn" data-a="close">Avbryt</button><button class="btn primary" data-a="cy-save">Lagre</button></div>`, "cycle");
  cyPrev();
}
function cyRead() { const d = Math.floor(Number($("#cy-day").value)); CY.day = d; CY.weekend = $("#cy-weekend").checked; return d >= 1 && d <= 31; }
function cyPrev() {
  const old = S.cycle; const ok = CY.type !== "pay" || cyRead();
  if (!ok) { $("#cy-prev").textContent = "Skriv ein dag mellom 1 og 31."; return; }
  S.cycle = { ...CY }; const p = periodFor(TODAY), n = periodFor(addDays(p.end, 1)); S.cycle = old;
  $("#cy-prev").innerHTML = `Denne perioden: <b>${fmtDate(p.start, true)} – ${fmtDate(p.end, true)}</b> (${diffDays(p.start, p.end) + 1} dagar). Neste: <b>${fmtDate(n.start)} – ${fmtDate(n.end, true)}</b>.`;
}

/* ================= Budsjett */
// Brukt = trekt eller betalt i perioden fram til i dag. Planlagt = det som står att i perioden.
function catStats(per) {
  const from = S.since > per.start ? S.since : per.start;
  const occ = buildOcc(from, per.end);
  const st = {};
  for (const o of occ) {
    if (o.e.kind !== "out" || o.status === "skipped") continue;
    const c = st[o.e.cat] || (st[o.e.cat] = { spent: 0, planned: 0, n: 0 });
    if (o.done && o.eff <= TODAY) c.spent += o.amt; else c.planned += o.amt;
    c.n++;
  }
  return { st, occ };
}
function budgetRows(per) {
  const { st } = catStats(per);
  const daysLeft = Math.max(1, diffDays(TODAY, per.end) + 1);
  return Object.entries(S.budgets || {}).filter(([id, v]) => v > 0 && CAT_BY_ID[id]).map(([id, limit]) => {
    const c = st[id] || { spent: 0, planned: 0 };
    const free = limit - c.spent - c.planned;
    const pct = (c.spent + c.planned) / limit;
    return { id, cat: CAT_BY_ID[id], limit, spent: c.spent, planned: c.planned, free, pct, perDay: free > 0 ? free / daysLeft : 0,
      state: pct > 1 ? "over" : pct >= .85 ? "near" : "ok" };
  }).sort((a, b) => b.pct - a.pct);
}
function budgetLeftText(catId) {
  const lim = S.budgets?.[catId]; if (!(lim > 0)) return "";
  const r = budgetRows(periodFor(TODAY)).find(x => x.id === catId); if (!r) return "";
  return r.free >= 0 ? `${kr(r.free)} att på ${r.cat.name.toLowerCase()}` : `${kr(-r.free)} over budsjettet for ${r.cat.name.toLowerCase()}`;
}
function bBar(r) {
  const max = Math.max(r.limit, r.spent + r.planned);
  const w = v => (v / max * 100).toFixed(1) + "%";
  return `<div class="bbar ${r.state}" style="--cat:${r.cat.color}"><i class="sp" style="width:${w(r.spent)}"></i><i class="pl" style="width:${w(r.planned)}"></i>${r.spent + r.planned > r.limit ? `<b class="lim" style="left:${w(r.limit)}"></b>` : ""}</div>`;
}
function bStatus(r) {
  return r.free >= 0 ? `<span class="pill ${r.state === "near" ? "pending" : "paid"}">${kr(r.free)} ledig</span>` : `<span class="pill over">${kr(-r.free)} over</span>`;
}
function budgetMini() {
  const rows = budgetRows(periodFor(TODAY));
  if (!rows.length) return `<section class="card"><div class="card-head"><h2>Budsjett</h2></div><div class="empty">Set ei ramme for mat, kafé eller andre kategoriar, så ser du kor mykje du har att fram til løn.</div><button class="btn sm primary" data-a="tab" data-v="budsjett">Set opp budsjett</button></section>`;
  return `<section class="card"><div class="card-head"><h2>Budsjett</h2><button class="btn ghost sm" data-a="tab" data-v="budsjett" style="margin-left:auto">Alle →</button></div>
    <div class="blist">${rows.slice(0, 4).map(r => `<button class="brow mini" data-a="tab" data-v="budsjett">${icon(r.cat, "sm")}<div class="bmain"><div class="btop"><span class="bn">${esc(r.cat.name)}</span>${bStatus(r)}</div>${bBar(r)}</div></button>`).join("")}</div></section>`;
}
function viewBudsjett() {
  if (!S.accounts.length) return onboarding();
  const per = periodFor(TODAY), rows = budgetRows(per);
  const daysLeft = diffDays(TODAY, per.end) + 1;
  const { st, occ } = catStats(per);
  const tot = rows.reduce((a, r) => ({ limit: a.limit + r.limit, spent: a.spent + r.spent, planned: a.planned + r.planned }), { limit: 0, spent: 0, planned: 0 });
  const free = tot.limit - tot.spent - tot.planned;
  // Går budsjettet opp? Inntekt − sparing − utgifter utan ramme − rammene.
  const sums = monthSums(occ.length ? buildOcc(S.since > per.start ? S.since : per.start, per.end) : []);
  const unbudgeted = Object.entries(st).filter(([id]) => !(S.budgets?.[id] > 0)).reduce((t, [, c]) => t + c.spent + c.planned, 0);
  const balance = sums.inn - sums.spar - unbudgeted - tot.limit;
  const others = Object.entries(st).filter(([id]) => !(S.budgets?.[id] > 0) && CAT_BY_ID[id]).map(([id, c]) => ({ id, cat: CAT_BY_ID[id], total: c.spent + c.planned })).sort((a, b) => b.total - a.total);
  return `<div class="grid">
    <section class="card span-12 bsum">
      <div class="card-head"><div><h2>Budsjett · ${periodTitle(per)}</h2><div class="per-sub">${cyc().type === "pay" ? "Lønningsperiode" : "Kalendermånad"} · ${daysLeft} ${daysLeft === 1 ? "dag" : "dagar"} att</div></div>
        <button class="btn sm per-btn" data-a="cycle">${cyc().type === "pay" ? "Endre periode" : "Bruk lønningsperiode"}</button></div>
      ${rows.length ? `<div class="sum4">
        <div><span>Ramme totalt</span><b class="num">${kr(tot.limit)}</b></div>
        <div><span>Brukt hittil</span><b class="num">${kr(tot.spent)}</b></div>
        <div><span>Planlagt resten</span><b class="num">${kr(tot.planned)}</b></div>
        <div><span>${free >= 0 ? "Ledig" : "Over"}</span><b class="num" style="color:${free < 0 ? "var(--bad)" : "var(--good)"}">${kr(Math.abs(free))}</b></div></div>
      <div class="bfit ${balance >= 0 ? "ok" : "bad"}">${balance >= 0
        ? `<b>Budsjettet går opp.</b> Etter rammene, sparing og andre utgifter har du ${kr(balance)} å gå på i perioden.`
        : `<b>Budsjettet går ikkje opp.</b> Rammene, sparing og andre utgifter er ${kr(-balance)} meir enn inntekta i perioden.`}</div>
      <details class="explain"><summary>Slik er tala rekna</summary><p><b>Brukt</b> er det som er trekt eller betalt i perioden fram til i dag. <b>Planlagt</b> er faste postar som står att før perioden er over. <b>Ledig</b> er ramma minus brukt og planlagt. Det er dette du kan bruke utan å sprenge budsjettet. «Går opp» samanliknar inntekta i perioden med rammene, sparinga og utgiftene du ikkje har sett ramme for.</p></details>` : ""}
    </section>
    <section class="card span-12">
      <div class="group-title"><h2>Rammer</h2><span class="sub">${rows.length} kategoriar</span></div>
      ${rows.length ? `<div class="blist">${rows.map(r => `<button class="brow" data-a="b-edit" data-id="${r.id}">${icon(r.cat)}
        <div class="bmain"><div class="btop"><span class="bn">${esc(r.cat.name)}</span><span class="bnum num">${kr(r.spent + r.planned)} <span>av ${kr(r.limit)}</span></span></div>
          ${bBar(r)}
          <div class="bbot">${bStatus(r)}${r.planned ? `<span>${kr(r.planned)} planlagt</span>` : ""}${r.free > 0 && daysLeft > 0 ? `<span>≈ <b class="num">${kr(r.perDay)}</b> per dag i ${daysLeft} ${daysLeft === 1 ? "dag" : "dagar"}</span>` : ""}</div></div></button>`).join("")}</div>`
      : `<div class="empty live">${icon("mat")}${icon("ute")}${icon("klede")}<span>Ingen rammer enno. Start med det du brukar mest på i kvardagen, til dømes mat.</span></div>`}
      <button class="btn primary sm" data-a="b-new" style="margin-top:10px">+ Ny ramme</button>
    </section>
    ${others.length ? `<section class="card span-12"><div class="group-title"><h2>Utan ramme denne perioden</h2><span class="sub">Trykk for å setje ei ramme</span></div>
      <div class="blist">${others.map(o => `<button class="row" data-a="b-new" data-id="${o.id}">${icon(o.cat, "sm")}<div><div class="t">${esc(o.cat.name)}</div><div class="s">Brukt og planlagt i perioden</div></div><div class="right"><div class="amt num">${kr(o.total)}</div><span class="s" style="color:var(--accent);font-weight:600">+ Set ramme</span></div></button>`).join("")}</div></section>` : ""}
  </div>`;
}
let BE = null;
function openBudget(id, isNew) {
  const per = periodFor(TODAY);
  const { st } = catStats(per);
  // Forslag: brukt + planlagt no, eller førre periode om den var høgare. Runda opp til næraste 100.
  const prevPer = periodFor(addDays(per.start, -1));
  const prev = prevPer.end >= S.since ? catStats(prevPer).st : {};
  const sug = cid => { const a = st[cid] ? st[cid].spent + st[cid].planned : 0, b = prev[cid] ? prev[cid].spent + prev[cid].planned : 0; const v = Math.max(a, b); return v > 0 ? Math.ceil(v / 100) * 100 : 0; };
  BE = { id: id || null, amount: S.budgets?.[id] || "", isNew: isNew || !S.budgets?.[id], sug };
  const pickable = CATS.filter(c => c.kind === "out").sort((a, b) => (S.budgets?.[a.id] ? 1 : 0) - (S.budgets?.[b.id] ? 1 : 0) || (b.custom ? 1 : 0) - (a.custom ? 1 : 0));
  openSheet(`${head(BE.isNew ? "Ny ramme" : "Endre ramme")}
  <div class="sheet-body">
    ${BE.isNew && !id ? `<div class="field"><span class="lab">Kategori</span><div class="picker live" id="be-picker" role="radiogroup" aria-label="Kategori">${pickable.map((c, i) => `<button class="pick" style="--cat:${c.color};animation-delay:${i * 14}ms" role="radio" aria-checked="false" data-a="be-cat" data-v="${c.id}">${S.budgets?.[c.id] ? `<span class="mine">Har ramme</span>` : ""}${icon(c)}<span>${esc(c.name)}</span></button>`).join("")}</div></div>` : ""}
    <div class="quick-hero live" id="be-hero"></div>
    <div class="field"><label for="be-amt">Ramme for ${cyc().type === "pay" ? "kvar lønningsperiode" : "kvar månad"}</label><div class="amount-in big"><input id="be-amt" inputmode="decimal" autocomplete="off" placeholder="0" value="${BE.amount}"><span>kr</span></div></div>
    <div class="suggest" id="be-sug"></div>
    <div class="preview" id="be-info"></div>
    <div class="err" id="be-err" role="alert"></div>
  </div>
  <div class="sheet-foot">${!BE.isNew ? `<button class="btn ghost danger grow" data-a="be-del">Fjern ramma</button>` : `<span class="grow"></span>`}<button class="btn" data-a="close">Avbryt</button><button class="btn primary" data-a="be-save">Lagre</button></div>`, "budget");
  beRender();
  if (BE.id) setTimeout(() => { $("#be-amt").focus(); $("#be-amt").select(); }, 60);
}
function beRender() {
  const c = BE.id && CAT_BY_ID[BE.id];
  $("#be-hero").innerHTML = c ? `${icon(c, "lg")}<div><div class="t">${esc(c.name)}</div><div class="s">${S.budgets?.[c.id] ? "Har ramme no: " + kr(S.budgets[c.id]) : "Inga ramme enno"}</div></div>` : `<div class="s" style="color:var(--muted)">Vel ein kategori over.</div>`;
  $("#be-hero").hidden = !c && !!$("#be-picker");
  const sv = c ? BE.sug(c.id) : 0;
  $("#be-sug").innerHTML = c && sv ? `<span>Forslag:</span><button style="--cat:${c.color}" data-a="be-sugset" data-v="${sv}">${kr(sv)}</button><span>ut frå det som er brukt og planlagt</span>` : "";
  if (c) { const { st } = catStats(periodFor(TODAY)); const x = st[c.id] || { spent: 0, planned: 0 }; $("#be-info").innerHTML = `Denne perioden: <b>${kr(x.spent)}</b> brukt og <b>${kr(x.planned)}</b> planlagt i ${esc(c.name.toLowerCase())}.`; $("#be-info").hidden = false; }
  else $("#be-info").hidden = true;
}
function beSave() {
  if (!BE.id) { $("#be-err").textContent = "Vel ein kategori."; return; }
  const a = parseAmt($("#be-amt").value);
  if (!(a > 0)) { $("#be-err").textContent = "Skriv inn ei ramme større enn 0."; $("#be-amt").focus(); return; }
  S.budgets = { ...(S.budgets || {}), [BE.id]: Math.round(a) };
  const n = CAT_BY_ID[BE.id].name; closeSheet(); commit(); toast(`Ramme for ${n.toLowerCase()}: ${kr(a)}`);
}

/* ================= Inn, ut, sparing og til overs */
// Sparing = overføring frå ein vanleg konto til ein sparekonto. Uttak frå sparekonto tel som minus.
function savingDelta(e, amt) {
  if (e.kind !== "move") return 0;
  const from = accById(e.acc)?.type === "saving", to = accById(e.to)?.type === "saving";
  return to && !from ? amt : from && !to ? -amt : 0;
}
function monthSums(list) {
  const r = { inn: 0, ut: 0, spar: 0 };
  for (const o of list) {
    if (o.status === "skipped") continue;
    if (o.e.kind === "in") r.inn += o.amt; else if (o.e.kind === "out") r.ut += o.amt; else r.spar += savingDelta(o.e, o.amt);
  }
  r.att = r.inn - r.ut - r.spar;
  return r;
}
const EXPLAIN = {
  month: `<b>Inn</b> er alle inntekter i perioden, både det som har kome og det som er planlagt.
    <b>Ut</b> er alle utgifter, også småkjøp.
    <b>Sparing</b> er det du flyttar til sparekontoar. Pengane er framleis dine, men er sette av.
    <b>Til overs</b> er Inn − Ut − Sparing: det du har att etter rekningar og sparing.
    Overføringar mellom vanlege kontoar, som å betale ned kredittkortet, er ikkje med.`,
  fixed: `Rekna som eit snitt per månad. Postar som ikkje kjem kvar månad blir fordelte jamt:
    kommunale avgifter fire gonger i året tel ein tredjedel per månad. Småkjøp og eingongspostar er ikkje med.
    <b>Til overs</b> er det du har att til forbruk ein vanleg månad, etter faste rekningar og sparing.`,
};
function sumBoxes(r, opt = {}) {
  const L = opt.labels || ["Inn", "Ut", "Sparing", "Til overs"];
  const box = (lab, val, st, tip) => `<div title="${esc(tip)}"><span>${lab}</span><b class="num" ${st ? `style="${st}"` : ""}>${kr(val)}</b></div>`;
  return `<div class="sum4" ${opt.style ? `style="${opt.style}"` : ""}>
    ${box(L[0], r.inn, "color:var(--good)", "Alle inntekter")}
    ${box(L[1], r.ut, "", "Alle utgifter")}
    ${box(L[2], r.spar, "color:var(--accent)", "Flytta til sparekontoar")}
    ${box(L[3], r.att, r.att < 0 ? "color:var(--bad)" : "", "Inn − Ut − Sparing")}
  </div>
  <details class="explain"><summary>Slik er tala rekna</summary><p>${EXPLAIN[opt.explain || "month"]}</p></details>`;
}

/* ================= Visingar */
function topbar() {
  const tabs = [["oversikt", "Oversikt"], ["budsjett", "Budsjett"], ["kalender", "Kalender"], ["postar", "Faste postar"], ["kontoar", "Kontoar"]];
  return `<header class="topbar">
    <div class="logo">${LOGO}<span class="logo-t">Pengeflyt<small>Budsjett &amp; Utgifter</small></span></div>
    <div class="save-state" id="save"></div>
    <div class="langsw" role="group" aria-label="Språk">${[["nn", "NN", "Nynorsk"], ["nb", "NB", "Bokmål"]].map(([k, t, n]) => `<button data-a="lang" data-v="${k}" aria-pressed="${S.lang === k}" title="${n}" aria-label="${n}">${t}</button>`).join("")}</div>
    ${WEB ? `<button class="btn sm theme-btn" data-a="account" aria-label="Konto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg><span>Konto</span></button>` : ""}
    <button class="btn sm theme-btn" data-a="theme" aria-label="Vel tema">${SEASON_ICON[seasonNow()] || ""}<span>${themeLabel()}</span></button>
    <nav class="tabs" aria-label="Visingar">${tabs.map(([v, n]) => `<button data-a="tab" data-v="${v}" ${UI.view === v ? 'aria-current="page"' : ""}>${n}</button>`).join("")}</nav>
  </header>
  ${S.demo ? `<div class="banner"><span><b>Dette er eksempeldata.</b> Prøv deg fram: godkjenn ei rekning, legg til ein post eller sjå framover i kalenderen.</span><button class="btn sm" data-a="clear-demo">Start med blanke ark</button></div>` : ""}`;
}

function viewOversikt() {
  if (!S.accounts.length) return onboarding();
  const pts = forecast(UI.months);
  const total = pts[0]?.v ?? 0;
  let low = pts[0]; for (const p of pts) if (p.v < low.v) low = p;
  const endV = pts[pts.length - 1]?.v ?? 0;
  const pending = ALL.filter(o => o.status === "pending");
  const soon = ALL.filter(o => o.date > TODAY && o.date <= addDays(TODAY, 30) && o.status !== "skipped" && !o.done);
  const per = periodFor(TODAY), ms = per.start, me = per.end;
  const month = ALL.filter(o => o.date >= ms && o.date <= me && o.status !== "skipped");
  const daysLeft = diffDays(TODAY, me);
  const sums = monthSums(month);
  const byCat = {}; for (const o of month) if (o.e.kind === "out") byCat[o.e.cat] = (byCat[o.e.cat] || 0) + o.amt;
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxC = cats[0]?.[1] || 1;
  const shown = S.accounts.filter(a => !UI.hidden[a.id]);

  return `
  <section class="hero" aria-label="Saldo og prognose">
    <canvas id="season-fx" aria-hidden="true"></canvas>
    <div>
      ${seasonNow() ? `<div class="season-tag">${SEASONS[seasonNow()].greet}</div>` : ""}
      <div class="label">${shown.length === S.accounts.length ? "Samla saldo i dag" : `Saldo i dag, ${shown.length} av ${S.accounts.length} kontoar`}</div>
      <div class="big">${kr(total)}</div>
      <div class="facts">
        <div><span>Lågaste punkt</span><b>${kr(low.v)} · ${fmtDate(low.d)}</b></div>
        <div><span>Om ${UI.months} månader</span><b>${kr(endV)}</b></div>
        <div><span>Ventar på godkjenning</span><b>${pending.length} ${pending.length === 1 ? "post" : "postar"}</b></div>
      </div>
    </div>
    <div class="chart-wrap">
      <div class="chart-top"><span class="t">Slik går pengane framover</span>
        <div class="seg-light" role="group" aria-label="Periode">${[3, 6, 12].map(m => `<button data-a="range" data-v="${m}" aria-pressed="${UI.months === m}">${m} mnd</button>`).join("")}</div></div>
      <div id="chart" style="height:190px"></div>
      <div class="acc-toggles" aria-label="Kontoar med i prognosen">${S.accounts.map(a => `<button data-a="acc-toggle" data-id="${a.id}" aria-pressed="${!UI.hidden[a.id]}">${esc(a.name)}</button>`).join("")}</div>
    </div>
  </section>

  <div class="grid">
    <section class="card span-7">
      <div class="card-head"><h2>Ventar på deg</h2>${pending.length ? `<span class="count">${pending.length}</span>` : ""}<span class="sub">Stadfest det du faktisk har betalt</span></div>
      ${pending.length ? `<div class="list">${pending.map(o => occRow(o, { pay: true })).join("")}</div>`
      : `<div class="empty">${icon("forsikring", "sm live")}Alt er i orden. Ingenting ventar på godkjenning.</div>`}
    </section>
    <section class="card span-5">
      <div class="card-head"><div style="min-width:0"><h2>${periodTitle(per)}</h2><div class="per-sub">${cyc().type === "pay" ? "Lønningsperiode" : "Kalendermånad"} · ${daysLeft === 0 ? "siste dag" : `${daysLeft} ${daysLeft === 1 ? "dag" : "dagar"} att`}${cyc().type === "pay" ? ` · neste løn ${relDate(addDays(me, 1))}` : ""}</div></div>
        <button class="btn sm per-btn" data-a="cycle" aria-label="Endre budsjettperiode">${cyc().type === "pay" ? "Endre" : "Bruk lønningsperiode"}</button></div>
      <div class="per-bar" aria-hidden="true"><i style="width:${Math.min(100, (diffDays(ms, TODAY) + 1) / (diffDays(ms, me) + 1) * 100)}%"></i></div>
      ${sumBoxes(sums)}
      <div class="bars">${cats.map(([id, v]) => { const c = CAT_BY_ID[id] || CAT_BY_ID.anna; return `<div class="bar row" style="--cat:${c.color};border:0;padding:0">${icon(c, "sm")}<div class="lbl"><div><span>${esc(c.name)}</span><b class="num">${kr(v)}</b></div><div class="track"><div class="fill" style="width:${Math.max(4, v / maxC * 100)}%"></div></div></div></div>`; }).join("") || `<div class="empty">Ingen utgifter denne månaden enno.</div>`}</div>
    </section>
    <section class="card span-7">
      <div class="card-head"><h2>Kjem dei neste 30 dagane</h2><span class="sub">${soon.length} postar</span></div>
      ${soon.length ? `<div class="list">${soon.slice(0, 10).map(o => occRow(o)).join("")}</div>${soon.length > 10 ? `<button class="btn ghost" data-a="tab" data-v="kalender">Sjå alle i kalenderen →</button>` : ""}` : `<div class="empty">Ingenting planlagt. Legg til faste postar, så dukkar dei opp her.</div>`}
    </section>
    <div class="span-5" style="display:grid;gap:18px;align-content:start;min-width:0">
    ${budgetMini()}
    ${quickCard()}
    <section class="card">
      <div class="card-head"><h2>Kontoar</h2><button class="btn ghost sm" data-a="tab" data-v="kontoar" style="margin-left:auto">Alle →</button></div>
      <div class="list">${S.accounts.map(a => `<button class="row" data-a="acc" data-id="${a.id}"><span class="ic sm" style="--cat:${a.color}">${accIcon(a.type)}</span><div><div class="t">${esc(a.name)}</div><div class="s">${ACC_TYPES[a.type]?.name || ""}</div></div><div class="amt num" style="color:${(BAL[a.id] || 0) < 0 ? "var(--bad)" : "inherit"}">${kr(BAL[a.id] || 0)}</div></button>`).join("")}</div>
    </section>
    </div>
  </div>`;
}
function quickCard() {
  const ms = periodFor(TODAY).start;
  const list = ALL.filter(o => o.e.quick && o.date >= ms && o.date <= TODAY && o.status !== "skipped").reverse();
  const sum = list.reduce((s, o) => s + (o.e.kind === "in" ? -o.amt : o.amt), 0);
  return `<section class="card">
    <div class="card-head"><h2>${cyc().type === "pay" ? "Småkjøp denne perioden" : `Småkjøp i ${MONTHS[P(TODAY).m - 1]}`}</h2><span class="sub num">${list.length ? kr(sum) + " · " + list.length + " stk" : ""}</span></div>
    <div class="quickbar">${S.quick.map(q => `<button class="qbtn" data-a="quick" data-id="${q.id}">${icon(CAT_BY_ID[q.cat] ? q.cat : "anna", "sm")}<span>${esc(q.label)}</span></button>`).join("")}
      <button class="qbtn ghost" data-a="quick-cfg" aria-label="Tilpass snarvegar"><span class="ic sm" style="--cat:var(--muted)"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M24 12v24M12 24h24"/></svg></span><span>Tilpass</span></button></div>
    ${list.length ? `<div class="list" style="margin-top:8px">${list.slice(0, 5).map(o => occRow(o)).join("")}</div>` : `<div class="empty">Trykk på ein knapp, skriv summen og lagre. Så er kjøpet registrert.</div>`}
  </section>`;
}

function onboarding() {
  return `<section class="card" style="display:grid;gap:14px;justify-items:start;padding:28px">
    <div style="display:flex;gap:10px" class="live">${["heim", "lon", "mat", "sparing", "kommunalt"].map(c => icon(c)).join("")}</div>
    <h2 style="font-size:1.4rem">Velkomen til Pengeflyt</h2>
    <p style="margin:0;color:var(--muted);max-width:56ch">Start med kontoane dine: brukskonto, kontantar, kredittkort og sparing. Legg så inn faste inntekter og utgifter, også dei som kjem fram i tid, så ser du korleis pengane flyt framover.</p>
    <button class="btn primary" data-a="new-acc">Legg til første konto</button>
  </section>`;
}

function viewKalender() {
  const [y, m] = UI.calMonth.split("-").map(Number);
  const first = iso(y, m, 1), last = iso(y, m, dim(y, m));
  const gStart = addDays(first, -dow(first));
  const weeks = Math.ceil((dow(first) + dim(y, m)) / 7);
  const gEnd = addDays(gStart, weeks * 7 - 1);
  const occ = buildOcc(S.since > gStart ? S.since : gStart, gEnd);
  const byDay = {}; for (const o of occ) (byDay[o.date] = byDay[o.date] || []).push(o);
  const inMonth = occ.filter(o => o.date >= first && o.date <= last && o.status !== "skipped");
  const sums = monthSums(inMonth);
  let cells = "";
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(gStart, i), list = byDay[d] || [];
    const net = list.filter(o => o.status !== "skipped").reduce((s, o) => s + (o.e.kind === "in" ? o.amt : o.e.kind === "out" ? -o.amt : 0), 0);
    cells += `<button class="daycell ${d < first || d > last ? "out" : ""} ${d === TODAY ? "today" : ""} ${UI.calDay === d ? "sel" : ""}" data-a="day" data-d="${d}" aria-label="${P(d).d}. ${MONTHS[P(d).m - 1]}, ${list.length} postar">
      <span class="d">${P(d).d}</span>
      ${list.some(o => o.status === "pending") ? `<span class="flag" title="Ventar på godkjenning"></span>` : ""}
      <span class="icons">${list.slice(0, 3).map(o => icon(o.e.cat, "xs")).join("")}${list.length > 3 ? `<span class="more">+${list.length - 3}</span>` : ""}</span>
      ${net ? `<span class="net ${net > 0 ? "pos" : ""}">${kr(net, true)}</span>` : ""}
    </button>`;
  }
  const listDays = UI.calDay ? [UI.calDay] : Object.keys(byDay).filter(d => d >= first && d <= last).sort();
  const groups = listDays.map(d => `<div class="daygroup"><h3>${DOW[dow(d)]} ${fmtDate(d)}${d === TODAY ? " · i dag" : ""}</h3><div class="list">${(byDay[d] || []).map(o => occRow(o, { date: false, pay: true })).join("") || `<div class="empty">Ingen postar denne dagen.</div>`}</div>
    ${UI.calDay ? `<button class="btn ghost sm" data-a="new-entry" data-date="${d}">+ Legg til på denne dagen</button>` : ""}</div>`).join("");
  return `<div class="grid">
    <section class="card span-7">
      <div class="cal-head"><button class="iconbtn" data-a="cal" data-v="-1" aria-label="Førre månad">‹</button><h2>${MONTHS[m - 1]} ${y}</h2>
        <button class="btn sm" data-a="cal" data-v="0">I dag</button><button class="iconbtn" data-a="cal" data-v="1" aria-label="Neste månad">›</button></div>
      ${sumBoxes(sums, { style: "margin-bottom:6px" })}
      <div class="calgrid">${(S.lang === "nb" ? ["ma", "ti", "on", "to", "fr", "lø", "sø"] : ["må", "ty", "on", "to", "fr", "la", "su"]).map(d => `<div class="dow">${d}</div>`).join("")}${cells}</div>
    </section>
    <section class="card span-5">
      <div class="card-head"><h2>${UI.calDay ? fmtDate(UI.calDay, true) : "Heile månaden"}</h2>${UI.calDay ? `<button class="btn ghost sm" data-a="day" data-d="${UI.calDay}" style="margin-left:auto">Vis heile månaden</button>` : ""}</div>
      ${groups || `<div class="empty">Ingen postar i ${MONTHS[m - 1]}.</div>`}
    </section>
  </div>`;
}

function viewPostar() {
  const nextOf = e => occDates(e, TODAY, addMonths(TODAY, 24)).find(d => { const c = S.conf[keyOf(e.id, d)]; return !c || c.s === "plan"; });
  const perMonth = e => e.freq === "once" ? 0 : e.amount * FREQ[e.freq].per;
  const active = e => !e.until || e.until >= TODAY;
  const groups = [["in", "Inntekter"], ["out", "Utgifter"], ["move", "Overføringar og sparing"]];
  const sums = {}; for (const [k] of groups) sums[k] = S.entries.filter(e => e.kind === k && active(e)).reduce((s, e) => s + perMonth(e), 0);
  const row = e => {
    const nx = nextOf(e);
    const acc = e.kind === "move" ? `${esc(accName(e.acc))} → ${esc(accName(e.to))}` : esc(accName(e.acc));
    return `<button class="row" data-a="edit-entry" data-id="${e.id}">${icon(e.cat, "sm")}
      <div style="min-width:0"><div class="t">${esc(e.name)}</div><div class="s"><span>${FREQ[e.freq].n}</span><span>·</span><span>${nx ? "neste " + fmtDate(nx) : e.freq === "once" ? fmtDate(e.date) : "avslutta"}</span><span>·</span><span>${acc}</span><span class="pill ${e.mode === "auto" ? "auto" : "manual"}">${e.mode === "auto" ? "Automatisk" : "Godkjenn sjølv"}</span></div></div>
      <div class="right">${amtHtml(e.kind, e.amount)}${e.freq !== "once" && e.freq !== "m1" ? `<span class="s num" style="font-size:.78rem;color:var(--muted)">≈ ${kr(perMonth(e))}/mnd</span>` : ""}</div></button>`;
  };
  return `<div class="grid">
    <section class="card span-12"><div class="card-head"><h2>Ein vanleg månad</h2><span class="sub">Snitt av faste postar</span></div>
      ${(() => { const spar = S.entries.filter(e => e.kind === "move" && active(e)).reduce((t, e) => t + savingDelta(e, perMonth(e)), 0);
        return sumBoxes({ inn: sums.in, ut: sums.out, spar, att: sums.in - sums.out - spar }, { explain: "fixed", labels: ["Faste inntekter", "Faste utgifter", "Fast sparing", "Til overs"] }); })()}
    </section>
    ${groups.map(([k, n]) => {
      const list = S.entries.filter(e => e.kind === k && !e.quick).sort((a, b) => b.amount * (FREQ[b.freq].per || 0) - a.amount * (FREQ[a.freq].per || 0));
      return `<section class="card span-${k === "out" ? 12 : 6}"><div class="group-title"><h2>${n}</h2><span class="sub">${list.length} postar</span></div>
        ${list.length ? `<div class="list">${list.map(row).join("")}</div>` : `<div class="empty">Ingen ${n.toLowerCase()} enno.</div>`}
        <button class="btn ghost sm" data-a="new-entry" data-kind="${k}">+ Ny ${k === "in" ? "inntekt" : k === "out" ? "utgift" : "overføring"}</button></section>`;
    }).join("")}
    <section class="card span-12"><div class="group-title"><h2>Mine kategoriar</h2><span class="sub">${S.cats.length} eigne</span></div>
      ${S.cats.length ? `<div class="list">${S.cats.map(u => { const n = S.entries.filter(e => e.cat === u.id).length; return `<button class="row" data-a="cat-edit" data-id="${u.id}">${icon(u.id, "sm")}<div><div class="t">${esc(u.name)}</div><div class="s">${KIND[u.kind]} · brukt i ${n} ${n === 1 ? "post" : "postar"}</div></div><span class="s" style="color:var(--muted)">Endre →</span></button>`; }).join("")}</div>`
      : `<div class="empty">Lag dine eigne kategoriar med namn og animert bilete, til dømes «Hytta» eller «Båten».</div>`}
      <button class="btn ghost sm" data-a="cat-new">+ Ny kategori</button></section>
  </div>`;
}

function viewKontoar() {
  return `<div class="accounts">${S.accounts.map(a => {
    const nx = ALL.find(o => o.date > TODAY && o.status !== "skipped" && (o.acc === a.id || o.e.to === a.id));
    const b = BAL[a.id] || 0;
    return `<button class="acc" style="--acol:${a.color}" data-a="acc" data-id="${a.id}">
      <div class="top">${accIcon(a.type)}<div><div class="n">${esc(a.name)}</div><div class="ty">${ACC_TYPES[a.type]?.name || ""}</div></div></div>
      <div class="bal ${b < 0 ? "neg" : ""}">${kr(b)}</div>
      <div class="nx">${nx ? `Neste: ${esc(nx.e.name)} ${relDate(nx.date)}` : "Ingenting planlagt"}</div></button>`;
  }).join("")}<button class="acc add" data-a="new-acc">+ Ny konto</button></div>`;
}

/* ================= Sesongtema */
const SEASONS = {
  vinter: { n: "Vinter", greet: "Vinter · Sjå over budsjettet for jul og nyttår", months: [12, 1, 2] },
  var: { n: "Vår", greet: "Vår · Godt tidspunkt å sjå på skatteoppgjeret", months: [3, 4, 5] },
  sommar: { n: "Sommar", greet: "Sommar · Hugs feriepengane i juni", months: [6, 7, 8] },
  haust: { n: "Haust", greet: "Haust · Tid for å byggje buffer før jul", months: [9, 10, 11] },
};
const SEASON_ICON = {
  vinter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"/></svg>`,
  var: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22V12"/><path d="M12 14c-5 0-7-3-7-7 5 0 7 3 7 7zM12 12c0-4 2-7 7-7 0 4-2 7-7 7z"/></svg>`,
  sommar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  haust: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 22v-6M12 3l2 4 4-1-1 4 3 2-4 2 1 3-5-1-5 1 1-3-4-2 3-2-1-4 4 1z"/></svg>`,
};
const seasonOf = d => Object.keys(SEASONS).find(k => SEASONS[k].months.includes(P(d).m));
function seasonNow() { const t = S?.theme || "auto"; return t === "off" ? null : t === "auto" ? seasonOf(TODAY) : t; }
function themeLabel() { const t = S?.theme || "auto"; return t === "off" ? "Standard" : t === "auto" ? `${SEASONS[seasonOf(TODAY)].n} (auto)` : SEASONS[t].n; }
function applySeason() { const s = seasonNow(); if (s) document.documentElement.dataset.season = s; else delete document.documentElement.dataset.season; }
function openTheme() {
  const cur = S.theme || "auto";
  const opts = [["auto", "Følgj årstida", `Byter av seg sjølv. No: ${SEASONS[seasonOf(TODAY)].n.toLowerCase()}.`, seasonOf(TODAY)],
    ["vinter", "Vinter", "Iskald blå med snøfall.", "vinter"], ["var", "Vår", "Friskt grønt og blomeblad.", "var"],
    ["sommar", "Sommar", "Varm sol og glitrande lys.", "sommar"], ["haust", "Haust", "Raudt og gull med fallande lauv.", "haust"],
    ["off", "Standard", "Kobolt-blå utan årstider.", null]];
  openSheet(`${head("Tema")}
  <div class="sheet-body"><div class="themes">${opts.map(([k, n, d, sz]) => `<button class="theme-opt" data-a="theme-set" data-v="${k}" aria-pressed="${cur === k}"><span class="sw" data-sw="${sz || "off"}"></span><b>${n}</b><span>${d}</span></button>`).join("")}</div></div>
  <div class="sheet-foot"><span class="grow"></span><button class="btn primary" data-a="close">Ferdig</button></div>`, "theme");
}

/* Partiklar i helten: snø, blomeblad, solglitter eller lauv. */
const FX = { season: null, parts: [], raf: 0, t: 0 };
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
function fxInit(season, w, h) {
  const n = { vinter: 70, var: 26, sommar: 34, haust: 22 }[season] || 0;
  const cols = { vinter: ["#ffffff"], var: ["#ffd1e1", "#ffffff", "#ffe8f0"], sommar: ["#fff6c7", "#ffffff", "#ffe08a"], haust: ["#ffb347", "#ff7a2f", "#f2c230", "#e04f1a"] }[season];
  FX.parts = Array.from({ length: n }, () => ({
    x: Math.random() * w, y: Math.random() * h, r: season === "vinter" ? 1 + Math.random() * 2.6 : season === "sommar" ? 1 + Math.random() * 2.2 : 5 + Math.random() * 5,
    vy: season === "sommar" ? -(0.15 + Math.random() * 0.35) : season === "vinter" ? 0.35 + Math.random() * 0.8 : 0.4 + Math.random() * 0.6,
    ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 0.04, c: cols[Math.floor(Math.random() * cols.length)], a: .45 + Math.random() * .55,
  }));
  FX.season = season;
}
function leaf(ctx, r) {
  ctx.beginPath(); ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r * .9, -r * .6, r * .9, r * .5, 0, r); ctx.bezierCurveTo(-r * .9, r * .5, -r * .9, -r * .6, 0, -r);
  ctx.fill(); ctx.strokeStyle = "rgba(90,30,0,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -r * .8); ctx.lineTo(0, r * 1.25); ctx.stroke();
}
function fxFrame() {
  FX.raf = 0;
  const cv = document.getElementById("season-fx"), season = seasonNow();
  if (!cv || !season) return;
  const box = cv.parentElement.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  const w = Math.round(box.width), h = Math.round(box.height);
  if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
  if (FX.season !== season || !FX.parts.length) fxInit(season, w, h);
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  FX.t += 1;
  if (season === "sommar") {
    const g = ctx.createRadialGradient(w - 70, 30, 10, w - 70, 30, 220);
    g.addColorStop(0, "rgba(255,240,180,.55)"); g.addColorStop(1, "rgba(255,240,180,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  for (const p of FX.parts) {
    if (!reduce.matches) {
      p.y += p.vy; p.ph += 0.02; p.rot += p.vr;
      p.x += Math.sin(p.ph) * (season === "vinter" ? 0.35 : season === "sommar" ? 0.2 : 0.8);
      if (p.y > h + 12) { p.y = -12; p.x = Math.random() * w; }
      if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
    }
    ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = season === "sommar" ? p.a * (0.5 + 0.5 * Math.sin(p.ph * 3)) : p.a; ctx.fillStyle = p.c;
    if (season === "haust") { ctx.rotate(p.rot); leaf(ctx, p.r); }
    else if (season === "var") { ctx.rotate(p.rot); ctx.beginPath(); ctx.ellipse(0, 0, p.r * .55, p.r, 0, 0, 6.29); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.29); ctx.fill(); if (season === "sommar" && p.r > 2) { ctx.globalAlpha *= .5; ctx.fillRect(-p.r * 2.5, -.5, p.r * 5, 1); ctx.fillRect(-.5, -p.r * 2.5, 1, p.r * 5); } }
    ctx.restore();
  }
  if (season === "vinter") { // snø som ligg i botn av helten
    ctx.globalAlpha = .9; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h - 7 - Math.sin(x / 47) * 4 - Math.sin(x / 13) * 1.5);
    ctx.lineTo(w, h); ctx.fill(); ctx.globalAlpha = 1;
  }
  if (!reduce.matches) FX.raf = requestAnimationFrame(fxFrame);
}
function fxStart() { if (FX.raf) cancelAnimationFrame(FX.raf); FX.raf = requestAnimationFrame(fxFrame); }

function render() {
  TODAY = todayISO();
  window.PF_I18N?.setLang(S.lang);
  applySeason();
  setCustom(S.cats);
  ALL = buildOcc(S.since, addMonths(TODAY, 13));
  BAL = balances();
  const v = { oversikt: viewOversikt, budsjett: viewBudsjett, kalender: viewKalender, postar: viewPostar, kontoar: viewKontoar }[UI.view] || viewOversikt;
  $("#app").innerHTML = topbar() + v();
  setSave(saveState);
  const q0 = S.quick[0]; const fq = $("#fab-quick");
  if (fq) { fq.hidden = !q0 || !S.accounts.length; if (q0) { fq.querySelector("span.l").textContent = q0.label; fq.setAttribute("aria-label", `${q0.label}: legg inn ein sum`); } }
  if (UI.view === "oversikt" && S.accounts.length) { drawChart(); fxStart(); }
}

/* ================= Prognosegraf */
function drawChart() {
  const host = $("#chart"); if (!host) return;
  const pts = forecast(UI.months);
  const W = Math.max(260, host.clientWidth), H = 190, L = 4, R = 4, T = 14, B = 22;
  let min = Math.min(...pts.map(p => p.v)), max = Math.max(...pts.map(p => p.v));
  if (min === max) { min -= 1000; max += 1000; }
  const padv = (max - min) * .12; min -= padv; max += padv;
  const x = i => L + (W - L - R) * i / Math.max(1, pts.length - 1);
  const y = v => T + (H - T - B) * (1 - (v - min) / (max - min));
  let d = `M${x(0)},${y(pts[0].v)}`;
  for (let i = 1; i < pts.length; i++) d += `H${x(i).toFixed(1)}V${y(pts[i].v).toFixed(1)}`;
  const area = d + `V${H - B}H${x(0)}Z`;
  let li = 0; pts.forEach((p, i) => { if (p.v < pts[li].v) li = i; });
  const ticks = []; for (let i = 0; i < pts.length; i++) if (P(pts[i].d).d === 1) ticks.push(i);
  const step = Math.ceil(ticks.length / Math.max(1, Math.floor(W / 70)));
  const zero = min < 0 && max > 0 ? `<line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="#fff" stroke-opacity=".55" stroke-dasharray="4 4"/><text x="${W - R}" y="${y(0) - 5}" text-anchor="end">0 kr</text>` : "";
  const lowX = x(li), lowY = y(pts[li].v);
  host.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Prognose for saldo dei neste ${UI.months} månadene">
    ${[.25, .5, .75].map(f => `<line x1="${L}" x2="${W - R}" y1="${T + (H - T - B) * f}" y2="${T + (H - T - B) * f}" stroke="#fff" stroke-opacity=".1"/>`).join("")}
    ${zero}
    <path d="${area}" fill="#fff" fill-opacity=".14"/>
    <path d="${d}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
    ${ticks.filter((_, i) => i % step === 0).map(i => `<text x="${x(i)}" y="${H - 5}" text-anchor="middle">${MON_S[P(pts[i].d).m - 1]}</text>`).join("")}
    <circle cx="${lowX}" cy="${lowY}" r="5" fill="#fff"/><circle cx="${lowX}" cy="${lowY}" r="9" fill="none" stroke="#fff" stroke-opacity=".5"/>
    <text x="${Math.min(Math.max(lowX, 60), W - 60)}" y="${lowY + 24 > H - B - 2 ? lowY - 14 : lowY + 24}" text-anchor="middle" style="font-weight:700;opacity:1">Lågast ${kr(pts[li].v)}</text>
    <circle cx="${x(pts.length - 1)}" cy="${y(pts[pts.length - 1].v)}" r="4" fill="#fff"/>
    <g id="tip" style="display:none"><line class="tip-line" y1="${T}" y2="${H - B}"/><circle r="4.5" fill="#fff"/><rect rx="8" height="24" fill="#fff"/><text style="fill:var(--accent);opacity:1;font-weight:700" dy="16"></text></g>
  </svg>`;
  const svg = host.querySelector("svg"), tip = svg.querySelector("#tip");
  const move = ev => {
    const r = svg.getBoundingClientRect(); const px = (ev.clientX - r.left) * (W / r.width);
    const i = Math.max(0, Math.min(pts.length - 1, Math.round((px - L) / (W - L - R) * (pts.length - 1))));
    const cx = x(i), cy = y(pts[i].v), label = `${fmtDate(pts[i].d)}: ${kr(pts[i].v)}`;
    tip.style.display = ""; const ln = tip.querySelector("line"); ln.setAttribute("x1", cx); ln.setAttribute("x2", cx);
    const c = tip.querySelector("circle"); c.setAttribute("cx", cx); c.setAttribute("cy", cy);
    const t = tip.querySelector("text"); t.textContent = label; const tw = label.length * 6.6 + 16;
    const bx = Math.min(Math.max(cx - tw / 2, 0), W - tw); const rc = tip.querySelector("rect");
    rc.setAttribute("x", bx); rc.setAttribute("y", 0); rc.setAttribute("width", tw); t.setAttribute("x", bx + 8); t.setAttribute("y", 0);
  };
  svg.addEventListener("pointermove", move); svg.addEventListener("pointerdown", move);
  svg.addEventListener("pointerleave", () => tip.style.display = "none");
}
let rzT; window.addEventListener("resize", () => { clearTimeout(rzT); rzT = setTimeout(() => S && UI.view === "oversikt" && S.accounts.length && drawChart(), 150); });

/* ================= Ark (modalar) */
let sheetKind = null, sheetReturnFocus = null;
function openSheet(html, kind) {
  sheetReturnFocus = document.activeElement;
  sheetKind = kind;
  $("#sheet").innerHTML = `<div class="overlay" data-a="overlay"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  setTimeout(() => { const f = $("#sheet [autofocus]") || $("#sheet input, #sheet button"); f && f.focus(); }, 30);
}
function closeSheet() { $("#sheet").innerHTML = ""; sheetKind = null; D = null; sheetReturnFocus?.focus?.(); }
const head = t => `<div class="sheet-head"><h2>${t}</h2><button class="iconbtn" data-a="close" aria-label="Lukk">✕</button></div>`;
const accOptions = (sel, exclude) => S.accounts.filter(a => a.id !== exclude).map(a => `<option value="${a.id}" ${a.id === sel ? "selected" : ""}>${esc(a.name)} (${ACC_TYPES[a.type]?.name || ""})</option>`).join("");

/* ---- Ny / endre post */
let D = null;
function openEntry(id, preset = {}) {
  if (!S.accounts.length) { openAccount(null); toast("Legg til ein konto først, så kan du leggje inn postar."); return; }
  const e = id ? S.entries.find(x => x.id === id) : null;
  D = e ? { ...e, catTouched: true } : { id: null, kind: "out", name: "", amount: "", cat: "anna", acc: S.accounts[0].id, to: (S.accounts[1] || S.accounts[0]).id, date: TODAY, freq: "m1", until: "", mode: "auto", catTouched: false, ...preset };
  if (preset.kind === "in" && !e) D.cat = "inn_anna";
  if (preset.kind === "move" && !e) D.cat = "sparing";
  D.endMode = D.until ? "date" : "never"; D.count = D.count || 12;
  showEntry();
}
function showEntry() {
  const e = D.id ? S.entries.find(x => x.id === D.id) : null;
  setCustom(S.cats);
  if (S.demo) D.name = Ln(D.name);
  openSheet(`${head(e ? "Endre post" : "Ny post")}
  <div class="sheet-body">
    <div class="seg" id="e-kind" role="group" aria-label="Type"></div>
    <div class="field"><label for="e-amount">Beløp</label><div class="amount-in"><input id="e-amount" inputmode="decimal" autocomplete="off" placeholder="0" value="${D.amount === "" ? "" : esc(D.amount)}" ${e ? "" : "autofocus"}><span>kr</span></div></div>
    <div class="field"><label for="e-name">Kva er det?</label><div class="ac-wrap"><input class="input" id="e-name" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="e-ac" aria-expanded="false" placeholder="T.d. Boliglån, Løn eller Kommunale avgifter" value="${esc(D.name)}"><div class="ac" id="e-ac" role="listbox" aria-label="Tidlegare brukt" hidden></div></div><div class="hint" id="e-filled" aria-live="polite"></div><div class="suggest" id="e-sugg"></div></div>
    <div class="field"><div class="lab-row" id="e-catlab"></div><div class="picker live" id="e-picker" role="radiogroup" aria-label="Kategori"></div></div>
    <div id="e-accs" class="two"></div>
    <div class="field"><span class="lab">Kor ofte?</span><div class="chips" id="e-freq" role="group" aria-label="Kor ofte"></div></div>
    <div class="field"><label for="e-date" id="e-date-l"></label><input type="date" class="input" id="e-date" value="${D.date}" style="max-width:280px"></div>
    <div class="field" id="e-until-w"></div>
    <div class="field"><span class="lab">Når datoen kjem</span><div class="modes" id="e-modes"></div></div>
    <div class="preview" id="e-prev" aria-live="polite"></div>
    <div class="err" id="e-err" role="alert"></div>
  </div>
  <div class="sheet-foot">${e ? `<button class="btn ghost danger grow" data-a="e-del">Slett posten</button>` : `<span class="grow"></span>`}<button class="btn" data-a="close">Avbryt</button><button class="btn primary" data-a="e-save">Lagre</button></div>`, "entry");
  eKind(); ePicker(); eSugg(); eAccs(); eFreq(); eModes(); ePrev();
}
function eKind() { $("#e-kind").innerHTML = Object.entries(KIND).map(([k, n]) => `<button data-a="e-kind" data-v="${k}" aria-pressed="${D.kind === k}">${n}</button>`).join(""); }
function ePicker() {
  const list = CATS.filter(c => c.kind === D.kind).sort((a, b) => (b.custom ? 1 : 0) - (a.custom ? 1 : 0));
  $("#e-picker").innerHTML = list.map((c, i) => `<button class="pick" style="--cat:${c.color};animation-delay:${i * 18}ms" role="radio" aria-checked="${D.cat === c.id}" data-a="e-cat" data-v="${c.id}">${c.custom ? `<span class="mine">Eigen</span>` : ""}${icon(c)}<span>${esc(c.name)}</span></button>`).join("")
    + `<button class="pick add" data-a="cat-new" style="animation-delay:${list.length * 18}ms"><span class="plus">+</span><span>Ny kategori</span></button>`;
  eCatLab();
}
function eCatLab() {
  const c = CAT_BY_ID[D.cat];
  $("#e-catlab").innerHTML = `<span class="lab" style="font-size:.8rem;font-weight:600;color:var(--muted)">Kategori</span>${c?.custom ? `<button class="btn ghost sm" data-a="cat-edit" data-id="${c.id}">Endre «${esc(c.name)}»</button>` : ""}`;
}
function eSyncPick() { document.querySelectorAll("#e-picker .pick").forEach(b => b.dataset.v && b.setAttribute("aria-checked", b.dataset.v === D.cat)); eCatLab(); }
function eStash() {
  if (!D || sheetKind !== "entry") return;
  D.amount = $("#e-amount").value; D.name = $("#e-name").value; D.date = $("#e-date").value; eReadEnd();
  D.acc = $("#e-acc")?.value || D.acc; if ($("#e-to")) D.to = $("#e-to").value;
}

/* ---- Forslag frå det du har skrive før */
const AC = { list: [], idx: -1 };
function nameHistory() {
  const map = new Map();
  const add = o => { if (!o.name) return; const k = (o.kind + "|" + o.name).toLowerCase(); if (!map.has(k)) map.set(k, o); };
  for (const r of S.recent || []) add(r);
  for (const e of S.entries) if (e.id !== D.id) add({ ...e, t: 0 });
  return [...map.values()];
}
function acUpdate() {
  const box = $("#e-ac"), inp = $("#e-name"); if (!box || !D) return;
  const q = (inp.value || "").trim().toLowerCase();
  let list = nameHistory().map(o => {
    const n = o.name.toLowerCase();
    let sc = !q ? 1 : n.startsWith(q) ? 3 : n.split(/[\s\-/]+/).some(w => w.startsWith(q)) ? 2 : n.includes(q) ? 1 : 0;
    if (sc && o.kind === D.kind) sc += .5;
    if (q && n === q) sc = 0;
    return { o, sc };
  }).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc || (b.o.t || 0) - (a.o.t || 0) || a.o.name.localeCompare(b.o.name, "nn")).slice(0, 6).map(x => x.o);
  AC.list = list; AC.idx = -1;
  if (!list.length) { acClose(); return; }
  const hl = name => { const e = esc(name); if (!q) return e; const i = name.toLowerCase().indexOf(q); return i < 0 ? e : esc(name.slice(0, i)) + "<b>" + esc(name.slice(i, i + q.length)) + "</b>" + esc(name.slice(i + q.length)); };
  box.innerHTML = `<div class="ac-h">${q ? "Du har skrive før" : "Tidlegare brukt"}</div>` + list.map((o, i) => `<button type="button" class="ac-item" role="option" id="ac-${i}" aria-selected="false" data-a="ac-pick" data-i="${i}" tabindex="-1">
      ${icon(CAT_BY_ID[o.cat] ? o.cat : "anna", "sm")}<span class="ac-n">${hl(o.name)}<small>${KIND[o.kind]}${CAT_BY_ID[o.cat] ? " · " + esc(CAT_BY_ID[o.cat].name) : ""}</small></span><span class="ac-a num">${kr(o.amount)}</span></button>`).join("");
  box.hidden = false; inp.setAttribute("aria-expanded", "true");
}
function acClose() { const box = $("#e-ac"); if (box) { box.hidden = true; box.innerHTML = ""; } $("#e-name")?.setAttribute("aria-expanded", "false"); $("#e-name")?.removeAttribute("aria-activedescendant"); AC.list = []; AC.idx = -1; }
function acMove(d) {
  if (!AC.list.length) return;
  AC.idx = (AC.idx + d + AC.list.length) % AC.list.length;
  document.querySelectorAll("#e-ac .ac-item").forEach((b, i) => b.setAttribute("aria-selected", i === AC.idx));
  $("#e-name").setAttribute("aria-activedescendant", "ac-" + AC.idx);
  $("#ac-" + AC.idx)?.scrollIntoView({ block: "nearest" });
}
function acPick(i) {
  const o = AC.list[i]; if (!o) return;
  eStash();
  D.name = o.name; D.kind = o.kind;
  if (CAT_BY_ID[o.cat] && CAT_BY_ID[o.cat].kind === o.kind) { D.cat = o.cat; D.catTouched = true; }
  const filled = [];
  if (!(parseAmt(D.amount) > 0) && o.amount > 0) { D.amount = String(o.amount); $("#e-amount").value = D.amount; filled.push("beløp"); }
  if (o.acc && accById(o.acc)) { D.acc = o.acc; filled.push("konto"); }
  if (o.kind === "move" && o.to && accById(o.to)) D.to = o.to;
  D.name = Ln(D.name); $("#e-name").value = D.name;
  acClose();
  eKind(); ePicker(); eSugg(); eAccs(); eModes(); ePrev();
  const hint = $("#e-filled"); if (hint) { const all = ["kategori", ...filled]; const txt = all.length > 1 ? all.slice(0, -1).join(", ") + " og " + all[all.length - 1] : all[0]; hint.textContent = `Henta ${txt} frå sist du brukte «${o.name}».`; }
}

/* ---- Smått: snarvegar for småkjøp */
let QS = null, QE = null;
const qName = q => q.name || (q.label && q.label.toLowerCase() !== "smått" ? q.label : CAT_BY_ID[q.cat]?.name || "Anna");
const qAcc = q => (accById(q.acc) ? q.acc : S.accounts[0]?.id);
function openQuick(id) {
  if (!S.accounts.length) { openAccount(null); toast("Legg til ein konto først."); return; }
  if (!S.quick.length) S.quick = defaultQuick();
  const q = S.quick.find(x => x.id === id) || S.quick[0];
  QS = { id: q.id, date: TODAY, cat: null, open: false };
  openSheet(`<div class="sheet-head"><h2 id="q-title">${esc(q.label)}</h2><button class="iconbtn" data-a="close" aria-label="Lukk">✕</button></div>
  <div class="sheet-body">
    ${S.quick.length > 1 ? `<div class="chips" id="q-chips" role="group" aria-label="Snarveg"></div>` : ""}
    <div class="quick-hero live" id="q-hero"></div>
    <div class="picker live qcats" id="q-cats" role="radiogroup" aria-label="Kategori for dette kjøpet" hidden></div>
    <div class="field"><label for="q-amt">Sum</label><div class="amount-in big"><input id="q-amt" inputmode="decimal" autocomplete="off" placeholder="0" autofocus><span>kr</span></div></div>
    <div class="field" style="max-width:240px"><label for="q-date">Dato</label><input type="date" class="input" id="q-date" value="${QS.date}" max="${TODAY}"></div>
    <div class="err" id="q-err" role="alert"></div>
  </div>
  <div class="sheet-foot"><button class="btn ghost grow" data-a="quick-cfg">Tilpass knappar</button><button class="btn" data-a="close">Avbryt</button><button class="btn primary" data-a="q-save">Lagre</button></div>`, "quick");
  qRender();
}
// Kategori og namn for dette kjøpet: knappen sitt oppsett, eller kategorien du bytte til no.
function qCur(q) {
  const base = CAT_BY_ID[q.cat] ? q.cat : "anna";
  const cat = QS.cat && CAT_BY_ID[QS.cat] ? QS.cat : base;
  return { cat, name: cat === base ? qName(q) : CAT_BY_ID[cat].name, changed: cat !== base };
}
function qRender() {
  const q = S.quick.find(x => x.id === QS.id); if (!q) return;
  const cur = qCur(q);
  $("#q-title").textContent = q.label;
  if ($("#q-chips")) $("#q-chips").innerHTML = S.quick.map(x => `<button class="chip" data-a="q-pick" data-v="${x.id}" aria-pressed="${x.id === q.id}">${esc(x.label)}</button>`).join("");
  const bl = q.kind !== "in" ? budgetLeftText(cur.cat) : "";
  $("#q-hero").innerHTML = `${icon(cur.cat, "lg")}<div style="min-width:0"><div class="t">${esc(cur.name)}</div><div class="s">${esc(CAT_BY_ID[cur.cat].name)} · ${esc(accName(qAcc(q)))} · ${q.kind === "in" ? "inntekt" : "utgift"}${cur.changed ? ` · <span style="color:var(--accent);font-weight:600">berre dette kjøpet</span>` : ""}</div>${bl ? `<div class="qbudget">${bl}</div>` : ""}</div>
    <button class="btn sm" data-a="q-cats" aria-expanded="${QS.open}" aria-controls="q-cats">${QS.open ? "Lukk" : "Byt kategori"}</button>`;
  const box = $("#q-cats");
  box.hidden = !QS.open;
  if (QS.open && !box.childElementCount) {
    const list = CATS.filter(c => c.kind === (q.kind || "out")).sort((a, b) => (b.custom ? 1 : 0) - (a.custom ? 1 : 0));
    box.innerHTML = list.map((c, i) => `<button class="pick" style="--cat:${c.color};animation-delay:${i * 12}ms" role="radio" aria-checked="${cur.cat === c.id}" data-a="q-cat" data-v="${c.id}">${icon(c)}<span>${esc(c.name)}</span></button>`).join("");
  } else if (QS.open) box.querySelectorAll(".pick").forEach(b => b.setAttribute("aria-checked", b.dataset.v === cur.cat));
  if (!QS.open) box.innerHTML = "";
}
function qSave(btn) {
  const q = S.quick.find(x => x.id === QS.id);
  const a = parseAmt($("#q-amt").value);
  if (!(a > 0)) { $("#q-err").textContent = "Skriv inn ein sum større enn 0."; $("#q-amt").focus(); return; }
  const date = $("#q-date").value || TODAY;
  const cur = qCur(q);
  const e = { id: uid(), kind: q.kind || "out", name: Ln(cur.name), amount: Math.round(a * 100) / 100, cat: cur.cat, acc: qAcc(q), date, freq: "once", until: "", mode: "auto", note: "", quick: true };
  S.entries.push(e);
  const r = btn?.getBoundingClientRect?.();
  closeSheet(); commit(); coins(r);
  const left = budgetLeftText(e.cat);
  toast(`${kr(e.amount)} lagra som «${e.name}»${left ? ` · ${left}` : ""}`, () => { S.entries = S.entries.filter(x => x.id !== e.id); commit(); });
}
function openQuickCfg() {
  QE = null;
  openSheet(`${head("Tilpass knappar")}
  <div class="sheet-body">
    <p class="hint" style="margin:0">Kvar knapp lagrar kjøpet rett i rett kategori og konto. Du skriv berre summen. Den øvste er standard.</p>
    <div class="list">${S.quick.map((q, i) => `<button class="row" data-a="qe-edit" data-id="${q.id}">${icon(CAT_BY_ID[q.cat] ? q.cat : "anna", "sm")}<div><div class="t">${esc(q.label)}${i === 0 ? ` <span class="pill auto">Standard</span>` : ""}</div><div class="s">Lagrast som «${esc(qName(q))}» · ${esc(accName(qAcc(q)))}</div></div><span class="s" style="color:var(--muted)">Endre →</span></button>`).join("") || `<div class="empty">Ingen knappar enno.</div>`}</div>
    <button class="btn ghost sm" data-a="qe-new" style="justify-self:start">+ Ny knapp</button>
  </div>
  <div class="sheet-foot"><span class="grow"></span><button class="btn primary" data-a="qe-done">Ferdig</button></div>`, "qcfg");
}
function openQuickEdit(id) {
  const q = id ? S.quick.find(x => x.id === id) : null;
  QE = q ? { ...q } : { id: null, label: "", kind: "out", cat: "mat", acc: S.accounts[0]?.id || "", name: "" };
  openSheet(`${head(q ? "Endre knapp" : "Ny knapp")}
  <div class="sheet-body">
    <div class="field"><label for="qe-label">Tekst på knappen</label><input class="input" id="qe-label" maxlength="20" autocomplete="off" placeholder="T.d. Smått, Kaffe, Bensin, Lunsj" value="${esc(QE.label)}" ${q ? "" : "autofocus"}></div>
    <div class="field"><span class="lab">Type</span><div class="seg" id="qe-kind">${[["out", "Utgift"], ["in", "Inntekt"]].map(([k, n]) => `<button data-a="qe-kind" data-v="${k}" aria-pressed="${QE.kind === k}">${n}</button>`).join("")}</div></div>
    <div class="field"><span class="lab">Kategori</span><div class="picker live" id="qe-picker" role="radiogroup" aria-label="Kategori"></div></div>
    <div class="two"><div class="field"><label for="qe-acc">${QE.kind === "in" ? "Til konto" : "Frå konto"}</label><select class="input" id="qe-acc">${accOptions(qAcc(QE))}</select></div>
      <div class="field"><label for="qe-name">Namn på posten (valfritt)</label><input class="input" id="qe-name" autocomplete="off" placeholder="Same som teksten på knappen" value="${esc(QE.name)}"></div></div>
    ${q && S.quick[0]?.id !== q.id ? `<button class="btn ghost sm" data-a="qe-top" style="justify-self:start">Gjer til standard</button>` : ""}
    <div class="err" id="qe-err" role="alert"></div>
  </div>
  <div class="sheet-foot">${q ? `<button class="btn ghost danger grow" data-a="qe-del">Slett knappen</button>` : `<span class="grow"></span>`}<button class="btn" data-a="qe-back">Tilbake</button><button class="btn primary" data-a="qe-save">Lagre</button></div>`, "qedit");
  qePicker();
}
function qePicker() {
  const list = CATS.filter(c => c.kind === QE.kind).sort((a, b) => (b.custom ? 1 : 0) - (a.custom ? 1 : 0));
  if (!list.some(c => c.id === QE.cat)) QE.cat = list[0]?.id || "anna";
  $("#qe-picker").innerHTML = list.map((c, i) => `<button class="pick" style="--cat:${c.color};animation-delay:${i * 15}ms" role="radio" aria-checked="${QE.cat === c.id}" data-a="qe-cat" data-v="${c.id}">${icon(c)}<span>${esc(c.name)}</span></button>`).join("");
}
function openQuickEditKeep() {
  const keep = { ...QE }; const id = keep.id;
  openQuickEdit(id); Object.assign(QE, keep);
  $("#qe-label").value = QE.label; $("#qe-name").value = QE.name;
  document.querySelectorAll("#qe-kind button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === QE.kind));
  $("#qe-acc").innerHTML = accOptions(QE.acc || S.accounts[0]?.id);
  $("#qe-acc").previousElementSibling.textContent = QE.kind === "in" ? "Til konto" : "Frå konto";
  qePicker();
}
function qeSave() {
  QE.label = $("#qe-label").value.trim(); QE.name = $("#qe-name").value.trim(); QE.acc = $("#qe-acc").value;
  if (!QE.label) { $("#qe-err").textContent = "Skriv ein tekst til knappen."; $("#qe-label").focus(); return; }
  const qq = { id: QE.id || "q_" + uid(), label: QE.label, kind: QE.kind, cat: QE.cat, acc: QE.acc, name: QE.name };
  const i = S.quick.findIndex(x => x.id === qq.id);
  if (i >= 0) S.quick[i] = qq; else S.quick.push(qq);
  commitQuiet(); render(); openQuickCfg(); toast(`Knappen «${qq.label}» er lagra`);
}

/* ---- Eigen kategori */
let CE = null;
function openCat(id, opt = {}) {
  eStash();
  const u = id ? S.cats.find(x => x.id === id) : null;
  CE = u ? { ...u, back: opt.back } : { id: null, name: "", kind: opt.kind || "out", color: COLORS[(S.cats.length * 5) % COLORS.length], glyph: "g_smil", back: opt.back, q: "" };
  CE.q = "";
  const used = u ? S.entries.filter(e => e.cat === u.id).length : 0;
  openSheet(`${head(u ? "Endre kategori" : "Ny kategori")}
  <div class="sheet-body" style="--pick:${CE.color}" id="c-body">
    <div class="cat-preview live" id="c-prev"></div>
    <div class="field"><label for="c-name">Kva er kategorien?</label><input class="input" id="c-name" maxlength="40" autocomplete="off" placeholder="T.d. Hytta, Båten, Hobbyverkstaden" value="${esc(CE.name)}" ${u ? "" : "autofocus"}></div>
    <div class="field"><span class="lab">Type</span><div class="seg" id="c-kind" role="group" aria-label="Type"></div></div>
    <div class="field"><span class="lab">Farge</span><div class="swatches" id="c-colors">${COLORS.map(c => `<button class="swatch" style="--sw:${c}" data-a="c-color" data-v="${c}" aria-pressed="${CE.color === c}" aria-label="Farge ${c}"></button>`).join("")}</div></div>
    <div class="field"><label for="c-q">Bilete</label><input class="input" id="c-q" type="search" autocomplete="off" placeholder="Søk, t.d. båt, musikk, hund, ferie"></div>
    <div class="picker lib live" id="c-lib" role="radiogroup" aria-label="Bilete"></div>
    <div class="err" id="c-err" role="alert"></div>
  </div>
  <div class="sheet-foot">${u ? `<button class="btn ghost danger grow" data-a="c-del" data-used="${used}">Slett kategorien</button>` : `<span class="grow"></span>`}<button class="btn" data-a="close">Avbryt</button><button class="btn primary" data-a="c-save">${CE.back ? "Lagre og bruk" : "Lagre"}</button></div>`, "cat");
  cKind(); cLib(); cPrev();
}
function cKind() { $("#c-kind").innerHTML = Object.entries(KIND).map(([k, n]) => `<button data-a="c-kind" data-v="${k}" aria-pressed="${CE.kind === k}">${n}</button>`).join(""); }
function cPrev() {
  $("#c-prev").innerHTML = `${glyphIcon(CE.glyph, "lg")}<div><div class="t">${esc(CE.name.trim() || "Namn på kategorien")}</div><div class="s">${KIND[CE.kind]} · eigen kategori</div></div>`;
}
function cLib() {
  const q = (CE.q || "").toLowerCase().trim();
  const list = q ? LIB.filter(g => (g.label + " " + g.kw).toLowerCase().includes(q)) : LIB;
  $("#c-lib").innerHTML = list.map((g, i) => `<button class="pick" role="radio" aria-checked="${CE.glyph === g.id}" data-a="c-glyph" data-v="${g.id}" style="animation-delay:${Math.min(i, 30) * 12}ms">${glyphIcon(g.id)}<span>${esc(g.label)}</span></button>`).join("")
    || `<div class="lib-empty">Fann ingen bilete for «${esc(q)}». Prøv eit anna ord.</div>`;
}
function cBack() {
  if (CE && CE.back && D) { CE = null; showEntry(); return true; }
  return false;
}
function cSave() {
  CE.name = $("#c-name").value.trim();
  if (!CE.name) { $("#c-err").textContent = "Skriv kva kategorien heiter."; $("#c-name").focus(); return; }
  const clash = CATS.find(c => c.name.toLowerCase() === CE.name.toLowerCase() && c.kind === CE.kind && c.id !== CE.id);
  if (clash) { $("#c-err").textContent = `Det finst alt ein kategori som heiter «${clash.name}».`; return; }
  const u = { id: CE.id || "u_" + uid(), name: CE.name, kind: CE.kind, color: CE.color, glyph: CE.glyph };
  const i = S.cats.findIndex(x => x.id === u.id);
  if (i >= 0) { S.cats[i] = u; } else S.cats.push(u);
  // Bytt type på kategorien: flytt postar som ikkje lenger passar til «Anna».
  for (const e of S.entries) if (e.cat === u.id && e.kind !== u.kind) e.cat = e.kind === "in" ? "inn_anna" : e.kind === "move" ? "overforing" : "anna";
  setCustom(S.cats);
  const back = CE.back;
  if (back && D) { D.kind = u.kind; D.cat = u.id; D.catTouched = true; CE = null; touched = true; commitQuiet(); showEntry(); toast(`Kategorien «${u.name}» er laga`); return; }
  CE = null; closeSheet(); commit(); toast(i >= 0 ? `«${u.name}» er oppdatert` : `Kategorien «${u.name}» er laga`);
}
function commitQuiet() {
  if (!WEB) try { localStorage.setItem(LS, JSON.stringify(S)); } catch (_) { }
  ALL = buildOcc(S.since, addMonths(TODAY, 13));
  if (ref) { setSave("busy"); clearTimeout(saveT); saveT = setTimeout(flush, 700); }
}
function eSugg() {
  const s = suggest(D.name, D.kind).filter(c => c.id !== D.cat);
  $("#e-sugg").innerHTML = s.length ? `<span>Forslag:</span>${s.map(c => `<button style="--cat:${c.color}" data-a="e-cat" data-v="${c.id}">${icon(c, "xs live")}${esc(c.name)}</button>`).join("")}` : "";
}
function eAccs() {
  const lab = D.kind === "in" ? "Til konto" : "Frå konto";
  if (D.kind === "move" && D.to === D.acc) D.to = (S.accounts.find(a => a.id !== D.acc) || {}).id || D.acc;
  $("#e-accs").innerHTML = `<div class="field"><label for="e-acc">${lab}</label><select class="input" id="e-acc">${accOptions(D.acc)}</select></div>` +
    (D.kind === "move" ? `<div class="field"><label for="e-to">Til konto</label><select class="input" id="e-to">${accOptions(D.to, D.acc)}</select></div>` : "");
}
function eFreq() {
  $("#e-freq").innerHTML = Object.entries(FREQ).map(([k, f]) => `<button class="chip" data-a="e-freq" data-v="${k}" aria-pressed="${D.freq === k}">${f.n}</button>`).join("");
  $("#e-date-l").textContent = D.freq === "once" ? "Dato" : "Første dato";
  eEnd();
}
function eModes() {
  const t = D.kind === "in" ? ["Kjem inn automatisk", "Blir rekna som motteke på datoen.", "Eg stadfestar sjølv", "Du stadfestar når pengane faktisk er komne."]
    : D.kind === "move" ? ["Overfør automatisk", "Blir flytta mellom kontoane på datoen.", "Eg godkjenner sjølv", "Du stadfestar når overføringa er gjort."]
    : ["Trekk automatisk", "Blir rekna som betalt på datoen.", "Eg godkjenner sjølv", "Du stadfestar når du faktisk har betalt."];
  $("#e-modes").innerHTML = `<button class="mode" data-a="e-mode" data-v="auto" aria-pressed="${D.mode === "auto"}"><b>⚡ ${t[0]}</b><span>${t[1]}</span></button>
    <button class="mode" data-a="e-mode" data-v="manual" aria-pressed="${D.mode === "manual"}"><b>✓ ${t[2]}</b><span>${t[3]}</span></button>`;
}
function eReadEnd() {
  if ($("#e-until")) D.until = $("#e-until").value;
  if ($("#e-count")) D.count = $("#e-count").value;
}
function eEnd() {
  const w = $("#e-until-w");
  if (D.freq === "once") { w.hidden = true; return; }
  w.hidden = false;
  const opts = [["never", "Ingen sluttdato"], ["date", "Sluttar på ein dato"], ["count", "Etter tal gonger"]];
  const body = D.endMode === "date"
    ? `<label class="sr" for="e-until">Sluttdato</label><input type="date" class="input" id="e-until" value="${D.until || ""}" min="${D.date}" style="max-width:280px">`
    : D.endMode === "count"
    ? `<div style="display:flex;gap:10px;align-items:center"><label class="sr" for="e-count">Tal gonger</label><input class="input num" id="e-count" inputmode="numeric" value="${esc(D.count)}" style="max-width:110px"><span>gonger</span></div>`
    : `<div class="hint">Held fram heilt til du endrar eller slettar posten.</div>`;
  w.innerHTML = `<span class="lab">Når sluttar det?</span><div class="chips" role="group" aria-label="Når sluttar det">${opts.map(([k, n]) => `<button class="chip" data-a="e-end" data-v="${k}" aria-pressed="${D.endMode === k}">${n}</button>`).join("")}</div>${body}`;
}
// Sluttdato ut frå valet: ingen, ein dato eller etter N gonger.
function effUntil() {
  if (D.freq === "once" || D.endMode === "never") return "";
  if (D.endMode === "date") return D.until || "";
  const n = Math.floor(Number(D.count));
  if (!(n >= 1)) return "";
  const ds = occDates({ ...D, until: "" }, D.date, addMonths(D.date, 12 * 60));
  return ds[Math.min(n, ds.length) - 1] || "";
}
function ePrev() {
  const a = parseAmt(D.amount);
  if (!D.date) { $("#e-prev").textContent = ""; return; }
  if (D.freq === "once") { $("#e-prev").innerHTML = `Éin gong: <b>${fmtDate(D.date, true)}</b>${a > 0 ? ` · <b>${kr(a)}</b>` : ""}`; return; }
  const until = effUntil();
  const ds = occDates({ ...D, until }, D.date > TODAY ? D.date : TODAY, addMonths(TODAY, 30)).slice(0, 4);
  const per = a > 0 ? ` · tilsvarar <b>${kr(a * FREQ[D.freq].per)}</b> i månaden` : "";
  const endTxt = D.endMode === "never" ? " · <b>ingen sluttdato</b>" : until ? ` · siste gong <b>${fmtDate(until, true)}</b>` : "";
  $("#e-prev").innerHTML = ds.length ? `Neste datoar: <b>${ds.map(d => fmtDate(d)).join(", ")}</b>${per}${endTxt}` : `Ingen fleire datoar før sluttdatoen.`;
}
function eSave() {
  D.amount = $("#e-amount").value; D.name = $("#e-name").value.trim(); D.date = $("#e-date").value; eReadEnd();
  D.acc = $("#e-acc").value; if (D.kind === "move") D.to = $("#e-to").value;
  const a = parseAmt(D.amount), err = $("#e-err");
  if (!(a > 0)) { err.textContent = "Skriv inn eit beløp større enn 0."; $("#e-amount").focus(); return; }
  if (!D.date) { err.textContent = "Vel ein dato."; return; }
  if (D.kind === "move" && D.to === D.acc) { err.textContent = "Vel to ulike kontoar for overføringa."; return; }
  if (D.freq !== "once" && D.endMode === "date" && !D.until) { err.textContent = "Vel ein sluttdato, eller vel «Ingen sluttdato»."; return; }
  if (D.freq !== "once" && D.endMode === "date" && D.until < D.date) { err.textContent = "Sluttdatoen må vere etter første dato."; return; }
  if (D.freq !== "once" && D.endMode === "count" && !(Math.floor(Number(D.count)) >= 1)) { err.textContent = "Skriv kor mange gonger, minst 1."; return; }
  const cat = CAT_BY_ID[D.cat]?.kind === D.kind ? D.cat : (D.kind === "in" ? "inn_anna" : D.kind === "move" ? "overforing" : "anna");
  const e = { id: D.id || uid(), kind: D.kind, name: D.name || Ln(CAT_BY_ID[cat].name), amount: Math.round(a * 100) / 100, cat, acc: D.acc, date: D.date, freq: D.freq, until: effUntil(), mode: D.mode, note: D.note || "" };
  if (D.kind === "move") e.to = D.to;
  const rk = (e.kind + "|" + e.name).toLowerCase();
  S.recent = [{ name: e.name, kind: e.kind, cat: e.cat, amount: e.amount, acc: e.acc, to: e.to, t: Date.now() },
    ...(S.recent || []).filter(r => (r.kind + "|" + r.name).toLowerCase() !== rk)].slice(0, 120);
  const i = S.entries.findIndex(x => x.id === e.id);
  if (i >= 0) S.entries[i] = e; else S.entries.push(e);
  const isNew = i < 0;
  closeSheet(); commit();
  toast(isNew ? `«${e.name}» er lagt til` : `«${e.name}» er oppdatert`);
}

/* ---- Éin førekomst (godkjenn, hopp over, endre denne gongen) */
let O = null;
function openOcc(k, opt = {}) {
  const [id, date] = k.split("|");
  const e = S.entries.find(x => x.id === id); if (!e) return;
  O = buildOcc(date, date).find(o => o.key === k) || { e, date, key: k, status: "planned", amt: e.amount, acc: e.acc, c: S.conf[k] };
  const o = O, inn = e.kind === "in";
  const verb = inn ? "Merk som motteke" : e.kind === "move" ? "Merk som overført" : "Merk som betalt";
  const info = {
    pending: `Forfall ${fmtDate(o.date, true)}. ${inn ? "Har pengane kome inn?" : "Har du betalt?"} Juster dato og beløp om det ikkje stemde heilt.`,
    planned: o.e.mode === "auto" ? `Blir ${inn ? "rekna som motteke" : e.kind === "move" ? "overført" : "trekt"} automatisk ${fmtDate(o.date, true)}.` : `Forfall ${fmtDate(o.date, true)}. Du godkjenner sjølv når det er betalt.`,
    auto: `${inn ? "Kom inn" : e.kind === "move" ? "Overført" : "Trekt"} automatisk ${fmtDate(o.date, true)}.`,
    paid: `Stadfesta ${fmtDate(o.eff, true)}.`,
    skipped: `Hoppa over denne gongen.`,
  }[o.status];
  const accField = e.kind === "move" ? "" : `<div class="field"><label for="o-acc">${inn ? "Til konto" : "Frå konto"}</label><select class="input" id="o-acc">${accOptions(o.acc)}</select></div>`;
  const canPay = o.status === "pending" || (o.status === "planned" && e.mode === "manual");
  openSheet(`${head(fmtDate(o.date, true))}
  <div class="sheet-body">
    <div class="occ-hero live">${icon(e.cat, "lg")}<div><div class="t">${esc(e.name)}</div><div class="s">${FREQ[e.freq].n} · ${accLine(o)}</div><div style="margin-top:6px">${statusPill(o)}</div></div></div>
    <div class="preview">${info}</div>
    <div class="field"><label for="o-amt">${canPay || o.status === "paid" ? (inn ? "Kor mykje kom inn?" : e.kind === "move" ? "Kor mykje vart overført?" : "Kor mykje betalte du?") : "Beløp denne gongen"}</label>
      <div class="amount-in"><input id="o-amt" inputmode="decimal" autocomplete="off" value="${o.amt}" ${opt.focusAmt ? "autofocus" : ""}><span>kr</span></div>
      <div class="diff" id="o-diff" aria-live="polite"></div>
      <div class="hint">${inn ? "Fekk du overtid, bonus eller trekk? Skriv inn summen som faktisk kom inn." : e.kind === "move" ? "Overførte du meir eller mindre enn planlagt? Skriv inn det faktiske beløpet." : "Var rekninga høgare eller lågare enn vanleg? Skriv inn det du faktisk betalte."} Det endrar berre denne gongen.</div></div>
    <div class="two"><div class="field"><label for="o-date">${o.status === "paid" || canPay ? "Faktisk dato" : "Dato"}</label><input type="date" class="input" id="o-date" value="${o.status === "paid" ? o.eff : o.date > TODAY && canPay ? TODAY : o.date}" ${o.status === "paid" || canPay ? "" : "disabled"}></div>
    ${accField}</div>
    <div class="err" id="o-err" role="alert"></div>
    <button class="btn ghost sm" data-a="edit-entry" data-id="${e.id}" style="justify-self:start">Endre heile posten (alle datoar) →</button>
  </div>
  <div class="sheet-foot">
    ${o.c ? `<button class="btn ghost grow" data-a="o-reset">Angre</button>` : `<span class="grow"></span>`}
    ${o.status !== "skipped" && !o.done ? `<button class="btn" data-a="o-skip">Hopp over</button>` : ""}
    ${canPay ? `<button class="btn good" data-a="o-pay">${verb}</button>` : `<button class="btn primary" data-a="o-save">Lagre</button>`}
  </div>`, "occ");
  oDiff();
  if (opt.focusAmt) setTimeout(() => $("#o-amt")?.select(), 60);
}
function oDiff() {
  const el = $("#o-diff"); if (!el || !O) return;
  const v = parseAmt($("#o-amt").value), base = O.e.amount;
  if (!(v > 0)) { el.textContent = ""; el.className = "diff"; return; }
  const d = v - base;
  const goodWhenMore = O.e.kind === "in";
  if (Math.abs(d) < 0.5) { el.className = "diff"; el.textContent = `Same som planlagt (${kr(base)})`; return; }
  el.className = "diff " + ((d > 0) === goodWhenMore ? "good" : "bad");
  el.textContent = `${d > 0 ? "+" : "−"}${kr(Math.abs(d))} ${d > 0 ? "meir" : "mindre"} enn planlagt (${kr(base)})`;
}
function oRead() {
  const a = parseAmt($("#o-amt").value);
  if (!(a > 0)) { $("#o-err").textContent = "Skriv inn eit beløp større enn 0."; return null; }
  const c = { a: a === O.e.amount ? undefined : a };
  const acc = $("#o-acc")?.value; if (acc && acc !== O.e.acc) c.acc = acc;
  return c;
}
function oPay(fxFrom) {
  const c = oRead(); if (!c) return;
  const d = $("#o-date").value || TODAY;
  S.conf[O.key] = clean({ s: "paid", d, ...c });
  const name = O.e.name, k = O.key, r = fxFrom.getBoundingClientRect(), diff = c.a != null ? c.a - O.e.amount : 0;
  closeSheet(); commit(); coins(r);
  toast(diff ? `«${name}» er stadfesta med ${kr(c.a)} (${kr(diff, true)})` : `«${name}» er stadfesta`, () => { delete S.conf[k]; commit(); });
}
function oSave() {
  const c = oRead(); if (!c) return;
  const prev = S.conf[O.key];
  if (O.status === "paid") S.conf[O.key] = clean({ s: "paid", d: $("#o-date").value || prev.d, a: c.a, acc: c.acc });
  else { const n = clean({ s: "plan", ...c }); if (n.a == null && n.acc == null) delete S.conf[O.key]; else S.conf[O.key] = n; }
  closeSheet(); commit(); toast("Endringa er lagra");
}
function clean(o) { for (const k in o) if (o[k] === undefined) delete o[k]; return o; }

function quickPay(k, el) {
  const [id, date] = k.split("|"); const e = S.entries.find(x => x.id === id); if (!e) return;
  S.conf[k] = { s: "paid", d: date <= TODAY ? date : TODAY };
  const r = el.getBoundingClientRect(); commit(); coins(r); toast(`«${e.name}» er stadfesta`, () => { delete S.conf[k]; commit(); });
}

/* ---- Konto */
let AD = null;
function openAccount(id) {
  const a = id ? accById(id) : null;
  AD = a ? { ...a } : { id: null, name: "", type: "bank", color: ACC_COLORS[S.accounts.length % ACC_COLORS.length] };
  const bal = a ? (BAL[a.id] || 0) : 0;
  const used = a ? S.entries.filter(e => e.acc === a.id || e.to === a.id).length : 0;
  const hist = a ? ALL.filter(o => o.done && (o.acc === a.id || o.e.to === a.id) && o.eff <= TODAY).slice(-5).reverse() : [];
  openSheet(`${head(a ? esc(a.name) : "Ny konto")}
  <div class="sheet-body">
    <div class="field"><label for="a-name">Namn</label><input class="input" id="a-name" value="${esc(AD.name)}" placeholder="T.d. Brukskonto, Lommebok, Visa" ${a ? "" : "autofocus"}></div>
    <div class="field"><span class="lab">Type</span><div class="seg" id="a-type">${Object.entries(ACC_TYPES).map(([k, t]) => `<button data-a="a-type" data-v="${k}" aria-pressed="${AD.type === k}">${t.name}</button>`).join("")}</div></div>
    <div class="field"><label for="a-bal">Saldo i dag</label><div class="amount-in"><input id="a-bal" inputmode="decimal" value="${a ? Math.round(bal * 100) / 100 : ""}" placeholder="0"><span>kr</span></div>
      <span style="font-size:.8rem;color:var(--muted)">For kredittkort skriv du gjelda som minus, t.d. −4 000.</span></div>
    <div class="field"><span class="lab">Farge</span><div class="swatches">${ACC_COLORS.map(c => `<button class="swatch" style="--sw:${c}" data-a="a-color" data-v="${c}" aria-pressed="${AD.color === c}" aria-label="Farge"></button>`).join("")}</div></div>
    ${hist.length ? `<div class="field"><span class="lab">Siste rørsler</span><div class="list">${hist.map(o => occRow(o)).join("")}</div></div>` : ""}
    <div class="err" id="a-err" role="alert"></div>
  </div>
  <div class="sheet-foot">${a ? `<button class="btn ghost danger grow" data-a="a-del" data-used="${used}">Slett kontoen</button>` : `<span class="grow"></span>`}<button class="btn" data-a="close">Avbryt</button><button class="btn primary" data-a="a-save">Lagre</button></div>`, "acc");
}
function aSave() {
  const name = $("#a-name").value.trim(); const v = $("#a-bal").value.trim() === "" ? 0 : parseAmt($("#a-bal").value.replace("−", "-"));
  if (!name) { $("#a-err").textContent = "Gi kontoen eit namn."; $("#a-name").focus(); return; }
  if (!isFinite(v)) { $("#a-err").textContent = "Saldoen må vere eit tal."; return; }
  if (AD.id) {
    const a = accById(AD.id); const delta = v - (BAL[a.id] || 0);
    Object.assign(a, { name, type: AD.type, color: AD.color, start: Math.round((a.start + delta) * 100) / 100 });
  } else {
    S.accounts.push({ id: uid(), name, type: AD.type, color: AD.color, start: v, open: TODAY });
    if (S.since > TODAY) S.since = monthStart(TODAY);
  }
  closeSheet(); commit(); toast(`Kontoen «${name}» er lagra`);
}

/* ================= Toast og myntregn */
let toastT;
function toast(msg, undo) {
  clearTimeout(toastT);
  $("#toast").innerHTML = `<div class="toast" role="status">${esc(msg)}${undo ? `<button data-a="undo">Angre</button>` : ""}</div>`;
  toast.undo = undo;
  toastT = setTimeout(() => { $("#toast").innerHTML = ""; toast.undo = null; }, 4200);
}
function coins(r) {
  if (!r || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 14; i++) {
    const c = document.createElement("div"); c.className = "coin-fx"; c.style.left = cx - 9 + "px"; c.style.top = cy - 9 + "px"; document.body.appendChild(c);
    const ang = -Math.PI / 2 + (Math.random() - .5) * 1.8, sp = 90 + Math.random() * 110;
    const dx = Math.cos(ang) * sp, dy = Math.sin(ang) * sp;
    c.animate([{ transform: "translate(0,0) scale(.6)", opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1, offset: .45 }, { transform: `translate(${dx * 1.3}px,${dy + 160}px) scale(.8) rotateY(360deg)`, opacity: 0 }],
      { duration: 900 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => c.remove();
  }
}

/* ================= Hendingar */
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-a]"); if (!t) return;
  const a = t.dataset.a, v = t.dataset.v;
  if (a === "overlay") { if (ev.target === t) { if (sheetKind === "cat" && cBack()) return; closeSheet(); } return; }
  switch (a) {
    case "tab": UI.view = v; UI.calDay = null; closeSheet(); render(); scrollTo({ top: 0 }); break;
    case "close": if (sheetKind === "cat" && cBack()) break; closeSheet(); break;
    case "range": UI.months = +v; render(); break;
    case "acc-toggle": UI.hidden[t.dataset.id] = !UI.hidden[t.dataset.id]; if (S.accounts.every(x => UI.hidden[x.id])) UI.hidden = {}; render(); break;
    case "clear-demo":
      if (t.dataset.sure) { S = emptyState(); UI.hidden = {}; commit(); toast("Klart for dine eigne tal. Start med ein konto."); }
      else { t.dataset.sure = "1"; t.textContent = "Trykk igjen for å slette eksempla"; }
      break;
    case "new-entry": closeSheet(); openEntry(null, { ...(t.dataset.date ? { date: t.dataset.date } : {}), ...(t.dataset.kind ? { kind: t.dataset.kind } : {}) }); break;
    case "edit-entry": closeSheet(); openEntry(t.dataset.id); break;
    case "occ": openOcc(t.dataset.k); break;
    case "pay": quickPay(t.dataset.k, t); break;
    case "occ-amt": openOcc(t.dataset.k, { focusAmt: true }); break;
    case "acc": openAccount(t.dataset.id); break;
    case "new-acc": openAccount(null); break;
    case "cal": { if (+v === 0) { UI.calMonth = TODAY.slice(0, 7); UI.calDay = null; } else { UI.calMonth = addMonths(UI.calMonth + "-01", +v).slice(0, 7); UI.calDay = null; } render(); break; }
    case "day": { const d = t.dataset.d; UI.calDay = UI.calDay === d ? null : d; if (d.slice(0, 7) !== UI.calMonth) UI.calMonth = d.slice(0, 7); render(); break; }
    case "undo": if (toast.undo) { toast.undo(); toast.undo = null; $("#toast").innerHTML = ""; } break;
    // post-arket
    case "e-kind": D.kind = v; if (CAT_BY_ID[D.cat]?.kind !== v) { D.cat = (suggest(D.name, v)[0] || {}).id || (v === "in" ? "inn_anna" : v === "move" ? "sparing" : "anna"); } eKind(); ePicker(); eSugg(); eAccs(); eModes(); break;
    case "ac-pick": acPick(+t.dataset.i); break;
    case "theme": openTheme(); break;
    case "lang": if (S.lang !== v) { S.lang = v; authLang = v; try { if (WEB) localStorage.setItem("pengeflyt.lang", v); } catch (_) { } commit(); toast(v === "nb" ? "Appen bruker nå bokmål" : "Appen brukar no nynorsk"); } break;
    case "cycle": openCycle(); break;
    case "b-new": openBudget(t.dataset.id || null, true); break;
    case "b-edit": openBudget(t.dataset.id, false); break;
    case "be-cat": BE.id = v; document.querySelectorAll("#be-picker .pick").forEach(b => b.setAttribute("aria-checked", b.dataset.v === v)); if (S.budgets?.[v]) $("#be-amt").value = S.budgets[v]; beRender(); $("#be-amt").focus(); break;
    case "be-sugset": $("#be-amt").value = v; $("#be-amt").focus(); break;
    case "be-save": beSave(); break;
    case "be-del":
      if (t.dataset.sure) { const n = CAT_BY_ID[BE.id]?.name || ""; const b = { ...S.budgets }; delete b[BE.id]; S.budgets = b; closeSheet(); commit(); toast(`Ramma for ${n.toLowerCase()} er fjerna`); }
      else { t.dataset.sure = "1"; t.textContent = "Trykk igjen for å fjerne"; }
      break;
    case "cy-type": CY.type = v; document.querySelectorAll("#cy-type button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v)); $("#cy-pay").hidden = v !== "pay"; cyPrev(); break;
    case "cy-guess": $("#cy-day").value = v; cyPrev(); break;
    case "cy-save": {
      if (CY.type === "pay" && !cyRead()) { $("#cy-err").textContent = "Skriv ein lønnsdag mellom 1 og 31."; break; }
      S.cycle = CY.type === "pay" ? { type: "pay", day: CY.day, weekend: CY.weekend } : { type: "month" };
      closeSheet(); commit(); toast(S.cycle.type === "pay" ? `Oversikta følgjer no lønna di (den ${S.cycle.day}.)` : "Oversikta følgjer no kalendermånaden"); break;
    }
    case "theme-set": S.theme = v; document.querySelectorAll(".theme-opt").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v)); FX.season = null; commit(); break;
    case "quick": openQuick(t.dataset.id); break;
    case "quick-cfg": openQuickCfg(); break;
    case "q-cats": QS.open = !QS.open; qRender(); break;
    case "q-cat": QS.cat = v; QS.open = false; qRender(); $("#q-amt").focus(); break;
    case "q-pick": QS.id = v; QS.cat = null; QS.open = false; document.querySelectorAll("#q-chips .chip").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v)); qRender(); $("#q-amt").focus(); break;
    case "q-save": qSave(t); break;
    case "qe-edit": openQuickEdit(t.dataset.id); break;
    case "qe-new": openQuickEdit(null); break;
    case "qe-done": closeSheet(); render(); break;
    case "qe-back": openQuickCfg(); break;
    case "qe-kind": QE.label = $("#qe-label").value; QE.name = $("#qe-name").value; QE.acc = $("#qe-acc").value; QE.kind = v; openQuickEditKeep(); break;
    case "qe-cat": QE.cat = v; document.querySelectorAll("#qe-picker .pick").forEach(b => b.setAttribute("aria-checked", b.dataset.v === v)); break;
    case "qe-save": qeSave(); break;
    case "qe-top": { const i = S.quick.findIndex(x => x.id === QE.id); const [q] = S.quick.splice(i, 1); S.quick.unshift(q); commitQuiet(); render(); openQuickCfg(); toast(`«${q.label}» er no standard`); break; }
    case "qe-del":
      if (t.dataset.sure) { S.quick = S.quick.filter(x => x.id !== QE.id); commitQuiet(); render(); openQuickCfg(); toast("Knappen er sletta"); }
      else { t.dataset.sure = "1"; t.textContent = "Trykk igjen for å slette"; }
      break;
    case "e-cat": D.cat = v; D.catTouched = true; eSyncPick(); eSugg(); break;
    case "e-freq": eReadEnd(); D.freq = v; eFreq(); ePrev(); break;
    case "e-end": eReadEnd(); D.endMode = v; if (v === "date" && !D.until) D.until = addMonths(D.date || TODAY, 12); eEnd(); ePrev(); break;
    case "e-mode": D.mode = v; eModes(); break;
    case "e-save": eSave(); break;
    case "e-del":
      if (t.dataset.sure) { const id = D.id, n = D.name; S.entries = S.entries.filter(x => x.id !== id); for (const k in S.conf) if (k.startsWith(id + "|")) delete S.conf[k]; closeSheet(); commit(); toast(`«${n}» er sletta`); }
      else { t.dataset.sure = "1"; t.textContent = "Trykk igjen for å slette"; }
      break;
    // førekomst-arket
    case "o-pay": oPay(t); break;
    case "o-save": oSave(); break;
    case "o-skip": { const p = S.conf[O.key]; S.conf[O.key] = clean({ ...(p || {}), s: "skipped", d: undefined }); const n = O.e.name, k = O.key; closeSheet(); commit(); toast(`«${n}» er hoppa over denne gongen`, () => { if (p) S.conf[k] = p; else delete S.conf[k]; commit(); }); break; }
    case "o-reset": delete S.conf[O.key]; closeSheet(); commit(); toast("Tilbakestilt"); break;
    // kategori
    case "cat-new": openCat(null, { back: sheetKind === "entry", kind: sheetKind === "entry" ? D.kind : "out" }); break;
    case "cat-edit": openCat(t.dataset.id, { back: sheetKind === "entry" }); break;
    case "c-kind": CE.kind = v; cKind(); cPrev(); break;
    case "c-color": CE.color = v; $("#c-body").style.setProperty("--pick", v); document.querySelectorAll("#c-colors .swatch").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v)); break;
    case "c-glyph": CE.glyph = v; document.querySelectorAll("#c-lib .pick").forEach(b => b.setAttribute("aria-checked", b.dataset.v === v)); cPrev(); break;
    case "c-save": cSave(); break;
    case "c-del": {
      const used = +t.dataset.used;
      if (t.dataset.sure) {
        const id = CE.id, n = CE.name;
        for (const e of S.entries) if (e.cat === id) e.cat = e.kind === "in" ? "inn_anna" : e.kind === "move" ? "overforing" : "anna";
        S.cats = S.cats.filter(x => x.id !== id); setCustom(S.cats);
        if (CE.back && D) { if (D.cat === id) D.cat = D.kind === "in" ? "inn_anna" : D.kind === "move" ? "overforing" : "anna"; commitQuiet(); CE = null; showEntry(); }
        else { CE = null; closeSheet(); commit(); }
        toast(`«${n}» er sletta`);
      } else { t.dataset.sure = "1"; t.textContent = used ? `Slett? ${used} ${used === 1 ? "post" : "postar"} blir flytta til «Anna»` : "Trykk igjen for å slette"; }
      break;
    }
    // konto-arket
    case "a-type": AD.type = v; document.querySelectorAll("#a-type button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v)); break;
    case "a-color": AD.color = v; document.querySelectorAll(".swatch").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v)); break;
    case "a-save": aSave(); break;
    case "a-del": {
      const used = +t.dataset.used;
      if (used) { $("#a-err").textContent = `Kontoen er i bruk i ${used} ${used === 1 ? "post" : "postar"}. Flytt eller slett dei først.`; break; }
      if (t.dataset.sure) { S.accounts = S.accounts.filter(x => x.id !== AD.id); closeSheet(); commit(); toast("Kontoen er sletta"); }
      else { t.dataset.sure = "1"; t.textContent = "Trykk igjen for å slette"; }
      break;
    }
  }
});
document.addEventListener("input", ev => {
  if (sheetKind === "occ" && ev.target.id === "o-amt") { oDiff(); return; }
  if (sheetKind === "cycle") { cyPrev(); return; }
  if (sheetKind === "cat" && CE) {
    if (ev.target.id === "c-name") { CE.name = ev.target.value; cPrev(); }
    if (ev.target.id === "c-q") { CE.q = ev.target.value; cLib(); }
    return;
  }
  if (!D || sheetKind !== "entry") return;
  const id = ev.target.id;
  if (id === "e-name") {
    D.name = ev.target.value; acUpdate(); $("#e-filled").textContent = "";
    if (!D.catTouched) { const s = suggest(D.name, D.kind)[0]; if (s) { D.cat = s.id; eSyncPick(); } }
    eSugg();
  } else if (id === "e-amount") { D.amount = ev.target.value; ePrev(); }
  else if (id === "e-date") { D.date = ev.target.value; if ($("#e-until")) $("#e-until").min = D.date; ePrev(); }
  else if (id === "e-until") { D.until = ev.target.value; ePrev(); }
  else if (id === "e-count") { D.count = ev.target.value; ePrev(); }
});
document.addEventListener("change", ev => {
  if (!D || sheetKind !== "entry") return;
  if (ev.target.id === "e-acc") { D.acc = ev.target.value; if (D.kind === "move") eAccs(); }
  if (ev.target.id === "e-to") D.to = ev.target.value;
});
document.addEventListener("focusin", ev => { if (ev.target.id === "e-name" && sheetKind === "entry") acUpdate(); });
document.addEventListener("focusout", ev => { if (ev.target.id === "e-name") setTimeout(() => { if (document.activeElement?.id !== "e-name") acClose(); }, 150); });
document.addEventListener("pointerdown", ev => { if (ev.target.closest(".ac-item")) ev.preventDefault(); });
document.addEventListener("keydown", ev => {
  if (ev.target.id === "e-name" && AC.list.length) {
    if (ev.key === "ArrowDown") { ev.preventDefault(); acMove(1); return; }
    if (ev.key === "ArrowUp") { ev.preventDefault(); acMove(-1); return; }
    if (ev.key === "Escape") { ev.preventDefault(); acClose(); return; }
    if (ev.key === "Enter" && AC.idx >= 0) { ev.preventDefault(); acPick(AC.idx); return; }
  }
  if (ev.key === "Escape" && sheetKind) { if (sheetKind === "cat" && cBack()) return; if (sheetKind === "qedit") { openQuickCfg(); return; } closeSheet(); return; }
  if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches('[role="button"][data-a]')) { ev.preventDefault(); ev.target.click(); }
  if (ev.key === "Enter" && sheetKind === "entry" && ev.target.matches("input")) { ev.preventDefault(); eSave(); }
  if (ev.key === "Enter" && sheetKind === "cat" && ev.target.id === "c-name") { ev.preventDefault(); cSave(); }
  if (ev.key === "Enter" && sheetKind === "quick" && ev.target.matches("input")) { ev.preventDefault(); qSave($("#sheet [data-a='q-save']")); }
  if (ev.key === "Enter" && sheetKind === "qedit" && ev.target.matches("input")) { ev.preventDefault(); qeSave(); }
  if (ev.key === "Enter" && sheetKind === "budget" && ev.target.id === "be-amt") { ev.preventDefault(); beSave(); }
  if (ev.key === "Enter" && sheetKind === "occ" && ev.target.id === "o-amt") { ev.preventDefault(); ($("#sheet [data-a='o-pay']") || $("#sheet [data-a='o-save']"))?.click(); }
});
$("#fab").addEventListener("click", () => openEntry(null));
$("#fab-quick").addEventListener("click", () => openQuick(S.quick[0]?.id));

/* ================= Tilbake-knapp (Android) */
// Lukkar ope vindauge, så går til Oversikt. Returnerer false når appen kan lukkast.
window.pfBack = () => {
  if (sheetKind) {
    if (sheetKind === "cat" && cBack()) return true;
    if (sheetKind === "qedit") { openQuickCfg(); return true; }
    closeSheet(); return true;
  }
  if (UI.view !== "oversikt") { UI.view = "oversikt"; UI.calDay = null; render(); scrollTo({ top: 0 }); return true; }
  return false;
};

/* ================= Nettversjon: innlogging, konto og sletting */
const LANG_KEY = "pengeflyt.lang";
let authLang = (() => { try { return localStorage.getItem(LANG_KEY) || defaultLang(); } catch (_) { return defaultLang(); } })();
let authMode = "login";
const AUTH_ERR = {
  "auth/invalid-credential": "Feil e-post eller passord.", "auth/wrong-password": "Feil e-post eller passord.",
  "auth/user-not-found": "Feil e-post eller passord.", "auth/invalid-email": "E-postadressa ser ikkje rett ut.",
  "auth/email-already-in-use": "Det finst alt ein konto med denne e-postadressa. Prøv å logge inn.",
  "auth/weak-password": "Passordet må ha minst 6 teikn.", "auth/missing-password": "Skriv inn passordet.",
  "auth/too-many-requests": "For mange forsøk. Vent litt og prøv igjen.",
  "auth/network-request-failed": "Fekk ikkje kontakt. Sjekk internett og prøv igjen.",
};
const authErr = e => AUTH_ERR[e && e.code] || "Noko gjekk gale. Prøv igjen.";
function showFabs(on) { const f = document.querySelector(".fabs"); if (f) f.hidden = !on; }
function authScreen(note) {
  window.PF_I18N?.setLang(authLang);
  showFabs(false); closeSheet();
  const m = authMode;
  const title = { login: "Logg inn", signup: "Lag konto", reset: "Nytt passord", loading: "Hentar dataa dine …" }[m];
  $("#app").innerHTML = `<div class="auth">
    <div class="auth-card">
      <div class="auth-top"><div class="logo">${LOGO}<span class="logo-t">Pengeflyt<small>Budsjett &amp; Utgifter</small></span></div>
        <div class="langsw" role="group" aria-label="Språk">${[["nn", "NN", "Nynorsk"], ["nb", "NB", "Bokmål"]].map(([k, t, n]) => `<button data-a="auth-lang" data-v="${k}" aria-pressed="${authLang === k}" title="${n}" aria-label="${n}">${t}</button>`).join("")}</div></div>
      ${m === "loading" ? `<div class="auth-loading"><span class="spin"></span>${title}</div>` : `
      ${m !== "reset" ? `<div class="seg" role="group" aria-label="Logg inn eller lag konto"><button data-a="auth-mode" data-v="login" aria-pressed="${m === "login"}">Logg inn</button><button data-a="auth-mode" data-v="signup" aria-pressed="${m === "signup"}">Lag konto</button></div>` : `<h1 class="auth-h">${title}</h1><p class="hint" style="margin:0">Skriv e-postadressa di, så sender vi ei lenkje der du kan velje nytt passord.</p>`}
      <form id="auth-form" novalidate>
        <div class="field"><label for="au-email">E-post</label><input class="input" id="au-email" type="email" autocomplete="email" required value="${esc(authScreen.email || "")}"></div>
        ${m !== "reset" ? `<div class="field"><label for="au-pw">Passord</label><div class="pw"><input class="input" id="au-pw" type="password" autocomplete="${m === "signup" ? "new-password" : "current-password"}" required minlength="6"><button type="button" class="btn ghost sm" data-a="auth-show">Vis</button></div>${m === "signup" ? `<span class="hint">Minst 6 teikn.</span>` : ""}</div>` : ""}
        ${m === "signup" ? `<label class="check"><input type="checkbox" id="au-ok"> <span>Eg har lese <a href="../#personvern" target="_blank" rel="noopener">personvernerklæringa</a>. Dataa mine blir lagra trygt i EU, og eg kan slette kontoen når eg vil.</span></label>` : ""}
        <div class="err" id="au-err" role="alert">${note && note.err ? esc(note.err) : ""}</div>
        ${note && note.ok ? `<div class="auth-ok" role="status">${esc(note.ok)}</div>` : ""}
        <button class="btn primary auth-go" type="submit">${m === "login" ? "Logg inn" : m === "signup" ? "Lag konto" : "Send lenkje"}</button>
      </form>
      ${m === "login" ? `<button class="btn ghost sm" data-a="auth-mode" data-v="reset">Gløymt passordet?</button>` : m === "reset" ? `<button class="btn ghost sm" data-a="auth-mode" data-v="login">← Tilbake til innlogging</button>` : ""}`}
    </div>
    <p class="auth-foot">Pengeflyt finst òg som app for Android. <a href="../">Les meir om Pengeflyt</a> · <a href="../#personvern">Personvern</a></p>
  </div>`;
  setTimeout(() => $("#au-email")?.focus(), 30);
}
async function authSubmit() {
  const st = window.PF_STORE; if (!st) return;
  const email = $("#au-email").value.trim(), pw = $("#au-pw")?.value || "", err = $("#au-err");
  authScreen.email = email;
  if (!email) { err.textContent = "Skriv inn e-postadressa di."; return; }
  if (authMode === "signup" && !$("#au-ok").checked) { err.textContent = "Kryss av for at du har lese personvernerklæringa."; return; }
  const btn = $(".auth-go"); btn.disabled = true;
  try {
    if (authMode === "login") await st.signIn(email, pw);
    else if (authMode === "signup") { webNew = true; await st.signUp(email, pw); }
    else { await st.reset(email); authMode = "login"; authScreen({ ok: "Sjekk e-posten din. Vi har sendt ei lenkje for å velje nytt passord." }); return; }
  } catch (e) { webNew = false; btn.disabled = false; err.textContent = authErr(e); }
}
let webNew = false, deletedNote = false;
async function webLoad() {
  authMode = "loading"; authScreen();
  try {
    const data = await window.PF_STORE.load();
    const st = data && migrate(JSON.parse(JSON.stringify(data.state || null)));
    if (st) S = st;
    else { S = demoState(); S.lang = authLang; }
    touched = false;
    ref = { set: d => window.PF_STORE.save(d) };
    UI.view = "oversikt";
    showFabs(true); render(); setSave("ok");
    if (!st) { touched = true; flush(); }
  } catch (e) {
    authMode = "login"; authScreen({ err: "Fekk ikkje henta dataa dine. Sjekk internett og prøv igjen." });
  }
}
function openAccount2() {
  const email = window.PF_STORE?.email || "";
  openSheet(`${head("Konto")}
  <div class="sheet-body">
    <div class="preview">Innlogga som <b>${esc(email)}</b>. Dataa dine blir lagra på kontoen, så du ser det same på alle einingar.</div>
    <div class="acc-actions">
      <button class="btn" data-a="acc-export">Last ned dataa mine (JSON)</button>
      <button class="btn" data-a="acc-logout">Logg ut</button>
    </div>
    <details class="explain danger-zone"><summary>Slett kontoen</summary>
      <p>Alt du har lagt inn blir sletta for godt, og kan ikkje hentast tilbake. Skriv passordet ditt for å stadfeste.</p>
      <div class="field" style="margin-top:10px"><label for="del-pw">Passord</label><input class="input" id="del-pw" type="password" autocomplete="current-password"></div>
      <div class="err" id="del-err" role="alert"></div>
      <button class="btn danger-solid" data-a="acc-delete" style="margin-top:10px">Slett kontoen og alle data</button>
    </details>
  </div>
  <div class="sheet-foot"><span class="grow"></span><button class="btn primary" data-a="close">Ferdig</button></div>`, "account");
}
function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `pengeflyt-${TODAY}.json`; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function webStart() {
  authMode = "loading"; authScreen();
  const go = () => window.PF_STORE.onAuth(u => {
    if (u) { webLoad(); }
    else { S = null; ref = null; clearTimeout(saveT); authMode = "login"; authScreen(deletedNote ? { ok: "Kontoen og alle dataa dine er sletta." } : undefined); deletedNote = false; }
  });
  if (window.PF_STORE) go(); else window.addEventListener("pf-store-ready", go, { once: true });
  setTimeout(() => { if (!window.PF_STORE) { authMode = "login"; authScreen({ err: "Fekk ikkje lasta innlogginga. Sjekk internett og last sida på nytt." }); } }, 12000);
}
document.addEventListener("submit", ev => { if (ev.target.id === "auth-form") { ev.preventDefault(); authSubmit(); } });
document.addEventListener("click", async ev => {
  const t = ev.target.closest("[data-a]"); if (!t) return;
  const a = t.dataset.a, v = t.dataset.v;
  if (a === "auth-mode") { authScreen.email = $("#au-email")?.value || authScreen.email; authMode = v; authScreen(); }
  else if (a === "auth-lang") { authLang = v; try { localStorage.setItem(LANG_KEY, v); } catch (_) { } authScreen.email = $("#au-email")?.value || ""; location.hash = ""; authScreen(); }
  else if (a === "auth-show") { const i = $("#au-pw"); i.type = i.type === "password" ? "text" : "password"; t.textContent = i.type === "password" ? "Vis" : "Skjul"; }
  else if (a === "account") openAccount2();
  else if (a === "acc-export") exportData();
  else if (a === "acc-logout") {
    if (saveT) { clearTimeout(saveT); saveT = null; try { await flush(); } catch (_) { } }
    closeSheet(); await window.PF_STORE.signOut();
  }
  else if (a === "acc-delete") {
    const pw = $("#del-pw").value, err = $("#del-err");
    if (!pw) { err.textContent = "Skriv inn passordet ditt."; return; }
    if (!t.dataset.sure) { t.dataset.sure = "1"; t.textContent = "Er du sikker? Trykk igjen for å slette alt"; return; }
    t.disabled = true; clearTimeout(saveT); ref = null;
    try { deletedNote = true; await window.PF_STORE.deleteAccount(pw); closeSheet(); }
    catch (e) { deletedNote = false; t.disabled = false; ref = { set: d => window.PF_STORE.save(d) }; err.textContent = authErr(e); }
  }
});

/* ================= Start */
if (WEB) webStart();
else {
  try { const raw = localStorage.getItem(LS); if (raw) S = migrate(JSON.parse(raw)); } catch (_) { }
  if (!S) S = demoState();
  render();
  connect();
}
})();
