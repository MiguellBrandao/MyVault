import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Copy, RefreshCw } from 'lucide-react'
import * as api from '@/lib/api'
import { useAppMutation } from '@/lib/hooks'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'

const RPC_URL = `${SUPABASE_URL}/rest/v1/rpc/wallet_add`

const STEPS = [
  {
    title: 'Abre a app Atalhos',
    body: 'Vai ao separador Automatização e toca em + para criar uma nova automatização pessoal.',
  },
  {
    title: 'Escolhe o gatilho «Transação»',
    body: 'No iOS 26 chama-se «Wallet». Seleciona os cartões que queres vigiar e marca «Executar imediatamente» — o registo acontece em segundo plano, sem abrir nada. Toca em Seguinte.',
  },
  {
    title: 'Cria uma automatização em branco',
    body: 'Quando o iOS perguntar o que fazer, escolhe «Nova automatização em branco» (não uma das sugestões). No editor, toca em «Adicionar ação».',
  },
  {
    title: 'Pesquisa «Obter conteúdo de URL»',
    body: 'Adiciona essa ação e cola o URL abaixo. Expande «Mostrar mais»: Método POST; cabeçalhos e corpo como indicado. Nos campos amount e merchant usa as variáveis Montante e Comerciante da transação (barra por cima do teclado).',
  },
  {
    title: 'Testa com um pagamento',
    body: 'Paga com Apple Pay. A despesa aparece no Início, em «Por confirmar» — um toque para escolher a categoria e confirmar.',
  },
]

function CopyField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  function copy() {
    navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copiado.`),
      () => toast.error('Não foi possível copiar.'),
    )
  }
  return (
    <div className="rounded-2xl bg-secondary/60 p-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <button type="button" onClick={copy} aria-label={`Copiar ${label}`} className="p-1 text-muted-foreground">
          <Copy className="size-4" />
        </button>
      </div>
      <p className={`${mono ? 'amount' : ''} overflow-x-auto text-xs leading-relaxed break-all`}>{value}</p>
    </div>
  )
}

export default function ShortcutGuidePage() {
  const { data: token, isLoading } = useQuery({
    queryKey: ['wallet_token'],
    queryFn: api.getWalletToken,
  })

  const regenerate = useAppMutation(
    api.regenerateWalletToken,
    token ? 'Novo token gerado — atualiza o Atalho.' : 'Token gerado.',
  )

  const body = token
    ? `{"token": "${token}", "amount": "⟨Montante⟩", "merchant": "⟨Comerciante⟩"}`
    : null

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Atalho da Wallet"
        subtitle="Regista pagamentos Apple Pay em segundo plano"
        backTo="/ajustes"
      />

      <section className="rounded-3xl border border-brass/30 bg-brass/5 p-4">
        <p className="text-sm font-medium text-brass">O teu token secreto</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Autoriza o Atalho a registar despesas na tua conta. Não o partilhes; se o
          expuseres, gera um novo.
        </p>
        {isLoading ? null : token ? (
          <div className="mt-3 flex flex-col gap-2">
            <CopyField label="Token" value={token} />
            <Button
              variant="secondary"
              size="sm"
              disabled={regenerate.isPending}
              onClick={() => regenerate.mutate(undefined)}
            >
              <RefreshCw className="size-4" /> Gerar novo token
            </Button>
          </div>
        ) : (
          <Button
            className="mt-3"
            size="sm"
            disabled={regenerate.isPending}
            onClick={() => regenerate.mutate(undefined)}
          >
            Gerar token
          </Button>
        )}
      </section>

      <ol className="flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3 rounded-3xl bg-card p-4">
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brass/15 text-sm font-semibold text-brass"
            >
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{step.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-sm font-medium text-muted-foreground">
          Configuração da ação «Obter conteúdo de URL»
        </h2>
        <CopyField label="URL" value={RPC_URL} />
        <CopyField label="Cabeçalho «apikey»" value={SUPABASE_ANON_KEY} />
        <CopyField label="Cabeçalho «Content-Type»" value="application/json" />
        {body ? (
          <>
            <CopyField label="Corpo do pedido (JSON)" value={body} />
            <p className="px-1 text-xs text-muted-foreground">
              No corpo, substitui ⟨Montante⟩ e ⟨Comerciante⟩ pelas variáveis da transação
              (toca no campo e escolhe-as da barra de variáveis). Em alternativa, define o
              corpo como JSON e adiciona os três campos: token, amount e merchant.
            </p>
          </>
        ) : (
          <p className="px-1 text-xs text-muted-foreground">
            Gera primeiro o token acima para veres o corpo do pedido completo.
          </p>
        )}
      </section>
    </div>
  )
}
