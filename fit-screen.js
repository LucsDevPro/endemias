// ============================================================
// Ajusta a escala do painel inteiro para caber na altura da tela,
// sem precisar de barra de rolagem — como um "zoom" automático.
//
// Como funciona: mede a altura natural do conteúdo (header + main)
// e a altura disponível na janela; se o conteúdo for mais alto,
// reduz proporcionalmente (usando a propriedade CSS "zoom", que
// encolhe e reflui o layout de verdade, ao contrário de um
// "transform: scale" que deixaria espaço vazio nas laterais).
//
// Nunca aumenta além de 100% (não estica em telas grandes), e tem
// um limite mínimo — se a tela for baixa demais pra caber tudo de
// forma legível, prefere deixar rolar um pouquinho a encolher o
// texto até ficar ilegível.
//
// Navegadores muito antigos sem suporte a "zoom" (ex.: Firefox
// anterior a 2024) simplesmente continuam com rolagem normal —
// a página não quebra, só não ganha esse ajuste.
// ============================================================

(function () {
  "use strict";

  var ZOOM_MINIMO = 0.5;
  var MARGEM = 0.985; // deixa uma folguinha pra não cortar por 1px

  function suportaZoom() {
    return typeof document.body.style.zoom !== "undefined";
  }

  var ZOOM_MAXIMO = 1.9;
  var LARGURA_MINIMA_CSS = 1000;   // largura útil mínima do layout depois do zoom
  var LARGURA_TELA_PEQUENA = 1100; // abaixo disso: coluna única, rola normal

  function cabe() {
    return document.documentElement.scrollHeight <= window.innerHeight + 1;
  }

  function ajustarEscala() {
    var wrap = document.getElementById("fitWrap");
    if (!wrap || !suportaZoom()) return;

    // celular/tablet: sem ajuste, a página rola normalmente
    if (window.innerWidth < LARGURA_TELA_PEQUENA) {
      wrap.style.zoom = 1;
      return;
    }

    // maior zoom que ainda cabe na altura E mantém largura útil suficiente
    var teto = Math.min(ZOOM_MAXIMO, window.innerWidth / LARGURA_MINIMA_CSS);
    var lo = ZOOM_MINIMO, hi = Math.max(ZOOM_MINIMO, teto);
    wrap.style.zoom = hi;
    if (cabe()) return;
    for (var i = 0; i < 9; i++) {
      var meio = (lo + hi) / 2;
      wrap.style.zoom = meio;
      if (cabe()) lo = meio; else hi = meio;
    }
    wrap.style.zoom = Math.floor(lo * MARGEM * 1000) / 1000;
  }

  var pendente = null;
  function agendarAjuste() {
    clearTimeout(pendente);
    pendente = setTimeout(ajustarEscala, 80);
  }

  window.addEventListener("load", ajustarEscala);
  window.addEventListener("resize", agendarAjuste);

  // outros scripts (ex.: weather.js, que muda a altura da página
  // de forma assíncrona) podem pedir um reajuste assim:
  window.reajustarEscalaPainel = agendarAjuste;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ajustarEscala);
  } else {
    ajustarEscala();
  }
})();
