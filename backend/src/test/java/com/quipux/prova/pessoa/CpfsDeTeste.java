package com.quipux.prova.pessoa;

/** Gera CPFs válidos para testes a partir de 9 dígitos base. */
public final class CpfsDeTeste {

    private CpfsDeTeste() {
    }

    /** Ex.: {@code gerar("529982247") -> "52998224725"}. */
    public static String gerar(String noveDigitos) {
        int[] d = new int[11];
        for (int i = 0; i < 9; i++) {
            d[i] = noveDigitos.charAt(i) - '0';
        }
        d[9] = dv(d, 9);
        d[10] = dv(d, 10);
        StringBuilder sb = new StringBuilder();
        for (int x : d) {
            sb.append(x);
        }
        return sb.toString();
    }

    /** Ex.: {@code mascarar("52998224725") -> "529.982.247-25"}. */
    public static String mascarar(String cpf) {
        return cpf.substring(0, 3) + "." + cpf.substring(3, 6) + "." + cpf.substring(6, 9) + "-" + cpf.substring(9);
    }

    private static int dv(int[] d, int n) {
        int soma = 0;
        for (int i = 0; i < n; i++) {
            soma += d[i] * (n + 1 - i);
        }
        int r = (soma * 10) % 11;
        return r == 10 ? 0 : r;
    }
}
