# 0009 — Stack do frontend: React + Vite + TypeScript

**Status:** aceito · 2026-11-24

## Contexto

O enunciado pede pelo menos uma interface web sobre as APIs. O desenvolvedor trabalha com Node e JavaScript. A interface é uma SPA interna, com login, sem SEO e sem renderização no servidor.

## Decisão

- **React 19 + Vite + TypeScript** (strict), em `frontend/`, no mesmo repositório do backend.
- **React Router** para as rotas; **TanStack Query** para o estado do servidor; um Context só para a sessão.
- **React Hook Form + Zod** para formulários.
- **Tailwind CSS 4 + shadcn/ui**: os componentes (baseados em Radix) são copiados para `src/components/ui`, então o código fica no repositório e pode ser lido e alterado.
- **Vitest + Testing Library + MSW** para testes; **ESLint + Prettier** para qualidade.
- Versões fixadas no `package.json` (`save-exact`), todas com pelo menos duas semanas de publicação.

## Alternativas consideradas

- **Next.js**: traz SSR, rotas no servidor e um runtime Node em produção. Nada disso é necessário aqui; uma SPA estática servida pelo nginx é mais simples de entregar.
- **Angular**: comum em empresas Java, mas exige aprender e defender mais conceitos (módulos, RxJS, injeção de dependência própria) sem ganho para este escopo.
- **Redux / Zustand**: o único estado global é a sessão. O resto é estado do servidor, que o TanStack Query já gerencia.
- **axios**: o `fetch` nativo, com um wrapper de 40 linhas, cobre tudo o que precisamos.
- **MUI / Mantine**: bibliotecas fechadas e mais pesadas; com o shadcn os componentes são nossos.
- **TypeScript 7 e oxlint** (padrão atual do template do Vite): o `typescript-eslint` ainda não suporta o TypeScript 7, então ficamos no TypeScript 6.0 com ESLint.

## Consequências

- `npm run build` faz a checagem de tipos antes de gerar os estáticos.
- O npm 10 (que vem com o Node 22) falha ao resolver os peers opcionais do Vitest com um erro interno (`edgesOut`) ao montar a árvore do zero. O lockfile foi gerado com o npm 12; com o lockfile pronto, `npm ci` funciona no npm 10.
- O `npm audit` aponta um alerta moderado no `minimatch` usado pelo `typescript-eslint`. É uma ferramenta só de desenvolvimento, que não vai para o build; a correção chega com a próxima versão do `typescript-eslint`.
