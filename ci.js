// ============================================================
// Comunicação Interna — página própria. Lê assets/modelo-ci.docx
// e substitui as tags {{CI}}, {{DATAHOJE}}, {{Secretaria}},
// {{Assunto}} e {{Texto}} (usa docx-utils.js).
//
// O microfone usa a Web Speech API nativa do navegador (Chrome
// e a maioria dos navegadores baseados em Chromium) — não passa
// por nenhum servidor, então não precisa de configuração.
//
// O botão "✨ Melhorar texto" funciona em camadas:
//
// 0) Ajustes básicos, sempre, no próprio navegador (sem internet):
//    espaços duplicados, espaço antes/depois da pontuação, letra
//    maiúscula no início das frases e ponto final.
//
// 1) Correção ortográfica/gramatical via LanguageTool
//    (api.languagetool.org) — serviço público e gratuito, sem chave.
//    Só aplica correções de escrita (ortografia, gramática, pontuação,
//    maiúsculas), ignora nomes próprios/siglas e nunca aplica duas
//    correções sobrepostas. Se o serviço não responder (internet,
//    firewall, limite de uso), os ajustes básicos continuam valendo e
//    a tela diz exatamente o motivo.
//
// 2) Se CI_CONFIG.AI_ENDPOINT_URL estiver configurado (ci-config.js),
//    usa uma IA (Gemini, Claude ou outra, via Google Apps Script) que também reescreve
//    o texto e sugere o assunto.
//
// Toda alteração mostra o que mudou e pode ser desfeita ("↩ Desfazer").
// ============================================================

