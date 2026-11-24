package com.example.prova.pessoa;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.ElementType.RECORD_COMPONENT;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Valida que o valor é um CPF com dígitos verificadores corretos.
 *
 * <p>Por padrão exige só dígitos ({@code 12345678909}). Com
 * {@code permitirMascara = true} aceita também {@code 123.456.789-09}.
 *
 * <p>{@code null} é considerado válido: combine com {@code @NotBlank}
 * quando o campo for obrigatório (convenção do Bean Validation).
 */
@Documented
@Constraint(validatedBy = CpfValidator.class)
@Target({FIELD, PARAMETER, RECORD_COMPONENT})
@Retention(RUNTIME)
public @interface CPF {

    String message() default "deve ser um CPF válido";

    boolean permitirMascara() default false;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
