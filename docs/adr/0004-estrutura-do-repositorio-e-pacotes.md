# 0004 — Estrutura do repositório e pacotes por funcionalidade

**Status:** aceito · 2026-11-24

## Contexto

A prova é Fullstack: haverá um backend Java e, depois, uma interface web. Dentro do backend, é preciso decidir como organizar as classes.

## Decisão

**Repositório** (monorepo simples):

```
/
├── backend/            projeto Spring Boot (Maven)
├── frontend/           interface web (spec posterior)
├── docker-compose.yml  sobe a infraestrutura (e, no fim, tudo)
└── docs/               ADRs, guia de estudo, docs para agentes
```

**Backend**: pacotes **por funcionalidade** sob `com.example.prova`:

- `pessoa/` — cadastro, consulta, listagem e exclusão
- `nacionalidade/` — integração com a nationalize.io
- `auth/` — usuário, login e JWT
- `shared/` — erros, segurança, configurações transversais

Cada pacote contém seu controller, service, repository e DTOs.

**Idioma**: domínio em português (`Pessoa`, `documento`, `sobrenome`), igual ao enunciado; termos técnicos Java/Spring mantidos (`Controller`, `Service`, `Repository`).

## Alternativas consideradas

- **Pacotes por camada** (`controllers/`, `services/`, `repositories/`): comum em tutoriais, mas espalha uma funcionalidade por várias pastas.
- **Código em inglês**: criaria uma tradução constante entre enunciado, rotas e código.

## Consequências

- Para entender uma funcionalidade basta abrir um pacote, como um package por domínio em Go.
- Classes podem ser package-private, expondo só o necessário.
