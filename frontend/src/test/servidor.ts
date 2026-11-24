import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { pagina } from './dados'

/** URL base que o app usa nos testes (jsdom roda em http://localhost:3000). */
export const API = 'http://localhost:3000/api'

/** Respostas padrão; cada teste sobrescreve o que precisa com servidor.use(...). */
export const handlersPadrao = [
  http.get(`${API}/actuator/health`, () => HttpResponse.json({ status: 'UP' })),
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
