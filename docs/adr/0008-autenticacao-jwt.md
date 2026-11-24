# 0008 — Autenticação JWT protegendo todas as APIs

**Status:** aceito · 2026-11-24

## Contexto

O enunciado pede autenticação para a API mais crítica **ou** para todas, com mecanismo livre (usuário e senha, token, IP...). As APIs lidam com dados pessoais (CPF, e-mail), inclusive na listagem.

## Decisão

- **Todas** as rotas de negócio exigem autenticação. São públicas apenas `POST /auth/login`, o Swagger (`/swagger-ui/**`, `/v3/api-docs/**`) e `GET /actuator/health`.
- **Login com usuário e senha** (`POST /auth/login`) devolve um **JWT** que o cliente envia em `Authorization: Bearer <token>`.
- Token **HS256** (chave simétrica de pelo menos 32 caracteres vinda de `JWT_SEGREDO`), com `iss`, `sub`, `iat` e `exp`. Validade de **1 hora**, sem refresh token.
- Emissão com `JwtEncoder` e validação com o **resource server oficial** do Spring Security (`spring-boot-starter-security-oauth2-resource-server`). Não há filtro escrito à mão: o Spring valida assinatura, expiração e emissor.
- Usuários na tabela `usuario`, com senha em **BCrypt**. O administrador é criado na inicialização a partir de `ADMIN_USUARIO` / `ADMIN_SENHA` (padrão `admin` / `admin123`), se ainda não existir.
- Usuário inexistente e senha errada recebem **a mesma resposta** (401 "Usuário ou senha inválidos."). A senha também é comparada contra um hash falso quando o usuário não existe, para o tempo de resposta não revelar quem existe.
- **Stateless**: sem sessão HTTP e com **CSRF desabilitado**, porque o token vai num header que o navegador não envia sozinho.
- 401 sai no mesmo formato **ProblemDetail** das demais respostas de erro (ADR 0006), com o header `WWW-Authenticate: Bearer`.
- **CORS** liberado só para as origens de `CORS_ORIGENS` (padrão `http://localhost:5173`, o frontend em desenvolvimento).

## Alternativas consideradas

- **Proteger só o DELETE**: atenderia o enunciado, mas deixaria CPFs e e-mails expostos na listagem.
- **HTTP Basic** (usuário e senha em toda requisição): mais simples, mas envia a senha o tempo todo e não demonstra o fluxo de token que um frontend usa.
- **Biblioteca `jjwt` com filtro próprio**: muito comum em tutoriais, mas é mais código de segurança escrito à mão. O resource server é o caminho mantido pelo próprio Spring.
- **RS256** (par de chaves): ideal quando outro serviço valida os tokens. Aqui quem emite é o mesmo que valida, e o HS256 basta.
- **Refresh token**: fora do escopo. Com 1 h de validade, basta fazer login de novo.

## Consequências

- O Swagger ganhou o botão **Authorize**, e o frontend precisa guardar o token e enviá-lo em cada chamada.
- Trocar `JWT_SEGREDO` invalida todos os tokens emitidos.
- Não há revogação de token antes da expiração (limitação conhecida do JWT stateless).
