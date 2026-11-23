// Kategoriar med animerte ikon. Kvart ikon er ein 48×48 SVG; delar med klassa a-* blir animerte i CSS.
(function () {
  const F = 'fill="currentColor"';
  const FS = 'fill="currentColor" fill-opacity=".22"';

  const CATS = [
    // ---- Utgifter
    { id: "heim", name: "Heim", kind: "out", color: "#e2683c",
      kw: "boliglån bustadlån huslån husleige husleie leige leie bustad bolig fellesutgifter fellesutg sameige borettslag hus heim hjem",
      svg: `<path d="M8 24 24 10l16 14"/><path d="M12 21v17h24V21"/><path d="M21 38v-9h6v9"/><path d="M31 15V9h4v9"/>
            <circle class="a-smoke" cx="33" cy="5" r="2" ${F} stroke="none"/><circle class="a-smoke d2" cx="34" cy="5" r="1.6" ${F} stroke="none"/>` },
    { id: "straum", name: "Straum", kind: "out", color: "#d99a00",
      kw: "straum strøm strom elvia tibber fjordkraft nettleige nettleie lyse energi",
      svg: `<path class="a-flick" d="M27 5 13 27h10l-3 16 15-23H25z" ${FS}/>` },
    { id: "kommunalt", name: "Kommunale avgifter", kind: "out", color: "#2c8fd6",
      kw: "kommunal kommunale avgift avgifter vatn vann avløp renovasjon eigedomsskatt eiendomsskatt feiing kommune",
      svg: `<g class="a-squish"><path d="M24 7c6 8 12 14 12 21a12 12 0 0 1-24 0c0-7 6-13 12-21z" ${FS}/><path d="M18 29a6 6 0 0 0 6 6"/></g>` },
    { id: "mat", name: "Mat og daglegvarer", kind: "out", color: "#3a9d58",
      kw: "mat daglegvarer dagligvarer rema kiwi coop meny extra spar joker bunnpris oda handel matbutikk",
      svg: `<path d="M7 21h34l-4 17H11z"/><path d="M17 21l5-11M31 21l-5-11"/><path d="M17 28v4M24 28v4M31 28v4"/>
            <g class="a-bounce"><circle cx="24" cy="15" r="4" ${F} stroke="none"/></g>` },
    { id: "bil", name: "Bil", kind: "out", color: "#d6453d",
      kw: "bil drivstoff bensin diesel lading elbil bompeng bompenger autopass parkering service eu-kontroll billån bilforsikring dekk verkstad",
      svg: `<path d="M6 31v-7l5-9h19l8 9h4v7h-3"/><path d="M18 31h11"/><path d="M6 31h2"/>
            <g class="a-spin"><circle cx="13" cy="32" r="4.5"/><path d="M13 28v8"/></g>
            <g class="a-spin"><circle cx="34" cy="32" r="4.5"/><path d="M34 28v8"/></g>` },
    { id: "kollektiv", name: "Kollektiv", kind: "out", color: "#c1477e",
      kw: "buss ruter skyss kolumbus atb kollektiv tog vy trikk bane periodebillett billett ferje",
      svg: `<g class="a-bob"><rect x="10" y="7" width="28" height="29" rx="5"/><path d="M10 22h28"/><path d="M18 12h12"/>
            <circle cx="16.5" cy="29" r="2" ${F} stroke="none"/><circle cx="31.5" cy="29" r="2" ${F} stroke="none"/></g><path d="M15 36v5M33 36v5"/>` },
    { id: "forsikring", name: "Forsikring", kind: "out", color: "#4f63d8",
      kw: "forsikring forsikringar if gjensidige tryg fremtind frende storebrand innbu reise hus",
      svg: `<path d="M24 6 38 11v11c0 9-6 16-14 20-8-4-14-11-14-20V11z" ${FS}/><path class="a-draw" pathLength="1" d="M17 24l5 5 9-10"/>` },
    { id: "abonnement", name: "Abonnement", kind: "out", color: "#8b4fd8",
      kw: "netflix spotify hbo max viaplay disney tv2 tv 2 abonnement strøyming streaming youtube apple icloud google avis",
      svg: `<rect x="6" y="9" width="36" height="25" rx="4"/><path d="M18 40h12"/><path class="a-pulse" d="M21 16v11l9-5.5z" ${F}/>` },
    { id: "mobil", name: "Mobil og internett", kind: "out", color: "#1b9aa0",
      kw: "mobil telefon internett telenor telia ice talkmore chili breiband bredbånd fiber altibox",
      svg: `<circle cx="24" cy="36" r="2.6" ${F} stroke="none"/><path class="a-w1" d="M18.5 30.5a8 8 0 0 1 11 0"/>
            <path class="a-w2" d="M13 25a15.5 15.5 0 0 1 22 0"/><path class="a-w3" d="M7.5 19.5a23 23 0 0 1 33 0"/>` },
    { id: "helse", name: "Helse", kind: "out", color: "#e04a6b",
      kw: "lege tannlege apotek helse medisin fysio fysioterapi psykolog optikar briller frisør",
      svg: `<path class="a-beat" d="M24 39S8 29 8 18a8 8 0 0 1 16-3 8 8 0 0 1 16 3c0 11-16 21-16 21z" ${FS}/>` },
    { id: "barn", name: "Barn", kind: "out", color: "#ef8424",
      kw: "barnehage sfo aks barn leiker leker bleier barneklede lommepengar lommepenger",
      svg: `<g class="a-float"><ellipse cx="24" cy="17" rx="10" ry="12" ${FS}/><path d="M22 29h4l-2 3z" ${F}/><path d="M24 32c-3 4 3 6 0 10"/></g>` },
    { id: "dyr", name: "Kjæledyr", kind: "out", color: "#a0703c",
      kw: "hund katt dyrlege fôr kjæledyr dyreforsikring hundepass",
      svg: `<g class="a-wiggle"><ellipse cx="24" cy="31" rx="8" ry="7" ${F} stroke="none"/><circle cx="13" cy="21" r="3.5" ${F} stroke="none"/>
            <circle cx="19.5" cy="13.5" r="3.5" ${F} stroke="none"/><circle cx="28.5" cy="13.5" r="3.5" ${F} stroke="none"/><circle cx="35" cy="21" r="3.5" ${F} stroke="none"/></g>` },
    { id: "klede", name: "Klede og sko", kind: "out", color: "#c14fb0",
      kw: "klede klær sko zalando hm h&m boozt cubus dressmann jakke",
      svg: `<g class="a-sway"><path d="M17 8l-9 6 4 7 4-2v21h16V19l4 2 4-7-9-6c-1 3-4 5-7 5s-6-2-7-5z" ${FS}/></g>` },
    { id: "trening", name: "Trening og fritid", kind: "out", color: "#2a9a8b",
      kw: "trening sats evo elixia treningssenter gym fritid hobby idrett klubb kontingent",
      svg: `<g class="a-lift"><path d="M14 24h20"/><rect x="8" y="16" width="6" height="16" rx="2" ${FS}/><rect x="34" y="16" width="6" height="16" rx="2" ${FS}/><path d="M5 20v8M43 20v8"/></g>` },
    { id: "reise", name: "Reise og ferie", kind: "out", color: "#3a7bd5",
      kw: "fly reise ferie hotell sas norwegian widerøe airbnb hytte charter tur",
      svg: `<g class="a-fly"><path d="M6 23 42 8 32 40l-8-12z" ${FS}/><path d="M24 28 42 8"/><path d="M24 28v9l4-5"/></g>` },
    { id: "ute", name: "Kafé og restaurant", kind: "out", color: "#9b6a43",
      kw: "restaurant kafé kafe kaffe takeaway foodora wolt pizza lunsj middag ute bar",
      svg: `<path d="M10 21h22v9a9 9 0 0 1-9 9h-4a9 9 0 0 1-9-9z" ${FS}/><path d="M32 24h3a4 4 0 0 1 0 8h-3"/>
            <path class="a-steam" d="M16 15c-2-2 2-4 0-7"/><path class="a-steam d2" d="M21.5 15c-2-2 2-4 0-7"/><path class="a-steam d3" d="M27 15c-2-2 2-4 0-7"/>` },
    { id: "gaver", name: "Gåver", kind: "out", color: "#d6457a",
      kw: "gåve gave gåver gaver bursdag jul julegåver bryllup konfirmasjon dåp",
      svg: `<rect x="9" y="23" width="30" height="17" rx="2" ${FS}/><path d="M24 23v17"/>
            <g class="a-hop"><rect x="7" y="17" width="34" height="6" rx="2"/><path d="M24 17c-3-6-10-6-8-1M24 17c3-6 10-6 8-1"/></g>` },
    { id: "gjeld", name: "Lån og kreditt", kind: "out", color: "#6b6f86",
      kw: "kredittkort forbrukslån studielån lånekassen avdrag faktura gjeld kreditt lån renter",
      svg: `<g class="a-slide"><rect x="6" y="12" width="36" height="24" rx="4" ${FS}/><path d="M6 19h36"/><path d="M12 29h8"/></g>` },
    { id: "utdanning", name: "Utdanning", kind: "out", color: "#3d5bab",
      kw: "skule skole studie kurs semesteravgift bøker pensum universitet",
      svg: `<path d="M4 18 24 10l20 8-20 8z" ${FS}/><path d="M13 22v9c6 4 16 4 22 0v-9"/>
            <g class="a-tassel"><path d="M40 19v11"/><circle cx="40" cy="32" r="2.2" ${F} stroke="none"/></g>` },
    { id: "anna", name: "Anna", kind: "out", color: "#7a7f8e", kw: "anna anna diverse",
      svg: `<circle class="a-dot" cx="13" cy="24" r="3.5" ${F} stroke="none"/><circle class="a-dot d2" cx="24" cy="24" r="3.5" ${F} stroke="none"/><circle class="a-dot d3" cx="35" cy="24" r="3.5" ${F} stroke="none"/>` },

    // ---- Inntekter
    { id: "lon", name: "Løn", kind: "in", color: "#1f9a60",
      kw: "løn lønn lon løning salary arbeidsgjevar arbeidsgiver jobb",
      svg: `<rect x="10" y="9" width="32" height="18" rx="3" opacity=".45"/>
            <g class="a-flutter"><rect x="6" y="16" width="34" height="20" rx="3" ${FS}/><circle cx="23" cy="26" r="5"/><path d="M11 21v.01M35 31v.01"/></g>` },
    { id: "bonus", name: "Bonus og feriepengar", kind: "in", color: "#d39a00",
      kw: "bonus feriepengar feriepenger overtid provisjon tillegg",
      svg: `<path class="a-spark" d="M24 7l5 10.5 11.5 1.5-8.5 8 2 11.5L24 33l-10 5.5 2-11.5-8.5-8L19 17.5z" ${FS}/>
            <path class="a-tw" d="M41 6v6M38 9h6"/><path class="a-tw d2" d="M8 34v5M5.5 36.5h5"/>` },
    { id: "trygd", name: "Stønad og trygd", kind: "in", color: "#2f86c9",
      kw: "barnetrygd nav trygd stønad kontantstøtte pensjon dagpengar dagpenger sjukepengar foreldrepengar bostøtte",
      svg: `<g class="a-sway"><path d="M6 24a18 18 0 0 1 36 0z" ${FS}/><path d="M24 24v13a4 4 0 0 1-8 0"/><path d="M24 6v2"/></g>` },
    { id: "sal", name: "Sal", kind: "in", color: "#e0703c",
      kw: "finn sal salg solgt tise selt sold bruktsal",
      svg: `<g class="a-swing"><path d="M26 6h15v15L24 38a3 3 0 0 1-4 0l-9-9a3 3 0 0 1 0-4z" ${FS}/><circle cx="34" cy="13" r="2.6"/></g>` },
    { id: "renter", name: "Renter og utbytte", kind: "in", color: "#3a9d58",
      kw: "renter utbytte aksjar aksjer fond avkastning kapital",
      svg: `<path d="M14 32h20l-3 10H17z" ${FS}/><g class="a-grow"><path d="M24 32V15"/><path d="M24 23c-6 0-9-4-9-8 6 0 9 4 9 8z" ${FS}/><path d="M24 19c0-5 4-8 9-8 0 5-4 8-9 8z" ${FS}/></g>` },
    { id: "skatt", name: "Skatt tilbake", kind: "in", color: "#6c5ce7",
      kw: "skatt skatteoppgjer skatteoppgjør tilbakebetaling skatteetaten",
      svg: `<path d="M12 6h24v36l-4-3-4 3-4-3-4 3-4-3-4 3z" ${FS}/><path class="a-print" pathLength="1" d="M17 14h14M17 20h14M17 26h9"/>` },
    { id: "inn_anna", name: "Anna inntekt", kind: "in", color: "#b38600",
      kw: "gåve gave arv tilbakebetaling refusjon vipps anna inntekt",
      svg: `<g class="a-coin"><circle cx="24" cy="24" r="15" ${FS}/><path d="M24 15v18M19.5 19.5h6.5a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h7"/></g>` },

    // ---- Overføringar
    { id: "sparing", name: "Sparing", kind: "move", color: "#e0559a",
      kw: "sparing spare bsu sparekonto buffer fond sparemål",
      svg: `<ellipse cx="24" cy="28" rx="15" ry="11" ${FS}/><path d="M15 37v5M33 37v5"/><path d="M39 26h3v5h-3"/>
            <circle cx="32" cy="24" r="1.6" ${F} stroke="none"/><path d="M14 21l-3-5 7 2"/><path d="M20 18h8"/>
            <g class="a-drop"><circle cx="24" cy="8" r="3.5" ${F} stroke="none"/></g>` },
    { id: "nedbetaling", name: "Nedbetaling", kind: "move", color: "#6b6f86",
      kw: "kredittkort nedbetaling betale kreditt faktura",
      svg: `<g class="a-slide"><rect x="6" y="12" width="36" height="24" rx="4" ${FS}/><path d="M6 19h36"/><path class="a-draw" pathLength="1" d="M13 28l4 4 8-8"/></g>` },
    { id: "overforing", name: "Overføring", kind: "move", color: "#4a7bd0",
      kw: "overføring overføre flytte konto",
      svg: `<path class="a-r" d="M9 17h28l-6-6"/><path class="a-l" d="M39 31H11l6 6"/>` },
  ];

  // Ekstra bilete kunden kan velje til eigne kategoriar.
  const SM = (cx, cy) => `<circle class="a-smoke" cx="${cx}" cy="${cy}" r="2" ${F} stroke="none"/><circle class="a-smoke d2" cx="${cx + 1}" cy="${cy}" r="1.6" ${F} stroke="none"/>`;
  const GLYPHS = [
    ["g_hytte", "Hytte", "hytte fjellhytte sommarhus feriehus", `<path d="M6 25 24 9l18 16"/><path d="M10 22v16h28V22"/><rect x="20" y="28" width="8" height="10"/><path d="M14 16V9h4v4"/>${SM(16, 5)}`],
    ["g_bat", "Båt", "båt sjø fiske motor seglbåt hamn", `<g class="a-bob"><path d="M6 30h36l-6 8H12z" ${FS}/><path d="M24 30V8l12 18H24"/></g><path d="M4 43c4-2 6 2 10 0s6 2 10 0 6 2 10 0 6 2 10 0"/>`],
    ["g_sykkel", "Sykkel", "sykkel el-sykkel tur trening", `<path d="M12 31l8-13h10l6 13M20 18l4 13H12M30 18l-2-5h-4"/><g class="a-spin"><circle cx="12" cy="31" r="7"/><path d="M12 24v14"/></g><g class="a-spin"><circle cx="36" cy="31" r="7"/><path d="M36 24v14"/></g>`],
    ["g_rakett", "Rakett", "rakett mål drøym prosjekt oppstart", `<g class="a-lift"><path d="M24 5c7 6 9 14 7 23H17c-2-9 0-17 7-23z" ${FS}/><circle cx="24" cy="16" r="3"/><path d="M17 25l-5 7h7M31 25l5 7h-7"/></g><path class="a-steam" d="M21 36v6"/><path class="a-steam d2" d="M27 36v6"/>`],
    ["g_kamera", "Kamera", "kamera foto fotografering", `<rect x="6" y="14" width="36" height="24" rx="4" ${FS}/><path d="M17 14l3-5h8l3 5"/><circle class="a-pulse" cx="24" cy="26" r="6"/>`],
    ["g_musikk", "Musikk", "musikk konsert notar spotify instrument", `<g class="a-bounce"><path d="M18 34V12l18-4v22"/><circle cx="14" cy="34" r="4" ${F}/><circle cx="32" cy="30" r="4" ${F}/></g>`],
    ["g_gitar", "Gitar", "gitar instrument musikk band", `<g class="a-sway"><path d="M31 6l6 6-10 10"/><circle cx="19" cy="30" r="10" ${FS}/><circle cx="19" cy="30" r="3"/></g>`],
    ["g_spel", "Spel", "spel gaming playstation xbox nintendo dataspel", `<g class="a-wiggle"><path d="M14 16h20a8 8 0 0 1 8 8l1 7a5 5 0 0 1-9 3l-3-4H17l-3 4a5 5 0 0 1-9-3l1-7a8 8 0 0 1 8-8z" ${FS}/><path d="M15 21v6M12 24h6"/><circle cx="32" cy="22" r="1.7" ${F} stroke="none"/><circle cx="35" cy="26.5" r="1.7" ${F} stroke="none"/></g>`],
    ["g_bok", "Bok", "bok bøker lesing bibliotek lydbok", `<g class="a-flutter"><path d="M24 12c-5-3-12-3-18-1v27c6-2 13-2 18 1 5-3 12-3 18-1V11c-6-2-13-2-18 1z" ${FS}/><path d="M24 12v27"/></g>`],
    ["g_film", "Film", "film kino serie tv", `<rect x="6" y="12" width="36" height="26" rx="3" ${FS}/><path d="M6 18h36M6 32h36"/><path class="a-r" d="M13 12v6M21 12v6M29 12v6M37 12v6"/>`],
    ["g_blomst", "Blomster", "blomster hage plante blomsterbutikk", `<path d="M24 27v15"/><path d="M24 37c-4-4-9-3-10-1 3 3 7 3 10 1z" ${FS}/><g class="a-spark"><circle cx="24" cy="9" r="4.5" ${FS}/><circle cx="31.5" cy="14.5" r="4.5" ${FS}/><circle cx="28.5" cy="23" r="4.5" ${FS}/><circle cx="19.5" cy="23" r="4.5" ${FS}/><circle cx="16.5" cy="14.5" r="4.5" ${FS}/><circle cx="24" cy="16.5" r="3.5" ${F} stroke="none"/></g>`],
    ["g_tre", "Tre", "tre natur juletre skog hage", `<g class="a-squish"><path d="M24 6 12 22h6L10 34h28l-8-12h6z" ${FS}/></g><path d="M24 34v8"/>`],
    ["g_sol", "Sol", "sol sommar ferie syden", `<circle cx="24" cy="24" r="8" ${FS}/><g class="a-spin slow"><circle cx="24" cy="24" r="18" stroke="none"/><path d="M24 5v4M24 39v4M5 24h4M39 24h4M10.6 10.6l2.8 2.8M34.6 34.6l2.8 2.8M10.6 37.4l2.8-2.8M34.6 13.4l2.8-2.8"/></g>`],
    ["g_sno", "Snø", "snø vinter ski brøyting fyring", `<g class="a-spin slow"><path d="M24 6v36M8.4 15l31.2 18M8.4 33l31.2-18"/><path d="M19 9l5 4 5-4M19 39l5-4 5 4"/></g>`],
    ["g_ski", "Ski", "ski skisenter heiskort alpint langrenn", `<g class="a-slide"><path d="M8 32 40 16M10 39l32-16"/><path d="M18 25l4 6M27 21l4 6"/></g>`],
    ["g_telt", "Telt", "telt camping tur friluftsliv", `<path d="M24 9 6 40h36z" ${FS}/><path d="M24 9v31M18 40l6-12 6 12"/><path class="a-flutter" d="M24 9V3l7 2.5-7 2.5"/>`],
    ["g_fotball", "Fotball", "fotball sport idrett kamp", `<g class="a-spin slow"><circle cx="24" cy="24" r="16" ${FS}/><path d="M24 17l6.5 4.5-2.5 7.5h-8l-2.5-7.5z" ${F}/></g>`],
    ["g_hammar", "Verktøy", "verktøy hammar oppussing reparasjon handverkar byggevare", `<g class="a-hammer"><path d="M10 38l16-16"/><path d="M22 14l8-8 12 12-8 8z" ${FS}/></g>`],
    ["g_pensel", "Maling", "maling pensel oppussing kunst", `<path d="M30 6l11 11-12 12-7-2-2-7z" ${FS}/><path class="a-draw" pathLength="1" d="M7 38c5-7 10 3 15-3"/>`],
    ["g_pc", "Datamaskin", "data pc mac datamaskin laptop programvare", `<rect x="6" y="9" width="36" height="23" rx="3" ${FS}/><path d="M4 39h40M17 39l2-7h10l2 7"/><path class="a-flick" d="M13 20h12"/>`],
    ["g_telefon", "Telefon", "telefon mobil iphone samtale", `<g class="a-wiggle"><rect x="14" y="5" width="20" height="38" rx="4" ${FS}/><path d="M21 37h6"/></g>`],
    ["g_klokke", "Klokke", "klokke tid timar ur", `<circle cx="24" cy="24" r="17" ${FS}/><g class="a-spin slow"><circle cx="24" cy="24" r="12" stroke="none"/><path d="M24 24V13"/></g><path d="M24 24h6"/>`],
    ["g_nokkel", "Nøkkel", "nøkkel bustad utleige lås", `<g class="a-wiggle"><circle cx="15" cy="24" r="8" ${FS}/><path d="M23 24h19M36 24v6M41 24v5"/></g>`],
    ["g_lommebok", "Lommebok", "lommebok pengar kontantar lommepengar", `<rect x="6" y="14" width="36" height="25" rx="4" ${FS}/><path d="M30 23h12v8H30a4 4 0 0 1 0-8z"/><g class="a-drop"><circle cx="20" cy="7" r="3.5" ${F} stroke="none"/></g>`],
    ["g_diamant", "Diamant", "diamant smykke luksus ring", `<g class="a-spark"><path d="M14 9h20l8 10-18 21L6 19z" ${FS}/><path d="M6 19h36M18 9l-4 10 10 21 10-21-4-10"/></g>`],
    ["g_krone", "Krone", "krone premie vinn konkurranse", `<g class="a-bob"><path d="M8 34 6 14l10 8 8-12 8 12 10-8-2 20z" ${FS}/></g><path d="M8 40h32"/>`],
    ["g_pizza", "Pizza", "pizza mat takeaway fredagspizza", `<g class="a-wiggle"><path d="M24 42 8 12c10-5 22-5 32 0z" ${FS}/><circle cx="20" cy="20" r="2.5" ${F} stroke="none"/><circle cx="28" cy="24" r="2.5" ${F} stroke="none"/><circle cx="23" cy="31" r="2.5" ${F} stroke="none"/></g>`],
    ["g_vin", "Vin og drikke", "vin vinmonopolet øl drikke fest bar", `<g class="a-wiggle"><path d="M15 6h18c0 10-3 16-9 16s-9-6-9-16z" ${FS}/><path d="M24 22v16M17 40h14"/></g>`],
    ["g_kake", "Kake og fest", "kake bursdag fest selskap feiring", `<rect x="8" y="24" width="32" height="16" rx="3" ${FS}/><path d="M8 31c4 3 8 3 12 0s8-3 12 0 8 3 8 0"/><path d="M24 24v-6"/><path class="a-flick" d="M24 9c-2 3-2 5 0 6 2-1 2-3 0-6z" ${F}/>`],
    ["g_is", "Is og snop", "is snop godteri kos dessert", `<path d="M16 22l8 20 8-20"/><g class="a-bounce"><circle cx="24" cy="16" r="9" ${FS}/></g>`],
    ["g_handlepose", "Handlepose", "shopping handlepose kjøp netthandel", `<g class="a-bounce"><path d="M10 17h28l-2 25H12z" ${FS}/><path d="M18 21v-7a6 6 0 0 1 12 0v7"/></g>`],
    ["g_pakke", "Pakke", "pakke flytting post levering netthandel", `<g class="a-hop"><path d="M6 18 24 10l18 8v18l-18 8-18-8z" ${FS}/><path d="M6 18l18 8 18-8M24 26v18"/></g>`],
    ["g_lyspare", "Lyspære", "lyspære idé straum lys", `<g class="a-flick"><path d="M17 28a11 11 0 1 1 14 0c-2 2-3 4-3 6H20c0-2-1-4-3-6z" ${FS}/></g><path d="M20 39h8M21 43h6"/>`],
    ["g_pille", "Medisin", "medisin pille apotek vitaminar", `<g class="a-wiggle"><g transform="rotate(-35 24 24)"><rect x="8" y="17" width="32" height="14" rx="7" ${FS}/><path d="M24 17v14"/></g></g>`],
    ["g_tann", "Tannlege", "tann tannlege tannregulering", `<path class="a-bob" d="M14 10c4-3 7 0 10 0s6-3 10 0c4 4 2 12 0 16-1 4-2 14-5 14s-3-9-5-9-2 9-5 9-4-10-5-14c-2-4-4-12 0-16z" ${FS}/>`],
    ["g_saks", "Frisør", "frisør saks hår skjønnheit", `<g class="a-wiggle"><circle cx="13" cy="34" r="5"/><circle cx="13" cy="14" r="5"/><path d="M17 31 40 12M17 17l23 19"/></g>`],
    ["g_flaske", "Baby", "baby tåteflaske bleier babyutstyr", `<g class="a-sway"><rect x="16" y="16" width="16" height="26" rx="5" ${FS}/><path d="M19 16v-4h10v4M22 12c0-4 4-4 4 0M16 24h5M16 30h5"/></g>`],
    ["g_fisk", "Fisk", "fisk fiske akvarium sjømat", `<g class="a-wiggle"><path d="M6 24c8-10 22-10 30 0-8 10-22 10-30 0z" ${FS}/><path d="M36 24l7-6v12z"/><circle cx="14" cy="22" r="1.7" ${F} stroke="none"/></g>`],
    ["g_tog", "Tog", "tog jernbane pendling vy", `<g class="a-bob"><rect x="12" y="6" width="24" height="30" rx="6" ${FS}/><path d="M12 22h24"/><circle cx="18" cy="29" r="2" ${F} stroke="none"/><circle cx="30" cy="29" r="2" ${F} stroke="none"/></g><path d="M16 36l-4 6M32 36l4 6"/>`],
    ["g_pumpe", "Drivstoff", "drivstoff bensin diesel bensinstasjon", `<g class="a-squish"><rect x="9" y="8" width="18" height="34" rx="2" ${FS}/><path d="M13 14h10v8H13z"/></g><path d="M27 18h5l4 5v13a3 3 0 0 1-6 0v-8h-3"/>`],
    ["g_klode", "Verda", "verda reise utland valuta jordklode", `<circle cx="24" cy="24" r="17" ${FS}/><g class="a-r"><path d="M7 24h34M24 7c-6 6-6 28 0 34M24 7c6 6 6 28 0 34"/></g>`],
    ["g_bjelle", "Varsel", "varsel bjelle påminning purring", `<g class="a-sway"><path d="M12 34c3-3 3-6 3-12a9 9 0 0 1 18 0c0 6 0 9 3 12z" ${FS}/><path d="M21 38a3 3 0 0 0 6 0"/></g>`],
    ["g_smil", "Kos", "kos glede smil anna", `<g class="a-bob"><circle cx="24" cy="24" r="17" ${FS}/><circle cx="18" cy="20" r="2" ${F} stroke="none"/><circle cx="30" cy="20" r="2" ${F} stroke="none"/><path d="M17 29c4 4 10 4 14 0"/></g>`],
    ["g_hjarte", "Hjarte", "hjarte kjærast date veldedighet gåve", `<path class="a-beat" d="M24 39S8 29 8 18a8 8 0 0 1 16-3 8 8 0 0 1 16 3c0 11-16 21-16 21z" ${FS}/><path class="a-tw" d="M40 6v6M37 9h6"/>`],
    ["g_graf", "Investering", "investering aksjar fond krypto graf", `<path d="M6 40h36"/><path class="a-draw" pathLength="1" d="M8 34l9-9 7 6 14-16"/><path d="M31 15h7v7"/>`],
    ["g_skule", "Skulesekk", "skule skulesekk skulestart elev", `<g class="a-bob"><rect x="11" y="13" width="26" height="29" rx="7" ${FS}/><path d="M19 13v-3a5 5 0 0 1 10 0v3M17 28h14v7H17z"/></g>`],
    ["g_hund", "Hund", "hund valp dyr hundefôr", `<g class="a-wiggle"><path d="M14 18c0-6 4-10 10-10s10 4 10 10v8c0 7-4 12-10 12s-10-5-10-12z" ${FS}/><path d="M14 14 8 22l5 3M34 14l6 8-5 3"/><circle cx="20" cy="21" r="1.7" ${F} stroke="none"/><circle cx="28" cy="21" r="1.7" ${F} stroke="none"/><path d="M22 29h4l-2 2z" ${F}/></g>`],
  ];
  const LIB = [
    ...GLYPHS.map(([id, label, kw, svg]) => ({ id, label, kw, svg })),
    ...CATS.map(c => ({ id: c.id, label: c.name, kw: c.kw, svg: c.svg })),
  ];
  const LIB_BY_ID = Object.fromEntries(LIB.map(g => [g.id, g]));
  const COLORS = ["#e2683c", "#d6453d", "#d6457a", "#c14fb0", "#8b4fd8", "#6c5ce7", "#4f63d8", "#3a7bd5", "#2c8fd6", "#1b9aa0", "#2a9a8b", "#1f9a60", "#3a9d58", "#d99a00", "#9b6a43", "#6b6f86"];

  const ACC_TYPES = {
    bank:   { name: "Bankkonto",  svg: `<path d="M6 18 24 8l18 10"/><path d="M10 20v14M19 20v14M29 20v14M38 20v14"/><path d="M6 38h36"/>` },
    cash:   { name: "Kontantar",  svg: `<rect x="5" y="13" width="38" height="22" rx="3"/><circle cx="24" cy="24" r="5"/><path d="M10 18v.01M38 30v.01"/>` },
    credit: { name: "Kredittkort", svg: `<rect x="6" y="12" width="36" height="24" rx="4"/><path d="M6 19h36"/><path d="M12 29h8"/>` },
    saving: { name: "Sparekonto", svg: `<ellipse cx="24" cy="27" rx="15" ry="11"/><path d="M15 36v5M33 36v5"/><path d="M20 17h8"/><circle cx="32" cy="23" r="1.4" fill="currentColor" stroke="none"/>` },
  };

  function icon(cat, extra = "") {
    const c = typeof cat === "string" ? CAT_BY_ID[cat] || CAT_BY_ID.anna : cat;
    return `<span class="ic ${extra}" style="--cat:${c.color}" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${c.svg}</svg></span>`;
  }
  function accIcon(type) {
    const t = ACC_TYPES[type] || ACC_TYPES.bank;
    return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${t.svg}</svg>`;
  }

  const CAT_BY_ID = Object.fromEntries(CATS.map(c => [c.id, c]));

  // Eigne kategoriar frå kunden: { id, name, kind, color, glyph }.
  function setCustom(list) {
    for (let i = CATS.length - 1; i >= 0; i--) if (CATS[i].custom) { delete CAT_BY_ID[CATS[i].id]; CATS.splice(i, 1); }
    for (const u of list || []) {
      const g = LIB_BY_ID[u.glyph] || LIB_BY_ID.anna;
      const c = { id: u.id, name: u.name, kind: u.kind, color: u.color, svg: g.svg, kw: (u.name || "").toLowerCase(), custom: true };
      CATS.push(c); CAT_BY_ID[c.id] = c;
    }
  }
  function glyphIcon(id, extra = "") {
    const g = LIB_BY_ID[id] || LIB_BY_ID.anna;
    return `<span class="ic ${extra}" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${g.svg}</svg></span>`;
  }

  // Finn kategoriar som passar til eit namn (t.d. «Boliglån» → Heim).
  function suggest(text, kind) {
    const t = (text || "").toLowerCase().trim();
    if (t.length < 2) return [];
    const words = t.split(/[\s,.\-/]+/).filter(w => w.length >= 2);
    const scored = CATS.filter(c => !kind || c.kind === kind).map(c => {
      const kws = c.kw.split(" ");
      let s = 0;
      for (const w of words) for (const k of kws) {
        if (k === w) s += 3; else if (k.startsWith(w) || w.startsWith(k)) s += 2; else if (w.length >= 4 && k.includes(w)) s += 1;
      }
      if (c.name.toLowerCase().includes(t)) s += 2;
      if (c.custom && s > 0) s += 2;
      return { c, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    return scored.slice(0, 3).map(x => x.c);
  }

  window.PF_ICONS = { CATS, CAT_BY_ID, ACC_TYPES, LIB, LIB_BY_ID, COLORS, icon, accIcon, glyphIcon, suggest, setCustom };
})();
