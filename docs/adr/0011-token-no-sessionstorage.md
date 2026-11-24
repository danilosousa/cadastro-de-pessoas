# 0011 — Token JWT guardado no `sessionStorage`

**Status:** aceito · 2026-11-24

## Contexto

O backend devolve um JWT no corpo do `POST /auth/login` e espera receber esse token no header `Authorization: Bearer` (ADR 0008). O frontend precisa guardá-lo em algum lugar. O usuário espera continuar logado depois de um F5.

## Decisão

Guardar `{ token, usuario, expiraEm }` no **`sessionStorage`**, num único módulo (`auth/sessao.ts`), que é o único ponto do código que lê ou escreve o token.

- Ao carregar o app, uma sessão vencida ou corrompida é descartada.
- Um timer encerra a sessão quando `expiraEm` chega, mesmo com a aba parada.
- Uma resposta **401 a uma chamada que enviou token** encerra a sessão, limpa o cache do TanStack Query e leva ao login com o aviso "Sessão expirada". Um 401 sem token enviado (um login errado) é só a resposta daquela chamada.
- Depois do login, o usuário volta à página que tinha pedido. O caminho de retorno viaja no *state* da navegação e só é aceito se for interno (começa com `/` e não com `//`), para não haver *open redirect*.

## Alternativas consideradas

- **Só em memória** (estado do React): imune a leitura por scripts persistentes, mas um F5 desloga o usuário.
- **`localStorage`**: sobrevive ao fechar a aba e é compartilhado entre abas, o que deixa o token exposto por mais tempo, sem ganho para este uso.
- **Cookie `httpOnly` + `SameSite`**: o JavaScript não consegue ler o token, o que é a melhor defesa contra XSS. Exigiria mudar o backend (emitir o cookie, ler o cookie no lugar do header e voltar a ter proteção contra CSRF). Fica como evolução.

## Consequências

- O risco principal é **XSS**: um script injetado na página conseguiria ler o `sessionStorage`. A mitigação é não haver HTML injetado: o React escapa todo texto renderizado e o código não usa `dangerouslySetInnerHTML`. O nginx pode reforçar isso com uma Content-Security-Policy.
- Como o token vai num header e não num cookie, o navegador nunca o envia sozinho: não há CSRF (o mesmo motivo do ADR 0008).
- Cada aba tem a sua sessão; fechar a aba desloga.

## Adendo (2026-11-24): login automático

A tela de login foi removida pelo ADR 0012: o frontend obtém o token sozinho, com credenciais de build. O armazenamento no `sessionStorage` continua como descrito aqui. O que mudou:

- Não há mais tela de login, botão "Sair" nem retorno à página pedida (a validação contra *open redirect* deixou de existir junto).
- Um 401 com token não leva mais ao login: o frontend entra de novo sozinho.
- Em vez de encerrar a sessão quando o token vence, o frontend o renova 60 s antes.
