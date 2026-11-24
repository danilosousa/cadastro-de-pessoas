# Glossário

Termos do domínio e como aparecem no código. Use exatamente estes nomes em código, testes, tickets e docs.

## Domínio

| Termo | Definição | No código |
|---|---|---|
| **Pessoa** | Alguém registrado no sistema, com documento, nome, sobrenome e e-mail. | `Pessoa`, tabela `pessoa` |
| **Documento** | O CPF da pessoa, guardado só com dígitos (11). É o identificador público da pessoa e o `{Parametro}` das rotas do enunciado. Evite: "id", "cpf" como nome de campo. | `documento` |
| **CPF** | Cadastro de Pessoas Físicas: 9 dígitos base + 2 dígitos verificadores. É o formato do documento. | `@CPF`, `DocumentoCpf` |
| **Máscara** | A forma pontuada do CPF (`529.982.247-25`). Aceita só na entrada do registro. | `permitirMascara` |
| **Registrar** | Criar uma pessoa no sistema (`POST /registrarName`). Evite: "cadastrar", "criar" em nomes de método. | `registrar(...)` |
| **Prenome** | Primeiro termo do `nome`, em minúsculas ("Maria Clara" → "maria"). É o que se envia à nationalize.io e a chave do cache. | `prenome(...)` |
| **Nacionalidade provável** | O país de maior probabilidade previsto para o prenome: código ISO, nome em pt-BR e probabilidade (0 a 1). Pode não existir. | `NacionalidadeProvavel` |
| **nationalize.io** | API pública externa de previsão de nacionalidade por nome. Sempre chamada pelo `NationalizeClient`. | `NationalizeClient` |

## Técnico

| Termo | Definição |
|---|---|
| **ProblemDetail** | Corpo de erro no padrão RFC 7807 (`title`, `status`, `detail`, `instance` + extras como `erros`). Ver ADR 0006. |
| **Erro de campo** | Item de `erros[]` num ProblemDetail de validação: `{campo, mensagem}`. |
