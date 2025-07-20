// src/app/cso/verifications/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import "@/app/globals.css"
type VerificationDetails = {
  id: string
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  mobileNumber: string
  idType: string
  idNumber: string
  region: string
  subCity: string
  woreda: string
  kebele: string
  homeNumber: string
  nationality: string
  personalPhoto: string
  idPhotoFront: string
  idPhotoBack?: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  user: {
    email: string
    firstName: string
    lastName: string
    imageUrl: string
  }
}

export default function VerificationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [verification, setVerification] = useState<VerificationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
// Inside component scope
const fetchVerification = async () => {
  try {
    setLoading(true)
    const response = await fetch(`/api/cso/verifications/${params.id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch verification details')
    }
    const data = await response.json()
    setVerification(data)
  } catch (err) {
    setError('Failed to load verification data')
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  fetchVerification()
}, [params.id])


  if (loading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (!verification) return <div className="p-4">Verification not found</div>

  return (
    <div
      className="min-h-screen flex bg-[#E6E6E6]"
      style={{
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex-1 p-8 md:p-12 ml-0 md:ml-72 flex justify-center items-start">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-8 w-full max-w-5xl text-black">
          <div className="sticky top-0 bg-white z-10 pb-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="mb-4 text-lg py-10 px-6"
            >
              <ArrowLeft className="mr-2" /> Go Back to Verifications
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Verification Details</h1>
            <div className="space-x-2">
              <Badge variant={verification.status === 'approved' ? 'success' : 
                             verification.status === 'rejected' ? 'destructive' : 'warning'} >
                {verification.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img 
                    src={verification.user.imageUrl} 
                    alt="User" 
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{verification.user.firstName} {verification.user.lastName}</p>
                    <p className="text-sm text-gray-500">{verification.user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">First Name</p>
                    <p>{verification.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Name</p>
                    <p>{verification.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p>{verification.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p>{new Date(verification.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Identity Info */}
            <Card>
              <CardHeader>
                <CardTitle>Identity Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Mobile Number</p>
                  <p>{verification.mobileNumber}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID Type</p>
                    <p>{verification.idType.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID Number</p>
                    <p>{verification.idNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Info */}
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Region</p>
                    <p>{verification.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sub City</p>
                    <p>{verification.subCity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Woreda</p>
                    <p>{verification.woreda}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kebele</p>
                    <p>{verification.kebele}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Home Number</p>
                    <p>{verification.homeNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nationality</p>
                    <p>{verification.nationality}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Images */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Document Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Personal Photo</p>
                  <img 
                    src={verification.personalPhoto} 
                    alt="Personal Photo" 
                    className="w-full h-auto rounded border"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">ID Front</p>
                  <img 
                    src={verification.idPhotoFront} 
                    alt="ID Front" 
                    className="w-full h-auto rounded border"
                  />
                </div>
                {verification.idPhotoBack && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">ID Back</p>
                    <img 
                      src={verification.idPhotoBack} 
                      alt="ID Back" 
                      className="w-full h-auto rounded border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {verification.status === 'pending' && (
            <div className="flex justify-end space-x-4 mt-8">
              <Button
                variant="destructive"
                onClick={async () => {
                  const reason = prompt('Enter rejection reason:')
                  if (reason) {
                    await fetch(`/api/cso/verifications/${verification.id}/reject`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason })
                    })
                    await fetchVerification() // instead of reload
                  }
                }}
              >
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await fetch(`/api/cso/verifications/${verification.id}/approve`, {
                    method: 'POST'
                  })
                  await fetchVerification() 
                }}
              >
                Approve
              </Button>
            </div>
          )}

          {/* Rejection Reason */}
          {verification.status === 'rejected' && verification.rejectionReason && (
            <Card className="border-red-200 bg-red-50 mt-8">
              <CardHeader>
                <CardTitle className="text-red-700">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{verification.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}