import { NextRequest, NextResponse } from 'next/server'

const TAWK_API_KEY = process.env.TAWK_API_KEY
const TAWK_SITE_ID = process.env.TAWK_SITE_ID

export async function GET(request: NextRequest) {
  console.log('=== TAWK CHATS API DEBUG START ===')
  console.log('Request URL:', request.url)
  console.log('Request method:', request.method)
  console.log('Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    // Log environment variables (without exposing sensitive data)
    console.log('Environment check:')
    console.log('- TAWK_API_KEY exists:', !!TAWK_API_KEY)
    console.log('- TAWK_API_KEY length:', TAWK_API_KEY?.length || 0)
    console.log('- TAWK_SITE_ID exists:', !!TAWK_SITE_ID)
    console.log('- TAWK_SITE_ID value:', TAWK_SITE_ID)
    
    if (!TAWK_API_KEY || !TAWK_SITE_ID) {
      console.error('Missing environment variables:')
      console.error('- TAWK_API_KEY missing:', !TAWK_API_KEY)
      console.error('- TAWK_SITE_ID missing:', !TAWK_SITE_ID)
      return NextResponse.json(
        { error: 'Tawk.to API credentials not configured. Please set TAWK_API_KEY and TAWK_SITE_ID in your environment variables.' },
        { status: 500 }
      )
    }

    // Try the correct Tawk.to API endpoint
    const apiUrl = `https://api.tawk.to/v1/chats?siteId=${TAWK_SITE_ID}`
    console.log('Making API request to:', apiUrl)
    console.log('Request headers:', {
      'Authorization': `Bearer ${TAWK_API_KEY.substring(0, 10)}...`,
      'Content-Type': 'application/json',
    })

    // Fetch chats from Tawk.to API
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${TAWK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('API Response received:')
    console.log('- Status:', response.status)
    console.log('- Status text:', response.statusText)
    console.log('- Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:')
      console.error('- Status:', response.status)
      console.error('- Status text:', response.statusText)
      console.error('- Error body:', errorText)
      
      // Handle specific error cases
      if (response.status === 404) {
        // 404 might mean no chats exist yet, which is normal
        console.log('No chats found yet - returning empty array')
        return NextResponse.json({ chats: [] })
      }
      
      if (response.status === 401) {
        console.error('Authentication failed - check your API key')
        return NextResponse.json(
          { error: 'Authentication failed. Please check your Tawk.to API key.' },
          { status: 401 }
        )
      }
      
      if (response.status === 403) {
        console.error('Access forbidden - check your API permissions')
        return NextResponse.json(
          { error: 'Access forbidden. Please check your Tawk.to API permissions.' },
          { status: 403 }
        )
      }
      
      throw new Error(`Tawk.to API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('API Response data structure:')
    console.log('- Data type:', typeof data)
    console.log('- Has chats property:', !!data.chats)
    console.log('- Chats array length:', data.chats?.length || 0)
    console.log('- Full data keys:', Object.keys(data))
    
    // Transform the data to match our frontend structure
    const transformedChats = data.chats?.map((chat: any) => {
      console.log('Processing chat:', chat.id, chat.visitor?.name)
      return {
        id: chat.id,
        customerName: chat.visitor?.name || 'Anonymous',
        customerEmail: chat.visitor?.email || '',
        status: getChatStatus(chat.status),
        lastMessage: chat.lastMessage?.message || 'No messages yet',
        lastMessageTime: formatTime(chat.lastMessage?.timestamp),
        priority: getPriority(chat.priority || 'medium'),
        visitorId: chat.visitor?.id,
        agentId: chat.agent?.id,
        startTime: chat.startTime,
        endTime: chat.endTime,
      }
    }) || []

    console.log('Transformation complete:')
    console.log('- Transformed chats count:', transformedChats.length)
    console.log('- Sample transformed chat:', transformedChats[0])

    console.log('=== TAWK CHATS API DEBUG END ===')
    return NextResponse.json({ chats: transformedChats })
  } catch (error) {
    console.error('=== TAWK CHATS API ERROR ===')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    console.error('=== END ERROR LOG ===')
    
    return NextResponse.json(
      { error: 'Failed to fetch chat data from Tawk.to API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

function getChatStatus(tawkStatus: string): 'active' | 'waiting' | 'resolved' {
  switch (tawkStatus) {
    case 'ACTIVE':
      return 'active'
    case 'WAITING':
      return 'waiting'
    case 'RESOLVED':
    case 'CLOSED':
      return 'resolved'
    default:
      return 'waiting'
  }
}

function getPriority(tawkPriority: string): 'high' | 'medium' | 'low' {
  switch (tawkPriority) {
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    case 'LOW':
      return 'low'
    default:
      return 'medium'
  }
}

function formatTime(timestamp: string | number): string {
  if (!timestamp) return 'Unknown'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return `${Math.floor(diffInMinutes / 1440)} days ago`
} 