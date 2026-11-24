package com.quipux.prova.nacionalidade;

import com.quipux.prova.pessoa.CPF;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** Rota de previsão de nacionalidade (a grafia "Nacionality" segue o enunciado). */
@RestController
public class NacionalidadeController {

    private final NacionalidadeService service;

    public NacionalidadeController(NacionalidadeService service) {
        this.service = service;
    }

    /**
     * Validação distintiva: @CPF no parâmetro + regra de existência
     * (a pessoa precisa estar registrada para ter um nome a consultar).
     */
    @Operation(
            summary = "Prevê a nacionalidade de uma pessoa registrada",
            description = """
                    O documento identifica a pessoa no nosso banco. O nome dela (só o primeiro termo) \
                    é enviado à nationalize.io (`GET https://api.nationalize.io/?name=<prenome>`), \
                    que não recebe o documento. Devolve o país de maior probabilidade, com o nome em português.""")
    @GetMapping("/findNacionalityByPerson/{documento}")
    public NacionalidadeResponse prever(
            @Parameter(description = "CPF só com dígitos de uma pessoa já registrada (usado para achar o nome dela)", example = "52998224725")
            @PathVariable @CPF String documento) {
        return service.preverPorDocumento(documento);
    }
}
