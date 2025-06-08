// src/app/customer/verify/step-2.tsx
'use client'
import { useKYC } from '@/context/kyc-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { identityInfoSchema,IdentityInfoSchema } from '@/context/kyc-context'
import { KYCProgress } from '@/components/kyc-progress'

export default function IdentityInfoStep() {
  const { step, setStep, formData, updateFormData, errors } = useKYC()
  const { register, handleSubmit } = useForm({
     resolver: zodResolver(identityInfoSchema),
     defaultValues: formData as IdentityInfoSchema ,
   });


  const onSubmit = (data: any) => {
    updateFormData(data)
    setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <KYCProgress />
      
      <h2 className="text-xl font-bold mb-6">Identity Details</h2>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block mb-1">Mobile Number (+251...)</label>
          <input
            {...register('mobileNumber')}
            placeholder="+251911223344"
            className="w-full p-2 border rounded"
          />
          {errors.mobileNumber && <p className="text-red-500 text-sm">{errors.mobileNumber}</p>}
        </div>

        <div>
          <label className="block mb-1">ID Type</label>
          <select
            {...register('idType')}
            className="w-full p-2 border rounded"
          >
            <option value="national_id">National ID</option>
            <option value="passport">Passport</option>
            <option value="driving_license">Driving License</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">ID Number</label>
          <input
            {...register('idNumber')}
            className="w-full p-2 border rounded"
          />
          {errors.idNumber && <p className="text-red-500 text-sm">{errors.idNumber}</p>}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={prevStep}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          Back
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Next: Address Information
        </button>
      </div>
    </form>
  )
}