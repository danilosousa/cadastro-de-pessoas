# 0010 — Proxy `/api` e mesma origem

**Status:** aceito · 2026-11-24

## Contexto

O frontend roda numa porta (5173 no dev, 3000 no Docker) e o backend em outra (8080). Para o navegador, portas diferentes são origens diferentes: toda chamada passaria pelas regras de CORS, com requisições *preflight* (`OPTIONS`) antes de cada `POST` ou chamada com `Authorization`.

## Decisão

O frontend chama sempre caminhos relativos começando com **`/api`**. Um proxy na mesma origem do frontend remove o prefixo e repassa ao backend:

- **Desenvolvimento:** o `server.proxy` do Vite (`/api/list` → `http://localhost:8080/list`). O destino pode mudar com a variável `API_URL`.
- **Docker:** o nginx que serve os estáticos (`location /api/` → `http://backend:8080/`).

## Alternativas consideradas

- **Chamar o backend direto com CORS**: funciona (o backend já tem CORS para `localhost:5173`), mas a URL da API teria de ser embutida no build (`VITE_API_URL`) e cada ambiente precisaria de um build diferente, além dos *preflights*.
- **Servir o frontend pelo próprio Spring** (`src/main/resources/static`): uma só imagem, mas acopla os dois builds e mistura as tecnologias num só artefato.

## Consequências

- Um único build do frontend serve qualquer ambiente; só o proxy sabe onde o backend está.
- Sem CORS e sem *preflight* para a interface. O CORS do backend continua configurado para quem chamar a API direto de outra origem.
- O backend não sabe do prefixo `/api`: as rotas do enunciado continuam exatamente como pedidas.
