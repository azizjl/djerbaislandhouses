import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const Auth = () => {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const mode = searchParams.get('mode')
  
  const [isLogin, setIsLogin] = useState(mode !== 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Don't redirect if we're in update-password mode
          if (mode !== 'update-password') {
            handleRedirect()
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate, mode])

  const handleRedirect = () => {
    if (redirect === 'back') {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B4965] via-[#62B6CB] to-[#BEE9E8]"></div>
        </div>
        <div className="relative z-20 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <img 
              src="/logo.svg" 
              alt="DjerbaIsland Houses" 
              className="h-16 w-auto animate-pulse"
            />
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=update-password`,
        })
        if (error) throw error
        toast.success('Password reset instructions sent to your email!')
        setIsResetPassword(false)
      } else if (mode === 'update-password') {
        const { error } = await supabase.auth.updateUser({ 
          password: password 
        })
        if (error) throw error
        toast.success('Password updated successfully!')
        navigate('/auth?mode=login')
      } else if (!isLogin) {
        // Additional signup validations
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long')
        }

        // 1. Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password,
        })

        if (authError) throw authError

        // 2. Update the profile record instead of inserting
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              full_name: name,
              email: email,
              role: 'user', // default role
              avatar_url: null,
              phone_number: null,
              address: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', authData.user.id)

          if (profileError) throw profileError
        }

        toast.success('Please check your email to verify your account!')
        handleRedirect()

      } else {
        // Handle login
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Logged in successfully!')
        handleRedirect()
      }
      
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setPassword('')
    setConfirmPassword('')
    setName('')
    
    const newMode = isLogin ? 'signup' : 'login'
    const searchParams = new URLSearchParams()
    if (redirect) searchParams.set('redirect', redirect)
    searchParams.set('mode', newMode)
    navigate(`/auth?${searchParams.toString()}`)
  }

  const toggleResetPassword = () => {
    setIsResetPassword(!isResetPassword)
    setPassword('')
    setConfirmPassword('')
    setName('')
  }

  const renderForm = () => {
    if (mode === 'update-password') {
      return (
        <div className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent transition-all duration-300"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent transition-all duration-300"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        {!isLogin && !isResetPassword && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required={!isLogin}
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent transition-all duration-300"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent transition-all duration-300"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {!isResetPassword && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent transition-all duration-300"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        {!isLogin && !isResetPassword && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required={!isLogin}
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent transition-all duration-300"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4965] via-[#62B6CB] to-[#BEE9E8]"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-20 flex items-center justify-center min-h-screen py-12 px-4">
        <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <Link to="/" className="mb-6">
              <img 
                src="/logo.svg" 
                alt="DjerbaIsland Houses" 
                className="h-16 w-auto"
              />
            </Link>
            <h2 className="text-4xl text-center font-bold text-[#1B4965] mb-2">
              {isLogin ? 'Welcome Back' : 'Join Us'}
            </h2>
            <p className="text-center text-gray-600 text-lg">
              {isLogin ? 'Sign in to your account' : 'Create your new account'}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {renderForm()}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-[#1B4965] hover:bg-[#62B6CB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#62B6CB] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : mode === 'update-password' ? 'Update Password' : (
                  isResetPassword ? 'Send Reset Instructions' : (isLogin ? 'Sign in' : 'Create account')
                )}
              </button>
            </div>
          </form>

          <div className="text-center space-y-2">
            {!isResetPassword && (
              <button
                onClick={toggleAuthMode}
                className="text-[#1B4965] hover:text-[#62B6CB] transition-colors duration-300"
              >
                {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            )}
            
            {isLogin && !isResetPassword && (
              <div>
                <button
                  onClick={toggleResetPassword}
                  className="text-[#1B4965] hover:text-[#62B6CB] transition-colors duration-300"
                >
                  Forgot your password?
                </button>
              </div>
            )}
            
            {isResetPassword && (
              <button
                onClick={toggleResetPassword}
                className="text-[#1B4965] hover:text-[#62B6CB] transition-colors duration-300"
              >
                Back to login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth 