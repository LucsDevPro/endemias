// ============================================================
// Previsão do tempo — Painel de Endemias (Mais Animada + Profissional)
// ============================================================

(function () {
  "use strict";

  var LAT = -22.53;
  var LON = -55.72;
  var INTERVALO_ATUALIZACAO_MS = 30 * 60 * 1000;

  var DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  var CODIGO_TEMPO = {
    0:  ["☀️", "Céu limpo",           "sol",     "#FFEB3B"],
    1:  ["🌤️", "Poucas nuvens",       "sol",     "#FFEB3B"],
    2:  ["⛅",  "Parcialmente nublado","nuvem",   "#90A4AE"],
    3:  ["☁️", "Nublado",             "nuvem",   "#78909C"],
    45: ["🌫️", "Nevoeiro",            "neblina", "#B0BEC5"],
    48: ["🌫️", "Nevoeiro",            "neblina", "#B0BEC5"],
    51: ["🌦️", "Garoa fraca",         "chuva",   "#4FC3F7"],
    53: ["🌦️", "Garoa",               "chuva",   "#29B6F6"],
    55: ["🌧️", "Garoa forte",         "chuva",   "#039BE5"],
    61: ["🌧️", "Chuva fraca",         "chuva",   "#039BE5"],
    63: ["🌧️", "Chuva",               "chuva",   "#0288D1"],
    65: ["⛈️", "Chuva forte",         "tempestade", "#5C6BC0"],
    80: ["🌦️", "Pancadas",            "chuva",   "#039BE5"],
    82: ["⛈️", "Pancadas fortes",     "tempestade", "#3949AB"],
    95: ["⛈️", "Trovoada",            "tempestade", "#3949AB"],
    96: ["⛈️", "Trovoada c/ granizo", "tempestade", "#283593"],
    99: ["⛈️", "Trovoada c/ granizo", "tempestade", "#283593"]
  };

  function nomeDia(isoData, hoje) {
    var p = isoData.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (isoData === hoje) return "Hoje";
    return DIAS_SEMANA[d.getDay()];
  }

  function getTempColor(temp) {
    if (temp >= 32) return "#FF5252";
    if (temp >= 26) return "#FF8A00";
    if (temp >= 20) return "#FFB300";
    if (temp <= 10) return "#40C4FF";
    return "#00BFA5";
  }

  function animarNumero(el, alvo) {
    let inicio = 0;
    const duracao = 900;
    const t0 = performance.now();
    function passo(t) {
      const p = Math.min((t - t0) / duracao, 1);
      const eased = 1 - Math.pow(1 - p, 4); // easing mais suave e premium
      el.textContent = Math.round(inicio + (alvo - inicio) * eased) + "°";
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  function renderizar(dados) {
    var faixa = document.getElementById("climaFaixa");
    if (!faixa || !dados || !dados.daily) return;

    var d = dados.daily;
    var hojeIso = d.time[0];
    faixa.innerHTML = "";

    for (var i = 0; i < d.time.length && i < 5; i++) {
      var info = CODIGO_TEMPO[d.weather_code[i]] || ["🌡️", "—", "normal", "#90A4AE"];
      var max = Math.round(d.temperature_2m_max[i]);
      var min = Math.round(d.temperature_2m_min[i]);
      var ehHoje = d.time[i] === hojeIso;
      var corTemp = getTempColor(max);

      var item = document.createElement("div");
      item.className = `weather-strip__dia weather-strip__dia--anim ${info[2]}` + (ehHoje ? " is-hoje" : "");
      item.title = info[1];
      item.style.setProperty("--cor-brilho", corTemp);
      item.style.setProperty("--cor-texto", corTemp);

      item.innerHTML = `
        <span class="weather-strip__nome">${nomeDia(d.time[i], hojeIso)}</span>
        <span class="weather-strip__icone">${info[0]}</span>
        <span class="weather-strip__temp">
          <strong class="max" style="color:${corTemp}"></strong>
          <span class="min"></span>
        </span>
      `;

      faixa.appendChild(item);

      // Animação de entrada premium com stagger
      const delay = i * 90;
      item.style.opacity = "0";
      item.style.transform = "translateY(24px) scale(0.85)";
      
      requestAnimationFrame(() => {
        item.style.transition = `all 0.8s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms`;
        item.style.opacity = "1";
        item.style.transform = "translateY(0) scale(1)";
      });

      // Anima números depois da entrada
      setTimeout(() => {
        const elMax = item.querySelector(".max");
        const elMin = item.querySelector(".min");
        if (elMax) animarNumero(elMax, max);
        if (elMin) elMin.textContent = min + "°";
      }, delay + 400);
    }

    faixa.hidden = false;

    if (typeof window.reajustarEscalaPainel === "function") {
      window.reajustarEscalaPainel();
    }
  }

  function buscar() {
    var url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America%2FCampo_Grande&forecast_days=5`;

    fetch(url, { cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(renderizar)
      .catch(err => console.warn("Previsão do tempo indisponível:", err));
  }

  function injetarCSS() {
    if (document.getElementById("clima-pro-css")) return;

    const style = document.createElement("style");
    style.id = "clima-pro-css";
    style.textContent = `
      .weather-strip__dia--anim {
        position: relative;
        overflow: hidden;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .weather-strip__dia--anim::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.12), transparent 60%);
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
      }

      .weather-strip__dia--anim:hover::before {
        opacity: 1;
      }

      .weather-strip__dia--anim:hover {
        transform: translateY(-6px) scale(1.04);
        box-shadow: 0 12px 28px -10px var(--cor-brilho);
      }

      /* Animações dos ícones - elegantes e sutis */
      .sol    .weather-strip__icone { animation: solBrilha 6s ease-in-out infinite; }
      .nuvem  .weather-strip__icone { animation: nuvemFlutua 7s ease-in-out infinite; }
      .chuva  .weather-strip__icone { animation: chuvaCai 1.8s linear infinite; }
      .tempestade .weather-strip__icone { animation: tempestadeTreme 0.8s ease-in-out infinite; }

      @keyframes solBrilha {
        0%,100% { transform: scale(1) rotate(0deg); }
        50%     { transform: scale(1.12) rotate(8deg); }
      }

      @keyframes nuvemFlutua {
        0%,100% { transform: translateX(-4px); }
        50%     { transform: translateX(6px); }
      }

      @keyframes chuvaCai {
        0%   { transform: translateY(0); }
        100% { transform: translateY(6px); }
      }

      @keyframes tempestadeTreme {
        0%,100% { transform: translate(0,0) scale(1); }
        25%     { transform: translate(-2px,2px) scale(1.05); }
        75%     { transform: translate(2px,-2px) scale(0.97); }
      }

      /* Hoje - badge elegante */
      .weather-strip__dia.is-hoje {
        border: 1.5px solid var(--cor-brilho);
      }

      .weather-strip__dia.is-hoje .weather-strip__nome::after {
        content: "• AGORA";
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.5px;
        color: var(--cor-brilho);
        margin-left: 6px;
        animation: pulseHoje 2s ease-in-out infinite;
      }

      @keyframes pulseHoje {
        0%, 100% { opacity: 0.7; }
        50%      { opacity: 1; }
      }

      .weather-strip__temp .max {
        font-weight: 700;
        font-size: 1.05em;
        transition: transform 0.4s ease;
      }

      .weather-strip__dia--anim:hover .max {
        transform: scale(1.15);
      }

      .weather-strip__temp .min {
        opacity: 0.65;
        margin-left: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  function iniciar() {
    if (!document.getElementById("climaFaixa")) return;
    injetarCSS();
    buscar();
    setInterval(buscar, INTERVALO_ATUALIZACAO_MS);
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
