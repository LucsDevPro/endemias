// ============================================================
// Gerador de Folga — página própria. Lê assets/modelo-folga.docx
// e substitui as tags <<ci>>, <<hoje>> e a tabela de funcionários
// (usa docx-utils.js, que já foi testado). Lista de funcionários
// fica salva no navegador (localStorage), editável, com
// exportar/importar/restaurar.
//
// Lançamento em lote: marcar todos / colar lista de nomes / Enter na
// busca para selecionar rápido; várias datas (ou um período de–até)
// de uma vez para todos os marcados; rascunho das folgas guardado no
// navegador (só nomes e datas — nada sensível) para não perder o
// trabalho se a página for recarregada.
// ============================================================

(function () {
  "use strict";

  var CARGOS = ["Agente de combate as endemias", "Médico veterinário", "Serviços gerais", "Agente de fiscaliz. e vig. sanitária", "Assessor especial de gabinete", "Assistente administrativo", "Atendente de saúde", "Auxiliar de pavimentação", "Auxiliar em enfermagem", "Coord. da saúde do trabalhador", "Coord. de endemias e zoonoses", "Coord. de vigilância epidemiológica", "Coord. sanitário e ambiental", "Enfermeiro", "Engenheiro de alimentos", "Farmacêutico", "Gari", "Gerente de atenção à saúde", "Gerente de vigilância em saúde", "Motorista de ambulância", "Motorista de veículo leve", "Técnico em enfermagem"];

  var FUNCIONARIOS_PADRAO = [
  ["ADILSON COHENE DE AQUINO", "Serviços gerais"],
  ["ADRIANA DE JESUS SARAIVA", "Agente de combate as endemias"],
  ["ADRIANA FÁTIMA SILVA LIMA", "Agente de combate as endemias"],
  ["ADRIANO ORTIZ MEREY", "Agente de combate as endemias"],
  ["ADRIANO RICARDO THIEL", "Agente de combate as endemias"],
  ["ADRIANO SCOLARI", "Agente de fiscaliz. e vig. sanitária"],
  ["AGNALDO ALVES CARRETEIRO", "Médico veterinário"],
  ["AGUSTINHA EVA COLMAN", "Agente de combate as endemias"],
  ["ALANA AMANDA FERNANDES OVELAR", "Agente de combate as endemias"],
  ["ALESSANDRA MICHELE DEBESA MARTINS", "Serviços gerais"],
  ["ALEXANDRE MENDONCA DE LIMA", "Coord. de endemias e zoonoses"],
  ["ALINE RODRIGUES PONTES", "Engenheiro de alimentos"],
  ["ALMIR SILVA DOS SANTOS", "Atendente de saúde"],
  ["ALVARO DELGADO BRANDÃO", "Agente de combate as endemias"],
  ["AMANDA PIRES COELHO", "Médico veterinário"],
  ["ANA GABRIELA SILVA GARCETE", "Agente de combate as endemias"],
  ["ANDERSON JOSÉ DE SANTANA", "Agente de combate as endemias"],
  ["ANDERSON SALABARRIETO", "Agente de combate as endemias"],
  ["ANDRÉ LUIZ BENITES ROCHA", "Agente de combate as endemias"],
  ["ANDRÉ MACIEL ORTEGA", "Agente de combate as endemias"],
  ["ANTONIO CEZAR MARQUES", "Agente de combate as endemias"],
  ["ARNALDO VALERIO ESPINDOLA", "Motorista de ambulância"],
  ["BIANCA AFONSO NARBAEZ", "Agente de combate as endemias"],
  ["BRAUHER LUIZ ALVARENGA GONZALEZ", "Agente de combate as endemias"],
  ["CARLOS ALBERTO ALBIERO", "Agente de combate as endemias"],
  ["CARLOS AUGUSTO VILALBA GOMES", "Auxiliar de pavimentação"],
  ["CÍCERO ISRRAEL SANABRIA", "Agente de combate as endemias"],
  ["CLAINE LUISA FIGUEIREDO TORRACA", "Agente de combate as endemias"],
  ["CLARA MITSUKO TSUCHIDA", "Enfermeiro"],
  ["CLARINDA CESARIA RODRIGUES FERREIRA AQUINO", "Agente de combate as endemias"],
  ["CLAUDIO DA SILVA JUNIOR", "Agente de combate as endemias"],
  ["CRIS MILENE CÁRDENAS DA SILVA", "Agente de combate as endemias"],
  ["CRISLAINE CARDENAS DA SILVA", "Agente de combate as endemias"],
  ["DANILO DOS SANTOS CARNEIRO ALVES", "Agente de combate as endemias"],
  ["DAYANE SOUZA DE PAULA", "Técnico em enfermagem"],
  ["DENISE DA SILVA DOMINGUES", "Assistente administrativo"],
  ["DENIZ FREITAS", "Agente de combate as endemias"],
  ["EDILSON MELGAREJO", "Agente de combate as endemias"],
  ["EDSON MARTINS SOUZA SILVA", "Assistente administrativo"],
  ["ELIANA ADRIANA VALDEZ FREITAS", "Auxiliar em enfermagem"],
  ["ELIZABETH GONÇALVES RIBEIRO", "Agente de combate as endemias"],
  ["ELZA GONCALVES DOS SANTOS", "Serviços gerais"],
  ["EMERSON DE CARVALHO MIRANDA", "Agente de combate as endemias"],
  ["EMIDIO RAINER VILHALBA", "Agente de combate as endemias"],
  ["EVANDRA EVANETE FRANCO AQUINO", "Serviços gerais"],
  ["EVANILDO VIANA ANTUNES", "Motorista de veículo leve"],
  ["EVELINE COELHO ALVES PEREIRA", "Coord. sanitário e ambiental"],
  ["EVELISE TRAMARIN DE ARAUJO POVEDA", "Coord. da saúde do trabalhador"],
  ["EVELYN SANTANA SANTOS OLIVEIRA", "Agente de combate as endemias"],
  ["FABIANA DE FIGUEIREDO VIEIRA", "Agente de combate as endemias"],
  ["FABIO TEODORO ALVES ALEXO", "Agente de combate as endemias"],
  ["GABRIEL ALAN DE OLIVEIRA MARTINS", "Agente de combate as endemias"],
  ["GEANCARLOS FERREIRA BARRIOS", "Agente de combate as endemias"],
  ["GICELE RENATA TEIXEIRA", "Enfermeiro"],
  ["GILMAR BITENCOURT LUIZ", "Agente de combate as endemias"],
  ["GIOVANI AUGUSTO RODRIGUES PEREIRA", "Serviços gerais"],
  ["GISELE LOPES JUSTINIANO", "Agente de combate as endemias"],
  ["GISELE OLIMPIA TORRES", "Agente de combate as endemias"],
  ["GIULIANA PISSINI BRIZUENA", "Gerente de vigilância em saúde"],
  ["HEITOR NEI GOMES FERNANDES", "Enfermeiro"],
  ["INGRID FRAGA DA SILVA", "Agente de combate as endemias"],
  ["ISABELLE DOS SANTOS RODRIGUES", "Assistente administrativo"],
  ["IVA GILDETE AGUERO", "Assessor especial de gabinete"],
  ["JANAINA LOPES DE ALMEIDA", "Enfermeiro"],
  ["JOICE RUIZ DA COSTA", "Agente de fiscaliz. e vig. sanitária"],
  ["JONATAN GABRIEL DÁVALOS", "Agente de combate as endemias"],
  ["JOSE CLAUDIO GOMES DE MATOS", "Atendente de saúde"],
  ["JOSOÉ DE OLIVEIRA", "Agente de combate as endemias"],
  ["JUDITE FERREIRA", "Técnico em enfermagem"],
  ["JULIANA COSTA LINAS", "Auxiliar em enfermagem"],
  ["JULIANA GONCALVES", "Agente de fiscaliz. e vig. sanitária"],
  ["JULIANA PATRÍCIA GONÇALVES", "Agente de combate as endemias"],
  ["KARIELLE JACKELINE RODRIGUES SILVA", "Agente de combate as endemias"],
  ["KATIA CILENE SILVEIRA MACHADO", "Agente de combate as endemias"],
  ["KATILCE FERNANDES CAIMAR TIRLONI", "Farmacêutico"],
  ["KELLY CRISTINA DA ROCHA STRUCK", "Agente de combate as endemias"],
  ["LANIELE FERNANDES BAUMER", "Enfermeiro"],
  ["LEA APARECIDA GOMES DE MATTOS", "Agente de fiscaliz. e vig. sanitária"],
  ["LUCAS VIEIRA LOPES", "Agente de combate as endemias"],
  ["MARCIAL ALEX BENITES LOPES", "Motorista de veículo leve"],
  ["MARCO ANTÔNIO AYALA DE MATOS FREITAS", "Agente de combate as endemias"],
  ["MARCOS ALCINDO INSABRALDE", "Agente de combate as endemias"],
  ["MARIA APARECIDA DOS REIS E SILVA", "Agente de combate as endemias"],
  ["MARIA HELENA RUSSO WIDER", "Assistente administrativo"],
  ["MARIA LUCIA GONZALES BARBOSA", "Auxiliar em enfermagem"],
  ["MARILENE DOS SANTOS", "Agente de fiscaliz. e vig. sanitária"],
  ["MARILUCE FERNANDES CAIMAR", "Agente de fiscaliz. e vig. sanitária"],
  ["MATEUS FALCAO DE SOUZA", "Agente de combate as endemias"],
  ["MIGLIDIANE MACIEL AJALA", "Agente de combate as endemias"],
  ["MISLENE MARTINES DA SILVA", "Agente de combate as endemias"],
  ["NADIELE ROQUE DAUZAKER DE ALENCASTRO", "Assistente administrativo"],
  ["NAIME CRISTINA FREITAS", "Agente de combate as endemias"],
  ["OTAVIO AUGUSTO CORREA SILVESTRE", "Médico veterinário"],
  ["PATRICIA LANJER DE SOUZA DOMINGUES", "Agente de combate as endemias"],
  ["PATRICK GIOVANNY SANTIAGO DIAS", "Agente de combate as endemias"],
  ["RAFAEL RAMOS RECALDE", "Agente de combate as endemias"],
  ["RAMONA DOS SANTOS OLIVEIRA", "Agente de combate as endemias"],
  ["RAQUEL ORTIZ DOS SANTOS", "Agente de combate as endemias"],
  ["RENATA GRANCE CARVALHO GOMES", "Coord. de vigilância epidemiológica"],
  ["RITA DE CASSIA ICASSATTI DORNELES DO AMARAL", "Farmacêutico"],
  ["ROBSON CRISTOVAO NASCIMENTO PEDROZO", "Técnico em enfermagem"],
  ["ROBSON PAVAO MONTANIA", "Agente de combate as endemias"],
  ["ROSALINA BENIEL VARGAS", "Agente de combate as endemias"],
  ["ROSANA RODRIGUES FEIL", "Serviços gerais"],
  ["ROSANGELA DUTRA DE OLIVEIRA", "Agente de combate as endemias"],
  ["ROSIANE BATISTA FERREIRA", "Serviços gerais"],
  ["ROZANA REIS DA SILVA", "Agente de combate as endemias"],
  ["ROZENTINA MATOS DE OLIVEIRA COLMAN", "Agente de combate as endemias"],
  ["SARA ELIANE TALAVEIRA DE OLIVEIRA", "Agente de combate as endemias"],
  ["SEBASTIAO BARRETO MORAIS", "Agente de combate as endemias"],
  ["SELBA RAMONA AFONSO", "Agente de combate as endemias"],
  ["SILVINA REGINA DE SOUZA VALIENTE", "Agente de combate as endemias"],
  ["SILVIO DE AQUINO", "Agente de combate as endemias"],
  ["SONAIRA SOARES DA CRUZ ALBUQUERQUE", "Gerente de atenção à saúde"],
  ["SUELY AGUIAR ALVES LUIZ", "Agente de combate as endemias"],
  ["TANIA MARIA MONTANIA CORVALAN", "Agente de combate as endemias"],
  ["TEONILDA FLORENTINO VIEIRA", "Agente de combate as endemias"],
  ["VANESSA APARECIDA PETRY", "Assistente administrativo"],
  ["WAGNER TARLEI GOMES", "Agente de combate as endemias"],
  ["WALQUIRIA ARAUJO FLORES", "Agente de combate as endemias"],
  ["WESLEY DE SOUZA LEAL", "Agente de combate as endemias"],
  ["WILLIAM ANDERSON CHAMORRO TAVARES", "Agente de combate as endemias"],
  ["ZENEIDE MEDINA DIAS", "Gari"]
  ];

  var STORAGE_KEY = "painelEndemiasFuncionarios";
  var RASCUNHO_KEY = "painelEndemiasFolgaRascunho";
  var DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var LIMITE_PERIODO_DIAS = 62;
  var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  var state = {
    funcionarios: {},   // nome -> cargo
    selecoes: {},       // nome -> [dd/mm/yyyy, ...]
    marcados: {},        // nome -> true (checkbox marcado, sobrevive a busca/filtro)
    pendentes: [],       // datas a lançar (já com sufixo de período), antes de "Adicionar"
    filtroTexto: "",
    filtroCargo: "Todos"
  };

  // ---------------- Persistência ----------------

  // Versão da lista padrão. Quando ela muda, quem já tem uma lista salva neste
  // navegador recebe a lista nova, mantendo os nomes que a própria pessoa
  // adicionou (os que não estavam na lista padrão anterior).
  var VERSAO_LISTA = "2026-11-06";
  var VERSAO_KEY = "painelEndemiasFuncionariosVersao";
  var LISTA_ANTERIOR = ["ADRIANA DE JESUS SARAIVA", "ADRIANA FÁTIMA SILVA LIMA", "ADRIANO ORTIZ MEREY", "ADRIANO RICARDO THIEL", "AGUSTINHA EVA COLMAN", "ALVARO DELGADO BRANDÃO", "ANA GABRIELA SILVA GARCETE", "ANDERSON JOSÉ DE SANTANA", "ANDERSON SALABARRIETO", "ANDRÉ LUIZ BENITES ROCHA", "ANDRÉ MACIEL ORTEGA", "ANTONIO CEZAR MARQUES", "ARIEL RAMOS DA SILVA", "BIANCA AFONSO NARBAEZ", "BRAUHER LUIZ ALVARENGA GONZALEZ", "CAMILA CAMARGO COLMAN", "CHARLES DE SOUZA OLIVEIRA", "CÍCERO ISRRAEL SANABRIA", "CLAINE LUISA FIGUEIREDO TORRACA", "CLARINDA CESARIA R. FERREIRA AQUINO", "CLAUDIO DA SILVA JUNIOR", "CRIS MILENE CÁRDENAS DA SILVA", "CRISLAINE CARDENAS DA SILVA", "CRISTIANE CARDENAS DA SILVA", "DAGOBERTO APARECIDO DE LIMA RODRIGUES", "DANILO DOS SANTOS CARNEIRO ALVES", "DÊNIS HEITOR BRUM", "DENIZ FREITAS", "EDILENE JHEYNE DIAS ALFONSO", "EDILSON MELGAREJO", "ELIZABETH GONÇALVES RIBEIRO", "EMERSON DE CARVALHO MIRANDA", "EMIDIO RAINER VILHALBA", "FABIO TEODORO ALVES ALEXO", "GABRIEL ALAN DE OLIVEIRA MARTINS", "GEANCARLOS FERREIRA BARRIOS", "GILMAR BITENCOURT LUIZ", "GISELE LOPES JUSTINIANO", "GIULIANA PISSINI BRIZUENA", "INGRID FRAGA DA SILVA", "JAIR ADÃO SALVADOR", "JANETE MARIANO", "JONATAN GABRIEL DÁVALOS", "JOSOÉ DE OLIVEIRA", "JULIANA PATRÍCIA GONÇALVES", "KARIELLE JACKELINE RODRIGUES SILVA", "KATIA CILENE SILVEIRA MACHADO", "KELLY CRISTINA DA ROCHA STRUCK", "LARA DAIANE NUNES FLORES", "LUCAS VIEIRA LOPES", "MARCO ANTÔNIO AYALA DE MATOS FREITAS", "MARCOS ALCINDO INSALBRALDE", "MARIA APARECIDA DOS REIS E SILVA", "MATEUS FALCAO DE SOUZA", "MICHELLE CARMÃE FERNANDES", "MIGLIDIANE AJALA MACIEL", "MISLENE MARTINES DA SILVA", "PATRICK GIOVANNY SANTIAGO DIAS", "RAFAEL RAMOS RECALDE", "RAMONA DOS SANTOS DE OLIVEIRA", "RAQUEL ORTIZ DOS SANTOS", "REGINA ELIZA DOS SANTOS", "ROBSON PAVAO MONTANIA", "ROSANGELA DUTRA DE OLIVEIRA", "ROZANA REIS DA SILVA", "ROZENTINA MATOS DE OLIVEIRA COLMAN", "SARA ELIANE TALAVERA OLIVEIRA", "SELBA RAMONA ALFONSO", "SILVINA REGINA DE SOUZA VALIENTE", "SILVIO DE AQUINO", "SIMONE CARDOZO DA SILVA", "SONAIRA DA CRUZ SOARES ALBUQUERQUE", "SUELY AGUIAR ALVES LUIZ", "TANIA MARIA MONTANIA CORVALAN", "WAGNER TARLEI GOMES", "WALQUIRIA ARAUJO FLORES", "WESLEY DE SOUZA LEAL", "WILLAN ANDERSON CHAMORRO TAVARES"];

  function listaPadraoComoObjeto() {
    var obj = {};
    FUNCIONARIOS_PADRAO.forEach(function (par) { obj[par[0]] = par[1]; });
    return obj;
  }

  function migrarListaSalva(salva) {
    var antigos = {};
    LISTA_ANTERIOR.forEach(function (n) { antigos[semAcento(n)] = true; });
    var obj = listaPadraoComoObjeto();
    var existentes = {};
    Object.keys(obj).forEach(function (n) { existentes[semAcento(n)] = true; });
    Object.keys(salva).forEach(function (n) {
      var k = semAcento(n);
      if (!antigos[k] && !existentes[k]) obj[n] = salva[n];   // adicionado pela pessoa
    });
    return obj;
  }

  function carregarFuncionarios() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (localStorage.getItem(VERSAO_KEY) !== VERSAO_LISTA) {
            var migrada = migrarListaSalva(parsed);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrada));
            localStorage.setItem(VERSAO_KEY, VERSAO_LISTA);
            return migrada;
          }
          return parsed;
        }
      }
    } catch (e) { /* ignora e usa padrão */ }
    try { localStorage.setItem(VERSAO_KEY, VERSAO_LISTA); } catch (e) { /* ignora */ }
    return listaPadraoComoObjeto();
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

  function parseISO(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  function fmtBR(d) {
    return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  }

  function dataDeBR(s) {
    var p = s.slice(0, 10).split("/");
    return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
  }

  // "10/11/2026 (matutino)" e "10/11/2026" são o mesmo dia; matutino e
  // vespertino do mesmo dia NÃO conflitam (podem coexistir).
  function conflita(a, b) {
    if (a.slice(0, 10) !== b.slice(0, 10)) return false;
    var sa = a.slice(10), sb = b.slice(10);
    return sa === "" || sb === "" || sa === sb;
  }

  function semAcento(t) {
    return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
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
    dom.marcarTodos = document.getElementById("folgaMarcarTodos");
    dom.colarToggle = document.getElementById("folgaColarToggle");
    dom.colarWrap = document.getElementById("folgaColarWrap");
    dom.colarTexto = document.getElementById("folgaColarTexto");
    dom.colarAplicar = document.getElementById("folgaColarAplicar");
    dom.addPendente = document.getElementById("folgaAddPendente");
    dom.de = document.getElementById("folgaDe");
    dom.ate = document.getElementById("folgaAte");
    dom.soUteis = document.getElementById("folgaSoUteis");
    dom.addPeriodo = document.getElementById("folgaAddPeriodo");
    dom.pendentes = document.getElementById("folgaPendentes");
    dom.limparSel = document.getElementById("folgaLimparSel");
    dom.previewResumo = document.getElementById("folgaPreviewResumo");
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

  // nomes que passam na busca e no filtro de cargo (busca sem acento)
  function nomesFiltrados() {
    var termo = semAcento(state.filtroTexto);
    return Object.keys(state.funcionarios).sort().filter(function (nome) {
      var cargo = state.funcionarios[nome] || "";
      var bateTexto = !termo || semAcento(nome).indexOf(termo) !== -1 || semAcento(cargo).indexOf(termo) !== -1;
      var bateCargo = state.filtroCargo === "Todos" || cargo === state.filtroCargo;
      return bateTexto && bateCargo;
    });
  }

  function renderListaFuncionarios() {
    dom.lista.innerHTML = "";
    var nomes = Object.keys(state.funcionarios);
    var filtrados = nomesFiltrados();

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
          atualizarResumoSelecao();
          renderPreview();
          salvarRascunho();
        }
      });

      // clicar em qualquer parte da linha (menos cargo e ✕) marca/desmarca
      linha.addEventListener("click", function (e) {
        var t = e.target;
        if (t === check || t === cargoSelect || t === remover) return;
        check.checked = !check.checked;
        check.dispatchEvent(new Event("change"));
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
      dom.previewResumo.textContent = "";
      dom.preview.appendChild(el("p", "folga-preview__vazio", "Nenhuma folga adicionada ainda. Marque funcionários acima, monte as datas e clique em \"Adicionar aos selecionados\"."));
      return;
    }

    var totalFolgas = nomes.reduce(function (n, nome) { return n + state.selecoes[nome].length; }, 0);
    dom.previewResumo.textContent = nomes.length + " funcionário(s) · " + totalFolgas + " folga(s) no documento.";

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
        salvarRascunho();
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
          salvarRascunho();
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
    dom.addData.textContent = nomes.length ? "Adicionar aos " + nomes.length + " selecionado(s)" : "Adicionar aos selecionados";
    if (nomes.length === 0) {
      dom.resumoSelecao.textContent = "Nenhum funcionário selecionado.";
      dom.resumoSelecao.classList.remove("folga-selecao--ativa");
      return;
    }
    var rotulo = nomes.length === 1 ? "Selecionado: " : nomes.length + " selecionados: ";
    dom.resumoSelecao.textContent = rotulo + nomes.join(", ");
    dom.resumoSelecao.classList.add("folga-selecao--ativa");
  }

  function marcarTodosFiltrados() {
    var lista = nomesFiltrados();
    lista.forEach(function (n) { state.marcados[n] = true; });
    renderListaFuncionarios();
    atualizarResumoSelecao();
    setStatus(lista.length + " funcionário(s) marcado(s).", false);
  }

  // Cola uma lista de nomes (um por linha) e marca quem for encontrado.
  function marcarPorLista() {
    var linhas = dom.colarTexto.value.split(/\n|;/).map(function (l) {
      return l.replace(/^\s*(\d+\s*[.)\-–]\s*|[-•*]\s*)/, "").trim();
    }).filter(Boolean);
    if (!linhas.length) { setStatus("Cole ao menos um nome.", true); return; }

    var todos = Object.keys(state.funcionarios).map(function (n) { return { nome: n, chave: semAcento(n) }; });
    var achados = 0, naoAchados = [], ambiguos = [];

    linhas.forEach(function (linha) {
      var chave = semAcento(linha);
      if (!chave) return;
      var exatos = todos.filter(function (t) { return t.chave === chave; });
      var cand = exatos;
      if (!cand.length) {
        var palavras = chave.split(" ");
        cand = todos.filter(function (t) {
          return palavras.every(function (w) { return t.chave.indexOf(w) !== -1; });
        });
      }
      if (cand.length === 1) { state.marcados[cand[0].nome] = true; achados++; }
      else if (cand.length === 0) naoAchados.push(linha);
      else ambiguos.push(linha + " (" + cand.length + " parecidos)");
    });

    renderListaFuncionarios();
    atualizarResumoSelecao();
    var msg = achados + " funcionário(s) marcado(s).";
    if (naoAchados.length) msg += " Não encontrado(s): " + naoAchados.join("; ") + ".";
    if (ambiguos.length) msg += " Ambíguo(s) — escreva o nome completo: " + ambiguos.join("; ") + ".";
    setStatus(msg, naoAchados.length > 0 || ambiguos.length > 0);
    if (!naoAchados.length && !ambiguos.length) dom.colarTexto.value = "";
  }

  // ---------------- Datas pendentes ----------------

  function renderPendentes() {
    dom.pendentes.innerHTML = "";
    if (!state.pendentes.length) {
      dom.pendentes.appendChild(el("span", "folga-pend__vazio", "Nenhuma data na lista ainda — use “＋ Data” ou “＋ Período”."));
      return;
    }
    state.pendentes.slice().sort(compararDatasBR).forEach(function (data) {
      var chip = el("span", "folga-chip");
      chip.appendChild(el("span", "folga-chip__dia", DIAS_SEMANA[dataDeBR(data).getDay()]));
      chip.appendChild(document.createTextNode(data + " "));
      var x = el("button", "folga-chip__x", "✕");
      x.type = "button";
      x.title = "Tirar esta data";
      x.addEventListener("click", function () {
        state.pendentes = state.pendentes.filter(function (d) { return d !== data; });
        renderPendentes();
      });
      chip.appendChild(x);
      dom.pendentes.appendChild(chip);
    });
  }

  function adicionarPendente() {
    if (!dom.data.value) { setStatus("Escolha uma data.", true); return; }
    var d = dataInputParaBR(dom.data.value) + sufixoPeriodo();
    if (state.pendentes.indexOf(d) === -1) state.pendentes.push(d);
    dom.data.value = "";
    renderPendentes();
    setStatus("", false);
    dom.data.focus();
  }

  function adicionarPeriodo() {
    var ini = parseISO(dom.de.value), fim = parseISO(dom.ate.value);
    if (!ini || !fim) { setStatus("Escolha as datas “de” e “até” do período.", true); return; }
    if (fim < ini) { setStatus("A data “até” não pode ser antes da data “de”.", true); return; }
    var total = Math.round((fim - ini) / 86400000) + 1;
    if (total > LIMITE_PERIODO_DIAS) {
      setStatus("Período muito longo (" + total + " dias). O máximo é " + LIMITE_PERIODO_DIAS + " dias por vez.", true);
      return;
    }
    var suf = sufixoPeriodo(), n = 0, ignorados = 0;
    for (var i = 0; i < total; i++) {
      var d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i);
      var dow = d.getDay();
      if (dom.soUteis.checked && (dow === 0 || dow === 6)) { ignorados++; continue; }
      var txt = fmtBR(d) + suf;
      if (state.pendentes.indexOf(txt) === -1) { state.pendentes.push(txt); n++; }
    }
    dom.de.value = "";
    dom.ate.value = "";
    renderPendentes();
    setStatus(n + " dia(s) incluído(s) na lista" + (ignorados ? " (" + ignorados + " de fim de semana ignorado(s))" : "") + ".", false);
  }

  // ---------------- Rascunho (só nomes e datas) ----------------

  function salvarRascunho() {
    try {
      localStorage.setItem(RASCUNHO_KEY, JSON.stringify({ ci: dom.ci.value, selecoes: state.selecoes }));
    } catch (e) { /* sem armazenamento: segue sem rascunho */ }
  }

  function apagarRascunho() {
    try { localStorage.removeItem(RASCUNHO_KEY); } catch (e) { /* ignora */ }
  }

  function restaurarRascunho() {
    try {
      var raw = localStorage.getItem(RASCUNHO_KEY);
      if (!raw) return 0;
      var o = JSON.parse(raw);
      if (!o || typeof o !== "object") return 0;
      var sel = {};
      Object.keys(o.selecoes || {}).forEach(function (nome) {
        var datas = o.selecoes[nome];
        if (state.funcionarios[nome] === undefined || !Array.isArray(datas)) return;
        datas = datas.filter(function (d) { return typeof d === "string" && /^\d{2}\/\d{2}\/\d{4}/.test(d); });
        if (datas.length) sel[nome] = datas;
      });
      state.selecoes = sel;
      if (o.ci && !dom.ci.value) dom.ci.value = String(o.ci);
      return Object.keys(sel).length;
    } catch (e) { return 0; }
  }

  function desmarcarSelecao() {
    state.marcados = {};
    renderListaFuncionarios();
    atualizarResumoSelecao();
  }

  // Datas a lançar = as da lista "pendentes" + a data que estiver digitada
  // e ainda não tiver sido incluída (mantém o fluxo antigo de 1 clique).
  function datasParaAdicionar() {
    var lista = state.pendentes.slice();
    if (dom.data.value) {
      var d = dataInputParaBR(dom.data.value) + sufixoPeriodo();
      if (lista.indexOf(d) === -1) lista.push(d);
    }
    return lista;
  }

  function adicionarData() {
    var marcados = funcionariosMarcados();
    if (marcados.length === 0) {
      setStatus("Selecione ao menos um funcionário na lista.", true);
      return;
    }
    var datas = datasParaAdicionar();
    if (datas.length === 0) {
      setStatus("Escolha ao menos uma data (ou um período).", true);
      return;
    }

    var trocadas = 0;
    marcados.forEach(function (nome) {
      var lista = state.selecoes[nome] || [];
      datas.forEach(function (d) {
        var removidos = lista.filter(function (x) { return conflita(x, d); });
        // conta como "atualizado" só se o dia já existia de forma diferente
        if (removidos.length && !(removidos.length === 1 && removidos[0] === d)) trocadas++;
        lista = lista.filter(function (x) { return !conflita(x, d); });
        lista.push(d);
      });
      state.selecoes[nome] = lista;
    });

    state.pendentes = [];
    dom.data.value = "";
    renderPendentes();
    renderPreview();
    salvarRascunho();

    var msg = datas.length + " data(s) adicionada(s) para " + marcados.length + " funcionário(s)";
    if (trocadas) msg += " (" + trocadas + " dia(s) que já existiam foram atualizados)";
    msg += ".";
    if (dom.limparSel.checked) {
      state.marcados = {};
      renderListaFuncionarios();
      atualizarResumoSelecao();
      msg += " Seleção limpa — marque o próximo grupo.";
    }
    setStatus(msg, false);
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
    var temAlgo = Object.keys(state.selecoes).length || state.pendentes.length;
    if (temAlgo && !confirm("Apagar todas as folgas da prévia e a seleção atual?")) return;
    state.selecoes = {};
    state.marcados = {};
    state.pendentes = [];
    apagarRascunho();
    renderListaFuncionarios();
    renderPendentes();
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
      setStatus("Não foi possível carregar os componentes de geração de documento (verifique se o arquivo jszip.local.js está publicado junto com o site).", true);
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
        var qtd = funcionariosOrdenados.length;
        var sufixo = qtd === 1 ? funcionariosOrdenados[0].nome.split(" ")[0] : qtd + " agentes";
        var ciLimpo = ci.replace(/\//g, "-").replace(/\\/g, "-").replace(/:/g, "-");
        var nomeArquivo = "Ci - " + ciLimpo + " - Folga " + sufixo + ".docx";

        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);

        setStatus("Documento gerado: " + nomeArquivo + " (" + qtd + " funcionário(s)).", false);
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
    renderPendentes();
    var recuperados = restaurarRascunho();
    renderPreview();
    atualizarResumoSelecao();
    setStatus(recuperados
      ? "Rascunho recuperado: " + recuperados + " funcionário(s) com folgas. Use “Limpar tudo” para começar do zero."
      : "", false);

    dom.busca.addEventListener("input", function () {
      state.filtroTexto = dom.busca.value;
      renderListaFuncionarios();
    });
    // Enter com um único resultado: marca a pessoa e já limpa a busca (digitar nome → Enter → próximo)
    dom.busca.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      var lista = nomesFiltrados();
      if (lista.length !== 1) {
        setStatus(lista.length ? "Há " + lista.length + " resultados — digite mais do nome para ficar só um." : "Ninguém encontrado com essa busca.", lista.length === 0);
        return;
      }
      var nome = lista[0];
      if (state.marcados[nome]) delete state.marcados[nome]; else state.marcados[nome] = true;
      state.filtroTexto = "";
      dom.busca.value = "";
      renderListaFuncionarios();
      atualizarResumoSelecao();
      setStatus(state.marcados[nome] ? nome + " marcado." : nome + " desmarcado.", false);
      dom.busca.focus();
    });
    dom.ci.addEventListener("input", salvarRascunho);

    dom.marcarTodos.addEventListener("click", marcarTodosFiltrados);
    dom.colarToggle.addEventListener("click", function () {
      dom.colarWrap.hidden = !dom.colarWrap.hidden;
      if (!dom.colarWrap.hidden) dom.colarTexto.focus();
    });
    dom.colarAplicar.addEventListener("click", marcarPorLista);
    dom.addPendente.addEventListener("click", adicionarPendente);
    dom.data.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); adicionarPendente(); }
    });
    dom.addPeriodo.addEventListener("click", adicionarPeriodo);
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
    }
    dom.limpar.addEventListener("click", limparTudo);
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
