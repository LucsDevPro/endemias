// ============================================================
// Recarrega o painel principal sozinho a cada 60 minutos.
//
// Útil pra quem deixa esta página aberta o dia inteiro numa tela
// (ex.: monitor da secretaria) — garante que os links, o selo do
// período de compras e a previsão do tempo sempre reflitam a
// versão mais atual da página, sem precisar apertar F5 na mão.
//
// Só é carregado no painel principal (index.html) — as páginas dos
// geradores não recarregam sozinhas, de propósito, pra não perder
// o que alguém estiver digitando num formulário no meio do caminho.
// ============================================================

(function () {
  "use strict";

  var INTERVALO_RECARGA_MS = 60 * 60 * 1000; // 60 minutos

  setTimeout(function () {
    window.location.reload();
  }, INTERVALO_RECARGA_MS);
})();
