// ============================================================
// Configuração do Registro de Folgas e CIs (opcional).
//
// URL: cole aqui a URL do Apps Script "RegistroFolgas.gs"
// (a que termina em /exec) depois de publicá-lo — veja o passo
// a passo no README, seção "Registro de folgas e CIs na planilha".
// Deixe "" para desligar: o site funciona normalmente, só não
// envia os registros para a planilha.
//
// TOKEN: senha simples que o site manda junto de cada registro;
// o script confere antes de gravar. Defina o mesmo valor aqui e
// nas Propriedades do Script (REGISTRO_TOKEN). Não é um segredo
// de verdade (fica visível no código do site), só uma trava
// contra gravações por engano ou por quem achar a URL.
// ============================================================

var REGISTRO_CONFIG = {
  URL: "",
  TOKEN: ""
};
