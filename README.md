# Prova técnica Fullstack — Cadastro de pessoas

Sistema para registrar, consultar, listar e excluir pessoas e prever a provável nacionalidade de cada uma (via [nationalize.io](https://nationalize.io)):

- **Backend** em **Java 21 + Spring Boot 4.1**, com PostgreSQL e todas as rotas protegidas por **JWT**.
- **Interface web** em **React 19 + TypeScript**, servida por nginx, que abre direto na listagem.

Tudo sobe com `docker compose up --build`.

> 🌐 **Versão online**, caso não dê para rodar localmente: interface em <https://cadastro-de-pessoas.onrender.com> e API (Swagger) em <https://cadastro-de-pessoas-api.onrender.com/swagger-ui.html>. É o mesmo código, publicado no Render (plano gratuito) a cada push na `main`. O roteiro abaixo vale também para ela: troque `http://localhost:3005` e `http://localhost:8089` por esses endereços. Se a API estiver dormindo, o primeiro acesso pode levar alguns minutos ([ADR 0013](docs/adr/0013-versao-online-no-render.md)).

---

## Roteiro de avaliação (cerca de 10 minutos)

Pré-requisito: **Docker** com Docker Compose. Nada mais precisa estar instalado.

### 1. Subir tudo

```bash
docker compose up --build
```

Espere os três serviços (`postgres`, `backend`, `frontend`) ficarem de pé: cerca de 1 a 2 minutos na primeira vez. As portas padrão (3005 e 8089) foram escolhidas para não colidir com outras aplicações, e o banco não usa porta do host. Se mesmo assim alguma estiver em uso, troque-a: `APP_PORT=8090 WEB_PORT=3006 docker compose up --build`.

### 2. Interface web: <http://localhost:3005>

| # | Faça | Confira |
|---|---|---|
| 1 | Abra <http://localhost:3005> | A **lista de pessoas** abre direto, sem pedir login. O selo no canto do cabeçalho indica que a API está no ar |
| 2 | Observe a lista | **8 pessoas de exemplo**, em ordem alfabética, com o CPF mascarado; abaixo, "Página 1 de 1 · 8 pessoas" |
| 3 | Em **Buscar por CPF**, digite `12345678900` e clique em Buscar | "CPF inválido" (os dígitos verificadores são conferidos no navegador) |
| 4 | Busque `260.185.736-60` | Abre o detalhe de **Kenji Tanaka** |
| 5 | Clique em **Consultar nacionalidade** | **Japão (JP)**, com a probabilidade em porcentagem. Se aparecer "Cota de consultas esgotada", veja a observação abaixo |
| 6 | Volte para a lista e clique em **Registrar pessoa**. Clique em Registrar com tudo vazio | "É obrigatório" nos quatro campos |
| 7 | Preencha CPF `52998224724`, nome `Maria2`, e-mail `maria@` | "Deve ser um CPF válido", "Deve conter apenas letras", "Deve ser um e-mail válido" |
| 8 | Corrija para CPF `52998224725` (a máscara aparece ao digitar), nome `Maria Clara`, sobrenome `Souza`, e-mail `maria@exemplo.com`, e registre | Vai para o detalhe, com o aviso "Pessoa registrada" |
| 9 | Volte para a lista | Maria Clara Souza aparece; agora são 9 pessoas |
| 10 | Clique em Registrar pessoa de novo, com o **mesmo CPF** e outro e-mail | "Já existe uma pessoa registrada com este documento.", no campo CPF (409 da API) |
| 11 | Abra o detalhe de Maria Clara, clique em **Excluir** e depois em **Cancelar** | Nada muda |
| 12 | Clique em **Excluir** e confirme | Volta para a lista com "Pessoa excluída: Maria Clara Souza"; são 8 pessoas de novo |
| 13 | Abra <http://localhost:3005/pessoas/11144477735> | "Pessoa não encontrada" (CPF válido, não cadastrado) |

> **Observação sobre a nacionalidade:** sem chave de API, a nationalize.io permite só **10 consultas** por dia a partir de cada endereço IP. Esgotada a cota, a interface mostra "Cota de consultas esgotada" e a API responde **503**: é o tratamento de erro esperado. Para ampliar a cota, defina `NATIONALIZE_API_KEY` num arquivo `.env` ([Configuração](#configuração)).

### 3. API: autenticação e validações (Swagger ou curl)

**Pelo Swagger** (<http://localhost:8089/swagger-ui.html>): execute `POST /auth/login` (o exemplo `admin` / `admin123` já vem preenchido), copie o `token`, clique em **Authorize**, cole e teste as rotas.

**Pelo terminal:**

```bash
# Sem token: 401
curl -i http://localhost:8089/list

# Login: guarda o token
TOKEN=$(curl -s -X POST http://localhost:8089/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","senha":"admin123"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
```

Cada rota tem uma **validação diferente** (requisito 1g). Com o token:

| Rota | Comando | Esperado |
|---|---|---|
| `POST /registrarName`: corpo (CPF, letras, e-mail) | `curl -i -X POST http://localhost:8089/registrarName -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"documento":"529.982.247-24","nome":"Maria2","sobrenome":"","email":"maria@"}'` | **400** com a lista `erros` por campo |
| `GET /list`: limites numéricos | `curl -i "http://localhost:8089/list?size=500" -H "Authorization: Bearer $TOKEN"` | **400**: `size` "deve estar entre 1 e 100" |
| `GET /list/{documento}`: CPF com dígitos verificadores | `curl -i http://localhost:8089/list/12345678900 -H "Authorization: Bearer $TOKEN"` | **400**: "deve ser um CPF válido" |
| `DELETE /list/{documento}`: só o formato (11 dígitos) | `curl -i -X DELETE http://localhost:8089/list/123 -H "Authorization: Bearer $TOKEN"` | **400**: "deve conter exatamente 11 dígitos" |
| | `curl -i -X DELETE http://localhost:8089/list/12345678900 -H "Authorization: Bearer $TOKEN"` | **404**: o formato passa, e a pessoa não existe |
| `GET /findNacionalityByPerson/{documento}`: CPF + pessoa registrada | `curl -i http://localhost:8089/findNacionalityByPerson/11144477735 -H "Authorization: Bearer $TOKEN"` | **404**: CPF válido, não cadastrado |
| | `curl -i http://localhost:8089/findNacionalityByPerson/26018573660 -H "Authorization: Bearer $TOKEN"` | **200** com Japão, ou **503** se a cota acabou |

Todos os erros seguem o formato **RFC 7807** (`title`, `status`, `detail` e, nos de validação, `erros`).

### 4. Testes automatizados (opcional)

| | Comando | Requer |
|---|---|---|
| Backend (79 testes, PostgreSQL real via Testcontainers) | `cd backend && ./mvnw verify` | JDK 21 e Docker |
| Frontend (85 testes) | `cd frontend && npm ci && npm test` | Node 22 |

Para parar tudo: `Ctrl+C` e `docker compose down` (`down -v` apaga também os dados).

---

## Sumário

- [Roteiro de avaliação](#roteiro-de-avaliação-cerca-de-10-minutos)
- [Como rodar](#como-rodar)
- [Como usar a interface](#como-usar-a-interface)
- [Como usar a API](#como-usar-a-api)
- [Requisitos do enunciado → onde foram atendidos](#requisitos-do-enunciado--onde-foram-atendidos)
- [Rotas](#rotas)
- [Testes e cobertura](#testes-e-cobertura)
- [Arquitetura e decisões](#arquitetura-e-decisões)
- [Configuração](#configuração)

---

## Como rodar

### Opção 1: tudo com Docker (recomendado para avaliar)

Pré-requisito: **Docker** com Docker Compose.

```bash
docker compose up --build
```

Quando os três serviços estiverem de pé (cerca de 1 a 2 minutos na primeira vez):

| O quê | Onde |
|---|---|
| **Interface web** | <http://localhost:3005> |
| Swagger (testar a API no navegador) | <http://localhost:8089/swagger-ui.html> |
| Health | <http://localhost:8089/actuator/health> |
| Usuário / senha padrão | `admin` / `admin123` |

O compose sobe no perfil `dev`, que já cadastra **8 pessoas de exemplo** (Nathaniel, Giulia, Kenji, Olumide, Sofía, Hans, Pierre, João).

Para parar: `Ctrl+C` ou `docker compose down` (`down -v` apaga também os dados).

> As portas padrão são de propósito pouco comuns (**3005** e **8089**), e o Postgres não usa nenhuma porta do host, para não colidir com outras aplicações. Se mesmo assim uma delas estiver em uso, troque-a: `APP_PORT=8090 WEB_PORT=3006 docker compose up --build`.

### Opção 2: backend local (desenvolvimento)

Pré-requisitos: **JDK 21** e **Docker** (só para o banco).

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres   # só o banco, exposto na 5432
cd backend
./mvnw spring-boot:run            # Windows: .\mvnw.cmd spring-boot:run → http://localhost:8089
```

O `docker-compose.dev.yml` só acrescenta a porta do Postgres no host (`DB_PORT`, padrão 5432), que o compose principal não expõe.

Para carregar as pessoas de exemplo também nesse modo, use `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`.

### Opção 3: frontend local (desenvolvimento)

Pré-requisitos: **Node 22** e o backend rodando na porta 8089 (opção 2).

```bash
cd frontend
npm ci
npm run dev                       # http://localhost:5173
```

O Vite repassa `/api/*` ao backend (`API_URL` muda o destino).

---

## Como usar a interface

Abra <http://localhost:3005> (ou <http://localhost:5173> na opção 3). A interface abre direto na listagem: ela faz o login na API sozinha, com as credenciais do admin ([ADR 0012](docs/adr/0012-login-automatico-no-frontend.md)).

| Tela | O que dá para fazer | Rota da API usada |
|---|---|---|
| `/pessoas` | Listar com paginação (`?page=` na URL), buscar por CPF | `GET /list` |
| `/pessoas/nova` | Registrar, com máscara de CPF e validação no cliente; erros do servidor aparecem no campo | `POST /registrarName` |
| `/pessoas/{cpf}` | Ver os dados, consultar a nacionalidade sob demanda, excluir com confirmação | `GET /list/{cpf}`, `GET /findNacionalityByPerson/{cpf}`, `DELETE /list/{cpf}` |

O selo no cabeçalho mostra se a API está no ar.

---

## Como usar a API

Todas as rotas de negócio exigem um token. O fluxo:

**1. Login**

```bash
curl -X POST http://localhost:8089/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","senha":"admin123"}'
```

```json
{"token":"eyJhbGciOiJIUzI1NiJ9...","tipo":"Bearer","expiraEm":"2026-11-24T20:22:45Z"}
```

**2. Use o token** em `Authorization: Bearer <token>`:

```bash
TOKEN="cole-o-token-aqui"

# Registrar
curl -i -X POST http://localhost:8089/registrarName \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"documento":"529.982.247-25","nome":"Maria Clara","sobrenome":"Souza","email":"maria@exemplo.com"}'

# Listar (paginado)
curl "http://localhost:8089/list?page=0&size=20" -H "Authorization: Bearer $TOKEN"

# Consultar
curl http://localhost:8089/list/52998224725 -H "Authorization: Bearer $TOKEN"

# Prever nacionalidade
curl http://localhost:8089/findNacionalityByPerson/52998224725 -H "Authorization: Bearer $TOKEN"

# Excluir
curl -i -X DELETE http://localhost:8089/list/52998224725 -H "Authorization: Bearer $TOKEN"
```

**No Swagger:** execute `POST /auth/login` (o exemplo já vem preenchido), copie o `token`, clique em **Authorize** e cole. Todas as rotas passam a funcionar.

> **nationalize.io:** sem chave de API, a cota gratuita é de **10 consultas**. Quando ela acaba, a rota de nacionalidade responde **503** com uma mensagem clara. Respostas ficam em cache por 24 h por nome. Para ampliar a cota, defina `NATIONALIZE_API_KEY` (veja [Configuração](#configuração)).

---

## Requisitos do enunciado → onde foram atendidos

Resumo, com as minhas palavras, do que a prova pede e de como cada item foi resolvido.

| # | Requisito | Como foi atendido |
|---|---|---|
| 0 | Java, bibliotecas livres e alguma persistência | Java 21 + Spring Boot 4.1; **PostgreSQL** com Spring Data JPA e migrations **Flyway** ([ADR 0001](docs/adr/0001-java-21-e-spring-boot-4.md), [0003](docs/adr/0003-postgresql-jpa-flyway.md)) |
| 1a | `POST /registrarName`: registrar pessoa com documento, nome, sobrenome e e-mail | ✅ 201 + `Location`; CPF aceito com ou sem máscara; CPF e e-mail únicos (409) |
| 1b | `GET /list`: listar as pessoas | ✅ paginado (`page`, `size`), em ordem alfabética |
| 1c | Escolher um **parâmetro** para operar sobre uma pessoa | **Documento (CPF)**, chave natural única; o `id` interno nunca é exposto ([ADR 0005](docs/adr/0005-documento-cpf-como-parametro.md)) |
| 1d | `GET /list/{parametro}`: consultar uma pessoa | ✅ 200 / 404 |
| 1e | `DELETE /list/{parametro}`: excluir uma pessoa | ✅ 204 / 404 |
| 1f | `GET /findNacionalityByPerson/{parametro}`: consumir a nationalize.io e devolver o **nome** da nacionalidade provável | ✅ busca a pessoa, envia o primeiro nome, escolhe o país mais provável e devolve o nome **em português**, mais código ISO e probabilidade ([ADR 0007](docs/adr/0007-integracao-nationalize-com-cache.md)) |
| 1g | **Cada API** com pelo menos uma validação de tipo **diferente** | ✅ ver a coluna "Validação" na [tabela de rotas](#rotas): cada rota tem a sua |
| 2 | Autenticação na API mais crítica **ou** em todas | ✅ **todas** protegidas por **JWT** (login com usuário e senha) ([ADR 0008](docs/adr/0008-autenticacao-jwt.md)) |
| 3 | Pelo menos uma interface (de preferência web) consumindo uma das APIs | ✅ **interface web em React** consumindo **todas** as rotas: listagem paginada, busca, registro, detalhe, nacionalidade e exclusão ([ADR 0009](docs/adr/0009-stack-do-frontend.md)). O Swagger UI também está disponível |
| — | Entrega por repositório Git ou `.zip` | Este repositório, com histórico de commits incremental |

---

## Rotas

| Método e rota | Auth | Sucesso | Erros | Validação (diferente por rota) |
|---|---|---|---|---|
| `POST /auth/login` | pública | 200 `{token, tipo, expiraEm}` | 400, 401 | `@NotBlank` em usuário e senha |
| `POST /registrarName` | Bearer | 201 + `Location` | 400, 409 | **Corpo**: `@NotBlank` em todos os campos, `@Email`, nome/sobrenome só com letras (regex Unicode), `@CPF` com dígitos verificadores e máscara opcional |
| `GET /list?page&size` | Bearer | 200 página | 400 | **Query**: `@Min(0)` em `page`; `@Min(1)` e `@Max(100)` em `size`; tipo numérico |
| `GET /list/{documento}` | Bearer | 200 | 400, 404 | **Rota**: `@CPF` (11 dígitos + dígitos verificadores) |
| `DELETE /list/{documento}` | Bearer | 204 | 400, 404 | **Rota**: `@Pattern` de formato (exatamente 11 dígitos) |
| `GET /findNacionalityByPerson/{documento}` | Bearer | 200 | 400, 404, 502, 503 | **Rota**: `@CPF` + a pessoa precisa estar registrada |
| `GET /actuator/health` | pública | 200 | — | — |
| `/swagger-ui.html`, `/v3/api-docs` | públicas | — | — | — |

**Todos os erros** seguem o padrão **RFC 7807** (`application/problem+json`), e os de validação listam cada campo ([ADR 0006](docs/adr/0006-erros-em-rfc-7807.md)):

```json
{
  "title": "Dados inválidos",
  "status": 400,
  "detail": "Um ou mais campos são inválidos.",
  "instance": "/registrarName",
  "erros": [
    { "campo": "documento", "mensagem": "deve ser um CPF válido" },
    { "campo": "email", "mensagem": "deve ser um e-mail válido" }
  ]
}
```

Resposta de nacionalidade:

```json
{"documento":"26018573660","nome":"Kenji","nacionalidade":{"codigo":"JP","pais":"Japão","probabilidade":0.62}}
```

| Situação na nationalize.io | Resposta |
|---|---|
| país encontrado | 200 com `nacionalidade` |
| sem previsão para o nome | 200 com `nacionalidade: null` e `mensagem` |
| cota esgotada (429) | **503** |
| timeout (3 s), 5xx ou chave inválida | **502** |

---

## Testes e cobertura

### Backend

```bash
cd backend
./mvnw verify        # requer Docker (Testcontainers)
```

- **79 testes**: unitários da regra de CPF e de **integração pelo HTTP** (aplicação inteira + PostgreSQL real via **Testcontainers**).
- A nationalize.io é substituída por **WireMock** nos testes: cobre sucesso, lista vazia, 429, 5xx, timeout, chave de API e cache, sem depender da internet.
- Autenticação testada com token válido, adulterado, expirado, de outro emissor e ausente, além de CORS.
- **Cobertura** (JaCoCo): ~95% das linhas e ~80% dos ramos. Relatório em `backend/target/site/jacoco/index.html`.

### Frontend

```bash
cd frontend
npm ci
npm test             # Vitest
npm run lint         # ESLint
npm run build        # checa os tipos (tsc) e gera o build
```

- **85 testes** com Vitest + Testing Library: as telas são renderizadas com as rotas reais e a API é simulada no nível da rede com **MSW** (o paralelo do WireMock). Uma chamada sem resposta simulada falha o teste.
- Cobrem login automático e renovação do token, paginação pela URL, estados vazio e de erro, validação do formulário e erros do servidor por campo, 409, 404, nacionalidade (com país, sem previsão, 502, 503) e exclusão.
- A regra do CPF do cliente usa **os mesmos casos de teste** do `DocumentoCpfTest` do backend.

---

## Arquitetura e decisões

```
backend/src/main/java/com/example/prova/
├── pessoa/          registrar, listar, consultar, excluir; @CPF
├── nacionalidade/   cliente nationalize.io, cache, tradução de país
├── auth/            usuário, login, JWT, configuração de segurança
└── shared/          tratador global de erros, paginação, OpenAPI
```

Pacotes **por funcionalidade**, com controller → service → repository em cada um ([ADR 0004](docs/adr/0004-estrutura-do-repositorio-e-pacotes.md)).

```
frontend/src/
├── api/             cliente HTTP (fetch), ApiError, tipos dos DTOs
├── auth/            login automático, token no sessionStorage
├── pessoas/         lista, busca, registro, detalhe, exclusão
├── nacionalidade/   painel de nacionalidade
├── shared/          regra do CPF, componentes de formulário
└── components/ui/   componentes do shadcn/ui
```

O navegador só chama `/api/...` na própria origem; o nginx (no Docker) ou o Vite (no desenvolvimento) repassa ao backend, sem CORS ([ADR 0010](docs/adr/0010-proxy-api-e-mesma-origem.md)).

**Decisões registradas (ADRs)**: [`docs/adr/`](docs/adr/README.md)

| ADR | Decisão |
|---|---|
| [0001](docs/adr/0001-java-21-e-spring-boot-4.md) | Java 21 + Spring Boot 4.1 |
| [0002](docs/adr/0002-maven-com-wrapper.md) | Maven com wrapper |
| [0003](docs/adr/0003-postgresql-jpa-flyway.md) | PostgreSQL + JPA + Flyway |
| [0004](docs/adr/0004-estrutura-do-repositorio-e-pacotes.md) | Estrutura do repositório e pacotes por funcionalidade |
| [0005](docs/adr/0005-documento-cpf-como-parametro.md) | Documento (CPF) como parâmetro das rotas |
| [0006](docs/adr/0006-erros-em-rfc-7807.md) | Erros em RFC 7807 (ProblemDetail) |
| [0007](docs/adr/0007-integracao-nationalize-com-cache.md) | Integração com a nationalize.io, falhas e cache |
| [0008](docs/adr/0008-autenticacao-jwt.md) | Autenticação JWT em todas as APIs |
| [0009](docs/adr/0009-stack-do-frontend.md) | Stack do frontend: React + Vite + TypeScript |
| [0010](docs/adr/0010-proxy-api-e-mesma-origem.md) | Proxy `/api` e mesma origem |
| [0011](docs/adr/0011-token-no-sessionstorage.md) | Token JWT no `sessionStorage` |
| [0012](docs/adr/0012-login-automatico-no-frontend.md) | Login automático no frontend |
| [0013](docs/adr/0013-versao-online-no-render.md) | Versão online no Render |

Vocabulário do domínio: [`GLOSSARY.md`](GLOSSARY.md). Guia de estudo detalhado, capítulo a capítulo: [`docs/guia/`](docs/guia/README.md).

### Stack

| Camada | Tecnologia |
|---|---|
| Linguagem / runtime | Java 21 (Eclipse Temurin) |
| Framework | Spring Boot 4.1 (Web MVC, Validation, Data JPA, Security, Cache, Actuator) |
| Banco | PostgreSQL 17 + Flyway |
| Segurança | Spring Security OAuth2 Resource Server (JWT HS256), BCrypt |
| Cliente HTTP / cache | `RestClient` + Caffeine |
| Documentação da API | springdoc-openapi (Swagger UI) |
| Testes | JUnit 5, MockMvc, Testcontainers, WireMock, JaCoCo |
| Interface | React 19, TypeScript, Vite, React Router, TanStack Query |
| Formulários / UI | React Hook Form + Zod, Tailwind CSS 4 + shadcn/ui |
| Testes do frontend | Vitest, Testing Library, MSW |
| Servidor da interface | nginx (estáticos + proxy `/api`) |
| Empacotamento | Maven Wrapper, npm, Docker multi-stage, Docker Compose |

---

## Configuração

Todas as configurações têm padrão de desenvolvimento e podem ser sobrescritas por variáveis de ambiente. Com o Docker Compose, copie `.env.example` para `.env` e ajuste.

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_URL` / `DB_USER` / `DB_PASSWORD` | `jdbc:postgresql://localhost:5432/prova` / `prova` / `prova` | conexão com o banco |
| `ADMIN_USUARIO` / `ADMIN_SENHA` | `admin` / `admin123` | usuário criado na inicialização, se não existir |
| `JWT_SEGREDO` | valor de desenvolvimento | chave HS256, **mín. 32 caracteres**. **Troque em qualquer ambiente compartilhado** |
| `JWT_EXPIRACAO` | `1h` | validade do token |
| `CORS_ORIGENS` | `http://localhost:5173` | origens do navegador autorizadas |
| `NATIONALIZE_API_KEY` | vazio | chave opcional da nationalize.io (sem ela: 10 consultas) |
| `NATIONALIZE_URL` / `NATIONALIZE_TIMEOUT` | `https://api.nationalize.io` / `3s` | integração externa |
| `SPRING_PROFILES_ACTIVE` | `dev` no compose | `dev` carrega as pessoas de exemplo |
| `WEB_PORT` / `APP_PORT` | `3005` / `8089` | portas no host (compose) |
| `DB_PORT` | `5432` | porta do Postgres no host, só com `docker-compose.dev.yml` |
| `SERVER_PORT` | `8089` | porta em que o backend escuta (local ou no container) |
| `VITE_API_USUARIO` / `VITE_API_SENHA` | `admin` / `admin123` | credenciais do login automático da interface, embutidas no build; o compose usa `ADMIN_USUARIO` / `ADMIN_SENHA` |

> ⚠️ Os padrões de senha e de `JWT_SEGREDO` existem para a avaliação rodar sem configuração. Não os use em produção.

> ⚠️ **A interface não pede login**: ela entra na API sozinha, e as credenciais ficam visíveis no JavaScript entregue ao navegador. Foi uma escolha para a demonstração; a API continua exigindo token de qualquer outro cliente. Em produção, voltaria uma tela de login ou um provedor de identidade ([ADR 0012](docs/adr/0012-login-automatico-no-frontend.md)).
