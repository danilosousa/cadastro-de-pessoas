package com.quipux.prova.pessoa;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

/**
 * Rotas HTTP de pessoa, com os caminhos exatamente como no enunciado.
 * Só traduz HTTP ⇄ domínio; a regra de negócio fica no {@link PessoaService}.
 */
@RestController
public class PessoaController {

    private final PessoaService service;

    public PessoaController(PessoaService service) {
        this.service = service;
    }

    /** Validação distintiva: corpo com @NotBlank, @Email, padrão de letras e @CPF (com máscara opcional). */
    @PostMapping("/registrarName")
    public ResponseEntity<PessoaResponse> registrar(@Valid @RequestBody RegistrarPessoaRequest dados) {
        Pessoa pessoa = service.registrar(dados);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/list/{documento}")
                .buildAndExpand(pessoa.getDocumento())
                .toUri();
        return ResponseEntity.created(location).body(PessoaResponse.de(pessoa));
    }

    /** Validação distintiva: @CPF no parâmetro de rota (só dígitos, dígitos verificadores corretos). */
    @GetMapping("/list/{documento}")
    public PessoaResponse buscar(@PathVariable @CPF String documento) {
        return PessoaResponse.de(service.buscarPorDocumento(documento));
    }
}
