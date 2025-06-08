// src/context/kyc-context.tsx
'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import { z } from 'zod'

// Zod validation schemas for each step
export const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'At least 2 characters'),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.date().refine(dob => {
    const today = new Date()
    const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    return dob <= minAgeDate
  }, 'Must be at least 18 years old')
})

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

export const identityInfoSchema = z.object({
  mobileNumber: z.string().regex(/^\+251[0-9]{9}$/, 'Valid Ethiopian number required (+251...)'),
  idType: z.enum(['national_id', 'passport', 'driving_license']),
  idNumber: z.string().min(4, 'At least 4 characters')
})

export type IdentityInfoSchema = z.infer<typeof identityInfoSchema>;

export const addressInfoSchema = z.object({
  region: z.string().min(2),
  subCity: z.string().min(2),
  woreda: z.string().min(1),
  kebele: z.string().min(1),
  homeNumber: z.string().min(1),
  nationality: z.string().min(2)
})

export type AddressInfoSchema = z.infer<typeof addressInfoSchema>;

export const uploadsSchema = z.object({
  personalPhoto: z.string().url('Valid URL required'),
  idPhotoFront: z.string().url('Valid URL required'),
  idPhotoBack: z.string().url().optional()
})

type FormData = z.infer<typeof personalInfoSchema> &
  z.infer<typeof identityInfoSchema> &
  z.infer<typeof addressInfoSchema> &
  z.infer<typeof uploadsSchema> & {
    userId: string
    personalPhoto?: string
    idPhotoFront?: string
    idPhotoBack?: string
  }

type KYCContextType = {
  step: number
  formData: Partial<FormData>
  errors: Record<string, string>
  setStep: (step: number) => void
  updateFormData: (data: Partial<FormData>) => void
  validateCurrentStep: () => boolean
  submitForm: () => Promise<{ success: boolean; error?: string }>
}

const KYCContext = createContext<KYCContextType | undefined>(undefined)

export function KYCProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<FormData>>({ userId })
  const [errors, setErrors] = useState<Record<string, string>>({})
 
  const updateFormData = (newData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...newData }))
  }

  const validateCurrentStep = () => {
    try {
      let schema;
      switch (step) {
        case 1: schema = personalInfoSchema; break;
        case 2: schema = identityInfoSchema; break;
        case 3: schema = addressInfoSchema; break;
        case 4: 
          // Additional validation for step 4
          if (!formData.personalPhoto || !formData.idPhotoFront) {
            setErrors({
              'Personal photo required' : "dont have the pervious file upload",
            })
            return false;
          }
          return true;
        default: return false;
      }
      schema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path) newErrors[err.path[0]] = err.message
        })
        setErrors(newErrors)
      }
      return false
    }
  }
  

  const submitForm = async () => {
    if (!validateCurrentStep()) return { success: false, error: 'Validation failed' }
    
    try {
      // Include all collected data
      const completeData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth?.toISOString()
      }
  
      const response = await fetch('/api/customer/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData)
      })
  
      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.message || 'Submission failed' }
      }
  
      // Clear form data after successful submission
      setFormData({ userId: formData.userId! })
      setStep(1)
  
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' }
    }
  }

  return (
    <KYCContext.Provider
      value={{
        step,
        formData,
        errors,
        setStep,
        updateFormData,
        validateCurrentStep,
        submitForm
      }}
    >
      {children}
    </KYCContext.Provider>
  )
}

export const useKYC = () => {
  const context = useContext(KYCContext)
  if (!context) throw new Error('useKYC must be used within a KYCProvider')
  return context
}