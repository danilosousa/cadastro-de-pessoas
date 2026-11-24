import { Navigate, type RouteObject } from 'react-router'
import { PaginaDetalhePessoa } from '@/pessoas/PaginaDetalhePessoa'
import { PaginaPessoas } from '@/pessoas/PaginaPessoas'
import { PaginaRegistrarPessoa } from '@/pessoas/PaginaRegistrarPessoa'
import { Layout } from './Layout'
import { PaginaNaoEncontrada } from './PaginaNaoEncontrada'

/** Rotas da aplicação. Exportadas para os testes montarem o mesmo app num router em memória. */
export const rotas: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/pessoas" replace /> },
      { path: 'pessoas', element: <PaginaPessoas /> },
      { path: 'pessoas/nova', element: <PaginaRegistrarPessoa /> },
      { path: 'pessoas/:documento', element: <PaginaDetalhePessoa /> },
      { path: '*', element: <PaginaNaoEncontrada /> },
    ],
  },
]
