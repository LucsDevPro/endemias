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
| **Mapeamento Ovitrampas** (novo) | Painel ao vivo das ovitrampas | https://patrickdias123.github.io/Ovitrampas-Ponta-Por-/ |
| Sies | Controle de inseticida | http://sies.saude.gov.br/ |
| Montar Escala | Plantões | https://smsapp.com.br/rh/login_plantao.php |
| Central | Portal central do sistema | https://www.smsapp.com.br/inicio/index.php |
| **Compras** (pedidos abertos dia 20 a 28) | Pedidos ao almoxarifado | https://smsapp.com.br/almoxarifado/pedidos.php |
| **Gerador de Folga** | Gera a Comunicação Interna de folga (página própria) | `folga.html` |
| **Gerador de Férias** | Gera o Requerimento de Férias (página própria) | `ferias.html` |
| **Comunicação Interna** | Gera uma CI a partir de texto digitado/ditado, com revisão opcional por IA (página própria) | `ci.html` |
| **Lançar Ovitrampas** | Bookmarklet que preenche e envia em lote os lançamentos no contaovos.com (página própria) | `ovitrampas.html` |

Sentinela e LIRAa ficam destacados em um painel "ao vivo", por serem as ferramentas de monitoramento em tempo real.

Os cartões do painel principal ficam organizados em ordem alfabética, em 3 seções: **Sistemas** (todos os links do dia a dia, incluindo Central e Compras), **Monitoramento** (Sentinela, LIRAa e Mapeamento Ovitrampas — em destaque, com um painel âmbar, selo "Ao vivo" no cabeçalho da seção (em vez de repetido em cada botão) e um ponto pulsante, no meio da página) e **Geradores** (os 4 geradores/ferramentas), por último.

Cada seção ajusta sozinha quantas colunas usar (`grid-layout.js`): o alvo é 5 cartões por fileira; seções com menos de 5 ficam numa fileira só, centralizada, com cartões do mesmo tamanho das fileiras cheias (não esticam para preencher 5 colunas vazias). Se uma seção crescer além de 5 e não for múltiplo exato, ele tenta 4 por linha para equilibrar melhor a última fileira. Isso é automático — se você adicionar ou remover cartões de uma seção, não precisa mexer em nada.

## Estrutura

```
painel-endemias/
├── index.html              # painel principal — título e cartões (links)
├── grid-layout.js            # ajusta sozinho a quantidade de colunas de cada fileira
├── fit-screen.js              # encolhe o painel pra caber na tela sem rolagem
├── weather.js                   # previsão do tempo (Open-Meteo, sem chave)
├── auto-reload.js                 # recarrega o painel sozinho a cada 60min
├── folga.html               # página do Gerador de Folga
├── ferias.html               # página do Gerador de Férias
├── ci.html                    # página da Comunicação Interna
├── ovitrampas.html             # página do Lançador de Ovitrampas (bookmarklet)
├── ovitrampas-core.js            # código do bookmarklet (carregado por ele, não pelo site)
├── ferias-config.js           # URL do Apps Script para a planilha (opcional)
├── ci-config.js                 # URL do Apps Script para a IA (opcional)
├── style.css                  # visual institucional (compartilhado pelas 4 páginas)
├── docx-utils.js               # motor de geração de .docx (compartilhado, ver abaixo)
├── folga.js                     # lógica da página de Folga
├── ferias.js                     # lógica da página de Férias
├── ci.js                          # lógica da página de Comunicação Interna
├── apps-script/
│   └── Codigo.gs                  # script do Google (opcional): planilha autenticada (doGet) + IA (doPost)
├── assets/
│   ├── logo-ponta-pora.png
│   ├── modelo-folga.docx         # modelo com as tags <<ci>>, <<hoje>>, <<nome>>...
│   ├── fogo-moldura.png           # moldura de fogo (border-image) do cartão Compras
│   ├── modelo-ferias.docx        # modelo com as tags {{NOME}}, {{CPF}}...
│   └── modelo-ci.docx             # modelo com as tags {{CI}}, {{DATAHOJE}}, {{Secretaria}}, {{Assunto}}, {{Texto}}
└── README.md
```

