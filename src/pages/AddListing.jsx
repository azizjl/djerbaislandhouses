import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { toast } from 'react-hot-toast'

const AddListing = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    capacity: '', // sqft
    beds: '', // New field
    guests: '', // New field
    type: 'rent',
    // Amenities
    wifi: false,
    tv: false,
    kitchen: false,
    washing_machine: false,
    free_parking: false,
    air_conditioning: '',
    pool: false,
    amenities: [], // We can remove this since we're using individual boolean fields
  })
  
  // Monthly prices state
  const [monthlyPrices, setMonthlyPrices] = useState(
    Array(12).fill().map(() => ({ price_per_day: '' }))
  )

  const [imageFiles, setImageFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)

  // Add preview cleanup
  useEffect(() => {
    // Cleanup function to revoke object URLs to avoid memory leaks
    return () => {
      imageFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview)
      })
    }
  }, [imageFiles])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    // Create preview URLs for the images
    const filesWithPreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    
    setImageFiles(prev => [...prev, ...filesWithPreviews])
  }

  const removeImage = (indexToRemove) => {
    setImageFiles(prev => {
      const newFiles = prev.filter((_, index) => index !== indexToRemove)
      // Revoke the URL of the removed image
      if (prev[indexToRemove]?.preview) {
        URL.revokeObjectURL(prev[indexToRemove].preview)
      }
      return newFiles
    })
  }

  const uploadImages = async (accommodationId) => {
    const uploadPromises = imageFiles.map(async ({ file }) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${accommodationId}/${Math.random()}.${fileExt}`
      const filePath = `properties/${fileName}`

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath)

      return publicUrl
    })

    return Promise.all(uploadPromises)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to add a listing')
      }

      // First, insert the accommodation
      const { data: accommodation, error: accommodationError } = await supabase
        .from('accommodations')
        .insert([{
          name: formData.name,
          location: formData.location,
          description: formData.description,
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          capacity: parseInt(formData.capacity),
          beds: formData.beds,
          guests: parseInt(formData.guests),
          type: formData.type,
          // Individual boolean amenities
          wifi: formData.wifi,
          tv: formData.tv,
          kitchen: formData.kitchen,
          washing_machine: formData.washing_machine,
          free_parking: formData.free_parking,
          air_conditioning: formData.air_conditioning,
          pool: formData.pool,
          user_id: user.id
        }])
        .select()
        .single()

      if (accommodationError) throw accommodationError

      // Insert prices for each month
      const priceInserts = monthlyPrices.map((price, index) => ({
        accommodation_id: accommodation.id,
        month: (index + 1).toString(),
        price_per_day: parseFloat(price.price_per_day)
      })).filter(price => price.price_per_day > 0)

      if (priceInserts.length > 0) {
        const { error: priceError } = await supabase
          .from('prices')
          .insert(priceInserts)

        if (priceError) throw priceError
      }

      // Upload images if any
      if (imageFiles.length > 0) {
        const uploadedUrls = await uploadImages(accommodation.id)
        
        // Insert image records
        const imageRecords = uploadedUrls.map(url => ({
          accommodation_id: accommodation.id,
          url: url
        }))

        const { error: imageDbError } = await supabase
          .from('images')
          .insert(imageRecords)

        if (imageDbError) throw imageDbError
      }

      toast.success('Listing added successfully!')
      navigate(`/houses/${accommodation.id}`)
    } catch (error) {
      console.error('Error adding listing:', error)
      toast.error(error.message || 'Error adding listing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">Add New Listing</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Enter property name"
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
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Enter location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Describe your property"
              />
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="rent">For Rent</option>
                <option value="buy">For Sale</option>
              </select>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
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
                  required
                  min="0"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* New fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Beds
                </label>
                <input
                  type="number"
                  name="beds"
                  value={formData.beds}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Guests
                </label>
                <input
                  type="number"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Square Feet
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['wifi', 'tv', 'kitchen', 'washing_machine', 'free_parking', 'pool'].map((amenity) => (
                  <div key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      id={amenity}
                      name={amenity}
                      checked={formData[amenity]}
                      onChange={handleChange}
                      className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
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
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Add this before the submit button */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Image previews */}
              <div className="grid grid-cols-3 gap-4">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={file.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-400"
            >
              {loading ? 'Adding Listing...' : 'Add Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddListing 