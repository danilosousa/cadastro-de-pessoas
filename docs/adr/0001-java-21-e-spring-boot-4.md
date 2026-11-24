# 0001 — Java 21 + Spring Boot 4.1

**Status:** aceito · 2026-11-24

## Contexto

O enunciado exige Java e deixa as bibliotecas livres. O desenvolvedor vem de Node.js/Go e precisa de um framework que o avaliador reconheça de imediato e que tenha muito material de apoio.

## Decisão

- **Java 21 (LTS)**, distribuição Eclipse Temurin.
- **Spring Boot 4.1.x** (Spring Framework 7, Jackson 3, Hibernate 7).

O plano original era a linha 4.0.x. No dia da criação do projeto, o Spring Initializr oferecia 4.0.10 (linha em fim de suporte OSS), 4.1.3 e 4.2.0 (lançada dias antes). Escolhemos **4.1.3**: estável, com suporte ativo até meados de 2027, sem o risco de uma versão recém-lançada.

## Alternativas consideradas

- **Spring Boot 3.5**: mais tutoriais disponíveis, mas suporte OSS encerrado em 2026.
- **Quarkus / Micronaut / Javalin**: mais leves, porém menos esperados numa prova de mercado.
- **Java 25 (LTS)**: mais novo, mas 21 tem compatibilidade mais ampla de ferramentas e imagens.

## Consequências

- Parte do material online ainda é do Boot 3. Diferenças relevantes encontradas no caminho ficam registradas no guia (`docs/guia/`).
- A versão do springdoc precisa acompanhar a linha do Boot (springdoc 3.1.x ↔ Boot 4.1).