Visual institucional em tema claro, com as cores da logo da Prefeitura de Ponta Porã (azul-marinho, azul, verde e amarelo). Cada ferramenta é uma **página própria** (`folga.html`, `ferias.html`, `ci.html`, `ovitrampas.html`), aberta a partir dos cartões do painel principal — em vez de uma janela por cima do painel, cada uma tem a tela toda para si, com um link "← Painel" para voltar.

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

- **Planilha de funcionários**: duas formas de carregar —
  - **Upload manual (.csv)**: precisa ter as colunas Matrícula, Nome, Admissão e CPF (separadas por `;`). Escolha o arquivo a cada uso — **a planilha não fica salva no site nem é enviada a lugar nenhum**; ela só é lida dentro do navegador, na hora de gerar o documento, e some quando a página é fechada ou recarregada.
  - **Carregar do Google (opcional)**: um botão que abre uma janela de login do Google; só depois de logar com uma conta autorizada é que a planilha é enviada de volta para o site. Veja como configurar na seção abaixo. Enquanto não for configurado, esse botão fica escondido e só o upload manual aparece.
- Depois de carregar a planilha (de um jeito ou de outro), escolha o funcionário num menu — os campos Nome, Matrícula, CPF e Admissão são preenchidos automaticamente (dá para editar à mão também).
- Preencha Cargo, Período aquisitivo, quantidade de dias (15 ou 30) e a data de início — a data de fim é calculada sozinha.
- **Gerar documento (.docx)**: baixa o Requerimento de Férias preenchido.

### Carregar a planilha do Google (opcional)

Isso resolve o incômodo de selecionar o `.csv` toda vez, mas **é opcional** — o upload manual sozinho já é a opção mais segura e não exige nenhuma configuração. Só monte isso se valer a pena pra sua rotina.

Como funciona: a planilha fica numa Planilha Google sua (não no site, não no GitHub). Um script do Google (Apps Script, gratuito) só devolve os dados para quem estiver logado com uma conta autorizada — o Google barra o acesso antes mesmo do seu código rodar. O site nunca guarda essa planilha; ele só recebe os dados depois do login, numa janela pop-up, via `postMessage`.

**Passo a passo:**

1. Crie uma Planilha Google com as colunas na primeira linha: `Matricula`, `Nome`, `Admissao`, `CPF`.
2. Nessa planilha: menu **Extensões → Apps Script**.
3. Apague o código de exemplo e cole o conteúdo de [`apps-script/Codigo.gs`](apps-script/Codigo.gs) (está neste projeto).
4. No topo do script, edite:
   - `ALLOWED_EMAILS`: lista dos e-mails que podem acessar a planilha.
   - `ALLOWED_DOMAIN`: se a Prefeitura usa Google Workspace com domínio próprio (ex.: `pontapora.ms.gov.br`), coloque aqui — qualquer conta desse domínio também é autorizada.
   - `NOME_ABA`: nome da aba da planilha (por padrão, `"Página1"`).
5. Clique em **Implantar → Nova implantação → tipo "App da Web"**:
   - **Executar como**: Eu (sua conta).
   - **Quem pode acessar**: "Qualquer pessoa no domínio [seu domínio]" se vocês usam Workspace, ou "Qualquer pessoa" se forem contas Gmail comuns (nesse caso, a lista `ALLOWED_EMAILS` é a única barreira real — mantenha ela atualizada).
6. Copie a URL gerada (termina em `/exec`).
7. No projeto, abra `ferias-config.js` e cole a URL em `APPS_SCRIPT_URL`.
8. Publique o site de novo (`git push`) — o botão "Carregar planilha do Google" vai aparecer sozinho em `ferias.html`.

