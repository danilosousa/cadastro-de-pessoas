# 0003 — PostgreSQL + Spring Data JPA + Flyway

**Status:** aceito · 2026-11-24

## Contexto

O enunciado aceita qualquer persistência (banco ou memória). A escolha deve ser simples de rodar para o avaliador e representativa de um ambiente real.

## Decisão

- **PostgreSQL 17** rodando via **Docker Compose** (desenvolvimento e entrega) e via **Testcontainers** (testes).
- **Spring Data JPA** (Hibernate) para acesso a dados.
- **Flyway** como dono do schema; o Hibernate roda com `ddl-auto: validate` e só confere se as entidades batem com as tabelas.

## Alternativas consideradas

- **H2 em memória**: zero setup, mas demonstra menos e se comporta diferente do Postgres em detalhes de SQL.
- **`ddl-auto: update`** (Hibernate criando tabelas): prático no início, mas imprevisível e não versionado.

## Consequências

- Requer Docker para rodar e testar; em troca, os testes usam o mesmo banco da produção.
- Toda mudança de schema é um arquivo `V<n>__descricao.sql` versionado e revisável.
