# 0007 — Integração com a nationalize.io: RestClient, tradução de falhas e cache

**Status:** aceito · 2026-11-24

## Contexto

`GET /findNacionalityByPerson/{documento}` precisa consultar a API pública nationalize.io e devolver "o nome da possível nacionalidade". A API:

- devolve uma lista de `{country_id, probability}` (código ISO, não o nome);
- sem chave de API, permite só **10 consultas** por janela (headers `x-rate-limit-limit: 10` e `x-rate-limit-reset`, medidos em 2026-11-24) e responde **429** quando elas acabam;
- pode ficar lenta ou fora do ar, como qualquer serviço externo.

## Decisão

1. **Cliente**: `RestClient` (Spring 6.1+), síncrono, com URL base e timeout (3 s, para conectar e para ler) vindos de configuração (`nationalize.url`, `nationalize.timeout`).
2. **Entrada**: só o **prenome** (primeiro termo do `nome`, em minúsculas). A API prevê melhor com um único prenome, e o minúsculo unifica a chave do cache.
3. **Saída**: o país de **maior probabilidade**, com o nome em pt-BR obtido do próprio JDK (`Locale#getDisplayCountry`), junto com o código ISO e a probabilidade. Não chamamos outra API para traduzir códigos.
4. **Falhas traduzidas em status próprios** (ProblemDetail):

   | Situação na nationalize.io | Nossa resposta |
   |---|---|
   | lista `country` vazia | **200** com `nacionalidade: null` e `mensagem` |
   | HTTP 429 (cota) | **503** Service Unavailable |
   | timeout, erro de rede, 5xx, resposta ilegível | **502** Bad Gateway |

5. **Cache** em memória com **Caffeine** via Spring Cache (`@Cacheable`): chave = prenome, TTL 24 h, máximo de 1000 entradas. Respostas vazias também entram no cache; **exceções não**, então uma falha é tentada de novo na chamada seguinte.

## Alternativas consideradas

- **`WebClient`** (reativo): exige entender o Reactor sem ganho aqui, porque a aplicação é síncrona (MVC).
- **OpenFeign**: uma dependência a mais para um único endpoint.
- **Devolver a lista completa de países**: o enunciado pede "a possível nacionalidade", no singular.
- **Cache distribuído (Redis)**: desnecessário com uma única instância; o Caffeine não exige infraestrutura.
- **Repassar o 429 como 429**: o cliente da *nossa* API não excedeu limite nenhum; o problema é a nossa dependência, e 503 comunica isso.

## Consequências

- Nomes repetidos (ex.: várias "Maria") consomem a cota uma única vez por dia.
- O cache é local: com várias instâncias, cada uma teria o seu (aceitável no escopo).
- Os testes substituem a API por **WireMock** só trocando `nationalize.url`; o código de produção não tem ganchos de teste.
