CREATE TABLE usuario (
    id         BIGSERIAL    PRIMARY KEY,
    usuario    VARCHAR(50)  NOT NULL,
    senha_hash VARCHAR(100) NOT NULL,   -- BCrypt: 60 caracteres

    CONSTRAINT uk_usuario_usuario UNIQUE (usuario)
);
