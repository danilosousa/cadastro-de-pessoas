import { Navigate, type RouteObject } from 'react-router'
import { PaginaLogin } from '@/auth/PaginaLogin'
import { RotaProtegida } from '@/auth/RotaProtegida'
import { PaginaPessoas } from '@/pessoas/PaginaPessoas'
import { Layout } from './Layout'
import { PaginaNaoEncontrada } from './PaginaNaoEncontrada'

/** Rotas da aplicação. Exportadas para os testes montarem o mesmo app num router em memória. */
export const rotas: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: 'login', element: <PaginaLogin /> },
      {
        element: <RotaProtegida />,
        children: [
          { index: true, element: <Navigate to="/pessoas" replace /> },
          { path: 'pessoas', element: <PaginaPessoas /> },
        ],
      },
      { path: '*', element: <PaginaNaoEncontrada /> },
    ],
  },
]
