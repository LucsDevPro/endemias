/**
 * ============================================================
 * Painel de Endemias — Registro de folgas e CIs na planilha
 * ============================================================
 *
 * Roda no Google (script.google.com), na sua conta. Cada folga ou
 * CI gerada no site vira linhas na planilha:
 *   - aba "Folgas": uma linha por agente (CI, tipo, agente, datas, emissor)
 *   - aba "CIs":    uma linha por CI (número, assunto, emissor)
 *   - aba "Férias": uma linha por servidor (período, dias, início, fim)
 *
 * PASSO A PASSO
 *  1. Crie uma Planilha Google nova (ex.: "Registro Endemias").
 *  2. Nela: Extensões → Apps Script. Apague o conteúdo de exemplo
 *     e cole este arquivo inteiro. Salve.
 *  3. (Recomendado) Engrenagem "Configurações do projeto" →
 *     Propriedades do script → adicione  REGISTRO_TOKEN  com uma
 *     senha simples à sua escolha (a mesma vai em registro-config.js).
 *  4. Implantar → Nova implantação → tipo "App da Web":
 *        Executar como: Eu
 *        Quem pode acessar: Qualquer pessoa
 *     (o site grava sem login; a trava é o token acima).
 *     Autorize quando o Google pedir.
 *  5. Copie a URL (termina em /exec) e cole em registro-config.js
 *     (campo URL, e o mesmo token em TOKEN).
 *  6. Teste: abra a URL no navegador — deve aparecer {"ok":true,...}.
 *
 * As abas e os cabeçalhos são criados sozinhos no primeiro registro.
 * Ao alterar este código, use Implantar → Gerenciar implantações →
 * editar → Nova versão, senão a URL continua rodando a versão antiga.
 */

var ABA_FOLGAS = "Folgas";
var ABA_CIS = "CIs";
var CAB_FOLGAS = ["Registrado em", "CI nº", "Tipo", "Agente", "Datas", "Emissor", "Ação", "Chave"];
var ABA_FERIAS = "Férias";
var CAB_FERIAS = ["Registrado em", "Servidor", "Matrícula", "Cargo", "Período aquisitivo", "Dias", "Início", "Fim", "Requerimento em", "Chave"];
var CAB_CIS = ["Registrado em", "CI nº", "Assunto", "Emissor", "Ação", "Chave"];

function doGet() {
  return json_({ ok: true, servico: "Registro de folgas e CIs" });
}

function doPost(e) {
  var corpo;
  try { corpo = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, erro: "JSON inválido" }); }

  var esperado = PropertiesService.getScriptProperties().getProperty("REGISTRO_TOKEN");
  if (esperado && corpo.token !== esperado) return json_({ ok: false, erro: "Token inválido" });

  var ev = corpo.evento || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (ev.kind === "folga") registrarFolga_(ev);
    else if (ev.kind === "ci") registrarCi_(ev);
    else if (ev.kind === "ferias") registrarFerias_(ev);
    else return json_({ ok: false, erro: "Tipo de registro desconhecido" });
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

function registrarFolga_(ev) {
  var aba = aba_(ABA_FOLGAS, CAB_FOLGAS);
  var quando = quando_(ev.quando);
  (ev.agentes || []).forEach(function (a) {
    var datas = (a.datas || []).join("; ");
    var chave = [ev.ci, ev.tipo, a.nome, datas].join("|");
    gravar_(aba, chave, 8, 7, quando, ev.acao, [quando, "'" + ev.ci, ev.tipo, a.nome, datas, ev.emissor, ev.acao, chave]);
  });
}

function registrarFerias_(ev) {
  var aba = aba_(ABA_FERIAS, CAB_FERIAS);
  var quando = quando_(ev.quando);
  (ev.servidores || []).forEach(function (f) {
    var chave = [f.matricula || f.nome, f.periodo, f.inicio, f.fim].join("|");
    gravar_(aba, chave, 10, 0, quando, "", [quando, f.nome, "'" + f.matricula, f.cargo, f.periodo, f.dias, f.inicio, f.fim, ev.requerimento, chave]);
  });
}

function registrarCi_(ev) {
  var aba = aba_(ABA_CIS, CAB_CIS);
  var quando = quando_(ev.quando);
  var chave = [ev.ci, ev.assunto].join("|");
  gravar_(aba, chave, 6, 5, quando, ev.acao, [quando, "'" + ev.ci, ev.assunto, ev.emissor, ev.acao, chave]);
}

// Se a mesma chave já existe (ex.: gerou o docx e depois imprimiu), atualiza
// a data e junta as ações; senão acrescenta uma linha nova.
function gravar_(aba, chave, colChave, colAcao, quando, acao, linha) {
  var ultima = aba.getLastRow();
  if (ultima > 1) {
    var chaves = aba.getRange(2, colChave, ultima - 1, 1).getValues();
    for (var i = chaves.length - 1; i >= 0; i--) {
      if (chaves[i][0] === chave) {
        var r = i + 2;
        aba.getRange(r, 1).setValue(quando);
        if (colAcao) {
          var atual = String(aba.getRange(r, colAcao).getValue());
          if (atual.indexOf(acao) === -1) atual = atual ? atual + ", " + acao : acao;
          aba.getRange(r, colAcao).setValue(atual);
        }
        return;
      }
    }
  }
  aba.appendRow(linha);
}

function aba_(nome, cabecalho) {
  var plan = SpreadsheetApp.getActiveSpreadsheet();
  var aba = plan.getSheetByName(nome);
  if (!aba) {
    aba = plan.insertSheet(nome);
    aba.appendRow(cabecalho);
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, cabecalho.length).setFontWeight("bold").setBackground("#002868").setFontColor("#ffffff");
  }
  return aba;
}

function quando_(iso) {
  var d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  return Utilities.formatDate(d, "America/Campo_Grande", "dd/MM/yyyy HH:mm:ss");
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
