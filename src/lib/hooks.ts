import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from './api'

export function useTransactions() {
  return useQuery({ queryKey: ['transactions'], queryFn: api.listTransactions })
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: api.listCategories })
}

export function useDebts() {
  return useQuery({ queryKey: ['debts'], queryFn: api.listDebts })
}

export function useDebtPayments() {
  return useQuery({ queryKey: ['debt_payments'], queryFn: api.listDebtPayments })
}

export function useGoals() {
  return useQuery({ queryKey: ['goals'], queryFn: api.listGoals })
}

export function useGoalEntries() {
  return useQuery({ queryKey: ['goal_entries'], queryFn: api.listGoalEntries })
}

export function useSubscriptions() {
  return useQuery({ queryKey: ['subscriptions'], queryFn: api.listSubscriptions })
}

/**
 * Mutação genérica: invalida todas as queries no fim (os dados são pequenos
 * e ficam sempre coerentes) e mostra o erro ao utilizador se falhar.
 */
export function useAppMutation<TArgs>(
  fn: (args: TArgs) => Promise<unknown>,
  successMessage?: string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries()
      if (successMessage) toast.success(successMessage)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Algo correu mal. Tenta novamente.')
    },
  })
}
