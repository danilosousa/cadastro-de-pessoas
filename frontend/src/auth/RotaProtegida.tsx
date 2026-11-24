import { Navigate, Outlet, useLocation } from 'react-router'
import { useAutenticacao } from './contexto'

/** Estado de navegação que o login usa para voltar à página pedida. */
export type EstadoDeRetorno = { de?: string }

export function RotaProtegida() {
  const { sessao } = useAutenticacao()
  const location = useLocation()

  if (!sessao) {
    const de = location.pathname + location.search
    return <Navigate to="/login" replace state={{ de } satisfies EstadoDeRetorno} />
  }
  return <Outlet />
}
