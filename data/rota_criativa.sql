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

-- SEEDS PARA EXEMPLOS
BEGIN;

INSERT INTO usuario (nome, email, salt, senha_hash) VALUES
  ('Museu do Forró', 'demo.museu@demo.local',   'sem-login', 'sem-login'),
  ('Estação Ferroviária',        'demo.estacao@demo.local', 'sem-login', 'sem-login'),
  ('Pátio de Eventos',          'demo.patio@demo.local',   'sem-login', 'sem-login'),
  ('Feira Via parque',          'demo.feira@demo.local',   'sem-login', 'sem-login')
ON CONFLICT DO NOTHING;

INSERT INTO servico (id_usuario, tipo, nome, descricao, bairro, endereco, contato)
SELECT id_usuario, 'cultura', 'Museu do Forró Luiz Gonzaga',
  'Museu dedicado a Luiz Gonzaga e à história do forró, com discos, fotografias, indumentárias e instrumentos musicais. Inaugurado em 1986.',
  'Centro', NULL, 'Fundação de Cultura e Turismo de Caruaru: (81) 3721-1257'
FROM usuario WHERE email = 'demo.museu@demo.local'
ON CONFLICT DO NOTHING;

INSERT INTO servico (id_usuario, tipo, nome, descricao, bairro, endereco, contato)
SELECT id_usuario, 'cultura', 'Estação Ferroviária de Caruaru',
  'Prédio histórico inaugurado em 1895, que recebia o Trem do Forró. Hoje é polo cultural e palco de apresentações do São João.',
  'Centro', NULL, 'Fundação de Cultura e Turismo de Caruaru: (81) 3721-1257'
FROM usuario WHERE email = 'demo.estacao@demo.local'
ON CONFLICT DO NOTHING;

INSERT INTO servico (id_usuario, tipo, nome, descricao, bairro, endereco, contato)
SELECT id_usuario, 'cultura', 'Pátio de Eventos Luiz Gonzaga',
  'Principal palco dos grandes shows do São João de Caruaru e de outros eventos da cidade.',
  'Centro', NULL, 'Fundação de Cultura e Turismo de Caruaru: (81) 3721-1257'
FROM usuario WHERE email = 'demo.patio@demo.local'
ON CONFLICT DO NOTHING;

INSERT INTO servico (id_usuario, tipo, nome, descricao, bairro, endereco, contato, horarios, especialidades)
SELECT id_usuario, 'cultura', 'Feira da Agricultura Familiar (Via Parque)',
  'Feira semanal de produtores da região, na Via Parque, em frente à Acic.',
  'Centro', 'Via Parque, em frente à Acic', 'Prefeitura de Caruaru',
  'Quintas-feiras, das 5h às 12h', 'Frutas, verduras, legumes, tapioca, bolos, ovos e mel'
FROM usuario WHERE email = 'demo.feira@demo.local'
ON CONFLICT DO NOTHING;

COMMIT;
--  *******

SELECT * FROM usuario;

SELECT id_usuario, nome, email FROM usuario;

SELECT id_servico, id_usuario, tipo, nome FROM servico;

SELECT id_usuario, id_servico FROM interesse;