import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '@/api/erro'
import type { PessoaResponse } from '@/api/tipos'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useExcluirPessoa } from './consultas'

/** Estado de navegação que a lista usa para confirmar a exclusão. */
export type EstadoAposExclusao = { excluida?: string }

export function ExcluirPessoa({ pessoa }: { pessoa: PessoaResponse }) {
  const navigate = useNavigate()
  const excluir = useExcluirPessoa()
  const [aberto, setAberto] = useState(false)
  const nomeCompleto = `${pessoa.nome} ${pessoa.sobrenome}`

  function voltarParaLista() {
    navigate('/pessoas', { state: { excluida: nomeCompleto } satisfies EstadoAposExclusao })
  }

  function confirmar() {
    excluir.mutate(pessoa.documento, {
      onSuccess: voltarParaLista,
      onError: (erro) => {
        // Já tinha sido excluída (outra aba, outra pessoa): o resultado é o mesmo.
        if (erro instanceof ApiError && erro.status === 404) voltarParaLista()
      },
    })
  }

  return (
    <AlertDialog
      open={aberto}
      onOpenChange={(abrir) => {
        // Não fecha no meio da exclusão.
        if (!excluir.isPending) setAberto(abrir)
        if (!abrir) excluir.reset()
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 aria-hidden />
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {nomeCompleto}?</AlertDialogTitle>
          <AlertDialogDescription>
            A pessoa será removida do cadastro. Não é possível desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {excluir.isError && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível excluir: {excluir.error.message}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
          {/* Botão comum (não AlertDialogAction), para o diálogo só fechar quando a exclusão terminar. */}
          <Button variant="destructive" onClick={confirmar} disabled={excluir.isPending}>
            {excluir.isPending ? 'Excluindo…' : 'Excluir'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
