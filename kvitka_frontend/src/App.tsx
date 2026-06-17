import { useState } from 'react'
import { LoginForm } from './components/LoginForm'
import { ChatInterface } from './components/ChatInterface'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')

  const handleLogin = (email: string) => {
    setUserName(email)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserName('')
  }

  return (
    <>
      {!isLoggedIn ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <ChatInterface userName={userName} onLogout={handleLogout} />
      )}
    </>
  )
}

export default App
