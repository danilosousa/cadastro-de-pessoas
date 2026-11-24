package com.example.prova.shared.web;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Metadados do Swagger e o esquema "Bearer": cria o botão <b>Authorize</b>,
 * onde se cola o token obtido em POST /auth/login.
 */
@Configuration
public class OpenApiConfig {

    private static final String ESQUEMA = "bearerAuth";

    @Bean
    OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Prova técnica Fullstack — API de pessoas")
                        .version("1.0")
                        .description("""
                                1. Faça login em **POST /auth/login** (padrão: `admin` / `admin123`).
                                2. Copie o `token` da resposta, clique em **Authorize** e cole.
                                3. Todas as rotas passam a enviar `Authorization: Bearer <token>`."""))
                .components(new Components().addSecuritySchemes(ESQUEMA, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(ESQUEMA));
    }
}
