package com.example.prova.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    public record LoginRequest(
            @Schema(example = "admin") @NotBlank(message = "é obrigatório") String usuario,
            @Schema(example = "admin123") @NotBlank(message = "é obrigatório") String senha) {
    }

    public record LoginResponse(String token, String tipo, Instant expiraEm) {
    }

    @Operation(summary = "Autentica e devolve um token JWT",
            description = "Use o token no botão Authorize (ou no header `Authorization: Bearer <token>`).")
    @SecurityRequirements   // rota pública: o Swagger não exige token aqui
    @PostMapping("/auth/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest dados) {
        TokenService.TokenEmitido token = service.login(dados.usuario(), dados.senha());
        return new LoginResponse(token.valor(), "Bearer", token.expiraEm());
    }
}
