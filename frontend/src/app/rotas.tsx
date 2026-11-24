import { Navigate, type RouteObject } from 'react-router'
import { Layout } from './Layout'
import { PaginaNaoEncontrada } from './PaginaNaoEncontrada'
import { PaginaPessoas } from '@/pessoas/PaginaPessoas'

/** Rotas da aplicação. Exportadas para os testes montarem o mesmo app num router em memória. */
export const rotas: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/pessoas" replace /> },
      { path: 'pessoas', element: <PaginaPessoas /> },
      { path: '*', element: <PaginaNaoEncontrada /> },
    ],
  },
]