**Um ponto honesto sobre segurança:** isso não é uma "caixa-forte" — é um controle de acesso (só quem estiver logado numa conta autorizada consegue os dados), não uma forma de esconder o CPF de quem já tem permissão de usar a ferramenta. Se alguém autorizado abrir as ferramentas do navegador, consegue ver os dados que o próprio navegador dele recebeu — isso é inerente a qualquer ferramenta que precise exibir o CPF para preencher o documento, com ou sem essa configuração. O upload manual continua funcionando em paralelo, mesmo depois de configurar isso — é só uma alternativa mais rápida, não uma substituição.

**Não testei esse fluxo de ponta a ponta** (não tenho como implantar um Apps Script daqui). Testei separadamente o upload manual (funcionando) e revisei o código do `.gs` com cuidado, mas antes de confiar nele no dia a dia, faça um teste com uma conta de teste e confirme que a planilha chega certinho.

## Comunicação Interna (`ci.html`)

- **Número da CI** (mesmo padrão do Gerador de Folga: só o número, o modelo já tem "/2026" fixo) e **Para (Secretaria)** (vem preenchido com "Secretaria Municipal de Saúde", editável).
- **Texto**: digite direto na caixa de texto, ou clique no 🎤 e dite — o microfone usa o reconhecimento de voz nativo do navegador (funciona bem no Chrome), não passa por nenhum servidor nem precisa de configuração.
- **✨ Melhorar texto** (opcional): manda o texto para uma IA revisar ortografia/gramática/clareza e sugerir um Assunto curto — sem inventar informação. Só funciona se você configurar o Apps Script (próxima seção); sem configurar, o botão avisa e você preenche o Assunto à mão mesmo, o resto do gerador funciona normal.
- **Assunto**: preenchido pela IA (se configurada) ou digitado por você — sempre editável antes de gerar.
- **Gerar Comunicação (.docx)**: preenche as 5 tags do `assets/modelo-ci.docx` e baixa o documento.

O modelo em `assets/modelo-ci.docx` é o que você enviou (`modeloci.doc`) convertido para `.docx` — só troquei o formato do arquivo (de `.doc` para `.docx`, que é o que o site consegue preencher), sem tocar em texto, formatação ou nas tags. Se quiser ajustar o layout, edite esse `.docx` no Word.

### Melhorar texto com IA (opcional)

Mesma lógica de "opcional, protegido, não obrigatório" da planilha de férias: a chave de IA nunca fica no site. Reaproveita o mesmo Apps Script (`apps-script/Codigo.gs`) usado pela planilha de férias — se você já configurou aquele, é só adicionar esta parte nele.

**Passo a passo:**

1. Gere uma chave de API gratuita do Gemini (IA do Google) em **https://aistudio.google.com/apikey**.
2. No projeto do Apps Script (o mesmo do passo a passo da planilha, ou um novo): confirme que o código tem a função `doPost` — está incluída em `apps-script/Codigo.gs`.
3. Menu **⚙️ Configurações do projeto → Propriedades do script → Adicionar propriedade**:
   - `GEMINI_API_KEY` = sua chave do passo 1.
   - `CI_TOKEN` = uma senha simples de sua escolha (recomendado — veja o aviso abaixo).
4. **Implantar → Gerenciar implantações → editar (lápis) → Nova versão → Implantar** (para o `doPost` novo entrar em vigor na mesma URL de sempre).
5. Copie a URL (a mesma `/exec` de sempre) e cole em `ci-config.js`:
   - `AI_ENDPOINT_URL`: a URL.
   - `AI_TOKEN`: o mesmo valor que você colocou em `CI_TOKEN` no passo 3.
6. Publique o site de novo — o botão "✨ Melhorar texto" passa a funcionar.

**Aviso sobre o "token"**: diferente do login do Google (que usa a planilha de férias), aqui não tem tela de login — é uma chamada direta. O `CI_TOKEN`/`AI_TOKEN` é só uma senha simples enviada junto do pedido; ela fica visível para quem abrir o código do site (não é um segredo real), mas evita que alguém ache a URL por acidente e gaste sua cota de IA à toa. A chave de verdade (`GEMINI_API_KEY`) é a que fica protegida de verdade, porque essa nunca sai do lado do Google.

