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

  var REM_KEY = "painelEndemiasFolgaRemetentes";
  var REMETENTES_PADRAO = [
    { setor: "SETOR DE ENDEMIAS E ZOONOSES", nome: "Alexandre Mendonca de Lima" },
    { setor: "SAÚDE DO TRABALHADOR", nome: "Evelise Tramarin de Araujo Poveda" },
    { setor: "VIGILÂNCIA EPIDEMIOLÓGICA", nome: "Renata Grance Carvalho Gomes" },
    { setor: "VIGILÂNCIA SANITÁRIA", nome: "Eveline Coelho Alves Pereira" },
    { setor: "VIGILÂNCIA AMBIENTAL", nome: "Adriano Scolari" }
  ];

  var state = {
    calSel: [],         // dias clicados no calendário (ISO yyyy-mm-dd)
    calMes: null,       // {a, m} mês exibido
    calUltimo: null,    // último dia clicado (para Shift+clique)
    tipoAtual: "Banco de horas",   // tipo da próxima folga lançada (volta ao padrão no F5)
    tipos: {},                     // tipo por funcionário já lançado
    ultimos: [],        // último grupo lançado (para "marcar de novo")
    remetentes: [],     // [{setor, nome}] — lista guardada no navegador
    remetente: 0,       // índice escolhido (volta ao padrão no F5)
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
    dom.remetente = document.getElementById("folgaRemetente");
    dom.remSetor = document.getElementById("folgaRemSetor");
    dom.remNome = document.getElementById("folgaRemNome");
    dom.remAdd = document.getElementById("folgaRemAdd");
    dom.remDel = document.getElementById("folgaRemDel");
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
        renderPreview();
      });

      var noDoc = null;
      if (state.selecoes[nome]) {
        noDoc = el("button", "folga-emp__doc", "✓ lançado ✕");
        noDoc.type = "button";
        noDoc.title = "Tirar do documento";
        noDoc.addEventListener("click", function (e) { e.stopPropagation(); removerFuncionarioDoDocumento(nome); });
      }

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
        if (t === check || t === cargoSelect || t === remover || t === noDoc) return;
        check.checked = !check.checked;
        check.dispatchEvent(new Event("change"));
      });

      linha.appendChild(check);
      linha.appendChild(nomeSpan);
      if (noDoc) linha.appendChild(noDoc);
      linha.appendChild(cargoSelect);
      linha.appendChild(remover);
      dom.lista.appendChild(linha);
    });

    dom.contador.textContent = "Exibindo " + filtrados.length + " de " + nomes.length + " funcionário(s)";
  }

  // ---------------- Quem envia ("De:") ----------------

  function carregarRemetentes() {
    try {
      var l = JSON.parse(localStorage.getItem(REM_KEY) || "null");
      if (Array.isArray(l) && l.length && l.every(function (r) { return r && r.setor && r.nome; })) {
        // o setor da Eveline mudou de nome: tira a versão antiga
        l = l.filter(function (r) { return !(r.setor === "SANITÁRIO E AMBIENTAL" && semAcento(r.nome) === semAcento("Eveline Coelho Alves Pereira")); });
        // coordenadores novos do padrão entram também para quem já tinha a lista salva
        REMETENTES_PADRAO.forEach(function (p) {
          if (!l.some(function (r) { return semAcento(r.nome) === semAcento(p.nome); })) l.push({ setor: p.setor, nome: p.nome });
        });
        return l;
      }
    } catch (e) { /* usa o padrão */ }
    return REMETENTES_PADRAO.map(function (r) { return { setor: r.setor, nome: r.nome }; });
  }
  function salvarRemetentes() { try { localStorage.setItem(REM_KEY, JSON.stringify(state.remetentes)); } catch (e) { /* ignora */ } }
  function remetenteAtual() { return state.remetentes[state.remetente] || state.remetentes[0] || REMETENTES_PADRAO[0]; }

  function renderRemetentes() {
    var sel = dom.remetente; if (!sel) return;
    sel.innerHTML = "";
    state.remetentes.forEach(function (r, i) {
      var o = document.createElement("option");
      o.value = String(i); o.textContent = r.setor + " – " + r.nome;
      sel.appendChild(o);
    });
    sel.value = String(state.remetente);
  }

  function titulo(t) {
    return t.trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|\s)(\S)/g, function (m, a, b) {
      return a + b.toUpperCase();
    }).replace(/\s(De|Da|Do|Das|Dos|E)(?=\s)/g, function (m) { return m.toLowerCase(); });
  }

  function adicionarRemetente() {
    var setor = (dom.remSetor.value || "").trim().toUpperCase(), nome = (dom.remNome.value || "").trim();
    if (!setor || !nome) { setStatus("Informe o setor e o nome de quem envia.", true); return; }
    nome = nome === nome.toUpperCase() ? titulo(nome) : nome;
    state.remetentes.push({ setor: setor, nome: nome });
    state.remetente = state.remetentes.length - 1;
    salvarRemetentes(); renderRemetentes(); renderPreview();
    dom.remSetor.value = ""; dom.remNome.value = "";
    setStatus("Remetente adicionado e selecionado.", false);
  }

  function removerRemetente() {
    if (state.remetentes.length <= 1) { setStatus("É preciso manter ao menos um remetente.", true); return; }
    var r = remetenteAtual();
    if (!confirm("Remover \"" + r.setor + " – " + r.nome + "\" da lista?")) return;
    state.remetentes.splice(state.remetente, 1);
    state.remetente = 0;
    salvarRemetentes(); renderRemetentes(); renderPreview();
  }

  // ---------------- Tipo de folga ----------------
  function tipoDe(nome) { return state.tipos[nome] || "Banco de horas"; }

  // texto do ASSUNTO conforme os tipos usados no documento
  function assuntoTexto(tipos) {
    var banco = tipos.indexOf("Banco de horas") !== -1, eleicao = tipos.indexOf("Folga eleição 2026") !== -1;
    if (banco && eleicao) return "Folga referente ao banco de horas acumulado e à eleição 2026.";
    if (eleicao) return "Folga referente à eleição 2026.";
    return "Folga referente ao banco de horas acumulado.";
  }

  // ---------------- Modelo ao vivo (papel A4 ao lado) ----------------

  var PAPEL_W = 794, PAPEL_H = 1123;   // A4 a 96 dpi (1 px = 15 twips)

  // junta datas novas numa lista, trocando as que conflitam (mesma regra de "Adicionar")
  function mesclar(lista, datas) {
    lista = lista.slice();
    datas.forEach(function (d) {
      lista = lista.filter(function (x) { return !conflita(x, d); });
      lista.push(d);
    });
    return lista;
  }

  // o que o modelo mostra: folgas já adicionadas + (em amarelo) o que está montado e ainda não foi adicionado
  function montarVisao() {
    var visao = {}, novas = {}, tipos = {};
    Object.keys(state.selecoes).forEach(function (n) { tipos[n] = tipoDe(n); });
    Object.keys(state.selecoes).forEach(function (n) { visao[n] = state.selecoes[n].slice(); });
    var datas = datasParaAdicionar();
    if (datas.length) {
      Object.keys(state.marcados).forEach(function (n) {
        if (state.funcionarios[n] === undefined) return;
        var antes = visao[n] || [];
        visao[n] = mesclar(antes, datas);
        tipos[n] = state.tipoAtual;
        datas.forEach(function (d) { if (antes.indexOf(d) === -1) novas[n + "|" + d] = true; });
      });
    }
    return { visao: visao, novas: novas, tipos: tipos };
  }

  // tira a pessoa do documento (folgas já lançadas) e também da seleção atual
  function removerFuncionarioDoDocumento(nome) {
    delete state.selecoes[nome];
    delete state.marcados[nome];
    renderListaFuncionarios();
    atualizarResumoSelecao();      // também redesenha o modelo
    renderUltimos();
    setStatus(nome + " removido do documento.", false);
  }

  // marca de novo só estas pessoas (para lançar mais dias sem procurar na lista)
  function remarcar(nomes) {
    state.marcados = {};
    nomes.forEach(function (n) { if (state.funcionarios[n] !== undefined) state.marcados[n] = true; });
    renderListaFuncionarios();
    atualizarResumoSelecao();
    var q = Object.keys(state.marcados);
    setStatus(q.length ? (q.length === 1 ? q[0] : q.length + " funcionários") + " marcado(s) — escolha o dia e clique em Lançar." : "", false);
    if (dom.data) dom.data.focus();
  }

  function renderUltimos() {
    var box = document.getElementById("fgUltimos");
    if (!box) return;
    box.innerHTML = "";
    var nomes = state.ultimos.filter(function (n) { return state.selecoes[n]; });
    if (!nomes.length) { box.hidden = true; return; }
    box.hidden = false;
    box.appendChild(el("span", "fg-ultimos__t", "Último lançado: " + (nomes.length > 2 ? nomes.length + " funcionários" : nomes.join(", "))));
    var b = el("button", "folga-btn folga-btn--ghost fer-sm", "↺ Lançar mais dias para " + (nomes.length === 1 ? "ele(a)" : "eles"));
    b.type = "button";
    b.addEventListener("click", function () { remarcar(nomes); });
    box.appendChild(b);
  }

  function tdPapel(tr, texto, cls) {
    var td = el("td", cls || null);
    if (texto !== undefined && texto !== null) td.textContent = texto;
    tr.appendChild(td);
    return td;
  }

  function renderPreview() {
    if (!dom.preview) return;
    var v = montarVisao();
    var nomes = Object.keys(v.visao).sort();
    var itens = nomes.map(function (n) {
      return { nome: n, cargo: state.funcionarios[n] || "", tipo: v.tipos[n], datas: v.visao[n].slice().sort(compararDatasBR).join(", ") };
    });

    var esc = null, nv;
    try { esc = window.FolgaLayout ? FolgaLayout.escolherNivel(itens.length ? itens : [{ nome: "", cargo: "", tipo: "", datas: "" }]) : null; } catch (e) { esc = null; }
    nv = esc ? esc.nivel : { sz: 20, mar: 60, trh: 560, hdr: 520, esp: 1, top: 1, mgl: 60, assin: 1500, logo: 1 };
    var cabe = !esc || esc.cabe;

    var px = function (tw) { return (tw / 15).toFixed(2) + "px"; };
    var P = dom.preview;
    P.innerHTML = "";
    P.className = "fg-papel" + (cabe ? "" : " fg-papel--estoura");
    P.style.setProperty("--sz", (nv.sz * 0.6667).toFixed(2) + "px");
    P.style.setProperty("--szh", (Math.min(18, nv.sz) * 0.6667).toFixed(2) + "px");
    P.style.setProperty("--mar", px(nv.mar));
    P.style.setProperty("--mgl", px(nv.mgl));
    P.style.setProperty("--trh", px(nv.trh));
    P.style.setProperty("--hdr", px(nv.hdr));
    P.style.setProperty("--assin", px(nv.assin));
    P.style.setProperty("--top-pad", px(454 + Math.round(828000 * nv.logo / 635) + 200));

    // cabeçalho (logo)
    var cab = el("div", "fgp-cab");
    var img = document.createElement("img");
    img.src = "assets/cabecalho-prefeitura.png";
    img.alt = "Prefeitura Municipal de Ponta Porã";
    img.style.height = (86.9 * nv.logo).toFixed(1) + "px";
    cab.appendChild(img);
    P.appendChild(cab);

    var corpo = el("div", "fgp-corpo");
    P.appendChild(corpo);
    var sp = function (tw) { var d = el("div", "fgp-esp"); d.style.height = px(tw * nv.esp); return d; };

    // título
    corpo.appendChild(el("div", "fgp-titulo", "COMUNICAÇÃO INTERNA"));
    corpo.appendChild(sp(120));

    // dados
    var ci = (dom.ci.value || "").trim();
    var t1 = el("table", "fgp-tab fgp-info"), cg = "";
    [1250, 3569, 1250, 3569].forEach(function (w) { cg += '<col style="width:' + px(w) + '">'; });
    t1.innerHTML = "<colgroup>" + cg + "</colgroup>";
    var r = el("tr"); tdPapel(r, "Número:", "fgp-lab"); tdPapel(r, (ci || "___") + "/2026"); tdPapel(r, "Data:", "fgp-lab"); tdPapel(r, formatarDataExtenso(new Date())); t1.appendChild(r);
    r = el("tr"); tdPapel(r, "De:", "fgp-lab"); var c = tdPapel(r, remetenteAtual().setor + " – "); c.colSpan = 3; c.appendChild(el("b", null, remetenteAtual().nome)); t1.appendChild(r);
    r = el("tr"); tdPapel(r, "Para:", "fgp-lab"); c = tdPapel(r, "SECRETARIA MUNICIPAL DE SAÚDE – "); c.colSpan = 3; c.appendChild(el("b", null, "Mariane Silvestre Quinhones")); t1.appendChild(r);
    corpo.appendChild(t1);
    corpo.appendChild(sp(200));

    corpo.appendChild(el("div", "fgp-assunto", "ASSUNTO: " + assuntoTexto(nomes.map(function (n) { return v.tipos[n]; }))));
    corpo.appendChild(sp(160));

    // funcionários
    var t2 = el("table", "fgp-tab fgp-func"); cg = "";
    [2450, 2000, 1450, 1938, 1800].forEach(function (w) { cg += '<col style="width:' + px(w) + '">'; });
    t2.innerHTML = "<colgroup>" + cg + "</colgroup>";
    r = el("tr", "fgp-cabtab");
    ["NOME", "CARGO", "TIPO DE FOLGA", "DATA DA FOLGA", "ASSINATURA DO SERVIDOR"].forEach(function (t) { tdPapel(r, t); });
    t2.appendChild(r);

    if (!nomes.length) {
      r = el("tr", "fgp-vazia");
      c = tdPapel(r, "Nenhuma folga ainda — marque funcionários, escolha as datas e clique em “Adicionar”."); c.colSpan = 5;
      t2.appendChild(r);
    }
    nomes.forEach(function (nome) {
      var datas = v.visao[nome].slice().sort(compararDatasBR);
      var linhaNova = datas.every(function (d) { return v.novas[nome + "|" + d]; });
      r = el("tr", linhaNova ? "fgp-nova" : null);
      var maisBtn = null;
      var cn = tdPapel(r, nome);
      {
        var rm = el("button", "fgp-x", "✕");
        rm.type = "button"; rm.title = "Tirar este funcionário do documento";
        rm.addEventListener("click", function () {
          removerFuncionarioDoDocumento(nome);
        });
        cn.appendChild(rm);
        var mais = el("button", "fgp-mais", "＋ dia");
        mais.type = "button"; mais.title = "Lançar mais dias para " + nome;
        mais.addEventListener("click", function () { remarcar([nome]); });
        maisBtn = mais;
      }
      tdPapel(r, state.funcionarios[nome] || "");
      tdPapel(r, v.tipos[nome]);
      var cd = tdPapel(r, null, "fgp-datas");
      datas.forEach(function (d, i) {
        var nova = !!v.novas[nome + "|" + d];
        var sp1 = el("span", "fgp-data" + (nova ? " fgp-data--nova" : ""));
        sp1.appendChild(document.createTextNode(d));
        if (!nova) {
          var x = el("button", "fgp-x fgp-x--data", "✕");
          x.type = "button"; x.title = "Tirar a data " + d;
          x.addEventListener("click", function () {
            state.selecoes[nome] = state.selecoes[nome].filter(function (q) { return q !== d; });
            if (!state.selecoes[nome].length) delete state.selecoes[nome];
            salvarRascunho(); renderPreview(); renderListaFuncionarios();
          });
          sp1.appendChild(x);
        }
        cd.appendChild(sp1);
        if (i < datas.length - 1) cd.appendChild(document.createTextNode(", "));
      });
      var cAss = tdPapel(r, "");
      if (maisBtn) cAss.appendChild(maisBtn);
      t2.appendChild(r);
    });
    corpo.appendChild(t2);

    // assinaturas (no pé da folha)
    var t3 = el("table", "fgp-tab fgp-assin"); cg = "";
    [3212, 3213, 3213].forEach(function (w) { cg += '<col style="width:' + px(w) + '">'; });
    t3.innerHTML = "<colgroup>" + cg + "</colgroup>";
    r = el("tr", "fgp-cabtab");
    ["RESPONSÁVEL DO SETOR", "ASSINATURA GERENCIA", "ASSINATURA SECRETÁRIO SAUDE"].forEach(function (t) { tdPapel(r, t); });
    t3.appendChild(r);
    r = el("tr", "fgp-linha-assin");
    for (var i = 0; i < 3; i++) {
      var td = el("td"); td.appendChild(el("div", "fgp-risco", "Assinatura")); td.appendChild(el("div", "fgp-dt", "Data: ____/____/______")); r.appendChild(td);
    }
    t3.appendChild(r);
    P.appendChild(t3);

    // resumo, selo e abas
    var totalFolgas = Object.keys(state.selecoes).reduce(function (n, nome) { return n + state.selecoes[nome].length; }, 0);
    var qtd = Object.keys(state.selecoes).length;
    dom.previewResumo.textContent = qtd ? qtd + " funcionário(s) · " + totalFolgas + " folga(s) no documento." : "";
    var aN = document.getElementById("fgAbaN");
    if (aN) aN.textContent = qtd ? "(" + qtd + ")" : "";
    var selo = document.getElementById("fgSelo");
    if (selo) {
      if (!nomes.length) { selo.textContent = "vazio"; selo.className = "fg-selo"; }
      else if (!cabe) { selo.textContent = "⚠ não cabe em 1 folha (vai gerar 2 páginas)"; selo.className = "fg-selo fg-selo--aviso"; }
      else if (esc && esc.indice > 0) { selo.textContent = "✓ ajustado para 1 folha"; selo.className = "fg-selo fg-selo--ok"; }
      else { selo.textContent = "✓ cabe em 1 folha"; selo.className = "fg-selo fg-selo--ok"; }
    }
    ajustarEscala();
  }

  // aproxima/afasta a página inteira conforme a resolução, para sempre caber na tela sem rolagem
  var zTela = 1;
  function ajustarTela() {
    var pg = document.querySelector(".page--split");
    if (!pg) return;
    zTela = window.innerWidth > 1020 ? Math.max(0.6, Math.min(1.15, window.innerHeight / 1000, window.innerWidth / 1650)) : 1;
    pg.style.setProperty("--z", zTela.toFixed(3));
    ajustarEscala();
  }

  // encolhe o papel A4 para caber no painel (largura e altura da tela)
  function ajustarEscala() {
    var caixa = document.getElementById("fgCaixa");
    if (!caixa || !dom.preview) return;
    var larg = caixa.parentNode.clientWidth - 30;
    if (larg <= 0) return;
    if (!zTela) zTela = 1;
    var h = Math.max(PAPEL_H, dom.preview.offsetHeight);
    var k = Math.min(1, larg / PAPEL_W);
    if (window.innerWidth > 1020) {
      var livre = (window.innerHeight - 90) / zTela - 255;               // topo + cabeçalho/rodapé do painel
      k = Math.min(k, Math.max(0.3, livre / h));
    }
    caixa.style.width = Math.round(PAPEL_W * k) + "px";
    caixa.style.margin = "0 auto";
    dom.preview.style.transform = "scale(" + k + ")";
    caixa.style.height = Math.round(h * k) + "px";
  }

  // lupa: mostra o modelo grande, em tela cheia
  function abrirLupa() {
    var lupa = document.getElementById("fgLupa"), area = document.getElementById("fgLupaArea");
    if (!lupa || !dom.preview) return;
    area.innerHTML = "";
    var copia = dom.preview.cloneNode(true);
    copia.removeAttribute("id");
    Array.prototype.forEach.call(copia.querySelectorAll(".fgp-x, .fgp-mais"), function (b) { b.parentNode.removeChild(b); });
    var h = Math.max(PAPEL_H, dom.preview.offsetHeight);
    var k = Math.min((window.innerWidth - 40) / PAPEL_W, (window.innerHeight - 90) / h, 1.6);
    copia.style.transform = "scale(" + k + ")";
    copia.style.position = "absolute"; copia.style.left = "0"; copia.style.top = "0";
    var moldura = el("div", "fg-lupa__papel");
    moldura.style.width = Math.round(PAPEL_W * k) + "px";
    moldura.style.height = Math.round(h * k) + "px";
    moldura.appendChild(copia);
    area.appendChild(moldura);
    lupa.hidden = false;
  }
  function fecharLupa() { var l = document.getElementById("fgLupa"); if (l) l.hidden = true; }

  // ---------------- Ações ----------------

  function funcionariosMarcados() {
    return Object.keys(state.marcados);
  }

  // quem está marcado agora: chips com ✕ (e atualiza o botão e o modelo)
  function atualizarResumoSelecao() {
    if (!dom.resumoSelecao) return;
    var nomes = Object.keys(state.marcados).sort();
    if (dom.addData) dom.addData.textContent = nomes.length ? "Adicionar aos " + nomes.length + " selecionado(s)" : "Adicionar aos selecionados";
    dom.resumoSelecao.innerHTML = "";
    if (nomes.length === 0) {
      dom.resumoSelecao.appendChild(el("span", "fg-marcados__vazio", "Ninguém marcado ainda — clique nos nomes da lista."));
    } else {
      dom.resumoSelecao.appendChild(el("span", "fg-marcados__t", nomes.length + " marcado(s):"));
      nomes.forEach(function (nome) {
        var chip = el("span", "folga-chip");
        chip.appendChild(document.createTextNode(nome + " "));
        var x = el("button", "folga-chip__x", "✕");
        x.type = "button"; x.title = "Desmarcar";
        x.addEventListener("click", function () {
          delete state.marcados[nome];
          renderListaFuncionarios();
          atualizarResumoSelecao();
        });
        chip.appendChild(x);
        dom.resumoSelecao.appendChild(chip);
      });
    }
    renderPreview();
    renderCalendario();
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
    if (!dom.pendentes) { renderPreview(); return; }
    dom.pendentes.innerHTML = "";
    if (!state.pendentes.length) {
      dom.pendentes.appendChild(el("span", "folga-pend__vazio", "Nenhuma data escolhida ainda — use “＋ Incluir dia” ou “＋ Incluir período”."));
      renderPreview();
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
    renderPreview();
  }

  function adicionarPendente() {
    if (!state.calSel.length && !dom.data.value) { setStatus("Clique nos dias da folga no calendário.", true); return; }
    if (!funcionariosMarcados().length) { setStatus("Marque primeiro quem vai folgar (passo 2).", true); return; }
    var suf = sufixoPeriodo();
    if (dom.data.value) { var dd = dataInputParaBR(dom.data.value) + suf; if (state.pendentes.indexOf(dd) === -1) state.pendentes.push(dd); dom.data.value = ""; }
    state.calSel.forEach(function (iso) {
      var d = parseISO(iso); if (!d) return;
      var t = fmtBR(d) + suf;
      if (state.pendentes.indexOf(t) === -1) state.pendentes.push(t);
    });
    state.calSel = []; state.calUltimo = null;
    adicionarData();               // lança direto no documento
    renderCalendario();
    dom.busca.focus();
  }

  // ---------------- Calendário de seleção múltipla ----------------

  var NOMES_MES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  function isoDe(a, m, d) { return a + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"); }

  function renderCalendario() {
    var box = document.getElementById("fgCal");
    if (!box) return;
    if (!state.calMes) { var h = new Date(); state.calMes = { a: h.getFullYear(), m: h.getMonth() }; }
    var a = state.calMes.a, m = state.calMes.m;
    box.innerHTML = "";

    var topo = el("div", "fg-cal__topo");
    var ant = el("button", "fg-cal__nav", "‹"); ant.type = "button"; ant.title = "Mês anterior";
    var prox = el("button", "fg-cal__nav", "›"); prox.type = "button"; prox.title = "Próximo mês";
    ant.addEventListener("click", function () { state.calMes = m === 0 ? { a: a - 1, m: 11 } : { a: a, m: m - 1 }; renderCalendario(); });
    prox.addEventListener("click", function () { state.calMes = m === 11 ? { a: a + 1, m: 0 } : { a: a, m: m + 1 }; renderCalendario(); });
    topo.appendChild(ant);
    topo.appendChild(el("strong", null, NOMES_MES[m] + " " + a));
    topo.appendChild(prox);
    box.appendChild(topo);

    var grade = el("div", "fg-cal__grade");
    ["D", "S", "T", "Q", "Q", "S", "S"].forEach(function (d, i) { grade.appendChild(el("span", "fg-cal__sem" + (i === 0 || i === 6 ? " fg-cal__fds" : ""), d)); });
    var primeiro = new Date(a, m, 1).getDay(), dias = new Date(a, m + 1, 0).getDate();
    var hoje = new Date(), isoHoje = isoDe(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    for (var v = 0; v < primeiro; v++) grade.appendChild(el("span", "fg-cal__vazio"));
    for (var d = 1; d <= dias; d++) {
      (function (d) {
        var iso = isoDe(a, m, d), dow = new Date(a, m, d).getDay();
        var b = el("button", "fg-cal__dia" + (dow === 0 || dow === 6 ? " fg-cal__fds" : "") + (iso === isoHoje ? " fg-cal__hoje" : "") + (state.calSel.indexOf(iso) !== -1 ? " fg-cal__sel" : ""), String(d));
        b.type = "button";
        b.setAttribute("aria-pressed", state.calSel.indexOf(iso) !== -1 ? "true" : "false");
        b.addEventListener("click", function (e) { clicarDia(iso, e.shiftKey); });
        grade.appendChild(b);
      })(d);
    }
    box.appendChild(grade);

    var rod = el("div", "fg-cal__rodape");
    if (!state.calSel.length) {
      rod.appendChild(el("span", "fg-cal__dica", "Nenhum dia escolhido. Dica: Shift + clique seleciona um intervalo."));
    } else {
      state.calSel.slice().sort().forEach(function (iso) {
        var dd = parseISO(iso);
        var chip = el("span", "folga-chip");
        chip.appendChild(el("span", "folga-chip__dia", DIAS_SEMANA[dd.getDay()]));
        chip.appendChild(document.createTextNode(fmtBR(dd) + " "));
        var x = el("button", "folga-chip__x", "✕"); x.type = "button"; x.title = "Tirar este dia";
        x.addEventListener("click", function () { state.calSel = state.calSel.filter(function (q) { return q !== iso; }); renderCalendario(); renderPreview(); });
        chip.appendChild(x);
        rod.appendChild(chip);
      });
      var lim = el("button", "folga-link-btn", "limpar dias"); lim.type = "button";
      lim.addEventListener("click", function () { state.calSel = []; state.calUltimo = null; renderCalendario(); renderPreview(); });
      rod.appendChild(lim);
    }
    box.appendChild(rod);

    var btn = document.getElementById("folgaAddPendente");
    if (btn) {
      var nm = funcionariosMarcados().length, nd = state.calSel.length;
      btn.textContent = nd ? "＋ Lançar " + nd + " dia" + (nd > 1 ? "s" : "") + (nm ? " para " + nm + " funcionário" + (nm > 1 ? "s" : "") : "") : "＋ Lançar dias";
    }
  }

  function clicarDia(iso, shift) {
    var i = state.calSel.indexOf(iso);
    if (shift && state.calUltimo && state.calUltimo !== iso) {
      var a = parseISO(state.calUltimo), b = parseISO(iso);
      if (a > b) { var t = a; a = b; b = t; }
      var uteis = dom.soUteis ? false : false;
      for (var d = new Date(a); d <= b; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        var k = isoDe(d.getFullYear(), d.getMonth(), d.getDate());
        if (state.calSel.indexOf(k) === -1) state.calSel.push(k);
      }
    } else if (i === -1) state.calSel.push(iso);
    else state.calSel.splice(i, 1);
    state.calUltimo = iso;
    renderCalendario();
    renderPreview();
  }

  function adicionarPeriodo() {
    var ini = parseISO(dom.de.value), fim = parseISO(dom.ate.value);
    if (!ini || !fim) { setStatus("Escolha as datas “de” e “até” do período.", true); return; }
    if (fim < ini) { setStatus("A data “até” não pode ser antes da data “de”.", true); return; }
    if (!funcionariosMarcados().length) { setStatus("Marque primeiro quem vai folgar (passo 2).", true); return; }
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
    adicionarData();               // lança direto no documento
    if (ignorados) setStatus(dom.status.textContent + " (" + ignorados + " dia(s) de fim de semana ignorado(s).)", false);
    dom.busca.focus();
  }

  // ---------------- Rascunho (só nomes e datas) ----------------

  // O trabalho (CI, folgas, datas) NÃO é salvo: ao atualizar a página (F5) tudo volta ao começo.
  function salvarRascunho() { /* de propósito não salva */ }
  function apagarRascunho() { try { localStorage.removeItem(RASCUNHO_KEY); } catch (e) { /* ignora */ } }
  function restaurarRascunho() { apagarRascunho(); return 0; }  // limpa rascunhos antigos

  function desmarcarSelecao() {
    state.marcados = {};
    renderListaFuncionarios();
    atualizarResumoSelecao();
  }

  // Datas a lançar = as da lista "pendentes" + a data que estiver digitada
  // e ainda não tiver sido incluída (mantém o fluxo antigo de 1 clique).
  function datasParaAdicionar() {
    var lista = state.pendentes.slice();
    state.calSel.forEach(function (iso) {
      var dd = parseISO(iso); if (!dd) return;
      var t = fmtBR(dd) + sufixoPeriodo();
      if (lista.indexOf(t) === -1) lista.push(t);
    });
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
      });
      state.selecoes[nome] = mesclar(lista, datas);
      state.tipos[nome] = state.tipoAtual;
    });

    state.pendentes = [];
    state.ultimos = marcados.slice();
    dom.data.value = "";
    renderPendentes();
    renderPreview();
    renderListaFuncionarios();
    renderUltimos();
    salvarRascunho();

    var msg = "✓ " + datas.join(", ") + " lançada(s) para " + marcados.length + " funcionário(s)";
    if (trocadas) msg += " (" + trocadas + " dia(s) que já existiam foram atualizados)";
    msg += ".";
    if (dom.limparSel.checked) {
      state.marcados = {};
      renderListaFuncionarios();
      atualizarResumoSelecao();
      msg += " Pode marcar o próximo funcionário.";
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
    state.calSel = []; state.calUltimo = null;
    apagarRascunho();
    state.ultimos = [];
    renderUltimos();
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
    var escolhaLayout = null;

    var funcionariosOrdenados = nomes.sort().map(function (nome) {
      var datas = state.selecoes[nome].slice().sort(compararDatasBR);
      return {
        nome: nome,
        cargo: state.funcionarios[nome] || "",
        tipo: tipoDe(nome),
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

          // ajuste automático para caber numa folha (fonte, alturas e espaços)
          escolhaLayout = null;
          if (window.FolgaLayout) {
            try {
              escolhaLayout = FolgaLayout.escolherNivel(funcionariosOrdenados);
              docXml = FolgaLayout.aplicarNivel(docXml, escolhaLayout.nivel);
              Object.keys(arquivos).forEach(function (caminho) {
                if (/^word\/header\d+\.xml$/.test(caminho)) {
                  arquivos[caminho] = FolgaLayout.aplicarCabecalho(arquivos[caminho], escolhaLayout.nivel);
                }
              });
            } catch (e) {
              console.warn("Ajuste de layout ignorado:", e);
              docXml = arquivos["word/document.xml"];
              escolhaLayout = null;
            }
          }

          docXml = DocxUtils.expandirLinhaTabela(docXml, "<<nome>>", funcionariosOrdenados, function (item) {
            return {
              "<<nome>>": item.nome,
              "<<cargo>>": item.cargo,
              "<<tipo>>": item.tipo,
              "<<datas>>": item.datas
            };
          });

          var rem = remetenteAtual();
          var subs = { "<<ci>>": ci, "<<hoje>>": formatarDataExtenso(new Date()), "<<setor>>": rem.setor, "<<assunto>>": assuntoTexto(funcionariosOrdenados.map(function (f) { return f.tipo; })), "<<remetente>>": rem.nome };
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

        var aviso = "";
        if (escolhaLayout && !escolhaLayout.cabe) {
          aviso = " Atenção: são funcionários/datas demais para uma folha só, o documento deve sair com 2 páginas — considere dividir em dois documentos.";
        } else if (escolhaLayout && escolhaLayout.indice > 0) {
          aviso = " Tabela ajustada para caber em uma folha.";
        }
        setStatus("Documento gerado: " + nomeArquivo + " (" + qtd + " funcionário(s))." + aviso, !!(escolhaLayout && !escolhaLayout.cabe));
      })
      .catch(function (err) {
        console.error(err);
        setStatus("Erro ao gerar documento: " + err.message, true);
      });
  }

  // ---------------- Tela dividida: abas (celular) e modo de data ----------------

  function ligarTelaDividida() {
    var grade = document.querySelector(".fg-grade");
    document.querySelectorAll(".fg-aba").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".fg-aba").forEach(function (x) { x.classList.toggle("fg-aba--ativa", x === b); });
        if (grade) grade.setAttribute("data-aba", b.getAttribute("data-aba"));
        setTimeout(ajustarEscala, 30);
      });
    });
    document.querySelectorAll("#fgTipo .fg-modo__b").forEach(function (b) {
      b.addEventListener("click", function () {
        state.tipoAtual = b.getAttribute("data-tipo");
        document.querySelectorAll("#fgTipo .fg-modo__b").forEach(function (x) { x.classList.toggle("fg-modo__b--ativo", x === b); });
        renderPreview();
      });
    });
    document.querySelectorAll(".fg-modo:not(.fg-modo--tipo) .fg-modo__b").forEach(function (b) {
      b.addEventListener("click", function () {
        var modo = b.getAttribute("data-modo");
        document.querySelectorAll(".fg-modo:not(.fg-modo--tipo) .fg-modo__b").forEach(function (x) { x.classList.toggle("fg-modo__b--ativo", x === b); });
        document.querySelectorAll(".fg-modo__corpo").forEach(function (c) { c.hidden = c.getAttribute("data-corpo") !== modo; });
      });
    });
    var amp = document.getElementById("fgAmpliar");
    if (amp) amp.addEventListener("click", abrirLupa);
    var lx = document.getElementById("fgLupaX"), lupa = document.getElementById("fgLupa");
    if (lx) lx.addEventListener("click", fecharLupa);
    if (lupa) lupa.addEventListener("click", function (e) { if (e.target === lupa || e.target.id === "fgLupaArea") fecharLupa(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharLupa(); });
    window.addEventListener("resize", ajustarTela);
    ajustarTela();
    if (window.ResizeObserver) {
      var caixa = document.getElementById("fgCaixa");
      if (caixa && caixa.parentNode) new ResizeObserver(ajustarEscala).observe(caixa.parentNode);
    }
  }

  // ---------------- Início ----------------

  function iniciar() {
    cacheDom();
    if (!dom.lista) return;

    state.funcionarios = carregarFuncionarios();
    renderCalendario();
    state.remetentes = carregarRemetentes();
    renderRemetentes();
    dom.remetente.addEventListener("change", function () { state.remetente = parseInt(dom.remetente.value, 10) || 0; renderPreview(); });
    dom.remAdd.addEventListener("click", adicionarRemetente);
    dom.remDel.addEventListener("click", removerRemetente);
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
    dom.ci.addEventListener("input", function () { salvarRascunho(); renderPreview(); });
    dom.data.addEventListener("input", renderPreview);
    dom.periodoMatutino.addEventListener("change", function () { renderPendentes(); });
    dom.periodoVespertino.addEventListener("change", function () { renderPendentes(); });
    ligarTelaDividida();

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
    if (dom.addData) dom.addData.addEventListener("click", adicionarData);
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
