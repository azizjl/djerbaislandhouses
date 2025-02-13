import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { BedOutline, WaterOutline, ExpandOutline, LocationOutline } from 'react-ionicons'

const formatTND = (amount) => {
  return new Intl.NumberFormat('ar-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const Houses = () => {
  const [allProperties, setAllProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    priceRange: '',
    bedrooms: ''
  })

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const { data, error } = await supabase
          .from('accommodations')
          .select(`
            *,
            prices (
              month,
              price_per_day
            ),
            images (
              url
            )
          `)
        
        if (error) throw error
        
        const transformedData = data.map(property => {
          const currentMonth = new Date().getMonth() + 1
          const currentMonthPrice = property.prices?.find(p => 
            parseInt(p.month) === currentMonth
          )?.price_per_day || 0

          return {
            id: property.id,
            title: property.name,
            location: property.location,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            sqft: property.capacity,
            price_per_night: currentMonthPrice,
            image_url: property.images?.[0]?.url || '/default-image.jpg',
            type: property.type
          }
        })
        
        setAllProperties(transformedData)
        setFilteredProperties(transformedData)
      } catch (error) {
        console.error('Error fetching houses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHouses()
  }, [])

  const getUniqueLocations = () => {
    const locations = allProperties.map(property => 
      property.location.split(',')[0].trim()
    )
    return [...new Set(locations)].sort()
  }

  const getPriceRanges = () => {
    if (allProperties.length === 0) return []
    
    const prices = allProperties.map(property => property.price_per_night)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    const range1 = Math.floor(minPrice)
    const range2 = Math.floor((maxPrice - minPrice) / 3 + minPrice)
    const range3 = Math.floor((2 * (maxPrice - minPrice) / 3) + minPrice)
    
    return [
      { label: `${formatTND(range1)} - ${formatTND(range2)}`, value: `${range1}-${range2}` },
      { label: `${formatTND(range2)} - ${formatTND(range3)}`, value: `${range2}-${range3}` },
      { label: `${formatTND(range3)} - ${formatTND(maxPrice)}`, value: `${range3}-${maxPrice}` }
    ]
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetFilters = () => {
    setSearchFilters({
      location: '',
      priceRange: '',
      bedrooms: ''
    })
    setFilteredProperties(allProperties)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    
    let results = [...allProperties]

    if (searchFilters.location) {
      results = results.filter(property => 
        property.location.split(',')[0].trim() === searchFilters.location
      )
    }

    if (searchFilters.priceRange) {
      const [min, max] = searchFilters.priceRange.split('-').map(Number)
      results = results.filter(property =>
        property.price_per_night >= min && property.price_per_night <= max
      )
    }

    if (searchFilters.bedrooms) {
      const minBedrooms = parseInt(searchFilters.bedrooms)
      results = results.filter(property =>
        property.bedrooms >= minBedrooms
      )
    }

    setFilteredProperties(results)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="text-3xl font-light tracking-tight text-[#1B4965]">
                Djerba<span className="font-bold text-[#62B6CB]">Stays</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Section */}
      <div className="bg-gradient-to-b from-[#CAE9FF] to-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-[#1B4965] mb-8">Find Your Perfect Stay</h1>
          
          <form onSubmit={handleSearchSubmit} className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <select
                  name="location"
                  value={searchFilters.location}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#62B6CB] focus:ring-2 focus:ring-[#62B6CB]/20 transition-all"
                >
                  <option value="">Any Location</option>
                  {getUniqueLocations().map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <select
                  name="priceRange"
                  value={searchFilters.priceRange}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#62B6CB] focus:ring-2 focus:ring-[#62B6CB]/20 transition-all"
                >
                  <option value="">Any Price</option>
                  {getPriceRanges().map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <select
                  name="bedrooms"
                  value={searchFilters.bedrooms}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#62B6CB] focus:ring-2 focus:ring-[#62B6CB]/20 transition-all"
                >
                  <option value="">Any Bedrooms</option>
                  <option value="1">1+ Bedrooms</option>
                  <option value="2">2+ Bedrooms</option>
                  <option value="3">3+ Bedrooms</option>
                  <option value="4">4+ Bedrooms</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="p-3 text-[#1B4965] hover:text-[#62B6CB] rounded-lg transition-colors duration-300 flex items-center justify-center"
                  aria-label="Reset filters"
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((house) => (
            <Link 
              key={house.id} 
              to={`/houses/${house.id}`}
              className="group bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={house.image_url} 
                  alt={house.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <div className="px-3 py-1 bg-[#1B4965] text-white text-sm rounded-full">
                    {house.type === 'rent' ? 'FOR RENT' : 'FOR SALE'}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#1B4965] mb-2">{house.title}</h3>
                    <p className="text-gray-600 text-sm flex items-center">
                      <LocationOutline
                        color={'#62B6CB'} 
                        height="16px"
                        width="16px"
                        className="mr-1"
                      />
                      {house.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#1B4965]">{formatTND(house.price_per_night)}</div>
                    <div className="text-sm text-[#62B6CB]">per night</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex space-x-4">
                    <span className="flex items-center text-gray-600 text-sm">
                      <BedOutline color={'#62B6CB'} height="16px" width="16px" className="mr-1"/>
                      {house.bedrooms}
                    </span>
                    <span className="flex items-center text-gray-600 text-sm">
                      <WaterOutline color={'#62B6CB'} height="16px" width="16px" className="mr-1"/>
                      {house.bathrooms}
                    </span>
                    <span className="flex items-center text-gray-600 text-sm">
                      <ExpandOutline color={'#62B6CB'} height="16px" width="16px" className="mr-1"/>
                      {house.sqft} m²
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Houses 