// ============================================================
// Catálogo de ASSUNTOS da Comunicação Interna.
//
// Para criar um assunto novo, copie um bloco abaixo e mude:
//   id        nome interno (sem espaços)
//   botao     texto do botão na tela
//   assunto   texto que vai depois de "ASSUNTO:" (o campo pode ser "livre")
//   campos    o que a pessoa precisa preencher: "agentes", "datas", "assuntoLivre", "texto"
//   paragrafos(c)  devolve a lista de parágrafos do documento. Cada parágrafo é uma lista de
//                  trechos { t: "texto", b: true/false (negrito) }.
//
// c traz: c.nomes (lista de nomes já formatados), c.datas (dd/mm/aaaa em ordem),
//         c.texto, c.assuntoLivre, e os ajudantes c.juntar(lista) -> "a, b e c",
//         c.n (quantos agentes), c.d (quantas datas).
// Enquanto faltar algo, use os marcadores {NOMES DOS AGENTES} e {DATAS}: eles aparecem em
// destaque no modelo e o botão "Gerar" avisa que ainda falta preencher.
// ============================================================
window.CI_ASSUNTOS = [
  {
    id: "rotina-6h",
    botao: "Alteração de rotina de trabalho",
    assunto: "ALTERAÇÃO DE ROTINA DE TRABALHO",
    campos: ["agentes", "datas"],
    paragrafos: function (c) {
      var plural = c.n > 1;
      return [
        [
          { t: "Informamos que, por demanda e necessidade operacional do Setor de Endemias e Vetores, " + (plural ? "os agentes " : "o agente ") },
          { t: c.n ? c.juntar(c.nomes) : "{NOMES DOS AGENTES}", b: true },
          { t: (plural ? " terão" : " terá") + " sua rotina de trabalho alterada, excepcionalmente, para jornada de 6 (seis) horas diárias, das 07h às 13h, " + (c.d > 1 ? "nas seguintes datas: " : "na seguinte data: ") },
          { t: c.d ? c.juntar(c.datas) : "{DATAS}", b: true },
          { t: "." }
        ],
        [
          { t: "A alteração ocorrerá conforme a necessidade do setor, visando atender às demandas operacionais e à organização das atividades." }
        ]
      ];
    }
  },
  {
    id: "livre",
    botao: "✍ Texto livre",
    assunto: "",
    campos: ["assuntoLivre", "texto"],
    paragrafos: function (c) {
      var linhas = String(c.texto || "").split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
      return linhas.length ? linhas.map(function (l) { return [{ t: l }]; }) : [[{ t: "{TEXTO DA COMUNICAÇÃO}" }]];
    }
  }
];
