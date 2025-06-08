// src/app/customer/verify/step-3.tsx
'use client'
import { useState } from 'react'
import { useKYC } from '@/context/kyc-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addressInfoSchema, AddressInfoSchema } from '@/context/kyc-context'
import { KYCProgress } from '@/components/kyc-progress'

// Subcity and Woreda data
const LOCATION_DATA = [
  { name: 'Addis Ketema', woredas: Array.from({length: 14}, (_, i) => i + 1) },
  { name: 'Akaky Kaliti', woredas: Array.from({length: 13}, (_, i) => i + 1) },
  { name: 'Arada', woredas: Array.from({length: 10}, (_, i) => i + 1) },
  { name: 'Bole', woredas: Array.from({length: 15}, (_, i) => i + 1) },
  { name: 'Gullele', woredas: Array.from({length: 10}, (_, i) => i + 1) },
  { name: 'Kirkos', woredas: Array.from({length: 11}, (_, i) => i + 1) },
  { name: 'Kolfe Keranio', woredas: Array.from({length: 15}, (_, i) => i + 1) },
  { name: 'Lideta', woredas: Array.from({length: 10}, (_, i) => i + 1) },
  { name: 'Nifas Silk-Lafto', woredas: Array.from({length: 15}, (_, i) => i + 1) },
  { name: 'Yeka', woredas: Array.from({length: 13}, (_, i) => i + 1) },
  { name: 'Lemi Kura', woredas: Array.from({length: 14}, (_, i) => i + 1) }
]

export default function AddressInfoStep() {
  const { step, setStep, formData, updateFormData, errors } = useKYC()
  const [availableWoredas, setAvailableWoredas] = useState<number[]>([])
  
  const { register, handleSubmit, setValue, watch } = useForm({
    resolver: zodResolver(addressInfoSchema),
    defaultValues: {
      ...formData as AddressInfoSchema,
      region: "Addis Ababa"
    },
  });
  
  const selectedSubCity = watch('subCity')

  const handleSubCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSubCity = e.target.value
    const selectedCityData = LOCATION_DATA.find(city => city.name === selectedSubCity)
    
    setValue('subCity', selectedSubCity)
    setValue('woreda', '')
    
    setAvailableWoredas(selectedCityData?.woredas || [])
  }

  const onSubmit = (data: any) => {
    updateFormData(data)
    setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <KYCProgress />
      
      <h2 className="text-xl font-bold mb-6">Address Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Region</label>
          <input
            {...register('region')}
            defaultValue="Addis Ababa"
            className="w-full p-2 border rounded bg-gray-50"
            readOnly
          />
          {errors.region && <p className="text-red-500 text-sm">{errors.region}</p>}
        </div>

        <div>
          <label className="block mb-1">Sub City</label>
          <select
            {...register('subCity')}
            onChange={handleSubCityChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Sub-city</option>
            {LOCATION_DATA.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
          {errors.subCity && <p className="text-red-500 text-sm">{errors.subCity}</p>}
        </div>

        <div>
          <label className="block mb-1">Woreda</label>
          <select
            {...register('woreda')}
            className="w-full p-2 border rounded"
            disabled={!selectedSubCity}
          >
            <option value="">Select Woreda</option>
            {availableWoredas.map((woreda) => (
              <option key={woreda} value={woreda.toString()}>
                {woreda}
              </option>
            ))}
          </select>
          {errors.woreda && <p className="text-red-500 text-sm">{errors.woreda}</p>}
        </div>

        <div>
          <label className="block mb-1">Kebele</label>
          <input
            {...register('kebele')}
            className="w-full p-2 border rounded"
          />
          {errors.kebele && <p className="text-red-500 text-sm">{errors.kebele}</p>}
        </div>

        <div>
          <label className="block mb-1">Home Number</label>
          <input
            {...register('homeNumber')}
            className="w-full p-2 border rounded"
          />
          {errors.homeNumber && <p className="text-red-500 text-sm">{errors.homeNumber}</p>}
        </div>

        <div>
          <label className="block mb-1">Nationality</label>
          <input
            {...register('nationality')}
            defaultValue="Ethiopian"
            className="w-full p-2 border rounded"
          />
          {errors.nationality && <p className="text-red-500 text-sm">{errors.nationality}</p>}
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
          Next: Document Uploads
        </button>
      </div>
    </form>
  )
}