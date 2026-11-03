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

  function iniciar() {
    cards().forEach(ligarCard);
    entradaAoRolar();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
