# 0006 — Erros no formato RFC 7807 (ProblemDetail)

**Status:** aceito · 2026-11-24

## Contexto

Cada API precisa rejeitar dados inválidos, e o cliente (inclusive a interface web) precisa de um formato de erro previsível para mostrar mensagens por campo.

## Decisão

- Todos os erros respondem `application/problem+json` no padrão **RFC 7807 / RFC 9457** usando o `ProblemDetail` nativo do Spring.
- Um único `@RestControllerAdvice` (`TratadorGlobalDeErros`) estende `ResponseEntityExceptionHandler`:
  - erros de validação → 400 com `title: "Dados inválidos"` e a propriedade extra `erros: [{campo, mensagem}]`, ordenada;
  - violação de unique no banco (condição de corrida) → 409 genérico;
  - qualquer outra exceção → 500 genérico, com o detalhe só no log.
- As exceções de domínio (`PessoaNaoEncontradaException` → 404, `PessoaDuplicadaException` → 409) estendem `ErrorResponseException`, então o tratador global **não precisa conhecer o domínio**.
- Mensagens em português, definidas explicitamente nas anotações (não dependem do idioma da JVM).

Exemplo:

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

## Alternativas consideradas

- **Formato próprio** (`{ "error": "..." }`): mais simples, mas sem padrão; cada projeto inventa o seu.
- **Um `@ExceptionHandler` por exceção de domínio no advice**: funciona, mas acopla o pacote `shared` a todos os domínios.

## Consequências

- Os erros padrão do Spring (JSON malformado, rota inexistente, método não suportado) já saem no mesmo formato, sem código extra.
- O frontend pode mapear `erros[].campo` direto para os campos do formulário.
