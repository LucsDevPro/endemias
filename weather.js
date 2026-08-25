// ============================================================
// Previsão do tempo — Painel de Endemias (VERSÃO CHAMATIVA)
// Animações fortes, cores dinâmicas, ícones vivos e hover impactante
// ============================================================

(function () {
  "use strict";

  var LAT = -22.53;
  var LON = -55.72;
  var INTERVALO_ATUALIZACAO_MS = 30 * 60 * 1000;

  var DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  var CODIGO_TEMPO = {
    0: ["☀️", "Céu limpo", "sunny"],
    1: ["🌤️", "Poucas nuvens", "sunny"],
    2: ["⛅", "Parc. nublado", "partly"],
    3: ["☁️", "Nublado", "cloudy"],
    45: ["🌫️", "Nevoeiro", "fog"],
    48: ["🌫️", "Nevoeiro", "fog"],
    51: ["🌦️", "Garoa fraca", "rain"],
    53: ["🌦️", "Garoa", "rain"],
    55: ["🌧️", "Garoa forte", "rain"],
    61: ["🌧️", "Chuva fraca", "rain"],
    63: ["🌧️", "Chuva", "rain"],
    65: ["⛈️", "Chuva forte", "storm"],
    80: ["🌦️", "Pancadas", "rain"],
    81: ["🌧️", "Pancadas", "rain"],
    82: ["⛈️", "Pancadas fortes", "storm"],
    95: ["⛈️", "Trovoada", "storm"],
    96: ["⛈️", "Trovoada c/ granizo", "storm"],
    99: ["⛈️", "Trovoada c/ granizo", "storm"]
  };

  function nomeDia(isoData, hoje) {
    var p = isoData.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (isoData === hoje) return "Hoje";
    return DIAS_SEMANA[d.getDay()];
  }

  function getTempColor(max) {
    if (max >= 32) return "#ff3b5c";      // vermelho vivo
    if (max >= 28) return "#ff8c00";      // laranja forte
    if (max >= 22) return "#f4c542";      // amarelo dourado
    if (max <= 12) return "#00d4ff";      // azul ciano
    return "#00b4a6";                     // turquesa
  }

  function alinharComSistemas() {
    // (mantido igual ao original)
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
    var gapPx = 10;

    var tamanho = (alturaDisponivel - (qtdDias - 1) * gapPx) / qtdDias;
    tamanho = Math.max(52, Math.min(92, tamanho));

    painel.style.width = Math.round(tamanho) + "px";
  }

  function renderizar(dados) {
    var faixa = document.getElementById("climaFaixa");
    var wrap = document.getElementById("climaDias");
    if (!faixa || !wrap || !dados || !dados.daily) return;

    var d = dados.daily;
    var hojeIso = d.time[0];
    wrap.innerHTML = "";
    wrap.style.opacity = "0";

    for (var i = 0; i < d.time.length && i < 5; i++) {
      var info = CODIGO_TEMPO[d.weather_code[i]] || ["🌡️", "—", "normal"];
      var max = Math.round(d.temperature_2m_max[i]);
      var min = Math.round(d.temperature_2m_min[i]);
      var corTemp = getTempColor(max);
      var animType = info[2];

      var item = document.createElement("div");
      item.className = `weather-panel__dia weather-panel__dia--anim weather-${animType}`;
      item.title = info[1];
      item.style.setProperty('--temp-color', corTemp);

      item.innerHTML = `
        <span class="weather-panel__icone">${info[0]}</span>
        <span class="weather-panel__info">
          <span class="weather-panel__nome">${nomeDia(d.time[i], hojeIso)}</span>
          <span class="weather-panel__temp">
            <strong style="color:${corTemp}">${max}°</strong> 
            <span style="opacity:0.75">${min}°</span>
          </span>
        </span>
      `;

      wrap.appendChild(item);

      // Animação de entrada com bounce forte
      setTimeout(() => {
        item.style.animation = `weatherPopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`;
      }, i * 70);
    }

    setTimeout(() => { wrap.style.transition = "opacity 0.6s"; wrap.style.opacity = "1"; }, 100);

    faixa.hidden = false;
    alinharComSistemas();

    if (typeof window.reajustarEscalaPainel === "function") {
      window.reajustarEscalaPainel();
    }
  }

  function buscar() {
    var url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America%2FCampo_Grande&forecast_days=5`;

    fetch(url, { cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(renderizar)
      .catch(err => console.warn("Previsão indisponível:", err));
  }

  function injetarCSS() {
    if (document.getElementById("clima-chamativo-style")) return;

    const style = document.createElement("style");
    style.id = "clima-chamativo-style";
    style.textContent = `
      .weather-panel__dia--anim {
        opacity: 0;
        transform: scale(0.6) translateY(30px);
        transition: all 0.3s ease;
      }

      @keyframes weatherPopIn {
        0%   { opacity: 0;   transform: scale(0.6)  translateY(40px) rotate(-12deg); }
        55%  {                transform: scale(1.18) translateY(-12px) rotate(6deg); }
        75%  {                transform: scale(0.95) translateY(6px) rotate(-3deg); }
        100% { opacity: 1;   transform: scale(1)    translateY(0) rotate(0); }
      }

      /* Animações contínuas dos ícones */
      .weather-sunny .weather-panel__icone { animation: sunPulse 4s infinite ease-in-out; }
      .weather-cloudy .weather-panel__icone,
      .weather-partly .weather-panel__icone { animation: cloudDrift 6s infinite linear; }
      .weather-rain .weather-panel__icone,
      .weather-storm .weather-panel__icone { animation: rainShake 1.2s infinite; }
      .weather-fog .weather-panel__icone { animation: fogFloat 8s infinite ease-in-out; }

      @keyframes sunPulse { 0%,100% { transform: scale(1) rotate(0); } 50% { transform: scale(1.18) rotate(8deg); } }
      @keyframes cloudDrift { 0% { transform: translateX(-6px); } 50% { transform: translateX(6px); } 100% { transform: translateX(-6px); } }
      @keyframes rainShake { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
      @keyframes fogFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

      /* Hover bem chamativo */
      .weather-panel__dia:hover {
        transform: translateY(-14px) scale(1.08) !important;
        box-shadow: 0 20px 25px -10px var(--temp-color),
                    0 0 30px 8px rgba(255,255,255,0.3) !important;
        z-index: 10;
      }

      .weather-panel__dia:hover .weather-panel__icone {
        transform: scale(1.35) rotate(12deg);
      }

      .weather-panel__temp strong {
        transition: all 0.4s ease;
      }

      .weather-panel__dia:hover .weather-panel__temp strong {
        transform: scale(1.15);
      }
    `;
    document.head.appendChild(style);
  }

  function iniciar() {
    if (!document.getElementById("climaFaixa")) return;

    injetarCSS();
    buscar();
    setInterval(buscar, INTERVALO_ATUALIZACAO_MS);
    window.addEventListener("resize", alinharComSistemas);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") buscar();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
