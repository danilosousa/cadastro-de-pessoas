package com.example.prova.pessoa;

import java.time.Instant;

/** Representação pública de uma {@link Pessoa}. Não expõe o id interno. */
public record PessoaResponse(
        String documento,
        String nome,
        String sobrenome,
        String email,
        Instant criadoEm
) {
    static PessoaResponse de(Pessoa pessoa) {
        return new PessoaResponse(
                pessoa.getDocumento(),
                pessoa.getNome(),
                pessoa.getSobrenome(),
                pessoa.getEmail(),
                pessoa.getCriadoEm());
    }
}
