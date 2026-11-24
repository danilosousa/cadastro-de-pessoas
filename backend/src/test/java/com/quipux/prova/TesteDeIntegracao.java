package com.quipux.prova;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Meta-anotação para testes de integração: aplicação inteira + MockMvc
 * + Postgres real via Testcontainers + WireMock no lugar da nationalize.io.
 *
 * <p>Todas as classes que a usam compartilham o mesmo contexto Spring
 * (e os mesmos servidores), o que deixa a suíte rápida.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, WireMockConfiguration.class})
public @interface TesteDeIntegracao {
}
