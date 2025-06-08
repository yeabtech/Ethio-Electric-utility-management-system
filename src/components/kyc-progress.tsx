// src/components/kyc-progress.tsx
'use client'
import { useKYC } from '@/context/kyc-context'

const steps = [
  'Personal Info',
  'Identity Details',
  'Address Info',
  'Document Uploads'
]

export function KYCProgress() {
  const { step } = useKYC()
  
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between mb-2">
        {steps.map((label, index) => (
          <div 
            key={index}
            className={`text-sm ${index + 1 <= step ? 'font-bold text-blue-600' : 'text-gray-500'}`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${(step / steps.length) * 100}%` }}
        />
      </div>
    </div>
  )
}