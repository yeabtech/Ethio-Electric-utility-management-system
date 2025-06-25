import { NextRequest, NextResponse } from 'next/server'

const TAWK_API_KEY = process.env.TAWK_API_KEY
const TAWK_SITE_ID = process.env.TAWK_SITE_ID

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!TAWK_API_KEY || !TAWK_SITE_ID) {
      return NextResponse.json(
        { error: 'Tawk.to API credentials not configured. Please set TAWK_API_KEY and TAWK_SITE_ID in your environment variables.' },
        { status: 500 }
      )
    }

    const chatId = params.id

    // Fetch messages for specific chat from Tawk.to API
    const response = await fetch(`https://api.tawk.to/v1/chats/${chatId}/messages?siteId=${TAWK_SITE_ID}`, {
      headers: {
        'Authorization': `Bearer ${TAWK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Tawk.to messages API error:', response.status, errorText)
      
      if (response.status === 404) {
        return NextResponse.json({ messages: [] })
      }
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication failed. Please check your Tawk.to API key.' },
          { status: 401 }
        )
      }
      
      throw new Error(`Tawk.to API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Transform messages to match our frontend structure
    const transformedMessages = data.messages?.map((message: any) => ({
      id: message.id,
      content: message.message,
      timestamp: message.timestamp,
      sender: message.sender === 'visitor' ? 'customer' : 'agent',
      senderName: message.sender === 'visitor' ? message.visitor?.name : message.agent?.name,
      type: message.type || 'text',
    })) || []

    return NextResponse.json({ messages: transformedMessages })
  } catch (error) {
    console.error('Error fetching Tawk.to messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message data from Tawk.to API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 