package com.quipux.prova.pessoa;

import java.util.regex.Pattern;

/**
 * Regras puras sobre CPF: formato, normalização e dígitos verificadores.
 * Sem dependência de Spring, para ser testável isoladamente.
 */
public final class DocumentoCpf {

    private static final Pattern SO_DIGITOS = Pattern.compile("\\d{11}");
    private static final Pattern COM_MASCARA_OPCIONAL = Pattern.compile("\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}");

    private DocumentoCpf() {
    }

    /** {@code true} se o valor tem exatamente 11 dígitos, sem máscara. */
    public static boolean temFormatoSoDigitos(String valor) {
        return valor != null && SO_DIGITOS.matcher(valor).matches();
    }

    /** {@code true} se o valor é {@code 12345678909} ou {@code 123.456.789-09} (pontos e traço opcionais). */
    public static boolean temFormatoComMascaraOpcional(String valor) {
        return valor != null && COM_MASCARA_OPCIONAL.matcher(valor).matches();
    }

    /** Remove pontos e traço: {@code 123.456.789-09 -> 12345678909}. */
    public static String normalizar(String valor) {
        return valor == null ? null : valor.replace(".", "").replace("-", "");
    }

    /**
     * Confere os dois dígitos verificadores de um CPF com 11 dígitos.
     * Sequências repetidas (000.000.000-00, 111...) passam no cálculo,
     * mas não são CPFs válidos, por isso são rejeitadas antes.
     */
    public static boolean temDigitosVerificadoresValidos(String onzeDigitos) {
        if (!temFormatoSoDigitos(onzeDigitos)) {
            return false;
        }
        if (onzeDigitos.chars().distinct().count() == 1) {
            return false;
        }
        int[] d = onzeDigitos.chars().map(c -> c - '0').toArray();
        return d[9] == digitoVerificador(d, 9) && d[10] == digitoVerificador(d, 10);
    }

    /** Calcula o dígito verificador a partir dos {@code quantidade} primeiros dígitos. */
    private static int digitoVerificador(int[] d, int quantidade) {
        int soma = 0;
        int peso = quantidade + 1;
        for (int i = 0; i < quantidade; i++) {
            soma += d[i] * peso--;
        }
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
    }
}
