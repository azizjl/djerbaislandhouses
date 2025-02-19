import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { toast } from 'react-hot-toast'
import { 
  BedOutline, 
  WaterOutline, 
  LocationOutline,
  WifiOutline,
  CarSportOutline,
  TvOutline,
  RestaurantOutline,
  PeopleOutline,
  ExpandOutline,
  FitnessOutline,
  BeachOutline,
  GameControllerOutline,
  LeafOutline,
  AccessibilityOutline,
  BabyCarriageOutline,
  ShieldCheckmarkOutline,
  BriefcaseOutline
} from 'react-ionicons'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { addDays } from 'date-fns'
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const formatTND = (amount) => {
  return new Intl.NumberFormat('ar-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Add this near the top of your file, after imports
mapboxgl.accessToken = 'pk.eyJ1Ijoia2FyaW1iZW55YWhpYTAxMSIsImEiOiJjbTc4aGhod2gwZDF2MnFzaGNndzJ0d2F1In0.qoNV6WvE8Ty_NhSj6Ij7zg'; // Replace with your actual token

const HouseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [house, setHouse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      key: 'selection'
    }
  ])
  const [totalPrice, setTotalPrice] = useState(0)
  const [existingBookings, setExistingBookings] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currencies, setCurrencies] = useState([
    { code: 'TND', rate: 1, name: 'Tunisian Dinar' },
    { code: 'EUR', rate: 0.29, name: 'Euro' },
    { code: 'USD', rate: 0.32, name: 'US Dollar' }
  ])
  const [selectedCurrency, setSelectedCurrency] = useState(
    localStorage.getItem('selectedCurrency') || 'TND'
  )
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [showAllAmenities, setShowAllAmenities] = useState(false)
  const [showMoreAmenities, setShowMoreAmenities] = useState(false)
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchHouse = async () => {
      try {
        const { data: houseData, error: houseError } = await supabase
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
          .eq('id', id)
          .single()
        
        if (houseError) throw houseError

        const propertyImages = houseData.images?.map(img => img.url) || []
        setImages(propertyImages)

        const currentMonth = new Date().getMonth() + 1
        const currentMonthPrice = houseData.prices?.find(p => 
          parseInt(p.month) === currentMonth
        )?.price_per_day || 0

        const transformedData = {
          id: houseData.id,
          name: houseData.name,
          location: houseData.location,
          map_location_url: houseData.map_location_url,
          description: houseData.description,
          property_category: houseData.property_category,
          floor_number: houseData.floor_number,
          house_number: houseData.house_number,
          bedrooms: houseData.bedrooms,
          bathrooms: houseData.bathrooms,
          capacity: houseData.capacity,
          guests: houseData.guests,
          beds: {
            double_beds: houseData.beds?.double_beds || 0,
            normal_beds: houseData.beds?.normal_beds || 0
          },
          type: houseData.type,
          price_per_night: currentMonthPrice,
          monthly_prices: houseData.prices?.map(p => ({
            month: parseInt(p.month),
            price: p.price_per_day
          })) || [],
          wifi: houseData.wifi,
          tv: houseData.tv,
          kitchen: houseData.kitchen,
          washing_machine: houseData.washing_machine,
          free_parking: houseData.free_parking,
          air_conditioning: houseData.air_conditioning,
          pool: houseData.pool,
          jacuzzi: houseData.jacuzzi,
          terrace_balcony: houseData.terrace_balcony,
          private_garden: houseData.private_garden,
          fireplace: houseData.fireplace,
          gym: houseData.gym,
          sea_view: houseData.sea_view,
          daily_cleaning: houseData.daily_cleaning,
          concierge_service: houseData.concierge_service,
          breakfast_included: houseData.breakfast_included,
          airport_transfer: houseData.airport_transfer,
          vehicle_rental: houseData.vehicle_rental,
          security_cameras: houseData.security_cameras,
          security_24_7: houseData.security_24_7,
          smoke_detectors: houseData.smoke_detectors,
          safe_box: houseData.safe_box,
          baby_crib: houseData.baby_crib,
          high_chair: houseData.high_chair,
          kids_games: houseData.kids_games,
          bbq: houseData.bbq,
          playground: houseData.playground,
          wheelchair_access: houseData.wheelchair_access,
          elevator: houseData.elevator,
          ground_floor: houseData.ground_floor,
          adapted_bathroom: houseData.adapted_bathroom,
          game_room: houseData.game_room,
          tennis_court: houseData.tennis_court,
          private_beach_access: houseData.private_beach_access,
          sports_equipment: houseData.sports_equipment,
          solar_panels: houseData.solar_panels,
          recycling_system: houseData.recycling_system,
          organic_toiletries: houseData.organic_toiletries,
          vegetable_garden: houseData.vegetable_garden,
        }
        
        setHouse(transformedData)
      } catch (error) {
        console.error('Error fetching house:', error)
        toast.error('Failed to load house details')
        navigate('/houses')
      } finally {
        setLoading(false)
      }
    }

    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('start_date, end_date')
          .eq('accommodation_id', id)
          .in('status', ['confirmed', 'pending'])
        
        if (error) throw error
        setExistingBookings(data)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        toast.error('Failed to load availability')
      }
    }

    fetchHouse()
    fetchBookings()
  }, [id, navigate])

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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session?.user)
      setCurrentUser(session?.user || null)
    }
    
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
      setCurrentUser(session?.user || null)
    })

    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    console.log('House data:', house); // Log the entire house object
    if (house?.map_location_url) {
      console.log('Map URL found:', house.map_location_url);
      const coords = extractCoordinates(house.map_location_url);
      if (coords) {
        console.log('Setting coordinates:', coords);
        setCoordinates(coords);
      } else {
        console.log('Failed to extract coordinates');
      }
    } else {
      console.log('No map_location_url found in house data');
    }
  }, [house]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      console.log('Initializing map with coordinates:', coordinates); // Debug log
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [coordinates.lng, coordinates.lat],
        zoom: 14,
        scrollZoom: false
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Create a custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.innerHTML = `
        <div class="w-16 h-16 relative">
          <div class="absolute inset-0 bg-[#1B4965] rounded-full opacity-20 animate-ping"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-8 h-8 bg-white rounded-lg shadow-lg flex items-center justify-center transform ">
              <svg class="w-5 h-5 text-[#1B4965]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      `;

      // Add marker to map
      new mapboxgl.Marker(markerEl)
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map.current);

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map center when coordinates change
  useEffect(() => {
    if (map.current && coordinates) {
      console.log('Updating map with new coordinates:', coordinates); // Debug log
      map.current.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: 14,
        essential: true
      });

      // Remove existing markers
      const markers = document.getElementsByClassName('custom-marker');
      while(markers.length > 0){
        markers[0].parentNode.removeChild(markers[0]);
      }

      // Add new marker at updated location
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.innerHTML = `
        <div class="w-16 h-16 relative">
          <div class="absolute inset-0 bg-[#1B4965] rounded-full opacity-20 animate-ping"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-8 h-8 bg-white rounded-lg shadow-lg flex items-center justify-center transform ">
              <svg class="w-5 h-5 text-[#1B4965]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      `;

      new mapboxgl.Marker(markerEl)
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map.current);
    }
  }, [coordinates]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    )
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    )
  }

  const handleDateRangeChange = (ranges) => {
    setDateRange([ranges.selection])
    
    // Calculate total price based on monthly rates for each day in the range
    const startDate = new Date(ranges.selection.startDate)
    const endDate = new Date(ranges.selection.endDate)
    let currentDate = new Date(startDate)
    let totalAmount = 0

    while (currentDate <= endDate) {
      const month = currentDate.getMonth() + 1 // Get current month (1-12)
      const monthlyPrice = house.monthly_prices.find(p => p.month === month)?.price || house.price_per_night
      totalAmount += monthlyPrice
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    setTotalPrice(totalAmount)
  }

  const isDateBlocked = (date) => {
    return existingBookings.some(booking => {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      return date >= start && date <= end
    })
  }

  const adjustDate = (date) => {
    // Create a new date at midnight in the local timezone
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
    return newDate.toISOString()
  }

  const handleBooking = async () => {
    try {
      if (!isAuthenticated || !currentUser) {
        setAuthMode('login')
        setShowAuthModal(true)
        return
      }

      // Generate a random 6-digit confirmation code
      const confirmationCode = Math.random().toString().slice(2, 8)

      // Calculate the total price
      const days = Math.ceil(
        (dateRange[0].endDate - dateRange[0].startDate) / (1000 * 60 * 60 * 24)
      )
      const calculatedTotalPrice = days * house.price_per_night
      console.log(dateRange[0].startDate, dateRange[0].endDate)
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          accommodation_id: parseInt(id),
          user_id: currentUser.id,
          guest_id: currentUser.id,
          start_date: adjustDate(dateRange[0].startDate),
          end_date: adjustDate(dateRange[0].endDate),
          total_price: calculatedTotalPrice,
          status: 'pending',
          confirmation_code: confirmationCode
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`Booking created successfully! Your confirmation code is: ${confirmationCode}`)
      navigate(`/bookings/${data.id}`)
    } catch (error) {
      console.error('Error creating booking:', error)
      if (error.message.includes('overlap')) {
        toast.error('These dates are no longer available')
      } else {
        toast.error('Failed to create booking')
      }
    }
  }

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

  const AuthModal = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleAuth = async (e) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      try {
        if (authMode === 'signup' && password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }

        if (authMode === 'login') {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) throw error
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
          })
          if (error) throw error
          toast.success('Please check your email to verify your account')
        }
        setShowAuthModal(false)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row shadow-2xl">
          {/* Image Section - Now visible on mobile as a header */}
          <div className="w-full md:w-1/2 relative h-48 md:h-auto">
            <img 
              src={images[currentImageIndex]} 
              alt={house.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl md:text-2xl font-bold mb-2">{house.name}</h3>
                <p className="flex items-center text-sm">
                  <LocationOutline
                    color={'#ffffff'} 
                    height="16px"
                    width="16px"
                    className="mr-1"
                  />
                  {house.location}
                </p>
              </div>
            </div>
          </div>

          {/* Auth Form Section */}
          <div className="w-full md:w-1/2 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1B4965]">Welcome</h2>
              <button 
                onClick={() => setShowAuthModal(false)} 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Auth Tabs */}
            <div className="flex mb-8 border-b border-gray-200">
              <button
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  authMode === 'login'
                    ? 'text-[#1B4965] border-b-2 border-[#1B4965]'
                    : 'text-gray-500 hover:text-[#62B6CB]'
                }`}
                onClick={() => setAuthMode('login')}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  authMode === 'signup'
                    ? 'text-[#1B4965] border-b-2 border-[#1B4965]'
                    : 'text-gray-500 hover:text-[#62B6CB]'
                }`}
                onClick={() => setAuthMode('signup')}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-500 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>
              {authMode === 'signup' && (
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent transition-colors"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  authMode === 'login' ? 'Sign In' : 'Sign Up'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="text-[#62B6CB] hover:text-[#1B4965] font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-[#62B6CB] hover:text-[#1B4965] font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Add this function to extract coordinates from Google Maps URL
  const extractCoordinates = (url) => {
    try {
      console.log('URL to extract from:', url); // Log the input URL
      const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = url.match(regex);
      console.log('Regex match result:', match); // Log the match result
      if (match) {
        const coords = {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
        console.log('Extracted coordinates:', coords); // Log the final coordinates
        return coords;
      }
      return null;
    } catch (error) {
      console.error('Error extracting coordinates:', error);
      return null;
    }
  };

  // Replace the existing MapSection with this new version
  const MapSection = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [coordinates, setCoordinates] = useState({ lat: 33.8075, lng: 10.8451 }); // Default to Djerba coordinates

    // Add this function to extract coordinates from Google Maps URL
    const extractCoordinates = (url) => {
      try {
        console.log('URL to extract from:', url); // Log the input URL
        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const match = url.match(regex);
        console.log('Regex match result:', match); // Log the match result
        if (match) {
          const coords = {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
          };
          console.log('Extracted coordinates:', coords); // Log the final coordinates
          return coords;
        }
        return null;
      } catch (error) {
        console.error('Error extracting coordinates:', error);
        return null;
      }
    };

    useEffect(() => {
      console.log('House data:', house); // Log the entire house object
      if (house?.map_location_url) {
        console.log('Map URL found:', house.map_location_url);
        const coords = extractCoordinates(house.map_location_url);
        if (coords) {
          console.log('Setting coordinates:', coords);
          setCoordinates(coords);
        } else {
          console.log('Failed to extract coordinates');
        }
      } else {
        console.log('No map_location_url found in house data');
      }
    }, [house]);

    useEffect(() => {
      if (!mapContainer.current || map.current) return;

      try {
        console.log('Initializing map with coordinates:', coordinates); // Debug log
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [coordinates.lng, coordinates.lat],
          zoom: 14,
          scrollZoom: false
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Create a custom marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.innerHTML = `
          <div class="w-16 h-16 relative">
            <div class="absolute inset-0 bg-[#1B4965] rounded-full opacity-20 animate-ping"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-8 h-8 bg-white rounded-lg shadow-lg flex items-center justify-center transform -rotate-45">
                <svg class="w-5 h-5 text-[#1B4965]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        `;

        // Add marker to map
        new mapboxgl.Marker(markerEl)
          .setLngLat([coordinates.lng, coordinates.lat])
          .addTo(map.current);

      } catch (error) {
        console.error('Error initializing map:', error);
      }

      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    }, []);

    // Update map center when coordinates change
    useEffect(() => {
      if (map.current && coordinates) {
        console.log('Updating map with new coordinates:', coordinates); // Debug log
        map.current.flyTo({
          center: [coordinates.lng, coordinates.lat],
          zoom: 14,
          essential: true
        });

        // Remove existing markers
        const markers = document.getElementsByClassName('custom-marker');
        while(markers.length > 0){
          markers[0].parentNode.removeChild(markers[0]);
        }

        // Add new marker at updated location
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.innerHTML = `
          <div class="w-16 h-16 relative">
            <div class="absolute inset-0 bg-[#1B4965] rounded-full opacity-20 animate-ping"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-8 h-8 bg-white rounded-lg shadow-lg flex items-center justify-center transform ">
                <svg class="w-5 h-5 text-[#1B4965]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        `;

        new mapboxgl.Marker(markerEl)
          .setLngLat([coordinates.lng, coordinates.lat])
          .addTo(map.current);
      }
    }, [coordinates]);

    return (
      <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* <h3 className="text-2xl font-semibold text-gray-900 mb-6">Location</h3> */}
        <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-lg">
          <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
          
          {/* Location info overlay */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-sm z-10">
            <h4 className="font-medium text-[#1B4965] mb-2">Property Location</h4>
            <p className="text-sm text-gray-600">{house.location}</p>
            {house.map_location_url && (
              <a 
                href={house.map_location_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center text-sm text-[#62B6CB] hover:text-[#1B4965] transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Get directions
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add this new Reviews section component
  const ReviewsSection = () => {
    const [reviews, setReviews] = useState([])
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [averageRating, setAverageRating] = useState(0)
    const [showReviewForm, setShowReviewForm] = useState(false)

    useEffect(() => {
      fetchReviews()
    }, [])

    const fetchReviews = async () => {
      try {
        // First get the reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('house_id', id)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        // Then get the profiles for those reviews
        const userIds = reviewsData.map(review => review.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Create a map of profiles by user_id for easy lookup
        const profilesMap = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        // Combine the data
        const transformedReviews = reviewsData.map(review => ({
          ...review,
          user_name: profilesMap[review.user_id]?.full_name || review.user_name,
          user_avatar: profilesMap[review.user_id]?.avatar_url || 
                      `https://api.dicebear.com/6.x/initials/svg?seed=${review.user_name}`
        }));

        setReviews(transformedReviews);

        // Calculate average rating
        if (reviewsData.length > 0) {
          const avg = reviewsData.reduce((acc, review) => acc + review.rating, 0) / reviewsData.length;
          setAverageRating(parseFloat(avg.toFixed(1)));
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast.error('Failed to load reviews');
      }
    };

    const handleSubmitReview = async (e) => {
      e.preventDefault()
      
      if (!isAuthenticated) {
        setAuthMode('login')
        setShowAuthModal(true)
        return
      }

      if (!newReview.comment.trim()) {
        toast.error('Please enter a comment')
        return
      }

      setIsSubmitting(true)

      try {
        const { data: userData } = await supabase.auth.getUser()
        
        const { data, error } = await supabase
          .from('reviews')
          .insert({
            house_id: id, // id should already be a UUID
            user_id: userData.user.id,
            rating: newReview.rating,
            comment: newReview.comment,
            user_name: userData.user.email.split('@')[0],
            user_avatar: `https://api.dicebear.com/6.x/initials/svg?seed=${userData.user.email}`
          })
          .select()
          .single()

        if (error) throw error

        setReviews([data, ...reviews])
        setNewReview({ rating: 5, comment: '' })
        setShowReviewForm(false)
        toast.success('Review submitted successfully!')
        fetchReviews() // Refresh reviews to update average
      } catch (error) {
        console.error('Error submitting review:', error)
        toast.error('Failed to submit review')
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-200 pt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Reviews</h3>
            {isAuthenticated && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Reviews Summary */}
          {reviews.length > 0 && (
            <div className="flex items-center mb-8">
              <div className="flex items-center">
                <span className="text-3xl font-bold text-[#1B4965] mr-2">{averageRating}</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      className={`w-5 h-5 ${star <= averageRating ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-gray-600">({reviews.length} reviews)</span>
              </div>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 p-6 rounded-lg">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Rating</label>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="p-1"
                    >
                      <svg 
                        className={`w-6 h-6 ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Your Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#62B6CB] focus:border-[#62B6CB]"
                  rows="4"
                  placeholder="Share your experience..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {/* Individual Reviews */}
          <div className="space-y-8">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-8">
                <div className="flex items-center mb-4">
                  <img 
                    src={review.user_avatar || `https://api.dicebear.com/6.x/initials/svg?seed=${review.user_name}`}
                    alt={review.user_name} 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{review.user_name}</h4>
                    <p className="text-gray-500 text-sm">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600">{review.comment}</p>
              </div>
            ))}

            {reviews.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No reviews yet. Be the first to review this property!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
      </div>
    )
  }

  if (!house) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1B4965]">House not found</h2>
          <Link to="/houses" className="mt-4 text-[#62B6CB] hover:text-[#1B4965] transition-colors">
            Return to listings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className={`text-3xl font-light tracking-tight ${isScrolled ? 'text-[#1B4965]' : 'text-[#1B4965]'}`}>
                DjerbaIsland<span className="font-bold text-[#62B6CB]">Houses</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className={`flex items-center ${isScrolled ? 'text-[#1B4965] hover:text-[#62B6CB]' : 'text-[#1B4965] hover:text-white/80'} transition-colors`}>
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Home
              </Link>
              <Link to="/houses" className={`flex items-center ${isScrolled ? 'text-[#1B4965] hover:text-[#62B6CB]' : 'text-[#1B4965] hover:text-[#1B4965]/80'} transition-colors`}>
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                Properties
              </Link>
              {/* <Link to="/contact" className={`flex items-center ${isScrolled ? 'text-[#1B4965] hover:text-[#62B6CB]' : 'text-[#1B4965] hover:text-[#1B4965]/80'} transition-colors`}>
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Contact
              </Link>
              {role === 'admin' && (
                <Link to="/dashboard" className={`flex items-center ${isScrolled ? 'text-[#1B4965] hover:text-[#62B6CB]' : 'text-[#1B4965] hover:text-[#1B4965]/80'} transition-colors`}>
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </Link>
              )} */}
              {isAuthenticated && (
                <Link to="/bookings" className={`flex items-center ${isScrolled ? 'text-[#1B4965] hover:text-[#62B6CB]' : 'text-[#1B4965] hover:text-[#1B4965]/80'} transition-colors`}>
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  My Bookings
                </Link>
              )}
              <div className="flex flex-col">
                <div className="relative">
                  <select
                    value={selectedCurrency}
                    onChange={handleCurrencyChange}
                    className={`px-3 py-1.5 ${
                      isScrolled 
                        ? 'bg-white text-[#1B4965] border-[#1B4965]' 
                        : 'bg-[#1B4965] text-white border-white'
                    } border rounded-lg appearance-none cursor-pointer pr-8`}
                  >
                    {currencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <svg className={`w-4 h-4 ${isScrolled ? 'text-[#1B4965]' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              {isAuthenticated ? ( 
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut()
                    navigate('/auth')
                  }} 
                  className={`px-6 py-2.5 ${
                    isScrolled 
                      ? 'text-white bg-[#1B4965] hover:bg-[#62B6CB]' 
                      : 'text-[#1B4965] bg-white hover:bg-white/90'
                  } rounded-full transition-colors duration-300 flex items-center`}
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Sign Out
                </button>
              ) : (
                <Link 
                  to="/auth" 
                  className={`px-6 py-2.5 ${
                    isScrolled 
                      ? 'text-white bg-[#1B4965] hover:bg-[#62B6CB]' 
                      : 'text-[#1B4965] bg-white hover:bg-white/90'
                  } rounded-full transition-colors duration-300 flex items-center`}
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  </svg>
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Property Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#1B4965]">{house.name}</h1>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-gray-600">
                <LocationOutline color={'#62B6CB'} height="20px" width="20px" className="mr-1" />
                {house.location}
              </span>
              {house.map_location_url && (
                <button
                  onClick={() => window.open(house.map_location_url, '_blank')}
                  className="text-[#1B4965] underline hover:text-[#62B6CB]"
                >
                  View on map
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Image Gallery - Desktop */}
        <div className="hidden md:block mb-8">
          <div className="grid grid-cols-2 gap-2 h-[60vh]">
            {/* Main large image */}
            <div className="relative h-full">
              <img 
                src={images[0]} 
                alt={house.name}
                className="w-full h-full object-cover rounded-l-xl cursor-pointer"
                style={{ aspectRatio: '4/3' }}
                onClick={() => setShowAllPhotos(true)}
              />
            </div>
            
            {/* Right side grid of smaller images */}
            <div className="grid grid-cols-2 gap-2">
              {images.slice(1, 5).map((image, index) => (
                <div key={index} className="relative aspect-[4/3]">
                  <img 
                    src={image}
                    alt={`${house.name} - ${index + 2}`}
                    className={`w-full h-full object-cover cursor-pointer ${
                      index === 1 ? 'rounded-tr-xl' : 
                      index === 3 ? 'rounded-br-xl' : ''
                    }`}
                    onClick={() => setShowAllPhotos(true)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Image Gallery - Mobile */}
        <div className="relative md:hidden mb-8">
          <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden">
            <img 
              src={images[currentImageIndex]} 
              alt={house.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Navigation arrows */}
          <button 
            onClick={previousImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 rounded-full backdrop-blur-sm
                       hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 rounded-full backdrop-blur-sm
                       hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 rounded-full backdrop-blur-sm text-white text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2">
            {/* Basic Details */}
            <div className="pb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    {house.property_category.charAt(0).toUpperCase() + house.property_category.slice(1)}
                  </h2>
                  <div className="flex items-center text-gray-500 text-base space-x-6">
                    <div className="flex items-center">
                      <PeopleOutline color={'#6b7280'} height="18px" width="18px" className="mr-2" />
                      <span>{house.guests} guests</span>
                    </div>
                    <div className="flex items-center">
                      <BedOutline color={'#6b7280'} height="18px" width="18px" className="mr-2" />
                      <span>
                        {house.bedrooms} bedrooms · {' '}
                        {house.beds.double_beds > 0 && `${house.beds.double_beds} double`}
                        {house.beds.double_beds > 0 && house.beds.normal_beds > 0 && ', '}
                        {house.beds.normal_beds > 0 && `${house.beds.normal_beds} single`}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <WaterOutline color={'#6b7280'} height="18px" width="18px" className="mr-2" />
                      <span>{house.bathrooms} bathrooms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="py-8">
              <div className="prose max-w-none text-gray-600">
                <p className="leading-relaxed whitespace-pre-line">{house.description}</p>
              </div>
            </div>

            {/* Amenities */}
            <div className="py-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">What this place offers</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Basic Info - Always Visible */}
                <div className="flex items-center space-x-4 py-2">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-gray-700">{house.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center space-x-4 py-2">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-gray-700">Up to {house.guests} guests</span>
                </div>
                <div className="flex items-center space-x-4 py-2">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span className="text-gray-700">{house.bathrooms} Bathrooms</span>
                </div>
                <div className="flex items-center space-x-4 py-2">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="text-gray-700">
                    {house.beds.double_beds > 0 && `${house.beds.double_beds} Double bed${house.beds.double_beds > 1 ? 's' : ''}`}
                    {house.beds.double_beds > 0 && house.beds.normal_beds > 0 && ', '}
                    {house.beds.normal_beds > 0 && `${house.beds.normal_beds} Single bed${house.beds.normal_beds > 1 ? 's' : ''}`}
                  </span>
                </div>

                {/* Expandable amenities */}
                {showMoreAmenities && (
                  <>
                    {house.wifi && (
                      <div className="flex items-center space-x-4 py-2">
                        <WifiOutline color={'#374151'} height="24px" width="24px" />
                        <span className="text-gray-700">Wifi</span>
                      </div>
                    )}
                    {house.tv && (
                      <div className="flex items-center space-x-4 py-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700">TV</span>
                      </div>
                    )}
                    {house.free_parking && (
                      <div className="flex items-center space-x-4 py-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                        <span className="text-gray-700">Free Parking</span>
                      </div>
                    )}
                    {house.air_conditioning && (
                      <div className="flex items-center space-x-4 py-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700">Air Conditioning</span>
                      </div>
                    )}
                    {house.pool && (
                      <div className="flex items-center space-x-4 py-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span className="text-gray-700">Pool</span>
                      </div>
                    )}
                    {house.heating && (
                      <div className="flex items-center space-x-4 py-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        <span className="text-gray-700">Heating</span>
                      </div>
                    )}
                   {house.equipped_kitchen && (
      <div className="flex items-center space-x-4 py-2">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-gray-700">Equipped Kitchen</span>
      </div>
    )}
    {house.washer_dryer && (
      <div className="flex items-center space-x-4 py-2">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-gray-700">Washer & Dryer</span>
      </div>
    )}
    {house.jacuzzi && (
      <div className="flex items-center space-x-4 py-2">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span className="text-gray-700">Jacuzzi</span>
      </div>
    )}
    {house.terrace_balcony && (
      <div className="flex items-center space-x-4 py-2">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-gray-700">Terrace/Balcony</span>
      </div>
    )}
    {house.private_garden && (
      <div className="flex items-center space-x-4 py-2">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-gray-700">Private Garden</span>
      </div>
    )}
    {house.fireplace && (
      <div className="flex items-center space-x-4 py-2">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
        <span className="text-gray-700">Fireplace</span>
      </div>
    )}
    {house.gym && (
      <div className="flex items-center space-x-4 py-2">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="text-gray-700">Gym</span>
      </div>
    )}
    {house.sea_view && (
      <div className="flex items-center space-x-4 py-2">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-gray-700">Sea View</span>
      </div>
    )}
    {house.daily_cleaning && (
      <div className="flex items-center space-x-4 py-2">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span className="text-gray-700">Daily Cleaning</span>
      </div>
    )}
    {house.concierge_service && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
    <span className="text-gray-700">Concierge Service</span>
  </div>
)}
{house.breakfast_included && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
    <span className="text-gray-700">Breakfast Included</span>
  </div>
)}
{house.airport_transfer && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
    <span className="text-gray-700">Airport Transfer</span>
  </div>
)}
{house.vehicle_rental && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16v-4m4 4v-4m4 4v-4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <span className="text-gray-700">Vehicle Rental</span>
  </div>
)}
{house.security_cameras && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    <span className="text-gray-700">Security Cameras</span>
  </div>
)}
{house.security_24_7 && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
    <span className="text-gray-700">24/7 Security</span>
  </div>
)}
{house.smoke_detectors && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
    <span className="text-gray-700">Smoke Detectors</span>
  </div>
)}
{house.safe_box && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
    <span className="text-gray-700">Safe Box</span>
  </div>
)}
{house.baby_crib && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
    <span className="text-gray-700">Baby Crib</span>
  </div>
)}
{house.high_chair && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
    <span className="text-gray-700">High Chair</span>
  </div>
)}
{house.kids_games && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span className="text-gray-700">Kids Games</span>
  </div>
)}
{house.bbq && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    <span className="text-gray-700">BBQ</span>
  </div>
)}
{house.playground && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span className="text-gray-700">Playground</span>
  </div>
)}
{house.wheelchair_access && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
    <span className="text-gray-700">Wheelchair Access</span>
  </div>
)}
{house.elevator && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
    <span className="text-gray-700">Elevator</span>
  </div>
)}
{house.ground_floor && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
    <span className="text-gray-700">Ground Floor</span>
  </div>
)}
{house.adapted_bathroom && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
    <span className="text-gray-700">Adapted Bathroom</span>
  </div>
)}
{house.game_room && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span className="text-gray-700">Game Room</span>
  </div>
)}
{house.solar_panels && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
    <span className="text-gray-700">Solar Panels</span>
  </div>
)}
{house.recycling_system && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    <span className="text-gray-700">Recycling System</span>
  </div>
)}
{house.organic_toiletries && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
    <span className="text-gray-700">Organic Toiletries</span>
  </div>
)}
{house.vegetable_garden && (
  <div className="flex items-center space-x-4 py-2">
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
    <span className="text-gray-700">Vegetable Garden</span>
  </div>
)}
                  </>
                )}
              </div>

              {/* Toggle button */}
              <button 
                onClick={() => setShowMoreAmenities(!showMoreAmenities)}
                className="mt-6 px-6 py-3 border border-gray-800 rounded-lg hover:bg-gray-50 
                           transition-colors duration-300 font-medium text-gray-800"
              >
                {showMoreAmenities ? 'Show less' : 'Show more'}
              </button>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <div className="border border-gray-200 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-2xl font-bold text-[#1B4965]">{formatPrice(house.price_per_night)}</span>
                    <span className="text-gray-600 ml-2">per night</span>
                  </div>
                </div>

                {/* Date Range Picker */}
                <div className="mb-6">
                  <DateRange
                    editableDateInputs={true}
                    onChange={handleDateRangeChange}
                    moveRangeOnFirstSelection={false}
                    ranges={dateRange}
                    minDate={new Date()}
                    rangeColors={['#1B4965']}
                    className="border border-gray-200 rounded-lg"
                    disabledDates={existingBookings.flatMap(booking => {
                      const dates = []
                      let currentDate = new Date(booking.start_date)
                      const endDate = new Date(booking.end_date)
                      while (currentDate <= endDate) {
                        dates.push(new Date(currentDate))
                        currentDate.setDate(currentDate.getDate() + 1)
                      }
                      return dates
                    })}
                  />
                </div>

                {/* Total Price */}
                {totalPrice > 0 && (
                  <div className="mt-4 mb-6">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">
                        {Math.ceil((dateRange[0].endDate - dateRange[0].startDate) / (1000 * 60 * 60 * 24))} nights
                      </span>
                      <span className="font-semibold text-[#1B4965]">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                )}

                {/* Book Now Button */}
                <button 
                  className="w-full px-6 py-3 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] 
                           transition-colors duration-300 font-medium"
                  onClick={handleBooking}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && <AuthModal />}
      {showAllPhotos && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="relative min-h-screen">
            <button 
              onClick={() => setShowAllPhotos(false)}
              className="absolute top-6 left-6 p-2 bg-black/10 rounded-full backdrop-blur-sm
                         hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="max-w-7xl mx-auto py-20 px-6">
              <div className="grid grid-cols-2 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="aspect-w-16 aspect-h-9">
                    <img 
                      src={image}
                      alt={`${house.name} - ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <MapSection />
      
      {/* Add the ReviewsSection */}
      <ReviewsSection />
    </div>
  )
}

export default HouseDetail