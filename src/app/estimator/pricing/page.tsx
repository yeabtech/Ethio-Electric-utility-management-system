'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUser } from '@clerk/nextjs'
import { Loader2, Save, Plus } from 'lucide-react'
import "@/app/globals.css"

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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-8 text-black">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Connection Pricing Management</h1>
        <Button variant="outline" onClick={savePricing} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Update All
            </>
          )}
        </Button>
      </div>

      {error && <div className="text-red-500 p-2">{error}</div>}

      {/* Connection Type Pricing Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Connection Type Pricing</h2>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connection Type</TableHead>
                {voltageRates.map(vr => (
                  <TableHead key={vr.voltage}>{vr.voltage}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricingTiers.map(tier => (
                <TableRow key={tier.connectionType}>
                  <TableCell className="font-medium">{tier.connectionType}</TableCell>
                  {voltageRates.map(vr => (
                    <TableCell key={vr.voltage}>
                      <Input
                        type="number"
                        value={tier.voltages[vr.voltage] || 0}
                        onChange={(e) => handlePricingChange(tier.connectionType, vr.voltage, e.target.value)}
                        className="w-32"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Voltage Rate Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Voltage Rates (per unit)</h2>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voltage Level</TableHead>
                <TableHead>Rate (ETB)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voltageRates.map(rate => (
                <TableRow key={rate.voltage}>
                  <TableCell>{rate.voltage}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={rate.rate}
                      onChange={(e) => handleVoltageRateChange(rate.voltage, e.target.value)}
                      className="w-32"
                    />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <Select value={newVoltage} onValueChange={setNewVoltage}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select voltage" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOLTAGE_OPTIONS.filter(v => !voltageRates.some(r => r.voltage === v)).map(voltage => (
                        <SelectItem key={voltage} value={voltage}>{voltage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Rate"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-32"
                  />
                  <Button variant="outline" onClick={addNewVoltage}>
                    <Plus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
