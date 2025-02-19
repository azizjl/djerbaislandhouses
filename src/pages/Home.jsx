import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../config/supabase'
import { BedOutline, WaterOutline, ExpandOutline } from 'react-ionicons'
import useAuthStore from '../stores/authStore'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';

// Create a ScrollReveal component
const ScrollReveal = ({ children, delay = 0, direction = null }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 100 : direction === 'down' ? -100 : 0,
      x: direction === 'left' ? 100 : direction === 'right' ? -100 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.8,
        delay: delay,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
};

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
    bedrooms: '',
    startDate: '',
    endDate: ''
  })
  const [isScrolled, setIsScrolled] = useState(false)
  const [currencies, setCurrencies] = useState([])
  const [selectedCurrency, setSelectedCurrency] = useState(
    localStorage.getItem('selectedCurrency') || 'TND'
  )
  // Add state for last updated timestamp
  const [lastUpdated, setLastUpdated] = useState(null)

  // Add this ref for the properties section
  const propertiesRef = useRef(null)

  // Add state for bookings
  const [bookings, setBookings] = useState([]);

  // Add this state inside the Home component
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add this ref near the top of the component with other refs
  const contactRef = useRef(null);

  // Add state for website content
  const [websiteContent, setWebsiteContent] = useState({
    hero: {
      title: "Experience Luxury Living in Djerba",
      subtitle: "Your dream Mediterranean getaway awaits"
    },
    stats: {
      happyGuests: "500+",
      properties: "0",
      rating: "4.9",
      support: "24/7"
    },
    whyChooseUs: {
      title: "Why Choose DjerbaIsland Houses?",
      features: []
    },
    reviews: {
      title: "What Our Guests Say",
      subtitle: "",
      testimonials: [],
      stats: {
        satisfactionRate: "98%",
        averageRating: "4.9/5",
        totalReviews: "500+",
        repeatGuests: "85%"
      }
    },
    contact: {
      office: {
        address: "",
        phone: "",
        email: "",
        hours: "",
        whatsapp: "+21612345678",
        messenger: "your-page-id"
      }
    }
  });
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  // Add this state near your other state declarations
  const [profile, setProfile] = useState(null)

  // Add this state near your other state declarations
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Add this state near your other state declarations
  const [propertyImageIndices, setPropertyImageIndices] = useState({});

  // Add this state near your other state declarations
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Add this useEffect to fetch the profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        if (data) setProfile(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchProfile()
  }, [user])

  // Add useEffect to fetch website content with console logs for debugging
  useEffect(() => {
    const fetchWebsiteContent = async () => {
      try {
        console.log('Fetching website content...');
        const { data, error } = await supabase
          .from('settings')
          .select('website_content')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        // console.log('Received data:', data);
        
        if (data?.website_content) {
          console.log('Setting website content:', data.website_content);
          setWebsiteContent(data.website_content);
        } else {
          console.log('No website content found in data');
        }
      } catch (error) {
        console.error('Error fetching website content:', error);
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchWebsiteContent();
  }, []);

  // Add console log to check when content updates
  useEffect(() => {
    // console.log('Current website content:', websiteContent);
  }, [websiteContent]);

  // Update the fetch properties useEffect
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Add artificial delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500))
        
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
          .limit(3)
        
        if (error) throw error
        
        const transformedData = data.map(property => {
          // Initialize image index for this property
          setPropertyImageIndices(prev => ({
            ...prev,
            [property.id]: 0
          }));

          return {
            id: property.id,
            title: property.name,
            location: property.location,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            sqft: property.capacity,
            price_per_night: property.prices?.find(p => 
              parseInt(p.month) === new Date().getMonth() + 1
            )?.price_per_day || 0,
            images: property.images?.map(img => img.url) || [],
            image_url: property.images?.[0]?.url || ''
          }
        })
        
        setAllProperties(transformedData)
        setFilteredProperties(transformedData)
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
      bedrooms: '',
      startDate: '',
      endDate: ''
    })
    setFilteredProperties(allProperties)
  }

  // Add this function to check availability
  const isPropertyAvailable = (propertyId, startDate, endDate) => {
    // If no dates selected, property is considered available
    if (!startDate || !endDate) return true;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if property has any overlapping bookings
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

  // Update the handleSearchSubmit function
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    
    // Create query params from filters
    const params = new URLSearchParams()
    
    if (searchFilters.location) {
      params.append('location', searchFilters.location)
    }
    if (searchFilters.priceRange) {
      params.append('priceRange', searchFilters.priceRange)
    }
    if (searchFilters.bedrooms) {
      params.append('bedrooms', searchFilters.bedrooms)
    }
    if (searchFilters.startDate) {
      params.append('startDate', searchFilters.startDate)
    }
    if (searchFilters.endDate) {
      params.append('endDate', searchFilters.endDate)
    }

    // Navigate to houses page with search params
    navigate(`/houses?${params.toString()}`)
  }

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Update the Facebook Messenger setup
  useEffect(() => {
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        xfbml: true,
        version: 'v18.0'
      });
    };

    // Create and load the script element
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.crossOrigin = 'anonymous';  // Add crossOrigin attribute
    script.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
    
    // Add error handling
    script.onerror = function() {
      console.error('Failed to load Facebook SDK');
    };

    // Find first script element to insert before
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);

    // Cleanup
    return () => {
      const scriptElement = document.getElementById('facebook-jssdk');
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, []);

  // Update the fetchCurrencies useEffect
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('currencies, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single() // Changed from maybeSingle to single
        
        if (error) {
          console.error('Error fetching currencies:', error)
          // Set default currencies if fetch fails
          setCurrencies([
            { code: 'TND', rate: 1, name: 'Tunisian Dinar' },
            { code: 'EUR', rate: 0.29, name: 'Euro' },
            { code: 'USD', rate: 0.32, name: 'US Dollar' }
          ])
          return
        }
        
        setCurrencies(data?.currencies || [])
        setLastUpdated(data?.updated_at)
      } catch (error) {
        console.error('Error fetching currencies:', error)
        // Set default currencies if fetch fails
        setCurrencies([
          { code: 'TND', rate: 1, name: 'Tunisian Dinar' },
          { code: 'EUR', rate: 0.29, name: 'Euro' },
          { code: 'USD', rate: 0.32, name: 'US Dollar' }
        ])
      }
    }

    fetchCurrencies()
  }, [])

  // Add currency selection handler
  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value
    setSelectedCurrency(newCurrency)
    localStorage.setItem('selectedCurrency', newCurrency)
  }

  // Update price display helper
  const formatPrice = (priceInTND) => {
    if (!priceInTND) return '0 TND'
    
    const currency = currencies.find(c => c.code === selectedCurrency)
    if (!currency) return `${priceInTND} TND`
    
    const convertedPrice = priceInTND * currency.rate
    return `${convertedPrice.toFixed(2)} ${currency.code}`
  }

  // Add this helper function to format the timestamp
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Add useEffect to fetch bookings
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

  // Add this function inside the Home component
  const handleContactSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all fields')
      return
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactForm.email)) {
      toast.error('Please enter a valid email address')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('contacts')
        .insert([
          {
            name: contactForm.name,
            email: contactForm.email,
            subject: contactForm.subject,
            message: contactForm.message
          }
        ])
      
      if (error) throw error
      
      toast.success('Message sent successfully! We\'ll get back to you soon.')
      
      // Reset form
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      console.error('Error submitting contact form:', error)
      toast.error('Failed to send message. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add this useEffect near your other useEffect hooks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.relative')) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  // Add this state for blogs
  const [blogs, setBlogs] = useState([])
  const [currentBlogIndex, setCurrentBlogIndex] = useState(0)

  // Add this useEffect to fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) throw error
        setBlogs(data || [])
      } catch (error) {
        console.error('Error fetching blogs:', error)
      }
    }

    fetchBlogs()
  }, [])

  // Add these carousel control functions
  const nextBlog = () => {
    setCurrentBlogIndex((prev) => (prev + 1) % blogs.length)
  }

  const prevBlog = () => {
    setCurrentBlogIndex((prev) => (prev - 1 + blogs.length) % blogs.length)
  }

  // Add this function near your other handler functions
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubscribing(true);
    
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: newsletterEmail }]);
      
      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error('This email is already subscribed!');
        } else {
          throw error;
        }
      } else {
        toast.success('Successfully subscribed to our newsletter!');
        setNewsletterEmail('');
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      toast.error('Failed to subscribe. Please try again later.');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Add these carousel control functions
  const nextImage = (propertyId) => {
    setPropertyImageIndices(prev => {
      const property = allProperties.find(p => p.id === propertyId);
      const currentIndex = prev[propertyId] || 0;
      const nextIndex = (currentIndex + 1) % (property?.images?.length || 1);
      return { ...prev, [propertyId]: nextIndex };
    });
  };

  const prevImage = (propertyId) => {
    setPropertyImageIndices(prev => {
      const property = allProperties.find(p => p.id === propertyId);
      const currentIndex = prev[propertyId] || 0;
      const prevIndex = (currentIndex - 1 + (property?.images?.length || 1)) % (property?.images?.length || 1);
      return { ...prev, [propertyId]: prevIndex };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white">
        <img 
          src="/logo.svg" 
          alt="DjerbaIsland Houses" 
          className="w-32 h-32"
        />
        {/* <h2 className="mt-4 text-xl text-[#1B4965] font-semibold">
          Loading amazing properties...
        </h2> */}
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
      {isLoadingContent ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A5F7A]"></div>
        </div>
      ) : (
        <>
          {/* Navigation */}
          <nav className={`fixed w-full top-0 z-50 transition-colors duration-300 ${
            isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
          }`}>
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex justify-between h-25">
                <div className="flex items-center">
                  <Link to="/" id="logo" className={`text-3xl font-light tracking-tight ${
                    isScrolled ? 'text-[#1A5F7A]' : 'text-white'
                  }`}>
                    DjerbaIsland<span id="logo-text" className="font-bold text-[#86A8CF]">Houses</span>
                  </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8">
                  <Link to="/" className={`flex items-center ${isScrolled ? 'text-[#1A5F7A] hover:text-[#86A8CF]' : 'text-white hover:text-white/80'} transition-colors`}>
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    Home
                  </Link>
                  <Link to="/houses" className={`flex items-center ${isScrolled ? 'text-[#1A5F7A] hover:text-[#86A8CF]' : 'text-white hover:text-white/80'} transition-colors`}>
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    Properties
                  </Link>
                  {/* Add Blog Link */}
                  <Link to="/blog" className={`flex items-center ${isScrolled ? 'text-[#1A5F7A] hover:text-[#86A8CF]' : 'text-white hover:text-white/80'} transition-colors`}>
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"/>
                    </svg>
                    Blog
                  </Link>
                  <Link 
                    to="#contact" 
                    onClick={(e) => {
                      e.preventDefault();
                      contactRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`flex items-center ${isScrolled ? 'text-[#1A5F7A] hover:text-[#86A8CF]' : 'text-white hover:text-white/80'} transition-colors`}
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    Contact
                  </Link>
                  {/* {role === 'admin' && (
                    <Link to="/dashboard" className={`flex items-center ${isScrolled ? 'text-[#1A5F7A] hover:text-[#86A8CF]' : 'text-white hover:text-white/80'} transition-colors`}>
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Dashboard
                    </Link>
                  )} */}
                  {user ? (
                    <div className="relative">
                      <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`flex items-center space-x-2 p-2 rounded-full border ${
                          isScrolled 
                            ? 'border-gray-200 hover:shadow-md' 
                            : 'border-white/30 hover:border-white'
                        } transition-all duration-300`}
                      >
                        <svg className={`w-5 h-5 ${isScrolled ? 'text-gray-600' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                        <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center ${
                          isScrolled ? 'bg-gray-200' : 'bg-white/20'
                        }`}>
                          {profile?.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className={`w-5 h-5 ${isScrolled ? 'text-gray-600' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                          )}
                        </div>
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg py-2 border border-[#F5F5F5]">
                          <div className="px-4 py-3 border-b border-[#F5F5F5]">
                            <p className="text-sm text-gray-500">Signed in as</p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.email}
                            </p>
                          </div>
                          
                          <div className="py-2">
                            <Link
                              to="/profile"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                              </svg>
                              Profile
                            </Link>
                            
                            <Link
                              to="/bookings"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                              My Bookings
                            </Link>

                            {role === 'admin' && (
                              <Link
                                to="/dashboard"
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Dashboard
                              </Link>
                            )}
                          </div>

                          <div className="border-t border-[#F5F5F5]">
                            <button
                              onClick={async () => {
                                await supabase.auth.signOut()
                                navigate('/')
                                setIsMenuOpen(false)
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                              </svg>
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link 
                      to="/auth" 
                      className={`px-6 py-2.5 ${
                        isScrolled 
                          ? 'text-white bg-[#1A5F7A] hover:bg-[#86A8CF]' 
                          : 'text-[#1A5F7A] bg-white hover:bg-white/90'
                      } rounded-full transition-colors duration-300 flex items-center`}
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
                    className="text-[#1A5F7A] hover:text-[#86A8CF] focus:outline-none"
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
              } md:hidden ${isScrolled ? 'bg-white' : 'bg-white/90 backdrop-blur-md'} border-t border-[#F5F5F5]`}
            >
              <div className="px-4 pt-2 pb-3 space-y-1">
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#1A5F7A] hover:text-[#86A8CF] hover:bg-gray-50"
                >
                  Home
                </Link>
                <Link
                  to="/houses"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#1A5F7A] hover:text-[#86A8CF] hover:bg-gray-50"
                >
                  Properties
                </Link>
                <Link
                  to="/blog"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#1A5F7A] hover:text-[#86A8CF] hover:bg-gray-50"
                >
                  Blog
                </Link>
                <Link
                  to="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
                    setIsMenuOpen(false); // Close mobile menu after clicking
                  }}
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#1A5F7A] hover:text-[#86A8CF] hover:bg-gray-50"
                >
                  Contact
                </Link>
                {role === 'admin' && (
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-[#1A5F7A] hover:text-[#86A8CF] hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                )}
                {user && (
                  <>
                    <Link
                      to="/bookings"
                      className="block px-3 py-2 rounded-md text-base font-medium text-[#1A5F7A] hover:text-[#86A8CF] hover:bg-gray-50"
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-[#1A5F7A] hover:text-[#86A8CF] hover:bg-gray-50"
                    >
                      Profile
                    </Link>
                  </>
                )}
                {user ? (
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut()
                      navigate('/auth')
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-[#1A5F7A] hover:text-[#86A8CF] hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    className="block px-3 py-2 rounded-md text-base font-medium text-[#1A5F7A] hover:text-[#86A8CF] hover:bg-gray-50"
                  >
                    Login
                  </Link>
                )}
                {/* Add currency selector */}
                <div className="px-3 py-2">
                  <label className="block text-sm font-medium text-[#1A5F7A] mb-1">
                    Currency
                  </label>
                  <select
                    value={selectedCurrency}
                    onChange={handleCurrencyChange}
                    className="w-full px-3 py-2 rounded-md text-base font-medium text-[#1A5F7A] bg-gray-50 border border-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#86A8CF]"
                  >
                    {currencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </nav>

          {/* Hero Section with Search */}
          <div className="relative min-h-screen">
            {/* Gradient Background */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1A5F7A] via-[#86A8CF] to-[#F5F5F5] z-10"></div>
            </div>

            {/* Content Layer */}
            <div className="relative z-20 max-w-7xl mx-auto px-6 pt-40 pb-20">
              <div className="text-center max-w-4xl mx-auto">
                {/* Logo */}
                {/* <img 
                  src="/logo.svg" 
                  alt="DjerbaIsland Houses" 
                  className="w-32 h-32 mx-auto mb-8 animate-zoom"
                /> */}
                
                <h1 className="text-7xl pb-2 px-2 font-bold mb-8 mt-8 text-white animate-fade-in drop-shadow-[0_5px_25px_rgba(0,0,0,0.50)]">
                  {websiteContent.hero.title.split(' ').map((word, index, array) => (
                    index === array.length - 1 ? (
                      <span key={index} className="bg-gradient-to-r from-white via-[#62B6CB] to-[#BEE9E8] inline-block text-transparent bg-clip-text">
                        {' ' + word}
                      </span>
                    ) : (
                      <span key={index}>{(index > 0 ? ' ' : '') + word}</span>
                    )
                  ))} 
                </h1>
                <p className="text-2xl text-white/90 mb-16 animate-slide-up drop-shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  {" "}{websiteContent.hero.subtitle}
                </p>

                {/* Search Filters with Airbnb-like style */}
                <div className="w-full">
                  <form 
                    onSubmit={handleSearchSubmit}
                    // style={{ transform: 'translateX(-10%)' }}
                    className="bg-white md:translate-x-[-10%] md:w-[130%] md:rounded-full rounded-2xl shadow-xl border border-[#F5F5F5] flex flex-col md:flex-row md:items-center p-3 gap-2 md:gap-0"
                  >
                    {/* Location Filter */}
                    <div className="flex-1 px-4 md:px-6 py-2 md:border-r border-[#F5F5F5]">
                      <div className="text-sm text-left font-medium text-gray-800">Where</div>
                      <select
                        name="location"
                        value={searchFilters.location}
                        onChange={handleFilterChange}
                        className="w-full text-base text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer py-1"
                      >
                        <option value="">Anywhere in Djerba</option>
                        {getUniqueLocations().map(location => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date Range Filters */}
                    <div className="flex-1 px-4 md:px-6 py-2 md:border-r border-[#F5F5F5]">
                      <div className="text-sm text-left font-medium text-gray-800">Check In</div>
                      <input
                        type="date"
                        name="startDate"
                        value={searchFilters.startDate}
                        onChange={handleFilterChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full text-base text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer py-1"
                      />
                    </div>

                    <div className="flex-1 px-4 md:px-6 py-2 md:border-r border-[#F5F5F5]">
                      <div className="text-sm text-left font-medium text-gray-800">Check Out</div>
                      <input
                        type="date"
                        name="endDate"
                        value={searchFilters.endDate}
                        onChange={handleFilterChange}
                        min={searchFilters.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full text-base text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer py-1"
                      />
                    </div>

                    {/* Price Range Filter */}
                    <div className="flex-1 px-4 md:px-6 py-2 md:border-r border-[#F5F5F5]">
                      <div className="text-sm text-left font-medium text-gray-800">Price Range</div>
                      <select
                        name="priceRange"
                        value={searchFilters.priceRange}
                        onChange={handleFilterChange}
                        className="w-full text-base text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer py-1"
                      >
                        <option value="">Any price</option>
                        {getPriceRanges().map(range => (
                          <option key={range.value} value={range.value}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bedrooms Filter */}
                    <div className="flex-1 px-4 md:px-6 py-2 md:border-r border-[#F5F5F5]">
                      <div className="text-sm text-left font-medium text-gray-800">Rooms</div>
                      <select
                        name="bedrooms"
                        value={searchFilters.bedrooms}
                        onChange={handleFilterChange}
                        className="w-full text-base text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer py-1"
                      >
                        <option value="">Any rooms</option>
                        <option value="1">1+ beds</option>
                        <option value="2">2+ beds</option>
                        <option value="3">3+ beds</option>
                        <option value="4">4+ beds</option>
                      </select>
                    </div>

                    {/* Search and Reset Button Container */}
                    <div className="flex items-center justify-between px-4 md:px-6 py-2">
                      <button
                        type="submit"
                        className="flex-grow md:flex-grow-0 bg-[#86A8CF] hover:bg-[#1A5F7A] text-white rounded-full px-6 py-3 flex items-center justify-center space-x-2 transition-colors duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <span className="font-medium">Search</span>
                      </button>

                      {/* Reset Button - Only show when filters are active */}
                      {(searchFilters.location || searchFilters.priceRange || searchFilters.bedrooms || searchFilters.startDate || searchFilters.endDate) && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="ml-2 text-gray-500 hover:text-[#86A8CF] p-2 rounded-full hover:bg-gray-100 transition-colors duration-300"
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
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Villa Image */}
            <div className="absolute bottom-0 left-0 right-0 z-10 w-full h-[100vh] overflow-hidden">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-20"></div>
              <img src="/villa.png" alt="Luxury Villa" className="w-full h-full object-cover" />
            </div>

            {/* Scroll Indicator - Moved up a bit to not overlap with villa */}
            {/* <div className="absolute bottom-[45vh] left-1/2 transform -translate-x-1/2 animate-bounce z-20">
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div> */}
          </div>

          {/* Add after hero section */}
          <div className="py-20 bg-white mt-[-70px] z-9">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { title: "Happy Guests", count: websiteContent.stats.happyGuests, image: "guests.jpg" },
                  { title: "Properties", count: allProperties.length, image: allProperties[0]?.image_url || '/images/properties.jpg' },
                  { title: "Average Rating", count: "4.9", image: "rating.jpg" },
                  { title: "Support", count: "24/7", image: "support.jpg" }
                ].map((stat, index) => (
                  <ScrollReveal key={index} delay={index * 0.2} direction="up">
                    <div className="relative p-8 h-60 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden">
                      {/* Background Image with Overlay */}
                      <div className="absolute inset-0">
                        <img 
                          src={stat.image} 
                          alt={stat.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40"></div>
                      </div>
                      
                      {/* Content */}
                      <div className="relative flex items-start space-x-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <svg 
                            className="w-6 h-6 text-black" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="2" 
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-4xl font-bold text-white mb-0">{stat.title}</h3>
                          <p className="text-white/90">{stat.count}</p>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>

          {/* Why Choose Us Section */}
          <div className="py-20 bg-white">
            <ScrollReveal delay={0.2} direction="up">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-[#1A5F7A] mb-4">
                  {websiteContent.whyChooseUs.title}
                </h2>
              </div>
            </ScrollReveal>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {websiteContent.whyChooseUs.features.map((feature, index) => (
                <ScrollReveal key={index} delay={0.2 * (index + 1)} direction="up">
                  <div className="bg-[#F5F5F5] rounded-xl p-8">
                    <h3 className="text-xl font-semibold text-[#1A5F7A] mb-4">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Properties Section */}
          <div className="bg-white">
            {filteredProperties.map((property, index) => (
              <ScrollReveal key={property.id} delay={0.2} direction={index % 2 === 0 ? 'left' : 'right'}>
                <div className="min-h-screen relative">
                  {/* Property Container */}
                  <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-screen">
                    {/* Left Side - Image */}
                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden">
                      {/* Price Tag */}
                      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full z-10">
                        <span className="text-[#1A5F7A] font-semibold">
                          {formatPrice(property.price_per_night)}/night
                        </span>
                      </div>
                      
                      {/* Navigation Arrows */}
                      {property.images?.length > 1 && (
                        <>
                          <button 
                            onClick={() => prevImage(property.id)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors z-10"
                          >
                            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => nextImage(property.id)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors z-10"
                          >
                            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Image */}
                      <img 
                        src={property.images?.[propertyImageIndices[property.id] || 0] || property.image_url}
                        alt={property.title}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />

                      {/* Image Indicators */}
                      {property.images?.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                          {property.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setPropertyImageIndices(prev => ({ ...prev, [property.id]: index }))}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === (propertyImageIndices[property.id] || 0)
                                  ? 'bg-white'
                                  : 'bg-white/50'
                              }`}
                              aria-label={`Go to image ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Side - Content */}
                    <div className="space-y-8">
                      {/* Rating */}
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold">4.9</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i}
                              className="w-6 h-6 text-[#1A5F7A]" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-4xl font-bold text-gray-900">{property.title}</h2>

                      {/* Description */}
                      <p className="text-gray-600 text-lg leading-relaxed">
                        Our luxurious villa is perfect for weekend getaways or extended stays, 
                        offering an exceptional experience in Djerba.
                      </p>

                      {/* Features */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-600">1-{property.bedrooms * 2} guests</span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span className="text-gray-600">Perfect for outdoor activities</span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-gray-600">Wi-fi</span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-gray-600">{property.location}</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center space-x-4 pt-4">
                        <Link 
                          to={`/houses/${property.id}`}
                          className="bg-[#1A5F7A] hover:bg-[#86A8CF] text-white px-8 py-4 rounded-full font-medium transition-colors"
                        >
                          Book now
                        </Link>
                        <Link 
                          to={`/houses/${property.id}`}
                          className="px-8 py-4 rounded-full font-medium border border-[#F5F5F5] hover:border-[#1A5F7A] transition-colors"
                        >
                          Learn more
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}

            {/* Add Explore More Section */}
            <ScrollReveal delay={0.2} direction="up">
              <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                <h2 className="text-4xl font-bold text-[#1A5F7A] mb-6">
                  Discover More Properties
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Explore our full collection of luxury properties across Djerba. Find your perfect vacation home.
                </p>
                <Link 
                  to="/houses"
                  className="inline-flex items-center px-8 py-4 rounded-full bg-[#1A5F7A] text-white font-medium hover:bg-[#86A8CF] transition-colors duration-300"
                >
                  View All Properties
                  <svg 
                    className="w-5 h-5 ml-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Reviews Section */}
          <div className="py-20 bg-white">
            <ScrollReveal delay={0.2} direction="up">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-[#1A5F7A] mb-4">
                  {websiteContent.reviews.title}
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {websiteContent.reviews.subtitle}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {websiteContent.reviews.testimonials.map((review, index) => (
                <ScrollReveal key={index} delay={0.2 * (index + 1)} direction="up">
                  <div className="bg-[#F5F5F5] rounded-xl p-8 transition-all duration-300 hover:shadow-md">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-[#1A5F7A] rounded-xl flex items-center justify-center text-white text-xl font-semibold">
                        {review.initials}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-[#1A5F7A]">{review.name}</h3>
                        <p className="text-gray-500 text-sm">{review.location}</p>
                      </div>
                    </div>
                    <div className="flex mb-4 text-[#86A8CF]">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i}
                          className="w-5 h-5" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{review.text}</p>
                    <p className="text-[#86A8CF] font-medium">{review.property}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Review Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="bg-[#F5F5F5] rounded-xl p-6 text-center transition-all duration-300 hover:shadow-md">
                <div className="text-4xl font-bold text-[#1A5F7A] mb-2">
                  {websiteContent.reviews.stats.satisfactionRate}
                </div>
                <p className="text-[#B7C9E5]">Satisfaction Rate</p>
              </div>
              <div className="bg-[#F5F5F5] rounded-xl p-6 text-center transition-all duration-300 hover:shadow-md">
                <div className="text-4xl font-bold text-[#1A5F7A] mb-2">
                  {websiteContent.reviews.stats.averageRating}
                </div>
                <p className="text-[#B7C9E5]">Average Rating</p>
              </div>
              <div className="bg-[#F5F5F5] rounded-xl p-6 text-center transition-all duration-300 hover:shadow-md">
                <div className="text-4xl font-bold text-[#1A5F7A] mb-2">
                  {websiteContent.reviews.stats.totalReviews}
                </div>
                <p className="text-[#B7C9E5]">Reviews</p>
              </div>
              <div className="bg-[#F5F5F5] rounded-xl p-6 text-center transition-all duration-300 hover:shadow-md">
                <div className="text-4xl font-bold text-[#1A5F7A] mb-2">
                  {websiteContent.reviews.stats.repeatGuests}
                </div>
                <p className="text-[#B7C9E5]">Repeat Guests</p>
              </div>
            </div>
          </div>

          {/* Blog Preview Section */}
          <div className="relative bg-white py-20">
            <ScrollReveal delay={0.2} direction="up">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-[#1A5F7A] mb-4">
                  Latest from Our Blog
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Discover tips, guides, and insights about Djerba's finest properties and experiences.
                </p>
              </div>
            </ScrollReveal>

            {/* Blog Carousel */}
            {blogs.length > 0 && (
              <div className="relative min-h-screen">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                  <img 
                    src={blogs[currentBlogIndex].cover_image} 
                    alt={blogs[currentBlogIndex].title}
                    className="w-full h-full object-cover transition-opacity duration-500"
                  />
                  <div className="absolute inset-0 bg-black/50"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 py-32 text-center text-white">
                  {/* Category Badge */}
                  <span className="inline-block px-4 py-2 rounded-full bg-[#1A5F7A] text-sm font-medium mb-6">
                    {blogs[currentBlogIndex].category}
                  </span>

                  <h3 className="text-5xl font-bold mb-6">{blogs[currentBlogIndex].title}</h3>
                  
                  <div className="flex items-center justify-center space-x-4 text-sm mb-8">
                    <span>{new Date(blogs[currentBlogIndex].created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{blogs[currentBlogIndex].read_time || '5 min read'}</span>
                  </div>

                  <p className="text-xl text-white/90 mb-8 leading-relaxed">
                    {blogs[currentBlogIndex].excerpt}
                  </p>

                  <Link 
                    to={`/blog/${blogs[currentBlogIndex].slug}`}
                    className="inline-flex items-center px-8 py-4 rounded-full bg-white text-[#1A5F7A] font-medium hover:bg-[#86A8CF] hover:text-white transition-colors duration-300"
                  >
                    Read More
                    <svg 
                      className="w-5 h-5 ml-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>

                {/* Carousel Controls */}
                <button 
                  onClick={prevBlog}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors z-20"
                  aria-label="Previous blog"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={nextBlog}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors z-20"
                  aria-label="Next blog"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                  {blogs.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBlogIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentBlogIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      aria-label={`Go to blog ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Us Section */}
          <div ref={contactRef} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <ScrollReveal delay={0.2} direction="left">
                  <div className="bg-[#F5F5F5] rounded-xl p-8">
                    <h2 className="text-4xl font-bold text-[#1A5F7A] mb-4">Get in Touch</h2>
                    <p className="text-gray-600 mb-8">
                      Have questions about our properties? We're here to help you find your perfect stay in Djerba.
                    </p>
                    
                    <form onSubmit={handleContactSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={contactForm.name}
                            onChange={(e) => setContactForm(prev => ({
                              ...prev,
                              name: e.target.value
                            }))}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-[#F5F5F5] focus:ring-2 focus:ring-[#86A8CF] focus:border-transparent transition-all duration-300"
                            placeholder="Your name"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm(prev => ({
                              ...prev,
                              email: e.target.value
                            }))}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-[#F5F5F5] focus:ring-2 focus:ring-[#86A8CF] focus:border-transparent transition-all duration-300"
                            placeholder="Your email"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          id="subject"
                          value={contactForm.subject}
                          onChange={(e) => setContactForm(prev => ({
                            ...prev,
                            subject: e.target.value
                          }))}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#F5F5F5] focus:ring-2 focus:ring-[#86A8CF] focus:border-transparent transition-all duration-300"
                          placeholder="How can we help?"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                          Message
                        </label>
                        <textarea
                          id="message"
                          rows="4"
                          value={contactForm.message}
                          onChange={(e) => setContactForm(prev => ({
                            ...prev,
                            message: e.target.value
                          }))}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#F5F5F5] focus:ring-2 focus:ring-[#86A8CF] focus:border-transparent transition-all duration-300"
                          placeholder="Your message..."
                          disabled={isSubmitting}
                        ></textarea>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#1A5F7A] hover:bg-[#86A8CF] text-white font-medium py-4 rounded-xl transition-all duration-300 flex items-center justify-center"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </>
                        ) : (
                          'Send Message'
                        )}
                      </button>
                    </form>
                  </div>
                </ScrollReveal>
                
                <ScrollReveal delay={0.4} direction="right">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Office Location */}
                      <div className="bg-[#F5F5F5] p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-[#1A5F7A] mb-2">Office Location</h4>
                        <p className="text-gray-600">{websiteContent.contact.office.address}</p>
                      </div>
                      
                      {/* Phone */}
                      <div className="bg-[#F5F5F5] p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-[#1A5F7A] mb-2">Phone</h4>
                        <p className="text-gray-600">{websiteContent.contact.office.phone}</p>
                      </div>
                      
                      {/* Email */}
                      <div className="bg-[#F5F5F5] p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-[#1A5F7A] mb-2">Email</h4>
                        <p className="text-gray-600">{websiteContent.contact.office.email}</p>
                      </div>
                      
                      {/* Working Hours */}
                      <div className="bg-[#F5F5F5] p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-[#1A5F7A] mb-2">Working Hours</h4>
                        <p className="text-gray-600">{websiteContent.contact.office.hours}</p>
                      </div>
                    </div>
                    
                    {/* Why Choose Us */}
                    <div className="bg-[#F5F5F5] p-6 rounded-xl">
                      <h4 className="text-lg font-semibold text-[#1A5F7A] mb-4">Why Choose Us?</h4>
                      <ul className="space-y-4">
                        <li className="flex items-center text-gray-600">
                          <div className="w-8 h-8 bg-[#1A5F7A]/10 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-[#1A5F7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                          24/7 Customer Support
                        </li>
                        <li className="flex items-center text-gray-600">
                          <div className="w-8 h-8 bg-[#1A5F7A]/10 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-[#1A5F7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                          Best Price Guarantee
                        </li>
                        <li className="flex items-center text-gray-600">
                          <div className="w-8 h-8 bg-[#1A5F7A]/10 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-[#1A5F7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                          Verified Properties
                        </li>
                      </ul>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="py-20 bg-gradient-to-br from-[#1A5F7A] via-[#86A8CF] to-[#F5F5F5]">
            <div className="max-w-7xl mx-auto px-6">
              <ScrollReveal delay={0.2} direction="up">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Stay Updated with Our Newsletter
                  </h2>
                  <p className="text-white/90 mb-8">
                    Subscribe to our newsletter and be the first to know about new properties,
                    special offers, and travel tips for Djerba.
                  </p>
                  
                  <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-grow px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                      disabled={isSubscribing}
                    />
                    <button
                      type="submit"
                      disabled={isSubscribing}
                      className="px-8 py-4 rounded-full bg-white text-[#1A5F7A] font-medium hover:bg-[#F5F5F5] transition-colors flex items-center justify-center whitespace-nowrap"
                    >
                      {isSubscribing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#1A5F7A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Subscribing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          Subscribe
                        </>
                      )}
                    </button>
                  </form>
                  
                  <p className="text-white/60 text-sm mt-4">
                    By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Footer Section */}
          <footer className="bg-[#1A5F7A] text-white py-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {/* About Section */}
                <div className="space-y-6">
                  <Link to="/" className="text-3xl font-light tracking-tight">
                    DjerbaIsland<span className="font-bold text-[#86A8CF]">Houses</span>
                  </Link>
                  <p className="text-white/80 leading-relaxed">
                    {websiteContent.footer?.about || 'Experience luxury living in the heart of Djerba. We offer premium vacation rentals for unforgettable stays.'}
                  </p>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="text-xl font-semibold mb-6">Quick Links</h3>
                  <ul className="space-y-4">
                    {websiteContent.footer?.quickLinks?.map((link, index) => (
                      <li key={index}>
                        <Link 
                          to={link.path} 
                          className="text-white/80 hover:text-white transition-colors"
                        >
                          {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Services */}
                <div>
                  {/* <h3 className="text-xl font-semibold mb-6">Services</h3>
                  <ul className="space-y-4">
                    {websiteContent.footer?.services?.map((service, index) => (
                      <li key={index}>
                        <Link 
                          to={service.path} 
                          className="text-white/80 hover:text-white transition-colors"
                        >
                          {service.title}
                        </Link>
                      </li>
                    ))}
                  </ul> */}
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-xl font-semibold mb-6">Contact Us</h3>
                  <ul className="space-y-4">
                    {websiteContent.contact?.office?.address && (
                      <li className="flex items-start space-x-3">
                        <svg className="w-6 h-6 text-[#86A8CF] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span className="text-white/80">{websiteContent.contact.office.address}</span>
                      </li>
                    )}
                    {websiteContent.contact?.office?.phone && (
                      <li className="flex items-center space-x-3">
                        <svg className="w-6 h-6 text-[#86A8CF] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        <span className="text-white/80">{websiteContent.contact.office.phone}</span>
                      </li>
                    )}
                    {websiteContent.contact?.office?.email && (
                      <li className="flex items-center space-x-3">
                        <svg className="w-6 h-6 text-[#86A8CF] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        <span className="text-white/80">{websiteContent.contact.office.email}</span>
                      </li>
                    )}
                    {websiteContent.contact?.office?.hours && (
                      <li className="flex items-center space-x-3">
                        <svg className="w-6 h-6 text-[#86A8CF] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span className="text-white/80">{websiteContent.contact.office.hours}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
                <p className="text-white/60 text-sm">
                  © {new Date().getFullYear()} DjerbaIsland Houses. All rights reserved.
                </p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                  <a href="#" className="text-white/60 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                  <a href="#" className="text-white/60 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </div>
              </div>
            </div>
          </footer>

          {/* Add this right before the closing </div> of the min-h-screen container */}
          {/* Chat Bubble */}
          <div className="fixed bottom-8 right-8 z-50">
            {/* Chat Button */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="w-16 h-16 bg-[#1A5F7A] hover:bg-[#86A8CF] rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
              aria-label="Open chat"
            >
              <svg 
                className="w-8 h-8 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>

            {/* Chat Options */}
            {isChatOpen && (
              <div className="absolute bottom-20 right-0 bg-white rounded-2xl shadow-xl p-4 w-72 transform transition-all duration-300 scale-100 opacity-100">
                <div className="space-y-4">
                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/${websiteContent.contact.office.whatsapp || '+21622441889'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-gray-800 font-medium">WhatsApp</h3>
                      <p className="text-gray-500 text-sm">Chat with us on WhatsApp</p>
                    </div>
                  </a>

                  {/* Messenger */}
                  <a
                    href={`https://m.me/${websiteContent.contact.office.messenger || '194051693802476'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#0084FF] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.726 7.21V22l3.405-1.869c.909.252 1.871.388 2.869.388 5.523 0 10-4.145 10-9.259C22 6.145 17.523 2 12 2zm1.008 12.526l-2.546-2.714-4.97 2.714 5.467-5.79 2.608 2.714 4.908-2.714-5.467 5.79z"/>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-gray-800 font-medium">Messenger</h3>
                      <p className="text-gray-500 text-sm">Chat with us on Messenger</p>
                    </div>
                  </a>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  aria-label="Close chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Home 