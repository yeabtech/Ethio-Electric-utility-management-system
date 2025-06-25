import { useState, useEffect, useCallback } from 'react'

export type ChatMessage = {
  id: string
  content: string
  timestamp: string
  sender: 'customer' | 'agent'
  senderName: string
  type: string
}

export type CustomerChat = {
  id: string
  customerName: string
  customerEmail: string
  status: 'active' | 'waiting' | 'resolved'
  lastMessage: string
  lastMessageTime: string
  priority: 'high' | 'medium' | 'low'
  visitorId?: string
  agentId?: string
  startTime?: string
  endTime?: string
}

export function useTawkChats() {
  const [chats, setChats] = useState<CustomerChat[]>([])
  const [selectedChat, setSelectedChat] = useState<CustomerChat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)

  // Fetch all chats
  const fetchChats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/tawk/chats')
      if (!response.ok) {
        throw new Error('Failed to fetch chats')
      }
      
      const data = await response.json()
      setChats(data.chats || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chats')
      console.error('Error fetching chats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/tawk/chats/${chatId}/messages`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
      console.error('Error fetching messages:', err)
    }
  }, [])

  // Send a message
  const sendMessage = useCallback(async (chatId: string, message: string) => {
    try {
      setSendingMessage(true)
      setError(null)
      
      const response = await fetch(`/api/tawk/chats/${chatId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      // Refresh messages after sending
      await fetchMessages(chatId)
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      console.error('Error sending message:', err)
      return false
    } finally {
      setSendingMessage(false)
    }
  }, [fetchMessages])

  // Select a chat and fetch its messages
  const selectChat = useCallback(async (chat: CustomerChat) => {
    setSelectedChat(chat)
    await fetchMessages(chat.id)
  }, [fetchMessages])

  // Initialize Tawk.to API event handlers
  const initializeTawkEvents = useCallback(() => {
    if (typeof window !== 'undefined' && window.Tawk_API) {
      // Handle chat status changes
      window.Tawk_API.onStatusChange = function(status: string) {
        console.log('Tawk status changed:', status)
        // Refresh chats when status changes
        fetchChats()
      }

      // Handle new chat messages
      window.Tawk_API.onChatMessageVisitor = function(message: any) {
        console.log('New visitor message:', message)
        // Refresh messages if this chat is currently selected
        if (selectedChat) {
          fetchMessages(selectedChat.id)
        }
        // Refresh chat list
        fetchChats()
      }

      // Handle chat started
      window.Tawk_API.onChatStarted = function() {
        console.log('Chat started')
        fetchChats()
      }

      // Handle chat ended
      window.Tawk_API.onChatEnded = function() {
        console.log('Chat ended')
        fetchChats()
      }
    }
  }, [fetchChats, fetchMessages, selectedChat])

  // Initialize on mount
  useEffect(() => {
    fetchChats()
    
    // Set up Tawk.to event handlers after a delay to ensure API is loaded
    const timer = setTimeout(() => {
      initializeTawkEvents()
    }, 2000)

    return () => clearTimeout(timer)
  }, [fetchChats, initializeTawkEvents])

  // Set up polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats()
      if (selectedChat) {
        fetchMessages(selectedChat.id)
      }
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [fetchChats, fetchMessages, selectedChat])

  return {
    chats,
    selectedChat,
    messages,
    loading,
    error,
    sendingMessage,
    fetchChats,
    selectChat,
    sendMessage,
    setSelectedChat,
  }
} 