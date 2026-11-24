package com.quipux.prova.shared.web;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Formato público de uma página de resultados.
 *
 * <p>Não devolvemos o {@code Page} do Spring direto: o JSON dele é grande,
 * cheio de detalhes internos ({@code pageable}, {@code sort}...) e pode mudar
 * entre versões. Este record é o contrato estável da API.
 */
public record PaginaResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static <E, T> PaginaResponse<T> de(Page<E> pagina, Function<E, T> conversor) {
        return new PaginaResponse<>(
                pagina.getContent().stream().map(conversor).toList(),
                pagina.getNumber(),
                pagina.getSize(),
                pagina.getTotalElements(),
                pagina.getTotalPages());
    }
}