(function () {
  "use strict";

  var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  var dom = {};
  var reconhecimento = null;
  var ditando = false;

  function cacheDom() {
    dom.numero = document.getElementById("ciNumero");
    dom.secretaria = document.getElementById("ciSecretaria");
    dom.texto = document.getElementById("ciTexto");
    dom.mic = document.getElementById("ciMic");
    dom.micStatus = document.getElementById("ciMicStatus");
    dom.melhorar = document.getElementById("ciMelhorar");
    dom.iaStatus = document.getElementById("ciIaStatus");
    dom.iaDetalhe = document.getElementById("ciIaDetalhe");
    dom.desfazer = document.getElementById("ciDesfazer");
    dom.assunto = document.getElementById("ciAssunto");
    dom.gerar = document.getElementById("ciGerar");
    dom.status = document.getElementById("ciStatus");
  }

  function setStatus(msg, erro) {
    dom.status.textContent = msg;
    dom.status.classList.toggle("folga-status--erro", !!erro);
  }

  function fmtDataHoje() {
    var d = new Date();
    return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  }

  // ---------------- Microfone (Web Speech API, nativa do navegador) ----------------

  function configurarMicrofone() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      dom.mic.disabled = true;
      dom.mic.title = "Seu navegador não suporta ditado por voz — digite o texto normalmente.";
      dom.micStatus.textContent = "Ditado por voz não disponível neste navegador (funciona no Chrome).";
      return;
    }

    reconhecimento = new SpeechRecognition();
    reconhecimento.lang = "pt-BR";
    reconhecimento.continuous = true;
    reconhecimento.interimResults = false;

    reconhecimento.onresult = function (evento) {
      var textoNovo = "";
      for (var i = evento.resultIndex; i < evento.results.length; i++) {
        if (evento.results[i].isFinal) textoNovo += evento.results[i][0].transcript;
      }
      if (textoNovo) {
        var atual = dom.texto.value.trim();
        dom.texto.value = (atual ? atual + " " : "") + textoNovo.trim();
      }
    };

    reconhecimento.onerror = function (evento) {
      dom.micStatus.textContent = "Erro no ditado: " + evento.error;
      pararDitado();
    };

    reconhecimento.onend = function () {
      if (ditando) {
        // o navegador encerra sozinho depois de um tempo; reinicia se ainda estiver "ligado"
        try { reconhecimento.start(); } catch (e) { pararDitado(); }
      }
    };

    dom.mic.addEventListener("click", alternarDitado);
  }

  function alternarDitado() {
    if (ditando) { pararDitado(); return; }
    try {
      reconhecimento.start();
      ditando = true;
      dom.mic.classList.add("ci-mic--ativo");
      dom.micStatus.textContent = "🔴 Ouvindo... fale a comunicação. Clique no microfone de novo para parar.";
    } catch (e) {
      dom.micStatus.textContent = "Não foi possível iniciar o microfone.";
    }
  }

  function pararDitado() {
    ditando = false;
    dom.mic.classList.remove("ci-mic--ativo");
    dom.micStatus.textContent = "";
    try { reconhecimento.stop(); } catch (e) { /* ignora */ }
  }

  // ---------------- Melhorar texto ----------------

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
  }

  function desfazer() {
    if (!ultimaAlteracao) return;
    if (dom.texto.value !== ultimaAlteracao.depois &&
        !window.confirm("Você editou o texto depois da correção. Desfazer mesmo assim e perder essas edições?")) return;
    dom.texto.value = ultimaAlteracao.antes;
    if (ultimaAlteracao.assuntoAntes !== undefined) dom.assunto.value = ultimaAlteracao.assuntoAntes;
    ultimaAlteracao = null;
    dom.desfazer.hidden = true;
    mostrarDetalhes([]);
    dom.iaStatus.textContent = "Texto original restaurado.";
  }

  function melhorarTexto() {
    var texto = dom.texto.value.replace(/\s+$/, "").replace(/^\s+/, "");
    if (!texto) {
      dom.iaStatus.textContent = "Escreva ou dite o texto antes de melhorar.";
      mostrarDetalhes([]);
      return;
    }
    if (iaConfigurada()) melhorarComIA(texto);
    else corrigirTexto(texto);
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
    dom.melhorar.disabled = true;
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
      dom.melhorar.disabled = false;
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

  function melhorarComIA(texto) {
    dom.melhorar.disabled = true;
    dom.iaStatus.textContent = "Melhorando o texto com IA...";
    mostrarDetalhes([]);
    var assuntoAntes = dom.assunto.value;

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
        if (dados.assunto) dom.assunto.value = dados.assunto;
        registrarAlteracao(antes, dom.texto.value, assuntoAntes);
        dom.iaStatus.textContent = "Texto revisado e assunto sugerido — confira antes de gerar.";
      })
      .catch(function (err) {
        console.error(err);
        dom.iaStatus.textContent = "Não foi possível falar com a IA: " + motivoErro(err) + ".";
      })
      .then(function () {
        dom.melhorar.disabled = false;
      });
  }

  // ---------------- Geração do documento ----------------

  function gerarDocumento() {
    var numero = (dom.numero.value || "").trim();
    var secretaria = (dom.secretaria.value || "").trim();
    var assunto = (dom.assunto.value || "").trim();
    var texto = (dom.texto.value || "").trim();

    if (!numero) { setStatus("Informe o número da CI.", true); return; }
    if (!secretaria) { setStatus("Informe para qual secretaria é a comunicação.", true); return; }
    if (!assunto) { setStatus("Informe o assunto (ou use \"Melhorar texto\" para gerar um).", true); return; }
    if (!texto) { setStatus("Escreva ou dite o texto da comunicação.", true); return; }

    if (typeof window.JSZip === "undefined" || typeof window.DocxUtils === "undefined") {
      setStatus("Não foi possível carregar os componentes de geração de documento (verifique se o arquivo jszip.local.js está publicado junto com o site).", true);
      return;
    }

    setStatus("Gerando documento...", false);

    var subs = {
      "{{CI}}": numero,
      "{{DATAHOJE}}": fmtDataHoje(),
      "{{Secretaria}}": secretaria,
      "{{Assunto}}": assunto,
      "{{Texto}}": texto
    };

    fetch("assets/modelo-ci.docx")
      .then(function (resp) {
        if (!resp.ok) throw new Error("Modelo não encontrado (assets/modelo-ci.docx)");
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
        var numeroLimpo = numero.replace(/\//g, "-").replace(/\\/g, "-").replace(/:/g, "-");
        var nomeArquivo = "CI - " + numeroLimpo + " - Comunicacao Interna.docx";

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
    if (!dom.texto) return;

    configurarMicrofone();

    if (!iaConfigurada()) {
      dom.iaStatus.textContent = "Corrige ortografia, gramática e pontuação — reescrita e sugestão de assunto por IA não configuradas.";
    }

    dom.melhorar.addEventListener("click", melhorarTexto);
    dom.desfazer.addEventListener("click", desfazer);
    dom.gerar.addEventListener("click", gerarDocumento);
    setStatus("", false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
