// ============================================================
// Previsão do tempo — Painel de Endemias
// Com gráfico horário no hover (estilo Climatempo)
//
// ★ Arquivo único — só substituir o JS antigo por este.
// ============================================================

(function () {
  "use strict";

  var LAT = -22.53;
  var LON = -55.72;
  var INTERVALO_ATUALIZACAO_MS = 30 * 60 * 1000;
  var DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  var DIAS_SEMANA_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  var dadosHorarios = null; // guarda as temperaturas hora a hora

  var CODIGO_TEMPO = {
    0:  ["\u2600\uFE0F",  "C\u00E9u limpo",     "anim-sol",     "#FFB900"],
    1:  ["\uD83C\uDF24\uFE0F",  "Poucas nuvens", "anim-sol",     "#FFB900"],
    2:  ["\u26C5",   "Parc. nublado", "anim-nuvem",   "#007ECA"],
    3:  ["\u2601\uFE0F",  "Nublado",       "anim-nuvem",   "#5D6B82"],
    45: ["\uD83C\uDF2B\uFE0F",  "Nevoeiro",      "anim-neblina", "#8A96A8"],
    48: ["\uD83C\uDF2B\uFE0F",  "Nevoeiro",      "anim-neblina", "#8A96A8"],
    51: ["\uD83C\uDF26\uFE0F",  "Garoa fraca",   "anim-garoa",   "#64B5F6"],
    53: ["\uD83C\uDF26\uFE0F",  "Garoa",         "anim-garoa",   "#64B5F6"],
    55: ["\uD83C\uDF26\uFE0F",  "Garoa forte",   "anim-garoa",   "#42A5F5"],
    56: ["\uD83C\uDF27\uFE0F",  "Garoa gelada",  "anim-garoa",   "#4DD0E1"],
    57: ["\uD83C\uDF27\uFE0F",  "Garoa gelada",  "anim-garoa",   "#4DD0E1"],
    61: ["\uD83C\uDF27\uFE0F",  "Chuva fraca",   "anim-chuva",   "#007ECA"],
    63: ["\uD83C\uDF27\uFE0F",  "Chuva",         "anim-chuva",   "#0064A5"],
    65: ["\uD83C\uDF27\uFE0F",  "Chuva forte",   "anim-chuva",   "#004E86"],
    66: ["\uD83C\uDF27\uFE0F",  "Chuva gelada",  "anim-chuva",   "#0092B8"],
    67: ["\uD83C\uDF27\uFE0F",  "Chuva gelada",  "anim-chuva",   "#0092B8"],
    71: ["\uD83C\uDF28\uFE0F",  "Neve fraca",    "anim-neve",    "#7FB8DC"],
    73: ["\uD83C\uDF28\uFE0F",  "Neve",          "anim-neve",    "#7FB8DC"],
    75: ["\uD83C\uDF28\uFE0F",  "Neve forte",    "anim-neve",    "#7FB8DC"],
    77: ["\uD83C\uDF28\uFE0F",  "Neve",          "anim-neve",    "#7FB8DC"],
    80: ["\uD83C\uDF26\uFE0F",  "Pancadas",      "anim-chuva",   "#0064A5"],
    81: ["\uD83C\uDF27\uFE0F",  "Pancadas",      "anim-chuva",   "#0064A5"],
    82: ["\u26C8\uFE0F",  "Temp. forte",   "anim-tempest", "#5E4FA2"],
    85: ["\uD83C\uDF28\uFE0F",  "Nevascas",      "anim-neve",    "#7FB8DC"],
    86: ["\uD83C\uDF28\uFE0F",  "Nevascas",      "anim-neve",    "#7FB8DC"],
    95: ["\u26C8\uFE0F",  "Trovoada",      "anim-tempest", "#5E4FA2"],
    96: ["\u26C8\uFE0F",  "C/ granizo",    "anim-tempest", "#5E4FA2"],
    99: ["\u26C8\uFE0F",  "C/ granizo",    "anim-tempest", "#5E4FA2"]
  };

  // ---- helpers ----

  function nomeDia(isoData, hoje) {
    var p = isoData.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (isoData === hoje) return "Hoje";
    return DIAS_SEMANA[d.getDay()];
  }

  function nomeDiaFull(isoData, hoje) {
    var p = isoData.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (isoData === hoje) return "Hoje";
    return DIAS_SEMANA_FULL[d.getDay()];
  }

  function formatarData(isoData) {
    var p = isoData.split("-");
    return p[2] + "/" + p[1];
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

  // ---- gráfico horário ----

  function criarTooltip() {
    if (document.getElementById("ws-tooltip")) return;
    var tip = document.createElement("div");
    tip.id = "ws-tooltip";
    tip.className = "ws-tooltip";
    tip.hidden = true;
    tip.innerHTML =
      '<div class="ws-tooltip__header">' +
        '<span class="ws-tooltip__titulo"></span>' +
        '<span class="ws-tooltip__data"></span>' +
      '</div>' +
      '<canvas class="ws-tooltip__canvas"></canvas>' +
      '<div class="ws-tooltip__footer">' +
        '<span class="ws-tooltip__min"></span>' +
        '<span class="ws-tooltip__max"></span>' +
      '</div>';
    document.body.appendChild(tip);
  }

  function desenharGrafico(canvas, temps, corBase) {
    // Retina / high-DPI
    var dpr = window.devicePixelRatio || 1;
    var cssW = 280;
    var cssH = 130;
    canvas.style.width  = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width  = cssW * dpr;
    canvas.height = cssH * dpr;

    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    var pad = { top: 18, right: 12, bottom: 24, left: 28 };
    var gW = cssW - pad.left - pad.right;
    var gH = cssH - pad.top - pad.bottom;

    var tMin = Math.min.apply(null, temps);
    var tMax = Math.max.apply(null, temps);
    var range = tMax - tMin;
    if (range < 2) { tMin -= 1; tMax += 1; range = tMax - tMin; }

    function getX(i) { return pad.left + (i / (temps.length - 1)) * gW; }
    function getY(t) { return pad.top + gH - ((t - tMin) / range) * gH; }

    // Linhas de grade horizontais
    ctx.strokeStyle = "#E3E8F0";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    var qtdLinhas = 4;
    for (var g = 0; g <= qtdLinhas; g++) {
      var tempG = tMin + (g / qtdLinhas) * range;
      var gy = getY(tempG);
      ctx.beginPath();
      ctx.moveTo(pad.left, gy);
      ctx.lineTo(cssW - pad.right, gy);
      ctx.stroke();

      // Label do eixo Y
      ctx.fillStyle = "#8899AA";
      ctx.font = "9px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(Math.round(tempG) + "\u00B0", pad.left - 5, gy);
    }
    ctx.setLineDash([]);

    // Montar pontos
    var pontos = [];
    for (var i = 0; i < temps.length; i++) {
      pontos.push([getX(i), getY(temps[i])]);
    }

    // Curva suave (cardinal spline)
    function curvaCardinal(ctx, pts, tensao) {
      tensao = tensao || 0.35;
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[Math.max(0, i - 1)];
        var p1 = pts[i];
        var p2 = pts[i + 1];
        var p3 = pts[Math.min(pts.length - 1, i + 2)];
        var cp1x = p1[0] + (p2[0] - p0[0]) * tensao;
        var cp1y = p1[1] + (p2[1] - p0[1]) * tensao;
        var cp2x = p2[0] - (p3[0] - p1[0]) * tensao;
        var cp2y = p2[1] - (p3[1] - p1[1]) * tensao;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
      }
    }

    // Gradiente sob a curva
    var grad = ctx.createLinearGradient(0, pad.top, 0, cssH - pad.bottom);
    grad.addColorStop(0, corBase.replace(")", ",0.20)").replace("rgb(", "rgba("));
    grad.addColorStop(1, corBase.replace(")", ",0.02)").replace("rgb(", "rgba("));

    // Converter hex para rgba para gradiente
    var r = parseInt(corBase.slice(1, 3), 16);
    var gVal = parseInt(corBase.slice(3, 5), 16);
    var b = parseInt(corBase.slice(5, 7), 16);
    var gradFill = ctx.createLinearGradient(0, pad.top, 0, cssH - pad.bottom);
    gradFill.addColorStop(0, "rgba(" + r + "," + gVal + "," + b + ",0.18)");
    gradFill.addColorStop(1, "rgba(" + r + "," + gVal + "," + b + ",0.02)");

    // Preencher área
    ctx.beginPath();
    curvaCardinal(ctx, pontos, 0.35);
    ctx.lineTo(pontos[pontos.length - 1][0], cssH - pad.bottom);
    ctx.lineTo(pontos[0][0], cssH - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = gradFill;
    ctx.fill();

    // Desenhar linha
    ctx.beginPath();
    curvaCardinal(ctx, pontos, 0.35);
    ctx.strokeStyle = corBase;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Labels do eixo X (a cada 3h)
    ctx.fillStyle = "#8899AA";
    ctx.font = "9px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (var h = 0; h < temps.length; h += 3) {
      var xLabel = getX(h);
      ctx.fillText(h + "h", xLabel, cssH - pad.bottom + 6);

      // Tracinho vertical
      ctx.strokeStyle = "#E3E8F0";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(xLabel, cssH - pad.bottom);
      ctx.lineTo(xLabel, cssH - pad.bottom + 3);
      ctx.stroke();
    }

    // Pontos a cada 3 horas
    for (var h = 0; h < pontos.length; h += 3) {
      ctx.beginPath();
      ctx.arc(pontos[h][0], pontos[h][1], 3, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = corBase;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Marcar mínima e máxima com label
    var iMin = temps.indexOf(tMin);
    var iMax = temps.indexOf(tMax);

    // Máxima
    ctx.fillStyle = "#D32F2F";
    ctx.font = "bold 10px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(Math.round(tMax) + "\u00B0", pontos[iMax][0], pontos[iMax][1] - 7);
    ctx.beginPath();
    ctx.arc(pontos[iMax][0], pontos[iMax][1], 4, 0, Math.PI * 2);
    ctx.fillStyle = "#D32F2F";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mínima
    ctx.fillStyle = "#1565C0";
    ctx.font = "bold 10px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(Math.round(tMin) + "\u00B0", pontos[iMin][0], pontos[iMin][1] + 7);
    ctx.beginPath();
    ctx.arc(pontos[iMin][0], pontos[iMin][1], 4, 0, Math.PI * 2);
    ctx.fillStyle = "#1565C0";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function mostrarGrafico(card, diaIndex) {
    if (!dadosHorarios) return;
    var tip = document.getElementById("ws-tooltip");
    if (!tip) return;

    var inicio = diaIndex * 24;
    var tempsHora = dadosHorarios.temperature_2m.slice(inicio, inicio + 24);
    if (!tempsHora || tempsHora.length < 24) return;

    var diaIso = dadosHorarios.datas[diaIndex];
    var hojeIso = dadosHorarios.datas[0];
    var info = CODIGO_TEMPO[dadosHorarios.codigos[diaIndex]] || ["", "", "", "#007ECA"];
    var corBase = info[3];

    // Preencher header
    tip.querySelector(".ws-tooltip__titulo").textContent =
      info[0] + " " + nomeDiaFull(diaIso, hojeIso);
    tip.querySelector(".ws-tooltip__data").textContent = formatarData(diaIso);

    // Preencher footer
    var tMin = Math.round(Math.min.apply(null, tempsHora));
    var tMax = Math.round(Math.max.apply(null, tempsHora));
    tip.querySelector(".ws-tooltip__min").innerHTML =
      '<span style="color:#1565C0">\u25BC</span> M\u00EDn ' + tMin + '\u00B0';
    tip.querySelector(".ws-tooltip__max").innerHTML =
      '<span style="color:#D32F2F">\u25B2</span> M\u00E1x ' + tMax + '\u00B0';

    // Desenhar gráfico
    var canvas = tip.querySelector(".ws-tooltip__canvas");
    desenharGrafico(canvas, tempsHora, corBase);

    // Posicionar tooltip
    var rect = card.getBoundingClientRect();
    tip.hidden = false;

    var tipW = tip.offsetWidth;
    var tipH = tip.offsetHeight;

    // Tentar posicionar acima do card
    var top = rect.top - tipH - 10;
    var left = rect.left + rect.width / 2 - tipW / 2;

    // Se não cabe acima, coloca abaixo
    if (top < 5) {
      top = rect.bottom + 10;
    }
    // Não sair da tela à esquerda/direita
    if (left < 5) left = 5;
    if (left + tipW > window.innerWidth - 5) left = window.innerWidth - tipW - 5;

    tip.style.top = top + "px";
    tip.style.left = left + "px";
  }

  function esconderGrafico() {
    var tip = document.getElementById("ws-tooltip");
    if (tip) tip.hidden = true;
  }

  // ---- renderização ----

  function renderizar(dados) {
    var faixa = document.getElementById("climaFaixa");
    if (!faixa || !dados || !dados.daily) return;

    // Guardar dados horários para o gráfico
    if (dados.hourly) {
      dadosHorarios = {
        temperature_2m: dados.hourly.temperature_2m,
        datas: dados.daily.time,
        codigos: dados.daily.weather_code
      };
    }

    var d = dados.daily;
    var hojeIso = d.time[0];
    faixa.innerHTML = "";

    for (var i = 0; i < d.time.length && i < 5; i++) {
      var info   = CODIGO_TEMPO[d.weather_code[i]] || ["\uD83C\uDF21\uFE0F", "\u2014", "", "#5D6B82"];
      var max    = Math.round(d.temperature_2m_max[i]);
      var min    = Math.round(d.temperature_2m_min[i]);
      var ehHoje = d.time[i] === hojeIso;

      var item = document.createElement("div");
      item.className = "weather-strip__dia ws-anim" + (ehHoje ? " ws-hoje" : "");
      item.title = "";  // remove title nativo, agora temos tooltip custom
      item.setAttribute("data-dia", i);
      item.style.setProperty("--ws-cor", info[3]);
      item.style.animationDelay = (i * 90) + "ms";

      item.innerHTML =
        '<span class="weather-strip__nome">' + nomeDia(d.time[i], hojeIso) + '</span>' +
        '<span class="weather-strip__icone ' + info[2] + '" aria-hidden="true">' + info[0] + '</span>' +
        '<span class="weather-strip__temp">' +
          '<strong class="wt-max">' + max + '\u00B0</strong> ' +
          '<span class="wt-min">' + min + '\u00B0</span>' +
        '</span>' +
        '<span class="ws-desc">' + info[1] + '</span>';

      faixa.appendChild(item);

      // Eventos do gráfico
      (function (el, idx) {
        el.addEventListener("mouseenter", function () { mostrarGrafico(el, idx); });
        el.addEventListener("mouseleave", esconderGrafico);
        // Touch: toque mostra, segundo toque esconde
        el.addEventListener("touchstart", function (e) {
          e.preventDefault();
          var tip = document.getElementById("ws-tooltip");
          if (tip && !tip.hidden && tip._diaAtual === idx) {
            esconderGrafico();
          } else {
            mostrarGrafico(el, idx);
            if (tip) tip._diaAtual = idx;
          }
        }, { passive: false });
      })(item, i);

      // Contador animado
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

  // ---- busca na API ----

  function buscar() {
    var url = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + LAT + "&longitude=" + LON +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&hourly=temperature_2m" +  // ← NOVO: dados hora a hora pro gráfico
      "&timezone=America%2FCampo_Grande&forecast_days=5";

    fetch(url, { cache: "no-store" })
      .then(function (resp) {
        if (!resp.ok) throw new Error("resposta " + resp.status);
        return resp.json();
      })
      .then(renderizar)
      .catch(function (err) {
        console.warn("Previs\u00E3o do tempo indispon\u00EDvel:", err.message);
      });
  }

  // ---- inicialização ----

  function iniciar() {
    if (!document.getElementById("climaFaixa")) return;

    criarTooltip();
    buscar();
    setInterval(buscar, INTERVALO_ATUALIZACAO_MS);

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") buscar();
    });

    // Fechar tooltip ao clicar fora (útil no mobile)
    document.addEventListener("click", function (e) {
      var tip = document.getElementById("ws-tooltip");
      if (!tip || tip.hidden) return;
      if (!e.target.closest(".weather-strip__dia") && !e.target.closest(".ws-tooltip")) {
        esconderGrafico();
      }
    });
  }

  // ---- CSS injetado automaticamente ----

  function injetarCSS() {
    if (document.getElementById("ws-anim-css")) return;
    var s = document.createElement("style");
    s.id = "ws-anim-css";
    s.textContent = [

      /* ======== ENTRADA EM CASCATA ======== */
      ".ws-anim {",
      "  position: relative;",
      "  animation: wsEntrada .55s cubic-bezier(.34,1.56,.64,1) backwards;",
      "  cursor: pointer;",
      "}",
      "@keyframes wsEntrada {",
      "  from { opacity:0; transform:translateY(14px) scale(.92); }",
      "  to   { opacity:1; transform:translateY(0) scale(1); }",
      "}",

      /* ======== BARRINHA COLORIDA NO TOPO ======== */
      ".ws-anim::before {",
      "  content:'';",
      "  position:absolute;",
      "  top:0; left:18%; right:18%;",
      "  height:3px;",
      "  border-radius:0 0 999px 999px;",
      "  background:var(--ws-cor);",
      "  opacity:.85;",
      "}",

      /* ======== LEGENDA ======== */
      ".ws-desc {",
      "  font-size:.62rem;",
      "  font-weight:500;",
      "  color:var(--ws-cor);",
      "  letter-spacing:.01em;",
      "  text-align:center;",
      "  line-height:1.2;",
      "  margin-top:.05rem;",
      "  opacity:.9;",
      "  white-space:nowrap;",
      "  overflow:hidden;",
      "  text-overflow:ellipsis;",
      "  max-width:100%;",
      "}",

      /* ======== HOJE ======== */
      ".ws-hoje {",
      "  border-color:var(--ws-cor) !important;",
      "  animation: wsEntrada .55s cubic-bezier(.34,1.56,.64,1) backwards,",
      "             wsPulsoHoje 2.4s ease-in-out .8s infinite;",
      "}",
      "@keyframes wsPulsoHoje {",
      "  0%,100% { box-shadow:var(--shadow); }",
      "  50%     { box-shadow:0 0 0 4px rgba(0,126,202,.18), var(--shadow); }",
      "}",

      /* ponto piscante */
      ".ws-hoje .weather-strip__nome::after {",
      "  content:'';",
      "  display:inline-block;",
      "  width:5px; height:5px;",
      "  border-radius:50%;",
      "  background:var(--ws-cor);",
      "  margin-left:4px;",
      "  vertical-align:middle;",
      "  animation:wsPisca 1.6s ease-in-out infinite;",
      "}",
      "@keyframes wsPisca {",
      "  0%,100% { opacity:1; }",
      "  50%     { opacity:.2; }",
      "}",

      /* ======== HOVER ======== */
      ".ws-anim:hover {",
      "  transform:translateY(-4px) scale(1.03);",
      "  border-color:var(--ws-cor);",
      "}",
      ".ws-anim:hover .weather-strip__icone { transform:scale(1.18); }",

      /* ======== ÍCONE ======== */
      ".weather-strip__icone {",
      "  display:inline-block;",
      "  transform-origin:center;",
      "  transition:transform .2s ease;",
      "}",

      /* ======== TEMP MÍNIMA ======== */
      ".wt-min { opacity:.7; }",

      /* ======== ANIMAÇÕES DOS ÍCONES ======== */

      ".anim-sol { animation:wsSol 4s ease-in-out infinite; }",
      "@keyframes wsSol {",
      "  0%,100% { transform:scale(1) rotate(0deg); }",
      "  50%     { transform:scale(1.12) rotate(15deg); }",
      "}",

      ".anim-nuvem { animation:wsNuvem 4.5s ease-in-out infinite; }",
      "@keyframes wsNuvem {",
      "  0%,100% { transform:translateX(-2px); }",
      "  50%     { transform:translateX(2px); }",
      "}",

      ".anim-garoa { animation:wsGaroa 3.5s ease-in-out infinite; }",
      "@keyframes wsGaroa {",
      "  0%,100% { transform:translateY(0) rotate(-1deg); opacity:1; }",
      "  50%     { transform:translateY(2px) rotate(1deg); opacity:.82; }",
      "}",

      ".anim-chuva { animation:wsChuva 1.4s ease-in-out infinite; }",
      "@keyframes wsChuva {",
      "  0%,100% { transform:translateY(0) rotate(-4deg); }",
      "  50%     { transform:translateY(5px) rotate(4deg); }",
      "}",

      ".anim-neve { animation:wsNeve 10s linear infinite; }",
      "@keyframes wsNeve { to { transform:rotate(360deg); } }",

      ".anim-neblina { animation:wsNeblina 3s ease-in-out infinite; }",
      "@keyframes wsNeblina {",
      "  0%,100% { opacity:.5; transform:scaleX(1); }",
      "  50%     { opacity:1; transform:scaleX(1.06); }",
      "}",

      ".anim-tempest { animation:wsTempest .38s ease-in-out infinite; }",
      "@keyframes wsTempest {",
      "  0%,100% { transform:translate(0,0); }",
      "  25%     { transform:translate(-1.5px,1px); }",
      "  75%     { transform:translate(1.5px,-1px); }",
      "}",

      /* ======== TOOLTIP DO GRÁFICO ======== */
      ".ws-tooltip {",
      "  position:fixed;",
      "  z-index:9999;",
      "  background:var(--surface, #FFFFFF);",
      "  border:1px solid var(--border, #E3E8F0);",
      "  border-radius:14px;",
      "  box-shadow:",
      "    0 4px 6px rgba(10,30,61,0.06),",
      "    0 20px 40px -12px rgba(10,30,61,0.22);",
      "  padding:0;",
      "  width:300px;",
      "  pointer-events:none;",
      "  opacity:0;",
      "  transform:translateY(6px) scale(.97);",
      "  transition:opacity .2s ease, transform .2s ease;",
      "}",
      ".ws-tooltip:not([hidden]) {",
      "  opacity:1;",
      "  transform:translateY(0) scale(1);",
      "}",
      ".ws-tooltip[hidden] { display:block !important; visibility:hidden; }",

      /* header */
      ".ws-tooltip__header {",
      "  display:flex;",
      "  align-items:center;",
      "  justify-content:space-between;",
      "  padding:.6rem .8rem .35rem;",
      "  border-bottom:1px solid var(--border, #E3E8F0);",
      "}",
      ".ws-tooltip__titulo {",
      "  font-family:var(--font-display, 'Plus Jakarta Sans', sans-serif);",
      "  font-weight:700;",
      "  font-size:.82rem;",
      "  color:var(--ink, #0A1E3D);",
      "}",
      ".ws-tooltip__data {",
      "  font-size:.72rem;",
      "  color:var(--ink-muted, #5D6B82);",
      "  font-weight:500;",
      "}",

      /* canvas */
      ".ws-tooltip__canvas {",
      "  display:block;",
      "  margin:0 auto;",
      "  padding:.3rem .5rem 0;",
      "}",

      /* footer */
      ".ws-tooltip__footer {",
      "  display:flex;",
      "  justify-content:space-between;",
      "  padding:.3rem .8rem .55rem;",
      "  border-top:1px solid var(--border, #E3E8F0);",
      "  font-size:.7rem;",
      "  font-weight:600;",
      "  color:var(--ink-muted, #5D6B82);",
      "}",

      /* seta indicadora (triângulo apontando pro card) */
      ".ws-tooltip::after {",
      "  content:'';",
      "  position:absolute;",
      "  bottom:-6px; left:50%; transform:translateX(-50%);",
      "  width:12px; height:6px;",
      "  background:var(--surface, #FFFFFF);",
      "  clip-path:polygon(0 0, 100% 0, 50% 100%);",
      "  filter:drop-shadow(0 1px 1px rgba(10,30,61,0.1));",
      "}",

      /* ======== ACESSIBILIDADE ======== */
      "@media (prefers-reduced-motion:reduce) {",
      "  .ws-anim, .ws-hoje,",
      "  .ws-hoje .weather-strip__nome::after,",
      "  .anim-sol, .anim-nuvem, .anim-garoa, .anim-chuva,",
      "  .anim-neve, .anim-neblina, .anim-tempest,",
      "  .ws-tooltip {",
      "    animation:none !important;",
      "    transition:none !important;",
      "  }",
      "}"

    ].join("\n");
    document.head.appendChild(s);
  }

  // ---- boot ----

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
