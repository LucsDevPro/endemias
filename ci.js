// ============================================================
// Comunicação Interna — página própria. Lê assets/modelo-ci.docx
// e substitui as tags {{CI}}, {{DATAHOJE}}, {{Secretaria}},
// {{Assunto}} e {{Texto}} (usa docx-utils.js).
//
// O microfone usa a Web Speech API nativa do navegador (Chrome
// e a maioria dos navegadores baseados em Chromium) — não passa
// por nenhum servidor, então não precisa de configuração.
//
// O botão "✨ Melhorar texto" tem dois níveis:
//
// 1) Correção ortográfica/gramatical automática via LanguageTool
//    (api.languagetool.org) — serviço público e gratuito, sem
//    chave nenhuma, funciona direto do navegador sem configurar
//    nada. Só corrige erros de escrita, não reescreve o texto
//    nem sugere assunto.
//
// 2) Se CI_CONFIG.AI_ENDPOINT_URL estiver configurado (ci-config.js),
//    usa isso em vez do LanguageTool: aponta pra um Google Apps
//    Script que chama uma IA generativa (Gemini) com a chave
//    protegida no lado do Google — nunca no site — e além de
//    corrigir também reescreve o texto e sugere o assunto.
//
// Sem nenhum dos dois, dá pra digitar o Assunto e revisar o Texto
// à mão normalmente — o gerador de documento funciona de qualquer jeito.
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

  // ---------------- Melhorar texto com IA (opcional) ----------------

  function iaConfigurada() {
    return typeof CI_CONFIG !== "undefined" && CI_CONFIG.AI_ENDPOINT_URL && CI_CONFIG.AI_ENDPOINT_URL.trim() !== "";
  }

  function melhorarTexto() {
    var texto = dom.texto.value.trim();
    if (!texto) {
      dom.iaStatus.textContent = "Escreva ou dite o texto antes de melhorar.";
      return;
    }

    if (iaConfigurada()) {
      melhorarComGemini(texto);
    } else {
      corrigirComLanguageTool(texto);
    }
  }

  // -------- Nível 1: correção ortográfica/gramatical gratuita --------
  // api.languagetool.org — serviço público, sem chave, sem cadastro.
  // Só corrige erros de escrita; não reescreve o texto nem sugere assunto.
  function corrigirComLanguageTool(texto) {
    dom.melhorar.disabled = true;
    dom.iaStatus.textContent = "Corrigindo ortografia e gramática...";

    var params = new URLSearchParams();
    params.set("text", texto);
    params.set("language", "pt-BR");

    fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    })
      .then(function (resp) {
        if (!resp.ok) throw new Error("resposta " + resp.status);
        return resp.json();
      })
      .then(function (dados) {
        var matches = (dados && dados.matches) || [];
        if (!matches.length) {
          dom.iaStatus.textContent = "Nenhum erro de ortografia/gramática encontrado.";
          return;
        }

        // aplica as correções de trás pra frente, pra não bagunçar
        // os índices (offset) dos erros seguintes
        var corrigido = texto;
        var aplicadas = 0;
        matches
          .slice()
          .sort(function (a, b) { return b.offset - a.offset; })
          .forEach(function (m) {
            if (!m.replacements || !m.replacements.length) return;
            var valor = m.replacements[0].value;
            corrigido = corrigido.slice(0, m.offset) + valor + corrigido.slice(m.offset + m.length);
            aplicadas++;
          });

        dom.texto.value = corrigido;
        dom.iaStatus.textContent = aplicadas > 0
          ? aplicadas + " correção(ões) de ortografia/gramática aplicada(s) — confira o texto e preencha o assunto."
          : "Erros encontrados, mas sem sugestão automática — revise manualmente.";
      })
      .catch(function (err) {
        console.error(err);
        dom.iaStatus.textContent = "Não foi possível corrigir agora (verifique a internet e tente de novo).";
      })
      .finally(function () {
        dom.melhorar.disabled = false;
      });
  }

  // -------- Nível 2: reescrita + assunto via IA generativa (opcional) --------
  function melhorarComGemini(texto) {
    dom.melhorar.disabled = true;
    dom.iaStatus.textContent = "Melhorando o texto com IA...";

    fetch(CI_CONFIG.AI_ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita pre-flight CORS no Apps Script
      body: JSON.stringify({ texto: texto, token: CI_CONFIG.AI_TOKEN || "" })
    })
      .then(function (resp) { return resp.json(); })
      .then(function (dados) {
        if (dados.erro) {
          dom.iaStatus.textContent = "IA: " + dados.erro;
          return;
        }
        if (dados.texto) dom.texto.value = dados.texto;
        if (dados.assunto) dom.assunto.value = dados.assunto;
        dom.iaStatus.textContent = "Texto revisado e assunto sugerido — confira antes de gerar.";
      })
      .catch(function (err) {
        console.error(err);
        dom.iaStatus.textContent = "Não foi possível falar com a IA (verifique a internet ou a configuração).";
      })
      .finally(function () {
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
      dom.iaStatus.textContent = "Corrige ortografia e gramática automaticamente — reescrita e sugestão de assunto por IA não configuradas.";
    }

    dom.melhorar.addEventListener("click", melhorarTexto);
    dom.gerar.addEventListener("click", gerarDocumento);
    setStatus("", false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
