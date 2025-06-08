// src/app/customer/verify/page.tsx
'use client'
import "@/app/globals.css"
import { useKYC } from '@/context/kyc-context'
import PersonalInfoStep from './step-1'
import IdentityInfoStep from './step-2'
import AddressInfoStep from './step-3'
import DocumentUploadStep from './step-4'
import Link from 'next/link'

export default function VerificationPage() {
  const { step } = useKYC()

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link href="/customer/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Back to Home
        </Link>
      </div>
      {step === 1 && <PersonalInfoStep />}
      {step === 2 && <IdentityInfoStep />}
      {step === 3 && <AddressInfoStep />}
      {step === 4 && <DocumentUploadStep />}
    </div>
  )
}