// ============================================================
// Efeitos da tela inicial — UVZ Connect
//  • holofote que segue o mouse dentro dos cards (--mx / --my)
//  • leve inclinação 3D nos cards
//  • onda amarela no clique
//  • entrada dos blocos ao rolar a tela
// Tudo é opcional: sem este script o site funciona igual.
// Respeita "reduzir movimento" do sistema.
// ============================================================

(function () {
  "use strict";

  var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var toque = window.matchMedia && window.matchMedia("(hover: none)").matches;

  function cards() { return Array.prototype.slice.call(document.querySelectorAll(".card")); }

  function ligarCard(card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      // o painel pode estar com "zoom" (fit-screen); usa proporção, não pixels
      var x = (e.clientX - r.left) / r.width;
      var y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      if (!reduz && !toque) {
        var rx = ((0.5 - y) * 7).toFixed(2);
        var ry = ((x - 0.5) * 9).toFixed(2);
        card.style.transform = "perspective(700px) translateY(-5px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      }
    });
    card.addEventListener("pointerleave", function () {
      card.style.transform = "";
    });
    card.addEventListener("pointerdown", function (e) {
      if (reduz) return;
      var r = card.getBoundingClientRect();
      var o = document.createElement("span");
      o.className = "fx-onda";
      o.style.left = ((e.clientX - r.left) / r.width * 100) + "%";
      o.style.top = ((e.clientY - r.top) / r.height * 100) + "%";
      card.appendChild(o);
      setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 700);
    });
  }

  function entradaAoRolar() {
    if (reduz || !("IntersectionObserver" in window)) return;
    var alvos = document.querySelectorAll(".clima, .grid-section--destaque");
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (i) {
        if (i.isIntersecting) { i.target.classList.add("fx-visivel"); io.unobserve(i.target); }
      });
    }, { threshold: 0.08 });
    alvos.forEach(function (a) {
      // só esconde se estiver fora da tela agora (evita piscar o que já está visível)
      var r = a.getBoundingClientRect();
      if (r.top > window.innerHeight) { a.classList.add("fx-entrada"); io.observe(a); }
    });
  }

  // ---- rede de partículas que reage ao mouse (azul, verde e amarelo do logo) ----
  function particulas() {
    if (reduz) return;
    var cv = document.createElement("canvas");
    cv.id = "fxParticulas";
    document.body.insertBefore(cv, document.body.firstChild);
    var ctx = cv.getContext("2d");
    var w = 0, h = 0, pts = [], mouse = { x: -999, y: -999 };
    var CORES = ["0,126,202", "0,185,59", "255,185,0"];
    var rodando = true;

    function dimensionar() {
      w = cv.width = window.innerWidth;
      h = cv.height = window.innerHeight;
      var n = Math.max(28, Math.min(80, Math.round(w * h / 24000)));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
          r: 1 + Math.random() * 1.8, c: CORES[i % 3]
        });
      }
    }

    function quadro() {
      if (!rodando) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.fillStyle = "rgba(" + p.c + ",0.75)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 14400) {
            ctx.strokeStyle = "rgba(" + p.c + "," + (0.28 * (1 - d / 14400)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        var mx = p.x - mouse.x, my = p.y - mouse.y, md = mx * mx + my * my;
        if (md < 22500) {
          ctx.strokeStyle = "rgba(255,185,0," + (0.5 * (1 - md / 22500)).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      requestAnimationFrame(quadro);
    }

    dimensionar();
    window.addEventListener("resize", dimensionar, { passive: true });
    window.addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      rodando = !document.hidden;
      if (rodando) requestAnimationFrame(quadro);
    });
    requestAnimationFrame(quadro);
  }

  function varredura() {
    if (reduz) return;
    var d = document.createElement("div");
    d.className = "fx-scan";
    document.body.insertBefore(d, document.body.firstChild);
  }

  function iniciar() {
    // ordem de entrada dos cards (efeito cascata)
    document.querySelectorAll(".grid").forEach(function (g) {
      Array.prototype.forEach.call(g.querySelectorAll(":scope > .card"), function (c, i) { c.style.setProperty("--i", i); });
    });
    cards().forEach(ligarCard);
    entradaAoRolar();
    particulas();
    varredura();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
