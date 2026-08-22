// ============================================================
// Previsão do tempo — Painel de Endemias
//
// Usa a API pública e gratuita da Open-Meteo (sem chave, sem
// cadastro — https://open-meteo.com/), consultada direto pelo
// navegador. Mostra os próximos 5 dias, discretamente, no
// rodapé do painel.
// ============================================================

(function () {
  "use strict";

  // Ponta Porã, MS
  var LAT = -22.53;
  var LON = -55.72;

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
    // isoData: "2026-08-22" — evita problema de fuso construindo a data em partes
    var p = isoData.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (isoData === hoje) return "Hoje";
    return DIAS_SEMANA[d.getDay()];
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
      item.className = "weather-strip__dia";
      item.title = info[1];
      item.innerHTML =
        "<span class=\"weather-strip__nome\">" + nomeDia(d.time[i], hojeIso) + "</span>" +
        "<span class=\"weather-strip__icone\" aria-hidden=\"true\">" + info[0] + "</span>" +
        "<span class=\"weather-strip__temp\"><strong>" + max + "°</strong> " + min + "°</span>";
      wrap.appendChild(item);
    }

    faixa.hidden = false;

    if (typeof window.reajustarEscalaPainel === "function") {
      window.reajustarEscalaPainel();
    }
  }

  function iniciar() {
    if (!document.getElementById("climaFaixa")) return;

    var url = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + LAT + "&longitude=" + LON +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&timezone=America%2FCampo_Grande&forecast_days=5";

    fetch(url)
      .then(function (resp) {
        if (!resp.ok) throw new Error("resposta " + resp.status);
        return resp.json();
      })
      .then(renderizar)
      .catch(function (err) {
        // Falha silenciosa: a faixa simplesmente não aparece — não é
        // informação essencial do painel, não vale mostrar erro pro usuário.
        console.warn("Previsão do tempo indisponível:", err.message);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
