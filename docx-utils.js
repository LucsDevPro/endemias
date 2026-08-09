// ============================================================
// DocxUtils — utilitários para preencher um .docx modelo
// substituindo tags de texto diretamente no XML interno do
// arquivo (um .docx é um .zip). Usa só o JSZip — mesma técnica
// já usada e testada no gerador de férias original.
//
// Por que assim em vez de uma biblioteca de template maior:
// é uma dependência a menos para carregar, e o "achar <w:t> e
// juntar texto entre runs" resolve o caso comum de o Word
// quebrar uma tag como <<ci>> ou {{NOME}} no meio, em runs
// diferentes (acontece com corretor ortográfico, autosave etc.).
// ============================================================

(function (global) {
  "use strict";

  function escXml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // Um .docx é XML: o texto de dentro de <w:t> vem com entidades
  // (&lt; &gt; &amp; ...) em vez dos caracteres literais. Uma tag
  // como <<ci>> é gravada como "&lt;&lt;ci&gt;&gt;" — por isso é
  // preciso desfazer isso antes de procurar/comparar as tags.
  function unescXml(s) {
    return String(s)
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }

  // Substitui tags em todo <w:p>...</w:p> de um trecho de XML,
  // mesmo com a tag dividida em várias <w:t> dentro do parágrafo.
  function substituirTags(xml, repl) {
    var out = "";
    var pos = 0;
    while (pos < xml.length) {
      var ps = xml.indexOf("<w:p", pos);
      if (ps === -1) { out += xml.slice(pos); break; }
      var c = xml[ps + 4];
      if (c !== ">" && c !== " " && c !== "\t" && c !== "\n" && c !== "\r") {
        out += xml.slice(pos, ps + 4);
        pos = ps + 4;
        continue;
      }
      out += xml.slice(pos, ps);
      var depth = 1, s = ps + 4;
      while (depth > 0 && s < xml.length) {
        var no = xml.indexOf("<w:p", s);
        var nc = xml.indexOf("</w:p>", s);
        if (nc === -1) { s = xml.length; break; }
        var realOpen = no !== -1 && no < nc;
        if (realOpen) {
          var cc = xml[no + 4];
          realOpen = cc === ">" || cc === " " || cc === "\t" || cc === "\n" || cc === "\r";
        }
        if (realOpen) { depth++; s = no + 4; }
        else { depth--; s = nc + 6; }
      }
      out += processarPara(xml.slice(ps, s), repl);
      pos = s;
    }
    return out;
  }

  function processarPara(para, repl) {
    var blocos = [];
    var p = 0;
    while (p < para.length) {
      var ts = para.indexOf("<w:t", p);
      if (ts === -1) break;
      var gt = para.indexOf(">", ts);
      if (gt === -1) break;
      var te = para.indexOf("</w:t>", gt);
      if (te === -1) break;
      blocos.push({ s: ts, e: te + 6, tagOpen: para.slice(ts, gt + 1), text: para.slice(gt + 1, te) });
      p = te + 6;
    }
    if (!blocos.length) return para;

    var full = blocos.map(function (b) { return unescXml(b.text); }).join("");
    var hasTag = Object.keys(repl).some(function (t) { return full.indexOf(t) !== -1; });
    if (!hasTag) return para;

    var novo = full;
    Object.keys(repl).forEach(function (t) { novo = novo.split(t).join(repl[t]); });

    var res = "";
    var prev = 0;
    blocos.forEach(function (b, i) {
      res += para.slice(prev, b.s);
      if (i === 0) {
        var attrs = b.tagOpen.slice(4, -1);
        var sa = attrs.indexOf("xml:space") !== -1 ? attrs : attrs + " xml:space=\"preserve\"";
        res += "<w:t" + sa + ">" + escXml(novo) + "</w:t>";
      } else {
        res += "<w:t></w:t>";
      }
      prev = b.e;
    });
    res += para.slice(prev);
    return res;
  }

  // Localiza a <w:tr>...</w:tr> que contém "marcador" e a troca por
  // uma cópia por item da lista, já com as tags de cada item trocadas.
  function expandirLinhaTabela(xml, marcador, itens, gerarSubstituicoes) {
    var marcadorEscapado = escXml(marcador);
    var pos = 0, rowStart = -1, rowEnd = -1;
    while (true) {
      var ts = xml.indexOf("<w:tr", pos);
      if (ts === -1) break;
      var te = xml.indexOf("</w:tr>", ts);
      if (te === -1) break;
      var bloco = xml.slice(ts, te + 7);
      if (bloco.indexOf(marcadorEscapado) !== -1) { rowStart = ts; rowEnd = te + 7; break; }
      pos = te + 7;
    }
    if (rowStart === -1) {
      throw new Error("Linha modelo da tabela (" + marcador + ") não encontrada no documento.");
    }
    var rowTemplate = xml.slice(rowStart, rowEnd);
    var linhas = itens.map(function (item) {
      return substituirTags(rowTemplate, gerarSubstituicoes(item));
    }).join("");
    return xml.slice(0, rowStart) + linhas + xml.slice(rowEnd);
  }

  // Lê os arquivos XML de texto de um .docx (documento, cabeçalhos,
  // rodapés, notas) a partir dos bytes originais.
  function lerArquivosXml(bytesOriginais) {
    return JSZip.loadAsync(bytesOriginais).then(function (zip) {
      var caminhos = Object.keys(zip.files).filter(function (f) {
        return /word\/(document|header\d*|footer\d*|endnotes|footnotes)\.xml$/.test(f);
      });
      var promessas = caminhos.map(function (caminho) {
        return zip.files[caminho].async("string").then(function (texto) {
          return [caminho, texto];
        });
      });
      return Promise.all(promessas).then(function (pares) {
        var conteudos = {};
        pares.forEach(function (par) { conteudos[par[0]] = par[1]; });
        return conteudos;
      });
    });
  }

  // Reabre os bytes originais e grava os arquivos alterados, devolvendo
  // o Blob final do .docx pronto para download.
  function gerarDocxBlob(bytesOriginais, arquivosAlterados) {
    return JSZip.loadAsync(bytesOriginais).then(function (zip) {
      Object.keys(arquivosAlterados).forEach(function (caminho) {
        zip.file(caminho, arquivosAlterados[caminho]);
      });
      return zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE"
      });
    });
  }

  global.DocxUtils = {
    escXml: escXml,
    unescXml: unescXml,
    substituirTags: substituirTags,
    processarPara: processarPara,
    expandirLinhaTabela: expandirLinhaTabela,
    lerArquivosXml: lerArquivosXml,
    gerarDocxBlob: gerarDocxBlob
  };
})(window);
