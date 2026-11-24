import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

/** URL base que o app usa nos testes (jsdom roda em http://localhost:3000). */
export const API = 'http://localhost:3000/api'

/** Respostas padrão; cada teste sobrescreve o que precisa com servidor.use(...). */
export const handlersPadrao = [
  http.get(`${API}/actuator/health`, () => HttpResponse.json({ status: 'UP' })),
]

export const servidor = setupServer(...handlersPadrao)
