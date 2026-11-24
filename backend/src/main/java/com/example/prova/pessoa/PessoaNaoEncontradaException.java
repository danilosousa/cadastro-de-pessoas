package com.example.prova.pessoa;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Nenhuma pessoa com o documento informado. Vira 404 em formato RFC 7807.
 *
 * <p>Estende {@link ErrorResponseException}: o Spring já sabe transformá-la
 * em resposta HTTP, então o tratador global não precisa conhecer o domínio.
 */
public class PessoaNaoEncontradaException extends ErrorResponseException {

    public PessoaNaoEncontradaException(String documento) {
        super(HttpStatus.NOT_FOUND, problema(documento), null);
    }

    private static ProblemDetail problema(String documento) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, "Nenhuma pessoa registrada com o documento " + documento + ".");
        problema.setTitle("Pessoa não encontrada");
        return problema;
    }
}
