# Painel de Endemias

Central de acesso rápido aos sistemas usados no dia a dia do combate a endemias: ponto, escala, veículos, manutenção, visitas e monitoramento de campo.

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

Sentinela e LIRAa ficam destacados em um painel "ao vivo" no topo da página, por serem as ferramentas de monitoramento em tempo real.

## Estrutura

```
painel-endemias/
├── index.html            # título, cartões e o modal do Gerador de Folga
├── style.css              # visual institucional + estilos do modal
├── folga.js                # lógica do Gerador de Folga (lista de funcionários, datas, geração do .docx)
├── assets/
│   ├── logo-ponta-pora.png
│   └── modelo-folga.docx   # modelo Word com as tags <<ci>>, <<hoje>> e a tabela de funcionários
└── README.md
```

Visual institucional em tema claro, com as cores da logo da Prefeitura de Ponta Porã (azul-marinho, azul, verde e amarelo). Barra superior com a logo oficial, título e subtítulo, e os sistemas em cartões pequenos e compactos. Sentinela e LIRAa recebem um selo "Ao vivo" por serem os monitoramentos em tempo real.

## Gerador de Folga

O último cartão do painel ("Gerador de Folga") não é um link — ele abre uma janela dentro do próprio site com:

- **Número da CI** e a data de hoje (preenchida automaticamente).
- **Lista de funcionários** com busca, filtro por cargo, edição do cargo de cada um e botão para adicionar/remover funcionário.
- **Exportar lista / Importar lista / Restaurar padrão**: a lista de funcionários fica salva no navegador (localStorage) — ela não é enviada a nenhum servidor, então **fica salva só naquele navegador/computador**. Use "Exportar lista" para baixar um `.json` de backup e "Importar lista" para carregar esse backup em outro navegador ou computador.
- **Adicionar data**: selecione os funcionários na lista, escolha uma data e clique em "Adicionar data" — pode repetir para adicionar várias datas à mesma pessoa.
- **Gerar documento (.docx)**: baixa o documento Word já preenchido, no mesmo formato do `modelofolga.docx` original, com CI, data, e a tabela de funcionários/cargo/datas.

### Como funciona por baixo dos panos

O botão usa duas bibliotecas gratuitas e de código aberto, carregadas via CDN (por isso é necessário estar com internet ao gerar o documento):

- [PizZip](https://github.com/open-xml-templating/pizzip) — abre o `.docx` (que é um arquivo zip).
- [Docxtemplater](https://github.com/open-xml-templating/docxtemplater) — substitui as tags `<<ci>>`, `<<hoje>>` e repete a linha da tabela para cada funcionário selecionado, usando apenas os recursos gratuitos da biblioteca (sem módulos pagos).

O arquivo `assets/modelo-folga.docx` é uma versão do seu `modelofolga.docx` original com uma tabela já pronta no lugar da tag `<<tabela>>`, contendo as tags de repetição (`<<#funcionarios>>` ... `<</funcionarios>>`) que o Docxtemplater usa para gerar uma linha por funcionário. Se quiser ajustar o layout do documento (fontes, cores, textos fixos), edite esse arquivo no Word — só tome cuidado para não apagar as tags.

## Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex.: `painel-endemias`).
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

## Editar os links depois

Todos os links estão em `index.html`, dentro das tags `<a class="card" href="...">`. Basta trocar o endereço no atributo `href` de cada cartão (e o texto dentro de `<span class="card__label">` para trocar a legenda).

## Rodar localmente

Não precisa de servidor: basta abrir `index.html` no navegador.
