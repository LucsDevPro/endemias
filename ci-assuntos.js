// ============================================================
// Catálogo de ASSUNTOS da Comunicação Interna.
//
// Para criar um assunto novo, copie um bloco abaixo e mude:
//   id        nome interno (sem espaços)
//   botao     texto do botão na tela
//   assunto   texto que vai depois de "ASSUNTO:" (o campo pode ser "livre")
//   campos    o que a pessoa precisa preencher: "agentes", "datas", "motivo", "assuntoLivre", "texto"
//   paragrafos(c)  devolve a lista de parágrafos do documento. Cada parágrafo é uma lista de
//                  trechos { t: "texto", b: true/false (negrito) }.
//                  Para uma linha de lista ("- Nome"), marque o parágrafo com p.lista = true.
//
// c traz: c.nomes (lista de nomes já formatados), c.datas (dd/mm/aaaa em ordem),
//         c.texto, c.assuntoLivre, c.motivo (opcional), e os ajudantes c.juntar(lista) -> "a, b e c",
//         c.n (quantos agentes), c.d (quantas datas).
// Enquanto faltar algo, use os marcadores {NOMES DOS AGENTES} e {DATAS}: eles aparecem em
// destaque no modelo e o botão "Gerar" avisa que ainda falta preencher.
// ============================================================
window.CI_ASSUNTOS = [
  {
    id: "rotina-6h",
    botao: "Alteração de rotina de trabalho",
    assunto: "ALTERAÇÃO DE ROTINA DE TRABALHO",
    campos: ["agentes", "datas", "motivo"],
    paragrafos: function (c) {
      var plural = c.n > 1;
      // lista de nomes: um por linha, começando com hífen (item.lista = true)
      var lista = (c.n ? c.nomes : ["{NOMES DOS AGENTES}"]).map(function (n) {
        var p = [{ t: "- " }, { t: n, b: true }];
        p.lista = true;
        return p;
      });
      var intro = [
        { t: "Informamos que, por demanda e necessidade operacional do Setor de Endemias e Vetores" + (c.motivo ? ", em razão " + c.motivo : "") + ", " + (plural ? "os agentes abaixo relacionados terão" : "o agente abaixo relacionado terá") + " sua rotina de trabalho alterada, excepcionalmente, para jornada de 6 (seis) horas diárias, das 07h às 13h, " + (c.d > 1 ? "nas seguintes datas: " : "na seguinte data: ") },
        { t: c.d ? c.juntar(c.datas) : "{DATAS}", b: true },
        { t: "." }
      ];
      var fim = [{ t: "A alteração ocorrerá conforme a necessidade do setor, visando atender às demandas operacionais e à organização das atividades." }];
      return [intro].concat(lista, [fim]);
    }
  },
  {
    id: "livre",
    botao: "✍ Texto livre",
    assunto: "",
    campos: ["assuntoLivre", "texto"],
    paragrafos: function (c) {
      var linhas = String(c.texto || "").split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
      // **trecho** = negrito
      function trechos(l) {
        var out = [], re = /\*\*([^*]+)\*\*/g, i = 0, m;
        while ((m = re.exec(l))) { if (m.index > i) out.push({ t: l.slice(i, m.index) }); out.push({ t: m[1], b: true }); i = re.lastIndex; }
        if (i < l.length) out.push({ t: l.slice(i) });
        return out.length ? out : [{ t: l }];
      }
      return linhas.length ? linhas.map(trechos) : [[{ t: "{TEXTO DA COMUNICAÇÃO}" }]];
    }
  }
];
