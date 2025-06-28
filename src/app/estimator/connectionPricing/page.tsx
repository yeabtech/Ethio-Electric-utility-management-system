'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUser } from '@clerk/nextjs'
import { Loader2, Save, Plus, Settings, Zap, DollarSign } from 'lucide-react'

type PricingTier = {
  connectionType: string
  voltages: {
    [voltage: string]: number
  }
}

type VoltageRate = {
  voltage: string
  rate: number
}

export default function EstimatorPricingPage() {
  const { user } = useUser()
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [voltageRates, setVoltageRates] = useState<VoltageRate[]>([])
  const [newVoltage, setNewVoltage] = useState('')
  const [newRate, setNewRate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const CONNECTION_TYPES = [
    'Residential',
    'Commercial',
    'Industrial',
    'Agricultural',
    'Temporary Construction',
    'Institutional'
  ]

  const VOLTAGE_OPTIONS = [
    'Single Phase (220V)',
    'Three Phase (380V)',
    '11 kV',
    '33 kV'
  ]

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch('/api/estimator/pricing')
        const data = await res.json()

        const updatedPricingTiers = CONNECTION_TYPES.map(type => {
          const existing = data.pricingTiers.find((tier: PricingTier) => tier.connectionType === type)
          return existing || {
            connectionType: type,
            voltages: Object.fromEntries(VOLTAGE_OPTIONS.map(v => [v, 0]))
          }
        })

        setPricingTiers(updatedPricingTiers)
        setVoltageRates(data.voltageRates)
      } catch (err) {
        setError('Failed to load pricing data')
      } finally {
        setLoading(false)
      }
    }

    fetchPricing()
  }, [])

  const handlePricingChange = (connectionType: string, voltage: string, value: string) => {
    const numericValue = parseFloat(value) || 0
    setPricingTiers(prev => prev.map(tier =>
      tier.connectionType === connectionType
        ? { ...tier, voltages: { ...tier.voltages, [voltage]: numericValue } }
        : tier
    ))
  }

  const handleVoltageRateChange = (voltage: string, value: string) => {
    const numericValue = parseFloat(value) || 0
    setVoltageRates(prev => prev.map(rate =>
      rate.voltage === voltage ? { ...rate, rate: numericValue } : rate
    ))
  }

  const addNewVoltage = () => {
    if (!newVoltage || !newRate) {
      setError('Please select a voltage and set its rate.')
      return
    }

    if (voltageRates.some(rate => rate.voltage === newVoltage)) {
      setError('Voltage already exists.')
      return
    }

    setVoltageRates(prev => [...prev, { voltage: newVoltage, rate: parseFloat(newRate) }])
    setPricingTiers(prev => prev.map(tier => ({
      ...tier,
      voltages: { ...tier.voltages, [newVoltage]: 0 }
    })))

    setNewVoltage('')
    setNewRate('')
    setError('')
  }

  const savePricing = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/estimator/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricingTiers, voltageRates })
      })

      if (!response.ok) throw new Error('Save failed')
      setError('')
    } catch (err) {
      setError('Failed to save pricing')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-blue-500 mx-auto mb-4" />
          <p className="text-black font-medium">Loading pricing configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
               
                <div>
                  <h1 className="text-4xl font-bold text-black">
                    Pricing Management
                  </h1>
                  <p className="text-gray-600 text-lg mt-1">
                    Configure connection pricing tiers and voltage rates
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={savePricing} 
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-semibold text-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="mr-3 h-5 w-5" />
                  Save All Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-600 font-semibold">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Type Pricing Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-black">Connection Type Pricing</h2>
            </div>
            <p className="text-gray-600 text-lg">Set pricing for different connection types and voltage levels</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-black text-lg py-6">Connection Type</TableHead>
                  {voltageRates.map(vr => (
                    <TableHead key={vr.voltage} className="font-bold text-black text-lg py-6 text-center">
                      {vr.voltage}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingTiers.map((tier, index) => (
                  <TableRow 
                    key={tier.connectionType} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200`}
                  >
                    <TableCell className="font-semibold text-black text-lg py-6">
                      {tier.connectionType}
                    </TableCell>
                    {voltageRates.map(vr => (
                      <TableCell key={vr.voltage} className="py-6">
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            value={tier.voltages[vr.voltage] || 0}
                            onChange={(e) => handlePricingChange(tier.connectionType, vr.voltage, e.target.value)}
                            className="w-36 border-gray-300 bg-white focus:border-blue-400 focus:ring-blue-400 rounded-lg text-center font-medium shadow-sm hover:shadow-md transition-all duration-200"
                            placeholder="0.00"
                          />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Voltage Rate Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-black">Voltage Rates (per unit)</h2>
            </div>
            <p className="text-gray-600 text-lg">Configure rates for different voltage levels</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-black text-lg py-6">Voltage Level</TableHead>
                  <TableHead className="font-bold text-black text-lg py-6">Rate (ETB)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voltageRates.map((rate, index) => (
                  <TableRow 
                    key={rate.voltage} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200`}
                  >
                    <TableCell className="font-semibold text-black text-lg py-6">
                      {rate.voltage}
                    </TableCell>
                    <TableCell className="py-6">
                      <Input
                        type="number"
                        value={rate.rate}
                        onChange={(e) => handleVoltageRateChange(rate.voltage, e.target.value)}
                        className="w-36 border-gray-300 bg-white focus:border-blue-400 focus:ring-blue-400 rounded-lg text-center font-medium shadow-sm hover:shadow-md transition-all duration-200"
                        placeholder="0.00"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 border-t-2 border-gray-200">
                  <TableCell className="py-6">
                    <Select value={newVoltage} onValueChange={setNewVoltage}>
                      <SelectTrigger className="w-[250px] border-gray-300 focus:border-blue-400 focus:ring-blue-400 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                        <SelectValue placeholder="Select voltage level" />
                      </SelectTrigger>
                      <SelectContent>
                        {VOLTAGE_OPTIONS.filter(v => !voltageRates.some(r => r.voltage === v)).map(voltage => (
                          <SelectItem key={voltage} value={voltage}>{voltage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="flex gap-3 items-center">
                      <Input
                        type="number"
                        placeholder="Enter rate"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        className="w-36 border-gray-300 bg-white focus:border-blue-400 focus:ring-blue-400 rounded-lg text-center font-medium shadow-sm hover:shadow-md transition-all duration-200"
                      />
                      <Button 
                        variant="outline" 
                        onClick={addNewVoltage}
                        className="border-gray-300 text-black hover:bg-blue-50 hover:border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Voltage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
