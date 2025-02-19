import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { BedOutline, WaterOutline, ExpandOutline, LocationOutline } from 'react-ionicons'
import useAuthStore  from '../stores/authStore'
import "../App.css"

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
  const [searchParams] = useSearchParams()
  const [searchFilters, setSearchFilters] = useState({
    location: searchParams.get('location') || '',
    priceRange: searchParams.get('priceRange') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || ''
  })
  const [currencies, setCurrencies] = useState([])
  const [selectedCurrency, setSelectedCurrency] = useState(
    localStorage.getItem('selectedCurrency') || 'TND'
  )
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const { role } = useAuthStore()
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('currencies, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
        
        if (error) {
          console.error('Error fetching currencies:', error)
          return
        }
        
        if (data?.currencies && data.currencies.length > 0) {
          setCurrencies(data.currencies)
          setLastUpdated(data.updated_at)
        }
      } catch (error) {
        console.error('Error fetching currencies:', error)
      }
    }

    fetchCurrencies()
  }, [])

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value
    setSelectedCurrency(newCurrency)
    localStorage.setItem('selectedCurrency', newCurrency)
  }

  const formatPrice = (priceInTND) => {
    if (!priceInTND) return '0 TND'
    
    const currency = currencies.find(c => c.code === selectedCurrency)
    if (!currency) return `${priceInTND} TND`
    
    const convertedPrice = priceInTND * currency.rate
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(convertedPrice)
  }

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
          .eq('on_service', true)
        
        if (error) throw error
        
        const transformedData = data.map(property => ({
          id: property.id,
          title: property.name,
          location: property.location,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          sqft: property.capacity,
          price_per_night: property.prices?.find(p => 
            parseInt(p.month) === new Date().getMonth() + 1
          )?.price_per_day || 0,
          image_url: property.images?.[0]?.url || '/default-image.jpg',
          type: property.type,
          on_service: property.on_service
        }))
        
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

  useEffect(() => {
    if (allProperties.length > 0 && 
        (searchParams.get('location') || 
         searchParams.get('priceRange') || 
         searchParams.get('bedrooms') || 
         searchParams.get('startDate') || 
         searchParams.get('endDate'))) {
      handleSearchSubmit(new Event('submit'))
    }
  }, [allProperties])

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
      bedrooms: '',
      startDate: '',
      endDate: ''
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

    if (searchFilters.startDate && searchFilters.endDate) {
      results = results.filter(property =>
        isPropertyAvailable(property.id, searchFilters.startDate, searchFilters.endDate)
      )
    }

    setFilteredProperties(results)
  }

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
        
        if (error) throw error;
        setBookings(data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  const isPropertyAvailable = (propertyId, startDate, endDate) => {
    if (!startDate || !endDate) return true;

    const start = new Date(startDate);
    const end = new Date(endDate);

    return !bookings.some(booking => {
      if (booking.accommodation_id !== propertyId) return false;
      
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      
      return (
        (start <= bookingEnd && start >= bookingStart) ||
        (end <= bookingEnd && end >= bookingStart) ||
        (start <= bookingStart && end >= bookingEnd)
      );
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Updated Navigation */}
      <nav className={`fixed w-full top-0 z-50 transition-colors duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-white/90 backdrop-blur-md shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="text-3xl font-light tracking-tight text-[#1B4965]">
                DjerbaIsland<span className="font-bold text-[#62B6CB]">Houses</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="flex items-center text-[#1B4965] hover:text-[#62B6CB] transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Home
              </Link>
              {/* <Link to="/houses" className="flex items-center text-[#1B4965] hover:text-[#62B6CB] transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                Properties
              </Link> */}
              
              {/* Currency Selector */}
              <div className="flex flex-col">
                <div className="relative">
                  <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#1B4965]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <select
                    value={selectedCurrency}
                    onChange={handleCurrencyChange}
                    className="pl-9 pr-3 py-1.5 rounded-lg border text-[#1B4965] border-[#1B4965] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#62B6CB]"
                  >
                    {currencies.map(currency => (
                      <option 
                        key={currency.code} 
                        value={currency.code}
                        className="text-[#1B4965] bg-white"
                      >
                        {currency.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Updated Search Section */}
      <div className="bg-gradient-to-b from-[#CAE9FF] to-white py-12 pt-30">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-[#1B4965] mb-8">Find Your Perfect Stay</h1>
          
          <form onSubmit={handleSearchSubmit} className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Location Select */}
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

              {/* Price Range Select */}
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

              {/* Bedrooms Select */}
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

              {/* Start Date Input */}
              <div className="relative">
                <input
                  type="date"
                  name="startDate"
                  value={searchFilters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#62B6CB] focus:ring-2 focus:ring-[#62B6CB]/20 transition-all"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* End Date Input */}
              <div className="relative">
                <input
                  type="date"
                  name="endDate"
                  value={searchFilters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#62B6CB] focus:ring-2 focus:ring-[#62B6CB]/20 transition-all"
                  min={searchFilters.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Search and Reset Buttons */}
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
                    <div className="text-lg font-bold text-[#1B4965]">{formatPrice(house.price_per_night)}</div>
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