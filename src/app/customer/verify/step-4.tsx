// src/app/customer/verify/step-4.tsx
'use client'
import { useKYC } from '@/context/kyc-context'
import { KYCProgress } from '@/components/kyc-progress'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUploadThing } from '@/lib/uploadthing'
import { Loader2 } from 'lucide-react'

export default function DocumentUploadStep() {
  const { step, setStep, formData, updateFormData, submitForm } = useKYC()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const router = useRouter()

  // Initialize UploadThing
  const { startUpload } = useUploadThing('customerVerification', {
    onClientUploadComplete: () => {
      setIsUploading(false)
      setUploadingField(null)
    },
    onUploadError: (error) => {
      setUploadError(error.message)
      setIsUploading(false)
      setUploadingField(null)
    },
  })

  const handleFileUpload = async (files: File[], fieldName: string) => {
    setIsUploading(true)
    setUploadingField(fieldName)
    setUploadError('')

    try {
      // Upload files using UploadThing
      const uploadResults = await startUpload(files)
      
      if (!uploadResults || uploadResults.length === 0) {
        throw new Error('Upload failed - no results returned')
      }

      // Update form data with the first file's URL
      updateFormData({
        [fieldName]: uploadResults[0].url
      })
    } catch (error) {
      if (error instanceof Error) {
        setUploadError(error.message)
      } else {
        setUploadError('An unexpected error occurred during upload')
      }
    } finally {
      setIsUploading(false)
      setUploadingField(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/customer/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('Submission error details:', result)
        throw new Error(result.error || 'Submission failed')
      }
      
      router.push('/customer/dashboard?status=pending')
    } catch (error) {
      console.error('Full submission error:', error)
      
      if (error instanceof Error) {
        setUploadError(error.message)
      } else {
        setUploadError('An unexpected error occurred.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <KYCProgress />
      
      <h2 className="text-xl font-bold mb-6">Document Uploads</h2>

      <div className="space-y-6">
        <div className="border border-gray-300 bg-gray-300 p-4 rounded">
          <label className="block mb-2">Personal Photo (Passport Style)</label>
          <input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={async (e) => {
              const files = e.target.files ? Array.from(e.target.files) : []
              if (files.length > 0) await handleFileUpload(files, 'personalPhoto')
            }}
          />
          {uploadingField === 'personalPhoto' && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading personal photo...</span>
            </div>
          )}
          {formData.personalPhoto && (
            <div className="mt-2 border border-gray-300 p-2 rounded">
              <img 
                src={formData.personalPhoto} 
                alt="Personal photo preview" 
                className="h-20 w-20 object-cover rounded"
              />
              <p className="text-green-500 text-sm mt-1">Uploaded successfully</p>
            </div>
          )}
        </div>

        <div className="border border-gray-300 bg-gray-300 p-4 rounded">
          <label className="block mb-2">ID Photo (Front)</label>
          <input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={async (e) => {
              const files = e.target.files ? Array.from(e.target.files) : []
              if (files.length > 0) await handleFileUpload(files, 'idPhotoFront')
            }}
          />
          {uploadingField === 'idPhotoFront' && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading ID front...</span>
            </div>
          )}
          {formData.idPhotoFront && (
            <div className="mt-2 border border-gray-300 p-2 rounded">
              <img 
                src={formData.idPhotoFront} 
                alt="ID front preview" 
                className="h-20 w-20 object-cover rounded"
              />
              <p className="text-green-500 text-sm mt-1">Uploaded successfully</p>
            </div>
          )}
        </div>

        <div className="border border-gray-300 bg-gray-300 p-4 rounded">
          <label className="block mb-2">ID Photo (Back - Optional)</label>
          <input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={async (e) => {
              const files = e.target.files ? Array.from(e.target.files) : []
              if (files.length > 0) await handleFileUpload(files, 'idPhotoBack')
            }}
          />
          {uploadingField === 'idPhotoBack' && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading ID back...</span>
            </div>
          )}
          {formData.idPhotoBack && (
            <div className="mt-2 border border-gray-300 p-2 rounded">
              <img 
                src={formData.idPhotoBack} 
                alt="ID back preview" 
                className="h-20 w-20 object-cover rounded"
              />
              <p className="text-green-500 text-sm mt-1">Uploaded successfully</p>
            </div>
          )}
        </div>

        {uploadError && (
          <p className="text-red-500 text-sm">{uploadError}</p>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          disabled={isUploading || isSubmitting}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!formData.personalPhoto || !formData.idPhotoFront || isUploading || isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : 'Complete Verification'}
        </button>
      </div>
    </form>
  )
}