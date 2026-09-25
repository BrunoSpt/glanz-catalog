# Guia da loja — como atualizar o catálogo

Este guia explica como cadastrar e editar as peças do catálogo da GLANZ Semi Joias.

## Cadastrar ou editar peças

Todas as peças ficam no arquivo [`products.json`](../products.json), na pasta principal do projeto. As páginas de categoria montam os cards a partir dele, então **não é preciso mexer no HTML**.

Cada peça é uma linha assim:

```json
{ "name": "Brinco Coração Cristal", "category": "earrings", "price": 49.90, "photos": ["assets/products/heart-earring.webp"] }
```

| Campo      | O que é |
|------------|---------|
| `name`     | Nome da peça, do jeito que as clientes vão ver. Também vai na mensagem do Direct ("Olá! Tenho interesse na peça: …"). |
| `category` | Categoria da peça (veja a tabela abaixo). |
| `price`    | Preço com **ponto** como separador decimal (`49.90`). O site mostra como `R$ 49,90`. |
| `photos`   | Lista de fotos da peça (coloque os arquivos na pasta `assets/products/`). Com mais de uma foto, o card vira um carrossel. Lista vazia (`[]`) mostra "Foto em breve". |
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
- Se alguma página mostrar "Não foi possível carregar as peças", provavelmente falta ou sobra uma vírgula ou aspa no arquivo.

A contagem "Catálogo · N peças" é calculada sozinha.

## Fotos

- Coloque as fotos das peças em `assets/products/`.
- Prefira o formato **WebP**, que é bem mais leve que JPG. Dá pra converter de graça em sites como [squoosh.app](https://squoosh.app).
- Use nomes sem acento e sem espaço, por exemplo `anel-solitario.webp`.

## Instagram

O usuário do Instagram fica no campo `"instagram"` do `products.json` (hoje `glanz_semijoiaspnz`). Ele é usado em todos os botões do Direct e no rodapé de todas as páginas.

O botão "Perguntar no Direct" de cada peça:

- abre a conversa com a loja (no celular, abre o app do Instagram);
- tenta já deixar escrita a mensagem "Olá! Tenho interesse na peça: …" — o Instagram nem sempre faz isso;
- por isso, também copia essa mensagem e avisa "Mensagem copiada — é só colar no Direct".
