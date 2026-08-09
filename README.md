# Painel de Endemias

Central de acesso rápido aos sistemas usados no dia a dia do combate a endemias: ponto, escala, veículos, manutenção, visitas e monitoramento de campo — e dois geradores de documento (Folga e Férias).

Site estático em HTML/CSS/JS puro — sem dependências de build, pronto para publicar no **GitHub Pages**.

## Links reunidos

| Sistema | Uso | Link |
|---|---|---|
| Justificativa | Justificar ausência/pendência de ponto | https://smsapp.com.br/rh/login_justificar.php |
| Serviços Veiculares | Frota e combustível | https://smsapp.com.br/nexus/servico/ |
| Ci – Manutenção (e-Saúde) | Chamados internos | https://pontapora.esaude.genesiscloud.tec.br/login |
| Evisita | Visitas domiciliares | https://evisita.saude.ms.gov.br/login |
| Eagente | Produtividade em campo | https://eagentes.saude.ms.gov.br/login |
| Ahgora | Registro de ponto | https://app.ahgora.com.br/home |
| **Sentinela** (destaque) | Vigilância entomológica ao vivo | https://lucsdevpro.github.io/Sentinela/ |
| **LIRAa** (destaque) | Índice de infestação ao vivo | https://lucsdevpro.github.io/lira/ |
| Sies | Controle de inseticida | http://sies.saude.gov.br/ |
| Montar Escala | Plantões | https://smsapp.com.br/rh/login_plantao.php |
| **Gerador de Folga** | Gera a Comunicação Interna de folga (página própria) | `folga.html` |
| **Gerador de Férias** | Gera o Requerimento de Férias (página própria) | `ferias.html` |

Sentinela e LIRAa ficam destacados em um painel "ao vivo", por serem as ferramentas de monitoramento em tempo real.

## Estrutura

```
painel-endemias/
├── index.html              # painel principal — título e cartões (links)
├── folga.html               # página do Gerador de Folga
├── ferias.html               # página do Gerador de Férias
├── style.css                  # visual institucional (compartilhado pelas 3 páginas)
├── docx-utils.js               # motor de geração de .docx (compartilhado, ver abaixo)
├── folga.js                     # lógica da página de Folga
├── ferias.js                     # lógica da página de Férias
├── assets/
│   ├── logo-ponta-pora.png
│   ├── modelo-folga.docx         # modelo com as tags <<ci>>, <<hoje>>, <<nome>>...
│   └── modelo-ferias.docx        # modelo com as tags {{NOME}}, {{CPF}}...
└── README.md
```

Visual institucional em tema claro, com as cores da logo da Prefeitura de Ponta Porã (azul-marinho, azul, verde e amarelo). Os dois geradores viraram **páginas próprias** (`folga.html` e `ferias.html`), abertas a partir dos cartões do painel — em vez de uma janela por cima do painel, cada um tem a tela toda para si, com um link "← Painel" para voltar.

## Como funciona por baixo dos panos (`docx-utils.js`)

Os dois geradores usam a mesma técnica, comprovadamente simples: um `.docx` é, por dentro, um arquivo `.zip` com XML. O `docx-utils.js`:

1. Abre o `.docx` modelo com o **[JSZip](https://stuk.github.io/jszip/)** (única biblioteca externa, carregada via CDN — por isso é necessário estar com internet ao gerar o documento).
2. Lê o XML do documento (e cabeçalhos/rodapés) e troca as tags pelo valor preenchido no formulário.
3. No caso da Folga, antes disso ele localiza a linha da tabela que contém `<<nome>>` e a duplica — uma cópia por funcionário selecionado, cada uma com suas próprias tags trocadas — depois recoloca essas linhas no lugar da linha-modelo.
4. Gera o `.docx` final (com compressão, para o Word não reclamar de arquivo corrompido) e dispara o download.

Um detalhe técnico que gerou o bug da versão anterior: dentro do XML de um `.docx`, o texto de uma tag como `<<ci>>` não fica gravado como `<<ci>>` literal — o Word grava como `&lt;&lt;ci&gt;&gt;`, porque `<` e `>` são caracteres especiais em XML. O `docx-utils.js` já cuida disso (desfaz essa "escapagem" antes de procurar a tag, e refaz depois de substituir), então tanto tags `<<assim>>` quanto `{{assim}}` funcionam.

Se quiser ajustar o layout de qualquer um dos dois documentos (fontes, cores, textos fixos), edite o `.docx` correspondente em `assets/` no Word — só tome cuidado para não apagar nem "quebrar" as tags ao editar por perto delas.

## Gerador de Folga (`folga.html`)

- **Número da CI** — digite só o número (o modelo já tem "/2026" fixo no texto; se o ano virar, edite esse texto fixo direto no `modelo-folga.docx`).
- **Lista de funcionários** com busca, filtro por cargo, edição do cargo de cada um e botão para adicionar/remover funcionário.
- **Exportar lista / Importar lista / Restaurar padrão**: a lista fica salva no navegador (localStorage) — não é enviada a nenhum servidor, então **fica salva só naquele navegador/computador**. Use "Exportar lista" para baixar um `.json` de backup e "Importar lista" para carregar esse backup em outro navegador ou computador.
- **Adicionar data**: selecione os funcionários, escolha uma data e clique em "Adicionar data" — pode repetir para adicionar várias datas à mesma pessoa (elas entram na mesma célula, separadas por vírgula).
- **Gerar documento (.docx)**: baixa o Word já preenchido, com CI, data e a tabela de funcionários/cargo/datas.

## Gerador de Férias (`ferias.html`)

- **Planilha de funcionários (.csv)**: precisa ter as colunas Matrícula, Nome, Admissão e CPF (separadas por `;`). Escolha o arquivo a cada uso — **a planilha não fica salva no site nem é enviada a lugar nenhum**; ela só é lida dentro do navegador, na hora de gerar o documento, e some quando a página é fechada ou recarregada. Isso é proposital: como a planilha tem CPF (dado pessoal), ela não deve ficar gravada num repositório do GitHub, ainda mais se o repositório for público.
- Depois de carregar a planilha, escolha o funcionário num menu — os campos Nome, Matrícula, CPF e Admissão são preenchidos automaticamente (dá para editar à mão também).
- Preencha Cargo, Período aquisitivo, quantidade de dias (15 ou 30) e a data de início — a data de fim é calculada sozinha.
- **Gerar documento (.docx)**: baixa o Requerimento de Férias preenchido.

## Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex.: `painel-endemias`). **Se a planilha de CPF for um problema mesmo fora do repositório, tudo bem** — ela nunca é enviada para lá; só os arquivos desta pasta vão para o repositório.
2. Envie estes arquivos para a raiz do repositório:
   ```bash
   git init
   git add .
   git commit -m "Painel de Endemias"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/painel-endemias.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings → Pages**.
4. Em **Source**, selecione a branch `main` e a pasta `/root`.
5. Salve. Em alguns minutos o site estará em:
   `https://SEU-USUARIO.github.io/painel-endemias/`

## Editar os links do painel principal

Todos os links estão em `index.html`, dentro das tags `<a class="card" href="...">`. Basta trocar o endereço no atributo `href` de cada cartão (e o texto dentro de `<span class="card__label">` para trocar a legenda).

## Rodar localmente

Os geradores usam `fetch()` para carregar o `.docx` modelo, o que não funciona abrindo o arquivo direto (`file://`) em alguns navegadores. Para testar localmente, rode um servidor simples na pasta do projeto:

```bash
python3 -m http.server 8000
```

E acesse `http://localhost:8000`.
