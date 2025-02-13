import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { toast } from 'react-hot-toast'
import useAuthStore from '../stores/authStore'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { addDays, format } from 'date-fns'

const formatTND = (amount) => {
  return new Intl.NumberFormat('ar-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const Dashboard = () => {
  const navigate = useNavigate()
  const { role } = useAuthStore()

  const [activeTab, setActiveTab] = useState('listings')
  const [listings, setListings] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 30),
      key: 'selection'
    }
  ])
  const [calendarBookings, setCalendarBookings] = useState([])
  const [calendarView, setCalendarView] = useState('month')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  useEffect(() => {
    // set timeout to 5 seconds
      if (role !== 'admin') {
        navigate('/')
        return
      }

    const fetchData = async () => {
      try {
        // Fetch listings
        const { data: listingsData, error: listingsError } = await supabase
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

        if (listingsError) throw listingsError

        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            accommodations (
              name,
              location,
              images (url)
            )
          `)
          .order('created_at', { ascending: false })

        if (bookingsError) throw bookingsError

        setListings(listingsData)
        setBookings(bookingsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    const fetchAllBookings = async () => {
      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            accommodations (
              name,
              location
            )
          `)
          .order('start_date', { ascending: true })

        if (bookingsError) throw bookingsError

        // Transform bookings for calendar
        const transformedBookings = bookingsData.map(booking => ({
          startDate: new Date(booking.start_date),
          endDate: new Date(booking.end_date),
          title: `${booking.accommodations.name} - ${booking.status}`,
          color: getStatusColor(booking.status),
          key: booking.id.toString()
        }))

        setCalendarBookings(transformedBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        toast.error('Failed to load bookings')
      }
    }

    fetchData()
    fetchAllBookings()
  }, [role, navigate])

  const handleVerifyBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'confirmed' }
            : booking
        )
      )

      toast.success('Booking confirmed successfully')
    } catch (error) {
      console.error('Error confirming booking:', error)
      toast.error('Failed to confirm booking')
    }
  }

  const handleCancelBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      )

      toast.success('Booking cancelled successfully')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    }
  }

  // Helper function to get color based on booking status
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50' // green
      case 'pending':
        return '#FFC107' // yellow
      case 'cancelled':
        return '#F44336' // red
      default:
        return '#1B4965' // default blue
    }
  }

  // Function to handle booking click
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking)
    setIsBookingModalOpen(true)
  }

  // Function to handle booking status update
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      // Update local state
      setCalendarBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.key === bookingId.toString()
            ? { ...booking, color: getStatusColor(newStatus) }
            : booking
        )
      )

      toast.success(`Booking ${newStatus} successfully`)
      setIsBookingModalOpen(false)
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('Failed to update booking')
    }
  }

  // Enhanced calendar content
  const renderCalendarContent = () => (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-[#1B4965]">Booking Calendar</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCalendarView('month')}
              className={`px-4 py-2 rounded-lg font-medium ${
                calendarView === 'month'
                  ? 'bg-[#1B4965] text-white'
                  : 'text-[#1B4965] hover:bg-gray-100'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setCalendarView('week')}
              className={`px-4 py-2 rounded-lg font-medium ${
                calendarView === 'week'
                  ? 'bg-[#1B4965] text-white'
                  : 'text-[#1B4965] hover:bg-gray-100'
              }`}
            >
              Week View
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-[#4CAF50] mr-2"></div>
            <span className="text-sm">Confirmed</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-[#FFC107] mr-2"></div>
            <span className="text-sm">Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-[#F44336] mr-2"></div>
            <span className="text-sm">Cancelled</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-[#1B4965] mr-2"></div>
            <span className="text-sm">Selected Range</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-6">
        <DateRange
          onChange={item => {
            setDateRange([item.selection])
            // Check if clicked date has a booking
            const clickedDate = item.selection.startDate
            const booking = calendarBookings.find(b => 
              clickedDate >= b.startDate && clickedDate <= b.endDate
            )
            if (booking) {
              handleBookingClick(booking)
            }
          }}
          moveRangeOnFirstSelection={false}
          ranges={[...dateRange, ...calendarBookings]}
          months={calendarView === 'month' ? 2 : 1}
          direction="horizontal"
          className="border border-gray-200 rounded-lg"
          rangeColors={['#1B4965']}
          minDate={new Date()}
          showMonthAndYearPickers={true}
          showDateDisplay={false}
          showPreview={false}
          scroll={{ enabled: true }}
          monthDisplayFormat="MMMM yyyy"
          weekdayDisplayFormat="E"
          dayDisplayFormat="d"
        />
      </div>

      {/* Booking Details Modal */}
      {isBookingModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">{selectedBooking.title.split(' - ')[0]}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Check-in</p>
                <p className="font-medium">{format(selectedBooking.startDate, 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Check-out</p>
                <p className="font-medium">{format(selectedBooking.endDate, 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div 
                  className="inline-block px-3 py-1 rounded-full text-sm text-white mt-1"
                  style={{ backgroundColor: selectedBooking.color }}
                >
                  {selectedBooking.title.split(' - ')[1]}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                {selectedBooking.title.split(' - ')[1] !== 'confirmed' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedBooking.key, 'confirmed')}
                    className="flex-1 px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    Confirm
                  </button>
                )}
                {selectedBooking.title.split(' - ')[1] !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedBooking.key, 'cancelled')}
                    className="flex-1 px-4 py-2 bg-[#F44336] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors mt-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings List */}
      <div className="p-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Upcoming Bookings</h3>
        <div className="space-y-4">
          {bookings
            .filter(booking => new Date(booking.start_date) >= new Date())
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
            .slice(0, 5)
            .map(booking => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleBookingClick({
                  startDate: new Date(booking.start_date),
                  endDate: new Date(booking.end_date),
                  title: `${booking.accommodations.name} - ${booking.status}`,
                  color: getStatusColor(booking.status),
                  key: booking.id.toString()
                })}
              >
                <div>
                  <p className="font-medium">{booking.accommodations.name}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(booking.start_date), 'PP')} - {format(new Date(booking.end_date), 'PP')}
                  </p>
                </div>
                <div
                  className="px-3 py-1 rounded-full text-sm text-white"
                  style={{
                    backgroundColor: getStatusColor(booking.status)
                  }}
                >
                  {booking.status}
                </div>
              </div>
            ))}
          {bookings.filter(booking => new Date(booking.start_date) >= new Date()).length === 0 && (
            <p className="text-gray-500 text-center py-4">No upcoming bookings</p>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Link to="/dashboard" className="flex items-center text-[#1B4965] hover:text-[#62B6CB] transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </Link>
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
            <Link
              to="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-[#1B4965] hover:text-[#62B6CB] hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                navigate('/auth')
              }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-[#1B4965] hover:text-[#62B6CB] hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1B4965]">Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'listings'
                ? 'bg-[#1B4965] text-white'
                : 'text-[#1B4965] hover:bg-gray-100'
            }`}
          >
            Listings
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'bookings'
                ? 'bg-[#1B4965] text-white'
                : 'text-[#1B4965] hover:bg-gray-100'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'calendar'
                ? 'bg-[#1B4965] text-white'
                : 'text-[#1B4965] hover:bg-gray-100'
            }`}
          >
            Calendar
          </button>
        </div>

        {/* Content */}
        {activeTab === 'listings' ? (
          <div>
            {/* Add New Listing Button */}
            <div className="mb-6">
              <Link
                to="/add-listing"
                className="inline-flex items-center px-6 py-3 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors duration-300"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add New Listing
              </Link>
            </div>

            {/* Existing Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="relative aspect-[4/3]">
                    <img
                      src={listing.images?.[0]?.url || '/placeholder.jpg'}
                      alt={listing.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#1B4965] mb-2">{listing.name}</h3>
                    <p className="text-gray-600 mb-4">{listing.location}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-[#1B4965]">
                        {formatTND(listing.prices?.[0]?.price_per_day || 0)}
                      </span>
                      <Link
                        to={`/edit-listing/${listing.id}`}
                        className="px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'bookings' ? (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-[#1B4965] mb-2">
                        {booking.accommodations.name}
                      </h3>
                      <p className="text-gray-600">{booking.accommodations.location}</p>
                      <div className="mt-4 space-y-2">
                        <p className="text-gray-600">
                          <span className="font-medium">Check-in:</span>{' '}
                          {new Date(booking.start_date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Check-out:</span>{' '}
                          {new Date(booking.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Total:</span>{' '}
                          {formatTND(booking.total_price)}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Status:</span>{' '}
                          <span className={`
                            ${booking.status === 'confirmed' ? 'text-green-600' :
                              booking.status === 'pending' ? 'text-amber-600' :
                              'text-red-600'}
                          `}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  {booking.status === 'pending' && (
                    <div className="mt-6 flex space-x-4">
                      <button
                        onClick={() => handleVerifyBooking(booking.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          renderCalendarContent()
        )}
      </div>
    </div>
  )
}

export default Dashboard
