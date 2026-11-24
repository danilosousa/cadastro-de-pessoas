# 0005 — Documento (CPF) como parâmetro das rotas

**Status:** aceito · 2026-11-24

## Contexto

O enunciado pede um `{Parametro}`, à escolha de quem faz a prova, para consultar, excluir e prever a nacionalidade de uma pessoa. Também exige que cada API tenha uma validação de tipo diferente.

## Decisão

- O parâmetro é o **documento** da pessoa, um **CPF** guardado só com dígitos (11 caracteres) e único.
- A tabela tem um `id` interno (`bigserial`) que **nunca é exposto**: nem na URL, nem nas respostas.
- No `POST /registrarName` o CPF é aceito com ou sem máscara (`529.982.247-25` ou `52998224725`) e normalizado antes de salvar.
- Nas rotas `/{documento}` só são aceitos dígitos: ponto e traço na URL são estranhos e complicam o roteamento.
- A validação do CPF confere formato **e** dígitos verificadores, com uma anotação própria `@CPF` (Bean Validation).

## Alternativas consideradas

- **`id` numérico ou UUID na URL**: simples, mas sem significado para quem usa e expõe detalhes internos (ids sequenciais revelam volume e são enumeráveis).
- **Cédula colombiana**: a Quipux é colombiana, mas a cédula não tem dígito verificador público; validar só "5 a 15 dígitos" é uma validação pobre. O CPF permite demonstrar uma validação de padrão não trivial.
- **`@CPF` do Hibernate Validator** (`org.hibernate.validator.constraints.br.CPF`): existe, mas escrever a nossa mostra como criar uma constraint customizada e nos deixa controlar a regra da máscara (`permitirMascara`).

## Consequências

- Rotas legíveis: `GET /list/52998224725`.
- Um CPF inválido (400) é distinguido de um CPF válido inexistente (404).
- Pessoas sem CPF (estrangeiros) não são suportadas. Isso é aceitável no escopo da prova.
