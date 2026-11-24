package com.example.prova.pessoa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Acesso a dados de {@link Pessoa}. O Spring Data gera a implementação
 * em tempo de execução a partir do nome dos métodos.
 */
public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

    Optional<Pessoa> findByDocumento(String documento);

    boolean existsByDocumento(String documento);

    boolean existsByEmail(String email);
}
