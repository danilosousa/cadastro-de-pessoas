package com.quipux.prova;

import org.springframework.boot.SpringApplication;

public class TestProvaFullstackApplication {

	public static void main(String[] args) {
		SpringApplication.from(ProvaFullstackApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
