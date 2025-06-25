'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin,
  Loader2,
  RefreshCw,
  Send
} from 'lucide-react'
import TawkToScript from '@/app/components/TawkToScript'
import { useTawkChats, type ChatMessage } from '@/lib/hooks/useTawkChats'

export default function CustomerSupportPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'waiting' | 'resolved'>('all')
  const [newMessage, setNewMessage] = useState('')
  
  const {
    chats: activeChats,
    selectedChat,
    messages,
    loading,
    error,
    sendingMessage,
    fetchChats,
    selectChat,
    sendMessage,
  } = useTawkChats()

  const filteredChats = activeChats.filter(chat => {
    const matchesSearch = chat.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || chat.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-black'
      case 'waiting': return 'bg-yellow-100 text-black'
      case 'resolved': return 'bg-gray-100 text-black'
      default: return 'bg-gray-100 text-black'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-black'
      case 'medium': return 'bg-orange-100 text-black'
      case 'low': return 'bg-blue-100 text-black'
      default: return 'bg-gray-100 text-black'
    }
  }

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return
    
    const success = await sendMessage(selectedChat.id, newMessage.trim())
    if (success) {
      setNewMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Customer Support</h1>
          <p className="text-black">Manage customer inquiries and provide real-time support</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={fetchChats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="success" className="bg-green-100 text-black">
            <CheckCircle className="w-3 h-3 mr-1" />
            Online
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tawk Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Tawk.to Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-black">
                {error ? 'Connection Error' : 'Connected to Tawk.to'}
              </span>
            </div>
            <p className="text-sm text-black">
              {error 
                ? 'Unable to fetch chats from Tawk.to. Please check your API configuration.'
                : 'Successfully connected to Tawk.to API. Chats will appear below when customers start conversations.'
              }
            </p>
            {!error && activeChats.length === 0 && (
              <p className="text-sm text-black">
                💡 No active chats yet. When customers start conversations through the chat widget, they will appear here.
              </p>
            )}
            <div className="flex space-x-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.Tawk_API) {
                    window.Tawk_API.showWidget()
                    console.log('🔧 Manually triggered Tawk widget')
                  }
                }}
              >
                Test Chat Widget
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.Tawk_API) {
                    window.Tawk_API.hideWidget()
                    console.log('🔧 Manually hidden Tawk widget')
                  }
                }}
              >
                Hide Widget
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-black" />
              <div>
                <p className="text-sm text-black">Total Chats</p>
                <p className="text-2xl font-bold text-black">{activeChats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-black" />
              <div>
                <p className="text-sm text-black">Active</p>
                <p className="text-2xl font-bold text-black">{activeChats.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-black" />
              <div>
                <p className="text-sm text-black">Waiting</p>
                <p className="text-2xl font-bold text-black">{activeChats.filter(c => c.status === 'waiting').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-black" />
              <div>
                <p className="text-sm text-black">Resolved</p>
                <p className="text-2xl font-bold text-black">{activeChats.filter(c => c.status === 'resolved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Customer Chats</CardTitle>
              <div className="space-y-2">
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex space-x-2">
                  {(['all', 'active', 'waiting', 'resolved'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => selectChat(chat)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-black">{chat.customerName}</h4>
                      <div className="flex space-x-1">
                        <Badge className={`text-xs ${getStatusColor(chat.status)}`}>
                          {chat.status}
                        </Badge>
                        <Badge className={`text-xs ${getPriorityColor(chat.priority)}`}>
                          {chat.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-black truncate">{chat.lastMessage}</p>
                    <p className="text-xs text-black mt-1">{chat.lastMessageTime}</p>
                  </div>
                ))}
                {filteredChats.length === 0 && (
                  <div className="p-4 text-center text-black">
                    {activeChats.length === 0 ? 'No chats available' : 'No chats match your filters'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-black">
                {selectedChat ? `Chat with ${selectedChat.customerName}` : 'Select a chat to start'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedChat ? (
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-black">Customer Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-black" />
                        <span className="text-black">{selectedChat.customerEmail || 'No email provided'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-black" />
                        <span className="text-black">+251 9XX XXX XXX</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-black" />
                        <span className="text-black">Addis Ababa, Ethiopia</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(selectedChat.priority)}>
                          {selectedChat.priority} Priority
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto">
                    <div className="space-y-3">
                      {messages.length > 0 ? (
                        messages.map((message: ChatMessage) => (
                          <div key={message.id} className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-xs ${
                              message.sender === 'agent' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.sender === 'agent' ? 'text-blue-100' : 'text-black'
                              }`}>
                                {formatMessageTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-black py-8">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-black" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      className="flex-1"
                      rows={3}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sendingMessage}
                    />
                    <Button 
                      className="self-end"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-black">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-black" />
                  <p>Select a customer chat from the list to start supporting them</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TawkTo Integration */}
      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Live Chat Integration</AlertTitle>
        <AlertDescription>
          TawkTo live chat widget is integrated below. Customers can initiate conversations 
          and you can respond in real-time. The chat widget will appear in the bottom-right corner.
          All chat data is fetched from the Tawk.to API in real-time.
        </AlertDescription>
      </Alert>

      {/* TawkTo Script */}
      <TawkToScript autoStart={false} />
    </div>
  )
}