package com.quipux.prova.pessoa;

import com.quipux.prova.TesteDeIntegracao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** GET /list (paginado) e DELETE /list/{documento}, testados só pelo HTTP. */
@TesteDeIntegracao
class ListarEExcluirPessoaIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @BeforeEach
    void limparBanco() {
        jdbc.execute("TRUNCATE pessoa");
    }

    /** Registra uma pessoa pela própria API; o e-mail é derivado do CPF para não colidir. */
    String registrar(String noveDigitos, String nome, String sobrenome) throws Exception {
        String cpf = CpfsDeTeste.gerar(noveDigitos);
        mvc.perform(post("/registrarName").contentType(MediaType.APPLICATION_JSON).content("""
                        {"documento":"%s","nome":"%s","sobrenome":"%s","email":"%s@exemplo.com"}
                        """.formatted(cpf, nome, sobrenome, cpf)))
                .andExpect(status().isCreated());
        return cpf;
    }

    @Nested
    class Listar {

        @Test
        void listaVaziaRetornaPaginaSemConteudo() throws Exception {
            mvc.perform(get("/list"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(0)))
                    .andExpect(jsonPath("$.page").value(0))
                    .andExpect(jsonPath("$.size").value(20))
                    .andExpect(jsonPath("$.totalElements").value(0))
                    .andExpect(jsonPath("$.totalPages").value(0));
        }

        @Test
        void listaEmOrdemAlfabeticaDeNome() throws Exception {
            registrar("111111112", "Kenji", "Tanaka");
            registrar("222222223", "Giulia", "Rossi");
            registrar("333333334", "Nathaniel", "Souza");

            mvc.perform(get("/list"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[*].nome", contains("Giulia", "Kenji", "Nathaniel")))
                    .andExpect(jsonPath("$.totalElements").value(3))
                    .andExpect(jsonPath("$.content[0].id").doesNotExist());
        }

        @Test
        void paginaComTamanhoInformado() throws Exception {
            registrar("111111112", "Ana", "A");
            registrar("222222223", "Bia", "B");
            registrar("333333334", "Caio", "C");

            mvc.perform(get("/list").param("page", "1").param("size", "2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[*].nome", contains("Caio")))
                    .andExpect(jsonPath("$.page").value(1))
                    .andExpect(jsonPath("$.size").value(2))
                    .andExpect(jsonPath("$.totalElements").value(3))
                    .andExpect(jsonPath("$.totalPages").value(2));
        }

        @Test
        void paginaNegativaRetorna400() throws Exception {
            mvc.perform(get("/list").param("page", "-1"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                    .andExpect(jsonPath("$.erros[0].campo").value("page"))
                    .andExpect(jsonPath("$.erros[0].mensagem").value("deve ser maior ou igual a 0"));
        }

        @Test
        void tamanhoZeroRetorna400() throws Exception {
            mvc.perform(get("/list").param("size", "0"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.erros[0].campo").value("size"))
                    .andExpect(jsonPath("$.erros[0].mensagem").value("deve estar entre 1 e 100"));
        }

        @Test
        void tamanhoAcimaDe100Retorna400() throws Exception {
            mvc.perform(get("/list").param("size", "101"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.erros[0].campo").value("size"));
        }

        @Test
        void parametroNaoNumericoRetorna400() throws Exception {
            mvc.perform(get("/list").param("page", "abc"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                    .andExpect(jsonPath("$.title").value("Dados inválidos"))
                    .andExpect(jsonPath("$.erros[0].campo").value("page"))
                    .andExpect(jsonPath("$.erros[0].mensagem").value("tipo inválido"));
        }
    }

    @Nested
    class Excluir {

        @Test
        void excluiPessoaERetorna204() throws Exception {
            String cpf = registrar("529982247", "Nathaniel", "Souza");

            mvc.perform(delete("/list/" + cpf))
                    .andExpect(status().isNoContent())
                    .andExpect(content().string(""));

            mvc.perform(get("/list/" + cpf)).andExpect(status().isNotFound());
        }

        @Test
        void excluirInexistenteRetorna404() throws Exception {
            mvc.perform(delete("/list/" + CpfsDeTeste.gerar("529982247")))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.title").value("Pessoa não encontrada"));
        }

        @Test
        void excluirDuasVezesRetorna404NaSegunda() throws Exception {
            String cpf = registrar("529982247", "Nathaniel", "Souza");

            mvc.perform(delete("/list/" + cpf)).andExpect(status().isNoContent());
            mvc.perform(delete("/list/" + cpf)).andExpect(status().isNotFound());
        }

        @Test
        void documentoComMenosDe11DigitosRetorna400() throws Exception {
            mvc.perform(delete("/list/1234567890"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.erros[0].campo").value("documento"))
                    .andExpect(jsonPath("$.erros[0].mensagem").value("deve conter exatamente 11 dígitos"));
        }

        @Test
        void documentoComLetrasRetorna400() throws Exception {
            mvc.perform(delete("/list/1234567890a"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.erros[0].campo").value("documento"));
        }

        @Test
        void documentoComFormatoCertoMasDigitoVerificadorErradoRetorna404() throws Exception {
            // A validação do DELETE é só de formato (diferente do GET, que confere os dígitos).
            mvc.perform(delete("/list/12345678900"))
                    .andExpect(status().isNotFound());
        }
    }
}
