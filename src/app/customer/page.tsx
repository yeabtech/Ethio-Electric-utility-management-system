'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Loading from '../loading/load'

export default function CustomerPage() {
  const { isLoaded, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) {
      // Redirect to dashboard once user is loaded
      router.push('/customer/dashboard')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return <Loading />
  }

  return <Loading />
}