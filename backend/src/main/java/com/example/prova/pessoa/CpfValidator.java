package com.example.prova.pessoa;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/** Implementação da anotação {@link CPF}. */
public class CpfValidator implements ConstraintValidator<CPF, String> {

    private boolean permitirMascara;

    @Override
    public void initialize(CPF anotacao) {
        this.permitirMascara = anotacao.permitirMascara();
    }

    @Override
    public boolean isValid(String valor, ConstraintValidatorContext contexto) {
        if (valor == null) {
            return true;
        }
        boolean formatoOk = permitirMascara
                ? DocumentoCpf.temFormatoComMascaraOpcional(valor)
                : DocumentoCpf.temFormatoSoDigitos(valor);
        return formatoOk && DocumentoCpf.temDigitosVerificadoresValidos(DocumentoCpf.normalizar(valor));
    }
}
