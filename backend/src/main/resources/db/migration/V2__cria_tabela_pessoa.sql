CREATE TABLE pessoa (
    id            BIGSERIAL    PRIMARY KEY,
    documento     VARCHAR(11)  NOT NULL,
    nome          VARCHAR(100) NOT NULL,
    sobrenome     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    criado_em     TIMESTAMPTZ  NOT NULL,
    atualizado_em TIMESTAMPTZ  NOT NULL,

    CONSTRAINT uk_pessoa_documento UNIQUE (documento),
    CONSTRAINT uk_pessoa_email     UNIQUE (email),
    -- Defesa em profundidade: o documento é sempre um CPF só com dígitos.
    CONSTRAINT ck_pessoa_documento CHECK (documento ~ '^[0-9]{11}$')
);
