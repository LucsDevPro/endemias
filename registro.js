// Envia o registro de cada folga/CI gerada para a planilha do Google
// (script RegistroFolgas.gs). Se estiver sem internet ou o envio falhar,
// o registro fica numa fila no navegador e é reenviado depois.
// O envio é "dispare e esqueça": nunca atrapalha a geração do documento.
(function () {
  var FILA_KEY = "painelEndemiasRegistroFila";
  var cfg = (typeof REGISTRO_CONFIG !== "undefined" && REGISTRO_CONFIG) || {};
  var enviando = false;

  function ativo() { return !!cfg.URL; }
  function lerFila() { try { var f = JSON.parse(localStorage.getItem(FILA_KEY) || "[]"); return Array.isArray(f) ? f : []; } catch (e) { return []; } }
  function gravarFila(f) { try { localStorage.setItem(FILA_KEY, JSON.stringify(f.slice(-200))); } catch (e) { /* ignora */ } }

  function postar(ev) {
    // text/plain + no-cors: evita o pré-voo CORS, que o Apps Script não atende
    return fetch(cfg.URL, {
      method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ token: cfg.TOKEN || "", evento: ev })
    });
  }

  function esvaziar() {
    if (!ativo() || enviando || !navigator.onLine) return;
    var fila = lerFila(); if (!fila.length) return;
    enviando = true;
    (function proximo() {
      var f = lerFila();
      if (!f.length) { enviando = false; return; }
      postar(f[0]).then(function () { var r = lerFila(); r.shift(); gravarFila(r); proximo(); })
        .catch(function () { enviando = false; });
    })();
  }

  window.Registro = {
    ativo: ativo,
    enviar: function (ev) {
      if (!ativo()) return;
      try { var f = lerFila(); f.push(ev); gravarFila(f); esvaziar(); } catch (e) { /* ignora */ }
    }
  };
  window.addEventListener("online", esvaziar);
  window.addEventListener("load", function () { setTimeout(esvaziar, 1500); });
})();
