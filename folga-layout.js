// ============================================================
// Folga — ajuste automático para caber em UMA folha A4
//
// O modelo tem: cabeçalho, tabela de funcionários e, embaixo, a
// tabela de assinaturas. Com poucos funcionários cabe tudo; com mais,
// o documento passava para a 2ª página e as assinaturas ficavam
// soltas. Aqui escolhemos, pelo número de funcionários e pelo
// tamanho dos textos (nome, cargo, datas), o NÍVEL de compactação
// mais confortável que ainda cabe numa folha: vai reduzindo a fonte,
// as alturas de linha, os espaços e os parágrafos vazios — as
// assinaturas continuam logo abaixo da tabela.
//
// Se nem o nível mais compacto couber (muitos funcionários), o
// documento é gerado no nível mais compacto e avisamos a pessoa.
//
// Funciona no navegador (window.FolgaLayout) e no Node (para testes).
// ============================================================

(function (global) {
  "use strict";

  // Limite inferior do conteúdo, medido do topo da página (twips): A4 = 16838 menos a margem de baixo (1134).
  // (As alturas "base" dos níveis já incluem o cabeçalho com os logos, que empurra o texto para baixo.)
  var ALTURA_UTIL = 16838 - 1134;

  // Colunas da tabela de funcionários (soma = 9638 = largura útil da página)
  var COLUNAS = [2450, 2100, 1150, 1938, 2000];
  var LARGURA_TABELA = 9638;
  var MARGEM_LATERAL = 100; // tcMar left/right do modelo

  // Níveis, do mais confortável ao mais compacto.
  //  sz   = tamanho da fonte (meios-pontos)     mar = margem interna da célula (topo/base)
  //  sp   = espaço antes/depois do parágrafo    trh = altura mínima da linha
  //  top  = fator nas alturas do bloco de cima  assin = altura da linha de assinatura
  //  vazio = altura exata (twips) dos parágrafos vazios (null = como no modelo)
  //  base = altura (twips) de tudo que NÃO é linha de funcionário (calibrado no LibreOffice)
  var NIVEIS = [
    { sz: 22, mar: 100, sp: 80, trh: 576, top: 1.00, assin: 1261, vazio: null, hdr: 720, logo: 1.00, base: 12444 },
    { sz: 20, mar: 70,  sp: 50, trh: 480, top: 0.80, assin: 1100, vazio: 200,  hdr: 560, logo: 0.90, base: 11292 },
    { sz: 18, mar: 50,  sp: 30, trh: 400, top: 0.65, assin: 950,  vazio: 120,  hdr: 460, logo: 0.75, base: 10145 },
    { sz: 16, mar: 35,  sp: 20, trh: 330, top: 0.55, assin: 850,  vazio: 60,   hdr: 400, logo: 0.62, base: 9234 },
    { sz: 15, mar: 25,  sp: 10, trh: 290, top: 0.45, assin: 760,  vazio: 20,   hdr: 360, logo: 0.52, base: 8598 },
    { sz: 14, mar: 15,  sp: 0,  trh: 250, top: 0.40, assin: 700,  vazio: 10,   hdr: 320, logo: 0.45, base: 8342 }
  ];

  var FOLGA_SEGURANCA = 0.975; // margem de segurança (Word e LibreOffice diferem um pouco)

  // ---------------------------------------------------------
  //  Estimativa de linhas de texto numa célula
  // ---------------------------------------------------------
  function larguraChar(szMeia, texto, negrito) {
    var em = szMeia / 2;                    // pontos
    var maius = (texto.match(/[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/g) || []).length / Math.max(1, texto.length);
    return em * (0.50 + 0.20 * maius + (negrito ? 0.05 : 0));
  }

  function contarLinhas(texto, colunaTw, szMeia, negrito) {
    texto = String(texto || "").trim();
    if (!texto) return 1;
    var util = (colunaTw - 2 * MARGEM_LATERAL) / 20;   // pontos
    var cw = larguraChar(szMeia, texto, negrito);
    var maxChars = Math.max(1, Math.floor(util / cw));
    var palavras = texto.split(/\s+/), linhas = 1, atual = 0;
    palavras.forEach(function (p) {
      while (p.length > maxChars) {                     // palavra maior que a linha
        if (atual > 0) { linhas++; atual = 0; }
        p = p.slice(maxChars); if (p.length) { linhas++; }
      }
      var add = (atual === 0 ? 0 : 1) + p.length;
      if (atual + add > maxChars) { linhas++; atual = p.length; } else { atual += add; }
    });
    return linhas;
  }

  function alturaLinhaTexto(szMeia) { return Math.ceil((szMeia / 2) * 1.17 * 20); }

  function alturaLinhaFuncionario(item, n) {
    var sz = n.sz;
    var l = Math.max(
      contarLinhas(item.nome, COLUNAS[0], sz, false),
      contarLinhas(item.cargo, COLUNAS[1], sz, false),
      contarLinhas(item.tipo, COLUNAS[2], sz, false),
      contarLinhas(item.datas, COLUNAS[3], sz, true)
    );
    var h = l * alturaLinhaTexto(sz) + 2 * n.mar + 2 * n.sp;
    return Math.max(n.trh, h);
  }

  function estimar(itens, n) {
    var soma = n.base + n.hdr;
    itens.forEach(function (it) { soma += alturaLinhaFuncionario(it, n); });
    return soma;
  }

  // devolve { indice, nivel, cabe, estimativa }
  function escolherNivel(itens) {
    var limite = ALTURA_UTIL * FOLGA_SEGURANCA;
    for (var i = 0; i < NIVEIS.length; i++) {
      var e = estimar(itens, NIVEIS[i]);
      if (e <= limite) return { indice: i, nivel: NIVEIS[i], cabe: true, estimativa: e };
    }
    var u = NIVEIS.length - 1;
    return { indice: u, nivel: NIVEIS[u], cabe: false, estimativa: estimar(itens, NIVEIS[u]) };
  }

  // ---------------------------------------------------------
  //  Aplicação do nível no XML do documento
  // ---------------------------------------------------------
  function trocarTodos(xml, de, para) { return xml.split(de).join(para); }

  function acharLinha(xml, textoDentro) {
    var pos = 0;
    while (true) {
      var ts = xml.indexOf("<w:tr", pos);
      if (ts === -1) return null;
      var te = xml.indexOf("</w:tr>", ts);
      if (te === -1) return null;
      var bloco = xml.slice(ts, te + 7);
      if (bloco.indexOf(textoDentro) !== -1) return { ini: ts, fim: te + 7, xml: bloco };
      pos = te + 7;
    }
  }

  function ajustarLinhaTabela(linhaXml, n, alturaMinima) {
    var r = linhaXml;
    r = r.replace(/<w:trHeight w:val="\d+"\/>/, '<w:trHeight w:val="' + alturaMinima + '"/>');
    r = r.replace(/<w:sz w:val="\d+"\/>/g, '<w:sz w:val="' + n.sz + '"/>');
    r = r.replace(/<w:top w:w="\d+" w:type="dxa"\/>/g, '<w:top w:w="' + n.mar + '" w:type="dxa"/>');
    r = r.replace(/<w:bottom w:w="\d+" w:type="dxa"\/>/g, '<w:bottom w:w="' + n.mar + '" w:type="dxa"/>');
    r = r.replace(/<w:spacing w:before="\d+" w:after="\d+"\/>/g,
      '<w:spacing w:before="' + n.sp + '" w:after="' + n.sp + '"/>');
    return r;
  }

  // fixa larguras (para o resultado ser igual no Word e no LibreOffice)
  function fixarColunas(tabelaXml) {
    var t = tabelaXml;
    t = t.replace(/<w:tblW [^>]*\/>/, '<w:tblW w:w="' + LARGURA_TABELA + '" w:type="dxa"/>');
    t = t.replace(/<w:tblLayout [^>]*\/>/g, "");
    t = t.replace(/(<\/w:tblBorders>)/, '$1<w:tblLayout w:type="fixed"/>');
    t = t.replace(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/,
      "<w:tblGrid>" + COLUNAS.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join("") + "</w:tblGrid>");
    // largura de cada célula, pela posição dentro da linha
    t = t.replace(/<w:tr[ >][\s\S]*?<\/w:tr>/g, function (linha) {
      var i = 0;
      return linha.replace(/<w:tcW w:w="\d+" w:type="dxa"\/>/g, function () {
        var w = COLUNAS[i] !== undefined ? COLUNAS[i] : COLUNAS[COLUNAS.length - 1];
        i++;
        return '<w:tcW w:w="' + w + '" w:type="dxa"/>';
      });
    });
    return t;
  }

  var PARAGRAFO_VAZIO = /<w:p(?: [^>]*)?><w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"\/>(?:<w:sz w:val="20"\/><w:szCs w:val="20"\/>)?<\/w:rPr><\/w:pPr><\/w:p>/g;

  // Aplica o nível ao XML do modelo (ANTES de expandir as linhas de funcionários).
  function aplicarNivel(xml, nivel) {
    var out = xml;

    // 1) tabela de funcionários: colunas fixas + linha modelo + cabeçalho
    var ini = out.indexOf("<w:tbl>", out.indexOf("ASSUNTO"));
    var fim = ini === -1 ? -1 : out.indexOf("</w:tbl>", ini) + 8;
    if (ini !== -1 && fim > ini) {
      var tab = fixarColunas(out.slice(ini, fim));
      var lm = acharLinha(tab, "&lt;&lt;nome&gt;&gt;");
      if (lm) tab = tab.slice(0, lm.ini) + ajustarLinhaTabela(lm.xml, nivel, nivel.trh) + tab.slice(lm.fim);
      var lh = acharLinha(tab, ">NOME<");
      if (lh) tab = tab.slice(0, lh.ini) + ajustarLinhaTabela(lh.xml, nivel, nivel.hdr) + tab.slice(lh.fim);
      out = out.slice(0, ini) + tab + out.slice(fim);
    }

    // 2) restante só muda a partir do nível 1 (nível 0 = modelo original)
    if (nivel.vazio !== null) {
      [887, 404, 863, 1120].forEach(function (h) {
        out = trocarTodos(out, '<w:trHeight w:val="' + h + '"/>', '<w:trHeight w:val="' + Math.round(h * nivel.top) + '"/>');
      });
      out = trocarTodos(out, '<w:trHeight w:val="1261"/>', '<w:trHeight w:val="' + nivel.assin + '"/>');
      out = out.replace(PARAGRAFO_VAZIO, function (p) {
        var abre = p.match(/^<w:p(?: [^>]*)?>/)[0];
        return abre + '<w:pPr><w:spacing w:before="0" w:after="0" w:line="' + nivel.vazio +
          '" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>';
      });
    }
    return out;
  }

  // Cabeçalho (word/header1.xml): encolhe a imagem dos logos e centraliza.
  function aplicarCabecalho(xml, nivel) {
    var f = nivel.logo;
    if (!f || f >= 1) return xml;
    var out = xml.replace(/(<(?:wp:extent|a:ext) cx=")(\d+)(" cy=")(\d+)(")/g, function (_, a, cx, b, cy, c) {
      return a + Math.round(cx * f) + b + Math.round(cy * f) + c;
    });
    out = out.replace(/<w:r><w:t xml:space="preserve">\s+<\/w:t><\/w:r>/g, "");        // espaços que "centralizavam" o logo
    out = out.replace(/<w:pStyle w:val="Cabealho"\/>/, '<w:pStyle w:val="Cabealho"/><w:jc w:val="center"/>');
    return out;
  }

  global.FolgaLayout = {
    aplicarCabecalho: aplicarCabecalho,
    NIVEIS: NIVEIS,
    ALTURA_UTIL: ALTURA_UTIL,
    COLUNAS: COLUNAS,
    estimar: estimar,
    escolherNivel: escolherNivel,
    aplicarNivel: aplicarNivel,
    contarLinhas: contarLinhas
  };
  if (typeof module !== "undefined" && module.exports) module.exports = global.FolgaLayout;
})(typeof window !== "undefined" ? window : globalThis);
