package com.quipux.prova.nacionalidade;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Resposta de {@code GET /findNacionalityByPerson/{documento}}.
 *
 * @param nacionalidade país mais provável, ou {@code null} se a API não tiver previsão
 * @param mensagem      explicação quando não há previsão (omitida quando há)
 */
public record NacionalidadeResponse(
        String documento,
        String nome,
        NacionalidadeProvavel nacionalidade,
        @JsonInclude(JsonInclude.Include.NON_NULL) String mensagem
) {
    /**
     * @param codigo        código ISO 3166-1 alfa-2 (ex.: "US")
     * @param pais          nome do país em português (ex.: "Estados Unidos")
     * @param probabilidade entre 0 e 1
     */
    public record NacionalidadeProvavel(String codigo, String pais, double probabilidade) {
    }
}
