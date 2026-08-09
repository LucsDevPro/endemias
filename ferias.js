// ============================================================
// Gerador de Férias — página própria. Lê assets/modelo-ferias.docx
// e substitui as tags {{NOME}}, {{CPF}}, {{MATRICULA}} etc.
// (usa docx-utils.js, que já foi testado).
//
// IMPORTANTE (privacidade): a planilha de funcionários (com CPF)
// NÃO fica salva no site nem é enviada a nenhum servidor. Ela é
// lida apenas dentro do navegador, na hora de gerar o documento,
// e é descartada quando a página é fechada/recarregada. Por isso
// ela precisa ser selecionada a cada uso — de propósito, para não
// deixar dados pessoais (CPF) gravados no repositório do GitHub.
// ============================================================

(function () {
  "use strict";

  var CARGOS_SUGERIDOS = ["Agente de Combate às Endemias", "Médico veterinário", "Serviços gerais"];
  var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  var TAGS = ["NOME","MATRICULA","CPF","CARGO","DATAADMISSAO","PERIODO","DIAS","DATAINICIO","DATAFIM","DATACRIACAO"];

  var state = {
    funcionarios: [],  // [{matricula, nome, admissao, cpf}]
    diasQtd: 30
  };

  var dom = {};

  function cacheDom() {
    dom.csvInput = document.getElementById("feriasCsvInput");
    dom.csvZone = document.getElementById("feriasCsvZone");
    dom.csvTexto = document.getElementById("feriasCsvTexto");
    dom.selectWrap = document.getElementById("feriasSelectWrap");
    dom.selFunc = document.getElementById("feriasSelFunc");

    dom.nome = document.getElementById("feriasNome");
    dom.matricula = document.getElementById("feriasMatricula");
    dom.cpf = document.getElementById("feriasCpf");
    dom.cargo = document.getElementById("feriasCargo");
    dom.admissao = document.getElementById("feriasAdmissao");
    dom.periodo = document.getElementById("feriasPeriodo");

    dom.btn15 = document.getElementById("feriasBtn15");
    dom.btn30 = document.getElementById("feriasBtn30");
    dom.dtInicio = document.getElementById("feriasDtInicio");
    dom.dtFimDisplay = document.getElementById("feriasDtFimDisplay");
    dom.pill = document.getElementById("feriasPill");
    dom.dataCriacao = document.getElementById("feriasDataCriacao");

    dom.gerar = document.getElementById("feriasGerar");
    dom.status = document.getElementById("feriasStatus");
  }

  // ---------------- Utilidades ----------------

  function fmtBR(date) {
    return String(date.getDate()).padStart(2, "0") + "/" + String(date.getMonth() + 1).padStart(2, "0") + "/" + date.getFullYear();
  }

  function hojeExtenso() {
    var d = new Date();
    return d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear();
  }

  function popularCargos() {
    dom.cargo.innerHTML = "";
    CARGOS_SUGERIDOS.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      dom.cargo.appendChild(opt);
    });
  }

  function popularPeriodos() {
    dom.periodo.innerHTML = "<option value=\"\">Selecione o período</option>";
    var anoAtual = new Date().getFullYear();
    for (var y = anoAtual - 2; y <= anoAtual + 1; y++) {
      var opt = document.createElement("option");
      opt.value = y + "/" + (y + 1);
      opt.textContent = y + "/" + (y + 1);
      dom.periodo.appendChild(opt);
    }
  }

  function setStatus(msg, erro) {
    dom.status.textContent = msg;
    dom.status.classList.toggle("folga-status--erro", !!erro);
  }

  // ---------------- CSV ----------------

  function normalizar(s) {
    var mapa = { "ã":"a","â":"a","á":"a","à":"a","ä":"a","é":"e","ê":"e","è":"e","ë":"e","í":"i","î":"i","ì":"i","ï":"i","õ":"o","ô":"o","ó":"o","ò":"o","ö":"o","ú":"u","û":"u","ù":"u","ü":"u","ç":"c","ñ":"n" };
    return s.trim().toLowerCase().replace(/[^a-z0-9]/gi, function (c) { return mapa[c] || c; });
  }

  function encontrarColuna(headers) {
    function col() {
      for (var a = 0; a < arguments.length; a++) {
        for (var h = 0; h < headers.length; h++) {
          if (headers[h].indexOf(arguments[a]) !== -1) return h;
        }
      }
      return -1;
    }
    return {
      mat: col("matricula", "mat"),
      nome: col("nome"),
      adm: col("admiss", "adm"),
      cpf: col("cpf")
    };
  }

  function parseCsv(texto) {
    var linhas = texto.split(/\r?\n/).filter(function (l) { return l.trim() !== ""; });
    if (linhas.length < 2) {
      setStatus("Planilha vazia ou em formato inesperado.", true);
      return;
    }
    var sep = linhas[0].indexOf(";") !== -1 ? ";" : ",";
    var headers = linhas[0].split(sep).map(normalizar);
    var idx = encontrarColuna(headers);
    if (idx.mat === -1) idx.mat = 0;
    if (idx.nome === -1) idx.nome = 1;
    if (idx.adm === -1) idx.adm = 2;
    if (idx.cpf === -1) idx.cpf = 3;

    var lista = [];
    for (var i = 1; i < linhas.length; i++) {
      var cols = linhas[i].split(sep).map(function (c) { return c.trim().replace(/^"|"$/g, ""); });
      if (cols.length < 2 || cols.every(function (c) { return c === ""; })) continue;
      lista.push({
        matricula: cols[idx.mat] || "",
        nome: cols[idx.nome] || "",
        admissao: cols[idx.adm] || "",
        cpf: cols[idx.cpf] || ""
      });
    }
    lista.sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
    state.funcionarios = lista;

    dom.selFunc.innerHTML = "<option value=\"\">— Selecione um funcionário —</option>";
    lista.forEach(function (f, i) {
      var opt = document.createElement("option");
      opt.value = i;
      opt.textContent = f.nome + (f.matricula ? "  ·  Mat. " + f.matricula : "");
      dom.selFunc.appendChild(opt);
    });

    dom.csvZone.classList.add("folga-upload--done");
    dom.csvTexto.textContent = lista.length + " funcionário(s) carregado(s) — nada foi salvo, só está nesta aba.";
    dom.selectWrap.hidden = false;
    setStatus("", false);
  }

  function carregarCsv(file) {
    var reader = new FileReader();
    reader.onload = function (e) { parseCsv(e.target.result); };
    reader.onerror = function () { setStatus("Erro ao ler a planilha.", true); };
    reader.readAsText(file, "windows-1252");
  }

  // ---------------- Dias / datas ----------------

  function setDias(n) {
    state.diasQtd = n;
    dom.btn15.classList.toggle("folga-toggle__btn--active", n === 15);
    dom.btn30.classList.toggle("folga-toggle__btn--active", n === 30);
    calcularFim();
  }

  function calcularFim() {
    var val = dom.dtInicio.value;
    if (!val) {
      dom.dtFimDisplay.value = "";
      dom.pill.hidden = true;
      dom.pill.dataset.inicio = "";
      dom.pill.dataset.fim = "";
      return;
    }
    var partes = val.split("-");
    var ini = new Date(+partes[0], +partes[1] - 1, +partes[2]);
    var fim = new Date(+partes[0], +partes[1] - 1, +partes[2] + state.diasQtd - 1);
    dom.dtFimDisplay.value = fmtBR(fim);
    dom.pill.hidden = false;
    dom.pill.innerHTML = "📅 Férias de <strong>" + fmtBR(ini) + "</strong> a <strong>" + fmtBR(fim) + "</strong> · " + state.diasQtd + " dias";
    dom.pill.dataset.inicio = fmtBR(ini);
    dom.pill.dataset.fim = fmtBR(fim);
  }

  // ---------------- Geração do documento ----------------

  function coletarDados() {
    var inicio = dom.pill.dataset.inicio || "";
    var fim = dom.pill.dataset.fim || "";
    return {
      NOME: dom.nome.value.trim(),
      MATRICULA: dom.matricula.value.trim(),
      CPF: dom.cpf.value.trim(),
      CARGO: dom.cargo.value.trim(),
      DATAADMISSAO: dom.admissao.value.trim(),
      PERIODO: dom.periodo.value.trim(),
      DIAS: state.diasQtd + " dias",
      DATAINICIO: inicio,
      DATAFIM: fim,
      DATACRIACAO: hojeExtenso()
    };
  }

  function gerarDocumento() {
    var dados = coletarDados();
    var faltando = TAGS.filter(function (t) { return !dados[t]; });
    if (faltando.length > 0) {
      setStatus("Preencha todos os campos (falta: " + faltando.join(", ") + ").", true);
      return;
    }
    if (typeof window.JSZip === "undefined" || typeof window.DocxUtils === "undefined") {
      setStatus("Não foi possível carregar os componentes de geração de documento (verifique a conexão com a internet).", true);
      return;
    }

    setStatus("Gerando documento...", false);

    var subs = {};
    TAGS.forEach(function (t) { subs["{{" + t + "}}"] = dados[t]; });

    fetch("assets/modelo-ferias.docx")
      .then(function (resp) {
        if (!resp.ok) throw new Error("Modelo não encontrado (assets/modelo-ferias.docx)");
        return resp.arrayBuffer();
      })
      .then(function (bytes) {
        return DocxUtils.lerArquivosXml(bytes).then(function (arquivos) {
          Object.keys(arquivos).forEach(function (caminho) {
            arquivos[caminho] = DocxUtils.substituirTags(arquivos[caminho], subs);
          });
          return DocxUtils.gerarDocxBlob(bytes, arquivos);
        });
      })
      .then(function (blob) {
        var nomeArquivo = "requerimento_ferias_" + dados.NOME.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "") + ".docx";

        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatus("Documento gerado: " + nomeArquivo, false);
      })
      .catch(function (err) {
        console.error(err);
        setStatus("Erro ao gerar documento: " + err.message, true);
      });
  }

  // ---------------- Início ----------------

  function iniciar() {
    cacheDom();
    if (!dom.csvZone) return;

    popularCargos();
    popularPeriodos();
    setDias(30);
    dom.dataCriacao.textContent = hojeExtenso();
    setStatus("", false);

    dom.csvZone.addEventListener("click", function () { dom.csvInput.click(); });
    dom.csvInput.addEventListener("change", function () {
      if (dom.csvInput.files[0]) carregarCsv(dom.csvInput.files[0]);
    });
    dom.csvZone.addEventListener("dragover", function (e) { e.preventDefault(); dom.csvZone.classList.add("folga-upload--over"); });
    dom.csvZone.addEventListener("dragleave", function () { dom.csvZone.classList.remove("folga-upload--over"); });
    dom.csvZone.addEventListener("drop", function (e) {
      e.preventDefault();
      dom.csvZone.classList.remove("folga-upload--over");
      if (e.dataTransfer.files[0]) carregarCsv(e.dataTransfer.files[0]);
    });

    dom.selFunc.addEventListener("change", function () {
      if (dom.selFunc.value === "") return;
      var f = state.funcionarios[parseInt(dom.selFunc.value, 10)];
      dom.nome.value = f.nome;
      dom.matricula.value = f.matricula;
      dom.cpf.value = f.cpf;
      dom.admissao.value = f.admissao;
    });

    dom.btn15.addEventListener("click", function () { setDias(15); });
    dom.btn30.addEventListener("click", function () { setDias(30); });
    dom.dtInicio.addEventListener("change", calcularFim);

    dom.gerar.addEventListener("click", gerarDocumento);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
