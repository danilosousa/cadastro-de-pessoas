package com.example.prova;

import com.example.prova.auth.TokenService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * Faz o {@code MockMvc} dos testes de integração enviar, por padrão,
 * {@code Authorization: Bearer <token>} com um token real, emitido pelo
 * próprio {@link TokenService} da aplicação e validado pelo filtro de
 * segurança de verdade.
 *
 * <p>Assim os testes de pessoa e nacionalidade continuam focados no seu
 * assunto. A autenticação em si (login, 401, rotas públicas) é testada em
 * {@code AutenticacaoIntegrationTest}, com um cliente sem token.
 */
@TestConfiguration(proxyBeanMethods = false)
class AutenticacaoDeTesteConfiguration {

    static final String USUARIO_DE_TESTE = "admin";

    @Bean
    MockMvcBuilderCustomizer enviarTokenPorPadrao(TokenService tokens) {
        return builder -> builder.defaultRequest(get("/")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokens.emitir(USUARIO_DE_TESTE).valor()));
    }
}
