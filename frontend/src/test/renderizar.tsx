import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { criarQueryClient } from '@/app/queryClient'
import { rotas } from '@/app/rotas'

/** Renderiza o app inteiro (rotas reais) começando em `url`, com um QueryClient novo. */
export function renderizarApp(url = '/') {
  const queryClient = criarQueryClient()
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
  })
  const router = createMemoryRouter(rotas, { initialEntries: [url] })
  const usuario = userEvent.setup()
  const resultado = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...resultado, router, usuario, queryClient }
}
