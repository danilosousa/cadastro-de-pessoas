import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { servidor } from './servidor'

// Qualquer chamada sem handler falha o teste: nada sai para a rede de verdade.
beforeAll(() => servidor.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  servidor.resetHandlers()
  cleanup()
  sessionStorage.clear()
})
afterAll(() => servidor.close())
