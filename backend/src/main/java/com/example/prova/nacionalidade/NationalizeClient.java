package com.example.prova.nacionalidade;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

/**
 * Cliente HTTP da nationalize.io: {@code GET /?name=<nome>}.
 *
 * <p>Traduz falhas da API externa em exceções com status HTTP próprio:
 * 429 (cota esgotada) → {@link NationalizeLimiteExcedidoException} (503);
 * timeout, erro de rede, 5xx ou outro 4xx (ex.: chave de API inválida)
 * → {@link NationalizeIndisponivelException} (502).
 *
 * <p>A chave de API, quando configurada, nunca é escrita no log.
 */
@Component
public class NationalizeClient {

    private static final Logger log = LoggerFactory.getLogger(NationalizeClient.class);

    private final RestClient http;
    private final NationalizeProperties props;

    public NationalizeClient(RestClient.Builder builder, NationalizeProperties props) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(props.timeout());
        fabrica.setReadTimeout(props.timeout());
        this.http = builder
                .baseUrl(props.url().toString())
                .requestFactory(fabrica)
                .build();
        this.props = props;
        log.info("nationalize.io: {}", props.temApiKey() ? "usando chave de API" : "sem chave de API (cota gratuita de 10 consultas)");
    }

    /** Um país provável segundo a API, com a probabilidade entre 0 e 1. */
    public record PaisProvavel(@JsonProperty("country_id") String codigo, double probability) {
    }

    /** Formato da resposta da nationalize.io. Campos que não usamos são ignorados. */
    record RespostaNationalize(String name, List<PaisProvavel> country) {
    }

    /**
     * Consulta os países prováveis para um prenome. Lista vazia = API sem previsão.
     *
     * <p>Resultados (inclusive vazios) ficam em cache por prenome; exceções não
     * são guardadas, então uma falha pode ser tentada de novo na próxima chamada.
     */
    @Cacheable(cacheNames = "nacionalidades", key = "#prenome")
    public List<PaisProvavel> preverPaises(String prenome) {
        log.info("Consultando nationalize.io para '{}'", prenome);
        try {
            RespostaNationalize resposta = http.get()
                    .uri(uri -> {
                        uri.queryParam("name", prenome);
                        if (props.temApiKey()) {
                            uri.queryParam("apikey", props.apiKey());
                        }
                        return uri.build();
                    })
                    .retrieve()
                    .body(RespostaNationalize.class);
            return resposta == null || resposta.country() == null ? List.of() : resposta.country();
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().isSameCodeAs(HttpStatus.TOO_MANY_REQUESTS)) {
                log.warn("nationalize.io: cota de requisições esgotada");
                throw new NationalizeLimiteExcedidoException();
            }
            log.warn("nationalize.io respondeu {}", e.getStatusCode());
            throw new NationalizeIndisponivelException();
        } catch (RestClientException e) {
            // Timeout, conexão recusada, resposta ilegível...
            log.warn("Falha ao chamar nationalize.io: {}", e.getMessage());
            throw new NationalizeIndisponivelException();
        }
    }
}
