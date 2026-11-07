BEGIN;

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    email VARCHAR(254) NOT NULL,
    senha_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_usuario_nome
        CHECK (CHAR_LENGTH(TRIM(nome)) >= 2),

    CONSTRAINT ck_usuario_email
        CHECK (CHAR_LENGTH(TRIM(email)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_email
    ON usuario (LOWER(TRIM(email)));


CREATE TABLE IF NOT EXISTS sessao (
    id_sessao INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_usuario_sessao
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessao_usuario
    ON sessao (id_usuario);

CREATE INDEX IF NOT EXISTS idx_sessao_expiracao
    ON sessao (expira_em);


CREATE TABLE IF NOT EXISTS servico (
    id_servico INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    endereco VARCHAR(255),
    contato VARCHAR(255) NOT NULL,
    horarios TEXT,
    especialidades TEXT,

    idiomas VARCHAR(150),
    regioes_atendidas TEXT,

    atividade TEXT,
    duracao VARCHAR(100),

    CONSTRAINT fk_usuario_servico
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT ck_servico_tipo
        CHECK (
            tipo IN (
                'guia',
                'oficina',
                'cultura',
                'restaurante'
            )
        ),

    CONSTRAINT ck_servico_nome
        CHECK (CHAR_LENGTH(TRIM(nome)) > 0),

    CONSTRAINT ck_servico_descricao
        CHECK (CHAR_LENGTH(TRIM(descricao)) > 0),

    CONSTRAINT ck_servico_bairro
        CHECK (CHAR_LENGTH(TRIM(bairro)) > 0),

    CONSTRAINT ck_servico_contato
        CHECK (CHAR_LENGTH(TRIM(contato)) > 0)
);


CREATE TABLE IF NOT EXISTS interesse (
    id_usuario INT NOT NULL,
    id_servico INT NOT NULL,

    CONSTRAINT pk_interesse
        PRIMARY KEY (id_usuario, id_servico),

    CONSTRAINT fk_usuario_interesse
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_servico_interesse
        FOREIGN KEY (id_servico)
        REFERENCES servico(id_servico)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_interesse_servico
    ON interesse (id_servico);

COMMIT;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('usuario', 'sessao', 'servico', 'interesse')
ORDER BY table_name;