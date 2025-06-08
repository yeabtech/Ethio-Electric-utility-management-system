// src/app/customer/verify/step-1.tsx
'use client';
import { useKYC } from '@/context/kyc-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalInfoSchema, PersonalInfoFormData } from '@/context/kyc-context';
import { KYCProgress } from '@/components/kyc-progress';

export default function PersonalInfoStep() {
  const { step, setStep, formData, updateFormData, errors } = useKYC();
  const { register, handleSubmit, formState: { errors: formErrors } } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: formData as PersonalInfoFormData,
  });

  const onSubmit = (data: PersonalInfoFormData) => {
    updateFormData(data);
    setStep(step + 1);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <KYCProgress />
      
      <h2 className="text-xl font-bold mb-6">Personal Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">First Name</label>
          <input
            {...register('firstName')}
            className="w-full p-2 border rounded"
          />
          {formErrors.firstName && <p className="text-red-500 text-sm">{formErrors.firstName.message}</p>}
        </div>

        <div>
          <label className="block mb-1">Middle Name (Optional)</label>
          <input
            {...register('middleName')}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Last Name</label>
          <input
            {...register('lastName')}
            className="w-full p-2 border rounded"
          />
          {formErrors.lastName && <p className="text-red-500 text-sm">{formErrors.lastName.message}</p>}
        </div>

        <div>
          <label className="block mb-1">Gender</label>
          <select
            {...register('gender')}
            className="w-full p-2 border rounded"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Date of Birth</label>
          <input
            type="date"
            {...register('dateOfBirth', { valueAsDate: true })}
            className="w-full p-2 border rounded"
          />
          {formErrors.dateOfBirth && <p className="text-red-500 text-sm">{formErrors.dateOfBirth.message}</p>}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Next: Identity Details
        </button>
      </div>
    </form>
  );
}
