package com.quipux.prova.pessoa;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Corpo do {@code POST /registrarName}.
 *
 * <p>Nome e sobrenome: letras (com acentos), separadas por espaço, hífen
 * ou apóstrofo — aceita "Maria Clara", "Ana-Lúcia", "D'Ávila"; rejeita
 * dígitos e símbolos.
 */
public record RegistrarPessoaRequest(

        @Schema(description = "CPF com ou sem máscara", example = "529.982.247-25")
        @NotBlank(message = "é obrigatório")
        @CPF(permitirMascara = true)
        String documento,

        @Schema(description = "Apenas letras (acentos, espaço, hífen e apóstrofo permitidos)", example = "Nathaniel")
        @NotBlank(message = "é obrigatório")
        @Size(max = 100, message = "deve ter no máximo 100 caracteres")
        @Pattern(regexp = PADRAO_NOME, message = "deve conter apenas letras")
        String nome,

        @Schema(description = "Apenas letras (acentos, espaço, hífen e apóstrofo permitidos)", example = "Souza")
        @NotBlank(message = "é obrigatório")
        @Size(max = 100, message = "deve ter no máximo 100 caracteres")
        @Pattern(regexp = PADRAO_NOME, message = "deve conter apenas letras")
        String sobrenome,

        @Schema(example = "nathaniel@exemplo.com")
        @NotBlank(message = "é obrigatório")
        @Size(max = 255, message = "deve ter no máximo 255 caracteres")
        @Email(message = "deve ser um e-mail válido")
        String email
) {
    /**
     * Uma ou mais palavras de letras Unicode, separadas por espaço, hífen ou apóstrofo.
     * O vazio é aceito de propósito: quem reclama de campo vazio é o {@code @NotBlank},
     * assim o cliente recebe um erro só ("é obrigatório") e não dois.
     */
    static final String PADRAO_NOME = "^(?:\\p{L}+(?:[ '\\-]\\p{L}+)*)?$";

    /**
     * Construtor compacto: roda quando o Jackson cria o record, ANTES da validação.
     * Aparar espaços aqui faz {@code " ana@x.com "} ser validado (e salvo) como {@code "ana@x.com"}.
     */
    public RegistrarPessoaRequest {
        documento = aparar(documento);
        nome = aparar(nome);
        sobrenome = aparar(sobrenome);
        email = aparar(email);
    }

    private static String aparar(String valor) {
        return valor == null ? null : valor.strip();
    }
}
