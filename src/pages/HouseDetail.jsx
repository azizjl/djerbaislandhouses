import { useEffect, useState } from 'react'
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
  ExpandOutline
} from 'react-ionicons'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { addDays } from 'date-fns'

const formatTND = (amount) => {
  return new Intl.NumberFormat('ar-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

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
          description: houseData.description,
          bedrooms: houseData.bedrooms,
          bathrooms: houseData.bathrooms,
          capacity: houseData.capacity,
          guests: houseData.guests,
          beds: houseData.beds,
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
          pool: houseData.pool
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
          .eq('status', 'confirmed')
        
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
    const days = Math.ceil(
      (ranges.selection.endDate - ranges.selection.startDate) / (1000 * 60 * 60 * 24)
    )
    setTotalPrice(days * house?.price_per_night)
  }

  const isDateBlocked = (date) => {
    return existingBookings.some(booking => {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      return date >= start && date <= end
    })
  }

  const handleBooking = async () => {
    try {
      // First check if user is logged in
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Please login to book')
        return
      }

      // Calculate the total price
      const days = Math.ceil(
        (dateRange[0].endDate - dateRange[0].startDate) / (1000 * 60 * 60 * 24)
      )
      const calculatedTotalPrice = days * house.price_per_night

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          accommodation_id: parseInt(id),
          user_id: user.id,
          start_date: dateRange[0].startDate,
          end_date: dateRange[0].endDate,
          total_price: calculatedTotalPrice,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Booking created successfully!')
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

      {/* Property Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Property Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="inline-block px-4 py-2 bg-[#1B4965] text-white text-sm rounded-full mb-4 font-medium">
              {house.type === 'rent' ? 'FOR RENT' : 'FOR SALE'}
            </div>
            <h1 className="text-4xl font-bold text-[#1B4965] mb-2">{house.name}</h1>
            <p className="text-gray-600 flex items-center">
              <LocationOutline
                color={'#62B6CB'} 
                height="20px"
                width="20px"
                className="mr-2"
              />
              {house.location}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-[#1B4965]">{formatTND(house.price_per_night)}</div>
            <div className="text-[#62B6CB]">per night</div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative mb-12">
          <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100">
            <img 
              src={images[currentImageIndex]} 
              alt={house.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <>
              <button 
                onClick={previousImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors duration-300"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6 text-[#1B4965]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors duration-300"
                aria-label="Next image"
              >
                <svg className="w-6 h-6 text-[#1B4965]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Property Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Left Column - Details & Description */}
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-xl mb-8">
              <div className="flex flex-col items-center text-center">
                <BedOutline color={'#62B6CB'} height="24px" width="24px" />
                <span className="mt-2 text-sm text-gray-600">{house.bedrooms} Bedrooms</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <WaterOutline color={'#62B6CB'} height="24px" width="24px" />
                <span className="mt-2 text-sm text-gray-600">{house.bathrooms} Bathrooms</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <PeopleOutline color={'#62B6CB'} height="24px" width="24px" />
                <span className="mt-2 text-sm text-gray-600">{house.guests} Guests</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <ExpandOutline color={'#62B6CB'} height="24px" width="24px" />
                <span className="mt-2 text-sm text-gray-600">{house.capacity} m²</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1B4965] mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed">{house.description}</p>
            </div>
          </div>

          {/* Right Column - Amenities & Booking */}
          <div>
            <div className="bg-gray-50 p-6 rounded-xl mb-8">
              <h3 className="text-xl font-semibold text-[#1B4965] mb-6">Amenities</h3>
              <div className="grid grid-cols-2 gap-4">
                {house.wifi && (
                  <div className="flex items-center space-x-3">
                    <WifiOutline color={'#62B6CB'} height="20px" width="20px" />
                    <span className="text-gray-600">WiFi</span>
                  </div>
                )}
                {house.tv && (
                  <div className="flex items-center space-x-3">
                    <TvOutline color={'#62B6CB'} height="20px" width="20px" />
                    <span className="text-gray-600">TV</span>
                  </div>
                )}
                {house.kitchen && (
                  <div className="flex items-center space-x-3">
                    <RestaurantOutline color={'#62B6CB'} height="20px" width="20px" />
                    <span className="text-gray-600">Kitchen</span>
                  </div>
                )}
                {house.free_parking && (
                  <div className="flex items-center space-x-3">
                    <CarSportOutline color={'#62B6CB'} height="20px" width="20px" />
                    <span className="text-gray-600">Free Parking</span>
                  </div>
                )}
                {house.air_conditioning && (
                  <div className="flex items-center space-x-3">
                    <span className="text-[#62B6CB] text-xl">❄️</span>
                    <span className="text-gray-600">Air Conditioning</span>
                  </div>
                )}
                {house.pool && (
                  <div className="flex items-center space-x-3">
                    <span className="text-[#62B6CB] text-xl">🏊‍♂️</span>
                    <span className="text-gray-600">Pool</span>
                  </div>
                )}
                {house.washing_machine && (
                  <div className="flex items-center space-x-3">
                    <span className="text-[#62B6CB] text-xl">🧺</span>
                    <span className="text-gray-600">Washing Machine</span>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Card */}
            <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-2xl font-bold text-[#1B4965]">{formatTND(house.price_per_night)}</span>
                  <span className="text-gray-600 ml-2">per night</span>
                </div>
              </div>
              
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

              {totalPrice > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">
                      {Math.ceil((dateRange[0].endDate - dateRange[0].startDate) / (1000 * 60 * 60 * 24))} nights
                    </span>
                    <span className="font-semibold text-[#1B4965]">{formatTND(totalPrice)}</span>
                  </div>
                </div>
              )}

              <button 
                className="w-full px-6 py-3 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors duration-300 font-medium"
                onClick={handleBooking}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HouseDetail