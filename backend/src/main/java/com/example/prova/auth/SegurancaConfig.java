package com.example.prova.auth;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Segurança da API (ADR 0008):
 * <ul>
 *   <li>stateless, sem sessão e sem CSRF (o token vai no header, não em cookie);</li>
 *   <li>JWT HS256 validado pelo resource server do Spring Security;</li>
 *   <li>públicas só: login, Swagger e health; todo o resto exige {@code Bearer};</li>
 *   <li>401 no mesmo formato ProblemDetail do resto da API.</li>
 * </ul>
 */
@Configuration
public class SegurancaConfig {

    /** Origens do navegador autorizadas a chamar a API (bloco {@code cors:}). */
    @ConfigurationProperties(prefix = "cors")
    public record CorsProperties(List<String> origensPermitidas) {
    }

    @Bean
    SecurityFilterChain filtros(HttpSecurity http, AuthenticationEntryPoint naoAutenticado) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(rotas -> rotas
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(rs -> rs
                        .jwt(Customizer.withDefaults())
                        .authenticationEntryPoint(naoAutenticado))
                .exceptionHandling(e -> e.authenticationEntryPoint(naoAutenticado));
        return http.build();
    }

    /**
     * O que responder quando falta autenticação. Em vez de escrever o JSON à mão,
     * entrega uma {@link ErrorResponseException} ao mesmo mecanismo de erros do MVC:
     * a resposta sai idêntica às demais (ProblemDetail, com {@code instance}).
     */
    @Bean
    AuthenticationEntryPoint naoAutenticado(
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolvedorDeErros) {
        return (request, response, excecao) -> {
            boolean tokenRuim = excecao instanceof InvalidBearerTokenException;
            ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, tokenRuim
                    ? "Token inválido ou expirado. Faça login novamente em POST /auth/login."
                    : "Autenticação necessária. Envie o header Authorization: Bearer <token> (obtido em POST /auth/login).");
            problema.setTitle("Não autenticado");
            response.setHeader(HttpHeaders.WWW_AUTHENTICATE, tokenRuim ? "Bearer error=\"invalid_token\"" : "Bearer");
            resolvedorDeErros.resolveException(request, response, null,
                    new ErrorResponseException(HttpStatus.UNAUTHORIZED, problema, excecao));
        };
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecretKey chaveJwt(AuthProperties props) {
        return new SecretKeySpec(props.jwt().segredo().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey chaveJwt) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(chaveJwt));
    }

    /** Valida assinatura HS256, expiração e emissor de cada token recebido. */
    @Bean
    JwtDecoder jwtDecoder(SecretKey chaveJwt) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(chaveJwt).macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(TokenService.EMISSOR));
        return decoder;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(CorsProperties props) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(props.origensPermitidas());
        cors.setAllowedMethods(List.of("GET", "POST", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE));
        cors.setExposedHeaders(List.of(HttpHeaders.LOCATION));
        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/**", cors);
        return fonte;
    }
}
