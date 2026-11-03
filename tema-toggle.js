// Alterna entre tema escuro (padrão) e claro; lembra a escolha neste navegador.
(function () {
  "use strict";
  var KEY = "uvzTema";
  var raiz = document.documentElement;

  function ler() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function gravar(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* sem armazenamento */ } }

  function aplicar(t) {
    if (t === "claro") raiz.setAttribute("data-tema", "claro");
    else raiz.removeAttribute("data-tema");
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute("content", t === "claro" ? "light" : "dark");
  }

  aplicar(ler());   // roda cedo (script no <head>) para não piscar

  function botao() {
    var barra = document.querySelector(".topbar__inner");
    if (!barra) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tema-btn";
    function rotulo() {
      var claro = raiz.getAttribute("data-tema") === "claro";
      b.innerHTML = (claro ? "🌙" : "☀️") + " <span>" + (claro ? "Tema escuro" : "Tema claro") + "</span>";
      b.setAttribute("aria-label", claro ? "Mudar para o tema escuro" : "Mudar para o tema claro");
    }
    b.addEventListener("click", function () {
      var novo = raiz.getAttribute("data-tema") === "claro" ? "escuro" : "claro";
      aplicar(novo); gravar(novo); rotulo();
    });
    rotulo();
    var voltar = barra.querySelector(".topbar__back");
    barra.insertBefore(b, voltar || null);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", botao);
  else botao();
})();
