import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import Houses from './pages/Houses'
import HouseDetail from './pages/HouseDetail'
import Auth from './pages/Auth'
import AddListing from './pages/AddListing'
import BookingDetail from './pages/BookingDetail'
import Bookings from './pages/Bookings'
import Dashboard from './pages/Dashboard'
import EditListing from './pages/EditListing'
import useUserRole from './utils/userRole'
import useAuthStore from './stores/authStore'
import { useEffect, useState } from 'react'
import Blog from './pages/Blog'
import Profile from './pages/Profile'
import BlogDetail from './pages/BlogDetail'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import NotFound from './pages/NotFound'

// const ProtectedRoute = ({ children }) => {
//   const { role, loading } = useUserRole();

//   if (loading) return <p>Loading...</p>; // Wait for role check

//   return role === "admin" ? children : <Navigate to="/" />;
// };

const languages = [
  { code: 'fr', name: 'French' },
  { code: 'ar', name: 'Arabic' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  // Add more languages as needed
];

function App() {
  const [showTranslateModal, setShowTranslateModal] = useState(false)
  const { role } = useUserRole()
  const { setRole } = useAuthStore()

  useEffect(() => {
    console.log("role in APP", role);
    setRole(role)
  }, [role])

  const translatePage = async (targetLang) => {
    try {
      const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span:not(#logo-text), button, a:not(#logo)');
      
      elements.forEach(async (element) => {
        if (element.textContent.trim()) {
          const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=AIzaSyAb-AY4tTWz6xpls6izXM3EXyqfPmo-aTA`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: element.textContent,
              target: targetLang
            })
          });

          const data = await response.json();
          if (data.data?.translations?.[0]?.translatedText) {
            // Decode HTML entities before setting the text
            const decoder = document.createElement('div');
            decoder.innerHTML = data.data.translations[0].translatedText;
            element.textContent = decoder.textContent;
          }
        }
      });

      setShowTranslateModal(false);
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  return (
    <Router>
      {/* Translation Button */}
      {/* <button 
        onClick={() => setShowTranslateModal(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '8px 16px',
          borderRadius: '4px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Translate
      </button> */}

      {/* Translation Modal */}
      {showTranslateModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1001
          }}
          onClick={() => setShowTranslateModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              minWidth: '300px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '15px'
            }}>
              <h3 style={{margin: 0}}>Select Language</h3>
              <button 
                onClick={() => setShowTranslateModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              display: 'grid',
              gap: '8px'
            }}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => translatePage(lang.code)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    ':hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/houses" element={<Houses />} />
        <Route path="/houses/:id" element={<HouseDetail />} />
        <Route path="/add-listing" element={<AddListing />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/edit-listing/:id" element={<EditListing />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />
        {/* <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        /> */}
      </Routes>
    </Router>
  )
}

export default App
