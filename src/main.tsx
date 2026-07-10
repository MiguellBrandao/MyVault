import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App'
import HomePage from '@/pages/home'
import TransactionsPage from '@/pages/transactions'
import GoalsPage from '@/pages/goals'
import SubscriptionsPage from '@/pages/subscriptions'
import DebtsPage from '@/pages/debts'
import SettingsPage from '@/pages/settings'
import ShortcutGuidePage from '@/pages/shortcut-guide'
import '@/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'movimentos', element: <TransactionsPage /> },
      { path: 'metas', element: <GoalsPage /> },
      { path: 'subscricoes', element: <SubscriptionsPage /> },
      { path: 'dividas', element: <DebtsPage /> },
      { path: 'ajustes', element: <SettingsPage /> },
      { path: 'ajustes/atalho', element: <ShortcutGuidePage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
