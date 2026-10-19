import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './auth'
import { OrgProvider } from './org'
import { ErrorBoundary } from './ui'
import NetStatus from './NetStatus'
import CookieNotice from './CookieNotice'
import './index.css'
import './responsive.css'
import { registerPwa } from './pwa'

registerPwa()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <App />
        <NetStatus />
        <CookieNotice />
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
  </StrictMode>,
)
