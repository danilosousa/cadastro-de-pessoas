package com.quipux.prova.pessoa;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Testes unitários puros das regras de CPF (sem Spring, rodam em milissegundos). */
class DocumentoCpfTest {

    @ParameterizedTest
    @ValueSource(strings = {"52998224725", "11144477735", "12345678909"})
    void aceitaCpfsComDigitosVerificadoresCorretos(String cpf) {
        assertTrue(DocumentoCpf.temDigitosVerificadoresValidos(cpf));
    }

    @ParameterizedTest
    @ValueSource(strings = {"52998224724", "52998224715", "12345678900"})
    void rejeitaDigitosVerificadoresErrados(String cpf) {
        assertFalse(DocumentoCpf.temDigitosVerificadoresValidos(cpf));
    }

    @ParameterizedTest
    @ValueSource(strings = {"00000000000", "11111111111", "99999999999"})
    void rejeitaSequenciasRepetidas(String cpf) {
        assertFalse(DocumentoCpf.temDigitosVerificadoresValidos(cpf));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "5299822472", "529982247255", "5299822472a", "529.982.247-25"})
    void rejeitaTamanhoOuCaracteresInvalidos(String cpf) {
        assertFalse(DocumentoCpf.temDigitosVerificadoresValidos(cpf));
    }

    @ParameterizedTest
    @ValueSource(strings = {"529.982.247-25", "52998224725", "529982247-25", "529.982.24725"})
    void formatoComMascaraOpcionalAceitaVariacoes(String valor) {
        assertTrue(DocumentoCpf.temFormatoComMascaraOpcional(valor));
    }

    @ParameterizedTest
    @ValueSource(strings = {"529 982 247 25", "529/982/247-25", "abc.def.ghi-jk", "529..982.247-25"})
    void formatoComMascaraOpcionalRejeitaOutrosSeparadores(String valor) {
        assertFalse(DocumentoCpf.temFormatoComMascaraOpcional(valor));
    }

    @Test
    void normalizarRemovePontosETraco() {
        assertEquals("52998224725", DocumentoCpf.normalizar("529.982.247-25"));
    }

    @Test
    void geradorDeTesteProduzCpfValido() {
        assertEquals("52998224725", CpfsDeTeste.gerar("529982247"));
    }
}
