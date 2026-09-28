# Guia da loja — como atualizar o catálogo

Este guia explica como cadastrar e editar as peças do catálogo da GLANZ Semi Joias.

## Como funciona

Os dados do catálogo ficam em arquivos na pasta `src/_data/`:

| Arquivo              | O que tem |
|----------------------|-----------|
| `products.json`      | As peças (nome, categoria, preço, fotos) |
| `site.json`          | Usuário do Instagram, cidade, frase da home e endereço do site |
| `categories.json`    | Nome e descrição de cada categoria |
| `highlights.json`    | As fotos do carrossel da página inicial |

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
| `sample`   | Opcional. `true` mostra o selo "Exemplo" (peças de demonstração). Apague quando a peça for real. |

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

## Instagram

O usuário do Instagram fica no campo `"instagram"` do `src/_data/site.json` (hoje `glanz_semijoiaspnz`), sem o `@`. Ele é usado em todos os botões do Direct e no rodapé de todas as páginas.

O botão "Perguntar no Direct" de cada peça:

- abre a conversa com a loja (no celular, abre o app do Instagram);
- tenta já deixar escrita a mensagem "Olá! Tenho interesse na peça: …" — o Instagram nem sempre faz isso;
- por isso, também copia essa mensagem e avisa "Mensagem copiada — é só colar no Direct".
