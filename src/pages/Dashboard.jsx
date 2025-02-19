import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { toast } from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Import all dashboard components
import Overview from '../components/dashboard/Overview';
import Listings from '../components/dashboard/Listings';
import Bookings from '../components/dashboard/Bookings';
import Calendar from '../components/dashboard/Calendar';
import Messages from '../components/dashboard/Messages';
import Blog from '../components/dashboard/Blog';
import Settings from '../components/dashboard/Settings';
import Rapport from '../components/dashboard/Rapport';
import Transactions from '../components/dashboard/Transactions';
import Checkouts from '../components/dashboard/Checkouts';
import Users from '../components/dashboard/Users';
import Newsletter from '../components/dashboard/Newsletter';

// Add this helper function before the Dashboard component
const getCurrentMonthNumber = () => {
  return (new Date().getMonth() + 1).toString(); // getMonth() returns 0-11, so we add 1
};

// Add this helper function for currency formatting
const formatTND = (amount) => {
  return new Intl.NumberFormat('ar-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
};

// Navigation items
const getNavigationItems = (role) => {
  // Base items that reception can access
  const baseItems = [
    { name: 'Bookings', tab: 'bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Calendar', tab: 'calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Messages', tab: 'messages', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
    { name: 'Checkouts', tab: 'checkouts', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  // Additional items for admin and manager
  const adminManagerItems = [
    { name: 'Overview', tab: 'overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Listings', tab: 'listings', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Blog', tab: 'blog', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
    { name: 'Settings', tab: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { name: 'Rapport', tab: 'rapport', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Transactions', tab: 'transactions', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Newsletter', tab: 'newsletter', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ];

  // Admin-only items
  const adminOnlyItems = [
    { name: 'Users', tab: 'users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  ];

  if (role === 'admin') {
    return [...adminManagerItems, ...baseItems, ...adminOnlyItems];
  } else if (role === 'manager') {
    return [...adminManagerItems, ...baseItems];
  } else {
    return baseItems;
  }
};

function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [loading, setLoading] = useState(true);

  // State for different data types
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rapportData, setRapportData] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);

  const navigate = useNavigate();

  // Add this near the other state declarations
  const { signOut } = useAuthStore();

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch current user
        const { data: { user } } = await supabase.auth.getUser();
        console.log(!user)
        if(!user){
          navigate('/');
          return;
        }

        // Fetch user profile with role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setCurrentUser({ ...user, ...profile });
        // Check admin access
        if (profile.role !== 'admin' && profile.role !== 'reception' && profile.role !== 'manager') {
          navigate('/');
          return;
        }

        // Fetch accommodations (listings)
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
          `);

        if (listingsError) throw listingsError;

        // Transform listings data
        const transformedListings = listingsData.map(listing => ({
          ...listing,
          prices: listing.prices || [],
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
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;
        setBookings(bookingsData);

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;
        setMessages(messagesData);

        // Fetch blog posts
        const { data: blogData, error: blogError } = await supabase
          .from('blog_posts')
          .select(`
            *,
            categories (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (blogError) throw blogError;
        setBlogPosts(blogData);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData);

        // Only fetch users if admin
        if (profile.role === 'admin') {
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('*')
            .order('updated_at', { ascending: false });

          if (usersError) throw usersError;
          setUsers(usersData);
        }

        // Calculate rapport data from bookings
        const rapportData = {
          revenue: bookingsData?.reduce((sum, booking) => sum + booking.total_price, 0) || 0,
          bookings: bookingsData?.length || 0,
          occupancyRate: calculateOccupancyRate(bookingsData),
          averageDailyRate: calculateADR(bookingsData),
          properties: calculatePropertyPerformance(bookingsData, listingsData),
          revenueGrowth: calculateGrowth(bookingsData, 'revenue'),
          bookingsGrowth: calculateGrowth(bookingsData, 'bookings'),
          occupancyGrowth: calculateGrowth(bookingsData, 'occupancy'),
          adrGrowth: calculateGrowth(bookingsData, 'adr')
        };

        setRapportData(rapportData);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Event handlers with Supabase
  const handleDeleteListing = async (listingId) => {
    try {
      const { error } = await supabase
        .from('accommodations')
        .delete()
        .eq('id', listingId);

      if (error) throw error;
      setListings(listings.filter(listing => listing.id !== listingId));
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleSavePost = async (post) => {
    try {
      if (post.id) {
        const { error } = await supabase
          .from('blog_posts')
          .update(post)
          .eq('id', post.id);

        if (error) throw error;
        setBlogPosts(blogPosts.map(p => 
          p.id === post.id ? post : p
        ));
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert([{ ...post, profiles_id: currentUser.id }])
          .select()
          .single();

        if (error) throw error;
        setBlogPosts([...blogPosts, data]);
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  // Helper functions for rapport calculations
  const calculateOccupancyRate = (bookings) => {
    // Add calculation logic
    return 0;
  };

  const calculateADR = (bookings) => {
    // Add calculation logic
    return 0;
  };

  const calculatePropertyPerformance = (bookings, properties) => {
    // Add calculation logic
    return [];
  };

  const calculateGrowth = (data, metric) => {
    // Add calculation logic
    return 0;
  };

  // Event handlers
  const handleBookingClick = (booking) => {
    // Handle booking click
    console.log('Booking clicked:', booking);
  };

  // Handle cash payment (from OldDashboard)
  const handleCashPayment = async (booking) => {
    const remainingAmount = booking.total_price - (booking.payed_amount || 0);
    
    const cashAmount = window.prompt(
      `Remaining amount: ${formatTND(remainingAmount)}\nEnter cash payment amount:`
    );

    if (cashAmount === null) return;
    
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
      const { error } = await supabase
        .from('bookings')
        .update({ 
          payed_amount_cash: (booking.payed_amount_cash || 0) + amount,
          payed_amount: newPayedAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

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

  // Update the handleLogout function
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      signOut();  // Call the logout function from the store
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  // Replace the navigationItems constant with:
  const navigationItems = getNavigationItems(currentUser.role);

  // Update tab handling
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out z-30
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#1B4965]">Dashboard</h1>
        </div>
        <nav className="mt-6 flex flex-col h-[calc(100%-88px)] justify-between">
          <div className="px-4 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => handleTabChange(item.tab)}
                className={`
                  w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg
                  ${activeTab === item.tab
                    ? 'bg-[#1B4965] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <svg
                  className="mr-3 h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={item.icon}
                  />
                </svg>
                {item.name}
              </button>
            ))}
          </div>
          
          {/* Add logout button at bottom */}
          <div className="px-4 mb-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <svg
                className="mr-3 h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`
        transition-all duration-200 ease-in-out
        lg:ml-64 min-h-screen
        ${isMenuOpen ? 'ml-64' : 'ml-0'}
      `}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Go back"
              >
                <svg
                  className="h-6 w-6 text-[#1B4965]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4965]">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
            </div>
            <button
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && <Overview bookings={bookings} listings={listings} />}
                {activeTab === 'listings' && <Listings listings={listings} bookings={bookings} onDeleteListing={handleDeleteListing} />}
                {activeTab === 'bookings' && <Bookings bookings={bookings} onBookingClick={handleBookingClick} />}
                {activeTab === 'calendar' && <Calendar bookings={bookings} />}
                {activeTab === 'messages' && <Messages messages={messages} />}
                {activeTab === 'blog' && <Blog posts={blogPosts} categories={categories} onSavePost={handleSavePost} />}
                {activeTab === 'settings' && <Settings user={currentUser} />}
                {activeTab === 'rapport' && <Rapport rapportData={rapportData} />}
                {activeTab === 'transactions' && <Transactions bookings={bookings} />}
                {activeTab === 'checkouts' && <Checkouts bookings={bookings} onBookingClick={handleBookingClick} />}
                {activeTab === 'users' && <Users users={users} currentUser={currentUser} onUpdateUserRole={handleUpdateUserRole} />}
                {activeTab === 'newsletter' && <Newsletter />}
              </>
            )}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/25 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default Dashboard;

