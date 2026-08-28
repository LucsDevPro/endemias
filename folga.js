// ============================================================
// Gerador de Folga — página própria. Lê assets/modelo-folga.docx
// e substitui as tags <<ci>>, <<hoje>> e a tabela de funcionários
// (usa docx-utils.js, que já foi testado). Lista de funcionários
// fica salva no navegador (localStorage), editável, com
// exportar/importar/restaurar.
// ============================================================

(function () {
  "use strict";

  var CARGOS = ["Agente de combate as endemias", "Médico veterinário", "Serviços gerais"];

  var FUNCIONARIOS_PADRAO = [
  ["ADRIANA DE JESUS SARAIVA", "Agente de combate as endemias"],
  ["ADRIANA FÁTIMA SILVA LIMA", "Agente de combate as endemias"],
  ["ADRIANO ORTIZ MEREY", "Agente de combate as endemias"],
  ["ADRIANO RICARDO THIEL", "Agente de combate as endemias"],
  ["AGUSTINHA EVA COLMAN", "Agente de combate as endemias"],
  ["ALVARO DELGADO BRANDÃO", "Agente de combate as endemias"],
  ["ANA GABRIELA SILVA GARCETE", "Agente de combate as endemias"],
  ["ANDERSON JOSÉ DE SANTANA", "Agente de combate as endemias"],
  ["ANDERSON SALABARRIETO", "Agente de combate as endemias"],
  ["ANDRÉ LUIZ BENITES ROCHA", "Agente de combate as endemias"],
  ["ANDRÉ MACIEL ORTEGA", "Agente de combate as endemias"],
  ["ANTONIO CEZAR MARQUES", "Agente de combate as endemias"],
  ["ARIEL RAMOS DA SILVA", "Agente de combate as endemias"],
  ["BIANCA AFONSO NARBAEZ", "Agente de combate as endemias"],
  ["BRAUHER LUIZ ALVARENGA GONZALEZ", "Agente de combate as endemias"],
  ["CAMILA CAMARGO COLMAN", "Agente de combate as endemias"],
  ["CHARLES DE SOUZA OLIVEIRA", "Agente de combate as endemias"],
  ["CÍCERO ISRRAEL SANABRIA", "Agente de combate as endemias"],
  ["CLAINE LUISA FIGUEIREDO TORRACA", "Agente de combate as endemias"],
  ["CLARINDA CESARIA R. FERREIRA AQUINO", "Agente de combate as endemias"],
  ["CLAUDIO DA SILVA JUNIOR", "Agente de combate as endemias"],
  ["CRIS MILENE CÁRDENAS DA SILVA", "Agente de combate as endemias"],
  ["CRISLAINE CARDENAS DA SILVA", "Agente de combate as endemias"],
  ["CRISTIANE CARDENAS DA SILVA", "Agente de combate as endemias"],
  ["DAGOBERTO APARECIDO DE LIMA RODRIGUES", "Agente de combate as endemias"],
  ["DANILO DOS SANTOS CARNEIRO ALVES", "Agente de combate as endemias"],
  ["DÊNIS HEITOR BRUM", "Agente de combate as endemias"],
  ["DENIZ FREITAS", "Agente de combate as endemias"],
  ["EDILENE JHEYNE DIAS ALFONSO", "Agente de combate as endemias"],
  ["EDILSON MELGAREJO", "Agente de combate as endemias"],
  ["ELIZABETH GONÇALVES RIBEIRO", "Agente de combate as endemias"],
  ["EMERSON DE CARVALHO MIRANDA", "Agente de combate as endemias"],
  ["EMIDIO RAINER VILHALBA", "Agente de combate as endemias"],
  ["FABIO TEODORO ALVES ALEXO", "Agente de combate as endemias"],
  ["GABRIEL ALAN DE OLIVEIRA MARTINS", "Agente de combate as endemias"],
  ["GEANCARLOS FERREIRA BARRIOS", "Agente de combate as endemias"],
  ["GILMAR BITENCOURT LUIZ", "Agente de combate as endemias"],
  ["GISELE LOPES JUSTINIANO", "Agente de combate as endemias"],
  ["GIULIANA PISSINI BRIZUENA", "Agente de combate as endemias"],
  ["INGRID FRAGA DA SILVA", "Agente de combate as endemias"],
  ["JAIR ADÃO SALVADOR", "Agente de combate as endemias"],
  ["JANETE MARIANO", "Agente de combate as endemias"],
  ["JONATAN GABRIEL DÁVALOS", "Agente de combate as endemias"],
  ["JOSOÉ DE OLIVEIRA", "Agente de combate as endemias"],
  ["JULIANA PATRÍCIA GONÇALVES", "Agente de combate as endemias"],
  ["KARIELLE JACKELINE RODRIGUES SILVA", "Agente de combate as endemias"],
  ["KATIA CILENE SILVEIRA MACHADO", "Agente de combate as endemias"],
  ["KELLY CRISTINA DA ROCHA STRUCK", "Agente de combate as endemias"],
  ["LARA DAIANE NUNES FLORES", "Agente de combate as endemias"],
  ["LUCAS VIEIRA LOPES", "Agente de combate as endemias"],
  ["MARCO ANTÔNIO AYALA DE MATOS FREITAS", "Agente de combate as endemias"],
  ["MARCOS ALCINDO INSALBRALDE", "Agente de combate as endemias"],
  ["MARIA APARECIDA DOS REIS E SILVA", "Agente de combate as endemias"],
  ["MATEUS FALCAO DE SOUZA", "Agente de combate as endemias"],
  ["MICHELLE CARMÃE FERNANDES", "Agente de combate as endemias"],
  ["MIGLIDIANE AJALA MACIEL", "Agente de combate as endemias"],
  ["MISLENE MARTINES DA SILVA", "Agente de combate as endemias"],
  ["PATRICK GIOVANNY SANTIAGO DIAS", "Agente de combate as endemias"],
  ["RAFAEL RAMOS RECALDE", "Agente de combate as endemias"],
  ["RAMONA DOS SANTOS DE OLIVEIRA", "Agente de combate as endemias"],
  ["RAQUEL ORTIZ DOS SANTOS", "Agente de combate as endemias"],
  ["REGINA ELIZA DOS SANTOS", "Agente de combate as endemias"],
  ["ROBSON PAVAO MONTANIA", "Agente de combate as endemias"],
  ["ROSANGELA DUTRA DE OLIVEIRA", "Agente de combate as endemias"],
  ["ROZANA REIS DA SILVA", "Agente de combate as endemias"],
  ["ROZENTINA MATOS DE OLIVEIRA COLMAN", "Agente de combate as endemias"],
  ["SARA ELIANE TALAVERA OLIVEIRA", "Agente de combate as endemias"],
  ["SELBA RAMONA ALFONSO", "Agente de combate as endemias"],
  ["SILVINA REGINA DE SOUZA VALIENTE", "Agente de combate as endemias"],
  ["SILVIO DE AQUINO", "Agente de combate as endemias"],
  ["SIMONE CARDOZO DA SILVA", "Agente de combate as endemias"],
  ["SONAIRA DA CRUZ SOARES ALBUQUERQUE", "Agente de combate as endemias"],
  ["SUELY AGUIAR ALVES LUIZ", "Agente de combate as endemias"],
  ["TANIA MARIA MONTANIA CORVALAN", "Agente de combate as endemias"],
  ["WAGNER TARLEI GOMES", "Agente de combate as endemias"],
  ["WALQUIRIA ARAUJO FLORES", "Agente de combate as endemias"],
  ["WESLEY DE SOUZA LEAL", "Agente de combate as endemias"],
  ["WILLAN ANDERSON CHAMORRO TAVARES", "Agente de combate as endemias"],  ];

  var STORAGE_KEY = "painelEndemiasFuncionarios";
  var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  var state = {
    funcionarios: {},   // nome -> cargo
    selecoes: {},       // nome -> [dd/mm/yyyy, ...]
    marcados: {},        // nome -> true (checkbox marcado, sobrevive a busca/filtro)
    filtroTexto: "",
    filtroCargo: "Todos"
  };

  // ---------------- Persistência ----------------

  function carregarFuncionarios() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) { /* ignora e usa padrão */ }
    var obj = {};
    FUNCIONARIOS_PADRAO.forEach(function (par) { obj[par[0]] = par[1]; });
    return obj;
  }

  function salvarFuncionarios() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.funcionarios));
    } catch (e) {
      alert("Não foi possível salvar a lista neste navegador (armazenamento local indisponível).");
    }
  }

  // ---------------- Utilidades ----------------

  function formatarDataExtenso(date) {
    return date.getDate() + " de " + MESES[date.getMonth()] + " de " + date.getFullYear();
  }

  function dataInputParaBR(valor) {
    var partes = valor.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
  }

  // sufixo do período: "" (dia todo), " (matutino)" ou " (vespertino)"
  function sufixoPeriodo() {
    if (dom.periodoMatutino && dom.periodoMatutino.checked) return " (matutino)";
    if (dom.periodoVespertino && dom.periodoVespertino.checked) return " (vespertino)";
    return "";
  }

  function compararDatasBR(a, b) {
    function toDate(s) {
      var p = s.split("/");
      return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
    }
    return toDate(a) - toDate(b);
  }

  function el(tag, className, texto) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  // ---------------- Referências DOM ----------------

  var dom = {};

  function cacheDom() {
    dom.ci = document.getElementById("folgaCi");
    dom.busca = document.getElementById("folgaBusca");
    dom.filtroCargo = document.getElementById("folgaFiltroCargo");
    dom.lista = document.getElementById("folgaLista");
    dom.contador = document.getElementById("folgaContador");
    dom.novoNome = document.getElementById("folgaNovoNome");
    dom.novoCargo = document.getElementById("folgaNovoCargo");
    dom.addFuncionario = document.getElementById("folgaAddFuncionario");
    dom.data = document.getElementById("folgaData");
    dom.periodoMatutino = document.getElementById("folgaPeriodoMatutino");
    dom.periodoVespertino = document.getElementById("folgaPeriodoVespertino");
    dom.addData = document.getElementById("folgaAddData");
    dom.desmarcar = document.getElementById("folgaDesmarcar");
    dom.resumoSelecao = document.getElementById("folgaResumoSelecao");
    dom.preview = document.getElementById("folgaPreview");
    dom.limpar = document.getElementById("folgaLimpar");
    dom.gerar = document.getElementById("folgaGerar");
    dom.exportar = document.getElementById("folgaExportar");
    dom.importar = document.getElementById("folgaImportar");
    dom.importarInput = document.getElementById("folgaImportarInput");
    dom.restaurar = document.getElementById("folgaRestaurar");
    dom.status = document.getElementById("folgaStatus");
  }

  // ---------------- Render: lista de funcionários ----------------

  function popularSelectCargos(select, valorAtual) {
    select.innerHTML = "";
    CARGOS.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      if (c === valorAtual) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function renderFiltroCargo() {
    dom.filtroCargo.innerHTML = "";
    ["Todos"].concat(CARGOS).forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      dom.filtroCargo.appendChild(opt);
    });
    dom.filtroCargo.value = state.filtroCargo;
  }

  function renderListaFuncionarios() {
    dom.lista.innerHTML = "";
    var termo = state.filtroTexto.toLowerCase();
    var nomes = Object.keys(state.funcionarios).sort();

    var filtrados = nomes.filter(function (nome) {
      var cargo = state.funcionarios[nome];
      var bateTexto = nome.toLowerCase().indexOf(termo) !== -1 || cargo.toLowerCase().indexOf(termo) !== -1;
      var bateCargo = state.filtroCargo === "Todos" || cargo === state.filtroCargo;
      return bateTexto && bateCargo;
    });

    filtrados.forEach(function (nome) {
      var linha = el("div", "folga-emp");

      var check = document.createElement("input");
      check.type = "checkbox";
      check.className = "folga-emp__check";
      check.dataset.nome = nome;
      check.checked = !!state.marcados[nome];
      check.addEventListener("change", function () {
        if (check.checked) state.marcados[nome] = true;
        else delete state.marcados[nome];
        atualizarResumoSelecao();
      });

      var nomeSpan = el("span", "folga-emp__nome", nome);

      var cargoSelect = document.createElement("select");
      cargoSelect.className = "folga-emp__cargo";
      popularSelectCargos(cargoSelect, state.funcionarios[nome]);
      cargoSelect.addEventListener("change", function () {
        state.funcionarios[nome] = cargoSelect.value;
        salvarFuncionarios();
      });

      var remover = el("button", "folga-emp__rm", "✕");
      remover.type = "button";
      remover.title = "Remover funcionário da lista";
      remover.addEventListener("click", function () {
        if (confirm("Remover \"" + nome + "\" da lista de funcionários?")) {
          delete state.funcionarios[nome];
          delete state.selecoes[nome];
          delete state.marcados[nome];
          salvarFuncionarios();
          renderListaFuncionarios();
          renderPreview();
        }
      });

      linha.appendChild(check);
      linha.appendChild(nomeSpan);
      linha.appendChild(cargoSelect);
      linha.appendChild(remover);
      dom.lista.appendChild(linha);
    });

    dom.contador.textContent = "Exibindo " + filtrados.length + " de " + nomes.length + " funcionário(s)";
  }

  // ---------------- Render: prévia das folgas ----------------

  function renderPreview() {
    dom.preview.innerHTML = "";
    var nomes = Object.keys(state.selecoes).sort();

    if (nomes.length === 0) {
      dom.preview.appendChild(el("p", "folga-preview__vazio", "Nenhuma folga adicionada ainda. Marque funcionários acima, escolha uma data e clique em \"Adicionar data\"."));
      return;
    }

    nomes.forEach(function (nome) {
      var card = el("div", "folga-preview__item");

      var head = el("div", "folga-preview__head");
      var info = el("div");
      info.appendChild(el("strong", null, nome));
      info.appendChild(el("span", "folga-preview__cargo", state.funcionarios[nome] || "Cargo não definido"));
      var rm = el("button", "folga-emp__rm", "✕");
      rm.type = "button";
      rm.title = "Remover todas as datas deste funcionário";
      rm.addEventListener("click", function () {
        delete state.selecoes[nome];
        renderPreview();
      });
      head.appendChild(info);
      head.appendChild(rm);
      card.appendChild(head);

      var chips = el("div", "folga-preview__datas");
      state.selecoes[nome].slice().sort(compararDatasBR).forEach(function (data) {
        var chip = el("span", "folga-chip");
        chip.appendChild(document.createTextNode(data + " "));
        var x = el("button", "folga-chip__x", "✕");
        x.type = "button";
        x.addEventListener("click", function () {
          state.selecoes[nome] = state.selecoes[nome].filter(function (d) { return d !== data; });
          if (state.selecoes[nome].length === 0) delete state.selecoes[nome];
          renderPreview();
        });
        chip.appendChild(x);
        chips.appendChild(chip);
      });
      card.appendChild(chips);

      dom.preview.appendChild(card);
    });
  }

  // ---------------- Ações ----------------

  function funcionariosMarcados() {
    return Object.keys(state.marcados);
  }

  // mostra quem está marcado agora, bem visível antes de "Adicionar data"
  function atualizarResumoSelecao() {
    if (!dom.resumoSelecao) return;
    var nomes = Object.keys(state.marcados).sort();
    if (nomes.length === 0) {
      dom.resumoSelecao.textContent = "Nenhum funcionário selecionado.";
      dom.resumoSelecao.classList.remove("folga-selecao--ativa");
      return;
    }
    var rotulo = nomes.length === 1 ? "Selecionado: " : nomes.length + " selecionados: ";
    dom.resumoSelecao.textContent = rotulo + nomes.join(", ");
    dom.resumoSelecao.classList.add("folga-selecao--ativa");
  }

  function desmarcarSelecao() {
    state.marcados = {};
    renderListaFuncionarios();
    atualizarResumoSelecao();
  }

  function adicionarData() {
    var marcados = funcionariosMarcados();
    if (marcados.length === 0) {
      setStatus("Selecione ao menos um funcionário na lista.", true);
      return;
    }
    if (!dom.data.value) {
      setStatus("Escolha uma data.", true);
      return;
    }
    var dataBR = dataInputParaBR(dom.data.value) + sufixoPeriodo();
    marcados.forEach(function (nome) {
      if (!state.selecoes[nome]) state.selecoes[nome] = [];
      if (state.selecoes[nome].indexOf(dataBR) === -1) state.selecoes[nome].push(dataBR);
    });

    renderPreview();
    setStatus("Data adicionada para " + marcados.length + " funcionário(s). A seleção continua marcada — desmarque manualmente antes de escolher outro agente.", false);
  }

  function adicionarFuncionario() {
    var nome = (dom.novoNome.value || "").trim().toUpperCase();
    if (!nome) {
      setStatus("Digite o nome do funcionário.", true);
      return;
    }
    state.funcionarios[nome] = dom.novoCargo.value;
    salvarFuncionarios();
    dom.novoNome.value = "";
    renderListaFuncionarios();
    setStatus("Funcionário adicionado à lista.", false);
  }

  function limparTudo() {
    state.selecoes = {};
    state.marcados = {};
    renderListaFuncionarios();
    renderPreview();
    atualizarResumoSelecao();
    setStatus("", false);
  }

  function exportarLista() {
    var blob = new Blob([JSON.stringify(state.funcionarios, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "funcionarios-endemias.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importarLista(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var obj = JSON.parse(reader.result);
        if (typeof obj !== "object" || obj === null || Array.isArray(obj)) throw new Error("formato inválido");
        state.funcionarios = obj;
        limparMarcadosOrfaos();
        salvarFuncionarios();
        renderListaFuncionarios();
        setStatus("Lista importada com sucesso.", false);
      } catch (e) {
        setStatus("Arquivo inválido. Exporte um JSON gerado por este painel.", true);
      }
    };
    reader.readAsText(file);
  }

  function restaurarPadrao() {
    if (!confirm("Restaurar a lista original de funcionários? Isso substitui a lista atual salva neste navegador.")) return;
    var obj = {};
    FUNCIONARIOS_PADRAO.forEach(function (par) { obj[par[0]] = par[1]; });
    state.funcionarios = obj;
    limparMarcadosOrfaos();
    salvarFuncionarios();
    renderListaFuncionarios();
    setStatus("Lista restaurada para o padrão.", false);
  }

  // remove do "marcados" quem não existe mais na lista de funcionários
  function limparMarcadosOrfaos() {
    Object.keys(state.marcados).forEach(function (nome) {
      if (!state.funcionarios[nome]) delete state.marcados[nome];
    });
  }

  function setStatus(msg, erro) {
    dom.status.textContent = msg;
    dom.status.classList.toggle("folga-status--erro", !!erro);
  }

  // ---------------- Geração do documento ----------------

  function gerarDocumento() {
    var ci = (dom.ci.value || "").trim();
    if (!ci) {
      setStatus("Informe o número da CI.", true);
      return;
    }
    var nomes = Object.keys(state.selecoes);
    if (nomes.length === 0) {
      setStatus("Adicione pelo menos uma folga antes de gerar o documento.", true);
      return;
    }
    if (typeof window.JSZip === "undefined" || typeof window.DocxUtils === "undefined") {
      setStatus("Não foi possível carregar os componentes de geração de documento (verifique a conexão com a internet).", true);
      return;
    }

    setStatus("Gerando documento...", false);

    var funcionariosOrdenados = nomes.sort().map(function (nome) {
      var datas = state.selecoes[nome].slice().sort(compararDatasBR);
      return {
        nome: nome,
        cargo: state.funcionarios[nome] || "",
        tipo: "Banco de horas",
        datas: datas.join(", ")
      };
    });

    fetch("assets/modelo-folga.docx")
      .then(function (resp) {
        if (!resp.ok) throw new Error("Modelo não encontrado (assets/modelo-folga.docx)");
        return resp.arrayBuffer();
      })
      .then(function (bytes) {
        return DocxUtils.lerArquivosXml(bytes).then(function (arquivos) {
          var docXml = arquivos["word/document.xml"];

          docXml = DocxUtils.expandirLinhaTabela(docXml, "<<nome>>", funcionariosOrdenados, function (item) {
            return {
              "<<nome>>": item.nome,
              "<<cargo>>": item.cargo,
              "<<tipo>>": item.tipo,
              "<<datas>>": item.datas
            };
          });

          var subs = { "<<ci>>": ci, "<<hoje>>": formatarDataExtenso(new Date()) };
          Object.keys(arquivos).forEach(function (caminho) {
            var xmlAtual = caminho === "word/document.xml" ? docXml : arquivos[caminho];
            arquivos[caminho] = DocxUtils.substituirTags(xmlAtual, subs);
          });

          return DocxUtils.gerarDocxBlob(bytes, arquivos);
        });
      })
      .then(function (blob) {
        var primeiroNome = funcionariosOrdenados[0].nome.split(" ")[0];
        var ciLimpo = ci.replace(/\//g, "-").replace(/\\/g, "-").replace(/:/g, "-");
        var nomeArquivo = "Ci - " + ciLimpo + " - Folga " + primeiroNome + ".docx";

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
    if (!dom.lista) return;

    state.funcionarios = carregarFuncionarios();
    popularSelectCargos(dom.novoCargo, CARGOS[0]);
    renderFiltroCargo();
    renderListaFuncionarios();
    renderPreview();
    atualizarResumoSelecao();
    setStatus("", false);

    dom.busca.addEventListener("input", function () {
      state.filtroTexto = dom.busca.value;
      renderListaFuncionarios();
    });
    dom.filtroCargo.addEventListener("change", function () {
      state.filtroCargo = dom.filtroCargo.value;
      renderListaFuncionarios();
    });

    dom.addFuncionario.addEventListener("click", adicionarFuncionario);
    dom.addData.addEventListener("click", adicionarData);
    if (dom.desmarcar) dom.desmarcar.addEventListener("click", desmarcarSelecao);

    // matutino e vespertino são mutuamente exclusivos — marcar um desmarca o outro
    if (dom.periodoMatutino && dom.periodoVespertino) {
      dom.periodoMatutino.addEventListener("change", function () {
        if (dom.periodoMatutino.checked) dom.periodoVespertino.checked = false;
      });
      dom.periodoVespertino.addEventListener("change", function () {
        if (dom.periodoVespertino.checked) dom.periodoMatutino.checked = false;
      });
    }    dom.limpar.addEventListener("click", limparTudo);
    dom.gerar.addEventListener("click", gerarDocumento);
    dom.exportar.addEventListener("click", exportarLista);
    dom.restaurar.addEventListener("click", restaurarPadrao);
    dom.importar.addEventListener("click", function () { dom.importarInput.click(); });
    dom.importarInput.addEventListener("change", function () {
      if (dom.importarInput.files[0]) importarLista(dom.importarInput.files[0]);
      dom.importarInput.value = "";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
