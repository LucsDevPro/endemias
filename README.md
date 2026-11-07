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
| **Mapeamento Ovitrampas** (novo) | Painel ao vivo das ovitrampas | https://lucsdevpro.github.io/Ovitrampas/ |
| Sies | Controle de inseticida | http://sies.saude.gov.br/ |
| Montar Escala | Plantões | https://smsapp.com.br/rh/login_plantao.php |
| Central | Portal central do sistema | https://www.smsapp.com.br/inicio/index.php |
| **Compras** (pedidos abertos dia 20 a 28) | Pedidos ao almoxarifado | https://smsapp.com.br/almoxarifado/pedidos.php |
| **Gerador de Folga** | Gera a Comunicação Interna de folga (página própria) | `folga.html` |
| **Gerador de Férias** | Gera vários Requerimentos de Férias de uma vez, em lote (página própria) | `ferias.html` |
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
├── clima-core.js                # dados da previsão (Centro, vários modelos)
├── weather.js                   # painel da previsão
├── tema.css / efeitos.js        # visual escuro + efeitos da tela inicial
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

1. Abre o `.docx` modelo com o **[JSZip](https://stuk.github.io/jszip/)** (única biblioteca externa; um build oficial dela vem empacotado no arquivo `jszip.local.js` do próprio projeto — não depende de internet nem de CDN pra gerar o documento).
2. Lê o XML do documento (e cabeçalhos/rodapés) e troca as tags pelo valor preenchido no formulário.
3. No caso da Folga, antes disso ele localiza a linha da tabela que contém `<<nome>>` e a duplica — uma cópia por funcionário selecionado, cada uma com suas próprias tags trocadas — depois recoloca essas linhas no lugar da linha-modelo.
4. Gera o `.docx` final (com compressão, para o Word não reclamar de arquivo corrompido) e dispara o download.

No modo lote do Férias, o modelo é lido **uma vez só** e reaproveitado para todos os servidores. Para o "único .docx", a função `mesclarDocumentos` junta o corpo de cada requerimento separado por uma quebra de página (e tira os marcadores que não podem se repetir num mesmo arquivo, como os *bookmarks*).

Um detalhe técnico que gerou o bug da versão anterior: dentro do XML de um `.docx`, o texto de uma tag como `<<ci>>` não fica gravado como `<<ci>>` literal — o Word grava como `&lt;&lt;ci&gt;&gt;`, porque `<` e `>` são caracteres especiais em XML. O `docx-utils.js` já cuida disso (desfaz essa "escapagem" antes de procurar a tag, e refaz depois de substituir), então tanto tags `<<assim>>` quanto `{{assim}}` funcionam.

Se quiser ajustar o layout de qualquer um dos dois documentos (fontes, cores, textos fixos), edite o `.docx` correspondente em `assets/` no Word — só tome cuidado para não apagar nem "quebrar" as tags ao editar por perto delas.

## Gerador de Folga (`folga.html`)

Feito para lançar **folgas de vários funcionários de uma vez**, com várias datas por pessoa.

- **Número da CI** — digite só o número (o modelo já tem "/2026" fixo no texto; se o ano virar, edite esse texto fixo direto no `modelo-folga.docx`).
- **Sempre uma folha só** — o `folga-layout.js` mede quantos funcionários e quantas datas há e escolhe, entre 6 níveis, o mais confortável que ainda cabe numa folha A4 (reduz fonte, altura das linhas, espaços, parágrafos vazios e o tamanho dos logos do cabeçalho; as assinaturas ficam logo abaixo da tabela). Testado no LibreOffice: ~10 funcionários cabem com letra de ~8 pt; até ~18 com 1 data cada em letra de 7 pt. Se nem o nível mais compacto couber, a página avisa que o documento sairá com 2 páginas. Para mudar os limites, edite `NIVEIS` no topo do arquivo.
- **Selecionar rápido** — a busca ignora acentos. Dê **Enter** quando sobrar um só resultado para marcar a pessoa e já limpar a busca (digitar nome → Enter → próximo). Clicar em qualquer parte da linha também marca. Há **Marcar todos (os da busca)**, **Desmarcar todos** e **📋 Colar lista de nomes**: cole os nomes (um por linha, pode ser parte do nome, sem acento, com numeração) e todos são marcados de uma vez; o painel avisa quem não foi encontrado ou quem é ambíguo.
- **Datas** — monte a lista de datas a lançar: **＋ Data** (uma por vez; Enter também inclui) ou **＋ Período** (de–até, com a opção "só dias úteis"; máximo de 62 dias por vez). Matutino/vespertino vale para as datas incluídas naquele momento, então dá para misturar. Aí clique em **Adicionar aos selecionados**: todas as datas entram para todos os marcados de uma vez. Se a pessoa já tem aquele dia, o novo valor substitui o antigo (manhã e tarde do mesmo dia podem coexistir). Feriados não são descontados automaticamente.
- **Desmarcar depois de adicionar** — vem ligado, para já marcar o próximo grupo (com outras datas). Desligue se quiser manter os mesmos selecionados.
- **Prévia** — um cartão por funcionário com as datas; dá para remover uma data ou a pessoa inteira. Mostra o total de funcionários e de folgas.
- **Rascunho automático** — as folgas da prévia e o número da CI ficam guardados neste navegador (só nomes e datas, nada sensível) e voltam se a página for recarregada. "Limpar tudo" apaga o rascunho.
- **Lista de funcionários** — busca, filtro por cargo, edição do cargo, adicionar/remover. **Exportar lista / Importar lista / Restaurar padrão**: a lista fica salva no navegador (localStorage), **só naquele navegador/computador**; use "Exportar lista" para baixar um `.json` de backup e "Importar lista" para carregar em outro lugar.
- **Gerar documento (.docx)** — um único Word com CI, data e a tabela de funcionários/cargo/datas. O arquivo se chama `Ci - 015 - Folga <Nome>.docx` (1 pessoa) ou `Ci - 015 - Folga 12 agentes.docx` (várias).

## Gerador de Férias (`ferias.html`)

Feito para lançar **vários requerimentos de uma vez**: você escolhe os servidores, ajusta o que for diferente de um para outro e gera tudo com um clique.

**Passo a passo:**

1. **Planilha de funcionários** — carregue o `.csv` (colunas Matrícula, Nome, Admissão e CPF; uma coluna **Cargo** é opcional) ou, se configurado, use "Carregar planilha do Google". O arquivo pode estar em UTF-8 ou no padrão do Excel em português (acentos são reconhecidos nos dois). A planilha **não fica salva no site nem é enviada a lugar nenhum**: é lida só dentro do navegador e some ao fechar ou recarregar a página.
2. **Escolha os servidores** — a lista da planilha tem busca (por nome ou matrícula, sem precisar de acento), caixas de marcar, "Marcar todos" e o botão **Adicionar à lista**. Atalho: digitou o nome e sobrou **um só resultado**? Aperte **Enter** que ele já entra na lista. Quem já está na lista aparece como "na lista" e não entra duas vezes.
3. **Padrões do lote** — cargo, período aquisitivo, 15 ou 30 dias, início do gozo e data do requerimento. Valem para quem for adicionado depois; o botão **Aplicar a todos da lista** atualiza também quem já estava lá.
4. **Lista de requerimentos** — cada servidor é um cartão de duas linhas (identificação e dados das férias). Tudo é editável por servidor; o **fim do gozo é calculado sozinho** (início + dias − 1). Campos em branco ficam em vermelho na hora de gerar. Dá para remover um servidor (✕) ou adicionar alguém **manualmente**, sem planilha.
5. **Gerar** — o botão principal muda conforme a lista:
   - **1 servidor** → baixa o `.docx` direto;
   - **vários** → baixa um **`.zip` com um `.docx` por servidor** (nomes sem acento, ex.: `requerimento_ferias_JOSE_DE_OLIVEIRA.docx`);
   - **"Gerar um único .docx"** → um só arquivo com **um requerimento por página**, pronto para imprimir de uma vez.

**Período aquisitivo automático:** quando o padrão está em "Automático (pela admissão)", o sistema sugere o **último ciclo completo** a partir da data de admissão (ex.: admissão em 15/03/2018, em novembro de 2026 → `2025/2026`). Quem foi admitido há menos de um ano ainda não fechou nenhum ciclo, então o período fica em branco e você precisa escolher à mão. É uma **sugestão**: confira antes de gerar e, se a regra do setor for outra, escolha o período na própria linha (ou use "Escolher servidor por servidor" nos padrões).

**Privacidade:** a lista de requerimentos também vive só na memória da aba — nada é gravado. Por isso o navegador pergunta antes de fechar a página com a lista preenchida.

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
7. No projeto, abra `ferias-config.js` e cole a URL em `APPS_SCRIPT_URL` (dentro de `FERIAS_CONFIG`). Enquanto estiver vazio (`""`), o botão do Google fica escondido.
8. Publique o site de novo (`git push`) — o botão "Carregar planilha do Google" vai aparecer sozinho em `ferias.html`. A página só aceita a resposta se ela vier de um endereço do Google (`google.com` ou `googleusercontent.com`).

**Um ponto honesto sobre segurança:** isso não é uma "caixa-forte" — é um controle de acesso (só quem estiver logado numa conta autorizada consegue os dados), não uma forma de esconder o CPF de quem já tem permissão de usar a ferramenta. Se alguém autorizado abrir as ferramentas do navegador, consegue ver os dados que o próprio navegador dele recebeu — isso é inerente a qualquer ferramenta que precise exibir o CPF para preencher o documento, com ou sem essa configuração. O upload manual continua funcionando em paralelo, mesmo depois de configurar isso — é só uma alternativa mais rápida, não uma substituição.

**Não testei esse fluxo de ponta a ponta** (não tenho como implantar um Apps Script daqui). Testei separadamente o upload manual (funcionando) e revisei o código do `.gs` com cuidado, mas antes de confiar nele no dia a dia, faça um teste com uma conta de teste e confirme que a planilha chega certinho.

## Comunicação Interna (`ci.html`)

- **Número da CI** (mesmo padrão do Gerador de Folga: só o número, o modelo já tem "/2026" fixo) e **Para (Secretaria)** (vem preenchido com "Secretaria Municipal de Saúde", editável).
- **Texto**: digite direto na caixa de texto, ou clique no 🎤 e dite — o microfone usa o reconhecimento de voz nativo do navegador (funciona bem no Chrome), não passa por nenhum servidor nem precisa de configuração.
- **✨ Melhorar texto**: corrige o texto em camadas, e **mostra exatamente o que mudou** (com o botão **↩ Desfazer**):
  1. *Ajustes básicos, sempre, sem internet*: espaços duplicados, espaço antes/depois da pontuação, letra maiúscula no início das frases e ponto final.
  2. *Ortografia e gramática* pelo serviço gratuito **LanguageTool** (sem chave nem cadastro). Só aplica correções de escrita (ortografia, gramática, pontuação, maiúsculas); **não mexe em nomes próprios, siglas e palavras em CAIXA ALTA**, ignora sugestões de estilo e nunca aplica duas correções sobrepostas.
  3. *Reescrita + assunto sugerido por IA* (Gemini, Claude ou outra compatível com a OpenAI — você escolhe) — opcional, só se configurar o Apps Script (próxima seção).

  Se o LanguageTool não responder (sem internet, **firewall/proxy da rede bloqueando `api.languagetool.org`**, limite de uso do serviço gratuito), os ajustes básicos continuam valendo e a tela diz o motivo. Sem configurar a IA, preencha o Assunto à mão — o resto funciona normal.
- **Assunto**: preenchido pela IA (se configurada) ou digitado por você — sempre editável antes de gerar.
- **Gerar Comunicação (.docx)**: preenche as 5 tags do `assets/modelo-ci.docx` e baixa o documento.

O modelo em `assets/modelo-ci.docx` é o que você enviou (`modeloci.doc`) convertido para `.docx` — só troquei o formato do arquivo (de `.doc` para `.docx`, que é o que o site consegue preencher), sem tocar em texto, formatação ou nas tags. Se quiser ajustar o layout, edite esse `.docx` no Word.

### Melhorar texto com IA (opcional)

Mesma lógica de "opcional, protegido, não obrigatório" da planilha de férias: a chave de IA nunca fica no site. Reaproveita o mesmo Apps Script (`apps-script/Codigo.gs`) usado pela planilha de férias — se você já configurou aquele, é só adicionar esta parte nele.

**Escolha a IA** (propriedade `AI_PROVIDER`; o site não precisa saber qual é — a troca é só no Apps Script):

| `AI_PROVIDER` | Serviço | Onde gerar a chave | `AI_MODEL` |
|---|---|---|---|
| `gemini` (padrão) | Google Gemini | https://aistudio.google.com/apikey (tem nível gratuito) | opcional — padrão `gemini-2.5-flash` |
| `claude` | Anthropic Claude | https://console.anthropic.com (cobrança por uso) | opcional — padrão `claude-haiku-5-5` |
| `openai` | OpenAI ou qualquer serviço compatível (Groq, OpenRouter, etc.) | no painel do serviço | **obrigatório** (ex.: `llama-3.3-70b-versatile` no Groq) |

Para `openai`, defina também `AI_BASE_URL` se não for a própria OpenAI (ex.: Groq → `https://api.groq.com/openai/v1`; OpenRouter → `https://openrouter.ai/api/v1`).

**Passo a passo:**

1. Gere a chave de API do serviço escolhido (tabela acima).
2. No projeto do Apps Script (o mesmo do passo a passo da planilha, ou um novo): confirme que o código tem a função `doPost` — está incluída no `Codigo.gs`.
3. Menu **⚙️ Configurações do projeto → Propriedades do script → Adicionar propriedade**:
   - `AI_PROVIDER` = `gemini`, `claude` ou `openai` (sem ela, usa `gemini`).
   - `AI_API_KEY` = sua chave do passo 1.
   - `AI_MODEL` = (opcional, obrigatório no `openai`) nome do modelo. Se um modelo for descontinuado, basta trocar o nome aqui, sem mexer no código.
   - `AI_BASE_URL` = só para `openai` fora da OpenAI.
   - `CI_TOKEN` = uma senha simples de sua escolha (recomendado — veja o aviso abaixo).
   - *Quem já tinha `GEMINI_API_KEY` / `GEMINI_MODEL` configurados não precisa mudar nada: continuam valendo.*
4. **Implantar → Gerenciar implantações → editar (lápis) → Nova versão → Implantar** (para o `doPost` novo entrar em vigor na mesma URL de sempre).
5. Copie a URL (a mesma `/exec` de sempre) e cole em `ci-config.js`:
   - `AI_ENDPOINT_URL`: a URL.
   - `AI_TOKEN`: o mesmo valor que você colocou em `CI_TOKEN` no passo 3.
6. Publique o site de novo — o botão "✨ Melhorar texto" passa a usar a IA.

Para trocar de IA depois, mude só `AI_PROVIDER`, `AI_API_KEY` e `AI_MODEL` e faça uma **Nova versão** da implantação; o site continua igual. Se a IA falhar (chave errada, cota, modelo inexistente), a tela mostra o motivo devolvido pelo serviço. Para voltar à correção gratuita, sem IA, é só deixar `AI_ENDPOINT_URL` vazio em `ci-config.js`.

**Aviso sobre o "token"**: diferente do login do Google (que usa a planilha de férias), aqui não tem tela de login — é uma chamada direta. O `CI_TOKEN`/`AI_TOKEN` é só uma senha simples enviada junto do pedido; ela fica visível para quem abrir o código do site (não é um segredo real), mas evita que alguém ache a URL por acidente e gaste sua cota de IA à toa. A chave de verdade (`AI_API_KEY`) é a que fica protegida de verdade, porque essa nunca sai do lado do Google.

**Não testei esse fluxo de ponta a ponta** (não tenho como criar uma chave de API nem implantar o Apps Script daqui). Testei a lógica do `doPost` com um ambiente do Google simulado para os três provedores (formato de cada API, erros de chave/modelo/rede) e a geração do documento sem IA — mas nunca chamei os serviços reais. Faça um teste com uma chave sua antes de confiar nela no dia a dia.

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

O painel (`weather.js`) mostra **Agora** + próximos 5 dias para **Ponta Porã – Centro** (`-22.536, -55.726`). Os dados vêm de `clima-core.js`, que consulta a [Open-Meteo](https://open-meteo.com/) (gratuita, sem chave) com **vários modelos ao mesmo tempo** (ECMWF, ECMWF-IA, GFS, ICON, GEM) e usa a média aparada. A "chance de chuva" é quantos modelos concordam que chove (misturada com a probabilidade de conjunto) e os milímetros esperados; há aviso de chuva próxima. O botão **ver por modelo** mostra o que cada modelo previu, para comparar com outras fontes. Se um modelo errar sempre, apague a linha dele em `MODELOS` no `clima-core.js`.

Limites honestos: não existe API gratuita do Climatempo, então os números podem diferir dele (cada serviço usa modelos próprios). Se a busca com vários modelos falhar, volta sozinha ao modo simples; se tudo falhar, o painel não aparece. O fundo animado (`weather-bg.js`) usa o mesmo cache.

## Visual (`tema.css` + `efeitos.js`)

Tema escuro "agressivo" com as cores do logo (azul-marinho, azul, verde, amarelo): cantos chanfrados, listra de alerta, radar na tela inicial, holofote do mouse nos cards. O logo ganha uma placa clara por trás. Há também o **tema claro** (`tema-claro.css`), com as mesmas formas: o botão no topo de cada página alterna e o navegador lembra a escolha (`tema-toggle.js`). O padrão é o escuro. Para voltar ao visual antigo, remova os `<link>` do `tema.css` e `tema-claro.css` das páginas. `efeitos.js` respeita "reduzir movimento".

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

## Modelo da Folga (assets/modelo-folga.docx)

Modelo refeito do zero: cabeçalho com o logo da Prefeitura de Ponta Porã (centralizado), título "COMUNICAÇÃO INTERNA", tabela de dados (Número/Data/De/Para), tabela de funcionários e tabela de assinaturas — todas com a mesma largura (9638 twips), bordas e fonte (Arial) padronizadas. O `folga-layout.js` ajusta fonte, espaços e logo automaticamente para caber tudo em uma folha A4.

## Painel da Folga — tela dividida

À esquerda, passo a passo (1 CI → 2 quem → 3 quando → 4 adicionar); à direita, o modelo A4 ao vivo (`folga-split.css`). O que ainda não foi adicionado aparece em amarelo; ✕ no modelo remove funcionário ou data. O selo mostra se cabe em 1 folha. No celular há abas "Preencher" / "Ver modelo".
