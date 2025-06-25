import { NextRequest, NextResponse } from 'next/server'

const TAWK_API_KEY = process.env.TAWK_API_KEY
const TAWK_SITE_ID = process.env.TAWK_SITE_ID

export async function POST(
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
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Send message via Tawk.to API
    const response = await fetch(`https://api.tawk.to/v1/chats/${chatId}/messages?siteId=${TAWK_SITE_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAWK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        type: 'text'
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Tawk.to send message API error:', response.status, errorText)
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication failed. Please check your Tawk.to API key.' },
          { status: 401 }
        )
      }
      
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Access forbidden. Please check your Tawk.to API permissions.' },
          { status: 403 }
        )
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Chat not found. The chat may have been closed or deleted.' },
          { status: 404 }
        )
      }
      
      throw new Error(`Tawk.to API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      success: true, 
      message: data 
    })
  } catch (error) {
    console.error('Error sending Tawk.to message:', error)
    return NextResponse.json(
      { error: 'Failed to send message via Tawk.to API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 