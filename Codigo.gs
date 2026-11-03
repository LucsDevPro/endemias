/**
 * ============================================================
 * Painel de Endemias — planilha de funcionários via Google
 * ============================================================
 *
 * Isto NÃO roda no site. Roda no Google (script.google.com),
 * dentro da sua conta. O site só abre esta página numa janela
 * pop-up; se a pessoa não estiver logada com uma conta
 * autorizada, o próprio Google barra o acesso antes mesmo de
 * este código rodar.
 *
 * CONFIGURAÇÃO — leia o README do projeto, seção "Carregar a
 * planilha do Google (opcional)", para o passo a passo completo.
 * Resumo:
 *
 *   1. Crie uma Planilha Google com as colunas (na linha 1):
 *      Matricula | Nome | Admissao | CPF
 *
 *   2. Nessa planilha: Extensões → Apps Script. Apague o conteúdo
 *      de exemplo e cole este arquivo inteiro.
 *
 *   3. Ajuste ALLOWED_EMAILS (e/ou ALLOWED_DOMAIN) abaixo.
 *
 *   4. Implantar → Nova implantação → tipo "App da Web".
 *        Executar como: Eu (seu e-mail)
 *        Quem pode acessar: "Qualquer pessoa no domínio X"
 *          (se sua Prefeitura usa Google Workspace) OU
 *          "Qualquer pessoa" (se forem contas Gmail comuns —
 *          nesse caso o ALLOWED_EMAILS abaixo é a única barreira
 *          real, então mantenha essa lista sempre atualizada).
 *
 *   5. Copie a URL que o Google gerar (termina em /exec) e cole
 *      em ferias-config.js, no site, no campo APPS_SCRIPT_URL.
 */

// --------- CONFIGURE AQUI ---------

// Lista de e-mails autorizados a puxar a planilha.
var ALLOWED_EMAILS = [
  // "fulano@pontapora.ms.gov.br",
  // "ciclana@pontapora.ms.gov.br"
];

// Se sua Prefeitura usa um domínio Google Workspace próprio,
// coloque-o aqui (ex.: "pontapora.ms.gov.br") para autorizar
// qualquer conta desse domínio, além dos e-mails individuais
// acima. Deixe "" para não usar essa checagem.
var ALLOWED_DOMAIN = "";

// Nome da aba da planilha onde estão os dados.
var NOME_ABA = "Página1";

// -----------------------------------

function doGet(e) {
  var email = "";
  try {
    email = Session.getActiveUser().getEmail() || "";
  } catch (err) {
    email = "";
  }

  var autorizado = emailAutorizado_(email);

  if (!autorizado) {
    return respostaHtml_({
      tipo: "planilha-endemias",
      erro: email
        ? "a conta " + email + " não está autorizada a acessar esta planilha."
        : "não foi possível confirmar sua conta Google. Tente novamente logado numa conta autorizada."
    }, "Acesso não autorizado.");
  }

  var dados = lerPlanilha_();
  return respostaHtml_({
    tipo: "planilha-endemias",
    dados: dados
  }, "Planilha carregada — pode fechar esta janela.");
}

function emailAutorizado_(email) {
  if (!email) return false;
  if (ALLOWED_EMAILS.indexOf(email) !== -1) return true;
  if (ALLOWED_DOMAIN && email.indexOf("@" + ALLOWED_DOMAIN) !== -1) return true;
  return false;
}

function lerPlanilha_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA);
  var valores = planilha.getDataRange().getValues();
  var cabecalho = valores[0].map(function (h) { return String(h).trim().toLowerCase(); });

  var idxMat = cabecalho.indexOf("matricula");
  var idxNome = cabecalho.indexOf("nome");
  var idxAdm = cabecalho.indexOf("admissao");
  var idxCpf = cabecalho.indexOf("cpf");

  var linhas = [];
  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (linha.join("").trim() === "") continue;
    linhas.push({
      matricula: idxMat !== -1 ? String(linha[idxMat]) : "",
      nome: idxNome !== -1 ? String(linha[idxNome]) : "",
      admissao: idxAdm !== -1 ? String(linha[idxAdm]) : "",
      cpf: idxCpf !== -1 ? String(linha[idxCpf]) : ""
    });
  }
  return linhas;
}

