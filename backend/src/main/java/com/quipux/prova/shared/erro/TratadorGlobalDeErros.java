package com.quipux.prova.shared.erro;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.Comparator;
import java.util.List;

/**
 * Converte exceções em respostas RFC 7807 ({@code application/problem+json}).
 *
 * <p>Estender {@link ResponseEntityExceptionHandler} faz o Spring já devolver
 * {@code ProblemDetail} para os erros padrão do MVC (JSON malformado, rota
 * inexistente, método não suportado...) e para qualquer
 * {@code ErrorResponseException} — como as exceções de domínio de pessoa.
 * Aqui só personalizamos os erros de validação e adicionamos casos extras.
 */
@RestControllerAdvice
public class TratadorGlobalDeErros extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(TratadorGlobalDeErros.class);

    /** Um campo inválido na resposta de erro. */
    public record ErroDeCampo(String campo, String mensagem) {
    }

    /** {@code @Valid @RequestBody} falhou (ex.: corpo do POST /registrarName). */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

        List<ErroDeCampo> erros = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new ErroDeCampo(e.getField(), e.getDefaultMessage()))
                .sorted(Comparator.comparing(ErroDeCampo::campo).thenComparing(ErroDeCampo::mensagem))
                .toList();
        return ResponseEntity.status(status).headers(headers).body(problemaDeValidacao(erros));
    }

    /**
     * Restrição direto no parâmetro do controller falhou (ex.: {@code @PathVariable @CPF}).
     * Desde o Spring 6.1 o próprio MVC valida esses parâmetros, sem precisar de {@code @Validated}.
     */
    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(
            HandlerMethodValidationException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

        List<ErroDeCampo> erros = ex.getParameterValidationResults().stream()
                .flatMap(resultado -> resultado.getResolvableErrors().stream()
                        .map(erro -> new ErroDeCampo(
                                erro instanceof FieldError fe ? fe.getField() : resultado.getMethodParameter().getParameterName(),
                                erro.getDefaultMessage())))
                .sorted(Comparator.comparing(ErroDeCampo::campo).thenComparing(ErroDeCampo::mensagem))
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).headers(headers).body(problemaDeValidacao(erros));
    }

    /**
     * Violação de unique no banco que escapou da checagem do service
     * (duas requisições simultâneas com o mesmo CPF, por exemplo).
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail conflitoNoBanco(DataIntegrityViolationException ex) {
        log.warn("Violação de integridade: {}", ex.getMostSpecificCause().getMessage());
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, "O registro conflita com dados já existentes.");
        problema.setTitle("Conflito de dados");
        return problema;
    }

    /** Qualquer erro inesperado: loga o detalhe e devolve 500 sem vazar informação interna. */
    @ExceptionHandler(Exception.class)
    ProblemDetail erroInesperado(Exception ex) {
        log.error("Erro inesperado", ex);
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "Ocorreu um erro inesperado. Tente novamente mais tarde.");
        problema.setTitle("Erro interno");
        return problema;
    }

    private static ProblemDetail problemaDeValidacao(List<ErroDeCampo> erros) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "Um ou mais campos são inválidos.");
        problema.setTitle("Dados inválidos");
        problema.setProperty("erros", erros);
        return problema;
    }
}
