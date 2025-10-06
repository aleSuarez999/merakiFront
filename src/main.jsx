import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './components/App'
import Provider from './context/Provider'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider>
     <App />
    </Provider>
  </StrictMode>,
)
