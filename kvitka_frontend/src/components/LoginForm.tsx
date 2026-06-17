import { useState } from 'react'
import '../styles/LoginForm.css'

interface LoginFormProps {
  onLogin: (email: string) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) {
      onLogin(email)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Квітка AI</h1>
          <p>Помічник для вашого бізнесу</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email або ім'я користувача</label>
            <input
              type="email"
              id="email"
              placeholder="Введіть вашу пошту"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              placeholder="Введіть пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Увійти
          </button>
        </form>

        <div className="login-footer">
          <p>Немає акаунту? Зв'яжіться з нами</p>
        </div>
      </div>
    </div>
  )
}
