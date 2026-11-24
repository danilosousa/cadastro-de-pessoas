package com.example.prova.nacionalidade;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.net.URI;
import java.time.Duration;

/**
 * Configuração da API nationalize.io, lida do bloco {@code nationalize:} do
 * application.yml (sobrescrevível por NATIONALIZE_URL / NATIONALIZE_TIMEOUT /
 * NATIONALIZE_API_KEY).
 *
 * @param url     URL base da API
 * @param timeout tempo máximo para conectar e para ler a resposta
 * @param apiKey  chave opcional da nationalize.io; sem ela a cota gratuita é de
 *                só 10 consultas. Quando presente, vai no parâmetro {@code apikey}.
 */
@ConfigurationProperties(prefix = "nationalize")
public record NationalizeProperties(URI url, Duration timeout, String apiKey) {

    public boolean temApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }
}
