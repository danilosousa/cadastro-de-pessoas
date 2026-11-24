package com.example.prova;

import com.github.tomakehurst.wiremock.WireMockServer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;

import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;

/**
 * Sobe um WireMock (servidor HTTP falso) no lugar da nationalize.io e aponta
 * a configuração {@code nationalize.url} para ele. O código de produção não
 * sabe que está sendo testado: ele só fala HTTP com outra URL.
 */
@TestConfiguration(proxyBeanMethods = false)
public class WireMockConfiguration {

    /** Timeout curto nos testes para o cenário de lentidão não deixar a suíte lenta. */
    static final String TIMEOUT_DE_TESTE = "500ms";

    /** Chave falsa: os testes verificam que ela é enviada no parâmetro {@code apikey}. */
    public static final String API_KEY_DE_TESTE = "chave-de-teste";

    @Bean(destroyMethod = "stop")
    WireMockServer nationalizeFalso() {
        WireMockServer servidor = new WireMockServer(options().dynamicPort());
        servidor.start();
        return servidor;
    }

    @Bean
    DynamicPropertyRegistrar nationalizeAponteParaWireMock(WireMockServer nationalizeFalso) {
        return registro -> {
            registro.add("nationalize.url", nationalizeFalso::baseUrl);
            registro.add("nationalize.timeout", () -> TIMEOUT_DE_TESTE);
            registro.add("nationalize.api-key", () -> API_KEY_DE_TESTE);
        };
    }
}
