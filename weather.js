// ============================================================
// Previsão do tempo — Painel de Endemias (versão CHAMATIVA — corrigida)
// ============================================================

(function () {
  "use strict";

  var LAT = -22.53;
  var LON = -55.72;
  var INTERVALO_ATUALIZACAO_MS = 30 * 60 * 1000;

  var DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // [ícone, nome, classe-de-animação, cor-de-brilho]
  var CODIGO_TEMPO = {
    0:  ["☀️", "Céu limpo",           "anim-sol",    "#ffd54a"],
    1:  ["🌤️", "Poucas nuvens",       "anim-sol",    "#ffe08a"],
    2:  ["⛅", "Parc. nublado",       "anim-nuvem",  "#cfd8dc"],
    3:  ["☁️", "Nublado",             "anim-nuvem",  "#b0bec5"],
    45: ["🌫️", "Nevoeiro",            "anim-neblina","#cfd8dc"],
    48: ["🌫️", "Nevoeiro",            "anim-neblina","#cfd8dc"],
    51: ["🌦️", "Garoa fraca",         "anim-chuva",  "#81d4fa"],
    53: ["🌦️", "Garoa",               "anim-chuva",  "#4fc3f7"],
    55: ["🌧️", "Garoa forte",         "anim-chuva",  "#29b6f6"],
    56: ["🌧️", "Garoa gelada",        "anim-chuva",  "#4dd0e1"],
    57: ["🌧️", "Garoa gelada",        "anim-chuva",  "#4dd0e1"],
    61: ["🌧️", "Chuva fraca",         "anim-chuva",  "#29b6f6"],
    63: ["🌧️", "Chuva",               "anim-chuva",  "#039be5"],
    65: ["🌧️", "Chuva forte",         "anim-chuva",  "#0277bd"],
    66: ["🌧️", "Chuva gelada",        "anim-chuva",  "#4dd0e1"],
    67: ["🌧️", "Chuva gelada",        "anim-chuva",  "#4dd0e1"],
    71: ["🌨️", "Neve fraca",          "anim-neve",   "#e1f5fe"],
    73: ["🌨️", "Neve",                "anim-neve",   "#e1f5fe"],
    75: ["🌨️", "Neve forte",          "anim-neve",   "#e1f5fe"],
    77: ["🌨️", "Neve",                "anim-neve",   "#e1f5fe"],
    80: ["🌦️", "Pancadas",            "anim-chuva",  "#039be5"],
    81: ["🌧️", "Pancadas",            "anim-chuva",  "#0277bd"],
    82: ["⛈️", "Pancadas fortes",     "anim-tempest","#5c6bc0"],
    85: ["🌨️", "Nevascas",            "anim-neve",   "#e1f5fe"],
    86: ["🌨️", "Nevascas",            "anim-neve",   "#e1f5fe"],
    95: ["⛈️", "Trovoada",            "anim-tempest","#7e57c2"],
    96: ["⛈️", "Trovoada c/ granizo", "anim-tempest","#7e57c2"],
    99: ["⛈️", "Trovoada c/ granizo", "anim-tempest","#7e57c2"]
  };

  function nomeDia(isoData, hoje) {
    var p = isoData.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (isoData === hoje) return "Hoje";
    return DIAS_SEMANA[d.getDay()];
  }

  // Contador animado de temperatura (0 → valor real)
  function animarNumero(el, alvo) {
    var inicio = 0;
    var duracao = 700;
    var t0 = performance.now();
    function passo(t) {
      var p = Math.min((t - t0) / duracao, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(inicio + (alvo - inicio) * eased) + "°";
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  function alinharComSistemas() {
    var painel = document.getElementById("climaFaixa");
    var layout = document.querySelector(".page-layout");
    var primeiraSecao = document.querySelector(".grid-section");
    var primeiroCartao = primeiraSecao ? primeiraSecao.querySelector(".card") : null;
    var secoes = document.querySelectorAll(".grid-section");
    var ultimaSecao = secoes[secoes.length - 1];
    var titulo = painel ? painel.querySelector(".weather-panel__titulo") : null;
    var primeiroQuadrado = painel ? painel.querySelector(".weather-panel__dia") : null;
    if (!painel || !layout || !primeiroCartao || !ultimaSecao || !titulo || !primeiroQuadrado) return;

    if (getComputedStyle(layout).flexDirection !== "row") {
      painel.style.marginTop = "";
      painel.style.width = "";
      return;
    }

    var topoLayout = layout.getBoundingClientRect().top;
    var topoCartao = primeiroCartao.getBoundingClientRect().top;
    var baseGeradores = ultimaSecao.getBoundingClientRect().bottom;

    var offsetInterno = primeiroQuadrado.getBoundingClientRect().top - painel.getBoundingClientRect().top;

    var novaMargem = topoCartao - topoLayout - offsetInterno;
    painel.style.marginTop = Math.max(0, novaMargem) + "px";

    var alturaDisponivel = baseGeradores - topoCartao;
    var qtdDias = painel.querySelectorAll(".weather-panel__dia").length || 5;
    var gapPx = 8;

    var tamanho = (alturaDisponivel - (qtdDias - 1) * gapPx) / qtdDias;
    tamanho = Math.max(44, Math.min(84, tamanho));

    painel.style.width = Math.round(tamanho) + "px";
  }

  function renderizar(dados) {
    var faixa = document.getElementById("climaFaixa");
    var wrap = document.getElementById("climaDias");
    if (!faixa || !wrap || !dados || !dados.daily) return;

    var d = dados.daily;
    var hojeIso = d.time[0];
    wrap.innerHTML = "";

    for (var i = 0; i < d.time.length && i < 5; i++) {
      var info = CODIGO_TEMPO[d.weather_code[i]] || ["🌡️", "—", "", "#90a4ae"];
      var max = Math.round(d.temperature_2m_max[i]);
      var min = Math.round(d.temperature_2m_min[i]);
      var ehHoje = d.time[i] === hojeIso;

      var item = document.createElement("div");
      item.className = "weather-panel__dia weather-panel__dia--anim" + (ehHoje ? " is-hoje" : "");
      item.title = info[1];
      item.style.setProperty("--brilho", info[3]);
      item.style.opacity = "0";
      item.style.transform = "translateY(16px) scale(0.9)";
      item.style.transition = "opacity 0.5s cubic-bezier(0.34,1.56,0.64,1), transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
      item.style.transitionDelay = (i * 100) + "ms";

      // ⚠ Mudança: usa <b> pra máxima e classe exclusiva pra mínima,
      //    evitando conflito de seletores com os <span> externos.
      item.innerHTML =
        "<span class=\"weather-panel__icone " + info[2] + "\" aria-hidden=\"true\">" +
          info[0] +
          "<i class=\"clima-flash\" aria-hidden=\"true\"></i>" +
        "</span>" +
        "<span class=\"weather-panel__info\">" +
          "<span class=\"weather-panel__nome\">" + nomeDia(d.time[i], hojeIso) + "</span>" +
          "<span class=\"weather-panel__temp\">" +
            "<b class=\"wt-max\">0°</b> " +
            "<b class=\"wt-min\">0°</b>" +
          "</span>" +
        "</span>";

      wrap.appendChild(item);

      // Closure correta para o loop
      (function (el, mx, mn, delay) {
        requestAnimationFrame(function () {
          el.style.opacity = "1";
          el.style.transform = "translateY(0) scale(1)";
        });
        setTimeout(function () {
          var elMax = el.querySelector(".wt-max");
          var elMin = el.querySelector(".wt-min");
          if (elMax) animarNumero(elMax, mx);
          if (elMin) animarNumero(elMin, mn);
        }, delay + 250);
      })(item, max, min, i * 100);
    }

    faixa.hidden = false;
    alinharComSistemas();

    if (typeof window.reajustarEscalaPainel === "function") {
      window.reajustarEscalaPainel();
    }
  }

  function buscar() {
    var url = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + LAT + "&longitude=" + LON +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
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
    window.addEventListener("resize", alinharComSistemas);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") buscar();
    });
  }

  // CSS das animações — injetado automaticamente
  function injetarCSSAnimacao() {
    if (document.getElementById("clima-anim-style")) return;

    var css = [
      /* Base */
      ".weather-panel__dia--anim {",
      "  position: relative;",
      "  will-change: transform, opacity;",
      "  border-radius: 10px;",
      "  transition: transform .25s ease, box-shadow .25s ease;",
      "}",

      /* Brilho pulsante */
      ".weather-panel__dia--anim::after {",
      "  content: '';",
      "  position: absolute; top: 0; right: 0; bottom: 0; left: 0;",
      "  border-radius: inherit;",
      "  box-shadow: 0 0 6px 0 var(--brilho, transparent);",
      "  opacity: .55;",
      "  pointer-events: none;",
      "  animation: climaPulso 3s ease-in-out infinite;",
      "}",
      "@keyframes climaPulso {",
      "  0%,100% { box-shadow: 0 0 6px 0 var(--brilho); }",
      "  50%     { box-shadow: 0 0 16px 3px var(--brilho); }",
      "}",

      /* Destaque "HOJE" */
      ".weather-panel__dia.is-hoje {",
      "  outline: 2px solid var(--brilho);",
      "  outline-offset: -2px;",
      "}",
      ".weather-panel__dia.is-hoje::before {",
      "  content: 'AGORA';",
      "  position: absolute; top: 3px; right: 4px;",
      "  font-size: 8px; font-weight: 700; letter-spacing: .5px;",
      "  color: var(--brilho);",
      "  opacity: .9;",
      "  animation: climaPisca 1.6s steps(1) infinite;",
      "}",
      "@keyframes climaPisca { 0%,60%{opacity:.9} 61%,100%{opacity:.25} }",

      /* Hover */
      ".weather-panel__dia:hover {",
      "  transform: translateY(-4px) scale(1.04);",
      "  box-shadow: 0 8px 20px -6px var(--brilho);",
      "  z-index: 2;",
      "}",

      ".weather-panel__icone {",
      "  display: inline-block;",
      "  position: relative;",
      "  transform-origin: center;",
      "}",

      /* Temp mínima mais discreta */
      ".wt-max { font-weight: 700; }",
      ".wt-min { font-weight: 400; opacity: .7; }",

      /* ---- Animações por tipo de clima ---- */
      ".anim-sol    { animation: climaGira 8s linear infinite; }",
      "@keyframes climaGira { to { transform: rotate(360deg); } }",

      ".anim-nuvem  { animation: climaFlutua 3s ease-in-out infinite; }",
      "@keyframes climaFlutua {",
      "  0%,100% { transform: translateX(-2px); }",
      "  50%     { transform: translateX(2px); }",
      "}",

      ".anim-chuva  { animation: climaBalanca 1.4s ease-in-out infinite; }",
      "@keyframes climaBalanca {",
      "  0%,100% { transform: translateY(0); }",
      "  50%     { transform: translateY(3px); }",
      "}",

      ".anim-neve   { animation: climaGira 14s linear infinite; }",

      ".anim-neblina { animation: climaFade 2.5s ease-in-out infinite; }",
      "@keyframes climaFade { 0%,100%{opacity:.55} 50%{opacity:1} }",

      ".anim-tempest { animation: climaTreme .35s ease-in-out infinite; }",
      "@keyframes climaTreme {",
      "  0%,100% { transform: translate(0,0); }",
      "  25%     { transform: translate(-1px,1px); }",
      "  75%     { transform: translate(1px,-1px); }",
      "}",

      /* Flash de raio */
      ".clima-flash {",
      "  position: absolute; top: -30%; right: -30%; bottom: -30%; left: -30%;",
      "  background: radial-gradient(circle, rgba(255,255,200,.9), transparent 60%);",
      "  opacity: 0; pointer-events: none; border-radius: 50%;",
      "  font-style: normal;",
      "}",
      ".anim-tempest .clima-flash {",
      "  animation: climaRaio 4s ease-in-out infinite;",
      "}",
      "@keyframes climaRaio {",
      "  0%,89%,100% { opacity: 0; }",
      "  90%,93%     { opacity: 1; }",
      "  91%         { opacity: .2; }",
      "}",

      /* Acessibilidade */
      "@media (prefers-reduced-motion: reduce) {",
      "  .weather-panel__dia--anim,",
      "  .weather-panel__dia--anim::after,",
      "  .anim-sol,.anim-nuvem,.anim-chuva,.anim-neve,",
      "  .anim-neblina,.anim-tempest,.clima-flash {",
      "    animation: none !important;",
      "  }",
      "}"
    ].join("\n");

    var style = document.createElement("style");
    style.id = "clima-anim-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injetarCSSAnimacao();
      iniciar();
    });
  } else {
    injetarCSSAnimacao();
    iniciar();
  }
})();
