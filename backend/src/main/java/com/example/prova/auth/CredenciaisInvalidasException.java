package com.example.prova.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Usuário inexistente OU senha errada — de propósito a mesma mensagem para os dois,
 * para não revelar quais usuários existem. Vira 401.
 */
public class CredenciaisInvalidasException extends ErrorResponseException {

    public CredenciaisInvalidasException() {
        super(HttpStatus.UNAUTHORIZED, problema(), null);
    }

    private static ProblemDetail problema() {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Usuário ou senha inválidos.");
        problema.setTitle("Credenciais inválidas");
        return problema;
    }
}
