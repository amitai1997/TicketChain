// File: src/pages/NotFound.tsx
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Home } from 'lucide-react'

const NotFound = () => {
  const navigate = useNavigate()
  
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <AlertTriangle className="h-16 w-16 mx-auto mb-6 text-primary" />
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-medium mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center mx-auto"
      >
        <Home className="h-4 w-4 mr-2" />
        Back to Home
      </button>
    </div>
  )
}

export default NotFound
