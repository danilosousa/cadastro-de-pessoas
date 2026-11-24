package com.quipux.prova.pessoa;

import com.quipux.prova.shared.web.PaginaResponse;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

/**
 * Rotas HTTP de pessoa, com os caminhos exatamente como no enunciado.
 * Só traduz HTTP ⇄ domínio; a regra de negócio fica no {@link PessoaService}.
 *
 * <p>O enunciado pede uma validação de tipo <b>diferente</b> em cada API;
 * o comentário de cada método indica qual é a dele.
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

    /** Validação distintiva: limites numéricos nos parâmetros de paginação (@Min / @Max). */
    @GetMapping("/list")
    public PaginaResponse<PessoaResponse> listar(
            @Parameter(description = "Página, começando em 0", example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "deve ser maior ou igual a 0") int page,

            @Parameter(description = "Itens por página (1 a 100)", example = "20")
            @RequestParam(defaultValue = "20")
            @Min(value = 1, message = "deve estar entre 1 e 100")
            @Max(value = 100, message = "deve estar entre 1 e 100") int size) {

        return PaginaResponse.de(service.listar(page, size), PessoaResponse::de);
    }

    /** Validação distintiva: @CPF no parâmetro de rota (só dígitos, dígitos verificadores corretos). */
    @GetMapping("/list/{documento}")
    public PessoaResponse buscar(
            @Parameter(description = "CPF só com dígitos", example = "52998224725")
            @PathVariable @CPF String documento) {
        return PessoaResponse.de(service.buscarPorDocumento(documento));
    }

    /**
     * Validação distintiva: @Pattern de formato — exatamente 11 dígitos.
     * Aqui basta o formato: se não existir pessoa com esse documento, a resposta é 404.
     */
    @DeleteMapping("/list/{documento}")
    public ResponseEntity<Void> excluir(
            @Parameter(description = "Documento com exatamente 11 dígitos", example = "52998224725")
            @PathVariable @Pattern(regexp = "\\d{11}", message = "deve conter exatamente 11 dígitos") String documento) {
        service.excluir(documento);
        return ResponseEntity.noContent().build();
    }
}
