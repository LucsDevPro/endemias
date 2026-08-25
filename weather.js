// ============================================================
// Previsão do tempo — Painel de Endemias
// Versão animada, integrada à identidade visual da Prefeitura
// (tema claro — usa as variáveis do CSS do site)
// ============================================================

(function () {
  "use strict";

  // Ponta Porã, MS
  var LAT = -22.53;
  var LON = -55.72;

  var INTERVALO_ATUALIZACAO_MS = 30 * 60 * 1000; // 30 minutos

  var DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // [ícone, nome, classe-anim, cor-destaque]
  // Cores tiradas da paleta do site (blue/green/amber) + tons compatíveis
  var CODIGO_TEMPO = {
    0:  ["☀️", "Céu limpo",           "anim-sol",     "#FFB900"],
    1:  ["🌤️", "Poucas nuvens",       "anim-sol",     "#FFB900"],
    2:  ["⛅",  "Parc. nublado",       "anim-nuvem",   "#007ECA"],
    3:  ["☁️", "Nublado",             "anim-nuvem",   "#5D6B82"],
    45: ["🌫️", "Nevoeiro",            "anim-neblina", "#8A96A8"],
    48: ["🌫️", "Nevoeiro",            "anim-neblina", "#8A96A8"],
    51: ["🌦️", "Garoa fraca",         "anim-chuva",   "#007ECA"],
    53: ["🌦️", "Garoa",               "anim-chuva",   "#007ECA"],
    55: ["🌧️", "Garoa forte",         "anim-chuva",   "#0064A5"],
    56: ["🌧️", "Garoa gelada",        "anim-chuva",   "#0092B8"],
    57: ["🌧️", "Garoa gelada",        "anim-chuva",   "#0092B8"],
    61: ["🌧️", "Chuva fraca",         "anim-chuva",   "#007ECA"],
    63: ["🌧️", "Chuva",               "anim-chuva",   "#0064A5"],
    65: ["🌧️", "Chuva forte",         "anim-chuva",   "#004E86"],
    66: ["🌧️", "Chuva gelada",        "anim-chuva",   "#0092B8"],
    67: ["🌧️", "Chuva gelada",        "anim-chuva",   "#0092B8"],
    71: ["🌨️", "Neve fraca",          "anim-neve",    "#7FB8DC"],
    73: ["🌨️", "Neve",                "anim-neve",    "#7FB8DC"],
    75: ["🌨️", "Neve forte",          "anim-neve",    "#7FB8DC"],
    77: ["🌨️", "Neve",                "anim-neve",    "#7FB8DC"],
    80: ["🌦️", "Pancadas",            "anim-chuva",   "#0064A5"],
    81: ["🌧️", "Pancadas",            "anim-chuva",   "#0064A5"],
    82: ["⛈️", "Pancadas fortes",     "anim-tempest", "#5E4FA2"],
    85: ["🌨️", "Nevascas",            "anim-neve",    "#7FB8DC"],
    86: ["🌨️", "Nevascas",            "anim-neve",    "#7FB8DC"],
    95: ["⛈️", "Trovoada",            "anim-tempest", "#5E4FA2"],
    96: ["⛈️", "Trovoada c/ granizo", "anim-tempest", "#5E4FA2"],
    99: ["⛈️", "Trovoada c/ granizo", "anim-tempest", "#5E4FA2"]
  };

  function nomeDia(isoData, hoje) {
    var p = isoData.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (isoData === hoje) return "Hoje";
    return DIAS_SEMANA[d.getDay()];
  }

  // Contador animado 0 → valor (só visual; se JS falhar no meio,
  // o textContent final é sempre garantido pelo último frame)
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

  function renderizar(dados) {
    var faixa = document.getElementById("climaFaixa");
    var wrap = faixa;
    if (!faixa || !wrap || !dados || !dados.daily) return;

    var d = dados.daily;
    var hojeIso = d.time[0];
    wrap.innerHTML = "";

    for (var i = 0; i < d.time.length && i < 5; i++) {
      var info = CODIGO_TEMPO[d.weather_code[i]] || ["🌡️", "—", "", "#5D6B82"];
      var max = Math.round(d.temperature_2m_max[i]);
      var min = Math.round(d.temperature_2m_min[i]);
      var ehHoje = d.time[i] === hojeIso;

      var item = document.createElement("div");
      // mantém weather-strip__dia (estilos do site) + classes de animação
      item.className = "weather-strip__dia ws-anim" + (ehHoje ? " ws-hoje" : "");
      item.title = info[1];
      item.style.setProperty("--ws-cor", info[3]);
      // delay da cascata via CSS custom property (sem inline opacity!)
      item.style.animationDelay = (i * 90) + "ms";

      item.innerHTML =
        '<span class="weather-strip__nome">' + nomeDia(d.time[i], hojeIso) + "</span>" +
        '<span class="weather-strip__icone ' + info[2] + '" aria-hidden="true">' + info[0] + "</span>" +
        '<span class="weather-strip__temp">' +
          "<strong class=\"wt-max\">" + max + "\u00B0</strong> " +
          '<span class="wt-min">' + min + "\u00B0</span>" +
        "</span>";

      wrap.appendChild(item);

      // contador de temperatura (com fallback: o HTML já tem o valor
      // final — se a animação não rodar, o número certo já está lá)
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
  }

  // ============================================================
  // CSS complementar — só ADICIONA animações por cima do CSS do
  // site (weather-strip__* continua vindo do styles.css).
  // Estado padrão sempre VISÍVEL: se a animação falhar, aparece.
  // ============================================================
  function injetarCSS() {
    if (document.getElementById("ws-anim-css")) return;
    var s = document.createElement("style");
    s.id = "ws-anim-css";
    s.textContent = [

      /* ---- entrada em cascata (keyframes + forwards = à prova de falha) ---- */
      ".ws-anim {",
      "  position: relative;",
      "  animation: wsEntrada .55s cubic-bezier(.34,1.56,.64,1) backwards;",
      "}",
      "@keyframes wsEntrada {",
      "  from { opacity: 0; transform: translateY(14px) scale(.92); }",
      "  to   { opacity: 1; transform: translateY(0) scale(1); }",
      "}",

      /* ---- barrinha superior na cor do clima (combina com o accent-line do site) ---- */
      ".ws-anim::before {",
      "  content: '';",
      "  position: absolute;",
      "  top: 0; left: 18%; right: 18%;",
      "  height: 3px;",
      "  border-radius: 0 0 999px 999px;",
      "  background: var(--ws-cor);",
      "  opacity: .85;",
      "}",

      /* ---- dia de HOJE: borda na cor do clima + pulso suave ---- */
      ".ws-hoje {",
      "  border-color: var(--ws-cor) !important;",
      "  animation: wsEntrada .55s cubic-bezier(.34,1.56,.64,1) backwards,",
      "             wsPulsoHoje 2.4s ease-in-out .8s infinite;",
      "}",
      "@keyframes wsPulsoHoje {",
      "  0%,100% { box-shadow: var(--shadow); }",
      "  50%     { box-shadow: 0 0 0 4px color-mix(in srgb, var(--ws-cor) 18%, transparent),",
      "            var(--shadow); }",
      "}",
      /* fallback p/ navegadores sem color-mix: pulso na sombra padrão */
      "@supports not (background: color-mix(in srgb, red 10%, blue)) {",
      "  @keyframes wsPulsoHoje {",
      "    0%,100% { box-shadow: var(--shadow); }",
      "    50%     { box-shadow: 0 0 10px 2px rgba(0,126,202,.25); }",
      "  }",
      "}",

      /* ---- ponto 'ao vivo' no nome do dia de hoje (padrão live-dot do site) ---- */
      ".ws-hoje .weather-strip__nome::after {",
      "  content: '';",
      "  display: inline-block;",
      "  width: 5px; height: 5px;",
      "  border-radius: 50%;",
      "  background: var(--ws-cor);",
      "  margin-left: 4px;",
      "  vertical-align: middle;",
      "  animation: wsPisca 1.6s ease-in-out infinite;",
      "}",
      "@keyframes wsPisca {",
      "  0%,100% { opacity: 1; }",
      "  50%     { opacity: .25; }",
      "}",

      /* ---- hover: reforça o padrão do site, elevando um pouco mais ---- */
      ".ws-anim:hover {",
      "  transform: translateY(-4px) scale(1.03);",
      "  border-color: var(--ws-cor);",
      "}",
      ".ws-anim:hover .weather-strip__icone {",
      "  transform: scale(1.18);",
      "}",

      /* ---- ícone: base p/ animações ---- */
      ".weather-strip__icone {",
      "  display: inline-block;",
      "  transform-origin: center;",
      "  transition: transform .2s ease;",
      "}",

      /* ---- temp mínima discreta ---- */
      ".wt-min { opacity: .75; }",

      /* ---- animações por clima (sutis, tema claro) ---- */
      ".anim-sol { animation: wsSol 3.5s ease-in-out infinite; }",
      "@keyframes wsSol {",
      "  0%,100% { transform: scale(1) rotate(0deg); }",
      "  50%     { transform: scale(1.12) rotate(12deg); }",
      "}",

      ".anim-nuvem { animation: wsNuvem 4s ease-in-out infinite; }",
      "@keyframes wsNuvem {",
      "  0%,100% { transform: translateX(-2px); }",
      "  50%     { transform: translateX(2px); }",
      "}",

      ".anim-chuva { animation: wsChuva 1.6s ease-in-out infinite; }",
      "@keyframes wsChuva {",
      "  0%,100% { transform: translateY(0); }",
      "  50%     { transform: translateY(3px); }",
      "}",

      ".anim-neve { animation: wsNeve 10s linear infinite; }",
      "@keyframes wsNeve { to { transform: rotate(360deg); } }",

      ".anim-neblina { animation: wsNeblina 2.6s ease-in-out infinite; }",
      "@keyframes wsNeblina {",
      "  0%,100% { opacity: .55; }",
      "  50%     { opacity: 1; }",
      "}",

      ".anim-tempest { animation: wsTempest .4s ease-in-out infinite; }",
      "@keyframes wsTempest {",
      "  0%,100% { transform: translate(0,0); }",
      "  25%     { transform: translate(-1px,1px); }",
      "  75%     { transform: translate(1px,-1px); }",
      "}",

      /* ---- acessibilidade (mesmo padrão do site) ---- */
      "@media (prefers-reduced-motion: reduce) {",
      "  .ws-anim, .ws-hoje,",
      "  .ws-hoje .weather-strip__nome::after,",
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
