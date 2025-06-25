'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

declare global {
  interface Window {
    Tawk_API?: any
    Tawk_LoadStart?: Date
  }
}

interface TawkToScriptProps {
  propertyId?: string
  widgetId?: string
  autoStart?: boolean
  customStyle?: {
    zIndex?: number | string
  }
}

export default function TawkToScript({ 
  propertyId = '684d312f4aea20190b63511b',
  widgetId = '1itmog912',
  autoStart = true,
  customStyle = { zIndex: 1000 }
}: TawkToScriptProps) {
  const { user, isSignedIn } = useUser()

  useEffect(() => {
    // Initialize Tawk.to API
    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()

    // Configure Tawk.to settings
    window.Tawk_API.autoStart = autoStart
    window.Tawk_API.customStyle = customStyle

    // Create and load the script
    const s1 = document.createElement('script')
    const s0 = document.getElementsByTagName('script')[0]
    s1.async = true
    s1.src = `https://embed.tawk.to/${propertyId}/${widgetId}`
    s1.charset = 'UTF-8'
    s1.setAttribute('crossorigin', '*')
    s0.parentNode?.insertBefore(s1, s0)

    // Set up basic event handlers
    window.Tawk_API.onLoad = function() {
      console.log('🎉 Tawk.to widget loaded successfully')
      
      // Identify user if they are signed in
      if (isSignedIn && user) {
        try {
          const userData = {
            name: user.fullName || user.firstName || 'Anonymous',
            email: user.emailAddresses[0]?.emailAddress || '',
            role: user.publicMetadata?.role || 'customer',
            // Add any additional user properties you want to track
            userId: user.id,
            phone: user.phoneNumbers[0]?.phoneNumber || '',
          }
          
          window.Tawk_API.identify(userData)
          console.log('✅ User identified to Tawk.to:', userData)
        } catch (error) {
          console.error('❌ Failed to identify user to Tawk.to:', error)
        }
      } else {
        // For anonymous users, we can still use Tawk.to but without identification
        console.log('👤 Anonymous user - Tawk.to will work without user identification')
      }
    }

    window.Tawk_API.onStatusChange = function(status: string) {
      console.log('🔄 Tawk.to status changed:', status)
    }

    window.Tawk_API.onChatStarted = function() {
      console.log('💬 Tawk.to chat started')
    }

    window.Tawk_API.onChatEnded = function() {
      console.log('🔚 Tawk.to chat ended')
    }

    window.Tawk_API.onChatMessageVisitor = function(message: any) {
      console.log('📨 Tawk.to visitor message:', message)
    }

    window.Tawk_API.onChatMessageAgent = function(message: any) {
      console.log('📤 Tawk.to agent message:', message)
    }

    window.Tawk_API.onError = function(error: any) {
      console.error('❌ Tawk.to error:', error)
    }

    return () => {
      // Cleanup if needed
      if (s1.parentNode) {
        s1.parentNode.removeChild(s1)
      }
    }
  }, [propertyId, widgetId, autoStart, customStyle, isSignedIn, user])

  return null
} 