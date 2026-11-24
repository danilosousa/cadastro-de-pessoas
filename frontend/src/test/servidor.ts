import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { pagina } from './dados'

/** URL base que o app usa nos testes (jsdom roda em http://localhost:3000). */
export const API = 'http://localhost:3000/api'

/** Respostas padrão; cada teste sobrescreve o que precisa com servidor.use(...). */
export const TOKEN_EMITIDO = 'token-emitido'

export const handlersPadrao = [
  http.get(`${API}/actuator/health`, () => HttpResponse.json({ status: 'UP' })),
  http.post(`${API}/auth/login`, () =>
    HttpResponse.json({
      token: TOKEN_EMITIDO,
      tipo: 'Bearer',
      expiraEm: new Date(Date.now() + 3_600_000).toISOString(),
    }),
  ),
  http.get(`${API}/list`, () => HttpResponse.json(pagina([]))),
]

export const servidor = setupServer(...handlersPadrao)

/** Responde como o backend responde a um token ausente, vencido ou inválido. */
export function naoAutenticado() {
  return HttpResponse.json(
    { title: 'Não autenticado', status: 401, detail: 'Token ausente, inválido ou expirado.' },
    { status: 401 },
  )
}
