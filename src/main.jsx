import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
