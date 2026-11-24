import { useQuery } from '@tanstack/react-query'
import { chamarApi } from '@/api/cliente'
import { Badge } from '@/components/ui/badge'

type Saude = { status: string }

/** Indicador discreto de que o backend responde (rota pública do actuator). */
export function StatusDaApi() {
  const { data, isPending } = useQuery({
    queryKey: ['saude'],
    queryFn: ({ signal }) => chamarApi<Saude>('/actuator/health', { sinal: signal }),
    retry: false,
    refetchInterval: 60_000,
  })

  if (isPending) return <Badge variant="outline">Verificando API…</Badge>
  const online = data?.status === 'UP'
  return (
    <Badge variant={online ? 'secondary' : 'destructive'} role="status">
      {online ? 'API funcionando' : 'API indisponível'}
    </Badge>
  )
}
