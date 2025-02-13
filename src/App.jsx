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
import { useEffect } from 'react'

// const ProtectedRoute = ({ children }) => {
//   const { role, loading } = useUserRole();

//   if (loading) return <p>Loading...</p>; // Wait for role check

//   return role === "admin" ? children : <Navigate to="/" />;
// };




function App() {

  const { role } = useUserRole()
const { setRole } = useAuthStore()
useEffect(() => {
  console.log("role in APP", role);
  setRole(role)
}, [role])


  return (
    <Router>
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
