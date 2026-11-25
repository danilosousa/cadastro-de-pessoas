# 0013 — Versão online no Render

**Status:** aceito · 2026-11-25

## Contexto

O caminho principal de avaliação é `docker compose up --build` na máquina de quem avalia. Se o Docker não estiver disponível ou algo do ambiente falhar, a avaliação fica bloqueada. Uma versão no ar, sempre atualizada a partir do repositório, serve de alternativa sem custo.

## Decisão

Publicar no **Render**, plano gratuito, descrito em código num **Blueprint** (`render.yaml` na raiz):

| Peça | Serviço | Observação |
|---|---|---|
| Interface | Static Site | CDN, não dorme. Rewrite `/api/*` → API e fallback `/*` → `/index.html`, o mesmo papel do nginx (ADR 0010). Cabeçalhos de segurança iguais aos do `seguranca.inc` |
| API | Web Service Docker, com o mesmo `backend/Dockerfile` | 512 MB e 0,1 CPU. Perfil `dev`, com as pessoas de exemplo |
| Banco | Postgres gratuito | `ipAllowList: []`: sem acesso pela internet, só pela rede privada |

Dois ajustes foram necessários:

- **`DATABASE_URL` → `DB_URL`.** O Render entrega o banco como `postgresql://usuario:senha@host:porta/banco`, formato que o driver JDBC não aceita. O `backend/docker-entrypoint.sh` monta `jdbc:postgresql://host:porta/banco` quando só a `DATABASE_URL` existe. No docker compose a `DB_URL` já vem pronta e o script não muda nada.
- **API acordada.** O serviço gratuito dorme após ~15 min sem tráfego, e o Spring Boot leva cerca de 3 min para subir com 0,1 CPU (medido localmente com `--cpus 0.1 --memory 512m`). O workflow `.github/workflows/manter-api-acordada.yml` chama o health check a cada 10 min. Um serviço ligado o mês inteiro cabe nas 750 h gratuitas.

## Alternativas consideradas

- **VM gratuita (p.ex. Oracle Cloud) rodando o próprio docker compose:** sempre ligada e idêntica ao ambiente local, mas exige cartão, configuração de servidor, TLS e manutenção.
- **Fly.io / Railway:** sem plano gratuito permanente, ou exigem cartão.
- **Vercel para a interface:** funcionaria igual ao Static Site, mas separaria a configuração em duas plataformas.

## Consequências

- Cada push na `main` publica de novo; os `buildFilter` evitam rebuild da API quando só o frontend muda, e vice-versa.
- O banco gratuito expira 30 dias após a criação (com 14 dias de carência antes de ser apagado). Para renovar, basta recriar o banco; as migrations e o seed recriam tudo.
- Qualquer pessoa com o link entra na interface e pode cadastrar ou excluir registros, porque as credenciais estão no bundle (ADR 0012). Os dados são fictícios; para a demonstração, é aceitável.
- A cota gratuita da nationalize.io é por IP; na versão online ela é compartilhada com todos os acessos.
