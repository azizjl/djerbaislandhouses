import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { BedOutline, WaterOutline, ExpandOutline } from 'react-ionicons'
import useAuthStore from '../stores/authStore'

const Home = () => {
  const navigate = useNavigate()
  const { role } = useAuthStore()
  // Separate state for original and filtered properties
  const [allProperties, setAllProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    priceRange: '',
    bedrooms: ''
  })

  // Update the fetch properties useEffect
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('accommodations')
          .select(`
            *,
            prices (
              price_per_day
            ),
            images (
              url
            )
          `)
          .limit(6)
        
        if (error) throw error
        
        const transformedData = data.map(property => ({
          id: property.id,
          title: property.name,
          location: property.location,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          sqft: property.capacity,
          price_per_night: property.prices?.[0]?.price_per_day || 0,
          image_url: property.images?.[0]?.url || ''
        }))
        
        setAllProperties(transformedData)
        setFilteredProperties(transformedData) // Initialize filtered properties with all properties
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  // Add auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Get unique locations from all properties
  const getUniqueLocations = () => {
    const locations = allProperties.map(property => 
      property.location.split(',')[0].trim()
    )
    return [...new Set(locations)].sort()
  }

  // Get price ranges from all properties
  const getPriceRanges = () => {
    if (allProperties.length === 0) return []
    
    const prices = allProperties.map(property => property.price_per_night)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    const range1 = Math.floor(minPrice)
    const range2 = Math.floor((maxPrice - minPrice) / 3 + minPrice)
    const range3 = Math.floor((2 * (maxPrice - minPrice) / 3) + minPrice)
    
    return [
      { label: `$${range1} - $${range2}`, value: `${range1}-${range2}` },
      { label: `$${range2} - $${range3}`, value: `${range2}-${range3}` },
      { label: `$${range3} - $${maxPrice}`, value: `${range3}-${maxPrice}` }
    ]
  }

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Reset filters
  const resetFilters = () => {
    setSearchFilters({
      location: '',
      priceRange: '',
      bedrooms: ''
    })
    setFilteredProperties(allProperties)
  }

  // Handle search submit with fixed logic
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    
    let results = [...allProperties] // Start with all properties

    // Apply location filter if selected
    if (searchFilters.location) {
      results = results.filter(property => 
        property.location.split(',')[0].trim() === searchFilters.location
      )
    }

    // Apply price range filter if selected
    if (searchFilters.priceRange) {
      const [min, max] = searchFilters.priceRange.split('-').map(Number)
      results = results.filter(property =>
        property.price_per_night >= min && property.price_per_night <= max
      )
    }

    // Apply bedrooms filter if selected
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  // Group properties by location for the locations section
  const locationCounts = allProperties.reduce((acc, property) => {
    const location = property.location.split(',')[0].trim()
    acc[location] = (acc[location] || 0) + 1
    return acc
  }, {})

  const popularLocations = Object.entries(locationCounts)
    .map(([name, count]) => ({
      name,
      properties: count,
      image: `/images/${name.toLowerCase().replace(' ', '')}.jpg` // You'll need to handle images
    }))
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
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
              <Link to="/houses" className="flex items-center text-[#1B4965] hover:text-[#62B6CB] transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                Properties
              </Link>
              <Link to="/contact" className="flex items-center text-[#1B4965] hover:text-[#62B6CB] transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Contact
              </Link>
              {role === 'admin' && (
                <Link to="/dashboard" className="flex items-center text-[#1B4965] hover:text-[#62B6CB] transition-colors">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </Link>
              )}
              {user && (
                <Link to="/bookings" className="flex items-center text-[#1B4965] hover:text-[#62B6CB] transition-colors">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  My Bookings
                </Link>
              )}
              {user ? (
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut()
                    navigate('/auth')
                  }} 
                  className="px-6 py-2.5 text-white bg-[#1B4965] rounded-full hover:bg-[#62B6CB] transition-colors duration-300 flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Sign Out
                </button>
              ) : (
                <Link 
                  to="/auth" 
                  className="px-6 py-2.5 text-white bg-[#1B4965] rounded-full hover:bg-[#62B6CB] transition-colors duration-300 flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  </svg>
                  Login
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-[#1B4965] hover:text-[#62B6CB] focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`${
            isMenuOpen ? 'block' : 'hidden'
          } md:hidden bg-white border-t border-gray-100`}
        >
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-[#1B4965] hover:text-[#62B6CB] hover:bg-gray-50"
            >
              Home
            </Link>
            <Link
              to="/houses"
              className="block px-3 py-2 rounded-md text-base font-medium text-[#1B4965] hover:text-[#62B6CB] hover:bg-gray-50"
            >
              Properties
            </Link>
            <Link
              to="/contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-[#1B4965] hover:text-[#62B6CB] hover:bg-gray-50"
            >
              Contact
            </Link>
            {role === 'admin' && (
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-[#1B4965] hover:text-[#62B6CB] hover:bg-gray-50"
              >
                Dashboard
              </Link>
            )}
            {user && (
              <Link
                to="/bookings"
                className="block px-3 py-2 rounded-md text-base font-medium text-[#1B4965] hover:text-[#62B6CB] hover:bg-gray-50"
              >
                My Bookings
              </Link>
            )}
            {user ? (
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  navigate('/auth')
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-[#1B4965] hover:text-[#62B6CB] hover:bg-gray-50"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                className="block px-3 py-2 rounded-md text-base font-medium text-[#1B4965] hover:text-[#62B6CB] hover:bg-gray-50"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section with Search */}
      <div className="relative bg-gradient-to-b from-[#CAE9FF] to-white min-h-[70vh]">
        <div className="absolute inset-0 bg-[url('/images/djerba-pattern.png')] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl pb-2 font-bold mb-6 bg-gradient-to-r from-[#1B4965] to-[#62B6CB] inline-block text-transparent bg-clip-text">
              Discover Your Paradise in Djerba
            </h1>
            <p className="text-xl text-[#1B4965] mb-12">
              Experience the magic of Mediterranean living in Tunisia's jewel island
            </p>

            {/* Search Filters */}
            <form onSubmit={handleSearchSubmit} className="bg-white p-6 rounded-2xl shadow-xl max-w-3xl mx-auto">
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
      </div>

      {/* Properties Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <Link 
                key={property.id} 
                to={`/houses/${property.id}`}
                className="group bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={property.image_url} 
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span className="text-[#1B4965] font-semibold">${property.price_per_night}/night</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#1B4965] mb-2">{property.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    {property.location}
                  </p>
                  
                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div className="flex space-x-4">
                      <span className="flex items-center text-gray-600">
                        <BedOutline className="w-5 h-5 mr-1 text-[#62B6CB]"/>
                        <span className="text-sm">{property.bedrooms}</span>
                      </span>
                      <span className="flex items-center text-gray-600">
                        <WaterOutline className="w-5 h-5 mr-1 text-[#62B6CB]"/>
                        <span className="text-sm">{property.bathrooms}</span>
                      </span>
                      <span className="flex items-center text-gray-600">
                        <ExpandOutline className="w-5 h-5 mr-1 text-[#62B6CB]"/>
                        <span className="text-sm">{property.sqft} m²</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="text-2xl font-light tracking-tight">
                Rent<span className="font-bold">Home</span>
              </Link>
              <p className="mt-4 text-gray-400">
                Your trusted partner in finding the perfect home for your needs.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-orange-500">Home</Link></li>
                <li><Link to="/houses" className="text-gray-400 hover:text-orange-500">Houses</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-orange-500">Contact Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li><Link to="#" className="text-gray-400 hover:text-orange-500">Buy Property</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-orange-500">Rent Property</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-orange-500">Sell Property</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@renthome.com</li>
                <li>Phone: +1 234 567 890</li>
                <li>Address: 123 Real Estate St, City</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} RentHome. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home 