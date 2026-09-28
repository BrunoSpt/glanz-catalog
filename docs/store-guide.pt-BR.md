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
| `storePolicies.json` | Parcelamento, entrega e garantia |

Depois que uma alteração é salva no GitHub (dá pra editar direto pelo site do GitHub, clicando no arquivo e no ícone de lápis), o site é **gerado e publicado sozinho em 1 a 2 minutos**.

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
| `isNew`    | Opcional. `true` mostra o selo "Novidade" e coloca a peça na seção "Novidades" da página inicial. Use para peças que chegam **no meio** do ciclo de 2 meses (numa coleção nova, todas as peças são novas). |
| `soldOut`  | Opcional. `true` marca a peça como **vendida**: aparece o selo "Vendida", a peça vai para o fim da lista, sai das Novidades e não pode mais ser adicionada à lista de interesse. |
| `sample`   | Opcional. `true` mostra o selo "Exemplo" (peças de demonstração). Apague quando a peça for real. |

Exemplo de peça em promoção e na seção de novidades:

```json
{ "name": "Anel Infinito", "category": "rings", "price": 39.90, "compareAtPrice": 47.90, "isNew": true, "photos": ["assets/products/anel-infinito.webp"] }
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

1. **Fotos:** apague da pasta `src/assets/products/` as fotos das peças que foram embora e coloque as fotos das peças novas.
2. **Peças:** no `src/_data/products.json`, apague as linhas das peças que foram embora (incluindo as vendidas) e cadastre as novas.
3. **Carrossel da página inicial:** no `src/_data/highlights.json`, troque as fotos de destaque pelas da coleção nova. Cada destaque tem a foto (`image`), a largura e a altura dela em pixels (`width` e `height`), uma descrição (`alt`) e o texto que aparece sobre a foto (`caption`).
4. **Categorias:** se a foto de alguma categoria no `src/_data/categories.json` (campo `image`) era de uma peça que foi embora, troque por uma foto nova ou apague o campo.
5. **Salve** as alterações. Se algo estiver errado (por exemplo, uma peça apontando para uma foto que foi apagada), o site não é atualizado e a aba **Actions** do GitHub mostra o problema.

### Aviso da coleção (automático)

A página inicial mostra, por exemplo, "Peças únicas · coleção de setembro e outubro · renovada a cada 2 meses". **Esse aviso muda sozinho** com base na data: em 1º de novembro passa a ser "coleção de novembro e dezembro", sem ninguém precisar mexer em nada.

Ele é calculado a partir do campo `"collection"` do `src/_data/site.json`:

- `"firstCycle": "2026-09"`: o mês em que começou um ciclo (setembro de 2026). Não precisa mudar.
- `"months": 2`: a duração de cada ciclo. Só mude se a loja passar a trocar as peças em outro intervalo.

**O que acontece com as clientes:**
- **Links antigos:** quem abrir o link de uma peça que já foi embora (enviado no Direct ou postado nos stories) vê "Essa peça não está mais disponível", seguido das peças disponíveis agora.
- **Lista de interesse:** peças que saíram são removidas sozinhas da lista de cada cliente, com um aviso.

## Parcelamento, entrega e garantia

Esses textos ficam no `src/_data/storePolicies.json` e aparecem na seção "Como comprar" da página inicial.

- **Parcelamento (`installments`):** cada regra diz a partir de qual valor (`above`) a compra pode ser dividida em quantas vezes sem juros (`count`). Por exemplo, `{ "above": 80, "count": 2 }` quer dizer "acima de R$ 80, em até 2x". O site usa essas regras para mostrar o parcelamento na página de cada peça e o parcelamento do total na lista de interesse.
- **Entrega (`delivery`):** cada frase vira um item da lista.
- **Garantia (`warranty`):** o resumo (`summary`), o que cobre (`covers`), o que não cobre (`doesNotCover`) e como solicitar (`howToClaim`).

## Fotos

- Coloque as fotos das peças em `src/assets/products/`.
- Prefira o formato **WebP**, que é bem mais leve que JPG. Dá pra converter de graça em sites como [squoosh.app](https://squoosh.app).
- Use nomes sem acento e sem espaço, por exemplo `anel-solitario.webp`.
- No `products.json`, o caminho da foto começa em `assets/`, por exemplo `"assets/products/anel-solitario.webp"`.

## Garantias e "Como comprar"

As frases de garantia ("Banho triplo em ouro 18k" e "2 anos de garantia pelo fabricante") ficam no campo `"guarantees"` do `src/_data/site.json`. Elas aparecem na página de cada peça, logo abaixo do preço, e numa faixa da página inicial.

Os passos da seção "Como comprar" ficam no `src/_data/howToBuy.json`.

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
