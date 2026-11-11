// ============================================================
// Comunicação Interna — tela dividida (preencher à esquerda, modelo ao vivo à direita).
// Os textos prontos ficam em ci-assuntos.js. A lista de agentes, as matrículas e os
// coordenadores são os mesmos da Folga (dados-agentes.js + o que está salvo no navegador).
// Modelo do documento: assets/modelo-ci.docx (tags <<ci>>, <<hoje>>, <<sigla>>, <<setor>>,
// <<remetente>>, <<para>>, <<assunto>>, <<corpo>>, <<cargoRem>>, <<gerente>>, <<gerenteCargo>>).
// O que a pessoa monta NÃO fica salvo: F5 volta ao começo (só a lista de agentes é guardada).
// ============================================================
(function () {
  "use strict";

  var STORAGE_KEY = "painelEndemiasFuncionarios";
  var MAT_KEY = "painelEndemiasMatriculas";
  var REM_KEY = "painelEndemiasFolgaRemetentes";
  var HIST_KEY = "painelEndemiasFolgaHistorico";   // o mesmo histórico de CIs da Folga (mesma numeração)
  var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  var NOMES_MES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  var DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var PAPEL_W = 794, PAPEL_H = 1123;

  var D = window.DADOS_AGENTES;
  var ASSUNTOS = window.CI_ASSUNTOS || [];

  var state = {
    assuntoId: ASSUNTOS.length ? ASSUNTOS[0].id : "",
    funcionarios: {}, matriculas: {}, remetentes: [], remetente: 0,
    marcados: {}, filtroTexto: "",
    calSel: [], calMes: null, calUltimo: null,
    incMat: true
  };
  var dom = {};

  // ---------------- utilidades ----------------
  function el(tag, className, texto) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }
  function semAcento(t) {
    return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  }
  function escXml(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function setStatus(msg, erro) {
    dom.status.textContent = msg;
    dom.status.classList.toggle("folga-status--erro", !!erro);
  }
  function dataExtenso(d) { return d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear(); }
  function isoDe(a, m, d) { return a + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"); }
  function parseISO(v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtBR(d) { return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear(); }
  function juntar(l) { return l.length <= 1 ? (l[0] || "") : l.slice(0, -1).join(", ") + " e " + l[l.length - 1]; }
  function assuntoAtual() { return ASSUNTOS.filter(function (a) { return a.id === state.assuntoId; })[0] || ASSUNTOS[0]; }
  function usa(campo) { return assuntoAtual().campos.indexOf(campo) !== -1; }

  // ---------------- dados (mesmos da Folga) ----------------
  function carregarFuncionarios() {
    try {
      var p = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (p && typeof p === "object" && !Array.isArray(p) && Object.keys(p).length) return p;
    } catch (e) { /* usa o padrão */ }
    var o = {}; D.funcionarios.forEach(function (par) { o[par[0]] = par[1]; }); return o;
  }
  function carregarMatriculas() {
    var salvas = {};
    try { var m = JSON.parse(localStorage.getItem(MAT_KEY) || "{}"); if (m && typeof m === "object" && !Array.isArray(m)) salvas = m; } catch (e) { /* ignora */ }
    var res = {};
    Object.keys(state.funcionarios).forEach(function (n) { var p = D.matriculas[semAcento(n)]; if (p) res[n] = p; });
    Object.keys(salvas).forEach(function (n) { if (String(salvas[n]).trim()) res[n] = salvas[n]; });
    return res;
  }
  function carregarRemetentes() {
    try {
      var l = JSON.parse(localStorage.getItem(REM_KEY) || "null");
      if (Array.isArray(l) && l.length && l.every(function (r) { return r && r.setor && r.nome; })) {
        D.remetentes.forEach(function (p) {
          if (!l.some(function (r) { return semAcento(r.nome) === semAcento(p.nome); })) l.push({ setor: p.setor, nome: p.nome });
        });
        return l;
      }
    } catch (e) { /* usa o padrão */ }
    return D.remetentes.map(function (r) { return { setor: r.setor, nome: r.nome }; });
  }
  // cargo que aparece embaixo da assinatura de quem envia: "Coord. " + setor (ex.: Coord. Endemias e Zoonoses)
  function cargoRemetente(r) {
    var t = String(r.setor || "").replace(/^SETOR DE\s+/i, "").toLowerCase().replace(/(^|\s)(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }).replace(/\s(De|Da|Do|Das|Dos|E)(?=\s)/g, function (m) { return m.toLowerCase(); });
    return "Coord. " + t;
  }
  function remetenteAtual() { return state.remetentes[state.remetente] || state.remetentes[0]; }
  function nomeTexto(n) { return state.incMat && state.matriculas[n] ? n + " (" + state.matriculas[n] + ")" : n; }

  // "Secretaria Municipal de Saúde - Carla Santiago" → { org: "SECRETARIA MUNICIPAL DE SAÚDE", pessoa: "Carla Santiago" }
  function paraFormatado() {
    var v = (dom.para.value || "").trim();
    var m = v.split(/\s+[-–—]\s+/);
    if (m.length >= 2) return m[0].toUpperCase() + " – " + m.slice(1).join(" – ");
    return v.toUpperCase();
  }

  // ---------------- contexto do texto ----------------
  function contexto() {
    var nomes = Object.keys(state.marcados).sort().map(nomeTexto);
    var datas = state.calSel.slice().sort().map(function (i) { return fmtBR(parseISO(i)); });
    return {
      nomes: nomes, datas: datas, n: nomes.length, d: datas.length, juntar: juntar,
      texto: dom.texto ? dom.texto.value : "", motivo: dom.motivo ? dom.motivo.value.trim() : "", assuntoLivre: dom.assuntoLivre ? dom.assuntoLivre.value.trim() : ""
    };
  }
  function assuntoTexto() {
    var a = assuntoAtual();
    return a.campos.indexOf("assuntoLivre") !== -1 ? (contexto().assuntoLivre.toUpperCase() || "{ASSUNTO}") : a.assunto;
  }
  function paragrafos() { return assuntoAtual().paragrafos(contexto()); }
  function faltaPreencher() {
    var c = contexto(), f = [];
    if (!(dom.numero.value || "").trim()) f.push("o número da CI");
    if (usa("agentes") && !c.n) f.push("os agentes");
    if (usa("datas") && !c.d) f.push("as datas");
    if (usa("assuntoLivre") && !c.assuntoLivre) f.push("o assunto");
    if (usa("texto") && !c.texto.trim()) f.push("o texto");
    if (!(dom.para.value || "").trim()) f.push("o campo “Para”");
    return f;
  }

  // ---------------- assuntos (botões) ----------------
  function renderAssuntos() {
    dom.assuntos.innerHTML = "";
    ASSUNTOS.forEach(function (a) {
      var b = el("button", "fg-modo__b" + (a.id === state.assuntoId ? " fg-modo__b--ativo" : ""), a.botao);
      b.type = "button";
      b.addEventListener("click", function () { state.assuntoId = a.id; renderAssuntos(); aplicarCampos(); renderPreview(); });
      dom.assuntos.appendChild(b);
    });
  }
  function aplicarCampos() {
    Array.prototype.forEach.call(document.querySelectorAll(".ci-campos"), function (s) { s.hidden = !usa(s.getAttribute("data-campo")); });
  }

  // ---------------- lista de agentes ----------------
  function nomesFiltrados() {
    var t = semAcento(state.filtroTexto);
    return Object.keys(state.funcionarios).sort().filter(function (n) { return !t || semAcento(n).indexOf(t) !== -1; });
  }
  function renderLista() {
    dom.lista.innerHTML = "";
    var f = nomesFiltrados();
    f.forEach(function (nome) {
      var linha = el("div", "folga-emp");
      var check = document.createElement("input");
      check.type = "checkbox"; check.className = "folga-emp__check"; check.checked = !!state.marcados[nome];
      check.addEventListener("change", function () {
        if (check.checked) state.marcados[nome] = true; else delete state.marcados[nome];
        atualizarSelecao();
      });
      linha.addEventListener("click", function (e) { if (e.target === check) return; check.checked = !check.checked; check.dispatchEvent(new Event("change")); });
      linha.appendChild(check);
      linha.appendChild(el("span", "folga-emp__nome", nome));
      dom.lista.appendChild(linha);
    });
    dom.contador.textContent = "Exibindo " + f.length + " de " + Object.keys(state.funcionarios).length + " agente(s)";
  }
  function atualizarSelecao() {
    var nomes = Object.keys(state.marcados).sort();
    dom.resumo.innerHTML = "";
    if (!nomes.length) dom.resumo.appendChild(el("span", "fg-marcados__vazio", "Ninguém marcado ainda — clique nos nomes da lista."));
    else {
      dom.resumo.appendChild(el("span", "fg-marcados__t", nomes.length + " marcado(s):"));
      nomes.forEach(function (nome) {
        var chip = el("span", "folga-chip"); chip.appendChild(document.createTextNode(nome + " "));
        var x = el("button", "folga-chip__x", "✕"); x.type = "button"; x.title = "Desmarcar";
        x.addEventListener("click", function () { delete state.marcados[nome]; renderLista(); atualizarSelecao(); });
        chip.appendChild(x); dom.resumo.appendChild(chip);
      });
    }
    renderLista(); renderPreview();
  }

  // ---------------- calendário ----------------
  function renderCalendario() {
    var box = document.getElementById("fgCal"); if (!box) return;
    if (!state.calMes) { var h = new Date(); state.calMes = { a: h.getFullYear(), m: h.getMonth() }; }
    var a = state.calMes.a, m = state.calMes.m;
    box.innerHTML = "";
    var topo = el("div", "fg-cal__topo");
    var ant = el("button", "fg-cal__nav", "‹"); ant.type = "button"; ant.title = "Mês anterior";
    var prox = el("button", "fg-cal__nav", "›"); prox.type = "button"; prox.title = "Próximo mês";
    ant.addEventListener("click", function () { state.calMes = m === 0 ? { a: a - 1, m: 11 } : { a: a, m: m - 1 }; renderCalendario(); });
    prox.addEventListener("click", function () { state.calMes = m === 11 ? { a: a + 1, m: 0 } : { a: a, m: m + 1 }; renderCalendario(); });
    topo.appendChild(ant); topo.appendChild(el("strong", null, NOMES_MES[m] + " " + a)); topo.appendChild(prox);
    box.appendChild(topo);
    var grade = el("div", "fg-cal__grade");
    ["D", "S", "T", "Q", "Q", "S", "S"].forEach(function (d, i) { grade.appendChild(el("span", "fg-cal__sem" + (i === 0 || i === 6 ? " fg-cal__fds" : ""), d)); });
    var primeiro = new Date(a, m, 1).getDay(), dias = new Date(a, m + 1, 0).getDate();
    var hoje = new Date(), isoHoje = isoDe(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    for (var v = 0; v < primeiro; v++) grade.appendChild(el("span", "fg-cal__vazio"));
    for (var d = 1; d <= dias; d++) {
      (function (d) {
        var iso = isoDe(a, m, d), dow = new Date(a, m, d).getDay(), sel = state.calSel.indexOf(iso) !== -1;
        var b = el("button", "fg-cal__dia" + (dow === 0 || dow === 6 ? " fg-cal__fds" : "") + (iso === isoHoje ? " fg-cal__hoje" : "") + (sel ? " fg-cal__sel" : ""), String(d));
        b.type = "button"; b.setAttribute("aria-pressed", sel ? "true" : "false");
        b.addEventListener("click", function (e) { clicarDia(iso, e.shiftKey); });
        grade.appendChild(b);
      })(d);
    }
    box.appendChild(grade);
    var rod = el("div", "fg-cal__rodape");
    if (!state.calSel.length) rod.appendChild(el("span", "fg-cal__dica", "Nenhum dia escolhido. Dica: Shift + clique seleciona um intervalo."));
    else {
      state.calSel.slice().sort().forEach(function (iso) {
        var dd = parseISO(iso), chip = el("span", "folga-chip");
        chip.appendChild(el("span", "folga-chip__dia", DIAS_SEMANA[dd.getDay()]));
        chip.appendChild(document.createTextNode(fmtBR(dd) + " "));
        var x = el("button", "folga-chip__x", "✕"); x.type = "button"; x.title = "Tirar este dia";
        x.addEventListener("click", function () { state.calSel = state.calSel.filter(function (q) { return q !== iso; }); renderCalendario(); renderPreview(); });
        chip.appendChild(x); rod.appendChild(chip);
      });
      var lim = el("button", "folga-link-btn", "limpar dias"); lim.type = "button";
      lim.addEventListener("click", function () { state.calSel = []; state.calUltimo = null; renderCalendario(); renderPreview(); });
      rod.appendChild(lim);
    }
    box.appendChild(rod);
  }
  function clicarDia(iso, shift) {
    var i = state.calSel.indexOf(iso);
    if (shift && state.calUltimo && state.calUltimo !== iso) {
      var a = parseISO(state.calUltimo), b = parseISO(iso);
      if (a > b) { var t = a; a = b; b = t; }
      for (var d = new Date(a); d <= b; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        var k = isoDe(d.getFullYear(), d.getMonth(), d.getDate());
        if (state.calSel.indexOf(k) === -1) state.calSel.push(k);
      }
    } else if (i === -1) state.calSel.push(iso); else state.calSel.splice(i, 1);
    state.calUltimo = iso;
    renderCalendario(); renderPreview();
  }

  // ---------------- remetentes ----------------
  function renderRemetentes() {
    dom.remetente.innerHTML = "";
    state.remetentes.forEach(function (r, i) {
      var o = document.createElement("option"); o.value = String(i); o.textContent = r.setor + " – " + r.nome; dom.remetente.appendChild(o);
    });
    dom.remetente.value = String(state.remetente);
  }

  // ---------------- modelo ao vivo ----------------
  function px(tw) { return (tw / 15).toFixed(2) + "px"; }
  function tdP(tr, texto, cls) { var td = el("td", cls || null); if (texto !== undefined && texto !== null) td.textContent = texto; tr.appendChild(td); return td; }

  function renderPreview() {
    var P = dom.preview; if (!P) return;
    P.innerHTML = ""; P.className = "fg-papel";
    P.style.setProperty("--sz", "13.3px"); P.style.setProperty("--szh", "12px"); P.style.setProperty("--mgl", "4px");
    P.style.setProperty("--assin", "73px"); P.style.setProperty("--top-pad", px(2268 - 454 + 30));
    var cab = el("div", "fgp-cab"), img = document.createElement("img");
    img.src = "assets/cabecalho-prefeitura.png"; img.alt = "Prefeitura Municipal de Ponta Porã"; img.style.height = "86.9px";
    cab.appendChild(img); P.appendChild(cab);
    var corpo = el("div", "fgp-corpo"); P.appendChild(corpo);
    var sp = function (tw) { var d = el("div", "fgp-esp"); d.style.height = px(tw); return d; };

    corpo.appendChild(el("div", "fgp-titulo", "COMUNICAÇÃO INTERNA"));
    corpo.appendChild(sp(120));
    var ci = (dom.numero.value || "").trim(), rem = remetenteAtual();
    var t1 = el("table", "fgp-tab fgp-info"), cg = "";
    [1250, 3569, 1250, 3569].forEach(function (w) { cg += '<col style="width:' + px(w) + '">'; });
    t1.innerHTML = "<colgroup>" + cg + "</colgroup>";
    var r = el("tr"); tdP(r, "Número:", "fgp-lab"); var cn = tdP(r, ""); cn.appendChild(el("b", null, (ci || "___") + "/2026")); tdP(r, "Data:", "fgp-lab"); tdP(r, dataExtenso(new Date())); t1.appendChild(r);
    r = el("tr"); tdP(r, "Sigla:", "fgp-lab"); var c = tdP(r, dom.sigla.value); c.colSpan = 3; t1.appendChild(r);
    r = el("tr"); tdP(r, "De:", "fgp-lab"); c = tdP(r, ""); c.colSpan = 3; c.appendChild(el("b", null, rem.setor + " – " + rem.nome)); t1.appendChild(r);
    r = el("tr"); tdP(r, "Para:", "fgp-lab"); c = tdP(r, ""); c.colSpan = 3; c.appendChild(el("b", null, paraFormatado())); t1.appendChild(r);
    corpo.appendChild(t1);
    corpo.appendChild(sp(240));
    var as = el("div", "fgp-assunto"); as.appendChild(document.createTextNode("ASSUNTO: "));
    var asT = assuntoTexto(); as.appendChild(el("span", /^\{.*\}$/.test(asT) ? "fgp-falta" : null, asT)); corpo.appendChild(as);
    corpo.appendChild(sp(240));
    var tx = el("div", "fgp-corpotxt");
    paragrafos().forEach(function (par) {
      var p = el("p", par.lista ? "fgp-lista" : null);
      par.forEach(function (s) {
        var falta = /^\{[^}]*\}$/.test(s.t);
        var e = el(s.b || falta ? "b" : "span", falta ? "fgp-falta" : null, s.t);
        p.appendChild(e);
      });
      tx.appendChild(p);
    });
    corpo.appendChild(tx);

    var t3 = el("table", "fgp-tab fgp-assin fgp-assin-ci"); cg = "";
    [4819, 4819].forEach(function (w) { cg += '<col style="width:' + px(w) + '">'; });
    t3.innerHTML = "<colgroup>" + cg + "</colgroup>";
    r = el("tr", "fgp-linha-assin");
    var a1 = el("td"); a1.appendChild(el("div", "fgp-nome-assin", rem.nome)); a1.appendChild(el("div", "fgp-sub-assin", cargoRemetente(rem))); r.appendChild(a1);
    var a2 = el("td"); a2.appendChild(el("div", "fgp-nome-assin", dom.gerente.value)); a2.appendChild(el("div", "fgp-sub-assin", dom.gerenteCargo.value)); r.appendChild(a2);
    t3.appendChild(r);
    P.appendChild(t3);
    var rod = el("div", "fgp-rodape"); rod.appendChild(el("b", null, "SETOR DE ENDEMIAS E VETORES - UVZ (UNIDADE DE VIGILÂNCIA E ZOONOSES)")); rod.appendChild(document.createElement("br"));
    rod.appendChild(document.createTextNode("Rua: São Vicente de Paula, 129, Vila São Vicente de Paula - CEP 79900-001")); P.appendChild(rod);

    // cabe em 1 folha? (o texto não pode encostar nas assinaturas, que ficam no pé da página)
    var limite = PAPEL_H - 75.6 - 73 - 20;
    var estoura = (corpo.offsetTop + corpo.offsetHeight) > limite;
    if (estoura) P.classList.add("fg-papel--estoura");
    var selo = document.getElementById("fgSelo"), falta = faltaPreencher();
    if (estoura) { selo.textContent = "⚠ texto longo: vai passar de 1 página"; selo.className = "fg-selo fg-selo--aviso"; }
    else if (falta.length) { selo.textContent = "falta: " + falta.join(", "); selo.className = "fg-selo"; }
    else { selo.textContent = "✓ pronto, cabe em 1 folha"; selo.className = "fg-selo fg-selo--ok"; }
    ajustarEscala();
  }

  var zTela = 1;
  function ajustarTela() {
    var pg = document.querySelector(".page--split"); if (!pg) return;
    zTela = window.innerWidth > 1020 ? Math.max(0.6, Math.min(1.15, window.innerHeight / 1000, window.innerWidth / 1650)) : 1;
    pg.style.setProperty("--z", zTela.toFixed(3));
    ajustarEscala();
  }
  function ajustarEscala() {
    var caixa = document.getElementById("fgCaixa"); if (!caixa || !dom.preview) return;
    var larg = caixa.parentNode.clientWidth - 30; if (larg <= 0) return;
    var h = Math.max(PAPEL_H, dom.preview.offsetHeight), k = Math.min(1, larg / PAPEL_W);
    if (window.innerWidth > 1020) { var livre = (window.innerHeight - 90) / zTela - 255; k = Math.min(k, Math.max(0.3, livre / h)); }
    caixa.style.width = Math.round(PAPEL_W * k) + "px"; caixa.style.margin = "0 auto";
    dom.preview.style.transform = "scale(" + k + ")"; caixa.style.height = Math.round(h * k) + "px";
  }
  var lupaReal = true;
  function abrirLupa() {
    var lupa = document.getElementById("fgLupa"), area = document.getElementById("fgLupaArea");
    area.innerHTML = "";
    var copia = dom.preview.cloneNode(true); copia.removeAttribute("id");
    var h = Math.max(PAPEL_H, dom.preview.offsetHeight);
    var k = lupaReal ? 1 : Math.min((window.innerWidth - 40) / PAPEL_W, (window.innerHeight - 90) / h);
    copia.style.transform = "scale(" + k + ")"; copia.style.position = "absolute"; copia.style.left = "0"; copia.style.top = "0";
    var m = el("div", "fg-lupa__papel"); m.style.width = Math.round(PAPEL_W * k) + "px"; m.style.height = Math.round(h * k) + "px";
    m.appendChild(copia); area.appendChild(m);
    document.getElementById("fgLupaTam").textContent = lupaReal ? "↔ Ajustar à tela" : "▣ Tamanho real (A4)";
    lupa.hidden = false;
  }
  function fecharLupa() { document.getElementById("fgLupa").hidden = true; }

  // ---------------- histórico de CIs (compartilhado com a Folga) ----------------
  function carregarHist() { try { var h = JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); return Array.isArray(h) ? h : []; } catch (e) { return []; } }
  function numCi(ci) { var m = String(ci || "").match(/\d+/); return m ? parseInt(m[0], 10) : NaN; }
  function proximaCi() {
    var max = NaN, larg = 3;
    carregarHist().forEach(function (e) { var n = numCi(e.ci); if (!isNaN(n) && (isNaN(max) || n > max)) { max = n; larg = Math.max(3, (String(e.ci).match(/\d+/) || [""])[0].length); } });
    if (isNaN(max)) return null;
    var p = String(max + 1), u = String(max); while (p.length < larg) p = "0" + p; while (u.length < larg) u = "0" + u;
    return { ultima: u, proxima: p };
  }
  function atualizarDicaCi() {
    var d = document.getElementById("fgCiDica"), n = proximaCi(); if (!d) return;
    d.textContent = ""; if (!n) { d.hidden = true; return; }
    d.hidden = false; d.appendChild(document.createTextNode("Última registrada: " + n.ultima + " · "));
    var b = el("button", "folga-link-btn", "usar " + n.proxima); b.type = "button";
    b.addEventListener("click", function () { dom.numero.value = n.proxima; renderPreview(); });
    d.appendChild(b);
  }
  function confirmarCiRepetida(ci) {
    var chave = String(numCi(ci)), tipo = "CI – " + (assuntoAtual().assunto || "Texto livre"), c = contexto();
    var sig = Object.keys(state.marcados).sort().map(function (n) { return n + "|" + c.datas.join(","); }).join(";");
    var outro = carregarHist().filter(function (e) { return e.chave === chave && (e.tipo !== tipo || e.sig !== sig); })[0];
    if (!outro) return true;
    return window.confirm("A CI " + ci + "/2026 já foi registrada em " + new Date(outro.quando).toLocaleDateString("pt-BR") + " (" + outro.tipo + ").\n\nGerar mesmo assim? (vai ficar como outro registro com o mesmo número)");
  }
  function registrarHist(ci, acao) {
    acao = acao || "docx";
    var h = carregarHist(), c = contexto(), tipo = "CI – " + (assuntoAtual().assunto || assuntoTexto());
    var ag = Object.keys(state.marcados).sort().map(function (n) { return { nome: n, datas: c.datas.slice() }; });
    var sig = ag.map(function (a) { return a.nome + "|" + a.datas.join(","); }).join(";"), chave = String(numCi(ci)), rem = remetenteAtual();
    var e = h.filter(function (x) { return x.chave === chave && x.tipo === tipo && x.sig === sig; })[0];
    if (e) { e.quando = new Date().toISOString(); if (e.acoes.indexOf(acao) === -1) e.acoes.push(acao); }
    else h.push({ id: Date.now(), ci: ci, chave: chave, quando: new Date().toISOString(), tipo: tipo, remetente: rem.setor + " – " + rem.nome, agentes: ag, sig: sig, acoes: [acao] });
    try { localStorage.setItem(HIST_KEY, JSON.stringify(h)); } catch (e2) { /* ignora */ }
    atualizarDicaCi();
  }

  // ---------------- microfone: ditado por voz (Web Speech API, nativa do Chrome/Edge) ----------------
  var reconhecimento = null, ditando = false;
  function configurarMicrofone() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      dom.mic.disabled = true;
      dom.mic.title = "Este navegador não suporta ditado por voz (use o Chrome ou o Edge).";
      return;
    }
    reconhecimento = new SR();
    reconhecimento.lang = "pt-BR"; reconhecimento.continuous = true; reconhecimento.interimResults = false;
    reconhecimento.onresult = function (ev) {
      var novo = "";
      for (var i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) novo += ev.results[i][0].transcript;
      if (novo) {
        var atual = dom.texto.value.replace(/\s+$/, "");
        dom.texto.value = (atual ? atual + " " : "") + novo.trim();
        renderPreview();
      }
    };
    reconhecimento.onerror = function (ev) {
      dom.iaStatus.textContent = ev.error === "not-allowed" ? "O navegador bloqueou o microfone. Libere a permissão no cadeado da barra de endereço." : "Erro no ditado: " + ev.error;
      pararDitado(true);
    };
    reconhecimento.onend = function () {
      if (ditando) { try { reconhecimento.start(); } catch (e) { pararDitado(); } }   // o navegador encerra sozinho de tempos em tempos
    };
    // negrito: **trecho** (aparece em negrito no modelo e no .docx)
    function alternarNegrito() {
      var t = dom.texto, a = t.selectionStart, b = t.selectionEnd, v = t.value;
      if (a === b) {                                   // sem seleção: abre ** ** e deixa o cursor no meio
        t.value = v.slice(0, a) + "****" + v.slice(b); t.selectionStart = t.selectionEnd = a + 2;
      } else if (v.slice(a - 2, a) === "**" && v.slice(b, b + 2) === "**") {   // já está em negrito: tira
        t.value = v.slice(0, a - 2) + v.slice(a, b) + v.slice(b + 2); t.selectionStart = a - 2; t.selectionEnd = b - 2;
      } else {
        t.value = v.slice(0, a) + "**" + v.slice(a, b) + "**" + v.slice(b); t.selectionStart = a + 2; t.selectionEnd = b + 2;
      }
      t.focus(); renderPreview();
    }
    dom.negrito.addEventListener("click", alternarNegrito);
    dom.texto.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) { e.preventDefault(); alternarNegrito(); } });
    dom.mic.addEventListener("click", function () { if (ditando) pararDitado(); else iniciarDitado(); });
  }
  function iniciarDitado() {
    try {
      reconhecimento.start(); ditando = true;
      dom.mic.classList.add("ci-micro--ativo");
      dom.iaStatus.textContent = "🔴 Ouvindo… fale o texto. Clique no microfone de novo para parar.";
    } catch (e) { dom.iaStatus.textContent = "Não foi possível iniciar o microfone."; }
  }
  function pararDitado(manterMsg) {
    ditando = false; dom.mic.classList.remove("ci-micro--ativo");
    if (!manterMsg) dom.iaStatus.textContent = "";
    try { reconhecimento.stop(); } catch (e) { /* ignora */ }
  }

  // ---------------- Corrigir / melhorar o texto livre ----------------
  var LT_URL = "https://api.languagetool.org/v2/check";
  var LT_LIMITE = 15000;          // o serviço gratuito aceita ~20 mil caracteres por pedido
  var LT_TIMEOUT_MS = 25000;
  var LT_CATEGORIAS = ["TYPOS", "GRAMMAR", "PUNCTUATION", "CASING", "CONFUSED_WORDS", "COMPOUNDING"];
  var ABREVIACOES = ["etc", "sr", "sra", "srta", "dr", "dra", "art", "arts", "av", "n", "nº", "ex", "obs", "cap", "tel", "pág", "pag", "prof", "profa", "ltda", "cia", "dep", "fls"];
  var LETRA = "A-Za-zÀ-ÿ";

  var ultimaAlteracao = null;     // { antes, depois, assuntoAntes } — para o "Desfazer"

  function iaConfigurada() {
    return typeof CI_CONFIG !== "undefined" && CI_CONFIG.AI_ENDPOINT_URL && CI_CONFIG.AI_ENDPOINT_URL.trim() !== "";
  }

  function mostrarDetalhes(linhas) {
    dom.iaDetalhe.innerHTML = "";
    if (!linhas || !linhas.length) { dom.iaDetalhe.hidden = true; return; }
    var ul = document.createElement("ul");
    linhas.slice(0, 40).forEach(function (l) {
      var li = document.createElement("li");
      li.textContent = l;
      ul.appendChild(li);
    });
    if (linhas.length > 40) {
      var mais = document.createElement("li");
      mais.textContent = "… e mais " + (linhas.length - 40) + " alteração(ões).";
      ul.appendChild(mais);
    }
    dom.iaDetalhe.appendChild(ul);
    dom.iaDetalhe.hidden = false;
  }

  function registrarAlteracao(antes, depois, assuntoAntes) {
    if (antes === depois && assuntoAntes === undefined) { dom.desfazer.hidden = true; ultimaAlteracao = null; return; }
    ultimaAlteracao = { antes: antes, depois: depois, assuntoAntes: assuntoAntes };
    dom.desfazer.hidden = false;
    renderPreview();
  }

  function desfazer() {
    if (!ultimaAlteracao) return;
    if (dom.texto.value !== ultimaAlteracao.depois &&
        !window.confirm("Você editou o texto depois da correção. Desfazer mesmo assim e perder essas edições?")) return;
    dom.texto.value = ultimaAlteracao.antes;
    if (ultimaAlteracao.assuntoAntes !== undefined) dom.assuntoLivre.value = ultimaAlteracao.assuntoAntes;
    ultimaAlteracao = null;
    dom.desfazer.hidden = true;
    mostrarDetalhes([]);
    renderPreview();
    dom.iaStatus.textContent = "Texto original restaurado.";
  }

  function melhorarTexto() {
    var texto = dom.texto.value.replace(/\s+$/, "").replace(/^\s+/, "");
    if (!texto) {
      dom.iaStatus.textContent = "Escreva o texto antes de corrigir.";
      mostrarDetalhes([]);
      return;
    }
    corrigirTexto(texto);
  }

  // -------- Camada 0: ajustes básicos, sem internet --------

  function ajustesBasicos(entrada) {
    var t = entrada.replace(/\r\n?/g, "\n");
    var notas = [];

    function passo(nota, fn) {
      var antes = t;
      t = fn(t);
      if (t !== antes) notas.push(nota);
    }

    passo("Espaços duplicados e sobras no fim das linhas removidos.", function (x) {
      return x.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+\n/g, "\n");
    });
    passo("Espaço antes da pontuação removido.", function (x) {
      return x.replace(/[ \t]+([,;:.!?])/g, "$1");
    });
    passo("Espaço depois da pontuação incluído.", function (x) {
      return x
        .replace(new RegExp("([,;!?])(?=[" + LETRA + "])", "g"), "$1 ")
        .replace(new RegExp("([a-zà-ÿ]{2,})\\.(?=[A-ZÀ-Ý])", "g"), "$1. ");
    });
    passo("Letra maiúscula no início das frases.", function (x) {
      return x.replace(new RegExp("(^|[.!?]\\s+|\\n\\s*)([a-zà-ÿ])", "g"), function (m, pre, ch, off, tudo) {
        if (/[.!?]/.test(pre)) {
          var palavra = tudo.slice(0, off).match(new RegExp("([" + LETRA + "]+)$"));
          if (palavra && ABREVIACOES.indexOf(palavra[1].toLowerCase()) !== -1) return m;
        }
        return pre + ch.toUpperCase();
      });
    });
    passo("Ponto final incluído no fim do texto.", function (x) {
      return /[A-Za-zÀ-ÿ0-9]$/.test(x.trim()) ? x.replace(/\s+$/, "") + "." : x;
    });

    return { texto: t, notas: notas };
  }

  // -------- Camada 1: LanguageTool (ortografia e gramática) --------

  function dividirTexto(t, max) {
    if (t.length <= max) return [t];
    var partes = [], resto = t;
    while (resto.length > max) {
      var corte = resto.lastIndexOf("\n", max);
      if (corte < max / 2) corte = resto.lastIndexOf(". ", max) + 1;
      if (corte < max / 2) corte = resto.lastIndexOf(" ", max);
      if (corte <= 0) corte = max;
      partes.push(resto.slice(0, corte));
      resto = resto.slice(corte);
    }
    partes.push(resto);
    return partes;
  }

  function fetchComTimeout(url, opcoes, ms) {
    if (typeof AbortController === "undefined") return fetch(url, opcoes);
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms);
    opcoes.signal = ctrl.signal;
    return fetch(url, opcoes).then(
      function (r) { clearTimeout(timer); return r; },
      function (e) { clearTimeout(timer); throw e; }
    );
  }

  // Decide se uma sugestão do LanguageTool é segura de aplicar sozinha.
  function aceitarSugestao(m, texto) {
    if (!m.replacements || !m.replacements.length || !m.replacements[0].value) return false;
    var cat = m.rule && m.rule.category && m.rule.category.id;
    if (LT_CATEGORIAS.indexOf(cat) === -1) return false;          // estilo, redundância etc. ficam de fora

    var trecho = texto.substr(m.offset, m.length);
    if (!trecho.trim()) return false;
    if (cat === "TYPOS") {
      if (/\d/.test(trecho)) return false;                          // números, códigos
      if (trecho.length > 1 && trecho === trecho.toUpperCase()) return false;   // SIGLAS e NOMES EM CAIXA ALTA
      if (/^[A-ZÀ-Ý]/.test(trecho)) {                              // palavra com inicial maiúscula...
        var antes = texto.slice(0, m.offset);
        var inicioDeFrase = /(^|[.!?]\s+|\n\s*)$/.test(antes);
        if (!inicioDeFrase) return false;                           // ...no meio da frase = nome próprio
      }
    }
    return true;
  }

  function aplicarSugestoes(trecho, matches) {
    var candidatas = matches.filter(function (m) { return aceitarSugestao(m, trecho); });
    var ignoradas = matches.length - candidatas.length;

    // da esquerda para a direita, descartando as que se sobrepõem à anterior
    candidatas.sort(function (a, b) { return a.offset - b.offset || b.length - a.length; });
    var usadas = [], fim = -1;
    candidatas.forEach(function (m) {
      if (m.offset < fim) { ignoradas++; return; }
      usadas.push(m);
      fim = m.offset + m.length;
    });

    // aplica de trás para frente para os índices das seguintes não mudarem
    var corrigido = trecho;
    var trocas = [];
    usadas.slice().reverse().forEach(function (m) {
      var de = trecho.substr(m.offset, m.length);
      var para = m.replacements[0].value;
      if (de === para) return;
      corrigido = corrigido.slice(0, m.offset) + para + corrigido.slice(m.offset + m.length);
      trocas.unshift("“" + de + "” → “" + para + "”");
    });
    return { texto: corrigido, trocas: trocas, ignoradas: ignoradas };
  }

  function chamarLanguageTool(trecho) {
    var params = new URLSearchParams();
    params.set("text", trecho);
    params.set("language", "pt-BR");
    return fetchComTimeout(LT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: params.toString()
    }, LT_TIMEOUT_MS)
      .then(function (resp) {
        if (!resp.ok) { var e = new Error("http " + resp.status); e.status = resp.status; throw e; }
        return resp.json();
      })
      .then(function (dados) {
        return aplicarSugestoes(trecho, (dados && dados.matches) || []);
      });
  }

  function motivoErro(err) {
    if (err && err.name === "AbortError") return "o serviço demorou demais para responder";
    if (err && err.status === 429) return "limite de uso do serviço gratuito atingido — aguarde cerca de 1 minuto e tente de novo";
    if (err && err.status) return "o serviço respondeu com erro " + err.status;
    return "não foi possível conectar ao serviço (internet, firewall ou bloqueador de anúncios podem estar impedindo o acesso a api.languagetool.org)";
  }

  function corrigirTexto(original) {
    dom.corrigir.disabled = true;
    dom.iaStatus.textContent = "Corrigindo ortografia e gramática...";
    mostrarDetalhes([]);

    var basico = ajustesBasicos(original);
    var partes = dividirTexto(basico.texto, LT_LIMITE);
    var final = "", trocas = [], ignoradas = 0;

    var seq = Promise.resolve();
    partes.forEach(function (parte) {
      seq = seq.then(function () { return chamarLanguageTool(parte); }).then(function (r) {
        final += r.texto;
        trocas = trocas.concat(r.trocas);
        ignoradas += r.ignoradas;
      });
    });

    seq.then(function () {
      concluirCorrecao(original, final, basico.notas, trocas, ignoradas, null);
    }, function (err) {
      console.error(err);
      concluirCorrecao(original, basico.texto, basico.notas, [], 0, err);
    }).then(function () {
      dom.corrigir.disabled = false;
    });
  }

  function concluirCorrecao(original, final, notas, trocas, ignoradas, erro) {
    if (final !== original) dom.texto.value = final;
    registrarAlteracao(original, final);

    var detalhes = notas.concat(trocas);
    mostrarDetalhes(detalhes);

    var partes = [];
    if (trocas.length) partes.push(trocas.length + " correção(ões) de ortografia/gramática");
    if (notas.length) partes.push(notas.length + " ajuste(s) de formatação");
    var feito = partes.join(" e ");

    if (erro) {
      dom.iaStatus.textContent = (feito ? feito + " aplicado(s). " : "") +
        "Correção ortográfica indisponível agora: " + motivoErro(erro) + ".";
    } else if (!feito) {
      dom.iaStatus.textContent = "Nenhum erro encontrado.";
    } else {
      dom.iaStatus.textContent = feito + " aplicado(s) — confira o texto e o assunto." +
        (ignoradas ? " (" + ignoradas + " sugestão(ões) incerta(s) ignorada(s): nomes, siglas ou estilo.)" : "");
    }
  }

  // -------- Camada 2: reescrita + assunto via IA generativa (opcional) --------

  function melhorarTextoIA() {
    var texto = dom.texto.value.replace(/\s+$/, "").replace(/^\s+/, "");
    if (!texto) { dom.iaStatus.textContent = "Escreva o texto antes de melhorar."; mostrarDetalhes([]); return; }
    melhorarComIA(texto);
  }
  function melhorarComIA(texto) {
    dom.corrigir.disabled = true;
    dom.iaStatus.textContent = "Melhorando o texto com IA...";
    mostrarDetalhes([]);
    var assuntoAntes = dom.assuntoLivre.value;

    fetchComTimeout(CI_CONFIG.AI_ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita pre-flight CORS no Apps Script
      body: JSON.stringify({ texto: texto, token: CI_CONFIG.AI_TOKEN || "" })
    }, 60000)
      .then(function (resp) {
        if (!resp.ok) { var e = new Error("http " + resp.status); e.status = resp.status; throw e; }
        return resp.json();
      })
      .then(function (dados) {
        if (dados.erro) {
          dom.iaStatus.textContent = "IA: " + dados.erro;
          return;
        }
        var antes = dom.texto.value;
        if (dados.texto) dom.texto.value = dados.texto;
        if (dados.assunto) dom.assuntoLivre.value = dados.assunto;
        registrarAlteracao(antes, dom.texto.value, assuntoAntes);
        dom.iaStatus.textContent = "Texto revisado e assunto sugerido — confira antes de gerar.";
      })
      .catch(function (err) {
        console.error(err);
        dom.iaStatus.textContent = "Não foi possível falar com a IA: " + motivoErro(err) + ".";
      })
      .then(function () {
        dom.corrigir.disabled = false;
      });
  }


  // ---------------- pasta para salvar (a mesma escolhida na Folga) ----------------
  var pasta = { handle: null, ok: false };
  function idbAbrir() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open("painelEndemiasFolga", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("handles"); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
  }
  function idbLer(chave) { return idbAbrir().then(function (db) { return new Promise(function (res) { var q = db.transaction("handles").objectStore("handles").get(chave); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; }); }).catch(function () { return null; }); }
  function idbGravar(chave, valor) { return idbAbrir().then(function (db) { return new Promise(function (res) { var t = db.transaction("handles", "readwrite"); if (valor) t.objectStore("handles").put(valor, chave); else t.objectStore("handles").delete(chave); t.oncomplete = function () { res(); }; t.onerror = function () { res(); }; }); }).catch(function () { /* ignora */ }); }
  function mostrarPasta() {
    var n = document.getElementById("ciPastaNome"), b = document.getElementById("ciPasta");
    var txt = pasta.handle ? pasta.handle.name : "Downloads";
    if (n) n.textContent = "📁 " + txt;
    if (b) b.title = pasta.handle ? "Pasta atual: " + pasta.handle.name + " (clique para trocar; Shift + clique volta para Downloads)" : "Escolher a pasta onde salvar o .docx (hoje: Downloads)";
  }
  function escolherPasta(e) {
    if (e && e.shiftKey && pasta.handle) { pasta.handle = null; pasta.ok = false; idbGravar("pasta", null); mostrarPasta(); setStatus("Pasta removida. Os documentos voltam a baixar em Downloads.", false); return; }
    if (!window.showDirectoryPicker) { setStatus("Este navegador não permite escolher pasta (use Chrome ou Edge no computador). O arquivo continua baixando normalmente.", true); return; }
    window.showDirectoryPicker({ id: "folgas-ci", mode: "readwrite" }).then(function (h) {
      pasta.handle = h; pasta.ok = true; mostrarPasta();
      return idbGravar("pasta", h).then(function () { setStatus("Pasta escolhida: " + h.name + ". Os documentos serão salvos nela.", false); });
    }).catch(function (err) { if (err && err.name !== "AbortError") setStatus("Não foi possível escolher a pasta: " + err.message, true); });
  }
  function carregarPasta() {
    mostrarPasta();
    if (!window.showDirectoryPicker) { var b = document.getElementById("ciPasta"); if (b) b.disabled = true; return; }
    idbLer("pasta").then(function (h) { if (h) { pasta.handle = h; mostrarPasta(); } });
  }
  function autorizarPasta() {
    if (!pasta.handle || !pasta.handle.queryPermission) { pasta.ok = false; return Promise.resolve(); }
    var o = { mode: "readwrite" };
    return Promise.resolve(pasta.handle.queryPermission(o)).then(function (p) { return p === "granted" ? p : pasta.handle.requestPermission(o); })
      .then(function (p) { pasta.ok = (p === "granted"); }).catch(function () { pasta.ok = false; });
  }
  function nomeLivre(dir, nome) {
    var base = nome.replace(/\.docx$/i, ""), i = 1;
    function tenta() {
      var n = i === 1 ? nome : base + " (" + i + ").docx";
      return dir.getFileHandle(n).then(function () { i++; return tenta(); }, function () { return n; });
    }
    return tenta();
  }
  function entregarArquivo(blob, nome) {
    function baixar(motivo) {
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = nome; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      return { nome: nome, onde: motivo || "" };
    }
    if (!(pasta.handle && pasta.ok)) return Promise.resolve(baixar(pasta.handle ? " (sem permissão para a pasta “" + pasta.handle.name + "”, baixado em Downloads)" : ""));
    return nomeLivre(pasta.handle, nome).then(function (n) {
      return pasta.handle.getFileHandle(n, { create: true }).then(function (fh) { return fh.createWritable(); }).then(function (w) {
        return w.write(blob).then(function () { return w.close(); });
      }).then(function () { return { nome: n, onde: " na pasta “" + pasta.handle.name + "”" }; });
    }).catch(function () { return baixar(" (não consegui gravar na pasta “" + pasta.handle.name + "”, baixado em Downloads)"); });
  }

  // ---------------- impressão direta (modelo A4 em tamanho real, sem gerar arquivo) ----------------
  function imprimirDocumento() {
    var falta = faltaPreencher();
    if (falta.length) { setStatus("Falta preencher: " + falta.join(", ") + ".", true); return; }
    var ci = dom.numero.value.trim();
    if (!confirmarCiRepetida(ci)) return;
    var copia = dom.preview.cloneNode(true);
    copia.removeAttribute("id"); copia.style.transform = "none";
    var f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(f);
    var d = f.contentDocument;
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"><title>CI ' + ci.replace(/[<>&]/g, "") + '/2026</title><link rel="stylesheet" href="folga-split.css"><link rel="stylesheet" href="ci.css"><style>@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff}.fg-papel{position:relative!important;left:0!important;top:0!important;transform:none!important;box-shadow:none!important;width:794px!important;height:1122px!important;min-height:0!important;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body class="folga-page ci-page"></body></html>');
    d.close();
    d.body.appendChild(d.importNode(copia, true));
    var esperas = Array.prototype.slice.call(d.images).map(function (im) { return im.complete ? Promise.resolve() : new Promise(function (ok) { im.onload = im.onerror = ok; }); });
    var css = Array.prototype.slice.call(d.querySelectorAll("link")).map(function (l) { return l.sheet ? Promise.resolve() : new Promise(function (ok) { l.onload = l.onerror = ok; }); });
    Promise.all(esperas.concat(css)).then(function () {
      setTimeout(function () {
        try { f.contentWindow.focus(); f.contentWindow.print(); registrarHist(ci, "impressão"); setStatus("Enviado para a impressora (CI " + ci + "/2026). Dica: na janela de impressão, desmarque “Cabeçalhos e rodapés”.", false); }
        catch (e) { setStatus("Não foi possível abrir a impressão: " + e.message, true); }
        setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 60000);
      }, 250);
    });
  }

  // ---------------- gerar .docx ----------------
  function xmlParagrafos(pars) {
    return pars.map(function (p, i) {
      // linha de lista ("- Nome"): sem recuo de 1ª linha, alinhada à esquerda e junto da seguinte; espaço depois do último item
      var prox = pars[i + 1], fimLista = p.lista && !(prox && prox.lista);
      var pPr = p.lista
        ? '<w:spacing w:before="0" w:after="' + (fimLista ? 160 : 20) + '" w:line="320" w:lineRule="auto"/><w:ind w:left="1134"/><w:jc w:val="left"/>'
        : '<w:spacing w:before="0" w:after="120" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="709"/><w:jc w:val="both"/>';
      return '<w:p><w:pPr>' + pPr + '</w:pPr>' +
        p.map(function (s) {
          return '<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>' + (s.b ? "<w:b/><w:bCs/>" : "") + '<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">' + escXml(s.t) + "</w:t></w:r>";
        }).join("") + "</w:p>";
    }).join("");
  }
  // texto da comunicação dentro de uma tabela de 1 célula com borda bem fina (0,5 pt) azul-marinho
  function caixaFina(conteudo) {
    var b = function (l) { return '<w:' + l + ' w:val="single" w:sz="4" w:space="0" w:color="002868"/>'; };
    return '<w:tbl><w:tblPr><w:tblW w:w="9638" w:type="dxa"/><w:tblInd w:w="0" w:type="dxa"/><w:tblBorders>' + b("top") + b("left") + b("bottom") + b("right") + '</w:tblBorders><w:tblLayout w:type="fixed"/>' +
      '<w:tblCellMar><w:top w:w="140" w:type="dxa"/><w:left w:w="200" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="200" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
      '<w:tblGrid><w:gridCol w:w="9638"/></w:tblGrid><w:tr><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="9638" w:type="dxa"/></w:tcPr>' + conteudo + '</w:tc></w:tr></w:tbl>' +
      '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="120" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>';
  }
  function gerarDocumento() {
    var falta = faltaPreencher();
    if (falta.length) { setStatus("Falta preencher: " + falta.join(", ") + ".", true); return; }
    if (typeof window.JSZip === "undefined" || typeof window.DocxUtils === "undefined") { setStatus("Não foi possível carregar os componentes de geração de documento.", true); return; }
    var ci = dom.numero.value.trim();
    if (!confirmarCiRepetida(ci)) return;
    setStatus("Gerando documento...", false);
    var rem = remetenteAtual(), corpoXml = xmlParagrafos(paragrafos());
    var subs = {
      "<<ci>>": ci, "<<hoje>>": dataExtenso(new Date()), "<<sigla>>": dom.sigla.value.trim(), "<<setor>>": rem.setor, "<<remetente>>": rem.nome,
      "<<para>>": paraFormatado(), "<<assunto>>": assuntoTexto(), "<<cargoRem>>": cargoRemetente(rem),
      "<<gerente>>": dom.gerente.value.trim(), "<<gerenteCargo>>": dom.gerenteCargo.value.trim()
    };
    fetch("assets/modelo-ci.docx")
      .then(function (resp) { if (!resp.ok) throw new Error("Modelo não encontrado (assets/modelo-ci.docx)"); return resp.arrayBuffer(); })
      .then(function (bytes) {
        return DocxUtils.lerArquivosXml(bytes).then(function (arquivos) {
          var doc = arquivos["word/document.xml"], re = /<w:p>(?:(?!<\/w:p>)[\s\S])*?&lt;&lt;corpo&gt;&gt;[\s\S]*?<\/w:p>/;
          if (!re.test(doc)) throw new Error("Marcador <<corpo>> não encontrado no modelo.");
          arquivos["word/document.xml"] = doc.replace(re, function () { return caixaFina(corpoXml); });
          Object.keys(arquivos).forEach(function (caminho) { arquivos[caminho] = DocxUtils.substituirTags(arquivos[caminho], subs); });
          return DocxUtils.gerarDocxBlob(bytes, arquivos);
        });
      })
      .then(function (blob) {
        var slug = (assuntoAtual().assunto || assuntoTexto()).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        slug = slug.charAt(0).toUpperCase() + slug.slice(1);
        var nome = "CI - " + ci.replace(/[\/\\:]/g, "-") + " - " + slug + ".docx";
        return entregarArquivo(blob, nome).then(function (r) {
          registrarHist(ci, "docx");
          setStatus("Documento gerado: " + r.nome + r.onde, false);
        });
      })
      .catch(function (err) { console.error(err); setStatus("Erro ao gerar documento: " + err.message, true); });
  }

  function limparTudo() {
    if ((Object.keys(state.marcados).length || state.calSel.length) && !window.confirm("Limpar agentes, datas e textos deste documento?")) return;
    state.marcados = {}; state.calSel = []; state.calUltimo = null;
    dom.numero.value = ""; dom.texto.value = ""; dom.assuntoLivre.value = "";
    renderLista(); atualizarSelecao(); renderCalendario(); setStatus("", false);
  }

  // ---------------- inicialização ----------------
  function init() {
    ["ciNumero", "ciRemetente", "ciPara", "ciSigla", "ciGerente", "ciGerenteCargo", "ciAssuntos", "ciIncMat", "ciBusca", "ciResumoSelecao", "ciLista", "ciContador",
     "ciMarcarTodos", "ciDesmarcar", "ciMotivo", "ciTexto", "ciNegrito", "ciMic", "ciCorrigir", "ciMelhorarIA", "ciDesfazer", "ciIaStatus", "ciIaDetalhe", "ciAssuntoLivre", "ciLimpar", "ciGerar", "ciStatus", "ciPreview"].forEach(function (id) {
      var k = id.replace(/^ci/, ""); k = k.charAt(0).toLowerCase() + k.slice(1);
      dom[k] = document.getElementById(id);
    });
    dom.resumo = dom.resumoSelecao;
    state.funcionarios = carregarFuncionarios(); state.matriculas = carregarMatriculas(); state.remetentes = carregarRemetentes();
    renderAssuntos(); aplicarCampos(); renderRemetentes(); renderCalendario(); atualizarDicaCi();
    dom.numero.addEventListener("input", renderPreview);
    dom.remetente.addEventListener("change", function () { state.remetente = parseInt(dom.remetente.value, 10) || 0; renderPreview(); });
    ["para", "sigla", "gerente", "gerenteCargo", "motivo", "texto", "assuntoLivre"].forEach(function (k) { dom[k].addEventListener("input", renderPreview); });
    dom.incMat.addEventListener("change", function () { state.incMat = dom.incMat.checked; renderPreview(); });
    dom.busca.addEventListener("input", function () { state.filtroTexto = dom.busca.value; renderLista(); });
    dom.busca.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return; e.preventDefault();
      var l = nomesFiltrados(); if (l.length !== 1) { setStatus(l.length ? "Há " + l.length + " resultados — digite mais do nome." : "Ninguém encontrado com essa busca.", !l.length); return; }
      if (state.marcados[l[0]]) delete state.marcados[l[0]]; else state.marcados[l[0]] = true;
      state.filtroTexto = ""; dom.busca.value = ""; atualizarSelecao(); dom.busca.focus();
    });
    dom.marcarTodos.addEventListener("click", function () {
      var l = nomesFiltrados();
      if (l.length > 15 && !window.confirm("Marcar " + l.length + " agentes de uma vez?")) return;
      l.forEach(function (n) { state.marcados[n] = true; }); atualizarSelecao();
    });
    dom.desmarcar.addEventListener("click", function () { state.marcados = {}; atualizarSelecao(); });
    dom.limpar.addEventListener("click", limparTudo);
    dom.gerar.addEventListener("click", function () { autorizarPasta().then(gerarDocumento); });
    configurarMicrofone();
    dom.corrigir.addEventListener("click", melhorarTexto);
    dom.melhorarIA.addEventListener("click", melhorarTextoIA);
    dom.desfazer.addEventListener("click", desfazer);
    dom.melhorarIA.hidden = !iaConfigurada();
    document.getElementById("ciImprimir").addEventListener("click", imprimirDocumento);
    document.getElementById("ciPasta").addEventListener("click", escolherPasta);
    carregarPasta();
    document.querySelectorAll(".fg-aba").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".fg-aba").forEach(function (x) { x.classList.toggle("fg-aba--ativa", x === b); });
        var g = document.querySelector(".fg-grade"); if (g) g.setAttribute("data-aba", b.getAttribute("data-aba"));
        setTimeout(ajustarEscala, 30);
      });
    });
    document.getElementById("fgAmpliar").addEventListener("click", abrirLupa);
    document.getElementById("fgLupaX").addEventListener("click", fecharLupa);
    document.getElementById("fgLupaTam").addEventListener("click", function () { lupaReal = !lupaReal; abrirLupa(); });
    var lupa = document.getElementById("fgLupa");
    lupa.addEventListener("click", function (e) { if (e.target === lupa || e.target.id === "fgLupaArea") fecharLupa(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharLupa(); });
    window.addEventListener("resize", ajustarTela);
    renderLista(); atualizarSelecao(); ajustarTela();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
