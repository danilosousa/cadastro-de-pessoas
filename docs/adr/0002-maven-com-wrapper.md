# 0002 — Maven com wrapper

**Status:** aceito · 2026-11-24

## Contexto

O avaliador precisa compilar e testar o projeto sem instalar ferramentas além do JDK (ou nem isso, via Docker).

## Decisão

Usar **Maven** com o **Maven Wrapper** (`mvnw` / `mvnw.cmd`) versionado no repositório.

## Alternativas consideradas

- **Gradle**: mais flexível e rápido em builds grandes, mas exige aprender uma DSL (Groovy/Kotlin) a mais; para um projeto deste tamanho o ganho é irrelevante.

## Consequências

- `./mvnw verify` baixa a versão certa do Maven e roda build + testes em qualquer máquina com JDK 21.
- O `pom.xml` concentra dependências e plugins, no papel que o `package.json` tem no Node.
