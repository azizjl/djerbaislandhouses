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

  // Modify the initial formData state to include the new beds structure
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    capacity: '',
    beds: {
      double_beds: 0,
      normal_beds: 0
    },
    guests: '',
    type: '',
    map_location_url: '',
    on_service: false,
    prices: initialPrices,
    images: [],

    // Basic Amenities
    wifi: false,
    air_conditioning: false,
    heating: false,
    free_parking: false,
    equipped_kitchen: false,
    tv: false,
    washer_dryer: false,
    
    // Comfort Amenities
    pool: false,
    jacuzzi: false,
    terrace_balcony: false,
    private_garden: false,
    fireplace: false,
    gym: false,
    sea_view: false,
    
    // Additional Services
    daily_cleaning: false,
    concierge_service: false,
    breakfast_included: false,
    airport_transfer: false,
    vehicle_rental: false,
    
    // Security
    security_cameras: false,
    security_24_7: false,
    smoke_detectors: false,
    safe_box: false,
    
    // Family Amenities
    baby_crib: false,
    high_chair: false,
    kids_games: false,
    bbq: false,
    playground: false,
    
    // Accessibility
    wheelchair_access: false,
    elevator: false,
    ground_floor: false,
    adapted_bathroom: false,
    
    // Activities & Recreation
    game_room: false,
    tennis_court: false,
    private_beach_access: false,
    sports_equipment: false,
    
    // Eco-Friendly
    solar_panels: false,
    recycling_system: false,
    organic_toiletries: false,
    vegetable_garden: false,
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
          on_service: data.on_service || false,
          description: data.description || '',
          bedrooms: data.bedrooms || '',
          bathrooms: data.bathrooms || '',
          capacity: data.capacity || '',
          beds: data.beds || { double_beds: 0, normal_beds: 0 },
          guests: data.guests || '',
          type: data.type || '',
          map_location_url: data.map_location_url || '',
          prices: pricesArray,
          images: data.images || [],

          // Basic Amenities
          wifi: data.wifi || false,
          air_conditioning: data.air_conditioning || false,
          heating: data.heating || false,
          free_parking: data.free_parking || false,
          equipped_kitchen: data.equipped_kitchen || false,
          tv: data.tv || false,
          washer_dryer: data.washer_dryer || false,
          
          // Comfort Amenities
          pool: data.pool || false,
          jacuzzi: data.jacuzzi || false,
          terrace_balcony: data.terrace_balcony || false,
          private_garden: data.private_garden || false,
          fireplace: data.fireplace || false,
          gym: data.gym || false,
          sea_view: data.sea_view || false,
          
          // Additional Services
          daily_cleaning: data.daily_cleaning || false,
          concierge_service: data.concierge_service || false,
          breakfast_included: data.breakfast_included || false,
          airport_transfer: data.airport_transfer || false,
          vehicle_rental: data.vehicle_rental || false,
          
          // Security
          security_cameras: data.security_cameras || false,
          security_24_7: data.security_24_7 || false,
          smoke_detectors: data.smoke_detectors || false,
          safe_box: data.safe_box || false,
          
          // Family Amenities
          baby_crib: data.baby_crib || false,
          high_chair: data.high_chair || false,
          kids_games: data.kids_games || false,
          bbq: data.bbq || false,
          playground: data.playground || false,
          
          // Accessibility
          wheelchair_access: data.wheelchair_access || false,
          elevator: data.elevator || false,
          ground_floor: data.ground_floor || false,
          adapted_bathroom: data.adapted_bathroom || false,
          
          // Activities & Recreation
          game_room: data.game_room || false,
          tennis_court: data.tennis_court || false,
          private_beach_access: data.private_beach_access || false,
          sports_equipment: data.sports_equipment || false,
          
          // Eco-Friendly
          solar_panels: data.solar_panels || false,
          recycling_system: data.recycling_system || false,
          organic_toiletries: data.organic_toiletries || false,
          vegetable_garden: data.vegetable_garden || false,
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

  const handleBedChange = (bedType, value) => {
    setFormData(prev => ({
      ...prev,
      beds: {
        ...prev.beds,
        [bedType]: parseInt(value) || 0
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error: accommodationError } = await supabase
        .from('accommodations')
        .update({
          name: formData.name,
          location: formData.location,
          on_service: formData.on_service,
          description: formData.description,
          map_location_url: formData.map_location_url,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          capacity: formData.capacity,
          beds: formData.beds,
          guests: formData.guests,
          type: formData.type,

          // Basic Amenities
          wifi: formData.wifi,
          air_conditioning: formData.air_conditioning,
          heating: formData.heating,
          free_parking: formData.free_parking,
          equipped_kitchen: formData.equipped_kitchen,
          tv: formData.tv,
          washer_dryer: formData.washer_dryer,
          
          // Comfort Amenities
          pool: formData.pool,
          jacuzzi: formData.jacuzzi,
          terrace_balcony: formData.terrace_balcony,
          private_garden: formData.private_garden,
          fireplace: formData.fireplace,
          gym: formData.gym,
          sea_view: formData.sea_view,
          
          // Additional Services
          daily_cleaning: formData.daily_cleaning,
          concierge_service: formData.concierge_service,
          breakfast_included: formData.breakfast_included,
          airport_transfer: formData.airport_transfer,
          vehicle_rental: formData.vehicle_rental,
          
          // Security
          security_cameras: formData.security_cameras,
          security_24_7: formData.security_24_7,
          smoke_detectors: formData.smoke_detectors,
          safe_box: formData.safe_box,
          
          // Family Amenities
          baby_crib: formData.baby_crib,
          high_chair: formData.high_chair,
          kids_games: formData.kids_games,
          bbq: formData.bbq,
          playground: formData.playground,
          
          // Accessibility
          wheelchair_access: formData.wheelchair_access,
          elevator: formData.elevator,
          ground_floor: formData.ground_floor,
          adapted_bathroom: formData.adapted_bathroom,
          
          // Activities & Recreation
          game_room: formData.game_room,
          tennis_court: formData.tennis_court,
          private_beach_access: formData.private_beach_access,
          sports_equipment: formData.sports_equipment,
          
          // Eco-Friendly
          solar_panels: formData.solar_panels,
          recycling_system: formData.recycling_system,
          organic_toiletries: formData.organic_toiletries,
          vegetable_garden: formData.vegetable_garden,
        })
        .eq('id', id)

      if (accommodationError) throw accommodationError

      // First, delete existing prices for this accommodation
      const { error: deleteError } = await supabase
        .from('prices')
        .delete()
        .eq('accommodation_id', id)

      if (deleteError) throw deleteError

      // Then insert new prices
      const priceUpdates = formData.prices.map((price, index) => ({
        accommodation_id: id,
        month: (index + 1).toString(),
        price_per_day: price.price_per_day || 0 // Ensure we have a number value
      }))

      const { error: pricesError } = await supabase
        .from('prices')
        .insert(priceUpdates)

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
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-[#1B4965] hover:text-[#62B6CB] transition-colors"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
        </div>

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
                  Map Location URL
                </label>
                <input
                  type="url"
                  name="map_location_url"
                  value={formData.map_location_url}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                  placeholder="Enter Google Maps URL"
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

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Beds Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Double Beds
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.beds.double_beds}
                      onChange={(e) => handleBedChange('double_beds', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Normal Beds
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.beds.normal_beds}
                      onChange={(e) => handleBedChange('normal_beds', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                    />
                  </div>
                </div>
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
              
              {/* Basic Amenities */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-600 mb-2">Basic Amenities</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    'wifi',
                    'air_conditioning',
                    'heating',
                    'free_parking',
                    'equipped_kitchen',
                    'tv',
                    'washer_dryer'
                  ].map((amenity) => (
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
                        {amenity.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comfort Amenities */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-600 mb-2">Comfort Amenities</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: 'pool', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z"/> },
                    { name: 'jacuzzi', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/> },
                    { name: 'terrace_balcony', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/> },
                    { name: 'private_garden', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/> },
                    { name: 'fireplace', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/> },
                    { name: 'gym', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/> },
                    { name: 'sea_view', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/> }
                  ].map(({ name, icon }) => (
                    <div key={name} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-[#62B6CB] transition-colors">
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={formData[name]}
                        onChange={handleChange}
                        className="h-4 w-4 text-[#62B6CB] focus:ring-[#62B6CB] border-gray-300 rounded"
                      />
                      <svg className="w-5 h-5 text-[#62B6CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                      </svg>
                      <label htmlFor={name} className="text-sm text-gray-700 capitalize">
                        {name.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Services */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-600 mb-2">Additional Services</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: 'daily_cleaning', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/> },
                    { name: 'concierge_service', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/> },
                    { name: 'breakfast_included', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/> },
                    { name: 'airport_transfer', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/> },
                    { name: 'vehicle_rental', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16v-4m4 4v-8m4 8V8"/> }
                  ].map(({ name, icon }) => (
                    <div key={name} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-[#62B6CB] transition-colors">
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={formData[name]}
                        onChange={handleChange}
                        className="h-4 w-4 text-[#62B6CB] focus:ring-[#62B6CB] border-gray-300 rounded"
                      />
                      <svg className="w-5 h-5 text-[#62B6CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                      </svg>
                      <label htmlFor={name} className="text-sm text-gray-700 capitalize">
                        {name.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Features */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-600 mb-2">Security Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: 'security_cameras', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/> },
                    { name: 'security_24_7', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/> },
                    { name: 'smoke_detectors', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/> },
                    { name: 'safe_box', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/> }
                  ].map(({ name, icon }) => (
                    <div key={name} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-[#62B6CB] transition-colors">
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={formData[name]}
                        onChange={handleChange}
                        className="h-4 w-4 text-[#62B6CB] focus:ring-[#62B6CB] border-gray-300 rounded"
                      />
                      <svg className="w-5 h-5 text-[#62B6CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                      </svg>
                      <label htmlFor={name} className="text-sm text-gray-700 capitalize">
                        {name.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Family Amenities */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-600 mb-2">Family Amenities</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: 'baby_crib', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/> },
                    { name: 'high_chair', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/> },
                    { name: 'kids_games', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/> },
                    { name: 'bbq', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/> },
                    { name: 'playground', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/> }
                  ].map(({ name, icon }) => (
                    <div key={name} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-[#62B6CB] transition-colors">
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={formData[name]}
                        onChange={handleChange}
                        className="h-4 w-4 text-[#62B6CB] focus:ring-[#62B6CB] border-gray-300 rounded"
                      />
                      <svg className="w-5 h-5 text-[#62B6CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                      </svg>
                      <label htmlFor={name} className="text-sm text-gray-700 capitalize">
                        {name.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accessibility Features */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-600 mb-2">Accessibility Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: 'wheelchair_access', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/> },
                    { name: 'elevator', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/> },
                    { name: 'ground_floor', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/> },
                    { name: 'adapted_bathroom', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/> }
                  ].map(({ name, icon }) => (
                    <div key={name} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-[#62B6CB] transition-colors">
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={formData[name]}
                        onChange={handleChange}
                        className="h-4 w-4 text-[#62B6CB] focus:ring-[#62B6CB] border-gray-300 rounded"
                      />
                      <svg className="w-5 h-5 text-[#62B6CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                      </svg>
                      <label htmlFor={name} className="text-sm text-gray-700 capitalize">
                        {name.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eco-Friendly Features */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-600 mb-2">Eco-Friendly Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: 'solar_panels', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/> },
                    { name: 'recycling_system', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/> },
                    { name: 'organic_toiletries', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/> },
                    { name: 'vegetable_garden', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/> }
                  ].map(({ name, icon }) => (
                    <div key={name} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-[#62B6CB] transition-colors">
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={formData[name]}
                        onChange={handleChange}
                        className="h-4 w-4 text-[#62B6CB] focus:ring-[#62B6CB] border-gray-300 rounded"
                      />
                      <svg className="w-5 h-5 text-[#62B6CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                      </svg>
                      <label htmlFor={name} className="text-sm text-gray-700 capitalize">
                        {name.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
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