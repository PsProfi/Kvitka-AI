import { useState, useRef, useEffect } from 'react'
import '../styles/ChatInterface.css'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  userName: string
  onLogout: () => void
}

export function ChatInterface({ userName, onLogout }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Привіт! Я помічник Квітки AI. Як я можу вам допомогти?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (input.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: input,
        timestamp: new Date(),
      }

      setMessages([...messages, userMessage])
      setInput('')

      // Simulate assistant response (no actual functionality yet)
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: 'Це демонстраційна версія. Функціональність буде додана незабаром.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }, 500)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-title">
          <h1>Квітка AI</h1>
        </div>
        <div className="chat-header-actions">
          <span className="user-name">{userName}</span>
          <button className="logout-btn" onClick={onLogout}>
            Вихід
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message message-${message.type}`}
          >
            <div className={`message-content ${message.type}`}>
              <p>{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Напишіть ваше питання..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
          />
          <button
            className={`send-btn ${input.trim() ? 'active' : ''}`}
            onClick={handleSendMessage}
            disabled={!input.trim()}
          >
            <span>➤</span>
          </button>
        </div>
      </div>
    </div>
  )
}
