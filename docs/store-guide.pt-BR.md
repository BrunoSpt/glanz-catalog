# Guia da loja — como atualizar o catálogo

Este guia explica como cadastrar e editar as peças do catálogo da GLANZ Semi Joias.

## Como funciona

Os dados do catálogo ficam em arquivos na pasta `src/_data/`:

| Arquivo              | O que tem |
|----------------------|-----------|
| `products.json`      | As peças (nome, categoria, preço, fotos) |
| `site.json`          | Usuário do Instagram, cidade, frase da home, aviso da coleção, garantias e endereço do site |
| `categories.json`    | Nome, descrição e foto (opcional) de cada categoria |
| `highlights.json`    | As fotos do carrossel da página inicial |
| `howToBuy.json`      | Os passos da seção "Como comprar" da página inicial |
| `storePolicies.json` | Formas de pagamento, parcelamento, entrega e garantia |

Depois que uma alteração é salva no GitHub (dá pra editar direto pelo site do GitHub, clicando no arquivo e no ícone de lápis), o site é **gerado, testado e publicado sozinho em uns 3 minutos**. Para publicar mudanças feitas no computador, veja [Publicar pelo computador (Git)](#publicar-pelo-computador-git).

Se houver algum erro no arquivo (uma vírgula faltando, uma categoria escrita errado, uma foto que não existe), **o site não é atualizado e continua no ar como estava**. Na aba **Actions** do GitHub aparece um X vermelho; clicando nele, a mensagem mostra exatamente qual peça e qual campo estão com problema.

## Cadastrar ou editar peças

Cada peça é uma linha no `src/_data/products.json`:

```json
{ "name": "Brinco Coração Cristal", "category": "earrings", "price": 49.90, "photos": ["assets/products/heart-earring.webp"] }
```

| Campo      | O que é |
|------------|---------|
| `name`     | Nome da peça, do jeito que as clientes vão ver. Também vai na mensagem do Direct ("Olá! Tenho interesse na peça: …"). |
| `category` | Categoria da peça (veja a tabela abaixo). |
| `price`    | Preço com **ponto** como separador decimal (`49.90`). O site mostra como `R$ 49,90`. |
| `photos`   | Lista de fotos da peça (os arquivos ficam na pasta `src/assets/products/`). Com mais de uma foto, o card vira um carrossel. Lista vazia (`[]`) mostra "Foto em breve". |
| `compareAtPrice` | Opcional. Preço antigo, para promoções. Precisa ser maior que o `price`. Mostra o selo "Promoção" e o preço antigo riscado. |
| `soldOut`  | Opcional. `true` marca a peça como **vendida**: aparece o selo "Vendida", a peça vai para o fim da lista e não pode mais ser adicionada à lista de interesse. |
| `sample`   | Opcional. `true` mostra o selo "Exemplo" (peças de demonstração). Apague quando a peça for real. |

Exemplo de peça em promoção:

```json
{ "name": "Anel Infinito", "category": "rings", "price": 39.90, "compareAtPrice": 47.90, "photos": ["assets/products/anel-infinito.webp"] }
```

### Página de cada peça

Cada peça ganha uma página própria, com endereço criado a partir do nome. Por exemplo, "Brinco Coração Cristal" fica em `…/products/brinco-coracao-cristal/`. Esse link pode ser enviado para clientes ou usado nos stories.

- **Não repita nomes:** duas peças com o mesmo nome teriam o mesmo endereço, e o site acusa esse erro.
- **Mudar o nome muda o link:** links antigos que já foram enviados deixam de funcionar.

### Categorias

| No site   | No `products.json` |
|-----------|--------------------|
| Anéis     | `rings`            |
| Brincos   | `earrings`         |
| Colares   | `necklaces`        |
| Pulseiras | `bracelets`        |
| Pingentes | `pendants`         |

### Cuidados ao editar

- Separe as peças por vírgula, **sem vírgula depois da última**.
- Use aspas duplas (`"`), nunca aspas simples.
- Os nomes dos campos (`name`, `price` etc.) ficam em inglês, exatamente como no exemplo.

A contagem "Catálogo · N peças" é calculada sozinha.

## Peça vendida

Como as peças são únicas, quando uma peça for vendida há duas opções:

- **Marcar como vendida** (`"soldOut": true`): a peça continua no site com o selo "Vendida" até a troca de coleção. Mostra para as clientes que as peças saem rápido.
- **Apagar a linha da peça**: ela some do catálogo na hora.

Nos dois casos, se a peça estiver na lista de interesse de alguma cliente, ela sai da lista automaticamente, com um aviso.

## Troca de coleção (a cada 2 meses)

Quando as peças não vendidas voltam para o fornecedor e chegam as novas:

1. **Fotos:** apague da pasta `src/assets/products/` as fotos das peças que foram embora e prepare as novas com `npm run images` (veja "Fotos" abaixo).
2. **Peças:** no `src/_data/products.json`, apague as linhas das peças que foram embora (incluindo as vendidas) e cadastre as novas.
3. **Carrossel da página inicial:** no `src/_data/highlights.json`, troque as fotos de destaque pelas da coleção nova. Cada destaque tem a foto (`image`), a largura e a altura dela em pixels (`width` e `height`), uma descrição (`alt`) e o texto que aparece sobre a foto (`caption`).
4. **Categorias:** se a foto de alguma categoria no `src/_data/categories.json` (campo `image`) era de uma peça que foi embora, troque por uma foto nova ou apague o campo.
5. **Salve** as alterações. Se algo estiver errado (por exemplo, uma peça apontando para uma foto que foi apagada), o site não é atualizado e a aba **Actions** do GitHub mostra o problema.

### Aviso da coleção (automático)

A página inicial mostra, por exemplo, "Peças únicas · coleção de setembro e outubro". **Esse aviso muda sozinho** com base na data: em 1º de novembro passa a ser "coleção de novembro e dezembro", sem ninguém precisar mexer em nada.

Ele é calculado a partir do campo `"collection"` do `src/_data/site.json`:

- `"firstCycle": "2026-09"`: o mês em que começou um ciclo (setembro de 2026). Não precisa mudar.
- `"months": 2`: a duração de cada ciclo. Só mude se a loja passar a trocar as peças em outro intervalo.

**O que acontece com as clientes:**
- **Links antigos:** quem abrir o link de uma peça que já foi embora (enviado no Direct ou postado nos stories) vê "Essa peça não está mais disponível", seguido das peças disponíveis agora.
- **Lista de interesse:** peças que saíram são removidas sozinhas da lista de cada cliente, com um aviso.

## Pagamento, entrega e garantia

Esses textos ficam no `src/_data/storePolicies.json` e aparecem na seção "Como comprar" da página inicial, nos blocos "Formas de pagamento", "Entrega" e "Garantia".

- **Formas de pagamento (`paymentMethods`):** cada item vira uma linha no bloco "Formas de pagamento" (hoje Pix, cartão de débito e cartão de crédito).
- **Parcelamento (`installments`):** cada regra diz a partir de qual valor (`above`) a compra pode ser dividida em quantas vezes sem juros (`count`). Por exemplo, `{ "above": 80, "count": 2 }` quer dizer "acima de R$ 80, em até 2x". O site usa essas regras para mostrar o parcelamento na página de cada peça e o parcelamento do total na lista de interesse.
- **Entrega (`delivery`):** cada frase vira um item da lista.
- **Garantia (`warranty`):** o resumo (`summary`), o que cobre (`covers`), o que não cobre (`doesNotCover`) e como solicitar (`howToClaim`).

## Fotos

### Preparar as fotos automaticamente (`npm run images`)

O jeito mais fácil é deixar o projeto converter as fotos sozinho:

1. Coloque as fotos originais na pasta `photos-inbox/` (na pasta principal do projeto), **separadas por categoria**: `photos-inbox/Anéis/`, `photos-inbox/Brincos/`, `photos-inbox/Colares/`, `photos-inbox/Pulseiras/` ou `photos-inbox/Pingentes/`. Fotos para o carrossel da página inicial que não são de uma peça só (modelo usando as joias, composições, fotos de campanha) vão em `photos-inbox/Destaques/`. Pode ser JPG, PNG ou WebP, de qualquer tamanho.
2. **Dê a cada foto o nome da peça e o preço**, separados por ` - ` (espaço, traço, espaço):
   - `Anel Laço - 59,90.jpg`: peça "Anel Laço", R$ 59,90.
   - `Anel Laço (2).jpg`: segunda foto da mesma peça (a primeira foto é a capa).
   - `Anel Laço.jpg`: sem preço; a peça entra com preço 0 e o site só é publicado depois que alguém preencher.

   Pode ter acento, espaço e hífen no nome ("Arco-Íris"). O preço aceita `175`, `59,90`, `59.90` ou `R$ 59,90`. O que separa o nome do preço é o traço **com espaço dos dois lados**; se o celular trocar o traço por um travessão (`–`), também funciona.
3. No terminal, rode `npm run images`.

O comando converte cada foto para WebP, reduz para 1200 px de largura, corrige a rotação das fotos de celular, cria um nome de arquivo limpo (`anel-laco.webp`) e salva em `src/assets/products/<categoria>/` (ou em `src/assets/highlights/`, no caso dos destaques). As originais vão para `photos-inbox/processed/` (essa pasta não vai para o site nem para o GitHub).

**As peças são cadastradas sozinhas** no `src/_data/products.json`, na categoria da pasta. Se já existir uma peça com o mesmo nome, ela não é duplicada: a foto nova é acrescentada a ela e, se o nome do arquivo tiver preço, o preço é atualizado. No fim, o terminal lista as peças novas, as atualizadas e as que estão **sem preço**: enquanto alguma estiver com preço 0, o site não é publicado.

Para os destaques, ele mostra as linhas para colar no `src/_data/highlights.json`, já com a largura e a altura da foto. Troque o `"alt"` por uma descrição da foto (por exemplo, "Modelo usando colar dourado com pingente de coração"; ela é lida por leitores de tela e ajuda no Google) e, se quiser, escreva um `"caption"`, o texto que aparece sobre a foto. Se a foto do carrossel for de uma peça do catálogo, não precisa convertê-la de novo: aponte direto para a foto da peça, como `"assets/products/rings/anel-laco.webp"`.

Ele também avisa quando uma foto não está em pé (4:5), porque ela vai ser cortada nos cards, ou quando é pequena demais.

**Fotos HEIC do iPhone:** se aparecer erro numa foto `.heic`, exporte a foto como JPG (no iPhone: Ajustes → Câmera → Formatos → "Mais Compatível") e rode de novo.

### Como as fotos devem ser

- **Em pé, no formato 4:5** (ex.: 1200 × 1500 px). Fotos quadradas ou deitadas são cortadas.
- **Peça no centro, com espaço em volta**: o card, o círculo da categoria e a busca cortam as bordas.
- **Mesmo fundo e mesma luz em todas**, sem filtros fortes, para o dourado aparecer com a cor real.
- **Sem texto, preço ou marca d'água** na foto.
- **Mais de uma foto por peça**, quando der: a primeira é a capa; uma foto da peça sendo usada ajuda a cliente a entender o tamanho.

### Sem o comando

Se preferir preparar à mão: converta para **WebP**, qualidade 80 e 1200 px de largura (por exemplo no [squoosh.app](https://squoosh.app)), use nomes sem acento e sem espaço (`anel-solitario.webp`) e coloque em `src/assets/products/` na pasta da categoria: `rings/` (anéis), `earrings/` (brincos), `necklaces/` (colares), `bracelets/` (pulseiras) ou `pendants/` (pingentes). No `products.json`, o caminho começa em `assets/`, por exemplo `"assets/products/rings/anel-solitario.webp"`.

## Garantias e "Como comprar"

As frases de garantia ("Banho triplo em ouro 18k", "Pedras em zircônia lapidadas" e "2 anos de garantia pelo fabricante") ficam no campo `"guarantees"` do `src/_data/site.json`. Elas aparecem numa faixa da página inicial e na página de cada peça, logo abaixo do preço. Frases marcadas com `"homeOnly": true` aparecem só na página inicial: é o caso de "Pedras em zircônia lapidadas", porque nem toda peça precisa ter zircônia.

Os passos da seção "Como comprar" ficam no `src/_data/howToBuy.json`.

## Busca

A lupa no cabeçalho (e o campo "Buscar peças" na página inicial) procura as peças pelo nome e pela categoria, sem precisar de acento: "coracao" encontra "Coração". Ela usa sempre as peças cadastradas no `products.json`, então **não precisa de nenhuma configuração**. Dica: nomes de peças descritivos ("Brinco Gota Zircônia") ajudam as clientes a encontrar pela busca.

## Lista de interesse

As clientes tocam no coração das peças para montar uma lista e enviam tudo de uma vez pelo Direct, numa mensagem com o nome e o preço de cada peça. O envio tem dois passos, porque o Instagram nem sempre aceita mensagem já escrita:

1. **Copiar lista:** o botão confirma na tela quando a mensagem foi copiada. A mensagem também aparece escrita, e dá pra copiar segurando o dedo nela.
2. **Abrir o Direct e colar:** abre a conversa com a loja, e a cliente cola a mensagem.

A lista fica salva só no celular ou computador de cada cliente, e a loja não precisa fazer nada para ela funcionar.

## Instagram

O usuário do Instagram fica no campo `"instagram"` do `src/_data/site.json` (hoje `glanz_semijoiaspnz`), sem o `@`. Ele é usado em todos os botões do Direct e no rodapé de todas as páginas.

O botão "Perguntar no Direct" de cada peça:

- abre a conversa com a loja (no celular, abre o app do Instagram);
- tenta já deixar escrita a mensagem "Olá! Tenho interesse na peça: …", com o link da página da peça. O Instagram nem sempre faz isso;
- por isso, também copia essa mensagem e avisa "Mensagem copiada — é só colar no Direct".

## Publicar pelo computador (Git)

Quando as mudanças são feitas no computador (por exemplo, depois do `npm run images`), elas só vão para o site depois de chegar à branch `main` do GitHub. Os comandos abaixo são digitados no terminal, dentro da pasta do projeto.

Antes de publicar, confira se está tudo certo:

```bash
npm test
```

### Mudança simples, direto na `main`

```bash
git add .
git commit -m "Update ring prices"
git push
```

A mensagem do commit (entre aspas) descreve a mudança, em inglês, como o resto do projeto.

### Mudança feita numa branch

Uma branch é uma cópia separada do projeto, usada para preparar uma mudança sem mexer na `main`. Para ver em qual branch você está, use `git status` (primeira linha). Com a mudança pronta numa branch, por exemplo `remove-new-badge`:

1. Salvar a mudança (commit) na branch:
   ```bash
   git add .
   git commit -m "Remove the Novidade badge"
   ```
2. Voltar para a `main` e trazer a mudança para ela (merge):
   ```bash
   git switch main
   git merge remove-new-badge
   ```
3. Enviar para o GitHub, o que publica o site:
   ```bash
   git push
   ```
4. Apagar a branch, que já não é mais necessária:
   ```bash
   git branch -d remove-new-badge
   ```
   Se a branch também tiver sido enviada ao GitHub, apague a cópia de lá:
   ```bash
   git push origin --delete remove-new-badge
   ```

O `-d` só apaga a branch se a mudança já estiver na `main`, então não há risco de perder trabalho.

Depois do `git push`, acompanhe na aba **Actions** do GitHub: o site é testado e publicado em uns 3 minutos. Se aparecer um X vermelho, nada foi publicado e o site continua como estava.
