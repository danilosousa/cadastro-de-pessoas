import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function PaginaNaoEncontrada() {
  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="font-heading text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço acessado não existe.</p>
      <Button asChild variant="outline">
        <Link to="/pessoas">Ir para a lista de pessoas</Link>
      </Button>
    </section>
  )
}
