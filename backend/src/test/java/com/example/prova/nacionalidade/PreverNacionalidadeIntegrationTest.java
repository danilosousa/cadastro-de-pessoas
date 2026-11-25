package com.example.prova.nacionalidade;

import com.example.prova.TesteDeIntegracao;
import com.example.prova.WireMockConfiguration;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.example.prova.pessoa.CpfsDeTeste;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GET /findNacionalityByPerson/{documento}, testado pelo HTTP, com a
 * nationalize.io substituída por WireMock (respostas controladas pelo teste).
 */
@TesteDeIntegracao
class PreverNacionalidadeIntegrationTest {

    static final String CPF = CpfsDeTeste.gerar("529982247");

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    WireMockServer nationalize;

    @Autowired
    CacheManager caches;

    @BeforeEach
    void prepararCenario() throws Exception {
        jdbc.execute("TRUNCATE pessoa");
        nationalize.resetAll();
        caches.getCacheNames().forEach(nome -> caches.getCache(nome).clear());
    }

    void registrar(String cpf, String nome) throws Exception {
        mvc.perform(post("/registrarName").contentType(MediaType.APPLICATION_JSON).content("""
                        {"documento":"%s","nome":"%s","sobrenome":"Teste","email":"%s@exemplo.com"}
                        """.formatted(cpf, nome, cpf)))
                .andExpect(status().isCreated());
    }

    void nationalizeResponde(String prenome, String corpoJson) {
        nationalize.stubFor(get(urlPathEqualTo("/")).withQueryParam("name",
                        equalTo(prenome))
                .willReturn(okJson(corpoJson)));
    }

    ResultActions prever(String documento) throws Exception {
        return mvc.perform(MockMvcRequestBuilders
                .get("/findNacionalityByPerson/" + documento));
    }

    @Test
    void retornaPaisMaisProvavelComNomeEmPortugues() throws Exception {
        registrar(CPF, "Nathaniel");
        nationalizeResponde("nathaniel", """
                {"count":57823,"name":"nathaniel","country":[
                  {"country_id":"NG","probability":0.07579},
                  {"country_id":"US","probability":0.357622},
                  {"country_id":"GB","probability":0.054157}]}
                """);

        prever(CPF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documento").value(CPF))
                .andExpect(jsonPath("$.nome").value("Nathaniel"))
                .andExpect(jsonPath("$.nacionalidade.codigo").value("US"))
                .andExpect(jsonPath("$.nacionalidade.pais").value("Estados Unidos"))
                .andExpect(jsonPath("$.nacionalidade.probabilidade").value(0.357622))
                .andExpect(jsonPath("$.mensagem").doesNotExist());
    }

    @Test
    void usaApenasOPrimeiroNomeEmMinusculas() throws Exception {
        registrar(CPF, "Giulia Maria");
        nationalizeResponde("giulia", """
                {"count":1,"name":"giulia","country":[{"country_id":"IT","probability":0.9}]}
                """);

        prever(CPF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nacionalidade.pais").value("Itália"));

        nationalize.verify(1, getRequestedFor(urlPathEqualTo("/"))
                .withQueryParam("name", equalTo("giulia")));
    }

    @Test
    void semPrevisaoRetorna200ComNacionalidadeNulaEMensagem() throws Exception {
        registrar(CPF, "Zzxqv");
        nationalizeResponde("zzxqv", """
                {"count":0,"name":"zzxqv","country":[]}
                """);

        prever(CPF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nacionalidade").value(nullValue()))
                .andExpect(jsonPath("$.mensagem").value("Não há previsão de nacionalidade para o nome \"zzxqv\"."));
    }

    @Test
    void segundaConsultaDoMesmoNomeUsaCache() throws Exception {
        registrar(CPF, "Kenji");
        registrar(CpfsDeTeste.gerar("111444777"), "Kenji");
        nationalizeResponde("kenji", """
                {"count":1,"name":"kenji","country":[{"country_id":"JP","probability":0.95}]}
                """);

        prever(CPF).andExpect(status().isOk()).andExpect(jsonPath("$.nacionalidade.pais").value("Japão"));
        prever(CpfsDeTeste.gerar("111444777")).andExpect(status().isOk());
        prever(CPF).andExpect(status().isOk());

        nationalize.verify(1, getRequestedFor(urlPathEqualTo("/")));
    }

    @Test
    void cotaEsgotadaRetorna503() throws Exception {
        registrar(CPF, "Nathaniel");
        nationalize.stubFor(get(urlPathEqualTo("/")).willReturn(aResponse().withStatus(429)
                .withHeader("Content-Type", "application/json")
                .withBody("{\"error\":\"Request limit reached\"}")));

        prever(CPF)
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Limite do serviço externo atingido"));
    }

    @Test
    void erroNoServicoExternoRetorna502() throws Exception {
        registrar(CPF, "Nathaniel");
        nationalize.stubFor(get(urlPathEqualTo("/")).willReturn(aResponse().withStatus(500)));

        prever(CPF)
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.title").value("Serviço externo indisponível"));
    }

    @Test
    void lentidaoAcimaDoTimeoutRetorna502() throws Exception {
        registrar(CPF, "Nathaniel");
        nationalize.stubFor(get(urlPathEqualTo("/")).willReturn(okJson("""
                {"count":1,"name":"nathaniel","country":[{"country_id":"US","probability":0.3}]}
                """).withFixedDelay(5_000)));   // timeout dos testes é 2 s

        prever(CPF).andExpect(status().isBadGateway());
    }

    @Test
    void falhaNaoFicaEmCacheEProximaTentativaFunciona() throws Exception {
        registrar(CPF, "Nathaniel");
        nationalize.stubFor(get(urlPathEqualTo("/")).willReturn(aResponse().withStatus(500)));
        prever(CPF).andExpect(status().isBadGateway());

        nationalize.resetAll();
        nationalizeResponde("nathaniel", """
                {"count":1,"name":"nathaniel","country":[{"country_id":"US","probability":0.3}]}
                """);
        prever(CPF).andExpect(status().isOk()).andExpect(jsonPath("$.nacionalidade.codigo").value("US"));
    }

    @Test
    void pessoaNaoRegistradaRetorna404SemChamarServicoExterno() throws Exception {
        prever(CPF).andExpect(status().isNotFound());

        nationalize.verify(0, getRequestedFor(urlPathEqualTo("/")));
    }

    @Test
    void enviaAChaveDeApiConfigurada() throws Exception {
        registrar(CPF, "Nathaniel");
        nationalizeResponde("nathaniel", """
                {"count":1,"name":"nathaniel","country":[{"country_id":"US","probability":0.3}]}
                """);

        prever(CPF).andExpect(status().isOk());

        nationalize.verify(1, getRequestedFor(urlPathEqualTo("/"))
                .withQueryParam("name", equalTo("nathaniel"))
                .withQueryParam("apikey", equalTo(WireMockConfiguration.API_KEY_DE_TESTE)));
    }

    @Test
    void chaveDeApiRecusadaRetorna502() throws Exception {
        registrar(CPF, "Nathaniel");
        nationalize.stubFor(get(urlPathEqualTo("/")).willReturn(aResponse().withStatus(401)
                .withHeader("Content-Type", "application/json")
                .withBody("{\"error\":\"Invalid API key\"}")));

        prever(CPF)
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.title").value("Serviço externo indisponível"));
    }

    @Test
    void cpfInvalidoRetorna400() throws Exception {
        prever("52998224724")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros[0].campo").value("documento"));
    }
}
