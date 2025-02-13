import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { toast } from 'react-hot-toast'
import useAuthStore from '../stores/authStore'

const EditListing = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Initialize prices array with 12 months
  const initialPrices = Array(12).fill().map(() => ({ price_per_day: '' }))

  // Add images state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    capacity: '',
    beds: '',
    guests: '',
    type: '',
    // Amenities
    wifi: false,
    tv: false,
    kitchen: false,
    washing_machine: false,
    free_parking: false,
    air_conditioning: '',
    pool: false,
    // Initialize prices with empty array
    prices: initialPrices,
    // Add images array
    images: []
  })

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/')
      return
    }

    const fetchListing = async () => {
      try {
        const { data, error } = await supabase
          .from('accommodations')
          .select(`
            *,
            prices (
              id,
              month,
              price_per_day
            ),
            images (
              id,
              url
            )
          `)
          .eq('id', id)
          .single()

        if (error) throw error

        // Create a new array with 12 months and fill with existing prices
        const pricesArray = Array(12).fill().map((_, index) => {
          const existingPrice = data.prices?.find(p => p.month === (index + 1).toString())
          return existingPrice || { price_per_day: '' }
        })

        setFormData({
          name: data.name || '',
          location: data.location || '',
          description: data.description || '',
          bedrooms: data.bedrooms || '',
          bathrooms: data.bathrooms || '',
          capacity: data.capacity || '',
          beds: data.beds || '',
          guests: data.guests || '',
          type: data.type || '',
          // Amenities
          wifi: data.wifi || false,
          tv: data.tv || false,
          kitchen: data.kitchen || false,
          washing_machine: data.washing_machine || false,
          free_parking: data.free_parking || false,
          air_conditioning: data.air_conditioning || '',
          pool: data.pool || false,
          // Prices
          prices: pricesArray,
          // Images
          images: data.images || []
        })
      } catch (error) {
        console.error('Error fetching listing:', error)
        toast.error('Failed to load listing data')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [id, role, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handlePriceChange = (month, value) => {
    setFormData(prev => ({
      ...prev,
      prices: prev.prices.map((price, index) => 
        index === month ? { ...price, price_per_day: value } : price
      )
    }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    
    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath)

        // Insert into images table
        const { error: insertError } = await supabase
          .from('images')
          .insert({
            accommodation_id: id,
            url: publicUrl
          })

        if (insertError) throw insertError

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, { url: publicUrl }]
        }))

        toast.success('Image uploaded successfully')
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error('Failed to upload image')
      }
    }
  }

  const handleRemoveImage = async (imageUrl) => {
    try {
      // Delete from images table
      const { error: deleteDbError } = await supabase
        .from('images')
        .delete()
        .eq('url', imageUrl)

      if (deleteDbError) throw deleteDbError

      // Extract file path from URL
      const urlParts = imageUrl.split('property-images/')
      const filePath = urlParts[1]

      // Delete from storage
      const { error: deleteStorageError } = await supabase.storage
        .from('property-images')
        .remove([filePath])

      if (deleteStorageError) throw deleteStorageError

      // Update state
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img.url !== imageUrl)
      }))

      toast.success('Image removed successfully')
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error('Failed to remove image')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update accommodation details
      const { error: accommodationError } = await supabase
        .from('accommodations')
        .update({
          name: formData.name,
          location: formData.location,
          description: formData.description,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          capacity: formData.capacity,
          beds: formData.beds,
          guests: formData.guests,
          type: formData.type,
          wifi: formData.wifi,
          tv: formData.tv,
          kitchen: formData.kitchen,
          washing_machine: formData.washing_machine,
          free_parking: formData.free_parking,
          air_conditioning: formData.air_conditioning,
          pool: formData.pool,
        //   updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (accommodationError) throw accommodationError

      // Update prices for each month
      const priceUpdates = formData.prices.map((price, index) => ({
        accommodation_id: id,
        month: (index + 1).toString(),
        price_per_day: price.price_per_day
      }))

      const { error: pricesError } = await supabase
        .from('prices')
        .upsert(priceUpdates)

      if (pricesError) throw pricesError

      toast.success('Listing updated successfully')
      navigate('/dashboard')
    } catch (error) {
      console.error('Error updating listing:', error)
      toast.error('Failed to update listing')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - Same as Dashboard.jsx */}
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        {/* ... Copy the navigation code from Dashboard.jsx ... */}
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-bold text-[#1B4965] mb-6">Edit Listing</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bathrooms
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (m²)
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beds
                </label>
                <input
                  type="text"
                  name="beds"
                  value={formData.beds}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guests
                </label>
                <input
                  type="number"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                  required
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['wifi', 'tv', 'kitchen', 'washing_machine', 'free_parking', 'pool'].map((amenity) => (
                  <div key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      id={amenity}
                      name={amenity}
                      checked={formData[amenity]}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#62B6CB] focus:ring-[#62B6CB] border-gray-300 rounded"
                    />
                    <label htmlFor={amenity} className="ml-2 text-sm text-gray-700 capitalize">
                      {amenity.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Air Conditioning
                </label>
                <input
                  type="text"
                  name="air_conditioning"
                  value={formData.air_conditioning}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Monthly Prices</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.prices.map((price, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {new Date(2024, index).toLocaleString('default', { month: 'long' })}
                    </label>
                    <input
                      type="number"
                      value={price.price_per_day}
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
              />
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Property ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.url)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditListing 