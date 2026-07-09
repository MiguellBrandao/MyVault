import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import App from '@/App'
import HomePage from '@/pages/home'
import TransactionsPage from '@/pages/transactions'
import GoalsPage from '@/pages/goals'
import DebtsPage from '@/pages/debts'
import SettingsPage from '@/pages/settings'
import ShortcutGuidePage from '@/pages/shortcut-guide'
import WalletAddPage from '@/pages/wallet-add'
import '@/index.css'

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'movimentos', element: <TransactionsPage /> },
      { path: 'metas', element: <GoalsPage /> },
      { path: 'dividas', element: <DebtsPage /> },
      { path: 'ajustes', element: <SettingsPage /> },
      { path: 'ajustes/atalho', element: <ShortcutGuidePage /> },
      { path: 'add', element: <WalletAddPage /> },
    ],
  },
])

// Pede ao browser para não despejar o armazenamento local (dados financeiros!).
navigator.storage?.persist?.()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
