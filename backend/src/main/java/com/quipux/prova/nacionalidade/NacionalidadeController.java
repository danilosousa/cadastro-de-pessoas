package com.quipux.prova.nacionalidade;

import com.quipux.prova.pessoa.CPF;
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
    @GetMapping("/findNacionalityByPerson/{documento}")
    public NacionalidadeResponse prever(
            @Parameter(description = "CPF só com dígitos de uma pessoa registrada", example = "52998224725")
            @PathVariable @CPF String documento) {
        return service.preverPorDocumento(documento);
    }
}