**Não testei esse fluxo de ponta a ponta** (não tenho como criar uma chave de API nem implantar o Apps Script daqui). Testei e confirmei que a geração do documento funciona perfeitamente sem a IA configurada (preenchendo o Assunto à mão) — essa parte é sólida. A parte da IA, revise o `doPost` no `Codigo.gs` e teste com uma chave de teste antes de confiar nela no dia a dia.

## Lançar Ovitrampas (`ovitrampas.html`)

Diferente dos outros três, este não gera um documento — é um **bookmarklet**: um favorito especial do navegador que, ao ser clicado *enquanto você está na tela de lançamento em lote do contaovos.com*, abre um painel flutuante por cima daquela página. Esse painel lê uma planilha (.xlsx/.xls/.csv/.tsv, sem cabeçalho, colunas: ID da ovitrampa · código da observação · nº de ovos) e clica nos botões de envio que já existem na página, um por um — poupando o trabalho de preencher campo por campo na mão.

A página `ovitrampas.html` explica o passo a passo e monta o bookmarklet automaticamente com o endereço certo do seu site (não tem nada fixo no código — funciona em qualquer domínio onde você publicar o projeto).

- **Como instalar**: arraste o botão azul da página para a barra de favoritos do navegador — uma vez só.
- **Como usar**: já logado no contaovos.com, na tela de lançamento em lote, clique no favorito, escolha a planilha, confira a tabela de conferência (IDs em vermelho não foram encontrados na página) e confirme o envio.
- **O que ele não faz**: não manda nada para fora do contaovos.com, não guarda login nem senha, não funciona em nenhuma outra página — só na tela específica de lançamento em lote (é ali que os campos que ele procura existem).
- `ovitrampas-core.js` é o código que o bookmarklet carrega toda vez que é clicado (direto do seu site, sempre a versão mais atual) — **não é chamado pelo `ovitrampas.html`**, só existe para o bookmarklet buscar.

Se o contaovos.com mudar o layout da tela de lançamento no futuro, esse script pode parar de achar os campos (ele procura por `.input_send_ovitrampa_data`, `.counting_eggs`, `.counting_observation_id` e `.counting_observation` na página) — nesse caso, ele avisa quais IDs não foram encontrados, mas não faz nada perigoso.

## Ajuste automático à tela (sem barra de rolagem)

O painel principal (`index.html`) mede sozinho quanto espaço o conteúdo precisa e a altura disponível na janela (`fit-screen.js`); se não couber, encolhe tudo proporcionalmente (título, cartões, tudo junto, texto incluso) até caber sem precisar rolar — nunca aumenta além do tamanho normal em telas grandes, e tem um limite mínimo de encolhimento (60%) para não deixar o texto ilegível em janelas extremamente baixas (nesse caso extremo, prefere deixar uma rolagem pequena a espremer demais). Funciona nos navegadores atuais (Chrome, Edge, Safari recente); em navegadores muito antigos sem suporte a isso, a página só volta a rolar normalmente — nada quebra. Esse ajuste é só do painel principal; as páginas dos geradores (que têm listas e formulários mais longos) continuam com rolagem normal, de propósito.

## Previsão do tempo

Uma faixa discreta no rodapé do painel principal mostra os próximos 5 dias (`weather.js`), usando a API pública e gratuita da [Open-Meteo](https://open-meteo.com/) — sem chave, sem cadastro, consultada direto pelo navegador para as coordenadas de Ponta Porã. Se a internet cair ou a API não responder, a faixa simplesmente não aparece (não trava nem mostra erro). Ela se atualiza sozinha a cada 30 minutos e também quando a aba volta a ficar visível (útil pra quem deixa a página aberta o dia inteiro).

## Recarregamento automático

O painel principal recarrega a própria página sozinho a cada 60 minutos (`auto-reload.js`) — útil pra quem deixa ele aberto numa tela o dia todo. **Só o painel principal faz isso** — as páginas dos geradores (Folga, Férias, Comunicação Interna, Ovitrampas) não recarregam sozinhas, de propósito, pra não perder o que alguém estiver preenchendo num formulário no meio do caminho.

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
