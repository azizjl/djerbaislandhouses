import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { toast } from 'react-hot-toast'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableImage = ({ file, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="relative group cursor-move"
      >
        <img
          src={file.preview}
          alt={`Preview ${index + 1}`}
          className="w-full h-32 object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <svg 
            className="w-6 h-6 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 8h16M4 16h16" 
            />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
        {index === 0 && (
          <span className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
            Cover Photo
          </span>
        )}
      </div>
    </div>
  );
};

const AddListing = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    map_location_url: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    capacity: '',
    beds: {
      double_beds: 0,
      normal_beds: 0
    },
    guests: '',
    type: 'rent',
    property_category: 'house',
    floor_number: '',
    house_number: '',
    // Basic Amenities
    wifi: false,
    air_conditioning: '',
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
  
  // Monthly prices state
  const [prices, setPrices] = useState(Array(12).fill({ price_per_day: '' }));

  const [imageFiles, setImageFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)

  // Add new state for steps
  const [currentStep, setCurrentStep] = useState(1)
  
  const steps = [
    { number: 1, title: 'Basic Information' },
    { number: 2, title: 'Property Details' },
    { number: 3, title: 'Amenities' },
    { number: 4, title: 'Images' },
    { number: 5, title: 'Pricing' }
  ]

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
    const filesWithPreviews = files.map((file, index) => ({
      id: `draggable-${imageFiles.length + index}`,
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
      // Update IDs to maintain consistency
      return newFiles.map((file, index) => ({
        ...file,
        id: `draggable-${index}`
      }))
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to add a listing')
      }

      // First, insert the accommodation with all amenities
      const { data: accommodation, error: accommodationError } = await supabase
        .from('accommodations')
        .insert([{
          name: formData.name,
          location: formData.location,
          map_location_url: formData.map_location_url,
          description: formData.description,
          property_category: formData.property_category,
          floor_number: formData.property_category === 'apartment' ? parseInt(formData.floor_number) : null,
          house_number: formData.property_category === 'apartment' ? formData.house_number : null,
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          capacity: parseInt(formData.capacity),
          beds: formData.beds,
          guests: parseInt(formData.guests),
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
          
          user_id: user.id
        }])
        .select()
        .single()

      if (accommodationError) throw accommodationError

      // Then insert the prices for each month
      const pricesData = months.map((month, index) => ({
        accommodation_id: accommodation.id,
        month: (index + 1).toString(),
        price_per_day: parseFloat(prices[index].price_per_day)
      }));

      const { error: pricesError } = await supabase
        .from('prices')
        .insert(pricesData);

      if (pricesError) throw pricesError;

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

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setImageFiles((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-orange-500 transition-colors"
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

        <h1 className="text-3xl font-bold mb-8">Add New Listing</h1>

        {/* Add step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between w-full mb-4">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step.number ? 'bg-orange-500 text-white' : 'bg-gray-200'
                }`}>
                  {step.number}
                </div>
                <span className="text-xs mt-1">{step.title}</span>
              </div>
            ))}
          </div>
          <div className="relative w-full h-2 bg-gray-200 rounded">
            <div 
              className="absolute h-full bg-orange-500 rounded transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Category
                    </label>
                    <select
                      name="property_category"
                      value={formData.property_category}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                    </select>
                  </div>

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
                </div>

                {/* Add apartment-specific fields */}
                {formData.property_category === 'apartment' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Floor Number
                      </label>
                      <input
                        type="number"
                        name="floor_number"
                        value={formData.floor_number}
                        onChange={handleChange}
                        required
                        min="0"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter floor number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        House Number
                      </label>
                      <input
                        type="text"
                        name="house_number"
                        value={formData.house_number}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter house number"
                      />
                    </div>
                  </div>
                )}

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
                    Map Location URL
                  </label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      name="map_location_url"
                      value={formData.map_location_url}
                      onChange={handleChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter Google Maps URL"
                    />
                    <p className="text-sm text-gray-500">
                      Paste a Google Maps link to your property location (e.g., https://maps.google.com/...)
                    </p>
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
                    required
                    rows={4}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Describe your property"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Property Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Property Details</h2>
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
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
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
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
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
              </div>
            )}

            {/* Step 3: Amenities */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                {/* Amenities sections */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  
                  {/* Basic Amenities */}
                  <h3 className="font-medium text-gray-700 mt-4 mb-2">Basic Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['wifi', 'heating', 'free_parking', 'equipped_kitchen', 'tv', 'washer_dryer'].map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={amenity}
                          name={amenity}
                          checked={formData[amenity]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [amenity]: e.target.checked }))}
                          className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor={amenity} className="ml-2 text-sm text-gray-700 capitalize">
                          {amenity.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Air Conditioning (special case as it's a text input) */}
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

                  {/* Comfort Amenities */}
                  <h3 className="font-medium text-gray-700 mt-4 mb-2">Comfort Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['pool', 'jacuzzi', 'terrace_balcony', 'private_garden', 'fireplace', 'gym', 'sea_view'].map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={amenity}
                          name={amenity}
                          checked={formData[amenity]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [amenity]: e.target.checked }))}
                          className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor={amenity} className="ml-2 text-sm text-gray-700 capitalize">
                          {amenity.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Additional Services */}
                  <h3 className="font-medium text-gray-700 mt-4 mb-2">Additional Services</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['daily_cleaning', 'concierge_service', 'breakfast_included', 'airport_transfer', 'vehicle_rental'].map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={amenity}
                          name={amenity}
                          checked={formData[amenity]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [amenity]: e.target.checked }))}
                          className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor={amenity} className="ml-2 text-sm text-gray-700 capitalize">
                          {amenity.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Security */}
                  <h3 className="font-medium text-gray-700 mt-4 mb-2">Security</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['security_cameras', 'security_24_7', 'smoke_detectors', 'safe_box'].map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={amenity}
                          name={amenity}
                          checked={formData[amenity]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [amenity]: e.target.checked }))}
                          className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor={amenity} className="ml-2 text-sm text-gray-700 capitalize">
                          {amenity.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Family Amenities */}
                  <h3 className="font-medium text-gray-700 mt-4 mb-2">Family Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['baby_crib', 'high_chair', 'kids_games', 'bbq', 'playground'].map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={amenity}
                          name={amenity}
                          checked={formData[amenity]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [amenity]: e.target.checked }))}
                          className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor={amenity} className="ml-2 text-sm text-gray-700 capitalize">
                          {amenity.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Accessibility */}
                  <h3 className="font-medium text-gray-700 mt-4 mb-2">Accessibility</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['wheelchair_access', 'elevator', 'ground_floor', 'adapted_bathroom'].map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={amenity}
                          name={amenity}
                          checked={formData[amenity]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [amenity]: e.target.checked }))}
                          className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor={amenity} className="ml-2 text-sm text-gray-700 capitalize">
                          {amenity.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Activities & Recreation */}
                  <h3 className="font-medium text-gray-700 mt-4 mb-2">Activities & Recreation</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['game_room', 'tennis_court', 'private_beach_access', 'sports_equipment'].map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={amenity}
                          name={amenity}
                          checked={formData[amenity]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [amenity]: e.target.checked }))}
                          className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor={amenity} className="ml-2 text-sm text-gray-700 capitalize">
                          {amenity.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Eco-Friendly */}
                  <h3 className="font-medium text-gray-700 mt-4 mb-2">Eco-Friendly</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['solar_panels', 'recycling_system', 'organic_toiletries', 'vegetable_garden'].map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={amenity}
                          name={amenity}
                          checked={formData[amenity]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [amenity]: e.target.checked }))}
                          className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor={amenity} className="ml-2 text-sm text-gray-700 capitalize">
                          {amenity.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Property Images</h2>
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

                {imageFiles.length > 0 && (
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={imageFiles.map(file => file.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      <div className="grid grid-cols-3 gap-4">
                        {imageFiles.map((file, index) => (
                          <SortableImage
                            key={file.id}
                            file={file}
                            index={index}
                            onRemove={removeImage}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {imageFiles.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Drag and drop to reorder images. The first image will be the cover photo.
                  </p>
                )}
              </div>
            )}

            {/* Step 5: Pricing */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Monthly Pricing</h2>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#1B4965] mb-4">Monthly Prices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {months.map((month, index) => (
                      <div key={month} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {month}
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">TND</span>
                          </div>
                          <input
                            type="number"
                            value={prices[index].price_per_day}
                            onChange={(e) => {
                              const newPrices = [...prices];
                              newPrices[index] = { price_per_day: e.target.value };
                              setPrices(newPrices);
                            }}
                            className="block w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#1B4965] focus:border-[#1B4965]"
                            placeholder="0"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Previous
                </button>
              )}
              
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 ml-auto"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 ml-auto disabled:bg-gray-400"
                >
                  {loading ? 'Adding Listing...' : 'Submit Listing'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddListing 