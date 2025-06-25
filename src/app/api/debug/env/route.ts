import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('=== ENVIRONMENT DEBUG ENDPOINT ===')
  
  const envCheck = {
    TAWK_API_KEY: {
      exists: !!process.env.TAWK_API_KEY,
      length: process.env.TAWK_API_KEY?.length || 0,
      preview: process.env.TAWK_API_KEY ? `${process.env.TAWK_API_KEY.substring(0, 10)}...` : 'NOT_SET'
    },
    TAWK_SITE_ID: {
      exists: !!process.env.TAWK_SITE_ID,
      value: process.env.TAWK_SITE_ID || 'NOT_SET'
    },
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    timestamp: new Date().toISOString()
  }
  
  console.log('Environment check result:', envCheck)
  
  return NextResponse.json({
    message: 'Environment variables check',
    data: envCheck,
    note: 'This endpoint is for debugging only. Remove in production.'
  })
} 