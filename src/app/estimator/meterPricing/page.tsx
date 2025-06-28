'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Zap, CreditCard, Plus, Search, Calculator } from 'lucide-react';

interface MeterPricing {
  id: string;
  meterType: string;
  price: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  meterType: string;
  price: number;
  description: string;
}

const MeterPricingPage = () => {
  const [meterPricings, setMeterPricings] = useState<MeterPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MeterPricing | null>(null);
  const [formData, setFormData] = useState<FormData>({
    meterType: '',
    price: 0,
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch meter pricings
  const fetchMeterPricings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/meter-pricing');
      if (!response.ok) throw new Error('Failed to fetch meter pricings');
      const data = await response.json();
      setMeterPricings(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch meter pricings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeterPricings();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.meterType.trim() || formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = editingItem 
        ? `/api/meter-pricing/${editingItem.id}`
        : '/api/meter-pricing';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save meter pricing');

      toast({
        title: "Success",
        description: editingItem 
          ? "Meter pricing updated successfully" 
          : "Meter pricing created successfully",
      });

      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
      fetchMeterPricings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save meter pricing",
        variant: "destructive",
      });
    }
  };

  // Handle edit
  const handleEdit = (item: MeterPricing) => {
    setEditingItem(item);
    setFormData({
      meterType: item.meterType,
      price: item.price,
      description: item.description || '',
    });
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meter pricing?')) return;

    try {
      const response = await fetch(`/api/meter-pricing/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete meter pricing');

      toast({
        title: "Success",
        description: "Meter pricing deleted successfully",
      });

      fetchMeterPricings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete meter pricing",
        variant: "destructive",
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      meterType: '',
      price: 0,
      description: ''
    });
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingItem(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    resetForm();
  };

  // Filter meter pricings based on search term
  const filteredMeterPricings = meterPricings.filter(item =>
    item.meterType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Loading meter pricings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Meter Pricing Management
                  </h1>
                  <p className="text-gray-600 text-lg mt-1">
                    Manage meter types and their pricing
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={openCreateModal} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-semibold text-lg"
            >
              <Plus className="mr-3 h-5 w-5" />
              Add New Meter Pricing
            </Button>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Meter Types</h3>
                <div className="text-2xl font-bold text-blue-500">{meterPricings.length}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Average Price</h3>
                <div className="text-2xl font-bold text-green-500">
                  ETB {meterPricings.length > 0 
                    ? (meterPricings.reduce((sum, item) => sum + item.price, 0) / meterPricings.length).toFixed(2)
                    : '0.00'
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-500 rounded-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Search</h3>
                <Input
                  placeholder="Search meter types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-gray-300 bg-white focus:border-blue-400 focus:ring-blue-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Meter Pricings Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Meter Pricings</h2>
            </div>
            <p className="text-gray-600 text-lg">
              {filteredMeterPricings.length} of {meterPricings.length} meter types
            </p>
          </div>
          <div className="overflow-x-auto">
            {filteredMeterPricings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'No meter pricings found matching your search.' : 'No meter pricings available.'}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-6 font-bold text-gray-900 text-lg">Meter Type</th>
                    <th className="text-left p-6 font-bold text-gray-900 text-lg">Price (ETB)</th>
                    <th className="text-left p-6 font-bold text-gray-900 text-lg">Description</th>
                    <th className="text-left p-6 font-bold text-gray-900 text-lg">Created</th>
                    <th className="text-left p-6 font-bold text-gray-900 text-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeterPricings.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200 border-b border-gray-200`}
                    >
                      <td className="p-6">
                        <div className="font-semibold text-gray-900 text-lg">{item.meterType}</div>
                      </td>
                      <td className="p-6">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 font-semibold text-lg px-4 py-2">
                          ETB {item.price.toLocaleString()}
                        </Badge>
                      </td>
                      <td className="p-6">
                        <div className="text-gray-600 max-w-xs">
                          {item.description || 'No description'}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex space-x-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingItem ? 'Edit Meter Pricing' : 'Add New Meter Pricing'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meter Type *
                </label>
                <Input
                  type="text"
                  value={formData.meterType}
                  onChange={(e) => setFormData({ ...formData, meterType: e.target.value })}
                  placeholder="e.g., Single Phase, Three Phase"
                  className="border-gray-300 bg-white focus:border-blue-400 focus:ring-blue-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (ETB) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="border-gray-300 bg-white focus:border-blue-400 focus:ring-blue-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                  className="border-gray-300 bg-white focus:border-blue-400 focus:ring-blue-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                />
              </div>

              <div className="flex space-x-4 pt-6">
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                >
                  {editingItem ? 'Update' : 'Create'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeModal} 
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeterPricingPage;
