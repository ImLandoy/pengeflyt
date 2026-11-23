// Språk: appen er skriven på nynorsk. Når bokmål er valt, blir all tekst på skjermen
// omsett med ordlista under. Det brukaren skriv i felt (input) blir aldri endra.
(function () {
  // Fraser først (lengste først), så enkeltord. Nøklane er nynorsk, små bokstavar.
  const PHRASES = [
    ["held fram", "fortsetter"], ["er sette av", "er satt av"], ["finst alt", "finnes allerede"],
    ["til dømes", "for eksempel"], ["t.d.", "f.eks."], ["tal gonger", "antall ganger"],
    ["har skrive", "har skrevet"], ["du skriv", "du skriver"], ["skriv du", "skriver du"],
    ["lønna di", "lønnen din"], ["har lese", "har lest"], ["noko gjekk gale", "noe gikk galt"], ["ingen bilete", "ingen bilder"], ["anna ord", "annet ord"],
    ["anna inntekt", "annen inntekt"], ["animert bilete", "animert bilde"], ["over 70 bilete", "over 70 bilder"],
  ];
  const WORDS = {
    aksjar: "aksjer", "òg": "også", dataa: "dataene", teikn: "tegn", gløymt: "glemt", noko: "noe", gjekk: "gikk",
    lasta: "lastet", innlogga: "innlogget", personvernerklæringa: "personvernerklæringen", lenkje: "lenke",
    velje: "velge", einingar: "enheter", stadfeste: "bekrefte", hentast: "hentes", forsøk: "forsøk",
    postadressa: "postadressen", annakvar: "annenhver", anna: "annet", att: "igjen", avslutta: "avsluttet",
    berre: "bare", bilete: "bilde", blomeblad: "blomsterblad", bompengar: "bompenger", brukar: "bruker",
    bustad: "bolig", byggje: "bygge", byt: "bytt", byter: "bytter",
    dagane: "dagene", dagar: "dager", daglegvarer: "dagligvarer", dataspel: "dataspill", datoar: "datoer",
    dei: "de", drøym: "drøm", dukkar: "dukker",
    eg: "jeg", ei: "en", eigen: "egen", eigne: "egne", ein: "en", éin: "én", eingongspostar: "engangsposter",
    eit: "et", eksempla: "eksemplene", endrar: "endrer", endringa: "endringen", enno: "ennå",
    fallande: "fallende", fann: "fant", fekk: "fikk", feriepengane: "feriepengene", feriepengar: "feriepenger",
    finst: "finnes", fjerna: "fjernet", fleire: "flere", flybillettar: "flybilletter", flyt: "flyter",
    flytta: "flyttet", flyttar: "flytter", fordelte: "fordelt", fram: "frem", framleis: "fremdeles",
    framover: "fremover", frå: "fra", følgj: "følg", følgje: "følge", følgjer: "følger",
    førekomst: "forekomst", førre: "forrige",
    gjelda: "gjelden", gjer: "gjør", glitrande: "glitrende", gong: "gang", gongen: "gangen", gonger: "ganger",
    gåve: "gave", gåver: "gaver", julegåver: "julegaver",
    heim: "hjem", hammar: "hammer", handverkar: "håndverker", haust: "høst", heile: "hele", heilt: "helt", heiter: "heter",
    henta: "hentet", hentar: "henter", hjarte: "hjerte", hoppa: "hoppet", hugs: "husk", høgare: "høyere",
    ikkje: "ikke", inga: "ingen", inntekta: "inntekten",
    jamt: "jevnt", kalendermånad: "kalendermåned", kalendermånaden: "kalendermåneden",
    kategoriar: "kategorier", kjem: "kommer", kjærast: "kjæreste", klede: "klær", knappar: "knapper",
    kome: "kommet", komne: "kommet", kontantar: "kontanter", kontoane: "kontoene", kontoar: "kontoer",
    kor: "hvor", korleis: "hvordan", kva: "hva", kvar: "hver", kvardagen: "hverdagen", kvart: "hvert",
    laga: "laget", lagra: "lagret", lagrar: "lagrer", lagrast: "lagres", laurdag: "lørdag", lauv: "løv",
    leggje: "legge", lommepengar: "lommepenger", lågare: "lavere", lågast: "lavest", lågaste: "laveste",
    løn: "lønn", lønna: "lønnen",
    meir: "mer", morgon: "morgen", motteke: "mottatt", mykje: "mye",
    månad: "måned", månaden: "måneden", månader: "måneder", månadene: "månedene", måndag: "mandag",
    namn: "navn", nettlesaren: "nettleseren", no: "nå", notar: "noter", næraste: "nærmeste",
    overføringa: "overføringen", overføringar: "overføringer", oversikta: "oversikten",
    pengane: "pengene", pengar: "penger", passar: "passer", postar: "poster",
    ramma: "rammen", raudt: "rødt", rekna: "regnet", rekning: "regning", rekninga: "regningen",
    rekningar: "regninger", runda: "rundet", rørsler: "bevegelser",
    sal: "salg", samanliknar: "sammenligner", samla: "samlet", same: "samme", set: "sett", setje: "sette",
    sjå: "se", sjølv: "selv", skatteoppgjeret: "skatteoppgjøret", skjønnheit: "skjønnhet", skule: "skole",
    skulesekk: "skolesekk", skulestart: "skolestart", sletta: "slettet", slettar: "sletter",
    sluttar: "slutter", snarveg: "snarvei", snarvegar: "snarveier", sommar: "sommer", sommarhus: "sommerhus",
    sparekontoar: "sparekontoer", sparinga: "sparingen", spel: "spill", stadfest: "bekreft",
    stadfesta: "bekreftet", stadfestar: "bekrefter", stemde: "stemte", straum: "strøm", sundag: "søndag",
    tal: "tall", tala: "tallene", tel: "teller", tidlegare: "tidligere", tilsvarar: "tilsvarer", timar: "timer",
    tysdag: "tirsdag",
    utan: "uten", utleige: "utleie",
    val: "valg", valfritt: "valgfritt", vanleg: "vanlig", vanlege: "vanlige", vart: "ble",
    vedlikehald: "vedlikehold", veke: "uke", vel: "velg", velkomen: "velkommen", ventar: "venter",
    verda: "verden", vere: "være", visingar: "visninger", vitaminar: "vitaminer",
    øvste: "øverste", årstida: "årstiden",
  };

  const matchCase = (src, out) => src === src.toUpperCase() && src.length > 1 ? out.toUpperCase()
    : src[0] === src[0].toUpperCase() ? out[0].toUpperCase() + out.slice(1) : out;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const L = "A-Za-zÆØÅæøåÉéÒò";
  const phraseRe = new RegExp(`(?<![${L}])(${PHRASES.map(p => esc(p[0])).sort((a, b) => b.length - a.length).join("|")})(?![${L}])`, "gi");
  const PH = Object.fromEntries(PHRASES);
  const wordRe = new RegExp(`[${L}]+`, "g");

  // E-postadresser, nettadresser og domene blir aldri omsette (t.d. «.no»).
  const keepRe = /(\S+@\S+|[a-z]+:\/\/\S+|\b[\w-]+(?:\.[\w-]+)+\.(?:no|com|io|net|org)\b|\b[\w-]+\.(?:no|com|io|net|org)\b)/gi;
  function tr(s) {
    if (!s || typeof s !== "string") return s;
    if (keepRe.test(s)) { keepRe.lastIndex = 0; return s.split(keepRe).map((part, i) => (i % 2 ? part : trPart(part))).join(""); }
    return trPart(s);
  }
  function trPart(s) {
    if (!s) return s;
    return s.replace(phraseRe, m => matchCase(m, PH[m.toLowerCase()]))
      .replace(wordRe, w => { const o = WORDS[w.toLowerCase()]; return o ? matchCase(w, o) : w; });
  }

  let lang = "nn";
  const ATTRS = ["placeholder", "aria-label", "title"];
  function translateNode(root) {
    if (lang !== "nb") return;
    if (root.nodeType === 3) { const t = tr(root.nodeValue); if (t !== root.nodeValue) root.nodeValue = t; return; }
    if (root.nodeType !== 1) return;
    const tag = root.tagName;
    if (tag === "SCRIPT" || tag === "STYLE") return;
    const els = [root, ...root.querySelectorAll("*")];
    for (const el of els) for (const a of ATTRS) if (el.hasAttribute && el.hasAttribute(a)) {
      const v = el.getAttribute(a), t = tr(v); if (t !== v) el.setAttribute(a, t);
    }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.parentNode && /^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const n of nodes) { const t = tr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; }
  }
  const mo = new MutationObserver(list => {
    if (lang !== "nb") return;
    for (const m of list) {
      if (m.type === "characterData") translateNode(m.target);
      else if (m.type === "attributes") translateNode(m.target.nodeType === 1 ? m.target : m.target.parentNode);
      else m.addedNodes.forEach(translateNode);
    }
  });
  function setLang(l) {
    lang = l === "nb" ? "nb" : "nn";
    document.documentElement.lang = lang;
    if (lang === "nb") { document.title = tr(document.title); translateNode(document.body); }
  }
  mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  window.PF_I18N = { tr, setLang, get lang() { return lang; } };
})();
