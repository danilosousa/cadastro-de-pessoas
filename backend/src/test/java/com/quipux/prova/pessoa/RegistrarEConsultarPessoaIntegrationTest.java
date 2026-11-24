package com.quipux.prova.pessoa;

import com.quipux.prova.TesteDeIntegracao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * POST /registrarName e GET /list/{documento}, testados só pelo HTTP:
 * status, headers e corpo. Nenhum detalhe interno é verificado.
 */
@TesteDeIntegracao
class RegistrarEConsultarPessoaIntegrationTest {

    static final String CPF = CpfsDeTeste.gerar("529982247");        // 52998224725
    static final String OUTRO_CPF = CpfsDeTeste.gerar("111444777");  // 11144477735

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @BeforeEach
    void limparBanco() {
        jdbc.execute("TRUNCATE pessoa");
    }

    ResultActions registrar(String json) throws Exception {
        return mvc.perform(post("/registrarName").contentType(MediaType.APPLICATION_JSON).content(json));
    }

    static String pessoaJson(String documento, String nome, String sobrenome, String email) {
        return """
                {"documento": %s, "nome": %s, "sobrenome": %s, "email": %s}
                """.formatted(q(documento), q(nome), q(sobrenome), q(email));
    }

    static String q(String valor) {
        return valor == null ? "null" : "\"" + valor + "\"";
    }

    @Nested
    class Registrar {

        @Test
        void registraPessoaERetorna201ComLocation() throws Exception {
            registrar(pessoaJson(CPF, "Nathaniel", "Souza", "nathaniel@exemplo.com"))
                    .andExpect(status().isCreated())
                    .andExpect(header().string("Location", endsWith("/list/" + CPF)))
                    .andExpect(jsonPath("$.documento").value(CPF))
                    .andExpect(jsonPath("$.nome").value("Nathaniel"))
                    .andExpect(jsonPath("$.sobrenome").value("Souza"))
                    .andExpect(jsonPath("$.email").value("nathaniel@exemplo.com"))
                    .andExpect(jsonPath("$.criadoEm").value(notNullValue()))
                    .andExpect(jsonPath("$.id").doesNotExist());
        }

        @Test
        void aceitaCpfComMascaraEGuardaSoDigitos() throws Exception {
            registrar(pessoaJson(CpfsDeTeste.mascarar(CPF), "Giulia", "Rossi", "giulia@exemplo.com"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.documento").value(CPF));

            mvc.perform(get("/list/" + CPF)).andExpect(status().isOk());
        }

        @Test
        void normalizaEmailEApara() throws Exception {
            registrar(pessoaJson(CPF, "  Ana-Lúcia ", "D'Ávila", "  Ana@Exemplo.COM "))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.nome").value("Ana-Lúcia"))
                    .andExpect(jsonPath("$.sobrenome").value("D'Ávila"))
                    .andExpect(jsonPath("$.email").value("ana@exemplo.com"));
        }

        @Test
        void camposEmBrancoRetornam400ComListaDeErros() throws Exception {
            registrar(pessoaJson(null, "", " ", null))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                    .andExpect(jsonPath("$.title").value("Dados inválidos"))
                    .andExpect(jsonPath("$.erros[*].campo", hasItem("documento")))
                    .andExpect(jsonPath("$.erros[*].campo", hasItem("nome")))
                    .andExpect(jsonPath("$.erros[*].campo", hasItem("sobrenome")))
                    .andExpect(jsonPath("$.erros[*].campo", hasItem("email")))
                    // um erro por campo: vazio não dispara também o padrão de letras
                    .andExpect(jsonPath("$.erros", hasSize(4)));
        }

        @Test
        void emailInvalidoRetorna400() throws Exception {
            registrar(pessoaJson(CPF, "Kenji", "Tanaka", "nao-e-email"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.erros", hasSize(1)))
                    .andExpect(jsonPath("$.erros[0].campo").value("email"))
                    .andExpect(jsonPath("$.erros[0].mensagem").value("deve ser um e-mail válido"));
        }

        @Test
        void nomeComDigitosRetorna400() throws Exception {
            registrar(pessoaJson(CPF, "K3nji", "Tanaka", "kenji@exemplo.com"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.erros[0].campo").value("nome"))
                    .andExpect(jsonPath("$.erros[0].mensagem").value("deve conter apenas letras"));
        }

        @Test
        void cpfComDigitoVerificadorErradoRetorna400() throws Exception {
            registrar(pessoaJson("52998224724", "Kenji", "Tanaka", "kenji@exemplo.com"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.erros[0].campo").value("documento"))
                    .andExpect(jsonPath("$.erros[0].mensagem").value("deve ser um CPF válido"));
        }

        @Test
        void jsonMalformadoRetorna400EmProblemDetail() throws Exception {
            registrar("{ isso não é json")
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
        }

        @Test
        void documentoDuplicadoRetorna409() throws Exception {
            registrar(pessoaJson(CPF, "Nathaniel", "Souza", "nathaniel@exemplo.com"))
                    .andExpect(status().isCreated());

            registrar(pessoaJson(CpfsDeTeste.mascarar(CPF), "Outro", "Nome", "outro@exemplo.com"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.title").value("Pessoa já registrada"))
                    .andExpect(jsonPath("$.campo").value("documento"));
        }

        @Test
        void emailDuplicadoIgnorandoMaiusculasRetorna409() throws Exception {
            registrar(pessoaJson(CPF, "Nathaniel", "Souza", "nathaniel@exemplo.com"))
                    .andExpect(status().isCreated());

            registrar(pessoaJson(OUTRO_CPF, "Outro", "Nome", "NATHANIEL@exemplo.com"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.campo").value("e-mail"));
        }
    }

    @Nested
    class Consultar {

        @Test
        void retornaPessoaRegistrada() throws Exception {
            registrar(pessoaJson(CPF, "Nathaniel", "Souza", "nathaniel@exemplo.com"));

            mvc.perform(get("/list/" + CPF))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.documento").value(CPF))
                    .andExpect(jsonPath("$.nome").value("Nathaniel"));
        }

        @Test
        void cpfValidoNaoRegistradoRetorna404() throws Exception {
            mvc.perform(get("/list/" + OUTRO_CPF))
                    .andExpect(status().isNotFound())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                    .andExpect(jsonPath("$.title").value("Pessoa não encontrada"));
        }

        @Test
        void cpfComDigitoVerificadorErradoRetorna400() throws Exception {
            mvc.perform(get("/list/52998224724"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.erros[0].campo").value("documento"))
                    .andExpect(jsonPath("$.erros[0].mensagem").value("deve ser um CPF válido"));
        }

        @Test
        void cpfComMascaraNaRotaRetorna400() throws Exception {
            mvc.perform(get("/list/" + CpfsDeTeste.mascarar(CPF)))
                    .andExpect(status().isBadRequest());
        }
    }
}
