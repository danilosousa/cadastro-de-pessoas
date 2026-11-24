package com.quipux.prova.nacionalidade;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.net.URI;
import java.time.Duration;

/**
 * Configuração da API nationalize.io, lida do bloco {@code nationalize:} do
 * application.yml (sobrescrevível por NATIONALIZE_URL / NATIONALIZE_TIMEOUT).
 *
 * @param url     URL base da API
 * @param timeout tempo máximo para conectar e para ler a resposta
 */
@ConfigurationProperties(prefix = "nationalize")
public record NationalizeProperties(URI url, Duration timeout) {
}
