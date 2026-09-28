# Guia da loja — como atualizar o catálogo

Este guia explica como cadastrar e editar as peças do catálogo da GLANZ Semi Joias.

## Como funciona

Os dados do catálogo ficam em arquivos na pasta `src/_data/`:

| Arquivo              | O que tem |
|----------------------|-----------|
| `products.json`      | As peças (nome, categoria, preço, fotos) |
| `site.json`          | Usuário do Instagram, cidade, frase da home, garantias e endereço do site |
| `categories.json`    | Nome, descrição e foto (opcional) de cada categoria |
| `highlights.json`    | As fotos do carrossel da página inicial |
| `howToBuy.json`      | Os passos da seção "Como comprar" da página inicial |

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
| `isNew`    | Opcional. `true` mostra o selo "Novidade" e coloca a peça na seção "Novidades" da página inicial. |
| `bestseller` | Opcional. `true` mostra o selo "Mais vendido" e coloca a peça na seção "Mais vendidos". |
| `soldOut`  | Opcional. `true` mostra o selo "Esgotado". |
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

## Fotos

- Coloque as fotos das peças em `src/assets/products/`.
- Prefira o formato **WebP**, que é bem mais leve que JPG. Dá pra converter de graça em sites como [squoosh.app](https://squoosh.app).
- Use nomes sem acento e sem espaço, por exemplo `anel-solitario.webp`.
- No `products.json`, o caminho da foto começa em `assets/`, por exemplo `"assets/products/anel-solitario.webp"`.

## Garantias e "Como comprar"

As frases de garantia ("Banho triplo em ouro 18k", "Joias em zircônia" e "2 anos de garantia pelo fabricante") ficam no campo `"guarantees"` do `src/_data/site.json`. Elas aparecem na página de cada peça, logo abaixo do preço, e numa faixa da página inicial.

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
