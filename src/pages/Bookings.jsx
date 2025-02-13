import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../config/supabase'

const Bookings = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/auth')
        return
      }
      setUser(session.user)
    }

    fetchUser()
  }, [navigate])

  useEffect(() => {
    if (!user) return

    const fetchBookings = async () => {
      try {
        const { data: bookingsData, error } = await supabase
          .from('bookings')
          .select(`
            *,
            accommodations (
              name,
              location,
              images (url)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setBookings(bookingsData)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user])

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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-[#1B4965] mb-8">My Bookings</h1>
        
        <div className="grid gap-6">
          {bookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">You don't have any bookings yet.</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow overflow-hidden">
                <Link to={`/bookings/${booking.id}`} className="block hover:bg-gray-50 transition-colors">
                  <div className="p-6 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/4">
                      <img
                        src={booking.accommodations.images[0]?.url || '/placeholder.jpg'}
                        alt={booking.accommodations.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-[#1B4965] mb-2">
                        {booking.accommodations.name}
                      </h3>
                      <p className="text-gray-600 mb-4">{booking.accommodations.location}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Check-in</p>
                          <p className="font-medium">{new Date(booking.check_in_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Check-out</p>
                          <p className="font-medium">{new Date(booking.check_out_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Price</p>
                          <p className="font-medium">${booking.total_price}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className="font-medium capitalize">{booking.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Bookings 