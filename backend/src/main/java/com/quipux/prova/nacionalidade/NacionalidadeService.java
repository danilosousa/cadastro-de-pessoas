package com.quipux.prova.nacionalidade;

import com.quipux.prova.nacionalidade.NacionalidadeResponse.NacionalidadeProvavel;
import com.quipux.prova.nacionalidade.NationalizeClient.PaisProvavel;
import com.quipux.prova.pessoa.Pessoa;
import com.quipux.prova.pessoa.PessoaService;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.Locale;

/** Prevê a nacionalidade de uma pessoa registrada a partir do seu prenome. */
@Service
public class NacionalidadeService {

    private static final Locale PORTUGUES = Locale.forLanguageTag("pt-BR");

    private final PessoaService pessoas;
    private final NationalizeClient nationalize;

    public NacionalidadeService(PessoaService pessoas, NationalizeClient nationalize) {
        this.pessoas = pessoas;
        this.nationalize = nationalize;
    }

    public NacionalidadeResponse preverPorDocumento(String documento) {
        Pessoa pessoa = pessoas.buscarPorDocumento(documento);   // 404 se não existir
        String prenome = prenome(pessoa.getNome());

        return nationalize.preverPaises(prenome).stream()
                .max(Comparator.comparingDouble(PaisProvavel::probability))
                .map(pais -> new NacionalidadeResponse(documento, pessoa.getNome(), traduzir(pais), null))
                .orElseGet(() -> new NacionalidadeResponse(documento, pessoa.getNome(), null,
                        "Não há previsão de nacionalidade para o nome \"" + prenome + "\"."));
    }

    /**
     * Primeiro termo do nome, em minúsculas: "Maria Clara" → "maria".
     * A API prevê melhor com um único prenome, e o minúsculo unifica a chave do cache.
     */
    static String prenome(String nome) {
        return nome.strip().split("[\\s\\-]+")[0].toLowerCase(PORTUGUES);
    }

    /** "US" → {codigo: "US", pais: "Estados Unidos", ...}, usando os nomes de país do próprio JDK. */
    static NacionalidadeProvavel traduzir(PaisProvavel pais) {
        String codigo = pais.codigo().toUpperCase(Locale.ROOT);
        String nome = new Locale.Builder().setRegion(codigo).build().getDisplayCountry(PORTUGUES);
        return new NacionalidadeProvavel(codigo, nome, pais.probability());
    }
}
