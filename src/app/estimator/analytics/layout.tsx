import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Receipt Analytics - Estimator Dashboard',
  description: 'Comprehensive analysis of revenue and payment data from receipts',
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
} 