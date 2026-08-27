// ============================================================
// Efeito de fundo climático — Painel - UVZ
//
// Aplica no fundo do site inteiro (todas as páginas) um efeito
// visual sutil de acordo com o tempo atual em Ponta Porã:
// chuva, garoa, tempestade (com relâmpago), neblina, nublado,
// sol ou neve. Usa Open-Meteo (sem chave) e guarda o resultado
// em sessionStorage por 30 min para não repetir a busca em
// cada página.
// ============================================================

(function () {
  "use strict";

  var LAT = -22.53;
  var LON = -55.72;
  var CACHE_KEY = "uvzClimaBg";
  var CACHE_MS = 30 * 60 * 1000;

  // mapeia o código WMO do tempo para uma categoria de efeito
  function categoria(codigo) {
    if (codigo === 0 || codigo === 1) return "sol";
    if (codigo === 2 || codigo === 3) return "nuvem";
    if (codigo === 45 || codigo === 48) return "neblina";
    if ([51, 53, 55, 56, 57].indexOf(codigo) !== -1) return "garoa";
    if ([61, 63, 65, 66, 67, 80, 81].indexOf(codigo) !== -1) return "chuva";
    if ([82, 95, 96, 99].indexOf(codigo) !== -1) return "tempestade";
    if ([71, 73, 75, 77, 85, 86].indexOf(codigo) !== -1) return "neve";
    return "nuvem";
  }

  var reduzMovimento =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------
  // Camada CSS (sol / nuvem / neblina) — leve, sem canvas
  // ------------------------------------------------------------
  function injetarCSS() {
    if (document.getElementById("uvz-clima-bg-css")) return;
    var s = document.createElement("style");
    s.id = "uvz-clima-bg-css";
    s.textContent = [
      "#uvzClimaCanvas {",
      "  position: fixed; inset: 0; width: 100%; height: 100%;",
      "  z-index: 0; pointer-events: none;",
      "}",
      "body[data-clima-bg='sol'] .uvz-clima-tint {",
      "  background: radial-gradient(circle at 75% 12%, rgba(255,185,0,.14) 0%, transparent 45%);",
      "  animation: uvzSolPulso 8s ease-in-out infinite;",
      "}",
      "body[data-clima-bg='nuvem'] .uvz-clima-tint {",
      "  background: radial-gradient(circle at 30% 20%, rgba(93,107,130,.10) 0%, transparent 55%);",
      "}",
      "body[data-clima-bg='neblina'] .uvz-clima-tint {",
      "  background: linear-gradient(180deg, rgba(138,150,168,.14) 0%, transparent 60%);",
      "  animation: uvzNeblinaDeriva 14s ease-in-out infinite;",
      "}",
      ".uvz-clima-tint {",
      "  position: fixed; inset: 0; z-index: 0; pointer-events: none;",
      "}",
      "@keyframes uvzSolPulso {",
      "  0%, 100% { opacity: .7; } 50% { opacity: 1; }",
      "}",
      "@keyframes uvzNeblinaDeriva {",
      "  0%, 100% { transform: translateX(0); }",
      "  50% { transform: translateX(2.5%); }",
      "}",
      "body[data-clima-bg='tempestade'] { animation: none; }",
      ".uvz-relampago {",
      "  position: fixed; inset: 0; z-index: 0; pointer-events: none;",
      "  background: #fff; opacity: 0; mix-blend-mode: overlay;",
      "}",
      "@media (prefers-reduced-motion: reduce) {",
      "  body[data-clima-bg='sol'] .uvz-clima-tint,",
      "  body[data-clima-bg='neblina'] .uvz-clima-tint { animation: none; }",
      "}"
    ].join("\n");
    document.head.appendChild(s);
  }

  // ------------------------------------------------------------
  // Canvas de partículas (chuva / garoa / tempestade / neve)
  // ------------------------------------------------------------
  var canvas, ctx, gotas = [], relampagoEl, w, h, cat, raf;
  var codigoAoVivo = null;

  function montarCamadas() {
    var tint = document.createElement("div");
    tint.className = "uvz-clima-tint";
    document.body.insertBefore(tint, document.body.firstChild);

    canvas = document.createElement("canvas");
    canvas.id = "uvzClimaCanvas";
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext("2d");

    relampagoEl = document.createElement("div");
    relampagoEl.className = "uvz-relampago";
    document.body.insertBefore(relampagoEl, document.body.firstChild);

    redimensionar();
    window.addEventListener("resize", redimensionar, { passive: true });
  }

  function redimensionar() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function criarGotas(qtd, opts) {
    gotas = [];
    for (var i = 0; i < qtd; i++) {
      gotas.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: opts.len[0] + Math.random() * (opts.len[1] - opts.len[0]),
        vy: opts.vy[0] + Math.random() * (opts.vy[1] - opts.vy[0]),
        vx: opts.vx,
        op: opts.op[0] + Math.random() * (opts.op[1] - opts.op[0]),
        raio: opts.raio || 0
      });
    }
  }

  var PERFIS = {
    garoa:      { qtd: 40,  len: [4, 9],   vy: [3, 5],   vx: -0.3, op: [0.12, 0.25], cor: "150,190,230" },
    chuva:      { qtd: 110, len: [10, 22], vy: [7, 12],  vx: -0.6, op: [0.18, 0.35], cor: "140,180,225" },
    tempestade: { qtd: 170, len: [14, 28], vy: [11, 17], vx: -1.1, op: [0.22, 0.4],  cor: "150,170,210" },
    neve:       { qtd: 70,  len: [0, 0],   vy: [0.6, 1.6], vx: 0,  op: [0.4, 0.85],  cor: "255,255,255", raio: [1.4, 3.2] }
  };

  function passo() {
    ctx.clearRect(0, 0, w, h);
    var perfil = PERFIS[cat];
    ctx.lineCap = "round";

    for (var i = 0; i < gotas.length; i++) {
      var g = gotas[i];
      ctx.strokeStyle = "rgba(" + perfil.cor + "," + g.op + ")";

      if (cat === "neve") {
        ctx.fillStyle = "rgba(" + perfil.cor + "," + g.op + ")";
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.raio, 0, Math.PI * 2);
        ctx.fill();
        g.x += Math.sin(g.y * 0.01) * 0.4;
      } else {
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x + g.vx * 3, g.y + g.len);
        ctx.stroke();
      }

      g.x += g.vx;
      g.y += g.vy;

      if (g.y > h + 20 || g.x < -20 || g.x > w + 20) {
        g.x = Math.random() * w;
        g.y = -20;
      }
    }

    raf = requestAnimationFrame(passo);
  }

  var proximoRelampago = 0;
  function loopTempestade(t) {
    if (cat !== "tempestade") return;
    if (t > proximoRelampago) {
      relampagoEl.style.transition = "none";
      relampagoEl.style.opacity = "0.55";
      requestAnimationFrame(function () {
        relampagoEl.style.transition = "opacity .6s ease-out";
        relampagoEl.style.opacity = "0";
      });
      proximoRelampago = t + 6000 + Math.random() * 9000;
    }
    requestAnimationFrame(loopTempestade);
  }

  function iniciarEfeitoParticulas() {
    var perfil = PERFIS[cat];
    var qtd = reduzMovimento ? Math.round(perfil.qtd * 0.4) : perfil.qtd;
    criarGotas(qtd, perfil);
    if (raf) cancelAnimationFrame(raf);
    if (!reduzMovimento) passo();
    else { // desenha estático uma vez, sem loop contínuo
      ctx.clearRect(0, 0, w, h);
      passo();
      cancelAnimationFrame(raf);
    }
    if (cat === "tempestade") requestAnimationFrame(loopTempestade);
  }

  // ------------------------------------------------------------
  // Aplica a categoria no <body> e liga o efeito certo
  // ------------------------------------------------------------
  function aplicar(codigo) {
    cat = categoria(codigo);
    document.body.setAttribute("data-clima-bg", cat);

    if (cat === "chuva" || cat === "garoa" || cat === "tempestade" || cat === "neve") {
      canvas.style.display = "block";
      iniciarEfeitoParticulas();
    } else {
      canvas.style.display = "none";
      if (raf) cancelAnimationFrame(raf);
    }
  }

  function buscarEAplicar() {
    try {
      var cache = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (cache && Date.now() - cache.t < CACHE_MS) {
        codigoAoVivo = cache.codigo;
        aplicar(cache.codigo);
        return;
      }
    } catch (e) { /* sessionStorage indisponível — segue sem cache */ }

    var url = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + LAT + "&longitude=" + LON +
      "&current=weather_code&timezone=America%2FCampo_Grande";

    fetch(url, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("resposta " + r.status); return r.json(); })
      .then(function (dados) {
        var codigo = dados && dados.current ? dados.current.weather_code : 0;
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ codigo: codigo, t: Date.now() }));
        } catch (e) { /* ignora */ }
        codigoAoVivo = codigo;
        aplicar(codigo);
      })
      .catch(function (err) {
        console.warn("Efeito de clima indisponível:", err.message);
      });
  }

  function iniciar() {
    injetarCSS();
    montarCamadas();
    buscarEAplicar();

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
      } else if (!document.hidden && cat &&
        (cat === "chuva" || cat === "garoa" || cat === "tempestade" || cat === "neve")) {
        passo();
      }
    });
  }

  // ------------------------------------------------------------
  // API pública — permite que outro script (ex.: o card do dia
  // na faixa de previsão) troque o tema do fundo manualmente
  // ------------------------------------------------------------
  window.uvzClimaBg = {
    // aplica o tema de um código de tempo específico (ex.: previsão de um dia)
    mostrarPrevisao: function (codigo) {
      aplicar(codigo);
    },
    // volta para o tempo real (o último valor buscado da API)
    mostrarAtual: function () {
      if (codigoAoVivo !== null) aplicar(codigoAoVivo);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
