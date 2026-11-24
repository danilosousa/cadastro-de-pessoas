package com.quipux.prova;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableCaching
public class ProvaFullstackApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProvaFullstackApplication.class, args);
	}

}
