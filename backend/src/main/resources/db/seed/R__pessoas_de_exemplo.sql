-- Pessoas de exemplo, carregadas SOMENTE no perfil "dev" (ver application-dev.yml).
-- Migration repetível (R__): o Flyway a executa de novo sempre que este arquivo muda.
-- ON CONFLICT DO NOTHING: não duplica nem falha se a pessoa (ou o e-mail) já existir.
-- Nomes de origens variadas para demonstrar a previsão de nacionalidade.
INSERT INTO pessoa (documento, nome, sobrenome, email, criado_em, atualizado_em) VALUES
    ('39053344705', 'Nathaniel', 'Brooks',    'nathaniel.brooks@exemplo.com', now(), now()),
    ('75198461059', 'Giulia',    'Rossi',     'giulia.rossi@exemplo.com',     now(), now()),
    ('26018573660', 'Kenji',     'Tanaka',    'kenji.tanaka@exemplo.com',     now(), now()),
    ('89402135723', 'Olumide',   'Adeyemi',   'olumide.adeyemi@exemplo.com',  now(), now()),
    ('61524709867', 'Sofía',     'Hernández', 'sofia.hernandez@exemplo.com',  now(), now()),
    ('17283946519', 'Hans',      'Müller',    'hans.muller@exemplo.com',      now(), now()),
    ('48372615900', 'Pierre',    'Dubois',    'pierre.dubois@exemplo.com',    now(), now()),
    ('90731826469', 'João',      'Silva',     'joao.silva@exemplo.com',       now(), now())
ON CONFLICT DO NOTHING;
