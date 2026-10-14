# Guia completo do projeto — Catálogo GLANZ Semi Joias

Este documento explica **o projeto inteiro, do zero**: o que ele é, quais linguagens e ferramentas usa, o que cada pasta e cada arquivo faz, como as partes se conectam, como o site chega ao celular da cliente e como fazer cada tarefa do dia a dia.

Ele foi escrito para alguém que nunca viu o projeto conseguir entender, manter e evoluir tudo sozinho. Os termos técnicos são explicados no **Glossário** (seção 3). Se encontrar uma palavra estranha, procure lá.

> Outros documentos do projeto:
> - [`README.md`](../README.md): resumo técnico em inglês (para recrutadores e outros desenvolvedores).
> - [`docs/store-guide.pt-BR.md`](store-guide.pt-BR.md): guia prático da loja (cadastrar peças, fotos, coleção, publicar).
>
> Este guia é o mais completo dos três: explica o *porquê* e o *como* de tudo.

---

## Sumário

1. [O que é o projeto](#1-o-que-é-o-projeto)
2. [O caminho completo, em uma figura](#2-o-caminho-completo-em-uma-figura)
3. [Glossário: os conceitos básicos](#3-glossário-os-conceitos-básicos)
4. [Linguagens e ferramentas usadas](#4-linguagens-e-ferramentas-usadas)
5. [Mapa das pastas](#5-mapa-das-pastas)
6. [Arquivo por arquivo](#6-arquivo-por-arquivo)
7. [Como cada funcionalidade funciona por dentro](#7-como-cada-funcionalidade-funciona-por-dentro)
8. [Tarefas do dia a dia, passo a passo](#8-tarefas-do-dia-a-dia-passo-a-passo)
9. [Publicação e hospedagem](#9-publicação-e-hospedagem)
10. [Decisões de design, compatibilidade e qualidade](#10-decisões-de-design-compatibilidade-e-qualidade)
11. [Regras e convenções do projeto](#11-regras-e-convenções-do-projeto)
12. [Problemas comuns e como resolver](#12-problemas-comuns-e-como-resolver)
13. [Cola rápida de comandos](#13-cola-rápida-de-comandos)
14. [Ideias para o futuro](#14-ideias-para-o-futuro)
15. [Histórico do projeto](#15-histórico-do-projeto)

---

## 1. O que é o projeto

É o **catálogo digital da GLANZ Semi Joias**, uma loja de semijoias de Petrolina-PE (Instagram: `@glanz_semijoiaspnz`).

- **Endereço do site:** https://glanzsemijoias.pages.dev/
- **Código:** repositório `BrunoSpt/glanz-catalog` no GitHub.
- **Para quem:** clientes da loja, quase todas no celular (muitas com iPhone), vindas do Instagram.

### Como a loja vende (e por que o site é assim)

O site **não tem carrinho nem pagamento**. A venda acontece no **Instagram Direct**:

1. A cliente navega pelas peças no site.
2. Toca em "Perguntar no Direct" numa peça, ou marca várias peças com o coração (lista de interesse) e envia todas de uma vez.
3. O Instagram abre com uma mensagem pronta ("Olá! Tenho interesse na peça: …" + o link da peça).
4. A loja responde e combina disponibilidade, pagamento e entrega.

### Particularidades do negócio que moldam o site

- **Peças únicas:** cada peça tem um exemplar só. Quando é vendida, fica marcada como "Vendida" e não pode ir para a lista de interesse.
- **Coleção de 2 em 2 meses:** as peças não vendidas voltam ao fornecedor e chega um lote novo. O site mostra "Coleção de setembro e outubro", calculado sozinho pela data.
- **Parcelamento:** acima de R$ 80 em 2x, acima de R$ 130 em 3x, acima de R$ 210 em 4x, sem juros. O site mostra isso nos cards, na página da peça e no total da lista.
- **Garantia:** 2 anos pelo fabricante; banho triplo em ouro 18k; pedras em zircônia.

### O que o site tem (funcionalidades)

| Funcionalidade | Onde aparece |
|---|---|
| Página inicial com foto de campanha, título da coleção atual, atalhos de categoria (círculos), busca, fileiras de peças por categoria, garantias e "Como comprar" | Home |
| Página de cada categoria (Anéis, Brincos, Colares, Pulseiras, Pingentes) com ordenação e filtros | `/rings/`, `/earrings/`… |
| Página própria de cada peça, com galeria, zoom em tela cheia, parcelas, garantias e botões | `/products/<nome-da-peca>/` |
| Busca instantânea | Lupa no cabeçalho e atalho na home |
| Lista de interesse (coração) enviada pelo Direct | Coração no cabeçalho |
| Parcelas nos cards | Abaixo do preço |
| Selos "Vendida", "Promoção", "Exemplo" | Sobre a foto |
| Página 404 que explica quando a peça saiu da coleção | Qualquer endereço inexistente |
| Prévia bonita quando o link é compartilhado (Open Graph) | WhatsApp, Instagram etc. |

---

## 2. O caminho completo, em uma figura

```
 VOCÊ (no computador)                          GITHUB                         CLOUDFLARE              CLIENTE
 ─────────────────────                         ──────                         ──────────              ───────
 edita os dados (JSON)                                                                                
 e/ou o código        ──git push──►  repositório glanz-catalog                                       
                                              │                                                       
                                              ▼                                                       
                                     GitHub Actions (robô)                                            
                                     1. instala as ferramentas                                        
                                     2. valida os dados                                               
                                     3. Eleventy gera o site (_site)                                  
                                     4. Playwright testa no "iPhone"                                   
                                        e no "Chrome"                                                 
                                     5. se tudo passou ──────────────►  Cloudflare Pages ──────►  celular abre
                                        (se falhou, nada é publicado)   guarda e entrega          glanzsemijoias
                                                                        o site pelo mundo          .pages.dev
```

Resumo em uma frase: **os dados das peças ficam em arquivos de texto; uma ferramenta (Eleventy) transforma esses dados em páginas prontas; um robô (GitHub Actions) testa e publica essas páginas num serviço gratuito (Cloudflare Pages), que entrega o site para quem acessa.**

---

## 3. Glossário: os conceitos básicos

### Web

- **Site estático:** site cujas páginas já estão prontas (arquivos HTML) antes de alguém visitar. Não há servidor "pensando" a cada visita, nem banco de dados. Vantagens: rápido, barato (grátis), seguro e simples. Este projeto é um site estático.
- **HTML:** a linguagem que descreve o *conteúdo e a estrutura* de uma página (títulos, textos, imagens, botões, links).
- **CSS:** a linguagem que descreve a *aparência* (cores, fontes, tamanhos, espaçamentos, layout para celular e computador).
- **JavaScript (JS):** a linguagem que dá *comportamento* à página no navegador (abrir a busca, guardar a lista de interesse, zoom das fotos, filtros).
- **Navegador:** o programa que abre sites (Safari, Chrome…). Cada navegador usa um "motor": **WebKit** (Safari/iPhone) e **Chromium** (Chrome, Edge).
- **URL / endereço:** ex.: `https://glanzsemijoias.pages.dev/rings/`.
- **Query string (parâmetros):** a parte depois do `?` num endereço, ex.: `?ordem=menor-preco&preco=80-130`. O site usa para lembrar ordenação e filtros.
- **Âncora:** a parte depois do `#`, que pula para um trecho da página, ex.: `/#como-comprar`.
- **Slug:** a versão "limpa" de um nome para usar em endereços: "Anel Laço" → `anel-laco` (sem acento, minúsculas, hífens).
- **Favicon:** o iconezinho na aba do navegador. **Apple touch icon:** o ícone quando a página é salva na tela inicial do iPhone.
- **Open Graph (OG):** etiquetas invisíveis no HTML que dizem ao WhatsApp/Instagram qual título, texto e imagem mostrar na prévia de um link.
- **Canonical:** etiqueta que diz ao Google qual é o endereço "oficial" de uma página (evita duplicatas como `/rings/?ordem=…`).
- **404:** o código de "página não encontrada".
- **localStorage:** um pequeno armazenamento dentro do navegador de cada pessoa. A lista de interesse fica salva ali, só no aparelho da cliente.
- **Clipboard (área de transferência):** onde fica o que se copia (Ctrl+C). O site copia a mensagem do Direct para a cliente colar.
- **`<dialog>`:** elemento de HTML para janelas sobrepostas (busca, lista, foto em tela cheia).
- **Responsivo / mobile-first:** a página se adapta ao tamanho da tela; foi pensada primeiro para o celular.

### Formatos de arquivo

- **JSON** (`.json`): formato de texto para dados, com chaves e valores: `{ "name": "Anel Laço", "price": 143.00 }`. Listas usam colchetes `[ ]`, textos ficam entre aspas, itens são separados por vírgula (e o último item **não** leva vírgula).
- **Markdown** (`.md`): texto com formatação simples (`#` para títulos, `**negrito**`). Usado nos guias e no README.
- **Nunjucks** (`.njk`): HTML com "lacunas" que o Eleventy preenche com os dados. Ex.: `{{ product.name }}` vira "Anel Laço"; `{% for product in products %}` repete um trecho para cada peça.
- **YAML** (`.yml`): formato de configuração usado pelo GitHub Actions.
- **WebP** (`.webp`): formato de imagem moderno, bem mais leve que JPG com a mesma qualidade. Todas as fotos do site são WebP.
- **SVG** (`.svg`): imagem descrita por formas (vetor), nítida em qualquer tamanho. O favicon e os ícones (coração, lupa…) são SVG.
- **PNG / JPG:** imagens comuns. Usadas no favicon de reserva, no ícone do iPhone e na imagem de compartilhamento.

### Desenvolvimento

- **Terminal:** janela onde se digitam comandos (no VS Code: menu Terminal → New Terminal).
- **Node.js:** programa que roda JavaScript fora do navegador, no computador. É o "motor" das ferramentas do projeto (Eleventy, testes, scripts de fotos).
- **npm:** o gerenciador de pacotes do Node. Instala as ferramentas e roda os atalhos de comando (`npm run build`, `npm test`…).
- **Pacote / dependência:** uma ferramenta pronta, feita por outras pessoas, que o projeto usa. Ficam na pasta `node_modules`.
- **Build ("gerar o site"):** transformar os dados e modelos em páginas HTML prontas, na pasta `_site`.
- **Módulo ES (ESM):** forma moderna de dividir JavaScript em arquivos que usam `import`/`export`. Todo o JS do projeto é assim.
- **Script:** um programa pequeno que automatiza uma tarefa (ex.: converter fotos).
- **Teste E2E (ponta a ponta):** um robô abre o site num navegador de verdade, clica e confere se tudo funciona como uma cliente usaria.

### Git e publicação

- **Git:** programa que guarda o histórico de todas as mudanças do projeto. Permite voltar atrás e trabalhar em paralelo.
- **Repositório (repo):** a pasta do projeto com todo o histórico do Git.
- **Commit:** um "ponto salvo" no histórico, com uma mensagem dizendo o que mudou.
- **Branch:** uma "cópia paralela" do projeto para preparar uma mudança sem mexer na versão principal. A principal se chama **`main`**.
- **Merge:** juntar as mudanças de uma branch na `main`.
- **Push:** enviar os commits do seu computador para o GitHub. **Pull:** trazer do GitHub para o computador.
- **GitHub:** site que guarda o repositório na nuvem. Também roda o robô de testes e publicação.
- **GitHub Actions:** o robô do GitHub que executa tarefas automáticas a cada push. Aqui: valida, gera, testa e publica.
- **CI/CD:** "Integração e Entrega Contínuas": testar e publicar automaticamente a cada mudança. É o que o GitHub Actions faz aqui.
- **Secret (segredo):** uma senha/chave guardada com segurança no GitHub, usada pelo robô sem ficar visível.
- **Hospedagem:** onde o site fica guardado e é servido para o mundo. Aqui: **Cloudflare Pages** (grátis).
- **Domínio:** o nome do endereço. Hoje é um subdomínio grátis (`glanzsemijoias.pages.dev`); um domínio próprio (ex.: `glanzsemijoias.com.br`) custa ~R$ 40/ano.

---

## 4. Linguagens e ferramentas usadas

### Linguagens

| Linguagem | Para que serve aqui | Onde está |
|---|---|---|
| **HTML** (via Nunjucks) | Estrutura das páginas | `src/*.njk`, `src/_includes/` |
| **CSS** | Toda a aparência, celular e computador | `src/css/styles.css` (um arquivo só) |
| **JavaScript** | Interatividade no navegador; também os scripts, a configuração e os testes (no Node.js) | `src/js/`, `scripts/`, `lib/`, `tests/`, `eleventy.config.js` |
| **JSON** | Os dados da loja (peças, categorias, políticas…) | `src/_data/` |
| **Nunjucks** | Modelos de página com lacunas preenchidas pelos dados | `src/*.njk`, `src/_includes/` |
| **YAML** | Receita do robô de publicação | `.github/workflows/deploy.yml` |
| **Markdown** | Documentação | `README.md`, `docs/` |
| **SVG** | Ícones e favicon | `src/_includes/partials/icons.njk`, `src/assets/brand/favicon.svg` |

**Não há** framework de JavaScript (React, Vue…), nem servidor, nem banco de dados. O JavaScript é "puro" (*vanilla*), o que deixa o site leve e rápido.

### Ferramentas (programas e serviços)

| Ferramenta | O que é | Para que usamos | Custo |
|---|---|---|---|
| **Node.js** (versão 20 ou mais nova; o robô usa a 22) | Roda JavaScript no computador | Base de todas as ferramentas abaixo | Grátis |
| **npm** | Gerenciador de pacotes do Node | Instalar ferramentas e rodar `npm run …` | Grátis |
| **Eleventy (11ty)** 3.x | Gerador de sites estáticos | Transforma os JSON + modelos `.njk` em páginas HTML | Grátis |
| **Playwright** 1.6x | Ferramenta de testes automáticos em navegadores | Testa o site no "iPhone" (WebKit) e no Chrome (Chromium) | Grátis |
| **sharp** 0.35 | Biblioteca de processamento de imagens | Converte fotos para WebP, redimensiona, gira; gera os PNG do favicon | Grátis |
| **Git** | Controle de versões | Histórico, branches, envio ao GitHub | Grátis |
| **GitHub** | Hospeda o código | Guarda o repositório; roda o GitHub Actions | Grátis |
| **GitHub Actions** | Robô de automação | Valida, gera, testa e publica a cada push na `main` | Grátis (repositório público) |
| **Cloudflare Pages** | Hospedagem de sites estáticos | Serve o site em `glanzsemijoias.pages.dev` | Grátis, inclusive para uso comercial |
| **Wrangler** (via `cloudflare/wrangler-action`) | Ferramenta oficial do Cloudflare | Envia a pasta `_site` para o Cloudflare Pages | Grátis |
| **Google Fonts** | Serviço de fontes | Fontes **Playfair Display** (títulos, com serifa) e **Jost** (textos) | Grátis |
| **Instagram (ig.me)** | Links diretos para o Direct | `https://ig.me/m/glanz_semijoiaspnz?text=…` abre a conversa com a loja | Grátis |
| **VS Code** (sugerido) | Editor de código | Editar arquivos e usar o terminal | Grátis |

As três ferramentas do Node (Eleventy, Playwright, sharp) estão em `devDependencies` no `package.json`: são usadas **só no desenvolvimento e na publicação**. O site publicado não depende de nenhuma delas; ele é só HTML, CSS, JS e imagens.

---

## 5. Mapa das pastas

```
projeto-catalogo-semijoias/           ← a pasta do projeto (o repositório)
│
├── .github/workflows/deploy.yml      ← receita do robô: validar, gerar, testar, publicar
├── .claude/                          ← configurações locais do assistente (não vai pro GitHub)
├── .editorconfig                     ← padrão de formatação dos editores
├── .gitattributes                    ← como o Git trata quebras de linha e imagens
├── .gitignore                        ← o que o Git deve ignorar
├── README.md                         ← resumo técnico (inglês)
├── package.json                      ← "ficha" do projeto: ferramentas e comandos
├── package-lock.json                 ← versões exatas das ferramentas instaladas
├── eleventy.config.js                ← configuração do Eleventy e "filtros" usados nas páginas
├── playwright.config.js              ← configuração dos testes (aparelhos simulados)
│
├── docs/
│   ├── store-guide.pt-BR.md          ← guia prático da loja
│   └── project-explained.pt-BR.md    ← este guia
│
├── lib/
│   └── slugify.js                    ← "Anel Laço" → "anel-laco"
│
├── scripts/                          ← programas auxiliares (rodam no computador / no robô)
│   ├── validate-data.js              ← confere os dados antes de gerar o site
│   ├── optimize-images.js            ← npm run images: fotos → WebP + cadastro automático
│   └── build-icons.js                ← npm run icons: favicon SVG → PNG
│
├── src/                              ← TUDO que vira o site
│   ├── _data/                        ← os dados da loja (JSON)
│   │   ├── site.json                 ← nome, endereço, Instagram, coleção, garantias…
│   │   ├── products.json             ← as peças
│   │   ├── categories.json           ← as categorias
│   │   ├── hero.json                 ← foto(s) do topo da home
│   │   ├── howToBuy.json             ← os 3 passos do "Como comprar"
│   │   └── storePolicies.json        ← pagamento, parcelamento, entrega, garantia
│   ├── _includes/                    ← pedaços reaproveitados das páginas
│   │   ├── layouts/base.njk          ← o "esqueleto" comum a todas as páginas
│   │   └── partials/                 ← componentes: card de peça, ícones, círculos…
│   ├── index.njk                     ← página inicial
│   ├── category.njk                  ← molde que gera as 5 páginas de categoria
│   ├── product.njk                   ← molde que gera uma página por peça
│   ├── 404.njk                       ← página "não encontrada"
│   ├── css/styles.css                ← toda a aparência
│   ├── js/                           ← interatividade (um arquivo por funcionalidade)
│   └── assets/                       ← imagens
│       ├── brand/                    ← logo, favicon, imagem de compartilhamento
│       ├── highlights/               ← fotos de campanha (topo da home)
│       └── products/<categoria>/     ← fotos das peças (WebP)
│
├── tests/
│   ├── e2e/catalog.spec.js           ← os testes automáticos
│   └── serve-site.js                 ← mini servidor que imita o Cloudflare nos testes
│
│   ── pastas que NÃO vão pro GitHub (geradas ou pessoais) ──
├── node_modules/                     ← ferramentas instaladas pelo npm (recriável: npm install)
├── _site/                            ← o site gerado (recriável: npm run build)
├── photos-inbox/                     ← fotos originais a converter / já convertidas (processed/)
├── test-results/, playwright-report/ ← relatórios dos testes (recriáveis)
```

**Regra de ouro:** nunca edite nada dentro de `_site/`. Ela é apagada e recriada a cada build. Edite sempre em `src/`.

---

## 6. Arquivo por arquivo

### 6.1 Arquivos da raiz

#### `package.json`
A "ficha de identidade" do projeto para o npm.
- `"type": "module"`: todo o JavaScript usa `import`/`export` (módulos modernos).
- `"engines": { "node": ">=20" }`: precisa do Node 20 ou mais novo.
- `"devDependencies"`: as ferramentas (Eleventy, Playwright, sharp) e suas versões mínimas.
- `"scripts"`: os atalhos de comando:

| Comando | O que faz de verdade |
|---|---|
| `npm start` | `eleventy --serve`: gera o site e abre um servidor local em `http://localhost:8080/` que **atualiza sozinho** quando você salva um arquivo |
| `npm run build` | `eleventy`: gera o site na pasta `_site/` (com validação dos dados antes) |
| `npm run validate` | Só confere os dados (`scripts/validate-data.js`), sem gerar o site |
| `npm test` | `playwright test`: gera o site, sobe um servidor de teste e roda todos os testes |
| `npm run test:install` | Baixa os navegadores de teste (WebKit e Chromium). Só precisa uma vez por computador |
| `npm run images` | Converte as fotos de `photos-inbox/` e cadastra as peças (`scripts/optimize-images.js`) |
| `npm run icons` | Gera os PNG do favicon a partir do SVG (`scripts/build-icons.js`) |

#### `package-lock.json`
Gerado pelo npm. Registra a **versão exata** de cada pacote (e dos pacotes que eles usam), para que o computador e o robô instalem exatamente as mesmas coisas. Não se edita à mão. O robô usa `npm ci`, que segue esse arquivo à risca.

#### `eleventy.config.js`
A configuração do Eleventy. É o "cérebro" da geração do site. Em ordem:
1. **Lê** `site.json`, `storePolicies.json` e `categories.json`.
2. **`pathPrefix`**: calcula, a partir do `url` do `site.json`, se o site mora numa subpasta. Hoje é `/` (raiz). Se um dia o site morar em `algo.com/catalogo/`, os links se ajustam sozinhos.
3. **Antes de gerar** (`eleventy.before`): roda a validação dos dados. Se houver erro, o build para com uma mensagem clara.
4. **`HtmlBasePlugin`**: plugin que acrescenta o `pathPrefix` aos links internos.
5. **Passthrough copy**: copia `src/css`, `src/js` e `src/assets` para `_site` sem mexer.
6. **Filtros** (funções usadas dentro dos `.njk` com o símbolo `|`):

| Filtro | Exemplo de uso | O que faz |
|---|---|---|
| `brl` | `{{ 49.9 \| brl }}` | Formata em reais: "R$ 49,90" |
| `byCategory` | `products \| byCategory("rings")` | Peças de uma categoria, em **ordem alfabética**, vendidas por último |
| `available` | `products \| available` | Só as peças não vendidas |
| `showcase` | `products \| showcase("rings")` | Até 8 peças disponíveis da categoria, na ordem do cadastro (fileiras da home) |
| `related` | `products \| related(product)` | Até 4 peças da mesma categoria ("Você também pode gostar") |
| `priceRanges` | `items \| priceRanges` | Faixas de preço que têm peças (filtros da categoria) |
| `categoryOf` | `categories \| categoryOf("rings")` | Acha a categoria pelo slug |
| `installment` | `price \| installment` | Plano de parcelas: `{ count: 3, value: "R$ 47,67" }` ou nada |
| `catalogIndex` | `products \| catalogIndex` | Gera o "índice" de todas as peças em JSON, embutido em cada página (busca e lista usam) |
| `productSlug` | `product \| productSlug` | "anel-laco" |
| `productUrl` | `product \| productUrl` | "/products/anel-laco/" |
| `withBase` | `"/x.png" \| withBase` | Acrescenta o `pathPrefix` (para links lidos pelo JavaScript) |
| `absoluteUrl` | `"/rings/" \| absoluteUrl` | Endereço completo: "https://glanzsemijoias.pages.dev/rings/" |
| `directMessage` | `product \| directMessage` | "Olá! Tenho interesse na peça: Anel Laço" + link da peça |
| `directLink` | `mensagem \| directLink` | "https://ig.me/m/glanz_semijoiaspnz?text=…" |

7. **Pastas**: entrada `src`, saída `_site`; modelos em Nunjucks.

#### `playwright.config.js`
Configuração dos testes:
- Onde estão os testes (`tests/e2e`).
- **Três "aparelhos"** simulados: `iphone-17` (WebKit, tela de iPhone atual), `iphone-narrow` (WebKit, iPhone 13 Mini, a tela estreita de 375 px) e `desktop-chrome` (Chromium, computador).
- **`webServer`**: antes dos testes, roda `npm run build && node tests/serve-site.js` e espera o site responder em `http://localhost:8090/`.
- No robô (`CI`), repete um teste que falhou uma vez (para evitar falsos alarmes) e gera um relatório HTML.

#### `.editorconfig`
Diz aos editores (VS Code etc.) para usar UTF-8, 2 espaços de indentação, quebra de linha LF e linha final em branco. Mantém o código padronizado.

#### `.gitattributes`
Diz ao Git para normalizar quebras de linha (LF, padrão Linux/Mac, mesmo no Windows) e para tratar imagens como binárias (sem tentar "comparar texto").

#### `.gitignore`
Lista o que o Git **não** guarda: `node_modules/`, `_site/`, `photos-inbox/`, `test-results/`, `playwright-report/`, logs, arquivos do sistema e `.claude/`. São coisas recriáveis, pesadas ou pessoais.

#### `README.md`
Resumo técnico em inglês, pensado para recrutadores e outros desenvolvedores: funcionalidades, estrutura, formato dos dados, compatibilidade e publicação.

#### `.claude/` (só no seu computador)
Configurações do assistente de IA usado no desenvolvimento: `launch.json` (como abrir o servidor de pré-visualização) e `skills/` (a skill `frontend-design`). Não fazem parte do site e não vão pro GitHub.

### 6.2 `.github/workflows/deploy.yml` (o robô de publicação)

Roda **a cada push na `main`**, em cada *pull request* (só testa, não publica) e manualmente (`workflow_dispatch`).

**Trabalho `build`** (numa máquina Linux do GitHub):
1. `actions/checkout`: baixa o código.
2. `actions/setup-node`: instala o Node 22 (com cache do npm, para ser mais rápido).
3. `npm ci`: instala as ferramentas exatamente como no `package-lock.json`.
4. `npm run build`: valida os dados e gera o site.
5. `npx playwright install --with-deps webkit chromium`: instala os navegadores de teste.
6. `npm test`: roda todos os testes. **Se algum falhar, para tudo aqui**.
7. Se falhou: guarda o relatório dos testes (`playwright-report`) por 14 dias, para você ver o que quebrou.
8. Se passou (e não é pull request): guarda a pasta `_site` como "artefato" chamado `site`.

**Trabalho `deploy`** (só depois que o `build` passou):
1. Baixa o artefato `site`.
2. `cloudflare/wrangler-action`: envia a pasta para o Cloudflare Pages, projeto `glanzsemijoias`, branch `main` (produção). Usa dois segredos do repositório: `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`.

Outros detalhes:
- `permissions: contents: read`: o robô só pode ler o código (segurança).
- `concurrency`: se você der dois pushes seguidos, um não atropela o outro; uma publicação em andamento nunca é interrompida.

### 6.3 `docs/`
- `store-guide.pt-BR.md`: guia prático da loja (como cadastrar, trocar coleção, fotos, publicar com Git).
- `project-explained.pt-BR.md`: este documento.

### 6.4 `lib/slugify.js`
Uma função só: transforma um nome em slug. Remove acentos (`normalize("NFD")` separa a letra do acento e depois o acento é apagado), passa para minúsculas, troca tudo que não é letra/número por hífen e tira hífens das pontas. Usada pela configuração (endereço das páginas) e pela validação (detectar duas peças com o mesmo endereço).

### 6.5 `scripts/`

#### `scripts/validate-data.js`
Confere os dados **antes de cada build** (e também com `npm run validate`). Se achar problema, lista todos de uma vez, com a peça e o campo. Confere:
- **JSON válido** em todos os arquivos de `src/_data` (vírgula faltando, aspas…).
- **`site.json`**: `url` começa com `https://` e termina com `/`; Instagram sem `@`; `collection.firstCycle` no formato `AAAA-MM`; `collection.months` entre 1 e 12.
- **`storePolicies.json`**: regras de parcelamento com `above` (valor) e `count` (2 ou mais); formas de pagamento, entrega e garantia preenchidas.
- **`categories.json`**: cada categoria tem `slug` e `label`, slugs não se repetem, a foto existe.
- **`products.json`**: só campos conhecidos (pega erros de digitação como `"pirce"`); categoria existente; **preço maior que zero**; `compareAtPrice` maior que o preço; **cada foto existe** no disco; `soldOut`/`sample` são `true`/`false`; **dois nomes não geram o mesmo endereço**.
- **`hero.json`**: é uma lista com pelo menos uma foto; cada foto existe e tem `width`, `height` e `alt`.

#### `scripts/optimize-images.js` (`npm run images`)
Prepara as fotos e cadastra as peças automaticamente.
1. Lê as subpastas de `photos-inbox/`. O nome da pasta diz a categoria: `Anéis`, `Brincos`, `Colares`, `Pulseiras`, `Pingentes` (ou o slug em inglês, ou no singular). A pasta `Destaques` é para fotos do topo da home.
2. Lê o **nome do arquivo** para descobrir peça, preço e número da foto: `Anel Laço - 59,90 (2).jpg` → peça "Anel Laço", R$ 59,90, segunda foto. Aceita `-`, `–` e `—` antes do preço, preço com ou sem centavos, com ou sem "R$".
3. Para cada foto, com o **sharp**: corrige a rotação de fotos de celular, reduz para 1200 px de largura (nunca aumenta) e salva em **WebP** (qualidade 80). Avisa se a foto não está em 4:5 (será cortada nos cards) ou se é pequena demais. Fotos HEIC do iPhone precisam ser exportadas como JPG antes.
4. Salva em `src/assets/products/<categoria>/<slug>.webp` (ou `src/assets/highlights/`) e **move a original** para `photos-inbox/processed/`.
5. **Cadastra no `products.json`**: peça nova é adicionada (com preço 0 se o arquivo não tinha preço, o que bloqueia a publicação até ser preenchido); peça existente (mesmo nome, ignorando acento e maiúsculas) ganha a foto nova e/ou o preço novo. Reescreve o arquivo organizado por categoria, uma peça por linha.
6. Para fotos de `Destaques`, **imprime** as linhas prontas para colar no `hero.json` (a descrição precisa ser escrita por uma pessoa).

#### `scripts/build-icons.js` (`npm run icons`)
Lê `src/assets/brand/favicon.svg` e gera, com o sharp:
- `favicon-32.png`: favicon de reserva para navegadores sem suporte a SVG.
- `apple-touch-icon.png` (180 px): ícone da tela inicial do iPhone. É gerado **quadrado, sem cantos arredondados**, porque o iOS arredonda sozinho e pintaria de preto os cantos transparentes.

### 6.6 `src/_data/` (os dados da loja)

O Eleventy lê automaticamente cada arquivo desta pasta e o disponibiliza em todas as páginas com o nome do arquivo (`products`, `site`, `categories`…).

#### `site.json`
| Campo | Exemplo | Para quê |
|---|---|---|
| `name` | "GLANZ Semi Joias" | Nome em títulos e textos alternativos |
| `url` | "https://glanzsemijoias.pages.dev/" | Endereço oficial: gera links absolutos (Open Graph, canonical) e o `pathPrefix`. **Ao ter domínio próprio, muda só aqui** |
| `locale` | "pt_BR" | Idioma para o Open Graph |
| `title`, `description` | | Título e descrição da home (aba e Google) |
| `tagline` | "Elegância que permanece, brilho que reluz" | Frase no fim da home |
| `collection.note` | "Peças únicas" | Título da home se o JavaScript não rodar |
| `collection.firstCycle` | "2026-09" | Mês em que um ciclo de coleção começou (referência para o cálculo) |
| `collection.months` | 2 | Duração do ciclo |
| `city` | "Petrolina, PE" | Rodapé |
| `instagram` | "glanz_semijoiaspnz" | Todos os links do Direct (sem `@`) |
| `directMessage` | "Olá! Tenho interesse na peça: " | Começo da mensagem de uma peça |
| `listMessage` | "Olá! Tenho interesse nestas peças:" | Começo da mensagem da lista |
| `ogImage` | caminho, largura, altura, descrição | Imagem de compartilhamento das páginas que não são de peça |
| `guarantees` | ícone + texto (+ `homeOnly`) | Faixa de garantias. `homeOnly: true` aparece só na home (não em toda peça) |

#### `products.json`
Lista de peças, uma por linha, agrupadas por categoria:
```json
{ "name": "Anel Laço", "category": "rings", "price": 143.00, "photos": ["assets/products/rings/anel-laco.webp"] }
```
| Campo | Obrigatório | O que é |
|---|---|---|
| `name` | sim | Nome mostrado. Também define o endereço da página (`/products/anel-laco/`) e vai na mensagem do Direct |
| `category` | sim | `rings`, `earrings`, `necklaces`, `bracelets` ou `pendants` |
| `price` | sim | Preço com **ponto** decimal: `143.00` |
| `photos` | sim | Lista de fotos (caminho a partir de `src/`). Mais de uma vira carrossel no card. Vazia mostra "Foto em breve" |
| `compareAtPrice` | não | Preço antigo (maior que `price`): mostra "Promoção" e o preço riscado |
| `soldOut` | não | `true` = vendida: selo "Vendida", vai para o fim, sem coração, sem parcelas |
| `sample` | não | `true` = peça de exemplo (selo "Exemplo") |

#### `categories.json`
Cada categoria: `slug` (usado no endereço e nos dados), `label` (nome mostrado), `image` (foto do círculo na home) e `description` (texto da página da categoria). Uma categoria nova só precisa de uma linha aqui; a página é criada sozinha.

#### `hero.json`
Lista de fotos do topo da home: `image`, `width`, `height` (em pixels, para o navegador reservar o espaço) e `alt` (descrição para leitores de tela e Google). Uma foto fica parada; mais de uma vira carrossel lento.

#### `howToBuy.json`
Os 3 passos da seção "Como comprar" (título e texto).

#### `storePolicies.json`
- `paymentMethods`: Pix, débito, crédito.
- `installments`: regras de parcelamento `{ "above": 80, "count": 2 }`… ("acima de" é estrito: R$ 80,00 exatos não parcela).
- `delivery`: frases sobre entrega.
- `warranty`: resumo, o que cobre, o que não cobre e como solicitar.

### 6.7 `src/_includes/` (moldes e componentes)

#### `layouts/base.njk` (o esqueleto de todas as páginas)
- **`<head>`**: título, descrição, cor do tema (`#C6F4FF`), ícones (SVG, PNG e iPhone), Open Graph, Twitter card, canonical, fontes do Google, CSS. Um mini script adiciona a classe `js` ao HTML (o CSS usa isso para mostrar controles que dependem de JavaScript).
- **`<body>`** com dados para o JavaScript: usuário do Instagram, mensagem da lista, imagem de reserva e regras de parcelamento (`data-installments`).
- **Cabeçalho** fixo com o degradê da marca: logo (sol + GLANZ), lupa (busca) e coração (lista, com contador).
- **`<main>`**: o conteúdo de cada página entra aqui.
- **Rodapé**: logo, link do Instagram, cidade, "Como comprar".
- **Botão flutuante do Instagram** (exceto na página da peça, que tem `hideFloatingDirect: true`).
- **Janela de busca** (`<dialog id="search">`).
- **Gaveta da lista de interesse** (`<dialog id="interestList">`), com total, parcelas, mensagem e os botões "1 Copiar lista" e "2 Abrir o Direct e colar".
- **Índice do catálogo** (`<script id="catalogIndex">`) com todas as peças em JSON.
- **`main.js`**, que liga toda a interatividade.

#### `partials/`
| Arquivo | O que é |
|---|---|
| `icons.njk` | Macro `icon("nome")` que desenha ícones SVG: heart, layers, gem, shield, share, search, zoom, close, chevron-left/right, copy, check, plus, minus, instagram |
| `product-card.njk` | Macros: `badges` (selos), `price` (preço e preço antigo), `listToggle` (coração), `directButton` (link do Direct) e **`productCard`** (o card completo: foto(s), selos, coração, nome, preço, parcelas, link do Direct). `singlePhoto` mostra só a primeira foto (fileiras da home) |
| `category-chips.njk` | Botões de categoria (no topo das páginas de categoria e da 404) |
| `category-circles.njk` | Círculos de categoria estilo "destaques do Instagram" (home) |
| `guarantees.njk` | Lista de garantias (pula as `homeOnly` na página da peça) |

### 6.8 As páginas (`src/*.njk`)

Cada `.njk` começa com um bloco de configuração (*front matter*, entre `---`) que diz o molde, o endereço final, o título e a descrição.

- **`index.njk`** → `index.html` (home): topo (foto(s) + título da coleção + "Ver as peças"), círculos de categoria, atalho de busca, fileiras por categoria (até 8 peças + "Ver todos (N)"), garantias, "Como comprar" (passos + sanfonas de pagamento, entrega e garantia + botões) e a frase da marca.
- **`category.njk`** → uma página por categoria (`rings/index.html`…), graças à **paginação** do Eleventy sobre `categories`: botões de categoria, título, descrição, contador ("14 peças"), filtros, ordenação, grade de cards e mensagem "Nenhuma peça com esses filtros".
- **`product.njk`** → uma página por peça (`products/<slug>/index.html`), paginando sobre `products`: caminho (Catálogo › Categoria › Peça), galeria com zoom, nome, preço, parcelas, aviso se vendida, garantias, botão do Direct, coração, compartilhar, visualizador em tela cheia e "Você também pode gostar". A imagem de compartilhamento é a foto da própria peça.
- **`404.njk`** → `404.html`: "Página não encontrada" com as peças disponíveis. Se o endereço era de uma peça (`/products/…`), o JavaScript troca o texto para "Essa peça não está mais disponível".

### 6.9 `src/css/styles.css`

Um único arquivo, **mobile-first** (escrito para celular; telas maiores ganham ajustes em `@media (min-width: …)` com pontos de quebra em 700, 820 e 1000 px). Começa com as **variáveis da marca**:

| Variável | Cor | Uso |
|---|---|---|
| `--maroon` / `--ink` | `#872615` (marsala) | Textos, botões, títulos |
| `--orange` | `#FFAD62` | Destaques, foco do teclado, ícones |
| `--sky` | `#C6F4FF` (azul-claro) | Degradê, números dos passos |
| `--paper` | `#FFFBF6` | Fundo das páginas |
| `--muted` | `#A9705F` | Textos secundários |
| `--line` | `#F0DDCC` | Bordas |
| `--photo-bg` | `#F6ECE3` | Fundo enquanto a foto carrega |
| `--brand-gradient` | azul → laranja | Só no cabeçalho e no topo da home |

Seções do arquivo (na ordem): base, botões, cabeçalho, navegação de categorias, ordenar e filtrar, topo da home, fileiras da home, garantias, seções, grade e cards, página da peça, visualizador de fotos, janelas, busca, gaveta da lista, como comprar, rodapé, botão flutuante, aviso (toast), tablet e computador, efeitos de mouse, resposta ao toque e "reduzir movimento".

### 6.10 `src/js/` (interatividade)

Cada arquivo é um módulo com uma responsabilidade. O `main.js` importa e liga todos.

| Arquivo | O que faz |
|---|---|
| `main.js` | Ponto de entrada. Ativa o efeito de toque do iOS, faz as fotos aparecerem suavemente ao carregar e chama as funções `init…` de todos os módulos |
| `carousel.js` | Bolinhas dos carrosséis de fotos dos cards e da galeria (acompanham a foto visível com `IntersectionObserver`) |
| `hero-carousel.js` | Carrossel das fotos do topo da home (troca a cada 5,5 s, pausa 8 s após interação, para em aba escondida e com "reduzir movimento"; bolinhas clicáveis) |
| `catalog-order.js` | Regras de **ordem** (A–Z, menor e maior preço; vendidas por último) e **faixas de preço**. Usado pelo build *e* pelo navegador |
| `catalog-tools.js` | Ordenação e filtros na página da categoria: reordena/esconde os cards, atualiza o contador, guarda a escolha no endereço |
| `installments.js` | Calcula o plano de parcelas (`installmentPlan`). Usado pelo build *e* pelo navegador |
| `collection.js` | Calcula a coleção atual pela data ("Coleção de setembro e outubro") e escreve no título da home |
| `search.js` | Busca: normaliza o texto (sem acento) e procura todas as palavras no nome e na categoria, usando o índice embutido na página |
| `interest-list.js` | Lista de interesse: coração, `localStorage`, gaveta, total, parcelas, mensagem, cópia e sincronização com o catálogo atual |
| `direct-message.js` | Ao tocar num link do Direct, copia a mensagem e mostra "Mensagem copiada" |
| `clipboard.js` | Copiar texto de forma compatível com iPhone (método antigo primeiro, API moderna como reserva) |
| `dialog.js` | Abrir e fechar janelas `<dialog>`, com alternativa para iPhones antigos (iOS < 15.4) |
| `lightbox.js` | Foto em tela cheia: pinça com dois dedos, arrastar, deslizar para trocar; no computador, roda do mouse, botões + e − e teclado |
| `share.js` | "Compartilhar": abre o menu nativo do celular ou copia o link no computador |
| `toast.js` | Avisos curtos na parte de baixo da tela |
| `not-found.js` | Troca o texto da 404 quando o endereço era de uma peça |

### 6.11 `src/assets/` (imagens)

- **`brand/`**: `glanz-mark.webp` (logo completo, no rodapé), `sunburst.png` (o sol, no cabeçalho e em espaços sem foto), `og-image.jpg` (1200×630, prévia de links), `favicon.svg` (o "G" do logo, branco sobre marsala, vetorizado), `favicon-32.png` e `apple-touch-icon.png` (gerados por `npm run icons`).
- **`highlights/`**: fotos de campanha do topo da home.
- **`products/<categoria>/`**: fotos das peças, em WebP, 1200 px de largura, geradas por `npm run images`.

### 6.12 `tests/`

#### `tests/serve-site.js`
Um mini servidor (sem dependências) que serve a pasta `_site` em `http://localhost:8090/` **do mesmo jeito que o Cloudflare**: `index.html` para pastas e `404.html` com código 404 para endereços inexistentes.

#### `tests/e2e/catalog.spec.js`
Os testes automáticos. Eles **leem os próprios dados** (`products.json` etc.) para saber o que esperar; por isso continuam valendo quando o catálogo muda. Rodam nos 3 aparelhos, somando mais de 340 execuções. Conferem, entre outros:
- Cada página (home, 5 categorias, cada peça) abre sem erros, sem imagens quebradas e sem fotos invisíveis.
- Favicon, 404 e a 404 de peça antiga.
- Preços formatados, contadores, ordem alfabética, ordenação e filtros (inclusive guardados no endereço).
- Topo da home (uma foto parada / várias trocando), fileiras por categoria, garantias, "Como comprar" e políticas.
- Parcelas nos cards e na página da peça.
- Lista de interesse: adicionar, manter após recarregar, copiar a mensagem, remover, e descartar peças vendidas ou que saíram da coleção.
- Zoom no celular (pinça) e no computador (roda e botões).
- Detalhes de iPhone: sem o "flash azul" ao tocar, link do Direct em uma linha, campos com 16 px (para o iPhone não dar zoom).
- Peça vendida: selo, fim da lista, sem coração, botão "Perguntar por peças parecidas".
- Busca: ignora acentos, mostra vendidas como vendidas, sugere categorias quando não acha nada.

Alguns testes são **pulados** quando não há dados para eles (ex.: o de peça vendida, se nenhuma estiver vendida). Isso é normal.

### 6.13 Pastas que não vão pro GitHub

| Pasta | O que é | Pode apagar? |
|---|---|---|
| `node_modules/` | Ferramentas instaladas | Sim; volta com `npm install` |
| `_site/` | Site gerado | Sim; volta com `npm run build` |
| `photos-inbox/` | Fotos a converter; `processed/` guarda as **originais** | As subpastas vazias ficam; `processed/` só depois de fazer cópia das originais |
| `test-results/`, `playwright-report/` | Resultados dos testes | Sim |

---

## 7. Como cada funcionalidade funciona por dentro

### 7.1 Do dado à página (o build)
1. Você roda `npm run build` (ou o robô roda).
2. O Eleventy chama a **validação**. Erro = para aqui.
3. Lê todos os JSON de `src/_data`.
4. Para cada `.njk`, preenche o molde com os dados. `category.njk` é repetido para cada categoria; `product.njk`, para cada peça. Todas as páginas usam o esqueleto `base.njk`.
5. Escreve os HTML em `_site/` e copia CSS, JS e imagens.

Resultado: ~96 páginas prontas. **Os cards já vêm no HTML**: a página aparece completa mesmo antes do JavaScript carregar (e até sem JavaScript).

### 7.2 Uma visita (no celular da cliente)
1. O celular pede a página ao Cloudflare, que entrega o HTML do servidor mais próximo.
2. O navegador lê o HTML, baixa o CSS, as fontes e as imagens (as fotos fora da tela só carregam quando a cliente rola, com `loading="lazy"`).
3. O `main.js` liga as funcionalidades. O índice do catálogo já está dentro da página, então a busca e a lista funcionam sem nenhum pedido extra.

### 7.3 Busca
Todas as peças estão no `<script id="catalogIndex">` de cada página. Ao digitar, `search.js` tira acentos e maiúsculas do que foi digitado e de cada peça, e mostra as peças que contêm **todas** as palavras no nome ou na categoria ("brinco zirconia" acha "Brinco Ponto de Zircônia"). Disponíveis primeiro; vendidas aparecem marcadas. Sem resultado, sugere as categorias.

### 7.4 Lista de interesse
- O coração guarda a peça no `localStorage` do aparelho (chave `glanz:interest-list`). Nada vai para servidor nenhum.
- Ao abrir qualquer página, a lista é **sincronizada** com o catálogo atual: peças vendidas ou que saíram da coleção são removidas (com aviso), e nome, preço e foto são atualizados.
- A gaveta mostra as peças, o **total** e as **parcelas** do total, e monta a mensagem: "Olá! Tenho interesse nestas peças:" + nome e preço de cada uma.
- Dois passos: **1 Copiar lista** (copia de forma compatível com iPhone) e **2 Abrir o Direct e colar**.

### 7.5 Perguntar no Direct
O link é `https://ig.me/m/glanz_semijoiaspnz?text=<mensagem>`. O Instagram **nem sempre** preenche a mensagem sozinho; por isso, ao tocar, o site também **copia** a mensagem e avisa "Mensagem copiada — é só colar no Direct". A mensagem inclui o link da peça, para a loja saber exatamente qual é.

### 7.6 Ordenar e filtrar (páginas de categoria)
- A página já vem em **A–Z** (vendidas por último). O `catalog-tools.js` reordena e esconde os cards já presentes, sem recarregar.
- **Ordenar**: A–Z, menor preço, maior preço.
- **Filtrar**: "Disponíveis" (só aparece se houver vendidas), "Promoção" (só se houver), e **faixas de preço** baseadas no parcelamento: Até R$ 80, R$ 80 a R$ 130, R$ 130 a R$ 210, Acima de R$ 210 (só as faixas que têm peças).
- A escolha vai para o endereço: `?ordem=menor-preco`, `?filtro=disponiveis,promocao`, `?preco=80-130`. Assim um link filtrado pode ser enviado no Direct, e recarregar a página mantém a escolha.
- A regra de ordem fica em `catalog-order.js`, usada tanto no build quanto no navegador (a ordem nunca diverge).

### 7.7 Parcelas
`installments.js` percorre as regras e escolhe o maior número de parcelas cujo "acima de" o preço supera (estritamente). R$ 143 → acima de 130 → 3x de R$ 47,67. Aparece nos cards ("ou 3x de R$ 47,67 sem juros"), na página da peça e no total da lista. Peças até R$ 80 e peças vendidas não mostram parcela. Mudar as regras no `storePolicies.json` muda tudo de uma vez.

### 7.8 Coleção atual
Com `firstCycle: "2026-09"` e `months: 2`, os ciclos são set–out, nov–dez, jan–fev… `collection.js` calcula, pela data do aparelho, em qual ciclo estamos e escreve "Coleção de setembro e outubro" no título da home. Ninguém precisa atualizar nada.

### 7.9 Peças vendidas e peças que saíram
- **Vendida** (`"soldOut": true`): selo "Vendida", foto acinzentada, vai para o fim, sem coração, sem parcelas, fora das fileiras da home; na página da peça, o botão vira "Perguntar por peças parecidas".
- **Saiu da coleção** (linha apagada do `products.json`): a página deixa de existir. Quem abrir um link antigo cai na 404, que explica "Essa peça não está mais disponível" e mostra as peças atuais.

### 7.10 Fotos: zoom, carrosséis e carregamento
- **Card com várias fotos**: desliza para o lado; bolinhas mostram qual é a foto.
- **Página da peça**: galeria; tocar abre a **tela cheia** (`lightbox.js`), com pinça, arrastar e deslizar no celular, e roda do mouse, botões e teclado no computador. O site impede que a página inteira dê zoom junto (gestos do iOS tratados à parte).
- **Topo da home**: carrossel lento quando há mais de uma foto.
- **Carregamento**: enquanto a foto carrega, aparece um fundo neutro; ao carregar, ela surge suavemente (com um "plano B" de 3 s caso o navegador não avise).

### 7.11 Compartilhar e prévias de link
O botão "Compartilhar" usa o menu nativo do celular (WhatsApp, Instagram…) ou copia o link no computador. Ao colar o link de uma peça, a prévia mostra a **foto da peça**, o nome e a descrição (Open Graph).

---

## 8. Tarefas do dia a dia, passo a passo

> **Antes de mudar qualquer coisa**, sempre (detalhes no guia da loja):
> ```bash
> git status          # deve estar na main, sem nada pendente
> git switch main
> git pull            # traz o que estiver no GitHub
> git switch -c nome-da-mudanca
> ```

### 8.1 Primeira vez num computador novo
1. Instale o **Node.js** (versão LTS, em https://nodejs.org) e o **Git** (https://git-scm.com).
2. Baixe o projeto: `git clone https://github.com/BrunoSpt/glanz-catalog.git` e entre na pasta.
3. `npm install` (instala as ferramentas).
4. `npm run test:install` (baixa os navegadores de teste).
5. `npm start` e abra `http://localhost:8080/`.

### 8.2 Ver o site no computador e no celular
- `npm start` → `http://localhost:8080/`. Salvou um arquivo, a página recarrega sozinha.
- **No celular**: mesmo Wi-Fi do computador; descubra o IP do computador (no Windows, `ipconfig`, linha "Endereço IPv4", ex.: `192.168.0.58`) e abra `http://192.168.0.58:8080/` no celular.

### 8.3 Cadastrar peças novas com fotos
1. Coloque as fotos em `photos-inbox/<Categoria>/`, com o nome da peça e o preço: `Anel Laço - 143.jpg`. Fotos extras: `Anel Laço (2).jpg`.
2. `npm run images`.
3. Confira o resumo (peças novas, atualizadas, sem preço) e o `products.json`.
4. `npm start` para ver; `npm test` para testar; depois publicar (8.8).

### 8.4 Mudar um preço, marcar promoção ou vendida
Edite a linha da peça no `src/_data/products.json`:
- Preço: `"price": 159.00`.
- Promoção: acrescente `"compareAtPrice": 189.00` (preço antigo, maior).
- Vendida: acrescente `"soldOut": true`.

(Também dá para editar direto no site do GitHub, no ícone de lápis, e salvar na `main`: publica sozinho.)

### 8.5 Trocar a coleção (a cada 2 meses)
1. Apague do `products.json` as peças que voltaram ao fornecedor (e, se quiser, as fotos delas em `src/assets/products/`).
2. Cadastre as novas (8.3).
3. Se quiser, troque as fotos do topo (`hero.json`).
4. O título "Coleção de … e …" muda sozinho.

### 8.6 Fotos do topo da home
Fotos em `photos-inbox/Destaques/` → `npm run images` → cole as linhas impressas no `src/_data/hero.json` (entre os colchetes, vírgula entre as linhas, sem vírgula na última) e escreva a descrição (`alt`).

### 8.7 Trocar o favicon
Substitua `src/assets/brand/favicon.svg` (ex.: pelo logo original em vetor, se a cliente enviar) e rode `npm run icons`.

### 8.8 Publicar
```bash
npm test
git add .
git commit -m "Describe the change in English"
git switch main
git merge nome-da-mudanca
git push
git branch -d nome-da-mudanca
```
Acompanhe na aba **Actions** do GitHub. Em ~5 minutos, ✓ verde = site atualizado. ✗ vermelho = nada foi publicado; clique para ver o motivo.

### 8.9 Mudar parcelamento, garantia, entrega, textos
- Parcelamento, pagamento, entrega, garantia: `src/_data/storePolicies.json`.
- Passos do "Como comprar": `src/_data/howToBuy.json`.
- Nome, Instagram, frases, garantias da faixa, coleção: `src/_data/site.json`.
- Categorias (nome, descrição, foto do círculo): `src/_data/categories.json`.

---

## 9. Publicação e hospedagem

### 9.1 Onde cada coisa mora
| O quê | Onde | Conta |
|---|---|---|
| Código e histórico | GitHub: `BrunoSpt/glanz-catalog` | Sua conta do GitHub |
| Robô de testes/publicação | GitHub Actions (aba Actions do repositório) | Mesma |
| Site publicado | Cloudflare Pages, projeto `glanzsemijoias` | Sua conta do Cloudflare |
| Chaves do Cloudflare para o robô | GitHub → Settings → Secrets and variables → Actions: `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` | |

O GitHub Pages (hospedagem antiga, `brunospt.github.io/glanz-catalog`) foi **desligado**.

### 9.2 A chave do Cloudflare
É um *token* com uma única permissão: **Account → Cloudflare Pages → Edit**. Ele só consegue publicar o site, nada mais. Se vazar ou expirar: Cloudflare → My Profile → API Tokens → "Roll" (gerar outro) ou "Delete", e atualize o segredo no GitHub.

### 9.3 Domínio próprio (quando houver)
1. Registrar (ex.: `glanzsemijoias.com.br` no registro.br).
2. Cloudflare → projeto `glanzsemijoias` → **Custom domains** → adicionar o domínio e seguir as instruções.
3. Trocar o `url` no `src/_data/site.json` e publicar. Os links, prévias e canonical se ajustam sozinhos.

### 9.4 O que publicar NÃO faz
Salvar arquivos, fazer commit ou criar branch **não** publica. Só o **push na `main`** publica (ou editar na `main` pelo site do GitHub). Não envie arquivos manualmente pelo painel do Cloudflare: o próximo push substitui.

---

## 10. Decisões de design, compatibilidade e qualidade

### 10.1 Visual
- **Identidade**: marsala, laranja e azul-claro da marca; Playfair Display nos títulos e Jost nos textos.
- **Fotos em primeiro lugar**: cards sem caixa nem sombra, só foto, nome, preço, parcelas e um link discreto do Direct.
- **Um momento marcante**: o topo da home (foto de campanha + título da coleção). O degradê da marca aparece só ali e no cabeçalho.
- **Sem "cara de site gerado"**: nada de rótulos em maiúsculas espaçadas, setas nos textos ou pontos separadores.

### 10.2 iPhone (o público principal)
- Janelas `<dialog>` com alternativa para iOS antigo.
- Prefixos `-webkit-` onde o Safari precisa; alturas com reserva para o `dvh`.
- Efeito de "passar o mouse" só em aparelhos com mouse (no iPhone, ficaria "preso").
- Sem o flash azul ao tocar; resposta ao toque própria da marca.
- Campos de texto com 16 px (abaixo disso o iPhone dá zoom).
- Cópia de texto do jeito que o iOS exige, inclusive dentro de janelas.
- Gestos de pinça tratados pelo próprio site no visualizador de fotos.
- Ícone próprio para a tela inicial.

### 10.3 Acessibilidade
- Respeita "reduzir movimento" (sem animações nem carrossel automático).
- Textos alternativos nas fotos; botões com rótulos para leitores de tela.
- Navegação semântica (`nav`, `main`, `footer`, caminho da página, `aria-current`).
- Foco visível ao usar teclado.

### 10.4 Desempenho
- Site estático em servidor global (Cloudflare).
- Fotos WebP de 1200 px, carregamento sob demanda, tamanho reservado (sem "pulos" na página).
- JavaScript pequeno, sem bibliotecas.
- Busca e lista sem nenhuma chamada a servidor.

### 10.5 Busca no Google (SEO) — situação atual
Já há: título e descrição por página, canonical, Open Graph, HTML semântico, um H1 por página. Ainda não há: `robots.txt`, `sitemap.xml` e dados estruturados (Schema.org). Ver seção 14.

### 10.6 Segurança
Não há login, senha, banco de dados nem dados de clientes guardados em servidor. A lista de interesse fica só no aparelho de cada cliente. A única credencial do projeto é a chave do Cloudflare, guardada como segredo no GitHub, com permissão mínima.

---

## 11. Regras e convenções do projeto

- **Código em inglês, interface em português.** Nomes de arquivos, variáveis, funções, comentários, mensagens de commit e o README são em inglês. Tudo que a cliente lê no site é em português do Brasil. (Os guias em `docs/` são em português, para a loja.)
- **Commits sem coautoria de IA.** O projeto faz parte do portfólio do Bruno; os commits não levam linhas "Co-Authored-By".
- **Sempre em branch**: nunca trabalhar direto na `main` (ver 8).
- **Nunca editar `_site/`**: ela é recriada a cada build.
- **Dados só nos JSON**: preços, textos de política, Instagram etc. nunca ficam "escritos" no HTML ou no JS. Mudou no JSON, muda no site todo.
- **Uma regra, um lugar**: parcelamento (`installments.js`), ordem (`catalog-order.js`) e slug (`slugify.js`) são compartilhados entre build e navegador ou entre build e validação.
- **Testes guiados pelos dados**: os testes leem os JSON; não é preciso alterar testes ao trocar a coleção.

---

## 12. Problemas comuns e como resolver

| Sintoma | Causa provável | Solução |
|---|---|---|
| `npm run build` mostra "Catalog data has N error(s)" | Erro nos JSON | Leia a lista: diz o arquivo, a peça e o campo. Corrija e rode de novo |
| "invalid JSON" | Vírgula faltando/sobrando, aspas, colchete | Veja a linha indicada. A última linha de uma lista não leva vírgula |
| "photo not found" | Caminho da foto errado ou foto não existe | Confira o nome do arquivo em `src/assets/products/…` |
| "price must be a positive number" | Peça com preço 0 (cadastrada sem preço) | Preencha o `price` |
| "same page address as product #N" | Dois nomes iguais (ignorando acento/maiúscula) | Mude um dos nomes |
| GitHub Actions com ✗ vermelho | Teste falhou ou dado errado | Clique no ✗ → no passo vermelho, leia a mensagem. Se foram os testes, baixe o artefato `playwright-report` |
| Site não atualizou | Publicação ainda rodando, ou falhou, ou cache | Veja Actions; recarregue a página (no computador, Ctrl+F5) |
| Favicon antigo na aba | O navegador guarda o ícone | Ctrl+F5, aba anônima; no iPhone, apagar e recriar o atalho |
| `npm run images` diz "pasta ignorada" | Nome de pasta que não é categoria | Use `Anéis`, `Brincos`, `Colares`, `Pulseiras`, `Pingentes` ou `Destaques` |
| Foto HEIC não converte | Formato do iPhone | Exporte como JPG |
| Celular não abre `http://IP:8080` | Wi-Fi diferente, `https` em vez de `http`, servidor parado, IP mudou | Mesmo Wi-Fi, `http://`, `npm start`, conferir o IP |
| `npm test` diz que o navegador não existe | Navegadores de teste não instalados | `npm run test:install` |
| Testes usam versão antiga do site | Um servidor de teste antigo ficou aberto na porta 8090 | Feche-o (ou reinicie o computador) e rode de novo |
| Push recusado ("rejected") | O GitHub tem commits que você não tem | `git pull` e depois `git push` |

---

## 13. Cola rápida de comandos

```bash
# rodar e ver
npm start                 # site local em http://localhost:8080/ (atualiza sozinho)
npm run build             # gera o site em _site/
npm run validate          # só confere os dados
npm test                  # gera, sobe e testa tudo (iPhone + Chrome)

# fotos e ícones
npm run images            # photos-inbox/ → WebP + cadastro no products.json
npm run icons             # favicon.svg → favicon-32.png + apple-touch-icon.png

# instalação (computador novo)
npm install               # instala as ferramentas
npm run test:install      # baixa os navegadores de teste

# git: começar uma mudança
git status
git switch main
git pull
git switch -c nome-da-mudanca

# git: publicar
git add .
git commit -m "Describe the change"
git switch main
git merge nome-da-mudanca
git push
git branch -d nome-da-mudanca
```

---

## 14. Ideias para o futuro

- **SEO técnico**: `robots.txt`, `sitemap.xml` gerado pelo Eleventy, dados estruturados (JewelryStore na home, Product/Offer em cada peça, BreadcrumbList), descrições melhores por peça e hierarquia H2 na página de categoria.
- **Fotos menores nos cards** (600 px), mantendo 1200 px no zoom.
- **Recortar em 4:5** as fotos fora do formato (ex.: Colar Jasmin Trançada, Brinco Coração Amore).
- **Mais fotos de campanha** para o carrossel do topo.
- **Logo em vetor** da cliente para o favicon ficar perfeito.
- **Domínio próprio** e **Perfil da Empresa no Google**.
- **Desconto no Pix** (se a loja oferecer), mostrado junto ao preço.

---

## 15. Histórico do projeto

O histórico completo está no Git (`git log`). Em resumo:

1. **Início (set/2026):** páginas HTML estáticas com CSS e JS separados; design da home aplicado às categorias.
2. **Organização:** produtos em JSON, Instagram como canal de venda, caminhos relativos, Open Graph, favicon, fotos em WebP, "reduzir movimento".
3. **Padronização:** código e histórico em inglês, interface em português, repositório renomeado para `glanz-catalog`.
4. **Migração para o Eleventy:** moldes, JS em módulos, validação de dados, página 404, CI/CD com GitHub Actions.
5. **Funcionalidades:** página por peça, zoom por pinça, lista de interesse, selos, home mais rica, "Como comprar", compatibilidade total com iPhone, testes com Playwright.
6. **Negócio:** peças únicas e coleção bimestral (vendidas, aviso automático da coleção, 404 de peça antiga), políticas de pagamento, entrega e garantia, busca.
7. **Catálogo real:** 89 peças com fotos e preços reais; `npm run images` com cadastro automático.
8. **Ordenar e filtrar** nas categorias (A–Z por padrão).
9. **Hospedagem no Cloudflare Pages** (`glanzsemijoias.pages.dev`), GitHub Pages desligado.
10. **Redesign:** topo com foto de campanha e coleção, fileiras por categoria, cards com foto em destaque, textos sem maiúsculas, nomes padronizados, carrossel do topo.
11. **Parcelas nos cards** e **novo favicon** (o "G" do logo).
