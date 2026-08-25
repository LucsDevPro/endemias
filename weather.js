// ============================================================
// Previsão do tempo — Painel de Endemias (versão PRO)
// ============================================================

(function () {
  "use strict";

  var LAT = -22.53;
  var LON = -55.72;
  var INTERVALO_ATUALIZACAO_MS = 30 * 60 * 1000;
  var DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // [ícone, nome, classe-anim, cor-brilho, gradiente-fundo]
  var CODIGO_TEMPO = {
    0:  ["☀️","Céu limpo",          "anim-sol",    "#ffd54a","linear-gradient(135deg,#1a1a2e,#2d2416)"],
    1:  ["🌤️","Poucas nuvens",      "anim-sol",    "#ffe08a","linear-gradient(135deg,#1a1a2e,#2a2318)"],
    2:  ["⛅","Parc. nublado",      "anim-nuvem",  "#90a4ae","linear-gradient(135deg,#1a1a2e,#1e2530)"],
    3:  ["☁️","Nublado",            "anim-nuvem",  "#78909c","linear-gradient(135deg,#1a1a2e,#1c2330)"],
    45: ["🌫️","Nevoeiro",           "anim-neblina","#b0bec5","linear-gradient(135deg,#1a1a2e,#202530)"],
    48: ["🌫️","Nevoeiro",           "anim-neblina","#b0bec5","linear-gradient(135deg,#1a1a2e,#202530)"],
    51: ["🌦️","Garoa fraca",        "anim-chuva",  "#81d4fa","linear-gradient(135deg,#1a1a2e,#162033)"],
    53: ["🌦️","Garoa",              "anim-chuva",  "#4fc3f7","linear-gradient(135deg,#1a1a2e,#121e33)"],
    55: ["🌧️","Garoa forte",        "anim-chuva",  "#29b6f6","linear-gradient(135deg,#1a1a2e,#101c33)"],
    56: ["🌧️","Garoa gelada",       "anim-chuva",  "#4dd0e1","linear-gradient(135deg,#1a1a2e,#122033)"],
    57: ["🌧️","Garoa gelada",       "anim-chuva",  "#4dd0e1","linear-gradient(135deg,#1a1a2e,#122033)"],
    61: ["🌧️","Chuva fraca",        "anim-chuva",  "#29b6f6","linear-gradient(135deg,#1a1a2e,#101c33)"],
    63: ["🌧️","Chuva",              "anim-chuva",  "#039be5","linear-gradient(135deg,#1a1a2e,#0e1a2e)"],
    65: ["🌧️","Chuva forte",        "anim-chuva",  "#0277bd","linear-gradient(135deg,#1a1a2e,#0c1828)"],
    66: ["🌧️","Chuva gelada",       "anim-chuva",  "#4dd0e1","linear-gradient(135deg,#1a1a2e,#122033)"],
    67: ["🌧️","Chuva gelada",       "anim-chuva",  "#4dd0e1","linear-gradient(135deg,#1a1a2e,#122033)"],
    71: ["🌨️","Neve fraca",         "anim-neve",   "#e1f5fe","linear-gradient(135deg,#1a1a2e,#1e2535)"],
    73: ["🌨️","Neve",               "anim-neve",   "#e1f5fe","linear-gradient(135deg,#1a1a2e,#1e2535)"],
    75: ["🌨️","Neve forte",         "anim-neve",   "#e1f5fe","linear-gradient(135deg,#1a1a2e,#1e2535)"],
    77: ["🌨️","Neve",               "anim-neve",   "#e1f5fe","linear-gradient(135deg,#1a1a2e,#1e2535)"],
    80: ["🌦️","Pancadas",           "anim-chuva",  "#039be5","linear-gradient(135deg,#1a1a2e,#0e1a2e)"],
    81: ["🌧️","Pancadas",           "anim-chuva",  "#0277bd","linear-gradient(135deg,#1a1a2e,#0c1828)"],
    82: ["⛈️","Pancadas fortes",    "anim-tempest","#7986cb","linear-gradient(135deg,#1a1a2e,#16122e)"],
    85: ["🌨️","Nevascas",           "anim-neve",   "#e1f5fe","linear-gradient(135deg,#1a1a2e,#1e2535)"],
    86: ["🌨️","Nevascas",           "anim-neve",   "#e1f5fe","linear-gradient(135deg,#1a1a2e,#1e2535)"],
    95: ["⛈️","Trovoada",           "anim-tempest","#9575cd","linear-gradient(135deg,#1a1a2e,#18102e)"],
    96: ["⛈️","Trovoada c/ granizo","anim-tempest","#9575cd","linear-gradient(135deg,#1a1a2e,#18102e)"],
    99: ["⛈️","Trovoada c/ granizo","anim-tempest","#9575cd","linear-gradient(135deg,#1a1a2e,#18102e)"]
  };

  function nomeDia(isoData, hoje) {
    var p = isoData.split("-");
    var d = new Date(parseInt(p[0],10), parseInt(p[1],10)-1, parseInt(p[2],10));
    if (isoData === hoje) return "Hoje";
    return DIAS_SEMANA[d.getDay()];
  }

  // Contador animado 0 → valor real (ease-out cubic)
  function animarNumero(el, alvo) {
    var duracao = 900;
    var t0 = performance.now();
    function passo(t) {
      var p = Math.min((t - t0) / duracao, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(alvo * eased) + "\u00B0";
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  // Cria partículas de chuva dentro do card
  function criarChuva(container, qtd) {
    for (var i = 0; i < qtd; i++) {
      var g = document.createElement("i");
      g.className = "ws-gota";
      g.style.left = (Math.random() * 100) + "%";
      g.style.animationDelay = (Math.random() * 1.5) + "s";
      g.style.animationDuration = (0.6 + Math.random() * 0.6) + "s";
      container.appendChild(g);
    }
  }

  // Cria flocos de neve dentro do card
  function criarNeve(container, qtd) {
    for (var i = 0; i < qtd; i++) {
      var f = document.createElement("i");
      f.className = "ws-floco";
      f.style.left = (Math.random() * 100) + "%";
      f.style.animationDelay = (Math.random() * 2) + "s";
      f.style.animationDuration = (1.5 + Math.random() * 1.5) + "s";
      f.style.fontSize = (6 + Math.random() * 6) + "px";
      container.appendChild(f);
    }
  }

  function renderizar(dados) {
    var faixa = document.getElementById("climaFaixa");
    var wrap = faixa;
    if (!faixa || !wrap || !dados || !dados.daily) return;

    var d = dados.daily;
    var hojeIso = d.time[0];
    wrap.innerHTML = "";

    for (var i = 0; i < d.time.length && i < 5; i++) {
      var info  = CODIGO_TEMPO[d.weather_code[i]] || ["🌡️","—","","#90a4ae","#1a1a2e"];
      var max   = Math.round(d.temperature_2m_max[i]);
      var min   = Math.round(d.temperature_2m_min[i]);
      var ehHoje = d.time[i] === hojeIso;
      var animClass = info[2];

      var item = document.createElement("div");
      item.className =
        "weather-strip__dia ws-card" +
        (ehHoje ? " ws-hoje" : "");
      item.title = info[1];
      item.style.setProperty("--brilho", info[3]);
      item.style.setProperty("--fundo",  info[4]);

      // Entrada em cascata com bounce
      item.style.opacity   = "0";
      item.style.transform = "translateY(20px) scale(0.85)";
      item.style.transition =
        "opacity .55s cubic-bezier(0.34,1.56,0.64,1)," +
        "transform .55s cubic-bezier(0.34,1.56,0.64,1)";
      item.style.transitionDelay = (i * 110) + "ms";

      item.innerHTML =
        // partículas (preenchidas via JS abaixo)
        '<span class="ws-particulas" aria-hidden="true"></span>' +
        // flash de raio (só tempestades)
        '<span class="ws-raio" aria-hidden="true"></span>' +
        // conteúdo
        '<span class="weather-strip__nome ws-nome">' + nomeDia(d.time[i], hojeIso) + "</span>" +
        '<span class="weather-strip__icone ws-icone ' + animClass + '" aria-hidden="true">' +
          info[0] +
        "</span>" +
        '<span class="weather-strip__temp ws-temp">' +
          '<b class="wt-max">0\u00B0</b>' +
          '<b class="wt-min">0\u00B0</b>' +
        "</span>";

      wrap.appendChild(item);

      // Partículas conforme tipo
      var partic = item.querySelector(".ws-particulas");
      if (animClass === "anim-chuva")  criarChuva(partic, 8);
      if (animClass === "anim-neve")   criarNeve(partic,  6);
      if (animClass === "anim-tempest") criarChuva(partic, 8);

      // Dispara entrada + contadores
      (function (el, mx, mn, delay) {
        requestAnimationFrame(function () {
          el.style.opacity   = "1";
          el.style.transform = "translateY(0) scale(1)";
        });
        setTimeout(function () {
          var elMax = el.querySelector(".wt-max");
          var elMin = el.querySelector(".wt-min");
          if (elMax) animarNumero(elMax, mx);
          if (elMin) animarNumero(elMin, mn);
        }, delay + 300);
      })(item, max, min, i * 110);
    }

    faixa.hidden = false;

    if (typeof window.reajustarEscalaPainel === "function") {
      window.reajustarEscalaPainel();
    }
  }

  function buscar() {
    var url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + LAT + "&longitude=" + LON +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&timezone=America%2FCampo_Grande&forecast_days=5";

    fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(renderizar)
      .catch(function (e) {
        console.warn("Previsão do tempo indisponível:", e.message);
      });
  }

  function iniciar() {
    if (!document.getElementById("climaFaixa")) return;
    buscar();
    setInterval(buscar, INTERVALO_ATUALIZACAO_MS);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") buscar();
    });
  }

  // ============================================================
  //  CSS — injetado uma única vez pelo próprio JS
  // ============================================================
  function injetarCSS() {
    if (document.getElementById("ws-anim-css")) return;
    var s = document.createElement("style");
    s.id = "ws-anim-css";
    s.textContent = [

      /* === CARD BASE === */
      ".ws-card {",
      "  position: relative;",
      "  overflow: hidden;",
      "  border-radius: 12px;",
      "  background: var(--fundo, #1a1a2e);",
      "  box-shadow: 0 2px 8px rgba(0,0,0,.45);",
      "  will-change: transform, opacity;",
      "  cursor: default;",
      "  transition: transform .22s ease, box-shadow .22s ease;",
      "}",

      /* brilho pulsante */
      ".ws-card::after {",
      "  content: '';",
      "  position: absolute;",
      "  top: 0; right: 0; bottom: 0; left: 0;",
      "  border-radius: inherit;",
      "  box-shadow: 0 0 0 0 var(--brilho, transparent);",
      "  animation: wsPulso 3.2s ease-in-out infinite;",
      "  pointer-events: none;",
      "}",
      "@keyframes wsPulso {",
      "  0%,100% { box-shadow: 0 0 5px 0 var(--brilho); opacity:.4; }",
      "  50%     { box-shadow: 0 0 18px 4px var(--brilho); opacity:.8; }",
      "}",

      /* linha de brilho deslizante (shimmer) */
      ".ws-card::before {",
      "  content: '';",
      "  position: absolute; top: 0; left: -75%;",
      "  width: 50%; height: 100%;",
      "  background: linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);",
      "  animation: wsShimmer 5s ease-in-out infinite;",
      "  pointer-events: none; z-index: 1;",
      "}",
      "@keyframes wsShimmer {",
      "  0%   { left: -75%; }",
      "  60%,100% { left: 125%; }",
      "}",

      /* === HOJE === */
      ".ws-hoje {",
      "  outline: 1.5px solid var(--brilho);",
      "  outline-offset: -1.5px;",
      "}",
      ".ws-hoje::after { animation-duration: 1.8s !important; }",

      /* selo AGORA */
      ".ws-hoje .ws-nome::after {",
      "  content: ' \u25CF';",
      "  color: var(--brilho);",
      "  font-size: .5em;",
      "  vertical-align: middle;",
      "  animation: wsPisca 1.4s steps(1) infinite;",
      "}",
      "@keyframes wsPisca {",
      "  0%,55%  { opacity:1; }",
      "  56%,100%{ opacity:0; }",
      "}",

      /* === HOVER === */
      ".ws-card:hover {",
      "  transform: translateY(-5px) scale(1.06) !important;",
      "  box-shadow: 0 12px 28px -8px var(--brilho) !important;",
      "  z-index: 3;",
      "}",
      ".ws-card:hover .ws-icone { transform: scale(1.2); }",

      /* === ÍCONE === */
      ".ws-icone {",
      "  display: block;",
      "  position: relative; z-index: 2;",
      "  transform-origin: center;",
      "  transition: transform .2s ease;",
      "  line-height: 1;",
      "  filter: drop-shadow(0 0 4px var(--brilho));",
      "}",

      /* === TEMPERATURAS === */
      ".wt-max {",
      "  display: block;",
      "  font-weight: 700;",
      "  color: #f0f4ff;",
      "  line-height: 1;",
      "}",
      ".wt-min {",
      "  display: block;",
      "  font-weight: 400;",
      "  opacity: .6;",
      "  line-height: 1;",
      "}",

      /* === PARTÍCULAS === */
      ".ws-particulas {",
      "  position: absolute;",
      "  top: 0; left: 0; right: 0; bottom: 0;",
      "  pointer-events: none; z-index: 0; overflow: hidden;",
      "  border-radius: inherit;",
      "}",

      /* gotas de chuva */
      ".ws-gota {",
      "  position: absolute; top: -10px;",
      "  width: 1.5px; height: 8px;",
      "  background: linear-gradient(180deg, transparent, rgba(130,210,255,.7));",
      "  border-radius: 2px;",
      "  font-style: normal;",
      "  animation: wsGota linear infinite;",
      "}",
      "@keyframes wsGota {",
      "  0%  { top: -10px; opacity: .8; }",
      "  80% { opacity: .6; }",
      "  100%{ top: 110%; opacity: 0; }",
      "}",

      /* flocos de neve */
      ".ws-floco {",
      "  position: absolute; top: -10px;",
      "  color: rgba(220,240,255,.75);",
      "  font-style: normal;",
      "  animation: wsFloco ease-in-out infinite;",
      "}",
      "@keyframes wsFloco {",
      "  0%  { top: -10px; opacity: .8; transform: translateX(0) rotate(0deg); }",
      "  50% { transform: translateX(5px) rotate(180deg); }",
      "  100%{ top: 110%; opacity: 0; transform: translateX(-4px) rotate(360deg); }",
      "}",

      /* flash de raio */
      ".ws-raio {",
      "  position: absolute;",
      "  top: 0; right: 0; bottom: 0; left: 0;",
      "  border-radius: inherit;",
      "  background: radial-gradient(ellipse at 50% 40%, rgba(200,180,255,.55), transparent 70%);",
      "  opacity: 0; pointer-events: none; z-index: 1;",
      "}",
      ".anim-tempest ~ .ws-raio,",
      ".ws-card:has(.anim-tempest) .ws-raio {",
      "  animation: wsRaio 5s ease-in-out infinite;",
      "}",
      /* fallback sem :has */
      ".ws-card .anim-tempest { animation: climaTreme .38s ease-in-out infinite; }",
      "@keyframes climaTreme {",
      "  0%,100% { transform: translate(0,0) scale(1); }",
      "  20%     { transform: translate(-1.5px,1px) scale(1.02); }",
      "  80%     { transform: translate(1.5px,-1px) scale(.98); }",
      "}",
      "@keyframes wsRaio {",
      "  0%,82%,100% { opacity:0; }",
      "  83%,87%     { opacity:1; }",
      "  84%,86%     { opacity:.1; }",
      "  88%,91%     { opacity:.8; }",
      "  89%         { opacity:.05; }",
      "}",

      /* === ANIMAÇÕES DOS ÍCONES === */

      /* ☀️ sol gira + pulsa */
      ".anim-sol { animation: wsSol 9s linear infinite; }",
      "@keyframes wsSol {",
      "  0%   { transform: rotate(0deg) scale(1); }",
      "  50%  { transform: rotate(180deg) scale(1.08); }",
      "  100% { transform: rotate(360deg) scale(1); }",
      "}",

      /* ☁️ nuvem balança */
      ".anim-nuvem { animation: wsNuvem 3.5s ease-in-out infinite; }",
      "@keyframes wsNuvem {",
      "  0%,100% { transform: translateX(-3px) translateY(0); }",
      "  50%     { transform: translateX(3px) translateY(-2px); }",
      "}",

      /* 🌧️ chuva cai */
      ".anim-chuva { animation: wsChuvaIcone 1.2s ease-in-out infinite; }",
      "@keyframes wsChuvaIcone {",
      "  0%,100% { transform: translateY(0) rotate(-3deg); }",
      "  50%     { transform: translateY(4px) rotate(3deg); }",
      "}",

      /* 🌨️ neve roda devagar */
      ".anim-neve { animation: wsNeve 12s linear infinite; }",
      "@keyframes wsNeve {",
      "  from { transform: rotate(0deg); }",
      "  to   { transform: rotate(360deg); }",
      "}",

      /* 🌫️ neblina pulsa */
      ".anim-neblina { animation: wsNeblina 2.8s ease-in-out infinite; }",
      "@keyframes wsNeblina {",
      "  0%,100% { opacity:.5; transform: scaleX(1); }",
      "  50%     { opacity:1; transform: scaleX(1.05); }",
      "}",

      /* === ACESSIBILIDADE === */
      "@media (prefers-reduced-motion: reduce) {",
      "  .ws-card::before, .ws-card::after,",
      "  .ws-gota, .ws-floco, .ws-raio,",
      "  .anim-sol, .anim-nuvem, .anim-chuva,",
      "  .anim-neve, .anim-neblina, .anim-tempest {",
      "    animation: none !important;",
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
