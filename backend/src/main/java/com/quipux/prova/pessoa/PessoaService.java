package com.quipux.prova.pessoa;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/** Regras de negócio de pessoa. Não conhece HTTP: recebe e devolve objetos de domínio. */
@Service
public class PessoaService {

    private final PessoaRepository repository;

    public PessoaService(PessoaRepository repository) {
        this.repository = repository;
    }

    /**
     * Registra uma pessoa. Normaliza os dados (CPF só dígitos, e-mail minúsculo)
     * e garante unicidade de documento e e-mail. Os espaços já chegam aparados
     * pelo {@link RegistrarPessoaRequest}.
     */
    @Transactional
    public Pessoa registrar(RegistrarPessoaRequest dados) {
        String documento = DocumentoCpf.normalizar(dados.documento());
        String email = dados.email().toLowerCase(Locale.ROOT);

        if (repository.existsByDocumento(documento)) {
            throw new PessoaDuplicadaException("documento");
        }
        if (repository.existsByEmail(email)) {
            throw new PessoaDuplicadaException("e-mail");
        }

        Pessoa pessoa = new Pessoa(documento, dados.nome(), dados.sobrenome(), email);
        return repository.save(pessoa);
    }

    @Transactional(readOnly = true)
    public Pessoa buscarPorDocumento(String documento) {
        return repository.findByDocumento(documento)
                .orElseThrow(() -> new PessoaNaoEncontradaException(documento));
    }

    /**
     * Lista pessoas paginadas, em ordem alfabética de nome e sobrenome.
     * O documento desempata, garantindo ordem estável entre páginas.
     */
    @Transactional(readOnly = true)
    public Page<Pessoa> listar(int pagina, int tamanho) {
        Sort ordem = Sort.by("nome", "sobrenome", "documento");
        return repository.findAll(PageRequest.of(pagina, tamanho, ordem));
    }

    @Transactional
    public void excluir(String documento) {
        Pessoa pessoa = buscarPorDocumento(documento);
        repository.delete(pessoa);
    }
}
