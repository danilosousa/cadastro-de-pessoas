package com.example.prova.auth;

import com.example.prova.TesteDeIntegracao;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Login, proteção das rotas e rotas públicas. Usa um MockMvc <b>sem</b>
 * token padrão, como um cliente que acabou de chegar.
 */
@TesteDeIntegracao
class AutenticacaoIntegrationTest {

    @Autowired
    WebApplicationContext contexto;

    @Autowired
    JwtEncoder encoder;

    MockMvc anonimo;

    @BeforeEach
    void criarClienteSemToken() {
        anonimo = MockMvcBuilders.webAppContextSetup(contexto).apply(springSecurity()).build();
    }

    ResultActions login(String usuario, String senha) throws Exception {
        return anonimo.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"usuario": "%s", "senha": "%s"}
                        """.formatted(usuario, senha)));
    }

    String tokenValido() throws Exception {
        String corpo = login("admin", "admin123").andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.token");
    }

    @Nested
    class Login {

        @Test
        void credenciaisCorretasDevolvemToken() throws Exception {
            login("admin", "admin123")
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token", notNullValue()))
                    .andExpect(jsonPath("$.tipo").value("Bearer"))
                    .andExpect(jsonPath("$.expiraEm", notNullValue()));
        }

        @Test
        void senhaErradaRetorna401() throws Exception {
            login("admin", "errada")
                    .andExpect(status().isUnauthorized())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                    .andExpect(jsonPath("$.title").value("Credenciais inválidas"))
                    .andExpect(jsonPath("$.detail").value("Usuário ou senha inválidos."));
        }

        @Test
        void usuarioInexistenteRetornaAMesmaMensagemDeSenhaErrada() throws Exception {
            login("ninguem", "qualquer")
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.detail").value("Usuário ou senha inválidos."));
        }

        @Test
        void camposEmBrancoRetornam400() throws Exception {
            login("", " ")
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.erros[0].campo").value("senha"))
                    .andExpect(jsonPath("$.erros[1].campo").value("usuario"));
        }
    }

    @Nested
    class RotasProtegidas {

        @Test
        void semTokenRetorna401EmProblemDetail() throws Exception {
            anonimo.perform(get("/list"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, startsWith("Bearer")))
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                    .andExpect(jsonPath("$.title").value("Não autenticado"));
        }

        @Test
        void todasAsRotasDeNegocioExigemToken() throws Exception {
            anonimo.perform(post("/registrarName").contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());
            anonimo.perform(get("/list/52998224725")).andExpect(status().isUnauthorized());
            anonimo.perform(delete("/list/52998224725")).andExpect(status().isUnauthorized());
            anonimo.perform(get("/findNacionalityByPerson/52998224725")).andExpect(status().isUnauthorized());
        }

        @Test
        void tokenDoLoginDaAcesso() throws Exception {
            anonimo.perform(get("/list").header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenValido()))
                    .andExpect(status().isOk());
        }

        @Test
        void tokenAdulteradoRetorna401() throws Exception {
            String token = tokenValido();
            String adulterado = token.substring(0, token.length() - 4) + "AAAA";

            anonimo.perform(get("/list").header(HttpHeaders.AUTHORIZATION, "Bearer " + adulterado))
                    .andExpect(status().isUnauthorized())
                    .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, startsWith("Bearer error=\"invalid_token\"")))
                    .andExpect(jsonPath("$.detail", startsWith("Token inválido ou expirado")));
        }

        @Test
        void tokenExpiradoRetorna401() throws Exception {
            Instant duasHorasAtras = Instant.now().minus(2, ChronoUnit.HOURS);
            JwtClaimsSet claims = JwtClaimsSet.builder()
                    .issuer(TokenService.EMISSOR).subject("admin")
                    .issuedAt(duasHorasAtras).expiresAt(duasHorasAtras.plus(1, ChronoUnit.HOURS))
                    .build();
            String expirado = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                    .getTokenValue();

            anonimo.perform(get("/list").header(HttpHeaders.AUTHORIZATION, "Bearer " + expirado))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void tokenDeOutroEmissorRetorna401() throws Exception {
            JwtClaimsSet claims = JwtClaimsSet.builder()
                    .issuer("outro-sistema").subject("admin")
                    .issuedAt(Instant.now()).expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                    .build();
            String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                    .getTokenValue();

            anonimo.perform(get("/list").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class RotasPublicas {

        @Test
        void healthESwaggerNaoExigemToken() throws Exception {
            anonimo.perform(get("/actuator/health")).andExpect(status().isOk());
            anonimo.perform(get("/v3/api-docs")).andExpect(status().isOk());
            anonimo.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
        }

        @Test
        void swaggerDeclaraEsquemaBearer() throws Exception {
            anonimo.perform(get("/v3/api-docs"))
                    .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme").value("bearer"));
        }
    }

    @Nested
    class Cors {

        @Test
        void origemPermitidaRecebeCabecalhosCors() throws Exception {
            anonimo.perform(options("/list")
                            .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization"))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));
        }

        @Test
        void origemDesconhecidaEBloqueada() throws Exception {
            anonimo.perform(options("/list")
                            .header(HttpHeaders.ORIGIN, "http://site-malicioso.example")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                    .andExpect(status().isForbidden());
        }
    }
}
