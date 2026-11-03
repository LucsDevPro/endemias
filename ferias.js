// ============================================================
// Gerador de Férias (em lote) — página própria. Lê
// assets/modelo-ferias.docx e substitui as tags {{NOME}}, {{CPF}},
// {{MATRICULA}} etc. (usa docx-utils.js, que já foi testado).
//
// Fluxo: carregar a planilha → marcar vários servidores → ajustar a
// lista (cargo, período, dias, início) → gerar. Com 1 servidor baixa
// o .docx; com vários baixa um .zip (um .docx por servidor) ou, se
// preferir, um único .docx com um requerimento por página.
//
// IMPORTANTE (privacidade): a planilha de funcionários (com CPF) e a
// lista de requerimentos NÃO ficam salvas no site nem são enviadas a
// nenhum servidor. Vivem só na memória da aba e somem ao fechar ou
// recarregar a página — de propósito, para não deixar dados pessoais
// (CPF) gravados em lugar nenhum (nem no repositório do GitHub).
// ============================================================

(function () {
  "use strict";

  var CARGOS_SUGERIDOS = ["Agente de Combate às Endemias", "Médico veterinário", "Serviços gerais"];
  var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  var TAGS = ["NOME","MATRICULA","CPF","CARGO","DATAADMISSAO","PERIODO","DIAS","DATAINICIO","DATAFIM","DATACRIACAO"];
  var MODELO_URL = "assets/modelo-ferias.docx";
  var CAMPOS_OBRIGATORIOS = ["nome","matricula","cpf","admissao","cargo","periodo","inicio"];
  var ROTULO_CAMPO = {
    nome: "nome", matricula: "matrícula", cpf: "CPF", admissao: "admissão",
    cargo: "cargo", periodo: "período", inicio: "início"
  };

  var state = {
    funcionarios: [],   // planilha: [{matricula, nome, admissao, cpf, cargo}]
    visiveis: [],       // índices (em funcionarios) que passam na busca
    marcados: {},       // índice em funcionarios -> true
    linhas: [],         // lista de requerimentos
    proxId: 1,
    dias: 30,           // padrão do lote
    modelo: null,       // cache do .docx modelo: {bytes, xmls}
    mostrarErros: false,
    gerando: false
  };

  var dom = {};

  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    dom.csvInput = $("feriasCsvInput");
    dom.csvZone = $("feriasCsvZone");
    dom.csvTexto = $("feriasCsvTexto");
    dom.ou = $("feriasOu");
    dom.googleBtn = $("feriasGoogleBtn");
    dom.googleStatus = $("feriasGoogleStatus");

    dom.picker = $("feriasPicker");
    dom.busca = $("feriasBusca");
    dom.marcarTodos = $("feriasMarcarTodos");
    dom.desmarcar = $("feriasDesmarcar");
    dom.pick = $("feriasPick");
    dom.pickInfo = $("feriasPickInfo");
    dom.adicionar = $("feriasAdicionar");
    dom.manual = $("feriasManual");

    dom.defCargo = $("feriasDefCargo");
    dom.defPeriodo = $("feriasDefPeriodo");
    dom.btn15 = $("feriasBtn15");
    dom.btn30 = $("feriasBtn30");
    dom.defInicio = $("feriasDefInicio");
    dom.dataReq = $("feriasDataReq");
    dom.aplicar = $("feriasAplicar");

    dom.contador = $("feriasContador");
    dom.resumo = $("feriasResumo");
    dom.vazio = $("feriasVazio");
    dom.lista = $("feriasLista");
    dom.dica = $("feriasDica");

    dom.status = $("feriasStatus");
    dom.limpar = $("feriasLimpar");
    dom.gerarUnico = $("feriasGerarUnico");
    dom.gerar = $("feriasGerar");
  }

  // ---------------- Utilidades ----------------

  function el(tag, cls, texto) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto != null) e.textContent = texto;
    return e;
  }

  function pad2(n) { return String(n).padStart(2, "0"); }

  function fmtBR(date) {
    return pad2(date.getDate()) + "/" + pad2(date.getMonth() + 1) + "/" + date.getFullYear();
  }

  function isoDe(date) {
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  }

  function dataExtenso(d) {
    return d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear();
  }

  function parseISO(val) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val || "");
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3]);
  }

  // Aceita dd/mm/aaaa (também com - ou .), dd/mm/aa e aaaa-mm-dd.
  function parseData(s) {
    s = String(s || "").trim();
    var d, mo, y;
    var m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/.exec(s);
    if (m) {
      d = +m[1]; mo = +m[2]; y = +m[3];
      if (m[3].length === 2) y += (y <= 49 ? 2000 : 1900);
    } else {
      m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
      if (!m) return null;
      y = +m[1]; mo = +m[2]; d = +m[3];
    }
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return dt;
  }

  // Último período aquisitivo COMPLETO a partir da data de admissão.
  // Ex.: admissão 15/03/2018, hoje 01/11/2026 → o ciclo 15/03/2025 a
  // 14/03/2026 já fechou → "2025/2026". Devolve "" se ainda não fechou
  // nenhum ciclo ou se a admissão não puder ser lida.
  function calcPeriodo(admissaoTxt) {
    var adm = parseData(admissaoTxt);
    if (!adm) return "";
    var agora = new Date();
    var hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    var aniv = new Date(hoje.getFullYear(), adm.getMonth(), adm.getDate());
    var y = hoje >= aniv ? hoje.getFullYear() - 1 : hoje.getFullYear() - 2;
    if (y < adm.getFullYear()) return "";
    return y + "/" + (y + 1);
  }

  function calcFim(isoInicio, dias) {
    var ini = parseISO(isoInicio);
    if (!ini || !dias) return null;
    return new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + dias - 1);
  }

  function textoFim(l) {
    var fim = calcFim(l.inicio, l.dias);
    return fim ? fmtBR(fim) : "—";
  }

  var MAPA_ACENTOS = { "ã":"a","â":"a","á":"a","à":"a","ä":"a","é":"e","ê":"e","è":"e","ë":"e","í":"i","î":"i","ì":"i","ï":"i","õ":"o","ô":"o","ó":"o","ò":"o","ö":"o","ú":"u","û":"u","ù":"u","ü":"u","ç":"c","ñ":"n" };

  function normalizar(s) {
    return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]/gi, function (c) { return MAPA_ACENTOS[c] || c; });
  }

  function slug(s) {
    return String(s || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  }

  function setStatus(msg, erro) {
    dom.status.textContent = msg || "";
    dom.status.classList.toggle("folga-status--erro", !!erro);
  }

  function opcoesPeriodo() {
    var ano = new Date().getFullYear();
    var out = [];
    for (var y = ano - 5; y <= ano + 1; y++) out.push(y + "/" + (y + 1));
    return out;
  }

  // Preenche um <select> de período; garante que o valor atual exista.
  // "extras" = opções fixas no começo, [{v, t}].
  function preencherSelectPeriodo(sel, valor, extras) {
    sel.innerHTML = "";
    (extras || [{ v: "", t: "Selecione o período" }]).forEach(function (o) {
      var opt = el("option", null, o.t); opt.value = o.v; sel.appendChild(opt);
    });
    var lista = opcoesPeriodo();
    if (valor && lista.indexOf(valor) === -1) lista.push(valor);
    lista.forEach(function (p) {
      var opt = el("option", null, p); opt.value = p; sel.appendChild(opt);
    });
    sel.value = valor || "";
  }

  function preencherSelectCargo(sel, valor) {
    sel.innerHTML = "";
    var lista = CARGOS_SUGERIDOS.slice();
    if (valor && lista.indexOf(valor) === -1) lista.push(valor);
    lista.forEach(function (c) {
      var opt = el("option", null, c); opt.value = c; sel.appendChild(opt);
    });
    sel.value = valor || lista[0];
  }

  // ---------------- CSV ----------------

  function decodificar(buffer) {
    var txt;
    try {
      txt = new TextDecoder("utf-8", { fatal: true }).decode(buffer);   // planilha salva em UTF-8
    } catch (e) {
      txt = new TextDecoder("windows-1252").decode(buffer);             // Excel em português (padrão antigo)
    }
    return txt.replace(/^﻿/, "");
  }

  // Leitor de CSV que respeita aspas (um campo "Silva; João" não quebra).
  function lerCsv(texto, sep) {
    var linhas = [], linha = [], atual = "", aspas = false;
    for (var i = 0; i < texto.length; i++) {
      var c = texto[i];
      if (aspas) {
        if (c === "\"") {
          if (texto[i + 1] === "\"") { atual += "\""; i++; } else { aspas = false; }
        } else { atual += c; }
      } else if (c === "\"") { aspas = true; }
      else if (c === sep) { linha.push(atual); atual = ""; }
      else if (c === "\n") { linha.push(atual); linhas.push(linha); linha = []; atual = ""; }
      else if (c !== "\r") { atual += c; }
    }
    if (atual !== "" || linha.length) { linha.push(atual); linhas.push(linha); }
    return linhas;
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
      cpf: col("cpf"),
      cargo: col("cargo", "funcao")
    };
  }

  function processarPlanilha(texto) {
    var primeira = texto.split(/\r?\n/, 1)[0] || "";
    var sep = primeira.indexOf(";") !== -1 ? ";" : (primeira.indexOf("\t") !== -1 ? "\t" : ",");
    var linhas = lerCsv(texto, sep).filter(function (l) {
      return l.some(function (c) { return c.trim() !== ""; });
    });
    if (linhas.length < 2) {
      setStatus("Planilha vazia ou em formato inesperado.", true);
      return;
    }
    var headers = linhas[0].map(normalizar);
    var idx = encontrarColuna(headers);
    if (idx.mat === -1) idx.mat = 0;
    if (idx.nome === -1) idx.nome = 1;
    if (idx.adm === -1) idx.adm = 2;
    if (idx.cpf === -1) idx.cpf = 3;

    var lista = [];
    for (var i = 1; i < linhas.length; i++) {
      var cols = linhas[i].map(function (c) { return c.trim(); });
      var f = {
        matricula: cols[idx.mat] || "",
        nome: cols[idx.nome] || "",
        admissao: cols[idx.adm] || "",
        cpf: cols[idx.cpf] || "",
        cargo: idx.cargo !== -1 ? (cols[idx.cargo] || "") : ""
      };
      if (f.nome) lista.push(f);
    }
    if (!lista.length) {
      setStatus("Nenhum funcionário encontrado na planilha (confira a coluna Nome).", true);
      return;
    }
    definirFuncionarios(lista);
    dom.csvZone.classList.add("folga-upload--done");
    dom.csvTexto.textContent = lista.length + " funcionário(s) carregado(s) — nada foi salvo, só está nesta aba. Clique para trocar a planilha.";
    setStatus("", false);
  }

  function carregarCsv(file) {
    var reader = new FileReader();
    reader.onload = function (e) { processarPlanilha(decodificar(e.target.result)); };
    reader.onerror = function () { setStatus("Erro ao ler a planilha.", true); };
    reader.readAsArrayBuffer(file);
  }

  // ---------------- Google (opcional) ----------------
  // O botão só aparece se APPS_SCRIPT_URL estiver preenchida em
  // ferias-config.js. O Apps Script (Codigo.gs) abre numa janela, confere a
  // conta logada e devolve a planilha por postMessage.

  function urlGoogle() {
    var c = window.FERIAS_CONFIG;
    if (c && c.APPS_SCRIPT_URL) return String(c.APPS_SCRIPT_URL);
    if (typeof window.APPS_SCRIPT_URL === "string" && window.APPS_SCRIPT_URL) return window.APPS_SCRIPT_URL;
    return "";
  }

  function origemGoogle(origin) {
    return /^https:\/\/([a-z0-9-]+\.)*(google\.com|googleusercontent\.com)$/i.test(origin || "");
  }

  function carregarDoGoogle() {
    var url = urlGoogle();
    if (!url) return;
    dom.googleStatus.textContent = "Abrindo o login do Google…";
    var pop = window.open(url, "planilhaFeriasGoogle", "width=520,height=660");
    if (!pop) {
      dom.googleStatus.textContent = "O navegador bloqueou a janela do Google. Libere pop-ups para este site e tente de novo.";
      return;
    }
    var recebeu = false;
    var timer = null;

    function encerrar() {
      window.removeEventListener("message", aoReceber);
      if (timer) clearInterval(timer);
    }

    function aoReceber(e) {
      var m = e.data;
      if (!m || m.tipo !== "planilha-endemias") return;
      if (!origemGoogle(e.origin)) return;
      recebeu = true;
      encerrar();
      if (m.erro) {
        dom.googleStatus.textContent = "Não foi possível carregar: " + m.erro;
        return;
      }
      var lista = (m.dados || []).filter(function (f) { return f && f.nome; }).map(function (f) {
        return {
          matricula: String(f.matricula || ""), nome: String(f.nome || ""),
          admissao: String(f.admissao || ""), cpf: String(f.cpf || ""), cargo: ""
        };
      });
      if (!lista.length) {
        dom.googleStatus.textContent = "A planilha do Google veio vazia.";
        return;
      }
      definirFuncionarios(lista);
      dom.googleStatus.textContent = lista.length + " funcionário(s) carregado(s) do Google — nada foi salvo, só está nesta aba.";
    }

    window.addEventListener("message", aoReceber);
    timer = setInterval(function () {
      if (pop.closed) {
        encerrar();
        if (!recebeu) dom.googleStatus.textContent = "A janela foi fechada antes de carregar a planilha.";
      }
    }, 600);
  }

  // ---------------- Seleção de servidores (planilha) ----------------

  function definirFuncionarios(lista) {
    lista.sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
    state.funcionarios = lista;
    state.marcados = {};
    dom.busca.value = "";
    dom.picker.hidden = false;
    renderPicker();
    dom.busca.focus();
  }

  function chaveFunc(nome, matricula) {
    return normalizar(nome) + "|" + String(matricula || "").trim();
  }

  function chavesNaLista() {
    var mapa = {};
    state.linhas.forEach(function (l) { mapa[chaveFunc(l.nome, l.matricula)] = true; });
    return mapa;
  }

  function renderPicker() {
    var termo = normalizar(dom.busca.value);
    var naLista = chavesNaLista();
    state.visiveis = [];
    dom.pick.innerHTML = "";

    state.funcionarios.forEach(function (f, i) {
      if (termo && normalizar(f.nome + " " + f.matricula).indexOf(termo) === -1) return;
      state.visiveis.push(i);

      var ja = !!naLista[chaveFunc(f.nome, f.matricula)];
      var marcado = !!state.marcados[i];
      var item = el("label", "fer-pick__item" + (ja ? " fer-pick__item--off" : "") + (marcado && !ja ? " fer-pick__item--on" : ""));
      var cb = el("input");
      cb.type = "checkbox";
      cb.checked = marcado && !ja;
      cb.disabled = ja;
      cb.setAttribute("data-i", i);
      item.appendChild(cb);
      item.appendChild(el("span", "fer-pick__nome", f.nome));
      if (ja) item.appendChild(el("span", "fer-pick__tag", "na lista"));
      else if (f.matricula) item.appendChild(el("span", "fer-pick__mat", "Mat. " + f.matricula));
      dom.pick.appendChild(item);
    });

    if (!state.visiveis.length) {
      dom.pick.appendChild(el("div", "fer-vazio", "Ninguém encontrado com essa busca."));
    }
    atualizarPickInfo();
  }

  function atualizarPickInfo() {
    var n = Object.keys(state.marcados).length;
    dom.pickInfo.textContent = state.funcionarios.length + " na planilha · " + state.visiveis.length + " mostrado(s) · " + n + " marcado(s)";
    dom.adicionar.disabled = n === 0;
    dom.adicionar.textContent = n ? "Adicionar à lista (" + n + ")" : "Adicionar à lista";
  }

  function adicionarMarcados() {
    var naLista = chavesNaLista();
    var idxs = Object.keys(state.marcados).map(Number).sort(function (a, b) { return a - b; });
    var qtd = 0;
    idxs.forEach(function (i) {
      var f = state.funcionarios[i];
      if (!f || naLista[chaveFunc(f.nome, f.matricula)]) return;
      state.linhas.push(novaLinha(f));
      qtd++;
    });
    state.marcados = {};
    dom.busca.value = "";
    renderTudo();
    if (qtd) setStatus(qtd + " servidor(es) adicionado(s) à lista.", false);
    dom.busca.focus();
  }

  // ---------------- Lista de requerimentos ----------------

  function novaLinha(base) {
    base = base || {};
    var l = {
      id: state.proxId++,
      nome: base.nome || "",
      matricula: base.matricula || "",
      cpf: base.cpf || "",
      admissao: base.admissao || "",
      cargo: base.cargo || dom.defCargo.value || CARGOS_SUGERIDOS[0],
      dias: state.dias,
      inicio: dom.defInicio.value || "",
      periodo: "",
      periodoAuto: false
    };
    var p = dom.defPeriodo.value;
    if (p === "auto") { l.periodoAuto = true; l.periodo = calcPeriodo(l.admissao); }
    else { l.periodo = p; }
    return l;
  }

  function acharLinha(id) {
    for (var i = 0; i < state.linhas.length; i++) if (state.linhas[i].id === id) return state.linhas[i];
    return null;
  }

  function faltando(l) {
    return CAMPOS_OBRIGATORIOS.filter(function (c) { return !String(l[c] == null ? "" : l[c]).trim(); });
  }

  function marcarErros(row, l) {
    var falta = faltando(l);
    CAMPOS_OBRIGATORIOS.forEach(function (c) {
      var ctrl = row.querySelector("[data-f=\"" + c + "\"]");
      if (ctrl) ctrl.classList.toggle("fer-in--erro", falta.indexOf(c) !== -1);
    });
  }

  // Um campo do cartão: rótulo pequeno em cima + controle embaixo.
  function campo(rotulo, cls, controle) {
    var w = el("label", "fer-f " + cls);
    w.appendChild(el("span", null, rotulo));
    w.appendChild(controle);
    return w;
  }

  function campoTexto(nomeCampo, valor, placeholder) {
    var i = el("input", "fer-in");
    i.type = "text";
    i.value = valor;
    i.setAttribute("data-f", nomeCampo);
    i.autocomplete = "off";
    if (placeholder) i.placeholder = placeholder;
    return i;
  }

  // Cada servidor é um cartão de duas linhas:
  //   1) identificação: nome · matrícula · CPF · admissão
  //   2) férias: cargo · período · dias · início · fim (calculado)
  function criarLinha(l, pos) {
    var row = el("div", "fer-row");
    row.setAttribute("data-id", l.id);

    row.appendChild(el("span", "fer-num", String(pos + 1)));
    row.appendChild(campo("Nome completo", "fer-f--nome", campoTexto("nome", l.nome, "Nome completo")));
    row.appendChild(campo("Matrícula", "fer-f--mat", campoTexto("matricula", l.matricula)));
    row.appendChild(campo("CPF", "fer-f--cpf", campoTexto("cpf", l.cpf)));
    row.appendChild(campo("Admissão", "fer-f--adm", campoTexto("admissao", l.admissao, "dd/mm/aaaa")));

    var selCargo = el("select", "fer-in");
    selCargo.setAttribute("data-f", "cargo");
    preencherSelectCargo(selCargo, l.cargo);
    row.appendChild(campo("Cargo", "fer-f--cargo", selCargo));

    var selPer = el("select", "fer-in");
    selPer.setAttribute("data-f", "periodo");
    preencherSelectPeriodo(selPer, l.periodo);
    row.appendChild(campo("Período", "fer-f--per", selPer));

    var selDias = el("select", "fer-in");
    selDias.setAttribute("data-f", "dias");
    [30, 15].forEach(function (d) {
      var opt = el("option", null, d + " dias"); opt.value = d; selDias.appendChild(opt);
    });
    selDias.value = String(l.dias);
    row.appendChild(campo("Dias", "fer-f--dias", selDias));

    var ini = el("input", "fer-in");
    ini.type = "date";
    ini.value = l.inicio;
    ini.setAttribute("data-f", "inicio");
    row.appendChild(campo("Início do gozo", "fer-f--ini", ini));

    var fim = el("div", "fer-f fer-f--fim");
    fim.appendChild(el("span", null, "Fim do gozo"));
    fim.appendChild(el("strong", "fer-fim", textoFim(l)));
    row.appendChild(fim);

    var rm = el("button", "folga-emp__rm fer-rm", "✕");
    rm.type = "button";
    rm.title = "Remover da lista";
    rm.setAttribute("aria-label", "Remover " + (l.nome || "servidor") + " da lista");
    rm.setAttribute("data-rm", "1");
    row.appendChild(rm);

    if (state.mostrarErros) marcarErros(row, l);
    return row;
  }

  function renderLista() {
    dom.lista.innerHTML = "";
    state.linhas.forEach(function (l, i) { dom.lista.appendChild(criarLinha(l, i)); });
  }

  function atualizarResumo() {
    var n = state.linhas.length;
    var incompletos = state.linhas.filter(function (l) { return faltando(l).length; }).length;

    dom.contador.textContent = String(n);
    dom.vazio.hidden = n > 0;
    dom.lista.hidden = n === 0;
    dom.dica.hidden = n === 0;
    dom.limpar.hidden = n === 0;
    dom.gerarUnico.hidden = n < 2;

    if (!n) dom.resumo.textContent = "";
    else if (incompletos) dom.resumo.textContent = n + " servidor(es) · " + incompletos + " com campo(s) em branco.";
    else dom.resumo.textContent = n + " servidor(es) · tudo preenchido.";

    dom.gerar.disabled = n === 0 || state.gerando;
    dom.gerarUnico.disabled = state.gerando;
    dom.limpar.disabled = state.gerando;
    dom.gerar.textContent = n > 1 ? "Gerar " + n + " requerimentos (.zip)" : "Gerar documento (.docx)";
  }

  function renderTudo() {
    renderLista();
    renderPicker();
    atualizarResumo();
  }

  function aoEditarLista(e) {
    var alvo = e.target;
    var campo = alvo.getAttribute && alvo.getAttribute("data-f");
    if (!campo) return;
    var row = alvo.closest(".fer-row");
    var l = acharLinha(parseInt(row.getAttribute("data-id"), 10));
    if (!l) return;

    var v = alvo.value;
    l[campo] = campo === "dias" ? parseInt(v, 10) : v;

    if (campo === "periodo") l.periodoAuto = false;
    if (campo === "admissao" && l.periodoAuto) {
      l.periodo = calcPeriodo(v);
      preencherSelectPeriodo(row.querySelector("[data-f=\"periodo\"]"), l.periodo);
    }
    row.querySelector(".fer-fim").textContent = textoFim(l);
    if (state.mostrarErros) marcarErros(row, l);
    atualizarResumo();
    if (e.type === "change" && (campo === "nome" || campo === "matricula")) renderPicker();
  }

  function aoClicarLista(e) {
    var rm = e.target.closest && e.target.closest("[data-rm]");
    if (!rm) return;
    var id = parseInt(rm.closest(".fer-row").getAttribute("data-id"), 10);
    state.linhas = state.linhas.filter(function (l) { return l.id !== id; });
    renderTudo();
  }

  function adicionarManual() {
    var l = novaLinha();
    state.linhas.push(l);
    renderTudo();
    var row = dom.lista.querySelector(".fer-row[data-id=\"" + l.id + "\"]");
    if (row) {
      var nome = row.querySelector("[data-f=\"nome\"]");
      row.scrollIntoView({ block: "center", behavior: "smooth" });
      if (nome) nome.focus({ preventScroll: true });
    }
  }

  function limparLista() {
    if (!state.linhas.length) return;
    if (!window.confirm("Remover todos os " + state.linhas.length + " servidor(es) da lista?")) return;
    state.linhas = [];
    state.mostrarErros = false;
    renderTudo();
    setStatus("", false);
  }

  // ---------------- Padrões do lote ----------------

  function setDias(n) {
    state.dias = n;
    dom.btn15.classList.toggle("folga-toggle__btn--active", n === 15);
    dom.btn30.classList.toggle("folga-toggle__btn--active", n === 30);
  }

  function aplicarATodos() {
    if (!state.linhas.length) {
      setStatus("A lista está vazia — adicione servidores primeiro.", true);
      return;
    }
    var p = dom.defPeriodo.value;
    state.linhas.forEach(function (l) {
      l.cargo = dom.defCargo.value;
      l.dias = state.dias;
      if (dom.defInicio.value) l.inicio = dom.defInicio.value;
      if (p === "auto") { l.periodoAuto = true; l.periodo = calcPeriodo(l.admissao); }
      else if (p !== "") { l.periodoAuto = false; l.periodo = p; }
    });
    renderTudo();
    setStatus("Padrões aplicados a " + state.linhas.length + " servidor(es).", false);
  }

  // ---------------- Geração dos documentos ----------------

  function dataDoRequerimento() {
    return parseISO(dom.dataReq.value) || new Date();
  }

  function subsDaLinha(l, dataReqExtenso) {
    var fim = calcFim(l.inicio, l.dias);
    var ini = parseISO(l.inicio);
    var d = {
      NOME: l.nome.trim(),
      MATRICULA: l.matricula.trim(),
      CPF: l.cpf.trim(),
      CARGO: l.cargo.trim(),
      DATAADMISSAO: l.admissao.trim(),
      PERIODO: l.periodo.trim(),
      DIAS: l.dias + " dias",
      DATAINICIO: fmtBR(ini),
      DATAFIM: fmtBR(fim),
      DATACRIACAO: dataReqExtenso
    };
    var subs = {};
    TAGS.forEach(function (t) { subs["{{" + t + "}}"] = d[t]; });
    return subs;
  }

  function carregarModelo() {
    if (state.modelo) return Promise.resolve(state.modelo);
    return fetch(MODELO_URL)
      .then(function (resp) {
        if (!resp.ok) throw new Error("Modelo não encontrado (" + MODELO_URL + ")");
        return resp.arrayBuffer();
      })
      .then(function (bytes) {
        return DocxUtils.lerArquivosXml(bytes).then(function (xmls) {
          state.modelo = { bytes: bytes, xmls: xmls };
          return state.modelo;
        });
      });
  }

  function preencherXmls(modelo, subs) {
    var out = {};
    Object.keys(modelo.xmls).forEach(function (caminho) {
      out[caminho] = DocxUtils.substituirTags(modelo.xmls[caminho], subs);
    });
    return out;
  }

  function baixar(blob, nomeArquivo) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function nomeUnico(base, usados, ext) {
    var nome = base + ext, n = 2;
    while (usados[nome]) { nome = base + "_" + n + ext; n++; }
    usados[nome] = true;
    return nome;
  }

  function validar() {
    state.mostrarErros = true;
    var ruins = [];
    state.linhas.forEach(function (l, i) {
      var falta = faltando(l);
      if (falta.length) ruins.push({ pos: i, l: l, falta: falta });
    });
    renderLista();
    atualizarResumo();
    if (!ruins.length) return true;

    var primeiro = ruins[0];
    var qual = (primeiro.l.nome.trim() || "linha " + (primeiro.pos + 1));
    setStatus(
      ruins.length + " servidor(es) com campo(s) em branco (marcados em vermelho). Primeiro: " + qual +
      " — falta " + primeiro.falta.map(function (c) { return ROTULO_CAMPO[c]; }).join(", ") + ".",
      true
    );
    var row = dom.lista.querySelector(".fer-row[data-id=\"" + primeiro.l.id + "\"]");
    if (row) row.scrollIntoView({ block: "center", behavior: "smooth" });
    return false;
  }

  // modo: "zip" (padrão para vários) ou "unico" (um .docx, 1 por página)
  function gerar(modo) {
    if (state.gerando || !state.linhas.length) return;
    if (!validar()) return;
    if (typeof window.JSZip === "undefined" || typeof window.DocxUtils === "undefined") {
      setStatus("Não foi possível carregar os componentes de geração de documento (verifique se o arquivo jszip.local.js está publicado junto com o site).", true);
      return;
    }

    var linhas = state.linhas.slice();
    var dataReqExt = dataExtenso(dataDoRequerimento());
    var hoje = isoDe(new Date());

    state.gerando = true;
    atualizarResumo();
    setStatus("Gerando documento" + (linhas.length > 1 ? "s" : "") + "...", false);

    carregarModelo()
      .then(function (modelo) {
        var subs = linhas.map(function (l) { return subsDaLinha(l, dataReqExt); });

        // 1 servidor → .docx direto
        if (linhas.length === 1) {
          return DocxUtils.gerarDocxBlob(modelo.bytes, preencherXmls(modelo, subs[0])).then(function (blob) {
            var nome = "requerimento_ferias_" + slug(linhas[0].nome) + ".docx";
            baixar(blob, nome);
            return "Documento gerado: " + nome;
          });
        }

        // vários, tudo num .docx (um requerimento por página)
        if (modo === "unico") {
          var xmls = subs.map(function (s) { return preencherXmls(modelo, s); });
          var arquivos = xmls[0];
          arquivos["word/document.xml"] = DocxUtils.mesclarDocumentos(
            xmls.map(function (x) { return x["word/document.xml"]; })
          );
          return DocxUtils.gerarDocxBlob(modelo.bytes, arquivos).then(function (blob) {
            var nome = "requerimentos_ferias_" + hoje + ".docx";
            baixar(blob, nome);
            return linhas.length + " requerimentos em um só arquivo: " + nome;
          });
        }

        // vários, um .docx por servidor dentro de um .zip
        var zip = new JSZip();
        var usados = {};
        var seq = Promise.resolve();
        linhas.forEach(function (l, i) {
          seq = seq.then(function () {
            setStatus("Gerando " + (i + 1) + " de " + linhas.length + "...", false);
            return DocxUtils.gerarDocxBlob(modelo.bytes, preencherXmls(modelo, subs[i]), "uint8array").then(function (bytes) {
              zip.file(nomeUnico("requerimento_ferias_" + slug(l.nome), usados, ".docx"), bytes);
            });
          });
        });
        return seq.then(function () {
          return zip.generateAsync({ type: "blob", compression: "STORE" });
        }).then(function (blob) {
          var nome = "requerimentos_ferias_" + hoje + ".zip";
          baixar(blob, nome);
          return linhas.length + " requerimentos gerados: " + nome;
        });
      })
      .then(function (msg) {
        setStatus(msg, false);
      })
      .catch(function (err) {
        console.error(err);
        setStatus("Erro ao gerar documento: " + err.message, true);
      })
      .then(function () {
        state.gerando = false;
        atualizarResumo();
      });
  }

  // ---------------- Início ----------------

  function iniciar() {
    cacheDom();
    if (!dom.csvZone) return;

    preencherSelectCargo(dom.defCargo, CARGOS_SUGERIDOS[0]);
    preencherSelectPeriodo(dom.defPeriodo, "auto", [
      { v: "auto", t: "Automático (pela admissão)" },
      { v: "", t: "Escolher servidor por servidor" }
    ]);
    setDias(30);
    dom.dataReq.value = isoDe(new Date());
    setStatus("", false);

    if (urlGoogle()) {
      dom.googleBtn.hidden = false;
      dom.ou.hidden = false;
      dom.googleBtn.addEventListener("click", carregarDoGoogle);
    }

    // planilha
    dom.csvZone.addEventListener("click", function () { dom.csvInput.click(); });
    dom.csvInput.addEventListener("change", function () {
      if (dom.csvInput.files[0]) carregarCsv(dom.csvInput.files[0]);
      dom.csvInput.value = "";
    });
    dom.csvZone.addEventListener("dragover", function (e) { e.preventDefault(); dom.csvZone.classList.add("folga-upload--over"); });
    dom.csvZone.addEventListener("dragleave", function () { dom.csvZone.classList.remove("folga-upload--over"); });
    dom.csvZone.addEventListener("drop", function (e) {
      e.preventDefault();
      dom.csvZone.classList.remove("folga-upload--over");
      if (e.dataTransfer.files[0]) carregarCsv(e.dataTransfer.files[0]);
    });

    // seleção
    dom.busca.addEventListener("input", renderPicker);
    dom.busca.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (Object.keys(state.marcados).length) { adicionarMarcados(); return; }
      var naLista = chavesNaLista();
      var livres = state.visiveis.filter(function (i) {
        var f = state.funcionarios[i];
        return !naLista[chaveFunc(f.nome, f.matricula)];
      });
      if (livres.length === 1) {
        state.marcados[livres[0]] = true;
        adicionarMarcados();
      }
    });
    dom.pick.addEventListener("change", function (e) {
      var i = e.target.getAttribute && e.target.getAttribute("data-i");
      if (i == null) return;
      if (e.target.checked) state.marcados[i] = true; else delete state.marcados[i];
      e.target.closest(".fer-pick__item").classList.toggle("fer-pick__item--on", e.target.checked);
      atualizarPickInfo();
    });
    dom.marcarTodos.addEventListener("click", function () {
      var naLista = chavesNaLista();
      state.visiveis.forEach(function (i) {
        var f = state.funcionarios[i];
        if (!naLista[chaveFunc(f.nome, f.matricula)]) state.marcados[i] = true;
      });
      renderPicker();
    });
    dom.desmarcar.addEventListener("click", function () { state.marcados = {}; renderPicker(); });
    dom.adicionar.addEventListener("click", adicionarMarcados);
    dom.manual.addEventListener("click", adicionarManual);

    // padrões
    dom.btn15.addEventListener("click", function () { setDias(15); });
    dom.btn30.addEventListener("click", function () { setDias(30); });
    dom.aplicar.addEventListener("click", aplicarATodos);

    // lista
    dom.lista.addEventListener("input", aoEditarLista);
    dom.lista.addEventListener("change", aoEditarLista);
    dom.lista.addEventListener("click", aoClicarLista);
    dom.limpar.addEventListener("click", limparLista);

    // gerar
    dom.gerar.addEventListener("click", function () { gerar("zip"); });
    dom.gerarUnico.addEventListener("click", function () { gerar("unico"); });

    // não perder um lote grande por um clique sem querer
    window.addEventListener("beforeunload", function (e) {
      if (state.linhas.length) { e.preventDefault(); e.returnValue = ""; }
    });

    atualizarResumo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
