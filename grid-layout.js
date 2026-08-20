// ============================================================
// Ajusta automaticamente quantas colunas cada fileira de cartões
// usa no painel principal, para as fileiras ficarem "cheias" em
// vez de deixar uma última linha torta com 1 ou 2 cartões soltos.
//
// Alvo: 5 cartões por fileira. Seções pequenas (até 5 cartões)
// ficam numa fileira só, do tamanho exato da seção — sem esticar
// pra 5 colunas vazias (o CSS centraliza essa fileira mais curta).
// Se sobrar pouco na última linha de uma seção grande, tenta 4.
// Só entra em ação na largura "desktop" — no celular e no tablet,
// as regras de @media do CSS já cuidam da quantidade de colunas.
// ============================================================

(function () {
  "use strict";

  function escolherColunas(n) {
    if (n <= 1) return 1;
    if (n <= 5) return n;

    var candidatos = [5, 4];
    var melhor = null;

    candidatos.forEach(function (c) {
      var resto = n % c;
      var ultimaFileira = resto === 0 ? c : resto;
      // fileira "cheia" (resto 0) sempre ganha; entre duas fileiras
      // incompletas, prefere a que deixa mais cartões na última linha
      // (evita sobrar 1 cartão sozinho).
      var pontuacao = (resto === 0 ? 100 : 0) + ultimaFileira;
      if (!melhor || pontuacao > melhor.pontuacao) {
        melhor = { c: c, pontuacao: pontuacao };
      }
    });

    return melhor.c;
  }

  function ajustar() {
    document.querySelectorAll(".grid-section .grid").forEach(function (grid) {
      var qtd = grid.querySelectorAll(":scope > .card").length;
      if (qtd === 0) return;
      grid.style.setProperty("--cols", escolherColunas(qtd));
    });
  }

  ajustar();
})();
