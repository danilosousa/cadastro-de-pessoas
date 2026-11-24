package com.example.prova.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/** Configuração do bloco {@code auth:} do application.yml. */
@ConfigurationProperties(prefix = "auth")
public record AuthProperties(Admin admin, Jwt jwt) {

    /** Credenciais do usuário administrador criado na inicialização. */
    public record Admin(String usuario, String senha) {
    }

    /** Chave de assinatura HS256 (mín. 32 caracteres) e validade do token. */
    public record Jwt(String segredo, Duration expiracao) {
        public Jwt {
            if (segredo == null || segredo.length() < 32) {
                throw new IllegalArgumentException("auth.jwt.segredo (JWT_SEGREDO) deve ter pelo menos 32 caracteres");
            }
        }
    }
}
