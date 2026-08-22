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

  var ZOOM_MINIMO = 0.6;
  var MARGEM = 0.985; // deixa uma folguinha pra não cortar por 1px

  function suportaZoom() {
    return typeof document.body.style.zoom !== "undefined";
  }

  function ajustarEscala() {
    var wrap = document.getElementById("fitWrap");
    if (!wrap || !suportaZoom()) return;

    // reseta pra medir o tamanho natural (sem zoom) antes de decidir
    wrap.style.zoom = 1;

    var alturaConteudo = wrap.scrollHeight;
    var alturaDisponivel = window.innerHeight;

    if (alturaConteudo <= alturaDisponivel) {
      wrap.style.zoom = 1;
      return;
    }

    var fator = (alturaDisponivel / alturaConteudo) * MARGEM;
    fator = Math.max(ZOOM_MINIMO, Math.min(1, fator));
    wrap.style.zoom = fator;
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
