import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { LocationOutline } from 'react-ionicons'

const formatTND = (amount) => {
  return new Intl.NumberFormat('ar-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const BookingDetail = () => {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please login to view booking')
          return
        }

        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            accommodations (
              name,
              location,
              images (url)
            )
          `)
          .eq('id', id)
          .single()

        if (error) throw error

        if (data.user_id !== user.id) {
          toast.error('Unauthorized to view this booking')
          return
        }


        setBooking(data)
      } catch (error) {
        console.error('Error fetching booking:', error)
        toast.error('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1B4965]">Booking not found</h2>
          <Link to="/bookings" className="mt-4 text-[#62B6CB] hover:text-[#1B4965] transition-colors">
            View all bookings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#CAE9FF]">
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
              <Link to="/bookings" className="flex items-center text-[#1B4965] hover:text-[#62B6CB] transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                My Bookings
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
              to="/bookings"
              className="block px-3 py-2 rounded-md text-base font-medium text-[#1B4965] hover:text-[#62B6CB] hover:bg-gray-50"
            >
              My Bookings
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

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Booking Status Banner */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${
                booking.status === 'confirmed' ? 'bg-green-500' :
                booking.status === 'pending' ? 'bg-amber-500' :
                'bg-red-500'
              }`}></span>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-700">
                {booking.status === 'confirmed' ? 'Confirmed' :
                 booking.status === 'pending' ? 'Pending Confirmation' :
                 'Cancelled'}
              </p>
            </div>
          </div>

          {/* Property Details */}
          <div className="p-8">
            <div className="flex items-start gap-8">
              <div className="w-32 h-32 flex-shrink-0">
                <img
                  src={booking.accommodations.images[0]?.url}
                  alt={booking.accommodations.name}
                  className="w-full h-full object-cover rounded-xl shadow-md"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#1B4965] mb-3">
                  {booking.accommodations.name}
                </h1>
                <p className="text-gray-600 flex items-center text-lg">
                  <LocationOutline
                    color={'#62B6CB'}
                    height="24px"
                    width="24px"
                    className="mr-2"
                  />
                  {booking.accommodations.location}
                </p>
              </div>
            </div>

            {/* Booking Details */}
            <div className="mt-10 border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-bold text-[#1B4965] mb-6">
                Booking Details
              </h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-[#F0F7FF] p-6 rounded-xl">
                  <p className="text-sm text-[#62B6CB] font-medium">Check-in</p>
                  <p className="text-lg font-semibold text-[#1B4965] mt-1">
                    {format(new Date(booking.start_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="bg-[#F0F7FF] p-6 rounded-xl">
                  <p className="text-sm text-[#62B6CB] font-medium">Check-out</p>
                  <p className="text-lg font-semibold text-[#1B4965] mt-1">
                    {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="bg-[#F0F7FF] p-6 rounded-xl">
                  <p className="text-sm text-[#62B6CB] font-medium">Total Price</p>
                  <p className="text-lg font-semibold text-[#1B4965] mt-1">
                    {formatTND(booking.total_price)}
                  </p>
                </div>
                <div className="bg-[#F0F7FF] p-6 rounded-xl">
                  <p className="text-sm text-[#62B6CB] font-medium">Booking ID</p>
                  <p className="text-lg font-semibold text-[#1B4965] mt-1">
                    {booking.id}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {booking.status === 'pending' && (
              <div className="mt-10 border-t border-gray-100 pt-8 space-y-4">
                <button 
                  className="w-full px-8 py-4 bg-gradient-to-r from-[#1B4965] to-[#62B6CB] text-white rounded-xl hover:from-[#62B6CB] hover:to-[#1B4965] transition-all duration-300 font-semibold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  onClick={async () => {
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) {
                        toast.error('Please login to make payment');
                        return;
                      }

                      if (booking.user_id !== user.id) {
                        toast.error('Unauthorized to make payment for this booking');
                        return;
                      }

                      // Here you would typically integrate with your payment provider
                      toast.success('Redirecting to payment gateway...');
                      // Add your payment logic here
                      
                    } catch (error) {
                      console.error('Error processing payment:', error);
                      toast.error('Failed to process payment');
                    }
                  }}
                >
                  Pay Now {formatTND(booking.total_price)}
                </button>

                <button 
                  className="w-full px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to cancel this booking?')) {
                      return;
                    }

                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) {
                        toast.error('Please login to cancel booking');
                        return;
                      }

                      if (booking.user_id !== user.id) {
                        toast.error('Unauthorized to cancel this booking');
                        return;
                      }

                      const { data } = await supabase
                        .from('bookings')
                        .select('*')
                        .eq('id', booking.id)
                        .single();

                      console.log('booking data', data)
                      
                      const { error } = await supabase
                        .from('bookings')
                        .update({ 
                          status: 'cancelled',
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', booking.id);
                      
                      if (error) throw error;
                      
                      toast.success('Booking cancelled successfully');
                      setBooking(prev => ({ ...prev, status: 'cancelled' }));
                      
                    } catch (error) {
                      console.error('Error cancelling booking:', error);
                      toast.error('Failed to cancel booking');
                    }
                  }}
                >
                  Cancel Booking
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingDetail 