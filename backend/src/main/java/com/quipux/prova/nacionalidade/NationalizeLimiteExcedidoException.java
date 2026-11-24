package com.quipux.prova.nacionalidade;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/** A cota gratuita da nationalize.io acabou (HTTP 429). Vira 503 Service Unavailable. */
public class NationalizeLimiteExcedidoException extends ErrorResponseException {

    public NationalizeLimiteExcedidoException() {
        super(HttpStatus.SERVICE_UNAVAILABLE, problema(), null);
    }

    private static ProblemDetail problema() {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,
                "O limite diário de consultas ao serviço de previsão de nacionalidade foi atingido. Tente novamente mais tarde.");
        problema.setTitle("Limite do serviço externo atingido");
        return problema;
    }
}