// Devolve uma página HTML minúscula que só serve para mandar os
// dados de volta para a janela que abriu este pop-up (window.opener)
// via postMessage, e depois fechar sozinha.
function respostaHtml_(mensagem, textoTela) {
  var json = JSON.stringify(mensagem)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");

  var html =
    "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body " +
    "style='font-family:sans-serif;padding:2rem;color:#333'>" +
    "<p>" + textoTela + "</p>" +
    "<script>" +
    "if (window.opener) { window.opener.postMessage(" + json + ", '*'); }" +
    "setTimeout(function(){ window.close(); }, 1200);" +
    "</" + "script>" +
    "</body></html>";

  return HtmlService.createHtmlOutput(html);
}

/**
 * ============================================================
 * Gerador de Comunicação Interna — "Melhorar texto" com IA
 * ============================================================
 *
 * Chamado via POST pelo site (ci.html / ci.js). Recebe o texto
 * digitado/ditado, pede pra uma IA (Gemini, da própria Google)
 * corrigir e melhorar o texto e sugerir um assunto curto, e
 * devolve os dois. A chave da API NUNCA fica no site — fica só
 * aqui, guardada nas "Propriedades do Script" (Configurações
 * do projeto → Propriedades do script), que o navegador de
 * ninguém consegue ler.
 *
 * CONFIGURAÇÃO — veja o README, seção "Melhorar texto com IA
 * (opcional)". Resumo — em ⚙️ Configurações do projeto →
 * Propriedades do script, adicione:
 *
 *   AI_PROVIDER = qual IA usar:
 *                   "gemini"  (padrão) — Google Gemini
 *                   "claude"           — Anthropic Claude
 *                   "openai"           — OpenAI ou qualquer serviço
 *                                        compatível (Groq, OpenRouter…)
 *   AI_API_KEY  = a chave de API do serviço escolhido
 *   AI_MODEL    = (opcional) nome do modelo. Padrões: gemini-2.5-flash /
 *                 claude-haiku-5-5. Para "openai" é obrigatório.
 *   AI_BASE_URL = só para "openai": endereço do serviço (padrão
 *                 https://api.openai.com/v1; Groq:
 *                 https://api.groq.com/openai/v1)
 *   CI_TOKEN    = uma senha simples de sua escolha (opcional, mas
 *                 recomendado — veja ci-config.js no site)
 *
 * (Quem já usava GEMINI_API_KEY / GEMINI_MODEL não precisa mudar nada:
 * continuam valendo.) Depois, reimplante o App da Web e cole a URL em
 * ci-config.js, no campo AI_ENDPOINT_URL.
 */

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse_({ erro: "Não entendi o pedido enviado pelo site." });
  }

  var props = PropertiesService.getScriptProperties();
  var tokenEsperado = props.getProperty("CI_TOKEN");
  if (tokenEsperado && body.token !== tokenEsperado) {
    return jsonResponse_({ erro: "Token de acesso inválido." });
  }

  var texto = (body.texto || "").trim();
  if (!texto) return jsonResponse_({ erro: "Texto vazio." });

  var provedor = (props.getProperty("AI_PROVIDER") || "gemini").toLowerCase().trim();
  var apiKey = props.getProperty("AI_API_KEY") || props.getProperty("GEMINI_API_KEY");
  if (!apiKey) return jsonResponse_({ erro: "AI_API_KEY não configurada nas Propriedades do Script." });
  var modelo = props.getProperty("AI_MODEL") || props.getProperty("GEMINI_MODEL") || "";

  var prompt =
    "Você é um assistente administrativo de uma prefeitura brasileira, revisando uma Comunicação Interna " +
    "do setor de Endemias e Zoonoses. Corrija ortografia, gramática e pontuação do texto abaixo, e melhore " +
    "a clareza e a linguagem administrativa formal — SEM inventar, remover ou alterar informações, datas, " +
    "nomes, números ou o sentido original. Depois, gere um assunto curto e objetivo (até 10 palavras) para " +
    "esse texto. Responda APENAS com um JSON válido, neste formato exato, sem markdown e sem texto fora do JSON:\n" +
    "{\"assunto\": \"...\", \"texto\": \"...\"}\n\n" +
    "Texto original:\n" + texto;

  var resultado;
  try {
    resultado = chamarIA_(provedor, apiKey, modelo, prompt, props);
  } catch (err) {
    return jsonResponse_({ erro: err.message });
  }

  var parsed = extrairJson_(resultado);
  if (!parsed) return jsonResponse_({ erro: "Não entendi a resposta da IA." });
  return jsonResponse_({ assunto: parsed.assunto || "", texto: parsed.texto || "" });
}

