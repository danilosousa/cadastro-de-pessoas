import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { Provedores } from '@/app/Provedores'
import { criarQueryClient } from '@/app/queryClient'
import { rotas } from '@/app/rotas'
import './index.css'

const queryClient = criarQueryClient()
const router = createBrowserRouter(rotas)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provedores queryClient={queryClient}>
      <RouterProvider router={router} />
    </Provedores>
  </StrictMode>,
)
