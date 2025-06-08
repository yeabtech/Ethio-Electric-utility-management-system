// src/components/ui/alert.tsx
import { ReactNode } from 'react'

type AlertProps = {
  children: ReactNode
  variant: 'success' | 'error' | 'warning' | 'info'
}

export function Alert({ children, variant }: AlertProps) {
  const baseClasses = 'p-4 rounded-md shadow-md flex items-center space-x-3'
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      <div className="flex-shrink-0">
        {/* Add icons based on variant */}
        {variant === 'success' && '✅'}
        {variant === 'error' && '❌'}
        {variant === 'warning' && '⚠️'}
        {variant === 'info' && 'ℹ️'}
      </div>
      <div className="flex-1">{children}</div>
    </div>
    
  )
  
}

export function AlertTitle({ children }: { children: ReactNode }) {
  return <div className="font-semibold">{children}</div>
}

export function AlertDescription({ children }: { children: ReactNode }) {
  return <div className="text-sm">{children}</div>
}
