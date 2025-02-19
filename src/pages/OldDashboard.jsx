import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { toast } from 'react-hot-toast'
import useAuthStore from '../stores/authStore'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { addDays, format } from 'date-fns'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { parse, startOfWeek, getDay } from 'date-fns'
import enUS from 'date-fns/locale/en-US'
import html2pdf from 'html2pdf.js'
import { Editor } from '@tinymce/tinymce-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'

const formatTND = (amount) => {
  return new Intl.NumberFormat('ar-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const locales = {
  'en-US': enUS
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const messages = {
  month: 'Month',
  week: 'Week',
  day: 'Day',
  today: 'Today',
  previous: 'Back',
  next: 'Next',
}

const getCurrentMonthNumber = () => {
  return (new Date().getMonth() + 1).toString(); // getMonth() returns 0-11, so we add 1
};

const calculatePayments = (totalPrice) => {
  const deposit = Math.round(totalPrice * 0.3); // 30% deposit
  const remaining = totalPrice - deposit; // 70% remaining
  return { deposit, remaining };
};

const Dashboard = () => {
  const navigate = useNavigate()
  const { role } = useAuthStore()

  const [activeTab, setActiveTab] = useState('overview')
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
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [bookingFilter, setBookingFilter] = useState('all')
  const [editingBooking, setEditingBooking] = useState(null)

  // Add this new state for view type
  const [viewType, setViewType] = useState('cards')

  // Add new state for settings
  const [settings, setSettings] = useState({
    facebook_verification_code: '',
    default_deposit_percentage: 30,
    cancellation_period_hours: 48,
    currencies: [],
    website_content: null
  });
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Add to your existing state declarations
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageFilter, setMessageFilter] = useState('all')

  // Add to your existing state declarations
  const [blogPosts, setBlogPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [postFormData, setPostFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    category_id: ''
  })

  // Add this state for properties
  const [allProperties, setAllProperties] = useState([]);
  const [websiteContent, setWebsiteContent] = useState(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Add new state for image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Add new state for receipt modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);

  // Add these to your existing state declarations
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Add these to your state declarations
  const [currentUser, setCurrentUser] = useState(null);

  // Add to your state declarations at the top
  const [rapportData, setRapportData] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageOccupancy: 0,
    propertyPerformance: [],
    monthlyRevenue: [],
    topProperties: []
  });

  // Add searchQuery to your state variables at the top of the component
  const [searchQuery, setSearchQuery] = useState('');

  // Add this near your other state declarations
  const [editorKey, setEditorKey] = useState(0); // Add this to force re-render when needed

  // Add this to your state declarations
  const [isSaving, setIsSaving] = useState(false);

  // Add this to your useEffect that fetches data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          setCurrentUser(profileData);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Add logout handler
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Redirect to login page or home page after logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  // Move saveSettings function to component level
  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      // Combine website content with other settings
      const updatedSettings = {
        ...settings,
        website_content: websiteContent,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('settings')
        .update(updatedSettings)
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Settings updated successfully');
      setIsEditingSettings(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle settings change
  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle currency operations
  const handleAddCurrency = () => {
    const newCurrency = {
      code: '',
      symbol: '',
      rate: 1,
      isDefault: settings.currencies.length === 0
    };
    handleSettingsChange('currencies', [...settings.currencies, newCurrency]);
  };

  const handleUpdateCurrency = (index, field, value) => {
    const updatedCurrencies = [...settings.currencies];
    updatedCurrencies[index] = {
      ...updatedCurrencies[index],
      [field]: value
    };
    handleSettingsChange('currencies', updatedCurrencies);
  };

  const handleRemoveCurrency = (index) => {
    const updatedCurrencies = settings.currencies.filter((_, i) => i !== index);
    handleSettingsChange('currencies', updatedCurrencies);
  };

  // Fetch website content from settings
  useEffect(() => {
    const fetchWebsiteContent = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          setWebsiteContent(data.website_content);
        }
      } catch (error) {
        console.error('Error fetching website content:', error);
        toast.error('Failed to load website content');
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchWebsiteContent();
  }, []);

  // Update properties count when allProperties changes
  useEffect(() => {
    if (allProperties?.length && websiteContent) {
      setWebsiteContent(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          properties: allProperties.length.toString()
        }
      }));
    }
  }, [allProperties]);

  const handleContentChange = (section, subsection, value) => {
    setWebsiteContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: value
      }
    }));
  };

  useEffect(() => {
    // set timeout to 5 seconds
      if (role !== 'admin') {
        navigate('/')
        return
      }

    const fetchData = async () => {
      try {
        // Modified query to use left join instead of inner join
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
          // Remove the .eq() filter since we want all listings regardless of prices
          
        if (listingsError) throw listingsError;

        // Transform the data to handle missing prices
        const transformedListings = listingsData.map(listing => ({
          ...listing,
          prices: listing.prices || [], // Ensure prices is at least an empty array
          current_price: listing.prices?.find(p => p.month === getCurrentMonthNumber())?.price_per_day || null
        }));

        setListings(transformedListings);

        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            accommodations (
              name,
              location,
              images (url)
            ),
            profiles (
              full_name,
              email,
              phone_number,
              address
            )
          `)
          .order('created_at', { ascending: false })

        if (bookingsError) throw bookingsError

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
            ),
            profiles (
              full_name,
              email,
              phone_number,
              address
            )
          `)
          .order('start_date', { ascending: true })

        if (bookingsError) throw bookingsError

        // Transform bookings for calendar
        const transformedBookings = bookingsData.map(booking => ({
          id: booking.id,
          title: `${booking.accommodations.name} - ${booking.profiles?.full_name || 'Guest'}`,
          start: new Date(booking.start_date),
          end: new Date(booking.end_date),
          status: booking.status,
          guest: booking.profiles || {
            full_name: 'Guest',
            email: '',
            phone_number: ''
          },
          accommodation: booking.accommodations,
          totalPrice: booking.total_price
        }))

        setCalendarBookings(transformedBookings)
        setBookings(bookingsData)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        toast.error('Failed to load bookings')
      }
    }

    fetchData()
    fetchAllBookings()
  }, [role, navigate])

  // Update the fetchSettings function
  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    }
  }

  // Add useEffect to fetch settings on component mount
  useEffect(() => {
    fetchSettings()
  }, [])

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
    setSelectedBooking({
      ...booking,
      startDate: booking.start,
      endDate: booking.end
    })
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
        <Calendar
          localizer={localizer}
          events={calendarBookings}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: getStatusColor(event.status),
              borderRadius: '4px'
            }
          })}
          onSelectEvent={(event) => {
            setSelectedBooking(event)
            setIsBookingModalOpen(true)
          }}
          views={['month', 'week', 'day']}
          defaultView="month"
          toolbar={true}
          popup={true}
          selectable={true}
          step={60}
          showMultiDayTimes={true}
          messages={messages}
          components={{
            toolbar: (props) => (
              <div className="rbc-toolbar">
                <span className="rbc-btn-group">
                  <button onClick={() => props.onNavigate('PREV')}>Back</button>
                  <button onClick={() => props.onNavigate('TODAY')}>Today</button>
                  <button onClick={() => props.onNavigate('NEXT')}>Next</button>
                </span>
                <span className="rbc-toolbar-label">{props.label}</span>
                <span className="rbc-btn-group">
                  {props.views.map(view => (
                    <button
                      key={view}
                      onClick={() => props.onView(view)}
                      className={`${view === props.view ? 'rbc-active' : ''}`}
                    >
                      {messages[view]}
                    </button>
                  ))}
                </span>
              </div>
            )
          }}
        />
      </div>

      {/* Bookings Lists */}
      <div className="space-y-6">
        {/* Today's Checkouts */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Today's Checkouts</h3>
          <div className="space-y-4">
            {bookings
              .filter(booking => {
                const endDate = new Date(booking.end_date);
                const today = new Date();
                // Reset time portions to compare dates only
                endDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                
                return endDate.getTime() === today.getTime() && 
                       (booking.status === 'confirmed' || booking.status === 'pending');
              })
              .map(booking => (
                <div
                  key={booking.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleBookingClick({
                    id: booking.id,
                    start: new Date(booking.start_date),
                    end: new Date(booking.end_date),
                    status: booking.status,
                    accommodation: booking.accommodations,
                    totalPrice: booking.total_price,
                    guest: booking.profiles
                  })}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-[#1B4965]">{booking.accommodations.name}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500 text-white">
                      Checkout Today
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Checkout: {format(new Date(booking.end_date), 'PP')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Guest: {booking.profiles.full_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Phone: {booking.profiles.phone_number}
                  </p>
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm font-medium text-gray-600">
                      Total Paid: {formatTND(booking.total_price)}
                    </p>
                    {booking.payed_amount && (
                      <>
                        <p className="text-sm text-gray-500">
                          Paid: {formatTND(booking.payed_amount)}
                          {booking.payed_amount_cash > 0 && (
                            <span className="ml-1 text-xs">
                              (Cash: {formatTND(booking.payed_amount_cash)})
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          Remaining: {formatTND(booking.total_price - booking.payed_amount)}
                        </p>
                      </>
                    )}
                    {booking.total_price - (booking.payed_amount || 0) > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCashPayment(booking);
                        }}
                        className="mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                      >
                        Add Cash Payment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {bookings.filter(booking => {
              const endDate = new Date(booking.end_date);
              const today = new Date();
              
              // Reset time portions to compare dates only
              endDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              
              return endDate.getTime() === today.getTime() && 
                     (booking.status === 'confirmed' || booking.status === 'pending');
            }).length === 0 && (
              <p className="text-gray-500 text-center py-4">No checkouts today</p>
            )}
          </div>
        </div>

        {/* Pending Bookings List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Pending Bookings</h3>
          <div className="space-y-4">
            {bookings
              .filter(booking => booking.status === 'pending')
              .map(booking => (
                <div
                  key={booking.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleBookingClick({
                    id: booking.id,
                    start: new Date(booking.start_date),
                    end: new Date(booking.end_date),
                    status: booking.status,
                    accommodation: booking.accommodations,
                    totalPrice: booking.total_price,
                    guest: booking.profiles
                  })}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-[#1B4965]">{booking.accommodations.name}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-[#FFC107] text-white">
                      Pending
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(booking.start_date), 'PP')} - {format(new Date(booking.end_date), 'PP')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {formatTND(booking.total_price)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Guest: {booking.profiles.full_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Phone: {booking.profiles.phone_number}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Email: {booking.profiles.email}
                  </p>
                 
                  {/* Add this right after the booking details, before the action buttons */}
                  {(() => {
                    const bookingDate = new Date(booking.created_at);
                    const currentDate = new Date();
                    const daysSinceBooking = Math.floor((currentDate - bookingDate) / (1000 * 60 * 60 * 24));
                    const showPaymentWarning = daysSinceBooking >= 3 && booking.status === 'pending';

                    return showPaymentWarning && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">
                          ⚠️ No payment has been received for this booking after 3 days. Please contact the guest to complete the payment.
                        </p>
                      </div>
                    );
                  })()}
                 
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVerifyBooking(booking.id)
                      }}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Verify
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelBooking(booking.id)
                      }}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            {bookings.filter(booking => booking.status === 'pending').length === 0 && (
              <p className="text-gray-500 text-center py-4">No pending bookings</p>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-[#1B4965]">
                  Booking Details
                </h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Property Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Property</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-[#1B4965]">{selectedBooking.accommodations?.name}</h5>
                  <p className="text-gray-600">{selectedBooking.accommodations?.location}</p>
                </div>
              </div>

              {/* Guest Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Guest Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedBooking.profiles?.full_name}</p>
                  <p><span className="font-medium">Email:</span> {selectedBooking.profiles?.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedBooking.profiles?.phone_number}</p>
                  <p><span className="font-medium">Address:</span> {selectedBooking.profiles?.address}</p>
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Booking Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="font-medium">Check-in:</span>{' '}
                    {format(new Date(selectedBooking.start_date), 'PPP')}
                  </p>
                  <p>
                    <span className="font-medium">Check-out:</span>{' '}
                    {format(new Date(selectedBooking.end_date), 'PPP')}
                  </p>
                  <p>
                    <span className="font-medium">Total Price:</span>{' '}
                    {formatTND(selectedBooking.total_price)}
                  </p>
                  {selectedBooking.payed_amount && (
                    <p>
                      <span className="font-medium">Amount Paid:</span>{' '}
                      {formatTND(selectedBooking.payed_amount)}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span 
                      className={`inline-block px-2 py-1 rounded-full text-sm text-white ml-2`}
                      style={{ backgroundColor: getStatusColor(selectedBooking.status) }}
                    >
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Payment Details</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {(() => {
                    const { deposit, remaining } = calculatePayments(selectedBooking.total_price);
                    return (
                      <>
                        <p><span className="font-medium">Deposit (30%):</span> {formatTND(deposit)}</p>
                        <p><span className="font-medium">Remaining (70%):</span> {formatTND(remaining)}</p>
                        <p><span className="font-medium">Total:</span> {formatTND(selectedBooking.total_price)}</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedBooking.status === 'pending' && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      handleVerifyBooking(selectedBooking.id);
                      setSelectedBooking(null);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Verify Booking
                  </button>
                  <button
                    onClick={() => {
                      handleCancelBooking(selectedBooking.id);
                      setSelectedBooking(null);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const handleDeleteListing = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        // First delete related records in other tables
        const { error: imagesError } = await supabase
          .from('images')
          .delete()
          .eq('accommodation_id', listingId);

        if (imagesError) throw imagesError;

        const { error: pricesError } = await supabase
          .from('prices')
          .delete()
          .eq('accommodation_id', listingId);

        if (pricesError) throw pricesError;

        // Finally delete the accommodation
        const { error: accommodationError } = await supabase
          .from('accommodations')
          .delete()
          .eq('id', listingId);

        if (accommodationError) throw accommodationError;

        // Update local state to remove the deleted listing
        setListings(prevListings => 
          prevListings.filter(listing => listing.id !== listingId)
        );

        toast.success('Listing deleted successfully');
      } catch (error) {
        console.error('Error deleting listing:', error);
        toast.error('Failed to delete listing');
      }
    }
  };

  const handleUpdateBooking = async (bookingId, updatedData) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          start_date: updatedData.start_date,
          end_date: updatedData.end_date,
          total_price: updatedData.total_price,
          payed_amount: updatedData.payed_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      // Update local state
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, 
                start_date: updatedData.start_date,
                end_date: updatedData.end_date,
                total_price: updatedData.total_price,
                payed_amount: updatedData.payed_amount
              }
            : booking
        )
      )

      setEditingBooking(null)
      toast.success('Booking updated successfully')
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('Failed to update booking')
    }
  }

  const getReceiptUrl = async (path) => {
    try {
      const { data, error } = await supabase.storage
        .from('booking-receipts')
        .getPublicUrl(path);
      
      if (error) throw error;
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting receipt URL:', error);
      return null;
    }
  };

  const handleReceiptUpload = async (path) => {
    try {
      const url = await getReceiptUrl(path);
      if (url) {
        setReceiptUrl(url);
        setIsReceiptModalOpen(true);
      } else {
        console.error('Failed to get receipt URL');
      }
    } catch (error) {
      console.error('Error uploading receipt:', error);
    }
  };
  

  // Modify the getFilteredBookings function
  const getFilteredBookings = () => {
    let filtered = bookings;
    
    // Apply status filter
    if (bookingFilter !== 'all') {
      if (bookingFilter === 'pending-payment') {
        filtered = filtered.filter(booking => {
          const bookingDate = new Date(booking.created_at);
          const currentDate = new Date();
          const daysSinceBooking = Math.floor((currentDate - bookingDate) / (1000 * 60 * 60 * 24));
          return daysSinceBooking >= 3 && booking.status === 'pending';
        });
      } else {
        filtered = filtered.filter(booking => booking.status === bookingFilter);
      }
    }
    
    // Apply search filter if there's a search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(booking => 
        booking.confirmation_code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }

  // Update the filtering section in renderBookingsContent
  const renderBookingsContent = () => (
    <div className="space-y-6">
      {/* Filtering and Search Section */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setBookingFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                bookingFilter === 'all'
                  ? 'bg-[#1B4965] text-white'
                  : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
              }`}
            >
              All Bookings
            </button>
            <button
              onClick={() => setBookingFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                bookingFilter === 'pending'
                  ? 'bg-[#FFC107] text-white'
                  : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setBookingFilter('confirmed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                bookingFilter === 'confirmed'
                  ? 'bg-[#4CAF50] text-white'
                  : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setBookingFilter('cancelled')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                bookingFilter === 'cancelled'
                  ? 'bg-[#F44336] text-white'
                  : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 min-w-[250px]">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search confirmation code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewType('cards')}
              className={`p-2 rounded-lg transition-colors ${
                viewType === 'cards'
                  ? 'bg-[#1B4965] text-white'
                  : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewType('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewType === 'table'
                  ? 'bg-[#1B4965] text-white'
                  : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Display */}
      {viewType === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredBookings().map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#1B4965]">
                        {booking.accommodations.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.accommodations.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.profiles.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.profiles.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(booking.start_date), 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {format(new Date(booking.end_date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatTND(booking.total_price)}
                      </div>
                      {booking.payed_amount && (
                        <>
                          <div className="text-sm text-gray-500">
                            Paid: {formatTND(booking.payed_amount)}
                            {booking.payed_amount_cash > 0 && (
                              <span className="ml-1 text-xs">
                                (Cash: {formatTND(booking.payed_amount_cash)})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Remaining: {formatTND(booking.total_price - booking.payed_amount)}
                          </div>
                        </>
                      )}
                      {booking.total_price - (booking.payed_amount || 0) > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCashPayment(booking);
                          }}
                          className="mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          Add Cash Payment
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.payment_method || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.receipt_url && (
                        <button 
                          onClick={() => handleReceiptUpload(booking.receipt_url)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Receipt
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const bookingDate = new Date(booking.created_at);
                        const currentDate = new Date();
                        const daysSinceBooking = Math.floor((currentDate - bookingDate) / (1000 * 60 * 60 * 24));
                        const showPaymentWarning = daysSinceBooking >= 3 && booking.status === 'pending';

                        return showPaymentWarning && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600 text-xs">
                              ⚠️ No payment received after 3 days
                            </p>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setIsBookingModalOpen(true)
                          }}
                          className="text-[#1B4965] hover:text-[#62B6CB]"
                        >
                          View
                        </button>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerifyBooking(booking.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredBookings().map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1B4965]">
                      {booking.accommodations.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {booking.accommodations.location}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium
                    ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-600">{booking.profiles.full_name}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">
                      {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-600">
                      Total: {formatTND(booking.total_price)}
                    </span>
                    {/* <div className="text-sm text-gray-500">
                        Paid: {formatTND(booking.payed_amount || 0)}
                      </div> */}
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-600">
                      Payment Method: {booking.payment_method}
                    </span>
                  </div>

                  {booking.payed_amount && (
                    <>
                    <div className="flex items-center space-x-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">
                        Paid: {formatTND(booking.payed_amount)}
                      </span>
                      <span className="text-gray-600">
                        Remaining: {formatTND(booking.total_price - booking.payed_amount)}
                      </span>

                    </div>
                    {booking.receipt_url && (
                    <div className="flex items-center space-x-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    <button onClick={() => handleReceiptUpload(booking.receipt_url)}>
                        <span className="text-blue-600 cursor-pointer">
                        View receipt
                        </span>
                    </button>
                    </div>
                    )}
                    </>
                  )}
                </div>

                {(() => {
                    const bookingDate = new Date(booking.created_at);
                    const currentDate = new Date();
                    const daysSinceBooking = Math.floor((currentDate - bookingDate) / (1000 * 60 * 60 * 24));
                    const showPaymentWarning = daysSinceBooking >= 3 && booking.status === 'pending';

                    return showPaymentWarning && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">
                          ⚠️ No payment has been received for this booking after 3 days. Please contact the guest to complete the payment.
                        </p>
                      </div>
                    );
                  })()}

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <button
                    onClick={() => {
                      setSelectedBooking(booking)
                      setIsBookingModalOpen(true)
                    }}
                    className="text-[#1B4965] hover:text-[#62B6CB] text-sm font-medium"
                  >
                    View Details
                  </button>
                  {booking.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVerifyBooking(booking.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {getFilteredBookings().length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No bookings found</p>
        </div>
      )}
    </div>
  )

  // Add this helper function near other utility functions
  const convertPrice = (priceInTND, rate) => {
    return (priceInTND * rate).toFixed(2)
  }

  const renderSettingsContent = () => {
    if (isLoadingContent) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
        </div>
      );
    }

    if (!websiteContent) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No website content found</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Hero Section Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Hero Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={websiteContent.hero.title}
                onChange={(e) => handleContentChange('hero', 'title', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={websiteContent.hero.subtitle}
                onChange={(e) => handleContentChange('hero', 'subtitle', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Stats Section Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Stats Section</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(websiteContent.stats).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleContentChange('stats', key, e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Us Section Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Why Choose Us Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={websiteContent.whyChooseUs.title}
                onChange={(e) => handleContentChange('whyChooseUs', 'title', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
              />
            </div>
            {websiteContent.whyChooseUs.features.map((feature, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Feature {index + 1}
                </label>
                <input
                  type="text"
                  value={feature.title}
                  onChange={(e) => {
                    const newFeatures = [...websiteContent.whyChooseUs.features];
                    newFeatures[index].title = e.target.value;
                    handleContentChange('whyChooseUs', 'features', newFeatures);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                  placeholder="Feature Title"
                />
                <textarea
                  value={feature.description}
                  onChange={(e) => {
                    const newFeatures = [...websiteContent.whyChooseUs.features];
                    newFeatures[index].description = e.target.value;
                    handleContentChange('whyChooseUs', 'features', newFeatures);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                  placeholder="Feature Description"
                  rows="2"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Reviews Section</h3>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={websiteContent.reviews.title}
                  onChange={(e) => handleContentChange('reviews', 'title', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={websiteContent.reviews.subtitle}
                  onChange={(e) => handleContentChange('reviews', 'subtitle', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-[#1B4965] mb-3">Testimonials</h4>
              {websiteContent.reviews.testimonials.map((testimonial, index) => (
                <div key={index} className="border rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={testimonial.name}
                      onChange={(e) => {
                        const newTestimonials = [...websiteContent.reviews.testimonials];
                        newTestimonials[index].name = e.target.value;
                        handleContentChange('reviews', 'testimonials', newTestimonials);
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={testimonial.country}
                      onChange={(e) => {
                        const newTestimonials = [...websiteContent.reviews.testimonials];
                        newTestimonials[index].country = e.target.value;
                        handleContentChange('reviews', 'testimonials', newTestimonials);
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      placeholder="Country"
                    />
                  </div>
                  <textarea
                    value={testimonial.text}
                    onChange={(e) => {
                      const newTestimonials = [...websiteContent.reviews.testimonials];
                      newTestimonials[index].text = e.target.value;
                      handleContentChange('reviews', 'testimonials', newTestimonials);
                    }}
                    className="w-full px-4 py-2 mt-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                    placeholder="Testimonial"
                    rows="3"
                  />
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-lg font-medium text-[#1B4965] mb-3">Review Stats</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(websiteContent.reviews.stats).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        const newStats = { ...websiteContent.reviews.stats };
                        newStats[key] = e.target.value;
                        handleContentChange('reviews', 'stats', newStats);
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Contact Information</h3>
          <div className="space-y-4">
            {Object.entries(websiteContent.contact.office).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const newOffice = { ...websiteContent.contact.office };
                    newOffice[key] = e.target.value;
                    handleContentChange('contact', 'office', newOffice);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Footer</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                About Text
              </label>
              <textarea
                value={websiteContent.footer.about}
                onChange={(e) => handleContentChange('footer', 'about', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-[#1B4965] mb-3">Quick Links</h4>
                {websiteContent.footer.quickLinks.map((link, index) => (
                  <div key={index} className="flex space-x-4 mb-2">
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => {
                        const newLinks = [...websiteContent.footer.quickLinks];
                        newLinks[index].title = e.target.value;
                        handleContentChange('footer', 'quickLinks', newLinks);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      placeholder="Link Title"
                    />
                    <input
                      type="text"
                      value={link.path}
                      onChange={(e) => {
                        const newLinks = [...websiteContent.footer.quickLinks];
                        newLinks[index].path = e.target.value;
                        handleContentChange('footer', 'quickLinks', newLinks);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      placeholder="Link Path"
                    />
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-lg font-medium text-[#1B4965] mb-3">Services</h4>
                {websiteContent.footer.services.map((service, index) => (
                  <div key={index} className="flex space-x-4 mb-2">
                    <input
                      type="text"
                      value={service.title}
                      onChange={(e) => {
                        const newServices = [...websiteContent.footer.services];
                        newServices[index].title = e.target.value;
                        handleContentChange('footer', 'services', newServices);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      placeholder="Service Title"
                    />
                    <input
                      type="text"
                      value={service.path}
                      onChange={(e) => {
                        const newServices = [...websiteContent.footer.services];
                        newServices[index].path = e.target.value;
                        handleContentChange('footer', 'services', newServices);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      placeholder="Service Path"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={isSavingSettings}
            className={`px-6 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors ${
              isSavingSettings ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSavingSettings ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save All Settings'
            )}
          </button>
        </div>
      </div>
    );
  };

  // Update the tabs section
  const renderTabs = () => (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1B4965] text-white"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
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

      {/* Sidebar */}
      <div className={`
        h-screen bg-[#1B4965] text-white w-64 fixed left-0 top-0 overflow-y-auto
        transform transition-transform duration-200 ease-in-out z-40
        lg:translate-x-0
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* User Profile Section */}
        <div className="p-6 border-b border-[#62B6CB] border-opacity-20">
          <div className="flex items-center space-x-3 mb-4">
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt="Profile"
                className="h-12 w-12 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <span className="text-xl font-semibold">
                  {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold truncate">
                {currentUser?.full_name || 'User'}
              </h2>
              <p className="text-xs text-gray-300 truncate">
                {currentUser?.email || ''}
              </p>
              <span className="inline-block px-2 py-1 text-xs text-blue-900 rounded-full bg-white bg-opacity-20 mt-1">
                {currentUser?.role || 'user'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-6 space-y-2">
          {/* Existing tab buttons */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 ${
              activeTab === 'overview'
                ? 'bg-white text-[#1B4965]'
                : 'hover:bg-[#62B6CB] hover:bg-opacity-20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Overview</span>
          </button>

          <button
          onClick={() => setActiveTab('rapport')}
          className={`w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 ${
            activeTab === 'rapport'
              ? 'bg-white text-[#1B4965]'
              : 'hover:bg-[#62B6CB] hover:bg-opacity-20'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Rapport</span>
        </button>

        <button
            onClick={() => setActiveTab('transactions')}
            className={`w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 ${
              activeTab === 'transactions'
                ? 'bg-white text-[#1B4965]'
                : 'hover:bg-[#62B6CB] hover:bg-opacity-20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Transactions</span>
          </button>


          <button
            onClick={() => setActiveTab('listings')}
            className={`w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 ${
              activeTab === 'listings'
                ? 'bg-white text-[#1B4965]'
                : 'hover:bg-[#62B6CB] hover:bg-opacity-20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Listings</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 ${
              activeTab === 'bookings'
                ? 'bg-white text-[#1B4965]'
                : 'hover:bg-[#62B6CB] hover:bg-opacity-20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Bookings</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 ${
              activeTab === 'calendar'
                ? 'bg-white text-[#1B4965]'
                : 'hover:bg-[#62B6CB] hover:bg-opacity-20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 ${
              activeTab === 'messages'
                ? 'bg-white text-[#1B4965]'
                : 'hover:bg-[#62B6CB] hover:bg-opacity-20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <span>Messages</span>
          </button>

          <button
            onClick={() => setActiveTab('blog')}
            className={`w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 ${
              activeTab === 'blog'
                ? 'bg-white text-[#1B4965]'
                : 'hover:bg-[#62B6CB] hover:bg-opacity-20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
            </svg>
            <span>Blog</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 ${
              activeTab === 'settings'
                ? 'bg-white text-[#1B4965]'
                : 'hover:bg-[#62B6CB] hover:bg-opacity-20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('checkouts')}
            className={`w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 ${
              activeTab === 'checkouts'
                ? 'bg-white text-[#1B4965]'
                : 'hover:bg-[#62B6CB] hover:bg-opacity-20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>Checkouts</span>
          </button>

          {/* Add 'users' to your tab options */}
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 ${
              activeTab === 'users'
                ? 'bg-white text-[#1B4965]'
                : 'hover:bg-[#62B6CB] hover:bg-opacity-20'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Users</span>
            </div>
          </button>

          {/* Add a divider before logout */}
          <div className="border-t border-[#62B6CB] border-opacity-20 my-4"></div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-lg font-medium text-left flex items-center space-x-3 text-red-300 hover:bg-red-500 hover:bg-opacity-20 hover:text-red-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </>
  )

  // Add this helper function near other utility functions
  const isAvailableToday = (listingId, bookings) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return !bookings.some(booking => {
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return booking.accommodation_id === listingId &&
             (booking.status === 'confirmed' || booking.status === 'pending') &&
             startDate <= today &&
             endDate >= today;
    });
  };

  // Add this to your useEffect that fetches data
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    }
  }

  // Add fetchMessages to your existing useEffect
  useEffect(() => {
    // ... existing fetch calls ...
    fetchMessages()
  }, [])

  // Add these helper functions
  const handleUpdateMessageStatus = async (messageId, newStatus) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status: newStatus })
        .eq('id', messageId)

      if (error) throw error

      setMessages(prevMessages =>
        prevMessages.map(message =>
          message.id === messageId
            ? { ...message, status: newStatus }
            : message
        )
      )

      toast.success(`Message marked as ${newStatus}`)
    } catch (error) {
      console.error('Error updating message status:', error)
      toast.error('Failed to update message status')
    }
  }

  const getFilteredMessages = () => {
    if (messageFilter === 'all') return messages
    return messages.filter(message => message.status === messageFilter)
  }

  // Add this new render function
  const renderMessagesContent = () => (
    <div className="space-y-6">
      {/* Filtering options */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setMessageFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              messageFilter === 'all'
                ? 'bg-[#1B4965] text-white'
                : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
            }`}
          >
            All Messages
          </button>
          <button
            onClick={() => setMessageFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              messageFilter === 'pending'
                ? 'bg-[#FFC107] text-white'
                : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setMessageFilter('read')}
            className={`px-4 py-2 rounded-lg ${
              messageFilter === 'read'
                ? 'bg-[#62B6CB] text-white'
                : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
            }`}
          >
            Read
          </button>
          <button
            onClick={() => setMessageFilter('responded')}
            className={`px-4 py-2 rounded-lg ${
              messageFilter === 'responded'
                ? 'bg-[#4CAF50] text-white'
                : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
            }`}
          >
            Responded
          </button>
        </div>
      </div>

      {/* Messages list */}
      <div className="grid gap-6">
        {getFilteredMessages().map((message) => (
          <div
            key={message.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#1B4965]">
                    {message.subject}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    From: {message.name} ({message.email})
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    message.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : message.status === 'read'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 line-clamp-2">{message.message}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {new Date(message.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                
                <div className="flex space-x-3">
                  {message.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateMessageStatus(message.id, 'read')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark as Read
                    </button>
                  )}
                  {(message.status === 'pending' || message.status === 'read') && (
                    <button
                      onClick={() => handleUpdateMessageStatus(message.id, 'responded')}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      Mark as Responded
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedMessage(message)
                      setIsMessageModalOpen(true)
                    }}
                    className="text-sm text-[#1B4965] hover:text-[#62B6CB]"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {getFilteredMessages().length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages found</p>
          </div>
        )}
      </div>

      {/* Message Details Modal */}
      {isMessageModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-[#1B4965]">
                  Message Details
                </h3>
                <button
                  onClick={() => {
                    setSelectedMessage(null)
                    setIsMessageModalOpen(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Message Content */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">From</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-[#1B4965]">{selectedMessage.name}</p>
                    <p className="text-gray-600">{selectedMessage.email}</p>
                    {selectedMessage.phone && (
                      <p className="text-gray-600">{selectedMessage.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Subject</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-[#1B4965]">{selectedMessage.subject}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Message</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p>
                      <span className="font-medium">Received:</span>{' '}
                      {new Date(selectedMessage.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`inline-block px-2 py-1 rounded-full text-sm text-white ml-2 ${
                        selectedMessage.status === 'pending'
                          ? 'bg-yellow-500'
                          : selectedMessage.status === 'read'
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                      }`}>
                        {selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                {selectedMessage.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleUpdateMessageStatus(selectedMessage.id, 'read')
                      setIsMessageModalOpen(false)
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mark as Read
                  </button>
                )}
                {(selectedMessage.status === 'pending' || selectedMessage.status === 'read') && (
                  <button
                    onClick={() => {
                      handleUpdateMessageStatus(selectedMessage.id, 'responded')
                      setIsMessageModalOpen(false)
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark as Responded
                  </button>
                )}
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="flex-1 px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] text-center"
                >
                  Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Add to your useEffect that fetches data
  useEffect(() => {
    // ... existing fetch calls ...
    fetchBlogPosts()
    fetchCategories()
  }, [])

  // Add these new functions
  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBlogPosts(data)
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      toast.error('Failed to load blog posts')
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!postFormData.cover_image) {
      toast.error('Please upload a cover image');
      return;
    }
    try {
      const { data: userData } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([
          {
            ...postFormData,
            author_id: userData.user.id,
            slug: postFormData.slug || postFormData.title.toLowerCase().replace(/ /g, '-')
          }
        ])
        .select()

      if (error) throw error

      setBlogPosts([...blogPosts, data[0]])
      setIsNewPostModalOpen(false)
      setPostFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image: '',
        category_id: ''
      })
      toast.success('Blog post created successfully')
    } catch (error) {
      console.error('Error creating blog post:', error)
      toast.error('Failed to create blog post')
    }
  }

  const handleUpdatePost = async (e) => {
    e.preventDefault()
    if (!postFormData.cover_image) {
      toast.error('Please upload a cover image');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .update({
          ...postFormData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id)
        .select()

      if (error) throw error

      setBlogPosts(blogPosts.map(post => 
        post.id === editingPost.id ? data[0] : post
      ))
      setEditingPost(null)
      setPostFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image: '',
        category_id: ''
      })
      toast.success('Blog post updated successfully')
    } catch (error) {
      console.error('Error updating blog post:', error)
      toast.error('Failed to update blog post')
    }
  }

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', postId)

        if (error) throw error

        setBlogPosts(blogPosts.filter(post => post.id !== postId))
        toast.success('Blog post deleted successfully')
      } catch (error) {
        console.error('Error deleting blog post:', error)
        toast.error('Failed to delete blog post')
      }
    }
  }

  // Add the blog content renderer
  const renderBlogContent = () => (
    <div className="space-y-6">
      {/* Add New Post Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#1B4965]">Blog Posts</h2>
        <button
          onClick={() => setIsNewPostModalOpen(true)}
          className="px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors"
        >
          Create New Post
        </button>
      </div>

      {/* Blog Posts List */}
      <div className="grid gap-6">
        {blogPosts.map(post => (
          <div
            key={post.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-[#1B4965]">
                    {post.title}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-blue-100 text-[#1B4965] text-sm font-medium rounded-full">
                      {post.categories.name}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {format(new Date(post.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingPost(post)
                      setPostFormData({
                        title: post.title,
                        slug: post.slug,
                        excerpt: post.excerpt,
                        content: post.content,
                        cover_image: post.cover_image,
                        category_id: post.category_id
                      })
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="mt-4 text-gray-600">{post.excerpt}</p>
            </div>
          </div>
        ))}
      </div>

      {/* New Post Modal */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 bg-black/25 bg-opacity-50 overflow-y-auto p-4">
          <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8">
              <h2 className="text-2xl font-bold text-[#1B4965] mb-6">Create New Blog Post</h2>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={postFormData.title}
                    onChange={(e) => setPostFormData({
                      ...postFormData,
                      title: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/ /g, '-')
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={postFormData.slug}
                    onChange={(e) => setPostFormData({
                      ...postFormData,
                      slug: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={postFormData.category_id}
                    onChange={(e) => setPostFormData({
                      ...postFormData,
                      category_id: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image
                  </label>
                  <div className="space-y-2">
                    {/* Image preview */}
                    {(imagePreview || postFormData.cover_image) && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden">
                        <img
                          src={imagePreview || postFormData.cover_image}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                            setPostFormData(prev => ({ ...prev, cover_image: '' }));
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {/* Upload button */}
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {isUploading ? 'Uploading...' : 'Choose Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                      {isUploading && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1B4965]"></div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excerpt
                  </label>
                  <textarea
                    value={postFormData.excerpt}
                    onChange={(e) => setPostFormData({
                      ...postFormData,
                      excerpt: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={postFormData.content}
                    onChange={(e) => setPostFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="10"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsNewPostModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB]"
                  >
                    Create Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {(isNewPostModalOpen || editingPost) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#1B4965]">
                {editingPost ? 'Edit Blog Post' : 'New Blog Post'}
              </h3>
              <button
                onClick={() => {
                  setIsNewPostModalOpen(false);
                  setEditingPost(null);
                  setPostFormData({
                    title: '',
                    slug: '',
                    excerpt: '',
                    content: '',
                    cover_image: '',
                    category_id: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Form fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={postFormData.title}
                    onChange={(e) => setPostFormData({ ...postFormData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={postFormData.slug}
                    onChange={(e) => setPostFormData({ ...postFormData, slug: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excerpt
                  </label>
                  <textarea
                    value={postFormData.excerpt}
                    onChange={(e) => setPostFormData({ ...postFormData, excerpt: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={postFormData.content}
                    onChange={(e) => setPostFormData({ ...postFormData, content: e.target.value })}
                    rows="12"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                    placeholder="Write your blog post content here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={postFormData.category_id}
                    onChange={(e) => setPostFormData({ ...postFormData, category_id: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    {/* Show either the new image preview or the existing cover image */}
                    {(imagePreview || postFormData.cover_image) && (
                      <img
                        src={imagePreview || postFormData.cover_image}
                        alt="Cover preview"
                        className="h-32 w-32 object-cover rounded-lg"
                      />
                    )}
                    <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <span className="text-sm font-medium text-gray-600">
                        {imageFile || postFormData.cover_image ? 'Change Image' : 'Upload Image'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    {/* Add remove button if there's an image */}
                    {(imagePreview || postFormData.cover_image) && (
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setPostFormData(prev => ({ ...prev, cover_image: '' }));
                        }}
                        className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsNewPostModalOpen(false);
                  setEditingPost(null);
                  setPostFormData({
                    title: '',
                    slug: '',
                    excerpt: '',
                    content: '',
                    cover_image: '',
                    category_id: ''
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePost}
                disabled={isSaving}
                className={`px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] ${
                  isSaving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Add this new render function
  const renderCheckoutsContent = () => (
    <div className="space-y-6">
      {/* Today's Checkouts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#1B4965]">Today's Checkouts</h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {bookings.filter(booking => {
              const endDate = new Date(booking.end_date)
              const today = new Date()
              return endDate.toDateString() === today.toDateString() && 
                     (booking.status === 'confirmed' || booking.status === 'pending')
            }).length} checkouts
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings
            .filter(booking => {
              const endDate = new Date(booking.end_date)
              const today = new Date()
              return endDate.toDateString() === today.toDateString() && 
                     (booking.status === 'confirmed' || booking.status === 'pending')
            })
            .map(booking => (
              <div
                key={booking.id}
                className="border rounded-lg p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleBookingClick({
                  id: booking.id,
                  start: new Date(booking.start_date),
                  end: new Date(booking.end_date),
                  status: booking.status,
                  accommodation: booking.accommodations,
                  totalPrice: booking.total_price,
                  guest: booking.profiles
                })}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-[#1B4965] mb-1">{booking.accommodations.name}</h4>
                    <p className="text-sm text-gray-600">{booking.accommodations.location}</p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500 text-white">
                    Checkout Today
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="border-t pt-3">
                    <h5 className="text-sm font-medium text-[#1B4965] mb-2">Guest Information</h5>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Name:</span> {booking.profiles.full_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span> {booking.profiles.phone_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {booking.profiles.email}
                    </p>
                  </div>
                  
                  <div className="border-t pt-3">
                    <h5 className="text-sm font-medium text-[#1B4965] mb-2">Booking Details</h5>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Check-in:</span>{' '}
                      {format(new Date(booking.start_date), 'PP')}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Check-out:</span>{' '}
                      {format(new Date(booking.end_date), 'PP')}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Total Paid:</span>{' '}
                      {formatTND(booking.total_price)}
                    </p>
                  </div>
                </div>
                
                <button
                  className="w-full mt-4 px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add your checkout completion logic here
                    toast.success(`Checkout completed for ${booking.profiles.full_name}`);
                  }}
                >
                  Complete Checkout
                </button>
              </div>
            ))}
        </div>
        
        {bookings.filter(booking => {
          const endDate = new Date(booking.end_date)
          const today = new Date()
          return endDate.toDateString() === today.toDateString() && 
                 (booking.status === 'confirmed' || booking.status === 'pending')
        }).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No checkouts scheduled for today</p>
          </div>
        )}
      </div>
      
      {/* Upcoming Checkouts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-[#1B4965] mb-6">Upcoming Checkouts</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3 text-gray-600">Property</th>
                <th className="pb-3 text-gray-600">Guest</th>
                <th className="pb-3 text-gray-600">Check-in</th>
                <th className="pb-3 text-gray-600">Check-out</th>
                <th className="pb-3 text-gray-600">Amount</th>
                <th className="pb-3 text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .filter(booking => {
                  const endDate = new Date(booking.end_date)
                  const today = new Date()
                  return endDate > today && (booking.status === 'confirmed' || booking.status === 'pending')
                })
                .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
                .map(booking => (
                  <tr 
                    key={booking.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleBookingClick({
                      id: booking.id,
                      start: new Date(booking.start_date),
                      end: new Date(booking.end_date),
                      status: booking.status,
                      accommodation: booking.accommodations,
                      totalPrice: booking.total_price,
                      guest: booking.profiles
                    })}
                  >
                    <td className="py-4">{booking.accommodations.name}</td>
                    <td className="py-4">{booking.profiles.full_name}</td>
                    <td className="py-4">{format(new Date(booking.start_date), 'PP')}</td>
                    <td className="py-4">{format(new Date(booking.end_date), 'PP')}</td>
                    <td className="py-4">{formatTND(booking.total_price)}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // Add this to your existing useEffect or create a new one
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('accommodations')
          .select('*');

        if (error) throw error;
        setAllProperties(data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast.error('Failed to load properties');
      }
    };

    fetchProperties();
  }, []);

  // Add image upload handler
  const handleImageUpload = async (file) => {
    try {
      setIsUploading(true);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      // Update form data with the image URL
      setPostFormData(prev => ({
        ...prev,
        cover_image: data.publicUrl
      }));

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Add image preview handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      handleImageUpload(file);
    }
  };

  const renderListingsContent = () => (
    <div className="space-y-6">
      {/* View Toggle and Actions Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* View Toggle Buttons */}
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setListingView('grid')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                listingView === 'grid'
                  ? 'bg-[#1B4965] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setListingView('table')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                listingView === 'table'
                  ? 'bg-[#1B4965] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Add Listing Button */}
        <Link
          to="/add-listing"
          className="px-6 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add New Listing</span>
        </Link>
      </div>

      {/* Listing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Listings</h4>
          <p className="text-2xl font-bold text-[#1B4965]">{listings.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Available Now</h4>
          <p className="text-2xl font-bold text-green-600">
            {listings.filter(listing => isAvailableToday(listing.id, bookings)).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Average Daily Rate</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {formatTND(
              listings.reduce((acc, listing) => 
                acc + ((listing.prices && listing.prices[0]?.price_per_day) || 0), 
                0
              ) / (listings.length || 1)  // Prevent division by zero
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Revenue</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {formatTND(
              bookings
                .filter(booking => booking.status === 'confirmed')
                .reduce((acc, booking) => acc + booking.total_price, 0)
            )}
          </p>
        </div>
      </div>

      {/* Listings Content */}
      {listingView === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Listing Image */}
              <div className="aspect-w-16 aspect-h-9 relative">
                <img
                  src={(listing.images && listing.images[0]?.url) || '/placeholder-property.jpg'}
                  alt={listing.name}
                  className="object-cover w-full h-48"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAvailableToday(listing.id, bookings)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isAvailableToday(listing.id, bookings) ? 'Available' : 'Occupied'}
                  </span>
                </div>
              </div>

              {/* Listing Details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1B4965] mb-1">
                      {listing.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{listing.location}</p>
                  </div>
                  <p className="text-lg font-bold text-[#1B4965]">
                    {formatTND((listing.prices && listing.prices[0]?.price_per_day) || 0)}
                    <span className="text-sm text-gray-500">/night</span>
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="font-semibold text-[#1B4965]">{listing.bedrooms || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="font-semibold text-[#1B4965]">{listing.bathrooms || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-semibold text-[#1B4965]">{listing.guests || 0}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Link
                    to={`/edit-listing/${listing.id}`}
                    className="flex-1 px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors text-center"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Table View
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price/Night
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={(listing.images && listing.images[0]?.url) || '/placeholder-property.jpg'}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[#1B4965]">
                            {listing.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{listing.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#1B4965]">
                        {formatTND((listing.prices && listing.prices[0]?.price_per_day) || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isAvailableToday(listing.id, bookings)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isAvailableToday(listing.id, bookings) ? 'Available' : 'Occupied'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="font-medium">{listing.bedrooms}</span> beds
                        </div>
                        <div>
                          <span className="font-medium">{listing.bathrooms}</span> baths
                        </div>
                        <div>
                          <span className="font-medium">{listing.guests}</span> guests
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link
                          to={`/edit-listing/${listing.id}`}
                          className="text-[#1B4965] hover:text-[#62B6CB]"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {listings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No listings found</p>
          <Link
            to="/add-listing"
            className="inline-block mt-4 px-6 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors"
          >
            Add Your First Listing
          </Link>
        </div>
      )}
    </div>
  )

  // Add this state near your other state declarations
  const [listingView, setListingView] = useState('table');

  // Add the rapport content renderer
  const handleExportPDF = () => {
    const rapport = document.getElementById('rapport-content');
    const opt = {
      margin: 1,
      filename: `rapport-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // Show loading toast
    const loadingToast = toast.loading('Generating PDF...');

    html2pdf().from(rapport).set(opt).save()
      .then(() => {
        toast.dismiss(loadingToast);
        toast.success('Rapport exported successfully!');
      })
      .catch(error => {
        toast.dismiss(loadingToast);
        toast.error('Failed to export rapport');
        console.error('PDF export error:', error);
      });
  };

  const renderRapportContent = () => (
    <div className="space-y-8">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors flex items-center space-x-2"
          style={{ backgroundColor: '#1B4965' }}
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <span>Export PDF</span>
        </button>
      </div>

      {/* Rapport Content - Add id for PDF export */}
      <div id="rapport-content" className="space-y-8" style={{ color: '#000000' }}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Total Revenue</h3>
              <span className="text-green-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-[#1B4965]">
              {formatTND(rapportData.totalRevenue)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Total Bookings</h3>
              <span className="text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-[#1B4965]">
              {rapportData.totalBookings}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-medium">Average Occupancy</h3>
              <span className="text-yellow-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-[#1B4965]">
              {rapportData.averageOccupancy}%
            </p>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-[#1B4965] mb-6">Monthly Revenue</h3>
          <div className="h-80">
            <div className="flex h-full items-end space-x-2">
              {rapportData.monthlyRevenue.map((data, index) => {
                // Find the maximum revenue for scaling
                const maxRevenue = Math.max(...rapportData.monthlyRevenue.map(d => d.revenue));
                // Calculate height percentage (minimum 1% to show bar even when 0)
                const heightPercentage = maxRevenue > 0 
                  ? (data.revenue / maxRevenue) * 100 
                  : 0;

                console.log(heightPercentage);
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center h-[100%]"
                  >
                    <div className="w-full flex flex-col justify-end h-[calc(100%-2rem)]">
                      <div 
                        className="w-full bg-[#62B6CB] rounded-t transition-all duration-500 ease-in-out"
                        style={{ 
                          height: `${heightPercentage}%`,
                          minHeight: data.revenue > 0 ? '8px' : '0px'
                        }}
                      />
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 transform -rotate-45 origin-top-left whitespace-nowrap">
                        {data.month}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTND(data.revenue)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Performing Properties */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-[#1B4965] mb-6">Top Performing Properties</h3>
          <div className="space-y-6">
            {rapportData.topProperties.map((property, index) => (
              <div key={property.id} className="flex items-center">
                <div className="flex-shrink-0 w-8 text-gray-500">{index + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-[#1B4965]">{property.name}</span>
                    <span className="text-gray-500">{formatTND(property.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#1B4965] rounded-full h-2"
                      style={{ width: `${property.occupancyRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-sm text-gray-500">
                    <span>{property.bookings} bookings</span>
                    <span>{property.occupancyRate}% occupancy</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Performance Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-[#1B4965]">Property Performance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy Rate</th>
                </tr>
              </thead>
              <tbody>
                {rapportData.propertyPerformance.map((property) => (
                  <tr key={property.id} className="border-t">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.bookings}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTND(property.revenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                          <div
                            className="bg-[#1B4965] rounded-full h-2"
                            style={{ width: `${property.occupancyRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{property.occupancyRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Add this to your useEffect that fetches data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .order('updated_at', { ascending: false });

        if (userError) throw userError;
        setUsers(userData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      }
    };

    fetchUsers();
  }, []);

  // Replace handleUpdateUserStatus with handleUpdateUserRole
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      // Check if current user has permission to assign this role
      const { data: currentUserData } = await supabase.auth.getUser();
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUserData.user.id)
        .single();

      if (newRole === 'top_admin' && currentUserProfile.role !== 'top_admin') {
        toast.error('Only Top Administrators can assign Top Admin role');
        return;
      }

      if (newRole === 'admin' && !['top_admin', 'admin'].includes(currentUserProfile.role)) {
        toast.error('You do not have permission to assign Admin role');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      toast.success(`User role updated to ${newRole} successfully`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  // Add this function to render the users content
  const renderUsersContent = () => (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#1B4965]">Users Management</h2>
        <div className="flex space-x-4">
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4965]"
          >
            <option value="all">All Users</option>
            <option value="top_admin">Top Administrators</option>
            <option value="admin">Administrators</option>
            <option value="receptionist">Receptionists</option>
            <option value="manager">Managers</option>
            <option value="user">Regular Users</option>
          </select>
        </div>
      </div>

      {/* Users Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Users</h4>
          <p className="text-2xl font-bold text-[#1B4965]">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Top Admins</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {users.filter(user => user.role === 'top_admin').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Administrators</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {users.filter(user => user.role === 'admin').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Receptionists</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {users.filter(user => user.role === 'receptionist').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Regular Users</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {users.filter(user => user.role === 'user').length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users
                .filter(user => {
                  if (userFilter === 'active') return user.is_active;
                  if (userFilter === 'inactive') return !user.is_active;
                  if (userFilter === 'top_admin') return user.role === 'top_admin';
                  if (userFilter === 'admin') return user.role === 'admin';
                  if (userFilter === 'receptionist') return user.role === 'receptionist';
                  if (userFilter === 'manager') return user.role === 'manager';
                  if (userFilter === 'user') return user.role === 'user';
                  return true;
                })
                .map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.avatar_url}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-[#1B4965] flex items-center justify-center">
                              <span className="text-white text-lg">
                                {user.full_name?.charAt(0) || user.email?.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.username || 'No username'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'top_admin' 
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'receptionist'
                          ? 'bg-yellow-100 text-yellow-800'
                          : user.role === 'manager'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(user.updated_at), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        {/* <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsUserModalOpen(true);
                          }}
                          className="text-[#1B4965] hover:text-[#62B6CB]"
                        >
                          View
                        </button> */}
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                          className="text-sm border-none bg-transparent text-[#1B4965] hover:text-[#62B6CB] cursor-pointer focus:outline-none focus:ring-0"
                        >
                          <option value="user">User</option>
                          <option value="receptionist">Receptionist</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          {currentUser.role === 'top_admin' && (
                            <option value="top_admin">Top Admin</option>
                          )}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && isUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold text-[#1B4965]">User Details</h3>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setIsUserModalOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                {selectedUser.avatar_url ? (
                  <img
                    src={selectedUser.avatar_url}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-[#1B4965] flex items-center justify-center">
                    <span className="text-white text-2xl">
                      {selectedUser.full_name?.charAt(0) || selectedUser.email?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{selectedUser.full_name}</h4>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Username</h5>
                  <p className="text-gray-900">{selectedUser.username || 'Not set'}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h5>
                  <p className="text-gray-900">{selectedUser.phone_number || 'Not set'}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Role</h5>
                  <p className="text-gray-900">{selectedUser.role}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Status</h5>
                  <p className="text-gray-900">{selectedUser.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Joined Date</h5>
                  <p className="text-gray-900">{format(new Date(selectedUser.created_at), 'PP')}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h5>
                  <p className="text-gray-900">
                    {selectedUser.updated_at ? format(new Date(selectedUser.updated_at), 'PP') : 'Never'}
                  </p>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-1">Address</h5>
                <p className="text-gray-900">{selectedUser.address || 'No address provided'}</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-500">Role:</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => handleUpdateUserRole(selectedUser.id, e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4965]"
                  >
                    <option value="user">User</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    {currentUser.role === 'top_admin' && (
                      <option value="top_admin">Top Admin</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Add to your useEffect that fetches data
  useEffect(() => {
    const calculateRapportData = () => {
      // Calculate total revenue from confirmed bookings
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
      const revenue = confirmedBookings.reduce((acc, b) => acc + b.total_price, 0);

      // Calculate monthly revenue for the last 12 months
      const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const monthBookings = confirmedBookings.filter(b => {
          const bookingDate = new Date(b.created_at);
          return (
            bookingDate.getMonth() === date.getMonth() && 
            bookingDate.getFullYear() === date.getFullYear()
          );
        });

        const monthRevenue = monthBookings.reduce((acc, b) => acc + (b.total_price || 0), 0);

        return {
          month: format(date, 'MMM yyyy'),
          revenue: monthRevenue
        };
      }).reverse();

      // Log the monthly revenue data to debug
      console.log('Monthly Revenue Data:', monthlyRevenue);

      // Calculate property performance
      const propertyPerformance = listings.map(listing => {
        const propertyBookings = bookings.filter(b => 
          b.accommodation_id === listing.id && b.status === 'confirmed'
        );
        return {
          id: listing.id,
          name: listing.name,
          bookings: propertyBookings.length,
          revenue: propertyBookings.reduce((acc, b) => acc + b.total_price, 0),
          occupancyRate: Math.round((propertyBookings.length / bookings.length) * 100) || 0
        };
      });

      // Sort properties by revenue to get top performers
      const topProperties = [...propertyPerformance]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setRapportData(prevData => ({
        ...prevData,
        totalRevenue: revenue,
        totalBookings: bookings.filter(b => b.status === 'confirmed').length,
        averageOccupancy: Math.round(
          propertyPerformance.reduce((acc, p) => acc + p.occupancyRate, 0) / 
          propertyPerformance.length
        ),
        propertyPerformance,
        monthlyRevenue,
        topProperties
      }));
    };

    calculateRapportData();
  }, [bookings, listings]);

  // Add this function before the return statement
  const renderOverviewContent = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Bookings</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {bookings.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Active Listings</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {listings.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Revenue</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {formatTND(
              bookings
                .filter(booking => booking.status === 'confirmed')
                .reduce((acc, booking) => acc + booking.total_price, 0)
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Today's Checkouts</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {bookings.filter(booking => {
              const endDate = new Date(booking.end_date)
              const today = new Date()
              return endDate.toDateString() === today.toDateString()
            }).length}
          </p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-[#1B4965]">Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5)
                .map(booking => (
                  <tr 
                    key={booking.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleBookingClick(booking)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.profiles.full_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.accommodations.name}</div>
                      <div className="text-sm text-gray-500">{booking.accommodations.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(booking.start_date), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(booking.end_date), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTND(booking.total_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-[#1B4965] mb-6">Today's Schedule</h3>
        <div className="space-y-4">
          {bookings
            .filter(booking => {
              const startDate = new Date(booking.start_date)
              const endDate = new Date(booking.end_date)
              const today = new Date()
              return (
                startDate.toDateString() === today.toDateString() ||
                endDate.toDateString() === today.toDateString()
              )
            })
            .map(booking => (
              <div
                key={booking.id}
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleBookingClick(booking)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      new Date(booking.start_date).toDateString() === new Date().toDateString()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {new Date(booking.start_date).toDateString() === new Date().toDateString()
                        ? 'Check-in'
                        : 'Check-out'
                      }
                    </span>
                    <span className="font-medium text-[#1B4965]">{booking.profiles.full_name}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {booking.accommodations.name} - {booking.accommodations.location}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(booking.start_date), 'PP')} - {format(new Date(booking.end_date), 'PP')}
                </div>
              </div>
            ))}
          
          {bookings.filter(booking => {
            const startDate = new Date(booking.start_date)
            const endDate = new Date(booking.end_date)
            const today = new Date()
            return (
              startDate.toDateString() === today.toDateString() ||
              endDate.toDateString() === today.toDateString()
            )
          }).length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500">No check-ins or check-outs scheduled for today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Add this new function to render transactions content
  const renderTransactionsContent = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Transactions</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {bookings.filter(b => b.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Revenue</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {formatTND(
              bookings
                .filter(b => b.status === 'confirmed')
                .reduce((acc, b) => acc + b.total_price, 0)
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Average Transaction</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {formatTND(
              bookings.filter(b => b.status === 'confirmed').length > 0
                ? bookings
                    .filter(b => b.status === 'confirmed')
                    .reduce((acc, b) => acc + b.total_price, 0) /
                  bookings.filter(b => b.status === 'confirmed').length
                : 0
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Pending Transactions</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {bookings.filter(b => b.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold text-[#1B4965]">Transaction History</h3>
          <div className="flex space-x-4">
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4965]"
              onChange={(e) => {
                // Add filter functionality here
                console.log(e.target.value);
              }}
            >
              <option value="all">All Transactions</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={() => {
                // Add export functionality here
                console.log('Export transactions');
              }}
              className="px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map(booking => (
                  <tr key={booking.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{booking.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.profiles.full_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.accommodations.name}</div>
                      <div className="text-sm text-gray-500">{booking.accommodations.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(booking.created_at), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTND(booking.total_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          // Add view receipt functionality
                          if (booking.receipt_url) {
                            setReceiptUrl(booking.receipt_url);
                            setIsReceiptModalOpen(true);
                          } else {
                            toast.error('No receipt available');
                          }
                        }}
                        className="text-[#1B4965] hover:text-[#62B6CB]"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Add this new function to handle cash payments
  const handleCashPayment = async (booking) => {
    const remainingAmount = booking.total_price - (booking.payed_amount || 0);
    
    // Prompt for cash payment amount
    const cashAmount = window.prompt(
      `Remaining amount: ${formatTND(remainingAmount)}\nEnter cash payment amount:`
    );

    // Validate input
    if (cashAmount === null) return; // User cancelled
    
    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > remainingAmount) {
      toast.error(`Amount cannot exceed the remaining balance of ${formatTND(remainingAmount)}`);
      return;
    }

    try {
      const newPayedAmount = (Number(booking.payed_amount) || 0) + amount;
      console.log('booking.payed_amount',Number(booking.payed_amount));
      console.log('amount',amount);
      console.log('newPayedAmount',newPayedAmount);  
      const { error } = await supabase
        .from('bookings')
        .update({ 
          payed_amount_cash: (booking.payed_amount_cash || 0) + amount,
          payed_amount: newPayedAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      // Update local state
      setBookings(prevBookings =>
        prevBookings.map(b =>
          b.id === booking.id
            ? {
                ...b,
                payed_amount_cash: (b.payed_amount_cash || 0) + amount,
                payed_amount: newPayedAmount
              }
            : b
        )
      );

      toast.success(`Cash payment of ${formatTND(amount)} recorded successfully`);
    } catch (error) {
      console.error('Error recording cash payment:', error);
      toast.error('Failed to record cash payment');
    }
  };

  // Add this function inside the Dashboard component
  const handleSavePost = async () => {
    try {
      setIsSaving(true);

      // Upload image if there's a new one
      let coverImageUrl = postFormData.cover_image;
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);

        coverImageUrl = publicUrl;
      }

      const postData = {
        title: postFormData.title,
        slug: postFormData.slug,
        excerpt: postFormData.excerpt,
        content: postFormData.content,
        cover_image: coverImageUrl,
        category_id: postFormData.category_id,
        updated_at: new Date().toISOString()
      };

      if (editingPost) {
        // Update existing post
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (updateError) throw updateError;

        // Update local state
        setBlogPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === editingPost.id
              ? { ...post, ...postData }
              : post
          )
        );

        toast.success('Blog post updated successfully');
      } else {
        // Create new post
        const { data: newPost, error: createError } = await supabase
          .from('blog_posts')
          .insert([{
            ...postData,
            created_at: new Date().toISOString(),
            author_id: currentUser.id
          }])
          .select()
          .single();

        if (createError) throw createError;

        // Update local state
        setBlogPosts(prevPosts => [...prevPosts, newPost]);

        toast.success('Blog post created successfully');
      }

      // Reset form and close modal
      setPostFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image: '',
        category_id: ''
      });
      setImageFile(null);
      setImagePreview(null);
      setIsNewPostModalOpen(false);
      setEditingPost(null);

    } catch (error) {
      console.error('Error saving blog post:', error);
      toast.error('Failed to save blog post');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {renderTabs()}
      
      {/* Main Content */}
      <div className={`
        transition-all duration-200 ease-in-out
        lg:ml-64 min-h-screen
        ${isMenuOpen ? 'ml-64' : 'ml-0'}
      `}>
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4965]">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            
            {/* User Actions */}
            {/* <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div> */}
          </div>

          {/* Content Section */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && renderOverviewContent()}
                {activeTab === 'listings' && renderListingsContent()}
                {activeTab === 'bookings' && renderBookingsContent()}
                {activeTab === 'calendar' && renderCalendarContent()}
                {activeTab === 'messages' && renderMessagesContent()}
                {activeTab === 'blog' && renderBlogContent()}
                {activeTab === 'settings' && renderSettingsContent()}
                {activeTab === 'rapport' && renderRapportContent()}
                {activeTab === 'transactions' && renderTransactionsContent()}
                {activeTab === 'checkouts' && renderCheckoutsContent()}
                {activeTab === 'users' && renderUsersContent()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  )
}

export default Dashboard