// Chama a IA escolhida e devolve o TEXTO da resposta. Lança Error com
// mensagem em português se algo falhar.
function chamarIA_(provedor, apiKey, modelo, prompt, props) {
  var url, opcoes, ler, rotulo;

  if (provedor === "claude") {
    rotulo = "Claude";
    url = "https://api.anthropic.com/v1/messages";
    opcoes = {
      method: "post",
      contentType: "application/json",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      payload: JSON.stringify({
        model: modelo || "claude-haiku-5-5",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }]
      }),
      muteHttpExceptions: true
    };
    ler = function (d) {
      var partes = (d.content || []).filter(function (c) { return c.type === "text"; });
      return partes.length ? partes[0].text : "";
    };

  } else if (provedor === "openai") {
    rotulo = "IA";
    if (!modelo) throw new Error("Para AI_PROVIDER = openai, defina AI_MODEL nas Propriedades do Script.");
    var base = (props.getProperty("AI_BASE_URL") || "https://api.openai.com/v1").replace(/\/+$/, "");
    url = base + "/chat/completions";
    opcoes = {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + apiKey },
      payload: JSON.stringify({
        model: modelo,
        messages: [{ role: "user", content: prompt }]
      }),
      muteHttpExceptions: true
    };
    ler = function (d) {
      return d.choices && d.choices[0] && d.choices[0].message ? d.choices[0].message.content : "";
    };

  } else if (provedor === "gemini") {
    rotulo = "Gemini";
    url = "https://generativelanguage.googleapis.com/v1beta/models/" +
      encodeURIComponent(modelo || "gemini-2.5-flash") + ":generateContent";
    opcoes = {
      method: "post",
      contentType: "application/json",
      headers: { "x-goog-api-key": apiKey },
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
      muteHttpExceptions: true
    };
    ler = function (d) {
      return d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts
        ? (d.candidates[0].content.parts[0].text || "") : "";
    };

  } else {
    throw new Error("AI_PROVIDER inválido (\"" + provedor + "\"). Use gemini, claude ou openai.");
  }

  var resp;
  try {
    resp = UrlFetchApp.fetch(url, opcoes);
  } catch (err) {
    throw new Error("Falha ao chamar a IA: " + err.message);
  }

  var dados;
  try {
    dados = JSON.parse(resp.getContentText());
  } catch (err) {
    throw new Error("Resposta inesperada da IA (" + rotulo + ", código " + resp.getResponseCode() + ").");
  }

  var texto = ler(dados);
  if (!texto) {
    var motivo = (dados.error && (dados.error.message || dados.error)) || "sem detalhes";
    throw new Error("A IA (" + rotulo + ") não retornou um resultado (" + motivo + ").");
  }
  return texto;
}

// Pega o primeiro objeto JSON do texto, mesmo que a IA tenha colocado
// ```json ... ``` ou uma frase antes/depois.
function extrairJson_(texto) {
  var ini = texto.indexOf("{");
  var fim = texto.lastIndexOf("}");
  if (ini === -1 || fim <= ini) return null;
  try {
    return JSON.parse(texto.slice(ini, fim + 1));
  } catch (err) {
    return null;
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
