# GLANZ Semi Joias — Catálogo

Catálogo digital da GLANZ Semi Joias (Petrolina, PE). Site estático: HTML, CSS e JS puros, sem build.

## Cadastrar ou editar peças

Todas as peças ficam em [`produtos.json`](produtos.json). As páginas de categoria montam os cards a partir dele, então **não é preciso mexer no HTML**.

```json
{ "nome": "Brinco Coração Cristal", "categoria": "brincos", "preco": 49.90, "fotos": ["assets/produtos/brinco-coracao.jpg"] }
```

| Campo       | O que é |
|-------------|---------|
| `nome`      | Nome da peça. Também vai na mensagem do Direct ("Olá! Tenho interesse na peça: …"). |
| `categoria` | `aneis`, `brincos`, `colares`, `pulseiras` ou `pingentes`. |
| `preco`     | Preço com **ponto** como separador decimal (`49.90`). O site mostra como `R$ 49,90`. |
| `fotos`     | Lista de caminhos das fotos (coloque os arquivos em `assets/produtos/`). Com mais de uma, o card vira um carrossel. Vazia (`[]`) mostra "Foto em breve". |
| `exemplo`   | Opcional. `true` mostra o selo "Exemplo" (peças de demonstração). |

Cuidados ao editar o JSON: separe as peças por vírgula (sem vírgula depois da última) e use aspas duplas.

A contagem "Catálogo · N peças" é calculada sozinha.

## Instagram

O usuário do Instagram fica no campo `"instagram"` do `produtos.json` (hoje `glanz_semijoiaspnz`). Ele é usado em todos os botões do Direct e no rodapé de todas as páginas.

O botão "Perguntar no Direct" de cada peça:
- abre a conversa com a loja pelo link `https://ig.me/m/<usuário>` (no celular, abre o app do Instagram);
- tenta preencher a mensagem "Olá! Tenho interesse na peça: …" pelo parâmetro `?text=` — o Instagram nem sempre respeita esse parâmetro;
- por isso, também copia essa mensagem para a área de transferência e avisa "Mensagem copiada — é só colar no Direct".

## Estrutura das imagens

- `assets/marca/` — logo, marca e ícone (sunburst)
- `assets/produtos/` — fotos das peças

## Rodar localmente

O site precisa ser servido por um servidor HTTP (abrir o arquivo direto no navegador não carrega o `produtos.json`):

```bash
python -m http.server 8765
```

Depois acesse http://localhost:8765.
