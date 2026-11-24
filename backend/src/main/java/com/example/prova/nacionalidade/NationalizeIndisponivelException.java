package com.example.prova.nacionalidade;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/** A nationalize.io falhou, demorou demais ou respondeu algo inesperado. Vira 502 Bad Gateway. */
public class NationalizeIndisponivelException extends ErrorResponseException {

    public NationalizeIndisponivelException() {
        super(HttpStatus.BAD_GATEWAY, problema(), null);
    }

    private static ProblemDetail problema() {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_GATEWAY,
                "O serviço de previsão de nacionalidade não respondeu corretamente. Tente novamente em instantes.");
        problema.setTitle("Serviço externo indisponível");
        return problema;
    }
}
