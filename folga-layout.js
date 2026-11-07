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
  //  sz = fonte das linhas de funcionário (meios-pontos)   mar = margem interna (topo/base) das linhas de funcionário
  //  sp = espaço antes/depois do parágrafo                 trh = altura mínima da linha   hdr = altura do cabeçalho da tabela
  //  esp = fator nos espaços vazios entre blocos           top = fator nas alturas dos blocos de cima
  //  mgl = margem interna (topo/base) das demais tabelas   assin = altura da linha de assinaturas
  //  logo = fator do tamanho do logo                       base = altura (twips) de tudo que NÃO é linha de funcionário (calibrado no LibreOffice)
  var NIVEIS = [
    { sz: 20, mar: 60, sp: 0, trh: 560, hdr: 520, esp: 1.00, top: 1.00, mgl: 60, assin: 1500, logo: 1.00, base: 7032 },
    { sz: 18, mar: 45, sp: 0, trh: 440, hdr: 440, esp: 0.75, top: 0.85, mgl: 45, assin: 1250, logo: 0.90, base: 6168 },
    { sz: 17, mar: 35, sp: 0, trh: 380, hdr: 400, esp: 0.55, top: 0.75, mgl: 35, assin: 1050, logo: 0.80, base: 5492 },
    { sz: 16, mar: 28, sp: 0, trh: 330, hdr: 360, esp: 0.40, top: 0.65, mgl: 28, assin: 900,  logo: 0.70, base: 4988 },
    { sz: 15, mar: 20, sp: 0, trh: 290, hdr: 330, esp: 0.30, top: 0.60, mgl: 20, assin: 800,  logo: 0.60, base: 4578 },
    { sz: 14, mar: 12, sp: 0, trh: 250, hdr: 300, esp: 0.20, top: 0.55, mgl: 12, assin: 720,  logo: 0.50, base: 4148 }
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
  var LOGO_ALTURA_EMU = 828000;    // altura do logo no modelo (nível 0)
  var DIST_CABECALHO = 454;        // distância do cabeçalho à borda da página (twips)

  function acharLinha(xml, textoDentro) {
    var pos = 0;
    while (true) {
      var ts = xml.indexOf("<w:tr>", pos);
      if (ts === -1) return null;
      var te = xml.indexOf("</w:tr>", ts);
      if (te === -1) return null;
      var bloco = xml.slice(ts, te + 7);
      if (bloco.indexOf(textoDentro) !== -1) return { ini: ts, fim: te + 7, xml: bloco };
      pos = te + 7;
    }
  }

  function margensTabela(xml, mar) {
    return xml.replace(/<w:top w:w="\d+" w:type="dxa"\/>/g, '<w:top w:w="' + mar + '" w:type="dxa"/>')
              .replace(/<w:bottom w:w="\d+" w:type="dxa"\/>/g, '<w:bottom w:w="' + mar + '" w:type="dxa"/>');
  }

  function ajustarLinhaTabela(linhaXml, sz, sp, altura) {
    return linhaXml
      .replace(/<w:trHeight w:val="\d+"/, '<w:trHeight w:val="' + altura + '"')
      .replace(/<w:sz w:val="\d+"\/><w:szCs w:val="\d+"\/>/g, '<w:sz w:val="' + sz + '"/><w:szCs w:val="' + sz + '"/>')
      .replace(/<w:spacing w:before="\d+" w:after="\d+"\/>/g, '<w:spacing w:before="' + sp + '" w:after="' + sp + '"/>');
  }

  function escalar(xml, de, fator, minimo) {
    return xml.split(de).join(String(Math.max(minimo || 0, Math.round(parseInt(de.replace(/\D/g, ""), 10) * fator))));
  }

  // Aplica o nível ao XML do modelo (ANTES de expandir as linhas de funcionários).
  function aplicarNivel(xml, nivel) {
    var out = xml;

    // 1) separa a tabela de funcionários (tem a linha modelo <<nome>>)
    var lm = acharLinha(out, "&lt;&lt;nome&gt;&gt;");
    if (!lm) throw new Error("Linha modelo <<nome>> não encontrada.");
    var ti = out.lastIndexOf("<w:tbl>", lm.ini);
    var tf = out.indexOf("</w:tbl>", lm.fim) + 8;
    var antes = out.slice(0, ti), tab = out.slice(ti, tf), depois = out.slice(tf);

    // 2) demais partes do documento (blocos de cima, espaços, assinaturas)
    function restante(x) {
      x = margensTabela(x, nivel.mgl);
      x = x.replace(/w:line="(\d+)" w:lineRule="exact"/g, function (_, v) {
        return 'w:line="' + Math.max(10, Math.round(v * nivel.esp)) + '" w:lineRule="exact"';
      });
      x = x.replace(/<w:trHeight w:val="(\d+)" w:hRule="atLeast"\/>/g, function (_, v) {
        v = parseInt(v, 10);
        var novo = v === 1500 ? nivel.assin : Math.max(240, Math.round(v * nivel.top));
        return '<w:trHeight w:val="' + novo + '" w:hRule="atLeast"/>';
      });
      return x;
    }
    antes = restante(antes);
    depois = restante(depois);

    // 3) tabela de funcionários: linha modelo e cabeçalho
    tab = margensTabela(tab, nivel.mar);
    var l1 = acharLinha(tab, "&lt;&lt;nome&gt;&gt;");
    tab = tab.slice(0, l1.ini) + ajustarLinhaTabela(l1.xml, nivel.sz, nivel.sp, nivel.trh) + tab.slice(l1.fim);
    var l0 = acharLinha(tab, ">NOME<");
    if (l0) tab = tab.slice(0, l0.ini) + ajustarLinhaTabela(l0.xml, Math.min(18, nivel.sz), nivel.sp, nivel.hdr) + tab.slice(l0.fim);

    out = antes + tab + depois;

    // 4) margem de cima da página acompanha o tamanho do logo
    var altLogo = Math.round(LOGO_ALTURA_EMU * nivel.logo / 635);   // EMU -> twips
    out = out.replace(/(<w:pgMar w:top=")\d+(")/, '$1' + (DIST_CABECALHO + altLogo + 200) + '$2');
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
