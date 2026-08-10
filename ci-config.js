// ============================================================
// Configuração do Gerador de Comunicação Interna.
//
// AI_ENDPOINT_URL: cole aqui a URL do seu Google Apps Script
// (o mesmo do Gerador de Férias, ou outro dedicado), depois de
// publicá-lo com a função doPost de IA.gs — veja o passo a
// passo no README, seção "Melhorar texto com IA (opcional)".
// Deixe como "" para esconder o botão "✨ Melhorar texto" e
// preencher o Assunto e o Texto só manualmente — funciona sem
// nenhuma configuração extra.
//
// AI_TOKEN: uma senha simples que o site manda junto do pedido,
// e que o script do Google confere antes de gastar sua cota de
// IA. Não é um segredo de verdade (fica visível no código do
// site), é só uma trava contra alguém achar a URL por acaso e
// usar sua chave de API à toa. Defina o mesmo valor aqui e nas
// Propriedades do Script (CI_TOKEN).
// ============================================================

var CI_CONFIG = {
  AI_ENDPOINT_URL: "",
  AI_TOKEN: ""
};
