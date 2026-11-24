package com.quipux.prova.pessoa;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/** Já existe pessoa com o mesmo documento ou e-mail. Vira 409 em formato RFC 7807. */
public class PessoaDuplicadaException extends ErrorResponseException {

    public PessoaDuplicadaException(String campo) {
        super(HttpStatus.CONFLICT, problema(campo), null);
    }

    private static ProblemDetail problema(String campo) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, "Já existe uma pessoa registrada com este " + campo + ".");
        problema.setTitle("Pessoa já registrada");
        problema.setProperty("campo", campo);
        return problema;
    }
}
