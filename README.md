# Prova técnica Fullstack — API de pessoas

Backend em **Java 21 + Spring Boot 4.1** para registrar, consultar, listar e excluir pessoas, prever a provável nacionalidade de cada uma (via [nationalize.io](https://nationalize.io)) e proteger tudo com **JWT**.

> Status: **backend concluído**. A interface web está em desenvolvimento em `frontend/`.

---

## Sumário

- [Como rodar](#como-rodar)
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

Quando o log mostrar `Started ProvaFullstackApplication` (cerca de 1 minuto na primeira vez):

| O quê | Onde |
|---|---|
| Swagger (testar no navegador) | <http://localhost:8080/swagger-ui.html> |
| Health | <http://localhost:8080/actuator/health> |
| Usuário / senha padrão | `admin` / `admin123` |

O compose sobe no perfil `dev`, que já cadastra **8 pessoas de exemplo** (Nathaniel, Giulia, Kenji, Olumide, Sofía, Hans, Pierre, João).

Para parar: `Ctrl+C` ou `docker compose down` (`down -v` apaga também os dados).

### Opção 2: backend local (desenvolvimento)

Pré-requisitos: **JDK 21** e **Docker** (só para o banco).

```bash
docker compose up -d postgres     # só o banco
cd backend
./mvnw spring-boot:run            # Windows: .\mvnw.cmd spring-boot:run
```

Para carregar as pessoas de exemplo também nesse modo, use `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`.

---

## Como usar a API

Todas as rotas de negócio exigem um token. O fluxo:

**1. Login**

```bash
curl -X POST http://localhost:8080/auth/login \
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
curl -i -X POST http://localhost:8080/registrarName \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"documento":"529.982.247-25","nome":"Maria Clara","sobrenome":"Souza","email":"maria@exemplo.com"}'

# Listar (paginado)
curl "http://localhost:8080/list?page=0&size=20" -H "Authorization: Bearer $TOKEN"

# Consultar
curl http://localhost:8080/list/52998224725 -H "Authorization: Bearer $TOKEN"

# Prever nacionalidade
curl http://localhost:8080/findNacionalityByPerson/52998224725 -H "Authorization: Bearer $TOKEN"

# Excluir
curl -i -X DELETE http://localhost:8080/list/52998224725 -H "Authorization: Bearer $TOKEN"
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
| 3 | Pelo menos uma interface (de preferência web) consumindo uma das APIs | 🚧 em desenvolvimento em `frontend/`. Enquanto isso, o **Swagger UI** permite usar todas as rotas pelo navegador |
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

```bash
cd backend
./mvnw verify        # requer Docker (Testcontainers)
```

- **79 testes**: unitários da regra de CPF e de **integração pelo HTTP** (aplicação inteira + PostgreSQL real via **Testcontainers**).
- A nationalize.io é substituída por **WireMock** nos testes: cobre sucesso, lista vazia, 429, 5xx, timeout, chave de API e cache, sem depender da internet.
- Autenticação testada com token válido, adulterado, expirado, de outro emissor e ausente, além de CORS.
- **Cobertura** (JaCoCo): ~95% das linhas e ~80% dos ramos. Relatório em `backend/target/site/jacoco/index.html`.

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
| Empacotamento | Maven Wrapper, Docker multi-stage, Docker Compose |

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
| `APP_PORT` / `DB_PORT` | `8080` / `5432` | portas no host (compose) |

> ⚠️ Os padrões de senha e de `JWT_SEGREDO` existem para a avaliação rodar sem configuração. Não os use em produção.
