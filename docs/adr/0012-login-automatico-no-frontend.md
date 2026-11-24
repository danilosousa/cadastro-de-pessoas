# 0012 — Login automático no frontend

**Status:** aceito · 2026-11-24 · substitui a tela de login do ADR 0011

## Contexto

A primeira versão do frontend tinha uma tela de login: o usuário digitava `admin` / `admin123` antes de ver qualquer coisa. Por decisão de produto, a interface deve abrir **direto na listagem de pessoas**, sem pedir usuário e senha. Ao mesmo tempo, o backend exige token em todas as rotas (ADR 0008), e o enunciado pede autenticação.

## Decisão

O backend não muda. O frontend **faz o login sozinho**:

- Ao abrir, se não houver token válido no `sessionStorage`, chama `POST /auth/login` com as credenciais de build `VITE_API_USUARIO` e `VITE_API_SENHA` (padrão `admin` / `admin123`, iguais às do backend).
- Enquanto conecta, mostra um esqueleto de carregamento. Se o login falhar (API fora do ar, credenciais erradas), mostra o erro com "Tentar de novo".
- Renova o token **60 s antes de vencer**; o token atual continua valendo até o novo chegar, então nenhuma chamada sai sem token.
- Se a API responder 401 a uma chamada com token, descarta o token, entra de novo e as consultas que falharam rodam outra vez. Se o 401 vier logo depois de um login (menos de 5 s), para e mostra o erro, para não entrar em laço.
- Não há botão "Sair": não há usuário para sair.

## Alternativas consideradas

- **Proteger só o `DELETE`** (o enunciado permite proteger só a API mais crítica): a interface abriria sem token, mas a listagem passaria a expor CPF e e-mail sem autenticação, e o ADR 0008 e os testes do backend mudariam.
- **Tirar a autenticação do backend**: deixaria de cumprir o requisito do enunciado.
- **O proxy (nginx) obter e injetar o token**: esconderia as credenciais do navegador, mas exigiria lógica de login e renovação no nginx (ou um serviço a mais) para um ganho pequeno numa demonstração.

## Consequências

- A API continua protegida para qualquer cliente que não seja a interface: `curl`, Swagger e scripts precisam do token.
- **As credenciais ficam no JavaScript entregue ao navegador** (variáveis `VITE_*` são embutidas no build). Quem abre a interface consegue lê-las e chamar a API direto. Na prática, a interface é pública. Isso é aceitável para a demonstração da prova e **não é adequado para produção**, onde o certo seria um login de verdade (a tela da primeira versão, ou um provedor de identidade) ou o proxy guardando as credenciais.
- O `sessionStorage` (ADR 0011) continua guardando o token, para que o F5 não faça um login novo a cada recarga.
