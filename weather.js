// ============================================================
// Previsão do tempo — Painel de Endemias
//
// Open-Meteo (sem chave). Mostra 5 dias + gráfico de temperatura
// por hora ao passar o mouse (estilo Climatempo).
// Atualiza a cada 30 min e ao reabrir a aba.
// ============================================================

(function () {
  "use strict";

  var LAT = -22.53;
  var LON = -55.72;
  var INTERVALO_ATUALIZACAO_MS = 30 * 60 * 1000;
  var DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // [ícone, legenda, classe-anim, cor-destaque]
  var CODIGO_TEMPO = {
    0:  ["☀️",  "Céu limpo",     "anim-sol",     "#FFB900"],
    1:  ["🌤️",  "Poucas nuvens", "anim-sol",     "#FFB900"],
    2:  ["⛅",   "Parc. nublado", "anim-nuvem",   "#007ECA"],
    3:  ["☁️",  "Nublado",       "anim-nuvem",   "#5D6B82"],
    45: ["🌫️",  "Nevoeiro",      "anim-neblina", "#8A96A8"],
    48: ["🌫️",  "Nevoeiro",      "anim-neblina", "#8A96A8"],
    51: ["🌦️",  "Garoa fraca",   "anim-garoa",   "#64B5F6"],
    53: ["🌦️",  "Garoa",         "anim-garoa",   "#64B5F6"],
    55: ["🌦️",  "Garoa forte",   "anim-garoa",   "#42A5F5"],
    56: ["🌧️",  "Garoa gelada",  "anim-garoa",   "#4DD0E1"],
    57: ["🌧️",  "Garoa gelada",  "anim-garoa",   "#4DD0E1"],
    61: ["🌧️",  "Chuva fraca",   "anim-chuva",   "#007ECA"],
    63: ["🌧️",  "Chuva",         "anim-chuva",   "#0064A5"],
    65: ["🌧️",  "Chuva forte",   "anim-chuva",   "#004E86"],
    66: ["🌧️",  "Chuva gelada",  "anim-chuva",   "#0092B8"],
    67: ["🌧️",  "Chuva gelada",  "anim-chuva",   "#0092B8"],
    71: ["🌨️",  "Neve fraca",    "anim-neve",    "#7FB8DC"],
    73: ["🌨️",  "Neve",          "anim-neve",    "#7FB8DC"],
    75: ["🌨️",  "Neve forte",    "anim-neve",    "#7FB8DC"],
    77: ["🌨️",  "Neve",          "anim-neve",    "#7FB8DC"],
    80: ["🌦️",  "Pancadas",      "anim-chuva",   "#0064A5"],
    81: ["🌧️",  "Pancadas",      "anim-chuva",   "#0064A5"],
    82: ["⛈️",  "Temp. forte",   "anim-tempest", "#5E4FA2"],
    85: ["🌨️",  "Nevascas",      "anim-neve",    "#7FB8DC"],
    86: ["🌨️",  "Nevascas",      "anim-neve",    "#7FB8DC"],
    95: ["⛈️",  "Trovoada",      "anim-tempest", "#5E4FA2"],
    96: ["⛈️",  "C/ granizo",    "anim-tempest", "#5E4FA2"],
    99: ["⛈️",  "C/ granizo",    "anim-tempest", "#5E4FA2"]
  };

  // guarda os dados por hora entre buscas (chave = "YYYY-MM-DD")
  var horariosPorDia = {};

  function nomeDia(isoData, hoje) {
    var p = isoData.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (isoData === hoje) return "Hoje";
    return DIAS_SEMANA[d.getDay()];
  }

  function animarNumero(el, alvo) {
    var duracao = 800;
    var t0 = performance.now();
    function passo(t) {
      var p = Math.min((t - t0) / duracao, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(alvo * eased) + "\u00B0";
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  // ----------------------------------------------------------
  //  Gráfico SVG de temperatura por hora (tooltip no hover)
  // ----------------------------------------------------------
  var tooltipEl = null;

  function garantirTooltip() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement("div");
    tooltipEl.className = "ws-tooltip";
    tooltipEl.setAttribute("role", "tooltip");
    tooltipEl.hidden = true;
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  function montarGrafico(isoData, cor) {
    var horas = horariosPorDia[isoData];
    if (!horas || !horas.length) return null;

    // dimensões do SVG — tamanho padrão de tooltip (era grande demais)
    var W = 260, H = 130;
    var padL = 8, padR = 8, padT = 16, padB = 18;
    var gw = W - padL - padR;
    var gh = H - padT - padB;

    var temps = horas.map(function (h) { return h.temp; });
    var minT = Math.min.apply(null, temps);
    var maxT = Math.max.apply(null, temps);
    if (minT === maxT) { maxT = minT + 1; } // evita divisão por zero

    var n = horas.length;
    function px(i) { return padL + (n === 1 ? gw / 2 : (i / (n - 1)) * gw); }
    function py(t) { return padT + gh - ((t - minT) / (maxT - minT)) * gh; }

    // caminho da linha
    var linha = "";
    var area = "M" + px(0) + "," + (padT + gh);
    for (var i = 0; i < n; i++) {
      var x = px(i).toFixed(1);
      var y = py(horas[i].temp).toFixed(1);
      linha += (i === 0 ? "M" : "L") + x + "," + y + " ";
      area += " L" + x + "," + y;
    }
    area += " L" + px(n - 1) + "," + (padT + gh) + " Z";

    // pontos + rótulos de hora (só de 3 em 3 pra não poluir)
    var pontos = "";
    var rotulos = "";
    var valores = "";
    for (var j = 0; j < n; j++) {
      var cx = px(j).toFixed(1);
      var cy = py(horas[j].temp).toFixed(1);
      pontos += '<circle cx="' + cx + '" cy="' + cy + '" r="2" fill="' + cor + '"/>';
      if (j % 3 === 0) {
        rotulos += '<text x="' + cx + '" y="' + (H - 8) +
          '" class="ws-tt-hora" text-anchor="middle">' + horas[j].hora + "h</text>";
        valores += '<text x="' + cx + '" y="' + (parseFloat(cy) - 6) +
          '" class="ws-tt-val" text-anchor="middle">' +
          Math.round(horas[j].temp) + "\u00B0</text>";
      }
    }

    var svg =
      '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" ' +
        'xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
          '<linearGradient id="wsGrad" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="' + cor + '" stop-opacity="0.28"/>' +
            '<stop offset="100%" stop-color="' + cor + '" stop-opacity="0"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<path d="' + area + '" fill="url(#wsGrad)"/>' +
        '<path d="' + linha + '" fill="none" stroke="' + cor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        pontos + valores + rotulos +
      "</svg>";

    return svg;
  }

  function mostrarTooltip(isoData, cor, legenda, alvoEl) {
    var svg = montarGrafico(isoData, cor);
    if (!svg) return; // sem dados por hora ainda

    var tt = garantirTooltip();
    tt.style.setProperty("--ws-cor", cor);
    tt.innerHTML =
      '<div class="ws-tt-titulo">' + legenda + " &middot; por hora</div>" + svg;
    tt.hidden = false;

    // posiciona acima do card (ou abaixo se não couber)
    var r = alvoEl.getBoundingClientRect();
    var ttR = tt.getBoundingClientRect();
    var left = r.left + r.width / 2 - ttR.width / 2 + window.scrollX;
    var top = r.top - ttR.height - 10 + window.scrollY;

    // não deixa sair da tela na horizontal
    var margem = 8;
    if (left < margem + window.scrollX) left = margem + window.scrollX;
    var limiteDir = window.scrollX + document.documentElement.clientWidth - ttR.width - margem;
    if (left > limiteDir) left = limiteDir;

    // se não couber em cima, mostra embaixo
    var abaixo = false;
    if (top < window.scrollY + margem) {
      top = r.bottom + 10 + window.scrollY;
      abaixo = true;
    }

    tt.classList.toggle("ws-tooltip--abaixo", abaixo);
    tt.style.left = Math.round(left) + "px";
    tt.style.top = Math.round(top) + "px";
    requestAnimationFrame(function () { tt.classList.add("ws-tooltip--visivel"); });
  }

  function esconderTooltip() {
    if (!tooltipEl) return;
    tooltipEl.classList.remove("ws-tooltip--visivel");
    tooltipEl.hidden = true;
  }

  function renderizar(dados) {
    var faixa = document.getElementById("climaFaixa");
    var wrap = faixa;
    if (!faixa || !wrap || !dados || !dados.daily) return;

    var d = dados.daily;
    var hojeIso = d.time[0];

    // organiza os dados por hora agrupados por dia
    horariosPorDia = {};
    if (dados.hourly && dados.hourly.time) {
      var ht = dados.hourly.time;
      var htemp = dados.hourly.temperature_2m;
      for (var k = 0; k < ht.length; k++) {
        var iso = ht[k].slice(0, 10);      // "YYYY-MM-DD"
        var hh = parseInt(ht[k].slice(11, 13), 10); // hora
        if (!horariosPorDia[iso]) horariosPorDia[iso] = [];
        horariosPorDia[iso].push({ hora: hh, temp: htemp[k] });
      }
    }

    wrap.innerHTML = "";

    for (var i = 0; i < d.time.length && i < 5; i++) {
      var info   = CODIGO_TEMPO[d.weather_code[i]] || ["🌡️", "—", "", "#5D6B82"];
      var max    = Math.round(d.temperature_2m_max[i]);
      var min    = Math.round(d.temperature_2m_min[i]);
      var ehHoje = d.time[i] === hojeIso;
      var iso    = d.time[i];

      var item = document.createElement("div");
      item.className = "weather-strip__dia ws-anim" + (ehHoje ? " ws-hoje" : "");
      item.title = ""; // remove o title nativo (usamos tooltip próprio)
      item.style.setProperty("--ws-cor", info[3]);
      item.style.animationDelay = (i * 90) + "ms";

      item.innerHTML =
        '<span class="weather-strip__nome">' + nomeDia(iso, hojeIso) + "</span>" +
        '<span class="weather-strip__icone ' + info[2] + '" aria-hidden="true">' + info[0] + "</span>" +
        '<span class="weather-strip__temp">' +
          '<strong class="wt-max">' + max + "\u00B0</strong> " +
          '<span class="wt-min">' + min + "\u00B0</span>" +
        "</span>" +
        '<span class="ws-desc">' + info[1] + "</span>";

      wrap.appendChild(item);

      // eventos de hover para o gráfico
      (function (el, isoDia, cor, legenda) {
        el.addEventListener("mouseenter", function () {
          mostrarTooltip(isoDia, cor, legenda, el);
        });
        el.addEventListener("mouseleave", esconderTooltip);
        // suporte a toque: toca uma vez mostra, toca fora esconde
        el.addEventListener("click", function () {
          if (tooltipEl && !tooltipEl.hidden) esconderTooltip();
          else mostrarTooltip(isoDia, cor, legenda, el);
        });
      })(item, iso, info[3], info[1]);

      (function (el, mx, mn, delay) {
        setTimeout(function () {
          var elMax = el.querySelector(".wt-max");
          var elMin = el.querySelector(".wt-min");
          if (elMax) animarNumero(elMax, mx);
          if (elMin) animarNumero(elMin, mn);
        }, delay + 200);
      })(item, max, min, i * 90);
    }

    faixa.hidden = false;

    if (typeof window.reajustarEscalaPainel === "function") {
      window.reajustarEscalaPainel();
    }
  }

  function buscar() {
    var url = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + LAT + "&longitude=" + LON +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&hourly=temperature_2m" +          // ← dados por hora p/ o gráfico
      "&timezone=America%2FCampo_Grande&forecast_days=5";

    fetch(url, { cache: "no-store" })
      .then(function (resp) {
        if (!resp.ok) throw new Error("resposta " + resp.status);
        return resp.json();
      })
      .then(renderizar)
      .catch(function (err) {
        console.warn("Previsão do tempo indisponível:", err.message);
      });
  }

  function iniciar() {
    if (!document.getElementById("climaFaixa")) return;
    buscar();
    setInterval(buscar, INTERVALO_ATUALIZACAO_MS);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") buscar();
    });
    // esconde o gráfico ao rolar a página
    window.addEventListener("scroll", esconderTooltip, { passive: true });
  }

  function injetarCSS() {
    if (document.getElementById("ws-anim-css")) return;
    var s = document.createElement("style");
    s.id = "ws-anim-css";
    s.textContent = [

      /* entrada em cascata */
      ".ws-anim {",
      "  position: relative;",
      "  animation: wsEntrada .55s cubic-bezier(.34,1.56,.64,1) backwards;",
      "}",
      "@keyframes wsEntrada {",
      "  from { opacity: 0; transform: translateY(14px) scale(.92); }",
      "  to   { opacity: 1; transform: translateY(0) scale(1); }",
      "}",

      /* barrinha colorida no topo */
      ".ws-anim::before {",
      "  content: '';",
      "  position: absolute;",
      "  top: 0; left: 18%; right: 18%;",
      "  height: 3px;",
      "  border-radius: 0 0 999px 999px;",
      "  background: var(--ws-cor);",
      "  opacity: .85;",
      "}",

      /* legenda */
      ".ws-desc {",
      "  font-size: 0.88rem; font-weight: 600;",
      "  color: var(--ws-cor); letter-spacing: 0.01em;",
      "  text-align: center; line-height: 1.25;",
      "  margin-top: 0.05rem; opacity: .95;",
      "  white-space: nowrap; overflow: hidden;",
      "  text-overflow: ellipsis; max-width: 100%;",
      "}",

      /* HOJE */
      ".ws-hoje {",
      "  border-color: var(--ws-cor) !important;",
      "  animation: wsEntrada .55s cubic-bezier(.34,1.56,.64,1) backwards,",
      "             wsPulsoHoje 2.4s ease-in-out .8s infinite;",
      "}",
      "@keyframes wsPulsoHoje {",
      "  0%,100% { box-shadow: var(--shadow); }",
      "  50%     { box-shadow: 0 0 0 4px rgba(0,126,202,.18), var(--shadow); }",
      "}",
      ".ws-hoje .weather-strip__nome::after {",
      "  content: ''; display: inline-block;",
      "  width: 5px; height: 5px; border-radius: 50%;",
      "  background: var(--ws-cor); margin-left: 4px;",
      "  vertical-align: middle;",
      "  animation: wsPisca 1.6s ease-in-out infinite;",
      "}",
      "@keyframes wsPisca { 0%,100% { opacity: 1; } 50% { opacity: .2; } }",

      /* hover */
      ".ws-anim:hover {",
      "  transform: translateY(-4px) scale(1.03);",
      "  border-color: var(--ws-cor);",
      "  cursor: pointer;",
      "  z-index: 4;",
      "}",
      ".ws-anim:hover .weather-strip__icone { transform: scale(1.18); }",

      ".weather-strip__icone {",
      "  display: inline-block; transform-origin: center;",
      "  transition: transform .2s ease;",
      "}",
      ".wt-min { opacity: .7; }",

      /* ícones animados */
      ".anim-sol { animation: wsSol 4s ease-in-out infinite; }",
      "@keyframes wsSol { 0%,100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.12) rotate(15deg); } }",
      ".anim-nuvem { animation: wsNuvem 4.5s ease-in-out infinite; }",
      "@keyframes wsNuvem { 0%,100% { transform: translateX(-2px); } 50% { transform: translateX(2px); } }",
      ".anim-garoa { animation: wsGaroa 3.5s ease-in-out infinite; }",
      "@keyframes wsGaroa { 0%,100% { transform: translateY(0) rotate(-1deg); opacity: 1; } 50% { transform: translateY(2px) rotate(1deg); opacity: .82; } }",
      ".anim-chuva { animation: wsChuva 1.4s ease-in-out infinite; }",
      "@keyframes wsChuva { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(5px) rotate(4deg); } }",
      ".anim-neve { animation: wsNeve 10s linear infinite; }",
      "@keyframes wsNeve { to { transform: rotate(360deg); } }",
      ".anim-neblina { animation: wsNeblina 3s ease-in-out infinite; }",
      "@keyframes wsNeblina { 0%,100% { opacity: .5; transform: scaleX(1); } 50% { opacity: 1; transform: scaleX(1.06); } }",
      ".anim-tempest { animation: wsTempest .38s ease-in-out infinite; }",
      "@keyframes wsTempest { 0%,100% { transform: translate(0,0); } 25% { transform: translate(-1.5px,1px); } 75% { transform: translate(1.5px,-1px); } }",

      /* ---------- TOOLTIP / GRÁFICO ---------- */
      ".ws-tooltip {",
      "  position: absolute; z-index: 999;",
      "  background: var(--surface, #fff);",
      "  border: 1px solid var(--border, #E3E8F0);",
      "  border-radius: var(--radius-md, 12px);",
      "  box-shadow: 0 8px 28px -8px rgba(10,30,61,.28);",
      "  padding: 0.5rem 0.6rem 0.35rem;",
      "  pointer-events: none;",
      "  opacity: 0; transform: translateY(4px) scale(.97);",
      "  transition: opacity .16s ease, transform .16s ease;",
      "  font-family: var(--font-body, sans-serif);",
      "}",
      ".ws-tooltip--visivel { opacity: 1; transform: translateY(0) scale(1); }",

      /* setinha apontando pro card */
      ".ws-tooltip::after {",
      "  content: ''; position: absolute;",
      "  left: 50%; bottom: -6px; transform: translateX(-50%) rotate(45deg);",
      "  width: 11px; height: 11px;",
      "  background: var(--surface, #fff);",
      "  border-right: 1px solid var(--border, #E3E8F0);",
      "  border-bottom: 1px solid var(--border, #E3E8F0);",
      "}",
      ".ws-tooltip--abaixo::after {",
      "  bottom: auto; top: -6px;",
      "  transform: translateX(-50%) rotate(225deg);",
      "}",

      ".ws-tt-titulo {",
      "  font-family: var(--font-display, sans-serif);",
      "  font-weight: 700; font-size: 0.85rem;",
      "  color: var(--ws-cor); text-align: center;",
      "  margin-bottom: 0.15rem; text-transform: uppercase;",
      "  letter-spacing: 0.02em;",
      "}",
      ".ws-tt-hora { font-size: 9px; fill: var(--ink-muted, #5D6B82); }",
      ".ws-tt-val  { font-size: 9.5px; font-weight: 700; fill: var(--ink, #0A1E3D); }",

      /* acessibilidade */
      "@media (prefers-reduced-motion: reduce) {",
      "  .ws-anim, .ws-hoje, .ws-hoje .weather-strip__nome::after,",
      "  .anim-sol, .anim-nuvem, .anim-garoa, .anim-chuva,",
      "  .anim-neve, .anim-neblina, .anim-tempest, .ws-tooltip {",
      "    animation: none !important; transition: none !important;",
      "  }",
      "}"

    ].join("\n");
    document.head.appendChild(s);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injetarCSS();
      iniciar();
    });
  } else {
    injetarCSS();
    iniciar();
  }
})();
