// ============================================================
// Previsão do tempo — Painel de Endemias
// ============================================================

(function () {
  "use strict";

  // Ponta Porã, MS
  var LAT = -22.53;
  var LON = -55.72;

  var INTERVALO_ATUALIZACAO_MS = 30 * 60 * 1000; // 30 minutos

  var DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Códigos de tempo (WMO) usados pela Open-Meteo -> [ícone, nome curto]
  var CODIGO_TEMPO = {
    0: ["☀️", "Céu limpo"],
    1: ["🌤️", "Poucas nuvens"],
    2: ["⛅", "Parc. nublado"],
    3: ["☁️", "Nublado"],
    45: ["🌫️", "Nevoeiro"],
    48: ["🌫️", "Nevoeiro"],
    51: ["🌦️", "Garoa fraca"],
    53: ["🌦️", "Garoa"],
    55: ["🌧️", "Garoa forte"],
    56: ["🌧️", "Garoa gelada"],
    57: ["🌧️", "Garoa gelada"],
    61: ["🌧️", "Chuva fraca"],
    63: ["🌧️", "Chuva"],
    65: ["🌧️", "Chuva forte"],
    66: ["🌧️", "Chuva gelada"],
    67: ["🌧️", "Chuva gelada"],
    71: ["🌨️", "Neve fraca"],
    73: ["🌨️", "Neve"],
    75: ["🌨️", "Neve forte"],
    77: ["🌨️", "Neve"],
    80: ["🌦️", "Pancadas"],
    81: ["🌧️", "Pancadas"],
    82: ["⛈️", "Pancadas fortes"],
    85: ["🌨️", "Nevascas"],
    86: ["🌨️", "Nevascas"],
    95: ["⛈️", "Trovoada"],
    96: ["⛈️", "Trovoada c/ granizo"],
    99: ["⛈️", "Trovoada c/ granizo"]
  };

  function nomeDia(isoData, hoje) {
    var p = isoData.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (isoData === hoje) return "Hoje";
    return DIAS_SEMANA[d.getDay()];
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

    if (!painel || !layout || !primeiroCartao || !ultimaSecao || !titulo || !primeiroQuadrado) {
      return;
    }

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

    var espacoQuadrados = alturaDisponivel;
    var tamanho = (espacoQuadrados - (qtdDias - 1) * gapPx) / qtdDias;
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
      var info = CODIGO_TEMPO[d.weather_code[i]] || ["🌡️", "—"];
      var max = Math.round(d.temperature_2m_max[i]);
      var min = Math.round(d.temperature_2m_min[i]);

      var item = document.createElement("div");
      item.className = "weather-panel__dia";
      item.title = info[1];
      item.innerHTML =
        "<span class=\"weather-panel__icone\" aria-hidden=\"true\">" + info[0] + "</span>" +
        "<span class=\"weather-panel__info\">" +
          "<span class=\"weather-panel__nome\">" + nomeDia(d.time[i], hojeIso) + "</span>" +
          "<span class=\"weather-panel__temp\"><strong>" + max + "°</strong> " + min + "°</span>" +
        "</span>";

      wrap.appendChild(item);
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
