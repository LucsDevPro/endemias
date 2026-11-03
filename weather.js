// ============================================================
// Painel de previsão — UVZ Connect
//
// Os dados vêm de clima-core.js (Ponta Porã – Centro, vários
// modelos combinados). Aqui só desenhamos:
//   • bloco "Agora" (temperatura, sensação, umidade, vento, chuva)
//   • aviso de chuva próxima
//   • 5 dias com mín/máx, chance de chuva e milímetros
//   • gráfico por hora ao passar o mouse
//   • "ver por modelo": o que cada modelo previu (para comparar)
// O estilo fica em tema.css.
// ============================================================

(function () {
  "use strict";

  var INTERVALO_MS = 15 * 60 * 1000;
  var DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // [ícone, legenda, classe-anim, cor-destaque]
  var CODIGO_TEMPO = {
    0:  ["☀️",  "Céu limpo",     "anim-sol",     "#FFB900"],
    1:  ["🌤️",  "Poucas nuvens", "anim-sol",     "#FFB900"],
    2:  ["⛅",   "Parc. nublado", "anim-nuvem",   "#4FB3F0"],
    3:  ["☁️",  "Nublado",       "anim-nuvem",   "#9FB0C8"],
    45: ["🌫️",  "Nevoeiro",      "anim-neblina", "#9FB0C8"],
    48: ["🌫️",  "Nevoeiro",      "anim-neblina", "#9FB0C8"],
    51: ["🌦️",  "Garoa fraca",   "anim-garoa",   "#64B5F6"],
    53: ["🌦️",  "Garoa",         "anim-garoa",   "#64B5F6"],
    55: ["🌦️",  "Garoa forte",   "anim-garoa",   "#42A5F5"],
    56: ["🌧️",  "Garoa gelada",  "anim-garoa",   "#4DD0E1"],
    57: ["🌧️",  "Garoa gelada",  "anim-garoa",   "#4DD0E1"],
    61: ["🌧️",  "Chuva fraca",   "anim-chuva",   "#4FB3F0"],
    63: ["🌧️",  "Chuva",         "anim-chuva",   "#3AA0E8"],
    65: ["🌧️",  "Chuva forte",   "anim-chuva",   "#2F8FDA"],
    66: ["🌧️",  "Chuva gelada",  "anim-chuva",   "#4DD0E1"],
    67: ["🌧️",  "Chuva gelada",  "anim-chuva",   "#4DD0E1"],
    71: ["🌨️",  "Neve fraca",    "anim-neve",    "#9CD0F0"],
    73: ["🌨️",  "Neve",          "anim-neve",    "#9CD0F0"],
    75: ["🌨️",  "Neve forte",    "anim-neve",    "#9CD0F0"],
    77: ["🌨️",  "Neve",          "anim-neve",    "#9CD0F0"],
    80: ["🌦️",  "Pancadas",      "anim-chuva",   "#3AA0E8"],
    81: ["🌧️",  "Pancadas",      "anim-chuva",   "#3AA0E8"],
    82: ["⛈️",  "Temp. forte",   "anim-tempest", "#A99BFF"],
    85: ["🌨️",  "Nevascas",      "anim-neve",    "#9CD0F0"],
    86: ["🌨️",  "Nevascas",      "anim-neve",    "#9CD0F0"],
    95: ["⛈️",  "Trovoada",      "anim-tempest", "#A99BFF"],
    96: ["⛈️",  "C/ granizo",    "anim-tempest", "#A99BFF"],
    99: ["⛈️",  "C/ granizo",    "anim-tempest", "#A99BFF"]
  };
  var PADRAO_TEMPO = ["🌡️", "—", "", "#9FB0C8"];

  var dadosAtuais = null;
  var elementoTemaSelecionado = null;
  var detalhesAbertos = false;

  function info(codigo) { return CODIGO_TEMPO[codigo] || PADRAO_TEMPO; }

  function dois(n) { return n < 10 ? "0" + n : "" + n; }

  function nomeDia(iso, hoje) {
    if (iso === hoje) return "Hoje";
    var p = iso.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    return DIAS_SEMANA[d.getDay()];
  }

  function dataCurta(iso) {
    var p = iso.split("-");
    return p[2] + "/" + p[1];
  }

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function animarNumero(el, alvo) {
    if (!el) return;
    var semAnim = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (semAnim) { el.textContent = alvo + "°"; return; }
    var t0 = performance.now();
    function passo(t) {
      var p = Math.min((t - t0) / 800, 1);
      el.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3))) + "°";
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  // ----------------------------------------------------------
  //  Gráfico SVG por hora (tooltip no hover/toque)
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
    var horas = dadosAtuais && dadosAtuais.horas[isoData];
    if (!horas || !horas.length) return null;

    var W = 300, H = 172;
    var padL = 10, padR = 10, padT = 36, padB = 20;
    var gw = W - padL - padR, gh = H - padT - padB;

    var temps = horas.map(function (h) { return h.temp; });
    var minT = Math.min.apply(null, temps);
    var maxT = Math.max.apply(null, temps);
    if (minT === maxT) maxT = minT + 1;

    var n = horas.length;
    function px(i) { return padL + (n === 1 ? gw / 2 : (i / (n - 1)) * gw); }
    function py(t) { return padT + gh - ((t - minT) / (maxT - minT)) * gh; }

    var faixas = "";
    var larg = n > 1 ? gw / (n - 1) : gw;
    for (var f = 0; f < n; f++) {
      var prob = horas[f].chuva;
      if (prob < 20) continue;
      var op = Math.min(0.5, (prob / 100) * 0.55);
      faixas += '<rect x="' + (px(f) - larg / 2).toFixed(1) + '" y="' + padT +
        '" width="' + larg.toFixed(1) + '" height="' + gh +
        '" fill="rgba(0,126,202,' + op.toFixed(2) + ')"/>';
    }

    var linha = "", area = "M" + px(0) + "," + (padT + gh);
    for (var i = 0; i < n; i++) {
      var x = px(i).toFixed(1), y = py(horas[i].temp).toFixed(1);
      linha += (i === 0 ? "M" : "L") + x + "," + y + " ";
      area += " L" + x + "," + y;
    }
    area += " L" + px(n - 1) + "," + (padT + gh) + " Z";

    var pontos = "", rotulos = "", valores = "", icones = "";
    for (var j = 0; j < n; j++) {
      var cx = px(j).toFixed(1), cy = py(horas[j].temp).toFixed(1);
      pontos += '<circle cx="' + cx + '" cy="' + cy + '" r="2" fill="' + cor + '"/>';
      if (j % 3 === 0) {
        var ih = info(horas[j].codigo);
        icones += '<text x="' + cx + '" y="20" class="ws-tt-icone" text-anchor="middle">' + ih[0] + "</text>";
        rotulos += '<text x="' + cx + '" y="' + (H - 8) + '" class="ws-tt-hora" text-anchor="middle">' + horas[j].hora + "h</text>";
        valores += '<text x="' + cx + '" y="' + (parseFloat(cy) - 6) + '" class="ws-tt-val" text-anchor="middle">' + Math.round(horas[j].temp) + "°</text>";
      }
    }

    return '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="wsGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + cor + '" stop-opacity="0.35"/>' +
      '<stop offset="100%" stop-color="' + cor + '" stop-opacity="0"/></linearGradient></defs>' +
      faixas +
      '<path d="' + area + '" fill="url(#wsGrad)"/>' +
      '<path d="' + linha + '" fill="none" stroke="' + cor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      pontos + valores + icones + rotulos + "</svg>";
  }

  function mostrarTooltip(iso, cor, legenda, alvo) {
    var svg = montarGrafico(iso, cor);
    if (!svg) return;
    var tt = garantirTooltip();
    tt.style.setProperty("--ws-cor", cor);
    tt.innerHTML = '<div class="ws-tt-titulo">' + esc(legenda) + " &middot; por hora</div>" + svg +
      '<div class="ws-tt-legenda"><span><i></i>chance de chuva</span></div>';
    tt.hidden = false;

    var r = alvo.getBoundingClientRect();
    var t = tt.getBoundingClientRect();
    var margem = 8;
    var left = r.left + r.width / 2 - t.width / 2 + window.scrollX;
    var top = r.top - t.height - 10 + window.scrollY;
    if (left < margem + window.scrollX) left = margem + window.scrollX;
    var lim = window.scrollX + document.documentElement.clientWidth - t.width - margem;
    if (left > lim) left = lim;
    var abaixo = false;
    if (top < window.scrollY + margem) { top = r.bottom + 10 + window.scrollY; abaixo = true; }
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

  // ----------------------------------------------------------
  //  Blocos da tela
  // ----------------------------------------------------------
  function htmlAgora(dados) {
    var a = dados.agora;
    if (!a) return "";
    var inf = info(a.codigo);
    var dia0 = dados.dias[0];
    var linhas = [];
    if (a.sensacao !== null) linhas.push(["Sensação", a.sensacao + "°"]);
    if (a.umidade !== null) linhas.push(["Umidade", a.umidade + "%"]);
    if (a.vento !== null) linhas.push(["Vento", a.vento + " km/h" + (a.rajada ? " (rajadas " + a.rajada + ")" : "")]);
    if (dia0) linhas.push(["Chuva hoje", dia0.prob + "% · " + dia0.mm + " mm"]);

    var alerta = "";
    if (dados.alerta) {
      var al = dados.alerta;
      alerta = al.tipo === "agora"
        ? '<div class="clima__alerta clima__alerta--agora"><b>Chovendo agora</b> no Centro</div>'
        : '<div class="clima__alerta"><b>Chuva provável</b> por volta das ' + dois(al.hora) + "h (" + al.prob + "% dos modelos)</div>";
    }

    return '<div class="clima__agora" style="--ws-cor:' + inf[3] + '">' +
      '<div class="clima__agora-main">' +
        '<span class="clima__agora-icone weather-strip__icone ' + inf[2] + '" aria-hidden="true">' + inf[0] + "</span>" +
        '<div><div class="clima__agora-rotulo">AGORA</div>' +
        '<strong class="clima__agora-temp" data-alvo="' + (a.temp === null ? "" : a.temp) + '">' + (a.temp === null ? "—" : a.temp + "°") + "</strong>" +
        '<div class="clima__agora-desc">' + esc(inf[1]) + "</div></div>" +
      "</div>" +
      '<dl class="clima__agora-dados">' +
        linhas.map(function (l) { return "<div><dt>" + l[0] + "</dt><dd>" + esc(l[1]) + "</dd></div>"; }).join("") +
      "</dl>" + alerta + "</div>";
  }

  function htmlDia(dia, i, hojeIso) {
    var inf = info(dia.codigo);
    var chuvaTxt = dia.prob >= 10 || dia.mm >= 0.5
      ? '<span class="ws-chuva"><i></i>' + dia.prob + "%" + (dia.mm >= 0.5 ? " · " + dia.mm + " mm" : "") + "</span>"
      : '<span class="ws-chuva ws-chuva--seco">sem chuva</span>';
    return '<span class="weather-strip__nome">' + nomeDia(dia.iso, hojeIso) +
        ' <small>' + dataCurta(dia.iso) + "</small></span>" +
      '<span class="weather-strip__icone ' + inf[2] + '" aria-hidden="true">' + inf[0] + "</span>" +
      '<span class="weather-strip__temp"><strong class="wt-max">' + dia.max + "°</strong> " +
        '<span class="wt-min">' + dia.min + "°</span></span>" +
      '<span class="ws-desc">' + esc(inf[1]) + "</span>" + chuvaTxt;
  }

  function htmlDetalhes(dados) {
    var cab = '<tr><th>Dia</th>' + dados.dias[0].porModelo.map(function (m) {
      return "<th>" + esc(m.modelo) + "</th>";
    }).join("") + "<th>Média</th></tr>";
    var linhas = dados.dias.map(function (d, i) {
      return "<tr><th>" + nomeDia(d.iso, dados.dias[0].iso) + " " + dataCurta(d.iso) + "</th>" +
        d.porModelo.map(function (m) {
          var t = (m.max === null ? "—" : m.min + "–" + m.max + "°");
          var mm = m.mm === null ? "" : '<small>' + m.mm + " mm</small>";
          return "<td>" + t + mm + "</td>";
        }).join("") +
        "<td class=\"clima__media\"><b>" + d.min + "–" + d.max + "°</b><small>" + d.mm + " mm · " +
        d.modelosChuva + "/" + d.modelosTotal + " c/ chuva</small></td></tr>";
    }).join("");
    return '<table class="clima__tabela"><thead>' + cab + "</thead><tbody>" + linhas + "</tbody></table>" +
      '<p class="clima__nota">“c/ chuva” = quantos modelos preveem ≥ 1 mm no dia. Se algum modelo errar sempre em relação ao que você observa, dá para removê-lo em <code>clima-core.js</code> (lista <code>MODELOS</code>).</p>';
  }

  function renderizar(dados) {
    var raiz = document.getElementById("clima");
    if (!raiz || !dados || !dados.dias || !dados.dias.length) return;
    dadosAtuais = dados;
    var hojeIso = dados.dias[0].iso;
    var h = new Date(dados.atualizadoEm);

    raiz.innerHTML =
      '<div class="clima__topo">' +
        '<p class="grid-section__label clima__titulo">Previsão do tempo</p>' +
        '<span class="clima__local">Ponta Porã · Centro</span>' +
      "</div>" +
      '<div class="clima__corpo">' + htmlAgora(dados) +
        '<div class="clima__dias" id="climaDias"></div></div>' +
      '<div class="clima__rodape">' +
        "<span>Média de " + dados.modelos.length + " modelos (" + esc(dados.modelos.join(", ")) +
          ") · Open-Meteo · atualizado às " + dois(h.getHours()) + ":" + dois(h.getMinutes()) + "</span>" +
        '<button type="button" class="clima__btn" id="climaDetalhesBtn" aria-expanded="false">ver por modelo</button>' +
      "</div>" +
      '<div class="clima__detalhes" id="climaDetalhes" hidden></div>';

    var wrap = document.getElementById("climaDias");
    elementoTemaSelecionado = null;

    dados.dias.forEach(function (dia, i) {
      var inf = info(dia.codigo);
      var item = document.createElement("div");
      item.className = "weather-strip__dia ws-anim" + (dia.iso === hojeIso ? " ws-hoje" : "");
      item.style.setProperty("--ws-cor", inf[3]);
      item.style.animationDelay = (i * 80) + "ms";
      item.innerHTML = htmlDia(dia, i, hojeIso);
      wrap.appendChild(item);

      item.addEventListener("mouseenter", function () { mostrarTooltip(dia.iso, inf[3], inf[1], item); });
      item.addEventListener("mouseleave", esconderTooltip);
      item.addEventListener("click", function () {
        if (tooltipEl && !tooltipEl.hidden) esconderTooltip();
        else mostrarTooltip(dia.iso, inf[3], inf[1], item);
        if (window.uvzClimaBg) {
          if (elementoTemaSelecionado === item) {
            item.classList.remove("ws-selecionado");
            elementoTemaSelecionado = null;
            window.uvzClimaBg.mostrarAtual();
          } else {
            if (elementoTemaSelecionado) elementoTemaSelecionado.classList.remove("ws-selecionado");
            item.classList.add("ws-selecionado");
            elementoTemaSelecionado = item;
            window.uvzClimaBg.mostrarPrevisao(dia.codigo);
          }
        }
      });

      setTimeout(function () {
        animarNumero(item.querySelector(".wt-max"), dia.max);
        animarNumero(item.querySelector(".wt-min"), dia.min);
      }, i * 80 + 200);
    });

    var tAgora = raiz.querySelector(".clima__agora-temp");
    if (tAgora && tAgora.getAttribute("data-alvo") !== "") animarNumero(tAgora, parseInt(tAgora.getAttribute("data-alvo"), 10));

    var btn = document.getElementById("climaDetalhesBtn");
    var det = document.getElementById("climaDetalhes");
    function aplicarDetalhes() {
      det.hidden = !detalhesAbertos;
      btn.setAttribute("aria-expanded", detalhesAbertos ? "true" : "false");
      btn.textContent = detalhesAbertos ? "ocultar modelos" : "ver por modelo";
      if (detalhesAbertos) det.innerHTML = htmlDetalhes(dados);
      if (typeof window.reajustarEscalaPainel === "function") window.reajustarEscalaPainel();
    }
    btn.addEventListener("click", function () { detalhesAbertos = !detalhesAbertos; aplicarDetalhes(); });
    if (detalhesAbertos) aplicarDetalhes();

    raiz.hidden = false;
    if (typeof window.reajustarEscalaPainel === "function") window.reajustarEscalaPainel();
  }

  function buscar(forcar) {
    if (!window.uvzClima) { console.warn("clima-core.js não carregado"); return; }
    window.uvzClima.obter(forcar).then(renderizar).catch(function (err) {
      console.warn("Previsão do tempo indisponível:", err && err.message);
    });
  }

  function iniciar() {
    if (!document.getElementById("clima")) return;
    buscar(false);
    setInterval(function () { buscar(true); }, INTERVALO_MS);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") buscar(false);
    });
    window.addEventListener("scroll", esconderTooltip, { passive: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
