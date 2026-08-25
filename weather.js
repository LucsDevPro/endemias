// ============================================================
// Previsão do tempo — Painel de Endemias (versão PRO — tema claro)
// ============================================================

(function () {
  "use strict";

  var LAT = -22.53;
  var LON = -55.72;
  var INTERVALO_ATUALIZACAO_MS = 30 * 60 * 1000;
  var DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // [ícone, nome, classe-anim, cor-brilho]
  // cor-brilho adaptada ao tema claro do site
  var CODIGO_TEMPO = {
    0:  ["☀️", "Céu limpo",           "anim-sol",     "rgba(255,185,0,0.5)"],
    1:  ["🌤️", "Poucas nuvens",       "anim-sol",     "rgba(255,185,0,0.35)"],
    2:  ["⛅",  "Parc. nublado",       "anim-nuvem",   "rgba(93,107,130,0.3)"],
    3:  ["☁️", "Nublado",             "anim-nuvem",   "rgba(93,107,130,0.3)"],
    45: ["🌫️", "Nevoeiro",            "anim-neblina", "rgba(93,107,130,0.25)"],
    48: ["🌫️", "Nevoeiro",            "anim-neblina", "rgba(93,107,130,0.25)"],
    51: ["🌦️", "Garoa fraca",         "anim-chuva",   "rgba(0,126,202,0.35)"],
    53: ["🌦️", "Garoa",               "anim-chuva",   "rgba(0,126,202,0.4)"],
    55: ["🌧️", "Garoa forte",         "anim-chuva",   "rgba(0,126,202,0.45)"],
    56: ["🌧️", "Garoa gelada",        "anim-chuva",   "rgba(0,126,202,0.4)"],
    57: ["🌧️", "Garoa gelada",        "anim-chuva",   "rgba(0,126,202,0.4)"],
    61: ["🌧️", "Chuva fraca",         "anim-chuva",   "rgba(0,126,202,0.4)"],
    63: ["🌧️", "Chuva",               "anim-chuva",   "rgba(0,126,202,0.5)"],
    65: ["🌧️", "Chuva forte",         "anim-chuva",   "rgba(0,126,202,0.6)"],
    66: ["🌧️", "Chuva gelada",        "anim-chuva",   "rgba(0,126,202,0.4)"],
    67: ["🌧️", "Chuva gelada",        "anim-chuva",   "rgba(0,126,202,0.4)"],
    71: ["🌨️", "Neve fraca",          "anim-neve",    "rgba(0,126,202,0.25)"],
    73: ["🌨️", "Neve",                "anim-neve",    "rgba(0,126,202,0.3)"],
    75: ["🌨️", "Neve forte",          "anim-neve",    "rgba(0,126,202,0.35)"],
    77: ["🌨️", "Neve",                "anim-neve",    "rgba(0,126,202,0.3)"],
    80: ["🌦️", "Pancadas",            "anim-chuva",   "rgba(0,126,202,0.45)"],
    81: ["🌧️", "Pancadas",            "anim-chuva",   "rgba(0,126,202,0.5)"],
    82: ["⛈️", "Pancadas fortes",     "anim-tempest", "rgba(0,43,104,0.5)"],
    85: ["🌨️", "Nevascas",            "anim-neve",    "rgba(0,126,202,0.3)"],
    86: ["🌨️", "Nevascas",            "anim-neve",    "rgba(0,126,202,0.3)"],
    95: ["⛈️", "Trovoada",            "anim-tempest", "rgba(0,43,104,0.55)"],
    96: ["⛈️", "Trovoada c/ granizo", "anim-tempest", "rgba(0,43,104,0.55)"],
    99: ["⛈️", "Trovoada c/ granizo", "anim-tempest", "rgba(0,43,104,0.55)"]
  };

  function nomeDia(isoData, hoje) {
    var p = isoData.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (isoData === hoje) return "Hoje";
    return DIAS_SEMANA[d.getDay()];
  }

  // Contador animado 0 → valor real
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

  // Gotas de chuva dentro do card
  function criarChuva(container, qtd) {
    for (var i = 0; i < qtd; i++) {
      var g = document.createElement("i");
      g.className = "ws-gota";
      g.style.left              = (10 + Math.random() * 80) + "%";
      g.style.animationDelay    = (Math.random() * 1.5) + "s";
      g.style.animationDuration = (0.6 + Math.random() * 0.5) + "s";
      container.appendChild(g);
    }
  }

  // Flocos de neve dentro do card
  function criarNeve(container, qtd) {
    for (var i = 0; i < qtd; i++) {
      var f = document.createElement("i");
      f.className = "ws-floco";
      f.style.left              = (10 + Math.random() * 80) + "%";
      f.style.animationDelay    = (Math.random() * 2) + "s";
      f.style.animationDuration = (1.5 + Math.random() * 1.5) + "s";
      f.style.fontSize          = (5 + Math.random() * 5) + "px";
      container.appendChild(f);
    }
  }

  function renderizar(dados) {
    var faixa = document.getElementById("climaFaixa");
    if (!faixa || !dados || !dados.daily) return;

    var d = dados.daily;
    var hojeIso = d.time[0];
    faixa.innerHTML = "";

    for (var i = 0; i < d.time.length && i < 5; i++) {
      var info   = CODIGO_TEMPO[d.weather_code[i]] || ["🌡️", "—", "", "rgba(0,126,202,0.3)"];
      var max    = Math.round(d.temperature_2m_max[i]);
      var min    = Math.round(d.temperature_2m_min[i]);
      var ehHoje = d.time[i] === hojeIso;

      var item = document.createElement("div");

      // Mantém as classes originais do site + adiciona só as de animação
      item.className =
        "weather-strip__dia ws-anim" +
        (ehHoje ? " ws-hoje" : "");

      item.title = info[1];
      item.style.setProperty("--brilho", info[3]);

      // Entrada em cascata com bounce elástico
      item.style.opacity         = "0";
      item.style.transform       = "translateY(18px) scale(0.88)";
      item.style.transition      =
        "opacity .5s cubic-bezier(0.34,1.56,0.64,1)," +
        "transform .5s cubic-bezier(0.34,1.56,0.64,1)";
      item.style.transitionDelay = (i * 110) + "ms";

      item.innerHTML =
        // Camada de partículas (não interfere no layout)
        '<span class="ws-particulas" aria-hidden="true"></span>' +
        // Conteúdo original preservado
        '<span class="weather-strip__nome">' +
          nomeDia(d.time[i], hojeIso) +
          (ehHoje ? '<span class="ws-dot" aria-hidden="true"></span>' : '') +
        '</span>' +
        '<span class="weather-strip__icone ' + info[2] + '" aria-hidden="true">' +
          info[0] +
        '</span>' +
        '<span class="weather-strip__temp">' +
          '<b class="wt-max">0\u00B0</b> ' +
          '<b class="wt-min">0\u00B0</b>' +
        '</span>';

      faixa.appendChild(item);

      // Partículas por tipo de clima
      var partic = item.querySelector(".ws-particulas");
      if (info[2] === "anim-chuva")   criarChuva(partic, 7);
      if (info[2] === "anim-neve")    criarNeve(partic, 5);
      if (info[2] === "anim-tempest") criarChuva(partic, 7);

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
        }, delay + 280);
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
  // CSS — só animações, SEM sobrescrever nada do tema do site
  // ============================================================
  function injetarCSS() {
    if (document.getElementById("ws-anim-css")) return;
    var s = document.createElement("style");
    s.id = "ws-anim-css";
    s.textContent = [

      /* === BASE ANIMADA — só adiciona, não sobrescreve === */
      ".ws-anim {",
      "  position: relative;",
      /* SEM overflow:hidden para não cortar conteúdo */
      "  will-change: transform, opacity;",
      "}",

      /* Brilho pulsante colorido ao redor do card */
      ".ws-anim::after {",
      "  content: '';",
      "  position: absolute;",
      "  top: -1px; right: -1px; bottom: -1px; left: -1px;",
      "  border-radius: inherit;",
      "  box-shadow: 0 0 0 0 var(--brilho, transparent);",
      "  animation: wsPulso 3.5s ease-in-out infinite;",
      "  pointer-events: none;",
      "  z-index: 0;",
      "}",
      "@keyframes wsPulso {",
      "  0%,100% { box-shadow: 0 0 4px 0 var(--brilho); opacity:.5; }",
      "  50%     { box-shadow: 0 0 14px 3px var(--brilho); opacity:1; }",
      "}",

      /* Shimmer sutil deslizando */
      ".ws-anim::before {",
      "  content: '';",
      "  position: absolute; top: 0; left: -80%;",
      "  width: 50%; height: 100%;",
      "  background: linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent);",
      "  animation: wsShimmer 6s ease-in-out infinite;",
      "  pointer-events: none; z-index: 1;",
      "  border-radius: inherit;",
      "}",
      "@keyframes wsShimmer {",
      "  0%      { left: -80%; }",
      "  55%,100%{ left: 130%; }",
      "}",

      /* === HOJE === */
      ".ws-hoje {",
      "  border-color: var(--blue) !important;",
      "  background: linear-gradient(160deg,rgba(0,126,202,0.04),rgba(0,126,202,0.01)) !important;",
      "}",
      ".ws-hoje::after { animation-duration: 1.6s !important; }",

      /* Ponto piscante ao lado do nome */
      ".ws-dot {",
      "  display: inline-block;",
      "  width: 5px; height: 5px;",
      "  border-radius: 50%;",
      "  background: var(--blue);",
      "  margin-left: 3px;",
      "  vertical-align: middle;",
      "  animation: wsDot 1.3s steps(1) infinite;",
      "}",
      "@keyframes wsDot {",
      "  0%,55%  { opacity:1; }",
      "  56%,100%{ opacity:0; }",
      "}",

      /* === HOVER — melhora o do site === */
      ".ws-anim:hover {",
      "  transform: translateY(-5px) scale(1.06) !important;",
      "  box-shadow:",
      "    0 3px 8px rgba(10,30,61,0.08),",
      "    0 16px 28px -10px var(--brilho) !important;",
      "  border-color: var(--blue) !important;",
      "  z-index: 3;",
      "}",
      ".ws-anim:hover .weather-strip__icone {",
      "  transform: scale(1.25) !important;",
      "}",

      /* === ÍCONES === */
      ".weather-strip__icone {",
      "  transition: transform .2s ease;",
      "  display: inline-block;",
      "  transform-origin: center;",
      "  position: relative; z-index: 2;",
      "}",

      /* === TEMPERATURAS === */
      ".wt-max {",
      "  font-weight: 700;",
      "  color: var(--ink);",
      "}",
      ".wt-min {",
      "  font-weight: 400;",
      "  opacity: .65;",
      "  color: var(--ink-muted);",
      "}",

      /* === PARTÍCULAS (container absoluto, não empurra layout) === */
      ".ws-particulas {",
      "  position: absolute;",
      "  top: 0; left: 0; right: 0; bottom: 0;",
      "  pointer-events: none;",
      "  z-index: 0;",
      "  border-radius: inherit;",
      "  overflow: hidden;",
      "}",

      /* Gotas de chuva */
      ".ws-gota {",
      "  position: absolute; top: -12px;",
      "  width: 1.5px; height: 9px;",
      "  background: linear-gradient(180deg,transparent,rgba(0,126,202,0.5));",
      "  border-radius: 2px;",
      "  font-style: normal;",
      "  animation: wsGota linear infinite;",
      "}",
      "@keyframes wsGota {",
      "  0%  { top:-12px; opacity:.8; }",
      "  85% { opacity:.5; }",
      "  100%{ top:110%;  opacity:0; }",
      "}",

      /* Flocos de neve */
      ".ws-floco {",
      "  position: absolute; top: -10px;",
      "  color: rgba(0,126,202,0.45);",
      "  font-style: normal;",
      "  animation: wsFloco ease-in-out infinite;",
      "}",
      "@keyframes wsFloco {",
      "  0%  { top:-10px; opacity:.9; transform:translateX(0) rotate(0deg); }",
      "  50% { transform:translateX(5px) rotate(180deg); }",
      "  100%{ top:110%;  opacity:0; transform:translateX(-4px) rotate(360deg); }",
      "}",

      /* === ANIMAÇÕES DOS ÍCONES POR CLIMA === */

      /* ☀️ Sol gira e pulsa de tamanho */
      ".anim-sol { animation: wsSol 9s linear infinite; }",
      "@keyframes wsSol {",
      "  0%   { transform:rotate(0deg)   scale(1);    }",
      "  50%  { transform:rotate(180deg) scale(1.1);  }",
      "  100% { transform:rotate(360deg) scale(1);    }",
      "}",

      /* ☁️ Nuvem flutua suave */
      ".anim-nuvem { animation: wsNuvem 3.5s ease-in-out infinite; }",
      "@keyframes wsNuvem {",
      "  0%,100%{ transform:translateX(-3px) translateY(0);   }",
      "  50%    { transform:translateX(3px)  translateY(-2px);}",
      "}",

      /* 🌧️ Chuva balança */
      ".anim-chuva { animation: wsChuva 1.3s ease-in-out infinite; }",
      "@keyframes wsChuva {",
      "  0%,100%{ transform:translateY(0)   rotate(-4deg); }",
      "  50%    { transform:translateY(4px) rotate(4deg);  }",
      "}",

      /* 🌨️ Neve gira devagar */
      ".anim-neve { animation: wsNeve 12s linear infinite; }",
      "@keyframes wsNeve {",
      "  from{ transform:rotate(0deg); }",
      "  to  { transform:rotate(360deg); }",
      "}",

      /* 🌫️ Neblina pulsa opacidade */
      ".anim-neblina { animation: wsNeblina 2.8s ease-in-out infinite; }",
      "@keyframes wsNeblina {",
      "  0%,100%{ opacity:.55; transform:scaleX(1);    }",
      "  50%    { opacity:1;   transform:scaleX(1.06); }",
      "}",

      /* ⛈️ Tempestade treme */
      ".anim-tempest { animation: wsTreme .38s ease-in-out infinite; }",
      "@keyframes wsTreme {",
      "  0%,100%{ transform:translate(0,0)       scale(1);    }",
      "  25%    { transform:translate(-2px,1px)  scale(1.03); }",
      "  75%    { transform:translate(2px,-1px)  scale(0.97); }",
      "}",

      /* === ACESSIBILIDADE === */
      "@media (prefers-reduced-motion: reduce) {",
      "  .ws-anim::before, .ws-anim::after,",
      "  .ws-gota, .ws-floco, .ws-dot,",
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
