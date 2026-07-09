import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'

const ADD_URL = 'https://miguellbrandao.github.io/MyVault/#/add'

const STEPS = [
  {
    title: 'Abre a app Atalhos',
    body: 'Vai ao separador Automatização e toca em + para criar uma nova automatização pessoal.',
  },
  {
    title: 'Escolhe o gatilho «Transação»',
    body: 'No iOS 26 chama-se «Wallet». Só aparece se tiveres cartões configurados no Apple Pay. Seleciona os cartões que queres vigiar.',
  },
  {
    title: 'Escolhe «Executar imediatamente»',
    body: 'Assim o atalho corre logo após cada pagamento, sem passos extra. A confirmação é feita aqui na app.',
  },
  {
    title: 'Adiciona a ação «Codificar URL»',
    body: 'Como entrada, escolhe a variável «Comerciante» da transação. Isto garante que nomes com espaços ou acentos chegam bem à app.',
  },
  {
    title: 'Adiciona a ação «Abrir URLs»',
    body: 'Compõe o URL juntando as variáveis da transação, como mostrado abaixo.',
  },
  {
    title: 'Testa com um pagamento',
    body: 'Paga com Apple Pay: o ecrã «Pagamento detetado» abre com o valor e o comerciante preenchidos — só tens de confirmar a categoria e registar.',
  },
]

export default function ShortcutGuidePage() {
  function copyUrl() {
    navigator.clipboard.writeText(ADD_URL).then(
      () => toast.success('URL copiado.'),
      () => toast.error('Não foi possível copiar.'),
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Atalho da Wallet"
        subtitle="Regista pagamentos Apple Pay automaticamente"
        backTo="/ajustes"
      />

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

      <section className="rounded-3xl bg-card p-4">
        <p className="mb-2 text-sm font-medium">URL a usar na ação «Abrir URLs»</p>
        <code className="amount block overflow-x-auto rounded-2xl bg-secondary/60 p-3 text-xs leading-relaxed whitespace-nowrap">
          {ADD_URL}?amount=<span className="text-brass">⟨Montante⟩</span>&merchant=
          <span className="text-brass">⟨Texto codificado⟩</span>&source=wallet
        </code>
        <p className="mt-2 text-xs text-muted-foreground">
          ⟨Montante⟩ é a variável «Montante» da transação; ⟨Texto codificado⟩ é o resultado
          da ação «Codificar URL» do passo 4.
        </p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={copyUrl}>
          <Copy className="size-4" /> Copiar URL base
        </Button>
      </section>

      <section className="rounded-3xl border border-brass/30 bg-brass/5 p-4 text-sm">
        <p className="font-medium text-brass">Importante: onde abres a app</p>
        <p className="mt-1 text-muted-foreground">
          O atalho abre este URL no Safari. No iOS, o Safari e uma web app instalada
          («Abrir como Web App») guardam os dados em locais separados — um registo feito
          num não aparece no outro.
        </p>
        <p className="mt-2 text-muted-foreground">
          Recomendação: adiciona o MyVault ao ecrã principal com a opção
          «Abrir como Web App» <strong className="text-foreground">desligada</strong>. Ficas
          com um ícone normal que abre no Safari — o mesmo sítio onde o atalho regista as
          despesas. Se preferires a app instalada, testa primeiro se o registo do atalho
          aparece lá.
        </p>
      </section>
    </div>
  )
}
